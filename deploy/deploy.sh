#!/usr/bin/env bash
# Object Digital Passport — deploy ObjectDigitalPassport + satellites (Hardhat)
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
cd "$SCRIPT_DIR"

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

if [[ ! -f "user-setup/private.local.env" && ! -f ".env" ]]; then
  echo "Error: no deploy env file. Create one of:" >&2
  echo "  user-setup/private.local.env  (recommended: cp user-setup/private.local.env.example)" >&2
  echo "  or deploy/.env with PRIVATE_KEY (see user-setup/README.md)" >&2
  exit 1
fi

if [[ ! -d node_modules ]]; then
  echo "Installing npm dependencies in deploy/..."
  npm install
fi

echo "Compiling contracts..."
npx hardhat compile

echo "Deploying to network: $NETWORK"
npx hardhat run scripts/deploy.js --network "$NETWORK"

echo "Done. Addresses and abi: deploy/deployments/"
