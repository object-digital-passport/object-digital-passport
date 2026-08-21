# Object Digital Passport — примечания к релизу · v0.3

Здесь описано **только, чем эталонная линия v0.3 отличается от v0.2** (поверхность протокола, расклад байткода и форма деплоя). Это **не** полное операторское руководство. Нормативный протокол — **[`SPEC.md`](SPEC.md)** (перевод); английский оригинал — **[`../../../SPEC.md`](../../SPEC.md)**. **Свой деплой**, настройка **`NET.*`**, дымовые проверки и инструменты — **[`../../../chain/deploy/README.md`](../../chain/deploy/README.md)**, **[`../../../README.md`](../../README.md)**, **[`../../../chain/tools/README.md`](../../chain/tools/README.md)**.

## Что изменилось относительно v0.2 (кратко)

**Продукт on-chain (vs реестр формата v0.2):** в v0.3 добавлены **владение паспортом**, **агент публикации в привязке к аккаунту** (кто может вызывать **`updatePassportUrls`**), **необратимая отмена паспорта**, **управление** (один on-chain-адрес), **до трёх хэшей изображений** on-chain, опциональные **`auxCommitmentHash` / `auxCommitmentUri`**, **минты через расширения** (**`mintDigitalViaExtension`**, **`mintPhysicalViaExtension`**) с **`ExtensionMintUsed`**, **жизненный цикл P-аффилиации**, опциональный экспорт **DID** — нормативно в [`SPEC.md`](SPEC.md).

**Байткод (EIP-170) — убрано или вынесено относительно *основного* реестра v0.2:** в эталонном **v0.3** **`ObjectDigitalPassport`** **нет** части точек входа **v0.2** — в частности **`resolvePassport`**, **`getProofsForPassportPaged`**, **`attestExternalDocument` / `getExternalDocumentAttestation`** на основном контракте, on-chain **counterfeit concern**, длинные **`require`** для **P** (заменены на **`EC(71)`**). Верификаторы используют **`getPassport` + `getCreator` + `getProofsForPassport`**; для больших списков — **`getPassportsByCreatorPaged`** и **`getPAffiliatedChildrenPaged`**. Тяжёлая **чистая** логика — в связанной библиотеке **`ODPPassportLib`** ([`../../../chain/contracts/ODPPassportLib.sol`](../../chain/contracts/ODPPassportLib.sol)), чтобы реестр уложился в **лимит 24 КиБ**. **Привязка SHA-256 файла на кошельке** для v0.3+ — в отдельном контракте **`ODPWalletDocumentAnchor`** ([`../../../chain/contracts/ODPWalletDocumentAnchor.sol`](../../chain/contracts/ODPWalletDocumentAnchor.sol)), деплой **после** реестра; эталонная **Проверка** использует **`NET.docAnchor`** при поколении **≥ 3**; **`auxCommitment*`** на паспорт остаются на основном реестре.

**Претензия к подделке on-chain:** **`raiseCounterfeitConcern`** и связанное есть на типичных **основных реестрах v0.2**, но **убраны** из эталонного байткода основного реестра **v0.3** (EIP-170). В **будущей** спецификации механизм **может** вернуться или быть заменён — см. **`SPEC.md`**.

**Без изменений относительно v0.2 (напоминание):** **платы протокола нет** — только **газ сети**. **Управление** — по-прежнему **один** `address` (может указывать на мультисиг/Safe вне цепи; отдельного институционального мультиcига **внутри** байткода нет).

**Эталонный деплой Polygon:** в **`../../../chain/deploy/deployments/polygon.json`** есть **`walletDocumentAnchorAddress`** рядом с основным реестром — таблица **«Текущий релиз»** в [`../../../README.md`](../../README.md) и [`README.md`](../../web/frontend/localization/ru/README.md#текущий-релиз). Если **`ObjectDigitalPassport`** уже задеплоен без якоря — **[`../../../chain/deploy/scripts/deploy-doc-anchor-only.js`](../../chain/deploy/scripts/deploy-doc-anchor-only.js)** (см. **`../../../chain/deploy/README.md`**) и **`NET.docAnchor`** в **`../../../web/verify.html`**.

## Новая или изменённая поверхность контракта (vs реестр v0.2)

- **Владелец:** `transferPassport`, `updatePassportUrls` (владелец, создатель или агент публикации по спецификации).
- **Кошелёк эмитента:** `delegateCreatorPublishing`, `revokeCreatorPublishing`.
- **Создатель или governance:** `revokePassport(humanId, reasonHash)` с ненулевым `reasonHash`.
- **Только governance:** `transferGovernance`, `setMintExtension` — **`mintDigitalViaExtension`** / **`mintPhysicalViaExtension`** и **`ExtensionMintUsed`** (см. [`SPEC.md`](SPEC.md)); примеры: **[`../../../chain/contracts/examples/ODPPassThroughDigitalExtension.sol`](../../chain/contracts/examples/ODPPassThroughDigitalExtension.sol)**, **[`../../../chain/contracts/examples/ODPPassThroughPhysicalExtension.sol`](../../chain/contracts/examples/ODPPassThroughPhysicalExtension.sol)**.
- **Создатель или governance:** **`updatePassportAuxCommitment`** — **`PassportAuxCommitmentUpdated`**.
- **Родитель P:** `detachPAffiliation`; предложение/подтверждение/отмена аффилиации — в **Профиле** ([`../../creator.html`](../../web/frontend/creator.html)).

## См. также

- **[`SPEC.md`](SPEC.md)** — полный протокол (все версии).
- **[`../../../docs/V0.3.md`](../../docs/V0.3.md)** — короткий указатель и заметки в стиле changelog.
