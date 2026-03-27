# Documentation index

*Author: Andrei Chernikov*

| Document | Purpose |
|----------|---------|
| **[`SPEC.md`](../SPEC.md)** (root) | **Normative** protocol: `passport.json`, on-chain fields, verification, **§15 `.odp` bundle**. |
| **[`VERSIONING_AND_RELEASES.md`](VERSIONING_AND_RELEASES.md)** | Git tags, `main`, hotfix branches vs feature lines. |
| **[`V0.2-DRAFT.md`](V0.2-DRAFT.md)** | Historical / exploratory notes (folder-first hosting, hash boundaries). Several items have since landed in **SPEC v0.2**; read **SPEC** for what is binding. |
| **[`V0.3.md`](V0.3.md)** | Pointer to **[`RELEASE_v0.3.md`](../RELEASE_v0.3.md)** and **SPEC**. |

## `.odp` bundle (quick pointer)

- **Format:** ZIP with extension `.odp`; required entries `passport.json` + `manifest.json`; optional `original/*`, `image/*` — see **SPEC §15**.
- **Reference manifest schema:** **SPEC §15.1.1** (`format: odp-bundle`, `bundleVersion: "0.1"`).
- **Implementations in this repo:** `createPassportOdpBlob` in **`web/passport.html`** and **`tools/mint.py`** after a successful CLI mint — same layout and manifest fields.
- **Hosting:** `dataUrl` may point to **raw `passport.json`** or to the **same `.odp` file** (HTTPS); **`web/verify.html`** extracts `passport.json` from the ZIP when the path ends with `.odp` or the body starts with the ZIP signature — see **SPEC §9** item 5.

---

*For user-facing setup and hosting, start from the root [`README.md`](../README.md).*
