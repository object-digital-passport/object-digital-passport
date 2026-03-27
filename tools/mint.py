#!/usr/bin/env python3
"""
Object Digital Passport — Mint CLI
Author: Andrei Chernikov
Specification v0.3 (CLI targets v0.3 contract ABI)

Usage:
    python mint.py                  # interactive mint → saves passports/<Passport ID>.odpass (SPEC §15)
    python mint.py --register       # register profile (on-chain creatorId) first
    python mint.py --check          # check your profile ID

Requirements:
    pip install web3 qrcode[pil] pillow python-dotenv
"""

import os
import sys
import json
import hashlib
import unicodedata
import argparse
import zipfile
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
        "rpc":      "https://polygon-bor.publicnode.com",
        "chain_id": 137,
        "explorer": "https://polygonscan.com",
    },
}

CONTRACT_ABI = [
    # Creator Registry
    {
        "name": "registerCreator",
        "type": "function",
        "stateMutability": "nonpayable",
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
        "stateMutability": "nonpayable",
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
            {"name": "imageHash2",   "type": "bytes32"},
            {"name": "imageUrl2",    "type": "string"},
            {"name": "imageHash3",   "type": "bytes32"},
            {"name": "imageUrl3",    "type": "string"},
            {"name": "dataUrlIsFolderBase", "type": "bool"},
        ],
        "outputs": [{"name": "humanId", "type": "string"}],
    },
    # Passport — digital
    {
        "name": "mintDigital",
        "type": "function",
        "stateMutability": "nonpayable",
        "inputs": [
            {"name": "year",      "type": "uint32"},
            {"name": "month",     "type": "uint8"},
            {"name": "dataHash",  "type": "bytes32"},
            {"name": "dataUrl",   "type": "string"},
            {"name": "imageHash", "type": "bytes32"},
            {"name": "imageUrl",  "type": "string"},
            {"name": "imageHash2", "type": "bytes32"},
            {"name": "imageUrl2",  "type": "string"},
            {"name": "imageHash3", "type": "bytes32"},
            {"name": "imageUrl3",  "type": "string"},
            {"name": "fileHash",  "type": "bytes32"},
            {"name": "dataUrlIsFolderBase", "type": "bool"},
        ],
        "outputs": [{"name": "humanId", "type": "string"}],
    },
    {
        "anonymous": False,
        "name": "PassportMinted",
        "type": "event",
        "inputs": [
            {"indexed": True, "name": "humanId", "type": "string"},
            {"indexed": True, "name": "creator", "type": "address"},
            {"indexed": False, "name": "creatorId", "type": "string"},
            {"indexed": False, "name": "objectType", "type": "string"},
            {"indexed": False, "name": "year", "type": "uint32"},
            {"indexed": False, "name": "month", "type": "uint8"},
            {"indexed": False, "name": "dataHash", "type": "bytes32"},
            {"indexed": False, "name": "sealType", "type": "uint8"},
            {"indexed": False, "name": "nfcModel", "type": "string"},
            {"indexed": False, "name": "timestamp", "type": "uint256"},
        ],
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
                {"name": "owner",            "type": "address"},
                {"name": "creatorId",        "type": "string"},
                {"name": "year",         "type": "uint32"},
                {"name": "month",        "type": "uint8"},
                {"name": "objectType",   "type": "string"},
                {"name": "dataHash",     "type": "bytes32"},
                {"name": "imageHash",    "type": "bytes32"},
                {"name": "imageHash2",   "type": "bytes32"},
                {"name": "imageHash3",   "type": "bytes32"},
                {"name": "fileHash",     "type": "bytes32"},
                {"name": "sealType",     "type": "uint8"},
                {"name": "sealHash",     "type": "bytes32"},
                {"name": "nfcPublicKey", "type": "bytes"},
                {"name": "nfcModel",     "type": "string"},
                {"name": "dataUrl",      "type": "string"},
                {"name": "imageUrl",     "type": "string"},
                {"name": "imageUrl2",    "type": "string"},
                {"name": "imageUrl3",    "type": "string"},
                {"name": "timestamp",    "type": "uint256"},
                {"name": "revoked",      "type": "bool"},
                {"name": "revokedAt",    "type": "uint256"},
                {"name": "revocationReasonHash", "type": "bytes32"},
            ]
        }],
    },
]

