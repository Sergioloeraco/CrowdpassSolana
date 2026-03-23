#!/usr/bin/env bash
set -e

echo "========================================"
echo "CrowdPass — Setup Codespaces"
echo "========================================"

# No necesitamos verificar el OS ni instalar dependencias del sistema
# porque el devcontainer.json ya usa la imagen base con Rust y Node

# ========================================
# 1. SOLANA CLI
# ========================================

echo "--- Instalando Solana CLI ---"

if ! command -v solana &> /dev/null; then
    curl --proto '=https' --tlsv1.2 -sSfL https://solana-install.solana.workers.dev | bash
    export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
    echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc
    echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.zshrc
else
    echo "Solana CLI ya instalado: $(solana --version)"
fi

export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
solana --version

# ========================================
# 2. ANCHOR CLI
# ========================================

echo "--- Instalando Anchor CLI ---"

if ! command -v anchor &> /dev/null; then
    cargo install --git https://github.com/coral-xyz/anchor avm --force
    avm install 0.29.0
    avm use 0.29.0
else
    echo "Anchor ya instalado: $(anchor --version)"
fi

# ========================================
# 3. SPL TOKEN
# ========================================

echo "--- Instalando spl-token ---"

if ! command -v spl-token &> /dev/null; then
    cargo install spl-token-cli
else
    echo "spl-token ya instalado"
fi

# ========================================
# 4. SURFPOOL
# ========================================

echo "--- Instalando surfpool ---"

if ! command -v surfpool &> /dev/null; then
    cargo install surfpool
else
    echo "surfpool ya instalado"
fi

# ========================================
# 5. YARN
# ========================================

echo "--- Instalando Yarn ---"

if ! command -v yarn &> /dev/null; then
    npm install -g yarn
else
    echo "Yarn ya instalado: $(yarn --version)"
fi

# ========================================
# 6. CONFIGURACIÓN DE SOLANA
# ========================================

echo "--- Configurando Solana (devnet) ---"

solana config set --url https://api.devnet.solana.com

if [ ! -f ~/.config/solana/id.json ]; then
    echo "========================================"
    echo "========== Creando wallet =============="
    echo "========================================"
    solana-keygen new --no-bip39-passphrase --outfile ~/.config/solana/id.json
else
    echo "Wallet ya existe"
fi

# ========================================
# 7. DEPENDENCIAS DEL FRONTEND
# ========================================

echo "--- Instalando dependencias del frontend ---"

cd frontend
npm install
cd ..

# ========================================
# 8. BUILD DEL BACKEND
# ========================================

echo "--- Build inicial del smart contract ---"

cd backend
anchor build || echo "anchor build falló — actualiza el Program ID en lib.rs y Anchor.toml"
cd ..

# ========================================
# 9. CREAR .env.local AUTOMÁTICAMENTE
# ========================================

echo "--- Configurando variables de entorno ---"

if [ ! -f frontend/.env.local ]; then
    cp frontend/.env.example frontend/.env.local

    # Detectar la URL del Codespace automáticamente
    CODESPACE_URL="https://${CODESPACE_NAME}-3000.app.github.dev"
    sed -i "s|NEXT_PUBLIC_BASE_URL=.*|NEXT_PUBLIC_BASE_URL=${CODESPACE_URL}|" frontend/.env.local

    echo ".env.local creado con URL del Codespace: ${CODESPACE_URL}"
else
    echo ".env.local ya existe"
fi

echo "========================================"
echo "Entorno CrowdPass listo!!!"
echo "========================================"
echo ""
echo "Tu wallet Solana: $(solana address)"
echo ""
echo "Próximos pasos:"
echo ""
echo "  1. Exportar PATH (importante!):"
echo '     export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"'
echo ""
echo "  2. Desplegar el smart contract:"
echo "     cd backend && anchor deploy"
echo "     # Copia el Program ID que aparece"
echo ""
echo "  3. Actualizar el Program ID en:"
echo "     → frontend/.env.local"
echo "     → backend/programs/crowd_pass/src/lib.rs  (declare_id!)"
echo "     → backend/Anchor.toml"
echo ""
echo "  4. Correr el frontend:"
echo "     cd frontend && npm run dev"
echo "     → Puerto 3000 se abre automáticamente"
echo ""
echo "  5. Probar el Blink en:"
echo "     https://www.blinks.xyz/inspector"
