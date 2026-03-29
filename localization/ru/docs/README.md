# Индекс документации

*Автор: Andrei Chernikov*

| Документ | Назначение |
|----------|------------|
| **[`SPEC.md`](../../SPEC.md)** (корень репозитория, EN — нормативный источник) | **Нормативный** протокол: `passport.json`, поля on-chain, проверка, **бандл §15 `.odpass`**. Справочный перевод: [`../SPEC.md`](../SPEC.md). |
| **[`PROTOCOL_TRACKS.md`](../../docs/PROTOCOL_TRACKS.md)** | **Информационно:** трек A (аудит) vs трек B (агент минта), указатель EIP-170. |
| **[`EIP170_STRATEGY.md`](../../docs/EIP170_STRATEGY.md)** | Лимит размера байткода: варианты до деплоя в mainnet. |
| **[`deploy/README.md`](../../deploy/README.md)** | Пошаговый деплой Hardhat (`.env`, компиляция, Polygon mainnet); ограничение EIP-170 перед `polygon`. |
| **[`VERSIONING_AND_RELEASES.md`](../../docs/VERSIONING_AND_RELEASES.md)** | Теги Git, `main`, hotfix-ветки и линии фич. |
| **[`V0.2-DRAFT.md`](../../docs/V0.2-DRAFT.md)** | Исторические / разведывательные заметки. Часть перенесена в **SPEC v0.2**; обязательным остаётся **SPEC**. |
| **[`V0.3.md`](../../docs/V0.3.md)** | **v0.3 vs v0.2:** [`../../RELEASE_v0.3.md`](../../RELEASE_v0.3.md) (EN), [`../RELEASE_v0.3.md`](../RELEASE_v0.3.md) (RU); деплой / **`NET.*`:** [`../../deploy/README.md`](../../deploy/README.md); **SPEC**. |
| **[`IDEAS_V1.md`](../../docs/IDEAS_V1.md)** | Неформальные идеи **v1** (не спецификация). |

## Бандл `.odpass` (кратко)

- **Формат:** ZIP с расширением **`.odpass`**; обязательны `passport.json` + `manifest.json`; дополнительные байты в `originals/` с путями в `manifest.originals` (v0.3); устаревшие `original/*` / `image/*` — см. **SPEC §15**.
- **Схема манифеста (эталон):** **SPEC §15.1.1** (`format: odp-bundle`, `bundleVersion: "0.1"`).
- **Реализации в репозитории:** `createPassportOdpBlob` в **`web/passport.html`** и **`tools/mint.py`** после успешного минта в CLI — тот же layout и поля манифеста.
- **Хостинг:** `dataUrl` может указывать на **сырой `passport.json`** или на тот же **архив `.odpass`** (HTTPS); **`web/verify.html`** извлекает `passport.json` из ZIP, если путь заканчивается на **`.odpass`** или тело начинается с сигнатуры ZIP — см. **SPEC §9** п. 5.

---

*Пользовательский обзор и хостинг — с корневого [`README.md`](../README.md). Англоязычный индекс: [`../../docs/README.md`](../../docs/README.md).*