ZERO_BYTES32 = b"\x00" * 32
ZERO_HEX32 = "0x" + "0" * 64


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
    return tx_hash, receipt


def bytes32_to_hex0x(b: bytes) -> str:
    return "0x" + b.hex()


def human_id_from_mint_receipt(contract, receipt):
    """Decode Passport ID (event arg humanId) from PassportMinted in the mint receipt."""
    try:
        ev = contract.events.PassportMinted()
    except Exception:
        return None
    proc = getattr(ev, "process_receipt", None) or getattr(ev, "processReceipt", None)
    if callable(proc):
        try:
            entries = proc(receipt)
            if entries:
                a = entries[0]["args"] if isinstance(entries[0], dict) else entries[0].args
                hid = a.get("humanId") if isinstance(a, dict) else getattr(a, "humanId", None)
                if hid:
                    return str(hid)
        except Exception:
            pass
    plog = getattr(ev, "process_log", None) or getattr(ev, "processLog", None)
    if callable(plog):
        for log in receipt.logs:
            try:
                parsed = plog(log)
                a = parsed["args"] if isinstance(parsed, dict) else parsed.args
                hid = a.get("humanId") if isinstance(a, dict) else getattr(a, "humanId", None)
                if hid:
                    return str(hid)
            except Exception:
                continue
    return None


def odp_created_at_utc_iso() -> str:
    """Match web `passport.html` (no milliseconds): 2026-03-22T12:00:00Z"""
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def safe_odp_basename(human_id: str) -> str:
    s = "".join(c if (c.isalnum() or c in ".-_") else "_" for c in (human_id or "").strip())
    return (s or "passport")[:96]


