# Object Digital Passport · v0.2

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/object-digital-passport/object-digital-passport?style=flat&logo=github)](https://github.com/object-digital-passport/object-digital-passport/stargazers)

ODP — открытый стандарт для регистрации физических и цифровых объектов в блокчейне и последующей проверки подлинности.
Без lock-in платформы, подписки и центрального владельца реестра.

## Оглавление

- [С чего начать](#с-чего-начать)
- [Быстрый старт (5 минут)](#быстрый-старт-5-минут)
- [Как работает ODP](#как-работает-odp)
- [Live demo](#live-demo)
- [Текущий релиз](#текущий-релиз)
- [Коротко о терминах](#коротко-о-терминах)
- [Технические заметки](#технические-заметки)
- [Структура репозитория](#структура-репозитория)
- [Безопасность и модель верификации](#безопасность-и-модель-верификации)
- [Сеть и стоимость](#сеть-и-стоимость)
- [Дорожная карта](#дорожная-карта)
- [Как вносить вклад](#как-вносить-вклад)
- [Автор и лицензия](#автор-и-лицензия)

## С чего начать

Если вы только знакомитесь с проектом:

1. Прочитайте этот README для общего понимания.
2. Откройте [`SPEC.md`](SPEC.md) для строгих правил протокола.
3. Откройте [`RELEASE_v0.2.md`](RELEASE_v0.2.md) как сводку актуального состояния.

Важно про версии:
- линия `0.x` — это proof-of-concept;
- каждый деплоймент — отдельный реестр;
- записи не мигрируют автоматически между деплойментами;
- v0.1 и v0.2 — разные и несовместимые реестры.

## Быстрый старт (5 минут)

### 1) Кошелёк и gas

- Нужен EIP-1193 кошелёк (MetaMask, Rabby, Coinbase Wallet, Brave Wallet и т.д.).
- Нужен небольшой баланс POL для gas.

### 2) Регистрация профиля

- Откройте [Profile](https://object-digital-passport.github.io/object-digital-passport/creator.html).
- Зарегистрируйтесь один раз и получите ID профиля (`C-...`, `B-...`, `P-...`, `M-...`).

### 3) Выпуск паспорта

- Откройте [Passport](https://object-digital-passport.github.io/object-digital-passport/passport.html).
- Заполните форму и выполните mint.
- Скачайте `.odp`-бандл (`passport.json` + `manifest.json` + опциональные файлы).

### 4) Публикация `passport.json` (опционально, но желательно)

- Разместите raw JSON по `dataUrl` (HTTPS).
- Не меняйте байты после mint, иначе хэш-проверка не сойдётся.

### 5) Проверка

- Откройте [Verify](https://object-digital-passport.github.io/object-digital-passport/verify.html).
- Введите Passport ID, вставьте `odp://...` или перетащите `.odp`.

## Как работает ODP

Короткая схема:

1. Регистрируете профиль выпускающей стороны on-chain.
2. Выпускаете паспорт объекта (хэши + ссылки + metadata) on-chain.
3. Публикуете Passport ID и, при необходимости, `passport.json`.
4. Любой проверяет данные через chain + пересчёт хэшей.

Имена полей:

- Человекочитаемый термин: **Passport ID** (`ODP-YYYY-MM-NNNNNNNNN`).
- В JSON: поле **`passportId`**.
- В ABI/wire данных контракта: историческое имя **`humanId`**.

## Live demo

Базовый URL:
- [https://object-digital-passport.github.io/object-digital-passport/](https://object-digital-passport.github.io/object-digital-passport/)

Страницы:
- Verify (без кошелька): [verify.html](https://object-digital-passport.github.io/object-digital-passport/verify.html)
- Profile (нужен кошелёк + gas): [creator.html](https://object-digital-passport.github.io/object-digital-passport/creator.html)
- Passport (нужен кошелёк + gas): [passport.html](https://object-digital-passport.github.io/object-digital-passport/passport.html)

## Текущий релиз

| Пункт | Значение |
|:--|:--|
| Рекомендуемая PoC-линия | v0.2 |
| Mainnet контракт (v0.2) | [`0x6c83c8C2e18c183a2776431a23187832b42FfFBb`](https://polygonscan.com/address/0x6c83c8C2e18c183a2776431a23187832b42FfFBb) |
| Legacy контракт (v0.1, не поддерживается текущим UI) | [`0x380092fA9C708BF01a552247909CF5DeceFb469E`](https://polygonscan.com/address/0x380092fA9C708BF01a552247909CF5DeceFb469E) |

Короткая релизная заметка:
- [`RELEASE_v0.2.md`](RELEASE_v0.2.md)

## Коротко о терминах

| Термин | Что значит в ODP |
|:--|:--|
| Register | Одноразовая регистрация профиля (`registerCreator`) |
| Mint | Создание новой паспортной записи on-chain |
| Passport ID | Человекочитаемый ID объекта (`ODP-...`) |
| ID профиля | ID выпускающей стороны (`C/B/P/M-...`) |
| `passport.json` | Канонический off-chain документ объекта |
| `dataUrl` | Опциональный HTTPS адрес для JSON |
| Verify | Read-only проверка (без кошелька и протокольной комиссии) |

## Технические заметки

### Версия сайта и версия контракта

- Патч-изменения сайта/доков: `ODP_SITE_VERSION` в [`web/odp-contract.js`](web/odp-contract.js).
- Совместимость поведения протокола: on-chain `CONTRACT_VERSION`.
- Для текущей линии v0.2: `CONTRACT_VERSION = 2`.

### Компиляция

Для этого контракта:
- `optimizer.enabled = true` (рекомендуется `runs = 200`)
- `viaIR = true`

### Хостинг `passport.json`

Рекомендуемый путь:
- `https://host/path/<Passport ID>.json`

Где `<Passport ID>` — то же значение, что:
- JSON `passportId`
- ABI/wire `humanId` (историческое имя)

### Кошельки

Поддерживаются injected `window.ethereum` провайдеры (EIP-1193).  
WalletConnect-подобные сценарии по умолчанию в статическом UI не подключены.

## Структура репозитория

```
/
├── SPEC.md
├── SECURITY.md
├── RELEASE_v0.2.md
├── docs/
│   ├── README.md
│   ├── VERSIONING_AND_RELEASES.md
│   ├── V0.2-DRAFT.md
│   └── V0.3-DRAFT.md
├── contracts/
│   └── ObjectDigitalPassport.sol
├── deploy/
│   ├── hardhat.config.js
│   └── scripts/deploy.js
├── tools/
│   └── mint.py
└── web/
    ├── creator.html
    ├── passport.html
    └── verify.html
```

## Безопасность и модель верификации

Threat model и рекомендации:
- [`SECURITY.md`](SECURITY.md)

Основа доверия:
- on-chain хэши — источник истины;
- байты `passport.json` должны совпасть с `dataHash`;
- `manifest.json` в `.odp` — UX-метаданные, не trust anchor.

Нормативные правила:
- [`SPEC.md`](SPEC.md)

## Сеть и стоимость

Сеть:
- Polygon PoS (`chainId = 137`)
- Testnet: Amoy (`chainId = 80002`)

Типичные расходы v0.2:
- Регистрация профиля: ~US$0.01 (только gas)
- Mint паспорта: ~US$0.01 (только gas)
- Submit proof: ~US$0.01 (только gas)
- Verify/read: бесплатно

## Дорожная карта

- v0.2 — текущий PoC-базис.
- В линии 0.x изменения ожидаемы.
- v1.0 — целевая стабильная линия (см. docs по версиям).

Подробнее:
- [`docs/VERSIONING_AND_RELEASES.md`](docs/VERSIONING_AND_RELEASES.md)
- [`docs/V0.3-DRAFT.md`](docs/V0.3-DRAFT.md)
- RU draft: [`localization/ru/V0.3-DRAFT.md`](localization/ru/V0.3-DRAFT.md)

## Как вносить вклад

- Гайд: [`CONTRIBUTING.md`](CONTRIBUTING.md)
- Кодекс: [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md)
- Индекс docs: [`docs/README.md`](docs/README.md)

Приветствуются улучшения:
- текста спецификации,
- контракта и туллинга,
- UX и локализации.

## Автор и лицензия

Автор:
- Andrei Chernikov

Лицензия:
- [MIT](LICENSE)

