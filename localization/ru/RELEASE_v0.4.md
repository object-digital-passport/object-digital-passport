# Object Digital Passport — примечания к релизу · v0.4

Здесь кратко **линия v0.4** в репозитории (**`main`**): **on-chain** (поколение **4**, опциональный спутник **`ODPCounterfeitConcern`**), **веб** (WalletConnect, восстановление сессии), **SPEC** и **сообщество**. Нормативно — **[`SPEC.md`](SPEC.md)** (EN: [`../../SPEC.md`](../../SPEC.md)).

**Деплой:** эталонные **адреса Polygon** в [`../../README.md`](../../README.md) и [`../../deploy/deployments/polygon.json`](../../deploy/deployments/polygon.json) — развёртывание **поколения 4** (байт **`CONTRACT_VERSION` = 4**), на которое нацелены **`NET.*`** статических страниц. При своём реестре задайте **`NET.contract`**, **`NET.docAnchor`**, **`NET.counterfeitConcern`** (и при необходимости **`previousContracts`** на Verify) под **сеть + адрес + ABI**.

## On-chain (EIP-170)

- Упакованный **`CONTRACT_VERSION` = `4`** при минте и в **`submitProof`** (та же форма tuple, что у поколения **3**). Основной реестр — в лимите **24 KiБ**.
- Из эталонного байткода основного реестра убраны публичные геттеры **`SPEC_*`**, **`MONTHLY_LIMIT_*`**. Ориентируйтесь на **`CONTRACT_VERSION`**, **`getRemainingMints`** и лимиты **C = 1000**, **B = 100_000** в SPEC / исходнике.
- **`ODPPassportLib`**: NFC только **`NTAG424DNA_TT`**.
- **`ODPCounterfeitConcern`** — спутник **`raiseCounterfeitConcern`** / **`clear`** / **`getCounterfeitConcern`** (**P** и **M**). Ошибки **80** / **81** / **82** — см. английский **[`../../RELEASE_v0.4.md`](../../RELEASE_v0.4.md)**.

**Порядок деплоя:** **`ODPPassportLib`** → **`ObjectDigitalPassport`** → при необходимости **`ODPWalletDocumentAnchor`** / **`ODPCounterfeitConcern`** — **[`../../deploy/README.md`](../../deploy/README.md)**.

## Веб

- **`NET.counterfeitConcern`** — опциональный адрес спутника (тот же **`NET.contract`**). См. **`../../web/odp-contract.js`**.
- WalletConnect, сессия, SPEC/URI, обложки README — см. английский **[`../../RELEASE_v0.4.md`](../../RELEASE_v0.4.md)**.

## См. также

- **v0.3 vs v0.2:** [`RELEASE_v0.3.md`](RELEASE_v0.3.md) · [`../../RELEASE_v0.3.md`](../../RELEASE_v0.3.md)
- **Указатель:** [`../../docs/V0.4.md`](../../docs/V0.4.md)
- **Версии:** [`../../docs/VERSIONING_AND_RELEASES.md`](../../docs/VERSIONING_AND_RELEASES.md)
