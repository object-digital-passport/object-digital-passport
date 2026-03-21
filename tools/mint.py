#!/usr/bin/env python3
"""
Object Digital Passport — Mint CLI
Specification v0.1

Usage:
    python mint.py                  # interactive mint
    python mint.py --register       # register Creator ID first
    python mint.py --check          # check your Creator ID

Requirements:
    pip install web3 qrcode[pil] pillow python-dotenv
"""

import os
import sys
import json
import hashlib
import unicodedata
import argparse
from datetime import datetime, timezone
from pathlib import Path

# ─── Dependency check ────────────────────────────────────────────────────────

def check_deps():
    missing = []
    for pkg in [("web3", "web3"), ("qrcode", "qrcode"), ("dotenv", "dotenv")]:
        try:
            __import__(pkg[1])
        except ImportError:
            missing.append(pkg[0])
    if missing:
        print(f"\n  Missing: pip install {' '.join(missing)} pillow\n")
        sys.exit(1)

check_deps()

from web3 import Web3
from dotenv import load_dotenv
import qrcode

# ─── Config ───────────────────────────────────────────────────────────────────

load_dotenv()

NETWORKS = {
    "amoy": {
        "name":     "Polygon Amoy (testnet)",
        "rpc":      "https://rpc-amoy.polygon.technology",
        "chain_id": 80002,
        "explorer": "https://amoy.polygonscan.com",
    },
    "polygon": {
        "name":     "Polygon PoS (mainnet)",
        "rpc":      "https://polygon-rpc.com",
        "chain_id": 137,
        "explorer": "https://polygonscan.com",
    },
}

CONTRACT_ABI = [
    # Protocol constants — needed to read fees before calling payable functions
    {
        "name": "REGISTER_FEE", "type": "function", "stateMutability": "view",
        "inputs": [], "outputs": [{"name": "", "type": "uint256"}],
    },
    {
        "name": "MINT_FEE", "type": "function", "stateMutability": "view",
        "inputs": [], "outputs": [{"name": "", "type": "uint256"}],
    },
    # Creator Registry
    {
        "name": "registerCreator",
        "type": "function",
        "stateMutability": "payable",
        "inputs":  [{"name": "typePrefix", "type": "bytes1"}],
        "outputs": [{"name": "creatorId",  "type": "string"}],
    },
    {
        "name": "getCreatorByWallet",
        "type": "function",
        "stateMutability": "view",
        "inputs":  [{"name": "wallet", "type": "address"}],
        "outputs": [{"name": "",       "type": "string"}],
    },
    {
        "name": "getCreator",
        "type": "function",
        "stateMutability": "view",
        "inputs":  [{"name": "creatorId", "type": "string"}],
        "outputs": [{
            "name": "", "type": "tuple",
            "components": [
                {"name": "creatorId",  "type": "string"},
                {"name": "wallet",     "type": "address"},
                {"name": "typePrefix", "type": "bytes1"},
                {"name": "timestamp",  "type": "uint256"},
            ]
        }],
    },
    # Passport — physical
    {
        "name": "mintPhysical",
        "type": "function",
        "stateMutability": "payable",
        "inputs": [
            {"name": "year",         "type": "uint32"},
            {"name": "month",        "type": "uint8"},
            {"name": "dataHash",     "type": "bytes32"},
            {"name": "dataUrl",      "type": "string"},
            {"name": "imageHash",    "type": "bytes32"},
            {"name": "imageUrl",     "type": "string"},
            {"name": "sealType",     "type": "uint8"},
            {"name": "sealHash",     "type": "bytes32"},
            {"name": "nfcPublicKey", "type": "bytes"},
            {"name": "nfcModel",     "type": "string"},
        ],
        "outputs": [{"name": "humanId", "type": "string"}],
    },
    # Passport — digital
    {
        "name": "mintDigital",
        "type": "function",
        "stateMutability": "payable",
        "inputs": [
            {"name": "year",      "type": "uint32"},
            {"name": "month",     "type": "uint8"},
            {"name": "dataHash",  "type": "bytes32"},
            {"name": "dataUrl",   "type": "string"},
            {"name": "imageHash", "type": "bytes32"},
            {"name": "imageUrl",  "type": "string"},
            {"name": "fileHash",  "type": "bytes32"},
        ],
        "outputs": [{"name": "humanId", "type": "string"}],
    },
    # Read
    {
        "name": "getPassport",
        "type": "function",
        "stateMutability": "view",
        "inputs":  [{"name": "humanId", "type": "string"}],
        "outputs": [{
            "name": "", "type": "tuple",
            "components": [
                {"name": "humanId",          "type": "string"},
                {"name": "contractVersion",  "type": "uint8"},
                {"name": "creator",          "type": "address"},
                {"name": "creatorId",        "type": "string"},
                {"name": "year",         "type": "uint32"},
                {"name": "month",        "type": "uint8"},
                {"name": "objectType",   "type": "string"},
                {"name": "dataHash",     "type": "bytes32"},
                {"name": "imageHash",    "type": "bytes32"},
                {"name": "fileHash",     "type": "bytes32"},
                {"name": "sealType",     "type": "uint8"},
                {"name": "sealHash",     "type": "bytes32"},
                {"name": "nfcPublicKey", "type": "bytes"},
                {"name": "nfcModel",     "type": "string"},
                {"name": "dataUrl",      "type": "string"},
                {"name": "imageUrl",     "type": "string"},
                {"name": "timestamp",    "type": "uint256"},
            ]
        }],
    },
]

