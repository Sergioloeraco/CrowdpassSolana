// ================================================================
//  CrowdPass — Blink Endpoint (Solana Action)
//  /frontend/app/api/actions/campaign/[id]/route.ts
//
//  Implementa la especificación completa de Solana Actions:
//    GET  → metadata enriquecida (título, icono dinámico, botones)
//    POST → construye y devuelve la transacción serializada
//
//  El `id` del segmento dinámico tiene el formato:
//    "<authorityBase58>_<eventId>"
//  Ej: "3s1VN...sMD_hackathon-2026"
//
//  Spec: https://solana.com/developers/guides/advanced/actions
// ================================================================

import { NextResponse }                                from "next/server";
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { BN }                                          from "@coral-xyz/anchor";
import {
  getProgram,
  getConnection,
  findCampaignPda,
  getBaseUrl,
} from "../../../../../lib/program";

// ── Cabeceras CORS — obligatorias para todos los endpoints de Actions ──
const ACTIONS_CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
};

interface RouteParams {
  params: { id: string };
}

// ================================================================
//  OPTIONS — preflight CORS (requerido por la spec)
// ================================================================
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: ACTIONS_CORS_HEADERS,
  });
}

// ================================================================
//  GET — Metadata del Blink
//  Retorna: título, descripción, icono dinámico y botones de acción.
//  Los clientes (wallets, X/Twitter) usan esto para renderizar la UI.
// ================================================================
export async function GET(_req: Request, { params }: RouteParams) {
  const { authority, eventId, error } = parseId(params.id);

  if (error || !authority || !eventId) {
    return NextResponse.json(
      { message: "ID de campaña inválido. Usa el formato: <authority>_<eventId>" },
      { status: 400, headers: ACTIONS_CORS_HEADERS }
    );
  }

  try {
    // ── Leer estado on-chain ────────────────────────────────────
    const [pda]   = findCampaignPda(authority, eventId);
    const program = getProgram();
    const state   = await (program.account as any).campaignState.fetch(pda);

    const isTicketMode  = state.ticketPrice.toNumber() > 0;
    const ticketPriceSol = state.ticketPrice.toNumber() / LAMPORTS_PER_SOL;
    const goalSol        = state.fundingGoal.toNumber() / LAMPORTS_PER_SOL;
    const currentSol     = state.currentFunding.toNumber() / LAMPORTS_PER_SOL;
    const progressPct    = Math.min(Math.round((currentSol / goalSol) * 100), 100);
    const baseUrl        = getBaseUrl();

    // ── Construir botones según modo y estado ───────────────────
    const actions = buildActions(
      state.isActive,
      isTicketMode,
      ticketPriceSol,
      params.id,
      baseUrl
    );

    // ── Respuesta GET (ActionGetResponse) ──────────────────────
    return NextResponse.json(
      {
        type:        "action",
        icon:        `${baseUrl}/api/actions/campaign/${params.id}/image`,
        title:       state.title,
        description: `${state.description}\n\n` +
                     `📊 Progreso: ${currentSol.toFixed(2)} / ${goalSol.toFixed(2)} SOL (${progressPct}%)\n` +
                     `${isTicketMode
                       ? `🎟️ Boletos: ${state.ticketsSold.toNumber()} / ${state.maxTickets.toNumber()}`
                       : `💜 Donaciones aceptadas: monto libre`}`,
        label:       state.isActive
                       ? (isTicketMode ? `Comprar por ${ticketPriceSol} SOL` : "Apoyar campaña")
                       : "Campaña cerrada",
        // Deshabilitar si la campaña ya no está activa
        disabled:    !state.isActive,
        error:       !state.isActive
                       ? { message: "Esta campaña ya alcanzó su meta o fue cerrada por el organizador." }
                       : undefined,
        links:       { actions },
      },
      { headers: ACTIONS_CORS_HEADERS }
    );

  } catch (err) {
    console.error("[CrowdPass GET]", err);
    return NextResponse.json(
      {
        type:        "action",
        icon:        `${getBaseUrl()}/crowdpass-fallback.svg`,
        title:       "CrowdPass",
        description: "No se encontró esta campaña o aún no ha sido desplegada.",
        label:       "Campaña no disponible",
        disabled:    true,
        error:       { message: "Campaña no encontrada en la blockchain." },
      },
      { status: 200, headers: ACTIONS_CORS_HEADERS }
    );
  }
}

