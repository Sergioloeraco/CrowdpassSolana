#!/usr/bin/env bash
set -e

echo "========================================"
echo "CrowdPass — Setup Local (Linux/Mac)"
echo "========================================"

# Verificar si estamos en Linux/Mac
if [[ "$OSTYPE" != "linux-gnu"* && "$OSTYPE" != "darwin"* ]]; then
    echo " Este script está diseñado para Linux/Mac."
    echo "    Para Windows usa WSL2 o GitHub Codespaces."
    exit 1
fi

# ========================================
# 1. DEPENDENCIAS DEL SISTEMA
# ========================================

echo "--- Instalando dependencias del sistema ---"

if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if command -v apt-get &> /dev/null; then
        sudo apt-get update && \
        sudo apt-get install -y --no-install-recommends \
            ca-certificates curl git \
            build-essential pkg-config \
            libssl-dev libudev-dev tini
    elif command -v yum &> /dev/null; then
        sudo yum install -y \
            ca-certificates curl git gcc gcc-c++ make \
            pkgconfig openssl-devel libudev-devel
    elif command -v pacman &> /dev/null; then
        sudo pacman -Sy --noconfirm \
            ca-certificates curl git base-devel \
            pkgconf openssl systemd-libs
    else
        echo " Instala manualmente: curl, git, build-essential, libssl-dev"
    fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
    if ! command -v brew &> /dev/null; then
        echo " Instalando Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi
    brew install curl git openssl pkg-config
fi

# ========================================
# 2. RUST
# ========================================

echo "--- Instalando Rust ---"

if ! command -v rustc &> /dev/null; then
    curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh -s -- -y
    source "$HOME/.cargo/env"
else
    echo "Rust ya instalado: $(rustc --version)"
fi

source "$HOME/.cargo/env"

# ========================================
# 3. SOLANA CLI
# ========================================

echo "--- Instalando Solana CLI ---"

if ! command -v solana &> /dev/null; then
    curl --proto '=https' --tlsv1.2 -sSfL https://solana-install.solana.workers.dev | bash
    export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
    echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc
    echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.profile
else
    echo "Solana CLI ya instalado: $(solana --version)"
fi

export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# ========================================
# 4. ANCHOR CLI
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
# 5. SPL TOKEN
# ========================================

echo "--- Instalando spl-token ---"

if ! command -v spl-token &> /dev/null; then
    cargo install spl-token-cli
else
    echo "spl-token ya instalado"
fi

# ========================================
# 6. SURFPOOL
# ========================================

echo "--- Instalando surfpool ---"

if ! command -v surfpool &> /dev/null; then
    cargo install surfpool
else
    echo "surfpool ya instalado"
fi

# ========================================
# 7. NODE.JS (NVM)
# ========================================

echo "--- Instalando Node.js ---"

if ! command -v nvm &> /dev/null; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    if ! grep -q "NVM_DIR" ~/.bashrc; then
        echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.bashrc
        echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.bashrc
    fi
else
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    echo "NVM ya instalado"
fi

if ! command -v node &> /dev/null; then
    nvm install --lts
    nvm use --lts
else
    echo "Node.js ya instalado: $(node --version)"
fi

# ========================================
# 8. YARN
# ========================================

echo "--- Instalando Yarn ---"

if ! command -v yarn &> /dev/null; then
    npm install -g yarn
else
    echo "Yarn ya instalado: $(yarn --version)"
fi

# ========================================
# 9. CONFIGURACIÓN DE SOLANA
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
# 10. DEPENDENCIAS DEL FRONTEND
# ========================================

echo "--- Instalando dependencias del frontend ---"

cd frontend
npm install
cd ..

# ========================================
# 11. BUILD DEL BACKEND
# ========================================

echo "--- Build inicial del smart contract ---"

cd backend
anchor build || echo " anchor build falló — actualiza el Program ID en lib.rs y Anchor.toml"
cd ..

echo "========================================"
echo "Entorno CrowdPass listo!!!"
echo "========================================"
echo ""
echo "Tu wallet Solana: $(solana address)"
echo ""
echo "Próximos pasos:"
echo ""
echo "  1. Exportar PATH y NVM (importante!):"
echo '     source ~/.bashrc  (o ~/.profile)'
echo ""
echo "  2. Desplegar el smart contract:"
echo "     cd backend && anchor deploy"
echo "     # Copia el Program ID que aparece"
echo ""
echo "  3. Actualizar el Program ID en:"
echo "     → frontend/.env"
echo "     → backend/programs/crowd_pass/src/lib.rs  (declare_id!)"
echo "     → backend/Anchor.toml"
echo ""
echo "  4. Correr el frontend:"
echo "     cd frontend && npm run dev"
echo ""
echo "  5. Probar el Blink en:"
echo "     https://www.blinks.xyz/inspector"