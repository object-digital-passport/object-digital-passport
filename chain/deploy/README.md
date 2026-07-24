# Деплой Object Digital Passport (Hardhat)

Краткая инструкция «с нуля» для Polygon **mainnet** (`polygon` в конфиге). Англоязычные комментарии в скриптах можно не трогать — ниже всё по шагам.

## Важно перед mainnet

1. **Лимит EIP-170 (24 576 байт на контракт при создании):** реестр **`ObjectDigitalPassport`** линкуется с библиотекой **`ODPPassportLib`** — сначала деплой библиотеки, затем реестра (так делает **`chain/deploy/scripts/deploy.js`**). После **`npm run compile`** из **корня репозитория** смотрите строку **`[ODP] EIP-170:`**: размер **основного** контракта должен быть **≤ 24 576** байт; у библиотеки свой лимит (она тоже должна укладываться — в референсной сборке оба укладываются). Подробности: **[`docs/EIP170_STRATEGY.md`](../../docs/EIP170_STRATEGY.md)**.
2. **Приватный ключ:** используйте **отдельный** кошелёк только под деплой/операции ODP, храните ключ только в `.env`, **никогда** не коммитьте `.env`.
3. **POL:** на кошельке деплоя должно быть достаточно **MATIC/POL** на gas (запас на **два** деплоя: библиотека + реестр, плюс опционально спутник `ODPWalletDocumentAnchor`).

В **`deployments/<сеть>.json`** сохраняется **`passportLibAddress`** (адрес **`ODPPassportLib`**) и **`contractAddress`** (реестр). Для верификации на Polygonscan нужны **оба** контракта и корректная линковка.

---

## Подготовка (один раз на машине)

