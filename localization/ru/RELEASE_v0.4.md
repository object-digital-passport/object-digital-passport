# Object Digital Passport — примечания к релизу · v0.4 (эталонный сайт и документация)

Здесь описано **что изменилось на ветке `main`** после эталонной on-chain-линии v0.3 — в основном **статический веб**, **WalletConnect**, **SPEC/документация** и **вовлечение сообщества**. Это **не** автоматически новый **задеплоенный** реестр по **тем же эталонным адресам Polygon** в [`../../README.md`](../../README.md): там по-прежнему **v0.3** (упакованный байт **3**), пока вы явно не задеплоите другой контракт. Нормативные правила — в [`SPEC.md`](SPEC.md) (перевод этого файла).

### P / M и «фейк» (counterfeit) — не смешивать с этим набором заметок

- В **эталонном байткоде v0.3** `ObjectDigitalPassport` **нет** on-chain **`raiseCounterfeitConcern` / `getCounterfeitConcern`** (снято ради EIP-170) — см. [`RELEASE_v0.3.md`](RELEASE_v0.3.md) и **SPEC**. Профили **P** и **M** могут фиксировать претензии к подлинности **оффчейн** (`passport.json`, **`submitProof`**, отчёты по ссылке). Эталонный веб показывает устаревшие on-chain контролы counterfeit **только если** у подключённого ABI эти функции есть (часто **старые реестры v0.2**).
- **Отдельная работа** на ветке **`v0.4`**: спутник **`ODPCounterfeitConcern`** и поколение **4** (пример коммита `0e86ec4` — **не** в истории **`main`** на момент обновления этих заметок). Это **не** то, что вы получаете, делая checkout только **`main`**. Нужны merge и деплой, чтобы говорить о on-chain **v0.4**.

### README / SPEC (тоже на `main`)

- **§17 SPEC** и корневой **README** описывают WalletConnect рядом с инжектированным кошельком; обложки README — в [`../../docs/images/`](../../docs/images/).

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
