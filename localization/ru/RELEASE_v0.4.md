# Object Digital Passport — примечания · ветка v0.4

Кратко: **ветка v0.4** в этом репозитории относительно прежнего эталонного реестра. Нормативно — **[`SPEC.md`](../../SPEC.md)** (EN). Деплой — **[`../../deploy/README.md`](../../deploy/README.md)**.

## On-chain (EIP-170)

- **Упакованный `CONTRACT_VERSION` = `4`** при минте и в **`submitProof`** (та же форма tuple, что у эталонного v0.3 с байтом **3**; поднят **`SPEC_MINOR`**). Основной реестр по-прежнему укладывается в лимит **24 KiБ** (**EIP-170**).
- Из эталонного байткода убраны публичные геттеры **`SPEC_MAJOR`**, **`SPEC_MINOR`**, **`MONTHLY_LIMIT_*`** ради размера. Ориентируйтесь на **`CONTRACT_VERSION`**, **`getRemainingMints`** и нормативные лимиты **C = 1000**, **B = 100_000** в SPEC / исходнике.
- **`ODPPassportLib`**: для NFC по-прежнему только **`NTAG424DNA_TT`** (TagTamper).
- **`ODPCounterfeitConcern`**: спутник для **`raiseCounterfeitConcern`** / **`clear`** / **`getCounterfeitConcern`** (**P** и **M**).

## Веб

- **`NET.counterfeitConcern`** — опциональный адрес спутника (тот же **`NET.contract`**). См. **`odp-contract.js`**.

## Ошибки спутника

**80** / **81** / **82** — см. английский **[`RELEASE_v0.4.md`](../../RELEASE_v0.4.md)**.
