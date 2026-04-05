# Object Digital Passport — примечания к релизу · v0.4 (эталонный сайт и документация)

Здесь описано **что изменилось в репозитории между снимком протокола v0.3 и этой эталонной линией v0.4** — в основном **статический веб-интерфейс**, **интеграция WalletConnect**, **SPEC/документация** и **процесс вовлечения сообщества**. Это **не** новое поколение on-chain-реестра: **эталонный деплой Polygon по-прежнему линия v0.3** (`CONTRACT_VERSION` / поколение **3**) — таблица **«Текущий релиз»** в [`../../README.md`](../../README.md). Нормативные правила протокола — в [`SPEC.md`](SPEC.md) (перевод этого файла).

## Кратко

| Область | Что сделано |
|:--------|:------------|
| **Кошельки** | [**WalletConnect v2**](https://docs.reown.com/) (Reown / `@walletconnect/ethereum-provider`) на **Профиле** и **Паспорте** — мобильные кошельки (в т.ч. Tangem) и сценарий с QR рядом с браузерным EIP-1193. Конфиг: [`../../web/odp-wc-config.js`](../../web/odp-wc-config.js); ленивая загрузка бандла: [`../../web/odp-wallet-wc-loader.js`](../../web/odp-wallet-wc-loader.js) → [`../../web/odp-wallet-wc.bundle.js`](../../web/odp-wallet-wc.bundle.js) (сборка: `npm run build:wc` в `web/`). |
| **Сессия** | После **перезагрузки страницы** или **перехода** между `passport.html` и `creator.html` сессия **WalletConnect восстанавливается**, когда это возможно (без повторного QR, если провайдер ещё хранит сессию). Реализовано через **`odpWalletConnectTryRestoreSession`** в [`../../web/odp-wallet-wc.entry.js`](../../web/odp-wallet-wc.entry.js) и инициализацию на этих страницах. |
| **SPEC** | Уточнения по **ODP-DNS / URI-схемам** (`odp://`, историческая заметка про `odpc://`) и **профилю резолвера §19** — [`../../SPEC.md`](../../SPEC.md) и [`SPEC.md`](SPEC.md). |
| **Веб** | **Сброс кэша** стилей на **Профиле** (`creator.html` + `odp.css`) для GitHub Pages. Мелкие правки **карточки профиля** (акцент строки кошелька, выравнивание подписи «publish everywhere», многоточие для длинного адреса — с последующим уточнением). |
| **Сообщество** | Черновик **англоязычного GitHub Discussion** про **UI паспорта и стандарт** к v0.4: [`../../docs/community/discussion-passport-ui-v0.4-EN.md`](../../docs/community/discussion-passport-ui-v0.4-EN.md). Скрипт публикации: [`../../scripts/gh-create-discussion-from-doc.sh`](../../scripts/gh-create-discussion-from-doc.sh) (нужны [`gh`](https://cli.github.com/) и включённые Discussions). Указатель: [`../../docs/README.md`](../../docs/README.md). |

## См. также

- **v0.3 vs v0.2 (on-chain):** [`RELEASE_v0.3.md`](RELEASE_v0.3.md) · [`../../RELEASE_v0.3.md`](../../RELEASE_v0.3.md)
- **Короткий указатель:** [`../../docs/V0.4.md`](../../docs/V0.4.md)
- **Модель версий:** [`../../docs/VERSIONING_AND_RELEASES.md`](../../docs/VERSIONING_AND_RELEASES.md)