Установите **Node.js** LTS (например с [nodejs.org](https://nodejs.org/)).

В терминале (из **корня** репозитория: `npm install` + `npm run compile`, либо из каталога **`chain/`**):

```bash
cd /path/to/object-digital-passport
npm install
```

---

## Настройка секретов

Рекомендуемый вариант — отдельная папка (файл не попадает в git): см. **[`user-setup/README.md`](user-setup/README.md)** (`private.local.env`).

Классический вариант:

```bash
cd deploy
cp .env.example .env
```

Откройте **`chain/deploy/.env`** в редакторе и заполните (либо используйте **`chain/deploy/user-setup/private.local.env`** — он перекрывает значения из `.env`):

- **`PRIVATE_KEY`** — приватный ключ кошелька деплоя **без** префикса `0x` (64 hex-символа).
- **`POLYGONSCAN_API_KEY`** — по желанию, для верификации контракта на Polygonscan (можно оставить заглушку, деплой без неё работает).

Сохраните файл. Проверьте, что `.env` **не** попал в git (`git status` не должен показывать `.env` как новый файл для коммита — он в `.gitignore`).

---

## Компиляция и проверка размера (обязательно перед mainnet)

```bash
npm run compile
```

В выводе смотрите строку **`[ODP] EIP-170:`** (размер реестра и библиотеки). Если реестр **> 24 576** байт — mainnet-деплой реестра отклонят; вернитесь к [`docs/EIP170_STRATEGY.md`](../../docs/EIP170_STRATEGY.md).

Локальная сеть EDR в **`hardhat.config.ts`** (сеть `default`) использует `allowUnlimitedContractSize: true` — это **только для тестов**; на Polygon лимит соблюдается.

---

## Деплой на Polygon mainnet

Убедитесь, что на кошельке есть POL. Затем:

```bash
npm run deploy:mainnet
```

Скрипт:

1. Задеплоит **`ODPPassportLib`** и связанный основной реестр **`ObjectDigitalPassport`**.
2. Попытается задеплоить **`ODPWalletDocumentAnchor`** (спутник для якорей файлов); при ошибке выведет предупреждение.
3. Попытается задеплоить **`ODPCounterfeitConcern`** (спутник: флаг «institutional concern» для **P/M**); при ошибке — предупреждение.
4. Попытается задеплоить **`ODPRegistryRelations`**, **`ODPPassportProofRegistry`** и **`ODPExtensionMintRouter`**; для relations/router также выполнит wiring вызовами `setRelationsSatellite(...)` и `setExtensionRouter(...)`.
5. Запишет **`deployments/polygon.json`** и **`deployments/abi.json`**.

После деплоя пропишите адреса в **`web/frontend/creator.html`**, **`web/frontend/passport.html`**, **`web/frontend/verify.html`**: как минимум **`NET.contract`**, а также **`NET.docAnchor`**, **`NET.counterfeitConcern`**, **`NET.relations`** и **`NET.proofRegistry`** (если соответствующие спутники задеплоены), и **`NET.contractGenerationFallback: 6`**. Перед mainnet-раскаткой сверьтесь с отчётом **EIP-170** из `npm run compile` (линия v0.6: реестр ≈ 13 309 байт из 24 576). Текущая линия: **[`docs/V0.6.md`](../../docs/V0.6.md)**; исторические указатели: **[`docs/V0.5.md`](../../docs/V0.5.md)**, **[`docs/V0.4.md`](../../docs/V0.4.md)**, **[`docs/V0.3.md`](../../docs/V0.3.md)**.

---

## Продолжить после успешного `ODPPassportLib`

Если полный **`deploy.js`** успешно задеплоил **`ODPPassportLib`**, а **`ObjectDigitalPassport`** не ушёл (например, не хватило POL на газ), **не** запускайте **`deploy.js`** снова — задеплоится вторая библиотека. Передайте адрес **уже существующей** библиотеки из лога:

```bash
ODP_PASSPORT_LIB_ADDRESS=0xYourLibFromLog npx hardhat run chain/deploy/scripts/deploy-resume-from-lib.js --network polygon
```

Либо:

```bash
npx hardhat run chain/deploy/scripts/deploy-resume-from-lib.js --network polygon -- --passport-lib 0xYourLibFromLog
```

Дальше скрипт делает то же, что **`deploy.js`** после библиотеки: связанный реестр, спутники, запись **`deployments/polygon.json`** и **`deployments/abi.json`**.

---

## Только спутник `ODPWalletDocumentAnchor` (реестр уже задеплоен)

Если основной **`ObjectDigitalPassport`** уже в сети, а **`ODPWalletDocumentAnchor`** не деплоили (или нужен новый адрес якоря):

```bash
ODP_REGISTRY_ADDRESS=0xYourObjectDigitalPassport npx hardhat run chain/deploy/scripts/deploy-doc-anchor-only.js --network polygon
```

Либо:

```bash
npx hardhat run chain/deploy/scripts/deploy-doc-anchor-only.js --network polygon -- --registry 0xYourObjectDigitalPassport
```

Скрипт проверит, что по адресу есть байткод, задеплоит спутник с **`constructor(registry)`**, обновит **`deployments/polygon.json`** (поле **`walletDocumentAnchorAddress`**). Дальше пропишите этот адрес в **`NET.docAnchor`** в **`web/frontend/verify.html`**.

Адреса эталонного деплоя — в таблице «Current Release» в **[`docs/GUIDE.md`](../../docs/GUIDE.md#current-release)** и в **[`SPEC.md`](../../SPEC.md)** §7. Файл **`deployments/polygon.json`** создаётся локально при вашем деплое и в репозиторий не коммитится.

---

## Только спутник `ODPCounterfeitConcern` (реестр уже задеплоен)

Если основной **`ObjectDigitalPassport`** уже в сети, а спутник **counterfeit** не деплоили (или нужен новый адрес):

```bash
ODP_REGISTRY_ADDRESS=0xYourObjectDigitalPassport npx hardhat run chain/deploy/scripts/deploy-counterfeit-concern-only.js --network polygon
```

Либо:

```bash
npx hardhat run chain/deploy/scripts/deploy-counterfeit-concern-only.js --network polygon -- --registry 0xYourObjectDigitalPassport
```

Скрипт задеплоит спутник с **`constructor(registry)`**, обновит **`deployments/polygon.json`** (поле **`counterfeitConcernAddress`**). Пропишите адрес в **`NET.counterfeitConcern`** в **`web/frontend/passport.html`**, **`web/frontend/verify.html`** (тот же **`NET.contract`**, что и у этого реестра).

---

## Оба спутника под уже существующий реестр

Один запуск: **`ODPWalletDocumentAnchor`** и **`ODPCounterfeitConcern`** (порядок как в полном **`deploy.js`**):

```bash
ODP_REGISTRY_ADDRESS=0xYourObjectDigitalPassport npx hardhat run chain/deploy/scripts/deploy-satellites-only.js --network polygon
```

Либо:

```bash
npx hardhat run chain/deploy/scripts/deploy-satellites-only.js --network polygon -- --registry 0xYourObjectDigitalPassport
```

Обновляются **`walletDocumentAnchorAddress`** и **`counterfeitConcernAddress`** в **`deployments/{polygon|amoy}.json`** (если деплой одного из контрактов упал — второй всё равно пробуется; в JSON попадут только успешные поля).

---

## (Опционально) Верификация на Polygonscan

Если в `.env` задан **`POLYGONSCAN_API_KEY`**, после деплоя можно верифицировать контракт через Hardhat/etherscan-плагин (команда зависит от вашей версии toolbox; при необходимости см. документацию Nomic Foundation).

---

## Тестнет Amoy (если понадобится проверить пайплайн)

```bash
npm run deploy:testnet
```

На Amoy лимит размера такой же, как на mainnet; для «большого» контракта деплой там тоже **не пройдёт**, пока байткод не уменьшат.

---

## Тесты без деплоя в сеть

```bash
npm test
```

(из корня репозитория.) Используется встроенная сеть EDR (`default`) с `allowUnlimitedContractSize`.
