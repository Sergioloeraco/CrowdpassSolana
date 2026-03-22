"use client";

import { useState, useEffect, useMemo } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { BN, Program, AnchorProvider } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { IDL, CrowdPass, parseCampaignState, parseCrowdPassError } from "../lib/idl";

const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ?? "4RfgHgQRwssnJuzShFwmZVEw7DjNJj5TFPLjFJWJ8MT"
);

export default function Dashboard() {
  const { publicKey, signTransaction, connected } = useWallet();
  const { connection } = useConnection();

  const [form, setForm] = useState({
    eventId: "",
    title: "",
    description: "",
    mode: "ticket" as "ticket" | "donation",
    ticketPrice: "0.1",
    fundingGoal: "1",
    maxTickets: "100",
  });

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState<"idle" | "building" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [lastBlink, setLastBlink] = useState("");

  const program = useMemo(() => {
    if (!publicKey || !signTransaction) return null;
    const provider = new AnchorProvider(connection, {
      publicKey,
      signTransaction,
      signAllTransactions: async (txs) => Promise.all(txs.map(t => signTransaction(t))),
    }, { commitment: "confirmed" });
    return new Program<CrowdPass>(IDL, provider);
  }, [connection, publicKey, signTransaction]);

  const fetchMyCampaigns = async () => {
    if (!program || !publicKey) return;
    setLoading(true);
    try {
      const accounts = await (program.account as any).campaignState.all([
        { memcmp: { offset: 8, bytes: publicKey.toBase58() } }
      ]);
      setCampaigns(accounts.map((acc: any) => parseCampaignState(acc.account as any)));
    } catch (err) {
      console.error("Error cargando campañas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (connected) fetchMyCampaigns();
    else setCampaigns([]);
  }, [connected, program]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!program || !publicKey) return;

    setTxStatus("building");
    setErrorMsg("");

    try {
      const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("campaign"), publicKey.toBuffer(), Buffer.from(form.eventId)],
        PROGRAM_ID
      );

      const existing = await connection.getAccountInfo(pda);
      if (existing) throw new Error("Ya existe una campaña con ese ID para tu wallet.");

      const price = form.mode === "ticket" ? new BN(parseFloat(form.ticketPrice) * LAMPORTS_PER_SOL) : new BN(0);
      const goal = new BN(parseFloat(form.fundingGoal) * LAMPORTS_PER_SOL);
      const max = new BN(parseInt(form.maxTickets));

      const tx = await (program.methods as any)
        .initializeCampaign(form.eventId, price, goal, max, form.title, form.description)
        .accounts({ campaign: pda, authority: publicKey, systemProgram: SystemProgram.programId })
        .rpc();

      const campaignId = `${publicKey.toBase58()}_${form.eventId}`;
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const blinkUrl = `https://dial.to/?action=solana-action:${encodeURIComponent(origin + "/api/actions/campaign/" + campaignId)}`;
      
      setLastBlink(blinkUrl);
      setTxStatus("success");
      fetchMyCampaigns();
    } catch (err) {
      setErrorMsg(parseCrowdPassError(err));
      setTxStatus("error");
    }
  }

  return (
    <div className="page-wrap">
      <header className="header">
        <div className="logo"><div className="logo-dot" /><span className="logo-text">CrowdPass</span></div>
        <WalletMultiButton />
      </header>

      {connected ? (
        <>
          <section className="card">
            <h2 className="card-title">Nueva Campaña</h2>
            <form onSubmit={handleCreate}>
              <div className="field">
                <label>ID Único (URL-friendly)</label>
                <input 
                  type="text" required placeholder="ej: mi-evento-2026"
                  value={form.eventId}
                  onChange={(e) => setForm({...form, eventId: e.target.value.toLowerCase().replace(/\s/g, "-")})}
                />
              </div>
              <div className="row-2">
                 <input type="text" placeholder="Título" onChange={(e) => setForm({...form, title: e.target.value})} />
                 <input type="number" placeholder="Meta (SOL)" onChange={(e) => setForm({...form, fundingGoal: e.target.value})} />
              </div>
              <button className="btn-primary" disabled={txStatus === "building"}>
                {txStatus === "building" ? "Firmando..." : "Crear Blink On-Chain"}
              </button>
            </form>
            {txStatus === "error" && <p className="status error">{errorMsg}</p>}
          </section>

          <section>
            <h2 className="card-title">Mis Campañas Activas</h2>
            {loading ? <p>Consultando Solana...</p> : (
              <div className="campaign-list">
                {campaigns.map((c, i) => (
                  <div key={i} className="card success-card" style={{marginBottom: '10px'}}>
                    <p><strong>{c.title}</strong> ({c.currentSol} / {c.fundingGoalSol} SOL)</p>
                    <div className="url-box" style={{fontSize: '10px'}}>{c.eventId}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      ) : (
        <div className="hero"><h1>Conecta tu wallet para empezar</h1></div>
      )}
    </div>
  );
}