ZERO_BYTES32 = b"\x00" * 32

# ─── Helpers ──────────────────────────────────────────────────────────────────

def sha256_file(path: str) -> bytes:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.digest()

def normalize_nfc(obj):
    """Recursively normalize all strings in a dict/list to Unicode NFC."""
    if isinstance(obj, str):
        return unicodedata.normalize("NFC", obj)
    if isinstance(obj, dict):
        return {k: normalize_nfc(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [normalize_nfc(v) for v in obj]
    return obj

def sha256_json(data: dict) -> bytes:
    """
    Canonical JSON per ODP spec:
      1. Unicode NFC normalization on all strings
      2. Keys sorted alphabetically at every level
      3. No whitespace, ensure_ascii=False
    Must match browser JS: normalize("NFC") + sortKeysDeep + JSON.stringify
    """
    normalized = normalize_nfc(data)
    minified = json.dumps(normalized, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(minified.encode("utf-8")).digest()

def sha256_obj(data: dict) -> bytes:
    """Same canonical serialization for sub-objects (e.g. seal)."""
    normalized = normalize_nfc(data)
    minified = json.dumps(normalized, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(minified.encode("utf-8")).digest()

def to_bytes32(b: bytes) -> bytes:
    return b[:32].ljust(32, b"\x00")

def prompt(label: str, default: str = "") -> str:
    suffix = f" [{default}]" if default else ""
    val = input(f"  {label}{suffix}: ").strip()
    return val if val else default

def prompt_optional(label: str) -> str:
    return input(f"  {label} (skip — Enter): ").strip()

def divider():
    print("─" * 56)

def generate_qr(human_id: str, output_path: str):
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_Q,
        box_size=10,
        border=4,
    )
    qr.add_data(f"odp://{human_id}")
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    img.save(output_path)

def connect(network_key: str, private_key: str, contract_address: str):
    net = NETWORKS[network_key]
    w3  = Web3(Web3.HTTPProvider(net["rpc"]))
    if not w3.is_connected():
        print(f"\n  ERROR: Cannot connect to {net['rpc']}")
        sys.exit(1)
    account  = w3.eth.account.from_key(private_key)
    contract = w3.eth.contract(
        address=Web3.to_checksum_address(contract_address),
        abi=CONTRACT_ABI
    )
    return w3, account, contract, net

def send_tx(w3, account, fn_call, net, value=0):
    nonce    = w3.eth.get_transaction_count(account.address)
    gas_px   = w3.eth.gas_price
    tx       = fn_call.build_transaction({
        "chainId":  net["chain_id"],
        "from":     account.address,
        "nonce":    nonce,
        "gasPrice": gas_px,
        "value":    value,
    })
    tx["gas"] = w3.eth.estimate_gas(tx)
    cost      = w3.from_wei(tx["gas"] * gas_px, "ether")
    print(f"  Estimated gas: {cost:.6f} POL")
    signed  = account.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    print(f"  Sending tx: {tx_hash.hex()}")
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
    if receipt.status != 1:
        print(f"\n  ERROR: Transaction failed")
        print(f"  {net['explorer']}/tx/{tx_hash.hex()}")
        sys.exit(1)
    print(f"  ✅ Confirmed in block {receipt.blockNumber}")
    return tx_hash

# ─── Register Creator ─────────────────────────────────────────────────────────

def cmd_register(args):
    print()
    print("  ODP — Register Creator ID")
    divider()

    network_key, private_key, contract_address = _load_config()
    w3, account, contract, net = connect(network_key, private_key, contract_address)

    # Check if already registered
    existing = contract.functions.getCreatorByWallet(account.address).call()
    if existing:
        print(f"\n  Wallet {account.address}")
        print(f"  Already registered: {existing}")
        divider()
        return

    print(f"\n  Wallet:  {account.address}")
    balance = w3.from_wei(w3.eth.get_balance(account.address), "ether")
    print(f"  Balance: {balance:.4f} POL")
    print()
    print("  Type:")
    print("    C — Creator  (individual artist, photographer, maker)")
    print("    B — Brand    (company, studio, label)")
    print("    P — Proof Institution (museum, gallery, auction house)")
    print()

    t = prompt("Type (C / B / P)", "C").strip().upper()
    if t not in ("C", "B", "P"):
        print("  Invalid type.")
        sys.exit(1)

    print()
    print(f"  Registering as type {t}...")
    # bytes1 encoding: "C"→b"C", "B"→b"B", "P"→b"P"
    type_bytes = t.encode('ascii')
    register_fee = contract.functions.REGISTER_FEE().call()
    print(f"  Fee: {w3.from_wei(register_fee, 'ether')} POL (burned)")
    tx_hash = send_tx(
        w3, account,
        contract.functions.registerCreator(type_bytes),
        net,
        value=register_fee
    )

    creator_id = contract.functions.getCreatorByWallet(account.address).call()
    print()
    print(f"  ✅ Registered successfully")
    print()
    print(f"  Creator ID (short):  {creator_id}")
    print(f"  Wallet:              {account.address}")
    print()
    print(f"  Full identity:")
    print(f"  {creator_id} / [your name] / {account.address}")
    print()
    print(f"  Publish this on your website, social media, and physical objects.")
    print(f"  {net['explorer']}/tx/{tx_hash.hex()}")
    divider()

# ─── Check Creator ID ─────────────────────────────────────────────────────────

def cmd_check(args):
    print()
    network_key, private_key, contract_address = _load_config()
    w3, account, contract, net = connect(network_key, private_key, contract_address)

    creator_id = contract.functions.getCreatorByWallet(account.address).call()
    if not creator_id:
        print(f"\n  Wallet {account.address} is not registered.")
        print(f"  Run: python mint.py --register")
    else:
        rec = contract.functions.getCreator(creator_id).call()
        print(f"\n  Creator ID:  {rec[0]}")
        raw_type = rec[2]
        # typePrefix comes back as bytes1 — decode for display
        if isinstance(raw_type, (bytes, bytearray)):
            type_str = raw_type.decode('ascii', errors='replace')
        elif isinstance(raw_type, str) and raw_type.startswith('0x'):
            type_str = bytes.fromhex(raw_type[2:]).decode('ascii', errors='replace')
        else:
            type_str = str(raw_type)
        print(f"  Type:        {type_str}")
        print(f"  Wallet:      {rec[1]}")
        registered = datetime.fromtimestamp(rec[3], tz=timezone.utc)
        print(f"  Registered:  {registered.strftime('%Y-%m-%d %H:%M UTC')}")
    print()

# ─── Mint ─────────────────────────────────────────────────────────────────────

def cmd_mint(args):
    print()
    print("  Object Digital Passport — Mint")
    divider()

    network_key, private_key, contract_address = _load_config()
    w3, account, contract, net = connect(network_key, private_key, contract_address)

    # Check Creator ID
    creator_id = contract.functions.getCreatorByWallet(account.address).call()
    if not creator_id:
        print(f"\n  ERROR: Wallet {account.address} is not registered.")
        print(f"  Run: python mint.py --register")
        sys.exit(1)

    print(f"\n  Wallet:     {account.address}")
    print(f"  Creator ID: {creator_id}")
    balance = w3.from_wei(w3.eth.get_balance(account.address), "ether")
    print(f"  Balance:    {balance:.4f} POL")

    # Object type
    print()
    print("  [1/6] Object type")
    print("    1 — Physical (artwork, merch, object)")
    print("    2 — Digital  (image, video, 3D, audio)")
    choice      = prompt("Type", "1")
    is_physical = (choice == "1")

    # Object info
    print()
    print("  [2/6] Object info")
    title     = prompt("Title")
    now       = datetime.now(timezone.utc)
    reg_year  = int(prompt("Year", str(now.year)))
    reg_month = now.month

    if is_physical:
        obj_type = prompt("Type (artwork / merch / object)", "artwork")
        medium   = prompt_optional("Medium")
        edition_n = prompt_optional("Edition number (e.g. 1)")
        edition_t = prompt_optional("Edition total (e.g. 3)")
        materials_raw = prompt_optional("Materials (comma-separated, e.g. canvas, oil paint)")
    else:
        obj_type = "digital"
        subtype  = prompt("Subtype (image / video / 3d / audio / document / other)", "image")
        fmt      = prompt_optional("Format (e.g. TIFF, ProRes, GLB)")

    data_url = prompt("URL where passport.json will be hosted")

    # Image (preview)
    print()
    print("  [3/6] Preview image (optional)")
    image_path       = prompt_optional("Path to image file")
    image_hash_bytes = ZERO_BYTES32
    image_url        = ""

    if image_path and Path(image_path).exists():
        image_hash_bytes = sha256_file(image_path)
        image_url        = prompt_optional("URL where image will be hosted")
        print(f"  Image SHA-256: {image_hash_bytes.hex()}")
    elif image_path:
        print(f"  WARNING: File not found — skipping image")
        image_path = ""

    # Digital file hash
    file_hash_bytes = ZERO_BYTES32
    if not is_physical:
        print()
        print("  [4/6] Original digital file")
        print("  IMPORTANT: Register BEFORE publishing the original file.")
        print("  After registration publish only compressed/watermarked versions.")
        file_path = prompt("Path to original file")
        if not Path(file_path).exists():
            print(f"  ERROR: File not found: {file_path}")
            sys.exit(1)
        print(f"  Computing SHA-256 (may take a moment for large files)...")
        file_hash_bytes = sha256_file(file_path)
        print(f"  File SHA-256: {file_hash_bytes.hex()}")
        file_size = Path(file_path).stat().st_size

    # Seal (physical only)
    seal_type     = 0
    seal_data     = {}
    nfc_pub_key   = b""
    nfc_model_str = ""   # "NTAG424DNA_TT" if NFC seal, "" otherwise

    if is_physical:
        print()
        print("  [4/6] Physical seal (required)")
        print("    1 — NFC crypto chip (NTAG 424 DNA) only")
        print("    2 — Numbered seal only")
        print("    3 — Both NFC + numbered seal")
        seal_choice = prompt("Seal type", "2")
        seal_type   = int(seal_choice)

        if seal_type in (1, 3):
            print()
            print("  NFC chip data (NTAG 424 DNA):")
            nfc_uid    = prompt("Chip UID (hex, e.g. 04a3f912cc8b4e)")
            nfc_key    = prompt("Chip public key (hex)")
            nfc_model  = prompt("Model (NTAG424DNA / NTAG424DNA_TT)", "NTAG424DNA_TT")
            nfc_date   = prompt("Installation date (YYYY-MM-DD)", now.strftime("%Y-%m-%d"))
            nfc_notes  = prompt_optional("Notes (location, installation method)")
            nfc_pub_key = bytes.fromhex(nfc_key.replace("0x", ""))
            nfc_model_str = nfc_model   # keep for contract call
            seal_data["nfc"] = {
                "uid":         nfc_uid,
                "publicKey":   nfc_key,
                "model":       nfc_model,
                "installedAt": nfc_date,
            }
            if nfc_notes:
                seal_data["nfc"]["notes"] = nfc_notes

        if seal_type in (2, 3):
            print()
            print("  Numbered seal data:")
            seal_number = prompt("Seal number (as printed on seal)")
            seal_type_s = prompt("Seal type (e.g. holographic sticker, wax seal)")
            seal_color  = prompt_optional("Color")
            seal_size   = prompt_optional("Size (e.g. 30x30mm)")
            seal_notes  = prompt_optional("Notes")
            seal_data["numbered"] = {
                "number": seal_number,
                "type":   seal_type_s,
            }
            if seal_color: seal_data["numbered"]["color"] = seal_color
            if seal_size:  seal_data["numbered"]["size"]  = seal_size
            if seal_notes: seal_data["numbered"]["notes"] = seal_notes

    # Build passport JSON
    print()
    print("  [5/6] Building passport...")

    creator_rec = contract.functions.getCreator(creator_id).call()
    passport = {
        "version":    "0.1",
        "humanId":    None,  # filled after mint
        "objectType": "physical" if is_physical else "digital",
        "type":       obj_type,
        "title":      title,
        "creator": {
            "name":      prompt("Creator name (for passport)"),
            "wallet":    account.address,
            "creatorId": creator_id,
        },
        "year":         reg_year,
        "month":        reg_month,
        "registeredAt": int(now.timestamp()),
    }

    if is_physical:
        if medium:    passport["medium"] = medium
        if materials_raw:
            passport["materials"] = [
                {"name": m.strip()} for m in materials_raw.split(",") if m.strip()
            ]
        if edition_n and edition_t:
            passport["edition"] = {"number": int(edition_n), "total": int(edition_t)}
        if seal_data:
            passport["seal"] = seal_data
    else:
        digital = {"subtype": subtype}
        if fmt:          digital["format"]   = fmt
        digital["fileHash"] = f"sha256:{file_hash_bytes.hex()}"
        digital["fileSize"] = file_size
        if image_path:
            digital["dataUrl"] = data_url
        passport["digital"] = digital

    if image_path:
        passport["image"] = {
            "url":  image_url,
            "hash": f"sha256:{image_hash_bytes.hex()}"
        }

    passport["custom"] = {}

    # Compute hashes
    data_hash_bytes = sha256_json(passport)

    seal_hash_bytes = ZERO_BYTES32
    if is_physical and seal_data:
        seal_hash_bytes = sha256_obj(seal_data)

    # Preview
    print()
    print("  [6/6] Preview")
    divider()
    print(f"  Title:       {title}")
    print(f"  Type:        {'physical' if is_physical else 'digital'} / {obj_type}")
    print(f"  Creator ID:  {creator_id}")
    print(f"  Year/Month:  {reg_year}-{reg_month:02d}")
    print(f"  Data URL:    {data_url}")
    print(f"  Data hash:   {data_hash_bytes.hex()}")
    if is_physical:
        print(f"  Seal type:   {seal_type}")
        print(f"  Seal hash:   {seal_hash_bytes.hex()}")
        if nfc_pub_key:
            print(f"  NFC key:     {nfc_pub_key.hex()[:32]}...")
    else:
        print(f"  File hash:   {file_hash_bytes.hex()}")
    if image_path:
        print(f"  Image hash:  {image_hash_bytes.hex()}")
    divider()

    confirm = input("  Mint? (yes/no): ").strip().lower()
    if confirm not in ("yes", "y"):
        print("  Cancelled.")
        sys.exit(0)

    # Send transaction
    print()
    print("  Minting...")

    mint_fee = contract.functions.MINT_FEE().call()

    if is_physical:
        fn = contract.functions.mintPhysical(
            reg_year,
            reg_month,
            to_bytes32(data_hash_bytes),
            data_url,
            to_bytes32(image_hash_bytes),
            image_url,
            seal_type,
            to_bytes32(seal_hash_bytes),
            nfc_pub_key,
            nfc_model_str,   # "NTAG424DNA_TT" or ""
        )
    else:
        fn = contract.functions.mintDigital(
            reg_year,
            reg_month,
            to_bytes32(data_hash_bytes),
            data_url,
            to_bytes32(image_hash_bytes),
            image_url,
            to_bytes32(file_hash_bytes),
        )

    tx_hash = send_tx(w3, account, fn, net, value=mint_fee)

    # Read back
    # We need to get the humanId from the event or by scanning creator's passports
    # For simplicity, we look it up by checking the latest passport for this wallet
    # In production SDK this would parse the transaction receipt event
    print("  Reading passport from chain...")
    passports = contract.functions.getPassportsByCreator(account.address).call() \
        if hasattr(contract.functions, 'getPassportsByCreator') else []

    # Fill humanId into passport JSON — we'll use a placeholder approach
    # The actual humanId comes from the transaction event
    # For now we save with placeholder and update after reading
    human_id = f"ODP-{reg_year}-{reg_month:02d}-PENDING"

    # Save files
    output_dir = Path("passports")
    output_dir.mkdir(exist_ok=True)

    # Save passport JSON with tx hash as reference until humanId confirmed
    passport["_txHash"] = tx_hash.hex()
    passport_path = output_dir / f"passport-{tx_hash.hex()[:12]}.json"
    with open(passport_path, "w", encoding="utf-8") as f:
        f.write(json.dumps(passport, separators=(",", ":"), ensure_ascii=False))

    print()
    divider()
    print(f"  ✅ Minted successfully")
    print()
    print(f"  Transaction:  {net['explorer']}/tx/{tx_hash.hex()}")
    print()
    print(f"  Saved: {passport_path}")
    print()
    print(f"  Next steps:")
    print(f"  1. Find your Human ID on the explorer (PassportMinted event)")
    print(f"  2. Add the Human ID to passport.json (replace null)")
    print(f"  3. Upload passport.json to {data_url}")
    print(f"  4. Generate QR: python mint.py --qr <human_id>")
    divider()

# ─── Generate QR ──────────────────────────────────────────────────────────────

def cmd_qr(args):
    human_id = args.qr
    output_dir = Path("passports")
    output_dir.mkdir(exist_ok=True)
    qr_path = output_dir / f"{human_id}.qr.png"
    generate_qr(human_id, str(qr_path))
    print(f"\n  QR saved: {qr_path}")
    print(f"  Content:  odp://{human_id}\n")

# ─── Config loader ────────────────────────────────────────────────────────────

def _load_config():
    private_key = os.getenv("PRIVATE_KEY", "").strip()
    if not private_key:
        private_key = input("  Private key (from MetaMask): ").strip()
    if private_key.startswith("0x"):
        private_key = private_key[2:]

    print()
    print("  Network:")
    print("    1 — Polygon Amoy (testnet, free)")
    print("    2 — Polygon PoS  (mainnet, ~$0.01)")
    choice      = input("  Choose [1]: ").strip() or "1"
    network_key = "amoy" if choice == "1" else "polygon"

    dep_file = Path(f"deployments/{network_key}.json")
    if dep_file.exists():
        with open(dep_file) as f:
            dep = json.load(f)
        contract_address = dep["contractAddress"]
        print(f"  Contract: {contract_address} (from deployments/{network_key}.json)")
    else:
        contract_address = input("  Contract address (0x...): ").strip()

    return network_key, private_key, contract_address

# ─── Entry point ──────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Object Digital Passport — CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Commands:
  python mint.py                  Mint a new passport (interactive)
  python mint.py --register       Register your Creator ID
  python mint.py --check          Check your Creator ID
  python mint.py --qr ODP-2026-03-4829301  Generate QR for a Human ID
        """
    )
    parser.add_argument("--register", action="store_true", help="Register Creator ID")
    parser.add_argument("--check",    action="store_true", help="Check Creator ID")
    parser.add_argument("--qr",       metavar="HUMAN_ID",  help="Generate QR code")
    args = parser.parse_args()

    if args.register:
        cmd_register(args)
    elif args.check:
        cmd_check(args)
    elif args.qr:
        cmd_qr(args)
    else:
        cmd_mint(args)

if __name__ == "__main__":
    main()
