# Локальные настройки деплоя (без Remix)

Всё секретное хранится только в **`private.local.env`**. Этот файл **не коммитится** в git.

## Шаг 1 — один раз

```bash
cd chain/deploy/user-setup
cp private.local.env.example private.local.env
```

Откройте **`private.local.env`** в редакторе и заполните **`PRIVATE_KEY`**.

**Важно:** ключ вставляйте только в **`private.local.env`**, не в **`private.local.env.example`** (пример может попасть в git).

## Шаг 2 — деплой

**Вариант A — скрипт из корня репозитория (компиляция + деплой):**

```bash
./deploy/deploy.sh              # Amoy (testnet), по умолчанию
./deploy/deploy.sh polygon      # Polygon mainnet
```

**Вариант B — вручную из корня репозитория:**

```bash
npm run deploy:testnet    # Amoy
npm run deploy:mainnet    # Polygon
# или
npx hardhat run chain/deploy/scripts/deploy.js --network polygon
npx hardhat run chain/deploy/scripts/deploy.js --network amoy
```

После деплоя адреса и ABI пишутся в `chain/deploy/deployments/` (`amoy.json` / `polygon.json`, `abi.json`).

## Что можно попросить изменить в репозитории (в чате Cursor / у ассистента)

Можно передавать **только не-секретные** вещи, например:

- «Добавь в `private.local.env.example` комментарий про …»
- «Поменяй дефолтный `POLYGON_RPC_URL` в `hardhat.config.ts` на публичный …» (без вашего API key)
- «Добавь сеть `localhost` в Hardhat»

## Что нельзя присылать в чат

- **`PRIVATE_KEY`** и любые копии кошелька
- Полные URL вида `https://…alchemy…/v2/РЕАЛЬНЫЙ_КЛЮЧ`
- Скриншоты или текст файла **`private.local.env`** с заполненными значениями

Секреты вставляете **сами локально** в `private.local.env`; ассистент правит только шаблоны и код в репо.

## Если снова 403 / «API key disabled»

Часто виноват **`POLYGON_RPC_URL` в профиле shell** (`~/.zshrc`) со старым Alchemy — Hardhat его больше не читает для Polygon. Укажите рабочий URL в **`private.local.env`**:

- **`ODP_POLYGON_RPC_URL`** — mainnet  
- **`ODP_AMOY_RPC_URL`** — Amoy  

По умолчанию mainnet идёт через публичный **`publicnode.com`** (можно не задавать, если всё ок).
