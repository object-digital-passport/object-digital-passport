#!/usr/bin/env bash
# Object Digital Passport — deploy ObjectDigitalPassport + satellites (Hardhat 3)
#
# Prerequisites:
#   cp user-setup/private.local.env.example user-setup/private.local.env
#   # edit user-setup/private.local.env — set PRIVATE_KEY (64 hex, no 0x)
#
# Usage (from repo root or from deploy/):
#   ./deploy/deploy.sh           # Polygon Amoy testnet (default)
#   ./deploy/deploy.sh amoy
#   ./deploy/deploy.sh polygon   # Polygon PoS mainnet
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

NETWORK="${1:-amoy}"
case "$NETWORK" in
  amoy|polygon) ;;
  -h|--help)
    echo "Usage: $0 [amoy|polygon]"
    echo "  amoy     — Polygon Amoy testnet (default)"
    echo "  polygon  — Polygon PoS mainnet"
    exit 0
    ;;
  *)
    echo "Error: unknown network '$NETWORK'. Use: amoy | polygon" >&2
    exit 1
    ;;
esac

if [[ ! -f "$SCRIPT_DIR/user-setup/private.local.env" && ! -f "$SCRIPT_DIR/.env" ]]; then
  echo "Error: no deploy env file. Create one of:" >&2
  echo "  deploy/user-setup/private.local.env  (recommended: cp deploy/user-setup/private.local.env.example)" >&2
  echo "  or deploy/.env with PRIVATE_KEY (see deploy/user-setup/README.md)" >&2
  exit 1
fi

cd "$REPO_ROOT"

if [[ ! -d node_modules ]]; then
  echo "Installing npm dependencies at repo root..."
  npm install
fi

echo "Compiling contracts..."
npm run compile

echo "Deploying to network: $NETWORK"
npx hardhat run deploy/scripts/deploy.js --network "$NETWORK"

echo "Done. Addresses and abi: deploy/deployments/"
