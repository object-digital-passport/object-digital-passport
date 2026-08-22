# Android verifier MVP (scope)

Minimum useful dedicated verifier for **ODP + NTAG 424 DNA TagTamper**: NFC runtime, separate trust rows (carrier, offline payload, chip session, `nfcPublicKey` binding, canonical `dataHash`), without becoming a full issuer workstation.

**Implementation:** [odp-android-companion](https://github.com/object-digital-passport/odp-android-companion) — guided app, EV2, mirror profile, registry key fetch.  
**Integration:** [docs/ANDROID.md](https://github.com/object-digital-passport/object-digital-passport.github.io/blob/main/docs/ANDROID.md) · **Chip pilot:** [ANDROID_NTAG424DNA_TAGTAMPER.md](ANDROID_NTAG424DNA_TAGTAMPER.md).

The browser already verifies registry + `dataHash`; it cannot run EV2 or TagTamper. TagWriter writes carriers only; Tag TrustLink can authenticate the chip but not bind to an ODP passport without comparing to on-chain `nfcPublicKey`.

For the full requirement list (result rows, NDPP hashing rules, MVP boundary), see the historical expanded draft in git history or the companion README trust-model sections.
