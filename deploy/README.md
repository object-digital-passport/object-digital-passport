# Деплой Object Digital Passport (Hardhat)

Краткая инструкция «с нуля» для Polygon **mainnet** (`polygon` в конфиге). Англоязычные комментарии в скриптах можно не трогать — ниже всё по шагам.

## Важно перед mainnet

1. **Лимит EIP-170 (24 576 байт на контракт при создании):** реестр **`ObjectDigitalPassport`** линкуется с библиотекой **`ODPPassportLib`** — сначала деплой библиотеки, затем реестра (так делает **`scripts/deploy.js`**). После `npx hardhat compile` смотрите строку **`[ODP] EIP-170:`**: размер **основного** контракта должен быть **≤ 24 576** байт; у библиотеки свой лимит (она тоже должна укладываться — в референсной сборке оба укладываются). Подробности: **[`docs/EIP170_STRATEGY.md`](../docs/EIP170_STRATEGY.md)**.
2. **Приватный ключ:** используйте **отдельный** кошелёк только под деплой/операции ODP, храните ключ только в `.env`, **никогда** не коммитьте `.env`.
3. **POL:** на кошельке деплоя должно быть достаточно **MATIC/POL** на gas (запас на **два** деплоя: библиотека + реестр, плюс опционально спутник `ODPWalletDocumentAnchor`).

В **`deployments/<сеть>.json`** сохраняется **`passportLibAddress`** (адрес **`ODPPassportLib`**) и **`contractAddress`** (реестр). Для верификации на Polygonscan нужны **оба** контракта и корректная линковка.

---

## Подготовка (один раз на машине)

Установите **Node.js** LTS (например с [nodejs.org](https://nodejs.org/)).

В терминале:

```bash
cd deploy
npm install
```

---

## Настройка секретов

```bash
cd deploy
cp .env.example .env
```

Откройте **`deploy/.env`** в редакторе и заполните:

- **`PRIVATE_KEY`** — приватный ключ кошелька деплоя **без** префикса `0x` (64 hex-символа).
- **`POLYGONSCAN_API_KEY`** — по желанию, для верификации контракта на Polygonscan (можно оставить заглушку, деплой без неё работает).

Сохраните файл. Проверьте, что `.env` **не** попал в git (`git status` не должен показывать `.env` как новый файл для коммита — он в `.gitignore`).

---

## Компиляция и проверка размера (обязательно перед mainnet)

```bash
cd deploy
npx hardhat compile
```

В выводе смотрите строку **`[ODP] EIP-170:`** (размер реестра и библиотеки). Если реестр **> 24 576** байт — mainnet-деплой реестра отклонят; вернитесь к [`docs/EIP170_STRATEGY.md`](../docs/EIP170_STRATEGY.md).

Локальная сеть Hardhat в **`hardhat.config.js`** использует `allowUnlimitedContractSize: true` — это **только для тестов**; на Polygon лимит соблюдается.

---

## Деплой на Polygon mainnet

Убедитесь, что на кошельке есть POL. Затем:

```bash
cd deploy
npx hardhat run scripts/deploy.js --network polygon
```

Скрипт:

1. Задеплоит **`ObjectDigitalPassport`**.
2. Попытается задеплоить **`ODPWalletDocumentAnchor`** (спутник для якорей файлов); при ошибке выведет предупреждение.
3. Запишет **`deployments/polygon.json`** и **`deployments/abi.json`**.

Дальше по **[`RELEASE_v0.3.md`](../RELEASE_v0.3.md)**: прописать адрес контракта в **`web/creator.html`**, **`web/passport.html`**, **`web/verify.html`** (`NET.contract`), для v0.3+ при необходимости **`NET.docAnchor`** в **`verify.html`**.

---

## (Опционально) Верификация на Polygonscan

Если в `.env` задан **`POLYGONSCAN_API_KEY`**, после деплоя можно верифицировать контракт через Hardhat/etherscan-плагин (команда зависит от вашей версии toolbox; при необходимости см. документацию Nomic Foundation).

---

## Тестнет Amoy (если понадобится проверить пайплайн)

```bash
cd deploy
npx hardhat run scripts/deploy.js --network amoy
```

На Amoy лимит размера такой же, как на mainnet; для «большого» контракта деплой там тоже **не пройдёт**, пока байткод не уменьшат.

---

## Тесты без деплоя в сеть

```bash
cd deploy
npm test
```

Используется встроенная сеть Hardhat с `allowUnlimitedContractSize`.
