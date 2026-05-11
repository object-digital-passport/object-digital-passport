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
| **[`V0.3.md`](../../docs/V0.3.md)** | **v0.3 vs v0.2:** [`../RELEASE_v0.3.md`](../RELEASE_v0.3.md); деплой / **`NET.*`:** [`../../deploy/README.md`](../../deploy/README.md); **SPEC**. |
| **[`V0.4.md`](../../docs/V0.4.md)** | Исторические заметки по линии v0.4 и указатели на release notes. |
| **[`V0.5.md`](../../docs/V0.5.md)** | **Линия v0.5 (текущий `main`):** on-chain поколение **5**, richer taxonomy, mutable current-state fields, offline payload и split satellites. |
| **[`RELEASE_v0.4.1.md`](../../docs/RELEASE_v0.4.1.md)** | **v0.4.1** — патч-заметки по реализации (SRI, шаблоны GitHub, Hardhat 3, типы). Линия протокола остаётся v0.4. RU: [`../RELEASE_v0.4.1.md`](../RELEASE_v0.4.1.md). |
| **[`SECURITY.md`](../SECURITY.md)** | **Модель угроз и границы доверия** для текущей эталонной линии. EN: [`../../SECURITY.md`](../../SECURITY.md). |
| **[`community/discussion-passport-ui-v0.4-EN.md`](../../docs/community/discussion-passport-ui-v0.4-EN.md)** | Черновик **GitHub Discussion** (EN) про UI паспорта и стандарт. Публикация: **`../../scripts/gh-create-discussion-from-doc.sh`** после `gh auth login`. |
| **[`IDEAS_V1.md`](../../docs/IDEAS_V1.md)** | Неформальные идеи **v1** (не спецификация). |

## Бандл `.odpass` (кратко)

- **Формат:** ZIP с расширением **`.odpass`**; обязательны `passport.json` + `manifest.json`; дополнительные байты в `originals/` с путями в `manifest.originals` (v0.3) — см. **SPEC §15** (устаревшие каталоги верхнего уровня `original/*` / `image*/*` не нормативны).
- **Схема манифеста (эталон):** **SPEC §15.1.1** (`format: odp-bundle`, `bundleVersion: "0.1"`).
- **Реализации в репозитории:** `createPassportOdpBlob` в **`web/passport.html`** и **`tools/mint.py`** после успешного минта в CLI — тот же layout и поля манифеста.
- **Хостинг:** публичный `dataUrl` **должен** отдавать ZIP **§15 `.odpass`** (HTTPS); **`web/verify.html`** отклоняет URL «голого» `.json` и требует тело ZIP — см. **SPEC §9** и **§11** шаг 5.

---

*Пользовательский обзор и хостинг — с корневого [`README.md`](../README.md). Англоязычный индекс: [`../../docs/README.md`](../../docs/README.md).*
