# 🎟️ CrowdPass Solana

CrowdPass is a decentralized Web3 crowdfunding and ticketing platform built on Solana. It leverages **Solana Actions & Blinks** to allow creators to launch campaigns and users to support them or buy tickets directly from anywhere—including social media feeds like X (Twitter)—without leaving the app.

---

## 🚀 Live Demo

- **Frontend App:** [https://crowdpass-solana.vercel.app](https://crowdpass-solana.vercel.app)
- **Blink Example:** Paste this on [Dial.to](https://dial.to) or X (Twitter):  
  `https://crowdpass-solana.vercel.app/api/actions/campaign/YOUR_WALLET_ID_YOUR_EVENT_ID`

---

## 🎨 Mockups & UI States

The initial UI designs, prototypes, and Blink states can be explored through our local mockups. These cover the dashboard logic and the various dynamic states of the Blinks:

- 📊 **Main Dashboard Preview:** [`/frontend/public/mockups/mockup-02-dashboard.html`](frontend/public/mockups/mockup-02-dashboard.html)
- 🔗 **Blink States (Active, Funded, Invalid):** [`/frontend/public/mockups/mockup-03-blink-states.html`](frontend/public/mockups/mockup-03-blink-states.html)
- 🗂️ **Mockups Index:** [`/frontend/public/mockups/mockups-index.html`](frontend/public/mockups/mockups-index.html)

> *Tip: You can open these HTML files directly in your browser to inspect the visual logic used to build our React components.*

---

## 🏗️ Architecture & Tech Stack

- **Blockchain:** Solana (Devnet)
- **Smart Contract (Program):** Rust + Anchor framework (`/backend`)
- **Frontend / Client:** Next.js 14 (App Router) + React + Tailwind CSS (`/frontend`)
- **Wallets:** `@solana/wallet-adapter-react`
- **Actions/Blinks:** `@solana/actions` compliant API returning fully dynamic transactional metadata.

---

## 💻 Getting Started (Local Development)

### Prerequisites
- Node.js & npm
- Rust & Cargo
- Solana CLI
- Anchor CLI

### 1. Setup Smart Contract (Backend)

```bash
cd backend
anchor build
anchor keys sync
anchor deploy
```

*Update your `Anchor.toml` and frontend `idl` files with the new Program ID generated after deployment.*

### 2. Setup Frontend Workspace 

```bash
cd frontend
npm install
```

Create a `.env.local` file with the following:
```env
NEXT_PUBLIC_PROGRAM_ID=your_deployed_program_id
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 3. Run the App

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the dApp in action.

---

## 📖 Feature Highlights

1. **Campaign Creation:** Anyone can initialize a campaign specifying funding goals, ticket prices, and event limits.
2. **On-Chain State:** All data is kept transparently on Solana using PDAs, making it practically immutable.
3. **Dynamic Actions (Blinks):** 
   - A single Next.js Route dynamically intercepts the blockchain data, calculating real-time goals.
   - Outputs an interactive Blink that adapts if a campaign reaches its goal, displaying disabled/sold-out states cleanly.

---

## 🤝 Contributing
Pull requests are welcome! Feel free to leave issues or feature requests.

---
*Built for the global Solana Hacker community!*