// ================================================================
//  POST — Construir la Transacción
//  El cliente (wallet/Blink) envía la pubkey del supporter.
//  El servidor devuelve la transacción serializada para que
//  el usuario la firme con su wallet.
// ================================================================
export async function POST(req: Request, { params }: RouteParams) {
  const { authority, eventId, error } = parseId(params.id);

  if (error || !authority || !eventId) {
    return NextResponse.json(
      { message: "ID de campaña inválido." },
      { status: 400, headers: ACTIONS_CORS_HEADERS }
    );
  }

  // ── 1. Leer pubkey del supporter desde el body ───────────────
  let supporterPubkey: PublicKey;
  try {
    const body = await req.json();
    supporterPubkey = new PublicKey(body.account);
  } catch {
    return NextResponse.json(
      { message: "Body inválido. Se requiere { account: '<pubkey>' }" },
      { status: 400, headers: ACTIONS_CORS_HEADERS }
    );
  }

  // ── 2. Leer la URL completa para extraer query params (amount) ─
  const url        = new URL(req.url);
  const amountParam = url.searchParams.get("amount");

  try {
    // ── 3. Leer estado on-chain ──────────────────────────────────
    const [pda]      = findCampaignPda(authority, eventId);
    const program    = getProgram();
    const connection = getConnection();
    const state      = await (program.account as any).campaignState.fetch(pda);

    // ── 4. Validaciones básicas antes de construir la tx ────────
    if (!state.isActive) {
      return NextResponse.json(
        { message: "Esta campaña ya no está activa." },
        { status: 400, headers: ACTIONS_CORS_HEADERS }
      );
    }

    if (state.ticketsSold.toNumber() >= state.maxTickets.toNumber()) {
      return NextResponse.json(
        { message: "Sold out: todos los boletos han sido vendidos." },
        { status: 400, headers: ACTIONS_CORS_HEADERS }
      );
    }

    // ── 5. Determinar el monto a pagar ───────────────────────────
    let amountLamports: BN;
    const isTicketMode = state.ticketPrice.toNumber() > 0;

    if (isTicketMode) {
      // Modo ticket: siempre el precio fijo, ignorar query param
      amountLamports = state.ticketPrice;
    } else {
      // Modo donación: usar el query param "amount" (en SOL)
      const amountSol = parseFloat(amountParam ?? "0.1");
      if (isNaN(amountSol) || amountSol <= 0) {
        return NextResponse.json(
          { message: "Monto de donación inválido. Usa ?amount=0.1 (en SOL)." },
          { status: 400, headers: ACTIONS_CORS_HEADERS }
        );
      }
      amountLamports = new BN(Math.round(amountSol * LAMPORTS_PER_SOL));
    }

    // ── 6. Construir la instrucción Anchor ───────────────────────
    //  Usamos `instruction()` en lugar de `rpc()` para no firmar
    //  en el servidor — el cliente firma con su propia wallet.
    const instruction = await (program.methods as any)
      .supportCampaign(amountLamports)
      .accounts({
        campaign:      pda,
        supporter:     supporterPubkey,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    // ── 7. Armar la transacción con blockhash reciente ───────────
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash("confirmed");

    const transaction = new Transaction({
      feePayer:            supporterPubkey,
      blockhash,
      lastValidBlockHeight,
    }).add(instruction);

    // ── 8. Serializar (sin firmar — el usuario firma en su wallet) ─
    const serializedTx = transaction
      .serialize({ requireAllSignatures: false, verifySignatures: false })
      .toString("base64");

    // ── 9. Construir mensaje de éxito dinámico ───────────────────
    const successMessage = isTicketMode
      ? `🎟️ ¡Boleto comprado! Tu entrada para "${state.title}" está confirmada on-chain.`
      : `💜 ¡Gracias por apoyar "${state.title}"! Tu donación fue registrada en Solana.`;

    // ── 10. Retornar POST response (ActionPostResponse) ──────────
    return NextResponse.json(
      {
        transaction: serializedTx,
        message:     successMessage,
        // Action chaining: mostrar estado actualizado tras confirmar
        links: {
          next: {
            type: "inline",
            action: {
              type:        "completed",
              icon:        `${getBaseUrl()}/api/actions/campaign/${params.id}/image`,
              title:       `✅ ${isTicketMode ? "Boleto confirmado" : "Donación confirmada"}`,
              description: successMessage,
              label:       "Ver en Explorer",
            },
          },
        },
      },
      { headers: ACTIONS_CORS_HEADERS }
    );

  } catch (err) {
    console.error("[CrowdPass POST]", err);
    return NextResponse.json(
      { message: "Error al construir la transacción. Intenta de nuevo." },
      { status: 500, headers: ACTIONS_CORS_HEADERS }
    );
  }
}

// ================================================================
//  HELPERS INTERNOS
// ================================================================

/** Parsea el segmento dinámico "<authorityBase58>_<eventId>" */
function parseId(id: string): {
  authority?: PublicKey;
  eventId?: string;
  error?: string;
} {
  try {
    const firstUnderscore = id.indexOf("_");
    if (firstUnderscore === -1) return { error: "Formato inválido" };

    const authorityStr = id.slice(0, firstUnderscore);
    const eventId      = id.slice(firstUnderscore + 1);

    if (!authorityStr || !eventId) return { error: "Campos vacíos" };

    const authority = new PublicKey(authorityStr);
    return { authority, eventId };
  } catch {
    return { error: "Pubkey inválida" };
  }
}

/** Construye el array de LinkedActions según el estado de la campaña */
function buildActions(
  isActive: boolean,
  isTicketMode: boolean,
  ticketPriceSol: number,
  id: string,
  baseUrl: string
) {
  if (!isActive) {
    return [
      {
        type: "external-link",
        label: "Ver en Explorer",
        href: `https://explorer.solana.com/address/${id.split("_")[0]}?cluster=devnet`,
      },
    ];
  }

  if (isTicketMode) {
    // Un solo botón con precio fijo
    return [
      {
        type:  "transaction",
        label: `🎟️ Comprar boleto — ${ticketPriceSol} SOL`,
        href:  `${baseUrl}/api/actions/campaign/${id}`,
      },
    ];
  }

  // Modo donación: 3 montos predefinidos + campo libre
  return [
    {
      type:  "transaction",
      label: "💜 Donar 0.05 SOL",
      href:  `${baseUrl}/api/actions/campaign/${id}?amount=0.05`,
    },
    {
      type:  "transaction",
      label: "💜 Donar 0.1 SOL",
      href:  `${baseUrl}/api/actions/campaign/${id}?amount=0.1`,
    },
    {
      type:  "transaction",
      label: "💜 Donar 0.5 SOL",
      href:  `${baseUrl}/api/actions/campaign/${id}?amount=0.5`,
    },
    {
      type:  "transaction",
      label: "Donación personalizada",
      href:  `${baseUrl}/api/actions/campaign/${id}?amount={amount}`,
      parameters: [
        {
          name:    "amount",
          label:   "Cantidad en SOL (ej: 0.25)",
          required: true,
        },
      ],
    },
  ];
}