def write_odp_bundle(
    out_path,
    passport_json_str,
    manifest,
    original_path=None,
    image_path=None,
    image_path2=None,
    image_path3=None,
):
    """
    ODP bundle per SPEC.md §15 — same layout as `createPassportOdpBlob` in web/passport.html:
    passport.json, manifest.json, optional original/*, image/*, image2/*, image3/*.
    """
    with zipfile.ZipFile(out_path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
        zf.writestr("passport.json", passport_json_str.encode("utf-8"))
        if original_path and Path(original_path).is_file():
            p = Path(original_path)
            zf.write(p, arcname=f"original/{p.name}")
        if image_path and Path(image_path).is_file():
            p = Path(image_path)
            zf.write(p, arcname=f"image/{p.name}")
        if image_path2 and Path(image_path2).is_file():
            p = Path(image_path2)
            zf.write(p, arcname=f"image2/{p.name}")
        if image_path3 and Path(image_path3).is_file():
            p = Path(image_path3)
            zf.write(p, arcname=f"image3/{p.name}")
        zf.writestr("manifest.json", json.dumps(manifest, indent=2, ensure_ascii=False).encode("utf-8"))

# ─── Register profile ─────────────────────────────────────────────────────────

def cmd_register(args):
    print()
    print("  ODP — Register profile")
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
    print("    P — Proof Institution (expert body, certification, auction attestations)")
    print("    M — Museum / Collection (for institutional holdings; museums should use M, not B)")
    print()

    t = prompt("Type (C / B / P / M)", "C").strip().upper()
    if t not in ("C", "B", "P", "M"):
        print("  Invalid type.")
        sys.exit(1)

    print()
    print(f"  Registering as type {t}...")
    # bytes1 encoding: "C"→b"C", "B"→b"B", "P"→b"P"
    type_bytes = t.encode('ascii')
    print("  v0.2: gas only (no protocol fee)")
    tx_hash, _ = send_tx(
        w3, account,
        contract.functions.registerCreator(type_bytes),
        net,
    )

    creator_id = contract.functions.getCreatorByWallet(account.address).call()
    print()
    print(f"  ✅ Registered successfully")
    print()
    print(f"  Profile ID (short):  {creator_id}")
    print(f"  Wallet:              {account.address}")
    print()
    print(f"  Full identity:")
    print(f"  {creator_id} / [your name] / {account.address}")
    print()
    print(f"  Publish this on your website, social media, and physical objects.")
    print(f"  {net['explorer']}/tx/{tx_hash.hex()}")
    divider()

# ─── Check profile ───────────────────────────────────────────────────────────

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
        print(f"\n  Profile ID:  {rec[0]}")
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

# ─── Passport JSON helpers ───────────────────────────────────────────────────

def issuer_role_from_creator_id(cid: str) -> str:
    """Maps profile ID prefix (C/B/P/M) to canonical issuerRole in passport.json."""
    p = (cid or "").strip()[:1].upper()
    return {"C": "individual", "B": "brand", "P": "proof_institution", "M": "museum"}.get(p, "individual")


def registration_clock_block(utc_now: datetime):
    """Privacy-safe registration clock block: UTC-only representations."""
    unix = int(utc_now.timestamp())
    utc_iso = utc_now.strftime("%Y-%m-%dT%H:%M:%SZ")
    # Use UTC-only timezone metadata to avoid leaking device locale.
    local_iso = utc_now.strftime("%Y-%m-%dT%H:%M:%S+00:00")
    return unix, {"ianaTimeZone": "UTC", "localIso8601": local_iso, "utcIso8601": utc_iso}


# ─── Mint ─────────────────────────────────────────────────────────────────────

def cmd_mint(args):
    print()
    print("  Object Digital Passport — Mint")
    divider()

    network_key, private_key, contract_address = _load_config()
    w3, account, contract, net = connect(network_key, private_key, contract_address)

    # Check profile ID (on-chain creatorId)
    creator_id = contract.functions.getCreatorByWallet(account.address).call()
    if not creator_id:
        print(f"\n  ERROR: Wallet {account.address} is not registered.")
        print(f"  Run: python mint.py --register")
        sys.exit(1)

    print(f"\n  Wallet:     {account.address}")
    print(f"  Profile ID: {creator_id}")
    balance = w3.from_wei(w3.eth.get_balance(account.address), "ether")
    print(f"  Balance:    {balance:.4f} POL")

    # Object type
    print()
    print("  [1/6] Object type")
    print("    1 — Physical (SPEC: artwork, photography, digital, collectible, document, object)")
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
        obj_type = prompt(
            "Category (artwork / photography / digital / collectible / document / object)",
            "artwork",
        )
        medium   = prompt_optional("Medium")
        edition_n = prompt_optional("Edition number (e.g. 1)")
        edition_t = prompt_optional("Edition total (e.g. 3)")
        materials_raw = prompt_optional("Materials (comma-separated, e.g. canvas, oil paint)")
    else:
        obj_type = "digital"
        subtype  = prompt("Subtype (image / video / 3d / audio / document / other)", "image")
        fmt      = prompt_optional("Format (e.g. TIFF, ProRes, GLB)")

    data_url = (prompt_optional("URL where passport.json will be hosted (HTTPS, or empty for no public URL)") or "").strip()
    if not data_url:
        print("  ⚠  Empty dataUrl: the Verify page cannot fetch JSON; only passport.json holders can verify.")

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
    file_path = ""
    file_size = 0
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

    reg_unix, reg_clock = registration_clock_block(now)
    passport = {
        "version":    "0.2",
        "passportId": None,  # filled after mint
        "objectType": "physical" if is_physical else "digital",
        "type":       obj_type,
        "title":      title,
        "issuerRole": issuer_role_from_creator_id(creator_id),
        "creator": {
            "name":      prompt("Creator name (for passport)"),
            "wallet":    account.address,
            "creatorId": creator_id,
        },
        "year":         reg_year,
        "month":        reg_month,
        "registeredAt": reg_unix,
        "registration": reg_clock,
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

    print()
    print("  Optional additional metadata (key=value per line, empty line to finish)")
    extra_meta = {}
    while True:
        line = (prompt_optional("  key=value") or "").strip()
        if not line:
            break
        if "=" in line:
            k, _, rest = line.partition("=")
            k, v = k.strip(), rest.strip()
            if k:
                extra_meta[k] = v
    if extra_meta:
        passport["additionalMetadata"] = extra_meta

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
    print(f"  Profile ID:  {creator_id}")
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
    print("  Minting (gas only, no protocol fee)...")

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
            ZERO_BYTES32,
            "",
            ZERO_BYTES32,
            "",
            False,           # dataUrlIsFolderBase — CLI uses full dataUrl; use web UI for folder-base mint
        )
    else:
        fn = contract.functions.mintDigital(
            reg_year,
            reg_month,
            to_bytes32(data_hash_bytes),
            data_url,
            to_bytes32(image_hash_bytes),
            image_url,
            ZERO_BYTES32,
            "",
            ZERO_BYTES32,
            "",
            to_bytes32(file_hash_bytes),
            False,           # dataUrlIsFolderBase
        )

    tx_hash, receipt = send_tx(w3, account, fn, net)

    human_id = human_id_from_mint_receipt(contract, receipt)
    if not human_id:
        print("\n  ERROR: Could not read Passport ID from PassportMinted event.")
        print(f"  Transaction: {net['explorer']}/tx/{Web3.to_hex(tx_hash)}")
        sys.exit(1)

    passport["passportId"] = human_id
    passport_json_str = json.dumps(
        normalize_nfc(passport), sort_keys=True, separators=(",", ":"), ensure_ascii=False
    )

    tx_hex = Web3.to_hex(tx_hash)
    contract_cs = Web3.to_checksum_address(contract_address)

    def b32h(b):
        return ZERO_HEX32 if b == ZERO_BYTES32 else bytes32_to_hex0x(b)

    files_meta = [{"path": "passport.json", "role": "passport", "mime": "application/json"}]
    orig_for_zip = file_path if (not is_physical and file_path and Path(file_path).is_file()) else None
    img_for_zip = image_path if (image_path and Path(image_path).is_file()) else None

    if orig_for_zip:
        p = Path(orig_for_zip)
        files_meta.append({
            "path": f"original/{p.name}",
            "role": "original",
            "mime": "application/octet-stream",
            "sizeBytes": int(p.stat().st_size),
            "sha256": bytes32_to_hex0x(sha256_file(str(p))),
        })
    if img_for_zip:
        p = Path(img_for_zip)
        files_meta.append({
            "path": f"image/{p.name}",
            "role": "imageOriginal",
            "mime": "application/octet-stream",
            "sizeBytes": int(p.stat().st_size),
            "sha256": bytes32_to_hex0x(sha256_file(str(p))),
        })

    manifest = {
        "format": "odpass-bundle",
        "bundleVersion": "0.2",
        "passportId": human_id,
        "createdAtUtc": odp_created_at_utc_iso(),
        "mode": "full",
        "onChain": {
            "dataHash": bytes32_to_hex0x(to_bytes32(data_hash_bytes)),
            "imageHash": b32h(image_hash_bytes),
            "imageHash2": ZERO_HEX32,
            "imageHash3": ZERO_HEX32,
            "fileHash": b32h(file_hash_bytes),
            "txHash": tx_hex,
            "chainId": int(net["chain_id"]),
            "contract": contract_cs,
        },
        "files": files_meta,
    }

    output_dir = Path("passports")
    output_dir.mkdir(exist_ok=True)
    odp_path = output_dir / (safe_odp_basename(human_id) + ".odpass")
    write_odp_bundle(odp_path, passport_json_str, manifest, orig_for_zip, img_for_zip)

    print()
    divider()
    print(f"  ✅ Minted successfully")
    print()
    print(f"  Passport ID:  {human_id}")
    print(f"  Transaction:  {net['explorer']}/tx/{tx_hex}")
    print()
    print(f"  Saved bundle: {odp_path}")
    print(f"  (Same .odpass zip layout as web Passport: SPEC.md §15, manifest bundleVersion 0.2.)")
    print()
    print(f"  Next steps:")
    if data_url:
        print(f"  1. Unzip the .odpass and upload passport.json to your dataUrl — use the exact bytes from the bundle.")
    else:
        print(f"  1. Keep the .odpass safe; without a public dataUrl only holders can verify against the chain.")
    print(f"  2. Drop the .odpass on Verify or enter Passport ID {human_id}")
    print(f"  3. QR: python mint.py --qr {human_id}")
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
  python mint.py --register       Register your profile (on-chain creatorId)
  python mint.py --check          Check your profile ID
  python mint.py --qr ODP-2026-03-004829301  Generate QR for a Passport ID
        """
    )
    parser.add_argument("--register", action="store_true", help="Register profile (on-chain creatorId)")
    parser.add_argument("--check",    action="store_true", help="Check profile ID")
    parser.add_argument("--qr",       metavar="PASSPORT_ID", help="Generate QR code (odp://…)")
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
