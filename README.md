# 🎟️ CrowdPass Solana

CrowdPass es una plataforma descentralizada de crowdfunding web3 construida sobre la blockchain de Solana. Utiliza el poder de los **Solana Actions & Blinks** para permitir a los creadores lanzar campañas, y a los usuarios apoyarlas o comprar boletos directamente desde cualquier lugar —incluyendo redes sociales como X (Twitter)— sin tener que salir de la aplicación.

---

## 🚀 Proyecto en Vivo

- **Aplicación Frontend:** [https://crowdpass-solana.vercel.app](https://crowdpass-solana.vercel.app)
- **Ejemplo en Blink:** Pega el siguiente enlace en [Dial.to](https://dial.to) o X (Twitter):
  `https://crowdpass-solana.vercel.app/api/actions/campaign/TU_BILLETERA_AQUI_EL_ID_DE_TU_EVENTO`

---

## 🎨 Mockups e Interface

Los diseños iniciales y los prototipos de los estados (UI y los diferentes estados del Blink) los puedes encontrar en nuestra carpeta de mockups local:

- 📊 **Vista principal Frontend:** [`/frontend/public/mockups/mockup-02-dashboard.html`](frontend/public/mockups/mockup-02-dashboard.html)
- 🔗 **Estados Dinámicos del Blink (Activo, Financiado, etc.):** [`/frontend/public/mockups/mockup-03-blink-states.html`](frontend/public/mockups/mockup-03-blink-states.html)
- 🗂️ **Índice de Mockups:** [`/frontend/public/mockups/mockups-index.html`](frontend/public/mockups/mockups-index.html)

> *Tip: Simplemente haz doble clic o abre cualquiera de estos archivos HTML en tu navegador web para inspeccionar cómo está diseñada el UI sin necesidad de encender la aplicación.*

---

## 🏗️ Arquitectura y Tecnologías

- **Blockchain:** Solana (Red Devnet)
- **Smart Contract (Contrato Inteligente):** Rust + Framework Anchor (`/backend`)
- **Frontend / Cliente:** Next.js 14 (App Router) + React + Tailwind CSS (`/frontend`)
- **Conexión de Billeteras:** `@solana/wallet-adapter-react`
- **Actions/Blinks:** API nativa siguiendo la especificación de `@solana/actions` para la construcción dinámica de transacciones y meta-datos on-chain.

---

## 💻 Configuración Local (Para Desarrolladores)

Si alguien más quiere descargar (clonar) este repositorio y probarlo en su computadora, deberá cumplir con algunos **requisitos previos e instalaciones obligatorias** detalladas a continuación:

### 📥 1. Requisitos Previos (Herramientas necesarias)
Asegúrate de instalar los siguientes programas antes de empezar:

1. **Node.js y npm** (v18 o superior): [Descargar Node.js](https://nodejs.org/es)
2. **Rust y Cargo:** [Guía para instalar Rust](https://www.rust-lang.org/tools/install)
3. **Solana CLI:** Herramientas de terminal de la blockchain. [Ver guía oficial de Solana](https://docs.solanalabs.com/cli/install)
4. **Anchor CLI:** Framework de desarrollo en Solana. [Instalación de Anchor](https://www.anchor-lang.com/docs/installation)

*(⚠️ **Nota:** Si usas Linux o Mac, puedes ejecutar nuestro script automatizado `bash local-setup.sh` ubicado en la raíz del proyecto para que instale todo esto por ti).*

### 📦 2. Poner en Marcha el Smart Contract (Backend)

Una vez que tengas Solana CLI y Anchor instalados:

```bash
cd backend
npm install
anchor build
anchor keys sync
anchor deploy
```

> *Después de desplegar, Anchor te devolverá un nuevo "Program ID". Asegúrate de copiarlo y actualizar los archivos `Anchor.toml`, `programs/crowd_pass/src/lib.rs` (en el declare_id) y tu variable de entorno en el Frontend con este nuevo identificador.*

### 🖥️ 3. Poner en Marcha el Frontend

Abre otra terminal y ejecuta:

```bash
cd frontend
npm install
```

Copia `frontend/.env.example` a `frontend/.env.local` y ajusta tu configuración:
```env
# Opcional si vas a usar el Program ID demo que ya viene como fallback en el codigo.
# NEXT_PUBLIC_PROGRAM_ID=EL_PROGRAM_ID_QUE_TE_DIO_ANCHOR
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Si vas a probar Blinks fuera de localhost (por ejemplo en Codespaces o con un dominio público), cambia `NEXT_PUBLIC_BASE_URL` y `NEXT_PUBLIC_APP_URL` por esa URL pública. Si desplegaste tu propio contrato, define también `NEXT_PUBLIC_PROGRAM_ID`.

Por último, arranca la aplicación:

```bash
npm run dev
```

Visita [http://localhost:3000](http://localhost:3000) en tu navegador y verás la DApp lista para ser usada.

---

## 📖 Principales Funcionalidades

1. **Creación de Campañas On-Chain:** Cualquier persona puede registrar un evento, especificar una meta en SOL, ofrecer boletos y elegir un límite.
2. **Estado Inmutable (PDAs de Solana):** Los datos (total ganado, boletos vendidos, título de la campaña) siempre residen en la red segura de Solana Devnet.
3. **Blinks Dinámicos (Solana Actions):**
   - El backend en Next.js lee la blockchain y actualiza el Blink en **tiempo real** para mostrar barras de progreso y cálculos exactos.
   - Si un evento se acaba o llega a su límite, los botones del Blink se deshabilitan por sí solos protegiendo a los usuarios.

---

## 🤝 Contribuciones
¡Toda aportación es bienvenida! Si encuentras algún bug, abre un "Issue" en el repositorio.

---
*Hecho para el ecosistema global de constructores y hackers de Solana!*
