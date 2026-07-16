/**
 * ODP — shared helpers for contract generation detection and ABI selection.
 * README: site semver 0.X.Y vs on-chain deployment generation (CONTRACT_VERSION uint8).
 *
 * Naming: v0.4 registries use `passportId` or legacy `humanId` for the Passport ID string (same packed `CONTRACT_VERSION` — see `odpPassportIdAbiName`). `creatorId` is the profile ID (`C-…` / `B-…` / `P-…` / `M-…`).
 */
(function (global) {
  "use strict";

  /** Static site / repo release: bump Y for docs-only; bump X with new contract (see README). */
  var ODP_SITE_VERSION = "0.5.0";

  var CV_ABI = [
    { name: "CONTRACT_VERSION", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
  ];

  /** Shown when `NET.contract` probes as legacy (on-chain byte 0). This UI targets v0.2+ only. */
  var ODP_UNSUPPORTED_LEGACY_CONTRACT_MSG =
    "This site does not support legacy deployments (on-chain CONTRACT_VERSION 0 — v0.1 fee-era). Set NET.contract to a v0.2+ registry address.";

  function odpProtocolFeeWei(generation, ethersRef) {
    var E = ethersRef || global.ethers;
    return E.BigNumber.from(0);
  }

  function odpSupportsFolderBaseMint(generation) {
    return generation >= 2;
  }

  function odpSupportsOptionalDataUrl(generation) {
    return generation >= 2;
  }

  function odpSupportsV03(generation) {
    return generation >= 3;
  }

  function odpSupportsContentClass(generation) {
    return generation >= 5;
  }

  /** Spec 0.6 storage model (nicknamed "v2"): on-chain card, anchors, append-only events. */
  function odpSupportsV06(generation) {
    return generation >= 6;
  }

  /**
   * Known Polygon mainnet v0.4 deployment whose ABI still used `humanId` (before redeploy with `passportId`).
   * New registry at another address with the same packed `CONTRACT_VERSION` uses `passportId`.
   */
  var ODP_LEGACY_V04_HUMANID_ABI_POLYGON = "0xbf3398e16af6ae7ab41524bee3570fa36c219e75";

  /** First tuple / param name for on-chain Passport ID (`passportId` vs legacy `humanId`). */
  function odpPassportIdAbiName(generation, net) {
    if (!odpSupportsV03(generation)) return "humanId";
    if (generation < 4) return "humanId";
    var n = net || {};
    if (typeof n.abiPassportId === "boolean") return n.abiPassportId ? "passportId" : "humanId";
    var cid = n.chainId != null ? Number(n.chainId) : 137;
    var addr = n.contract ? String(n.contract).trim().toLowerCase() : "";
    if (cid === 137 && addr === ODP_LEGACY_V04_HUMANID_ABI_POLYGON) return "humanId";
    return "passportId";
  }

  /** ABI for `ODPCounterfeitConcern` (satellite) — same method names as legacy v0.2 monolith. */
  function odpCounterfeitConcernAbiFragments() {
    return [
      {
        name: "raiseCounterfeitConcern",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
          { name: "passportId", type: "string" },
          { name: "reasonHash", type: "bytes32" },
        ],
        outputs: [],
      },
      {
        name: "clearCounterfeitConcern",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [{ name: "passportId", type: "string" }],
        outputs: [],
      },
      {
        name: "getCounterfeitConcern",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "passportId", type: "string" }],
        outputs: [
          { name: "active", type: "bool" },
          { name: "proverCreatorId", type: "string" },
          { name: "reasonHash", type: "bytes32" },
          { name: "timestamp", type: "uint256" },
        ],
      },
    ];
  }

  function odpRegistryAddressesMatch(a, b) {
    if (a == null || b == null) return false;
    return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
  }

  function odpCounterfeitSatelliteAddress(net) {
    if (!net || net.counterfeitConcern == null) return null;
    var d = String(net.counterfeitConcern).trim();
    return /^0x[a-fA-F0-9]{40}$/i.test(d) ? d : null;
  }

  /**
   * Read counterfeit concern from main registry (if present) or from `NET.counterfeitConcern` when paired with `NET.contract`.
   * @param {*} mainContract ethers Contract for registry
   * @param {*} net page config with `contract`, optional `counterfeitConcern`
   * @param {number} generation probed CONTRACT_VERSION (packed)
   * @param {*} providerOrSigner ethers provider or signer
   */
  function odpCounterfeitReadContract(mainContract, net, generation, providerOrSigner) {
    if (!mainContract) return null;
    if (typeof mainContract.getCounterfeitConcern === "function") return mainContract;
    var sat = odpCounterfeitSatelliteAddress(net);
    if (!sat || !odpRegistryAddressesMatch(net.contract, mainContract.address)) return null;
    if (typeof odpSupportsV03 === "function" && !odpSupportsV03(generation)) return null;
    if (!providerOrSigner || typeof global.ethers === "undefined") return null;
    return new global.ethers.Contract(sat, odpCounterfeitConcernAbiFragments(), providerOrSigner);
  }

  function odpCounterfeitWriteContract(mainContract, net, generation, signer) {
    if (!mainContract || !signer) return null;
    if (typeof mainContract.raiseCounterfeitConcern === "function") return mainContract;
    var sat = odpCounterfeitSatelliteAddress(net);
    if (!sat || !odpRegistryAddressesMatch(net.contract, mainContract.address)) return null;
    if (typeof odpSupportsV03 === "function" && !odpSupportsV03(generation)) return null;
    if (typeof global.ethers === "undefined") return null;
    return new global.ethers.Contract(sat, odpCounterfeitConcernAbiFragments(), signer);
  }

  function odpSatelliteAddress(net, key) {
    if (!net || net[key] == null) return null;
    var d = String(net[key]).trim();
    return /^0x[a-fA-F0-9]{40}$/i.test(d) ? d : null;
  }

  function odpProofRegistryAbiFragments(generation, net) {
    var pid = odpPassportIdAbiName(generation, net);
    return [
      {
        name: "submitProof",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
          { name: pid, type: "string" },
          { name: "noteHash", type: "bytes32" },
          { name: "noteUrl", type: "string" },
          { name: "year", type: "uint32" },
          { name: "month", type: "uint8" },
        ],
        outputs: [{ name: "proofId", type: "string" }],
      },
      {
        name: "getProofsByInstitution",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "creatorId", type: "string" }],
        outputs: [{ name: "", type: "string[]" }],
      },
      {
        name: "getProofsForPassport",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: pid, type: "string" }],
        outputs: [{ name: "", type: "string[]" }],
      },
      {
        name: "getProof",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "proofId", type: "string" }],
        outputs: [
          {
            name: "",
            type: "tuple",
            components: [
              { name: "proofId", type: "string" },
              { name: "contractVersion", type: "uint8" },
              { name: "prover", type: "string" },
              { name: pid, type: "string" },
              { name: "noteHash", type: "bytes32" },
              { name: "noteUrl", type: "string" },
              { name: "timestamp", type: "uint256" },
            ],
          },
        ],
      },
    ];
  }

  function odpRelationsAbiFragments() {
    return [
      { name: "proposePAffiliation", type: "function", stateMutability: "nonpayable", inputs: [{ name: "parentPId", type: "string" }], outputs: [] },
      { name: "confirmPAffiliation", type: "function", stateMutability: "nonpayable", inputs: [{ name: "childPId", type: "string" }], outputs: [] },
      { name: "cancelPAffiliationRequest", type: "function", stateMutability: "nonpayable", inputs: [{ name: "parentPId", type: "string" }], outputs: [] },
      { name: "detachPAffiliation", type: "function", stateMutability: "nonpayable", inputs: [{ name: "childPId", type: "string" }], outputs: [] },
      { name: "isPAffiliationPending", type: "function", stateMutability: "view", inputs: [{ name: "parentPId", type: "string" }, { name: "childPId", type: "string" }], outputs: [{ name: "", type: "bool" }] },
      { name: "getPAffiliatedParent", type: "function", stateMutability: "view", inputs: [{ name: "childPId", type: "string" }], outputs: [{ name: "", type: "string" }] },
      { name: "getPAffiliatedChildren", type: "function", stateMutability: "view", inputs: [{ name: "parentPId", type: "string" }], outputs: [{ name: "", type: "string[]" }] },
      {
        name: "getPAffiliationAudit",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "childPId", type: "string" }],
        outputs: [
          { name: "activeParent", type: "string" },
          { name: "joinedAt", type: "uint256" },
          { name: "detachedAt", type: "uint256" },
          { name: "lastDetachedFromParent", type: "string" },
        ],
      },
      {
        name: "getPAffiliatedChildrenPaged",
        type: "function",
        stateMutability: "view",
        inputs: [
          { name: "parentPId", type: "string" },
          { name: "offset", type: "uint256" },
          { name: "limit", type: "uint256" },
        ],
        outputs: [
          { name: "result", type: "string[]" },
          { name: "total", type: "uint256" },
        ],
      },
      { name: "delegateCreatorPublishing", type: "function", stateMutability: "nonpayable", inputs: [{ name: "agent", type: "address" }, { name: "expiresAt", type: "uint256" }], outputs: [] },
      { name: "revokeCreatorPublishing", type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] },
      {
        name: "getCreatorPublishingDelegation",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "creatorWallet", type: "address" }],
        outputs: [
          { name: "agent", type: "address" },
          { name: "expiresAt", type: "uint256" },
        ],
      },
      { name: "requestMintAgentRole", type: "function", stateMutability: "nonpayable", inputs: [{ name: "principalCreatorId", type: "string" }], outputs: [] },
      { name: "confirmMintAgentRole", type: "function", stateMutability: "nonpayable", inputs: [{ name: "agent", type: "address" }], outputs: [] },
      { name: "revokeMintAgentRole", type: "function", stateMutability: "nonpayable", inputs: [], outputs: [] },
      { name: "renounceMintAgentRole", type: "function", stateMutability: "nonpayable", inputs: [{ name: "principalCreatorId", type: "string" }], outputs: [] },
      { name: "cancelMintAgentRequest", type: "function", stateMutability: "nonpayable", inputs: [{ name: "principalCreatorId", type: "string" }], outputs: [] },
      { name: "mintAgentForCreator", type: "function", stateMutability: "view", inputs: [{ name: "creatorId", type: "string" }], outputs: [{ name: "", type: "address" }] },
      { name: "mintAgentDelegationPending", type: "function", stateMutability: "view", inputs: [{ name: "key", type: "bytes32" }], outputs: [{ name: "", type: "bool" }] },
    ];
  }

  function odpProofReadContract(mainContract, net, generation, providerOrSigner) {
    var sat = odpSatelliteAddress(net, "proofRegistry");
    if (!sat || !mainContract || !providerOrSigner || typeof global.ethers === "undefined") return mainContract;
    if (!odpRegistryAddressesMatch(net.contract, mainContract.address)) return mainContract;
    return new global.ethers.Contract(sat, odpProofRegistryAbiFragments(generation, net), providerOrSigner);
  }

  function odpProofWriteContract(mainContract, net, generation, signer) {
    return odpProofReadContract(mainContract, net, generation, signer);
  }

  function odpRelationsReadContract(mainContract, net, providerOrSigner) {
    var sat = odpSatelliteAddress(net, "relations");
    if (!sat || !mainContract || !providerOrSigner || typeof global.ethers === "undefined") return mainContract;
    if (!odpRegistryAddressesMatch(net.contract, mainContract.address)) return mainContract;
    return new global.ethers.Contract(sat, odpRelationsAbiFragments(), providerOrSigner);
  }

  function odpRelationsWriteContract(mainContract, net, signer) {
    return odpRelationsReadContract(mainContract, net, signer);
  }

  async function odpListCreatorPassports(mainContract, creator, pageSize) {
    var size = Math.max(1, Number(pageSize || 100));
    if (!mainContract || !creator) return [];
    if (typeof mainContract.getPassportsByCreatorPaged !== "function") {
      return typeof mainContract.getPassportsByCreator === "function" ? mainContract.getPassportsByCreator(creator) : [];
    }
    var all = [];
    var offset = 0;
    for (;;) {
      var page = await mainContract.getPassportsByCreatorPaged(creator, offset, size);
      var rows = page && page.result ? page.result : page[0];
      var total = page && page.total != null ? Number(page.total) : Number(page[1] || 0);
      rows = Array.isArray(rows) ? rows : [];
      all = all.concat(rows);
      offset += rows.length;
      if (!rows.length || (total && offset >= total)) break;
      if (rows.length < size && !total) break;
    }
    return all;
  }

  async function odpEstimateRemainingMints(mainContract, wallet) {
    if (!mainContract || !wallet || typeof mainContract.getCreatorByWallet !== "function" || typeof mainContract.getCreator !== "function") {
      return null;
    }
    var creatorId = await mainContract.getCreatorByWallet(wallet);
    if (!creatorId) return { remaining: 0, limit: 0, used: 0, unlimited: false };
    var creator = await mainContract.getCreator(creatorId);
    var typePrefix = creator && creator.typePrefix != null ? String(creator.typePrefix) : "";
    if (typePrefix === "P" || typePrefix === "M") {
      return { remaining: null, limit: null, used: 0, unlimited: true };
    }
    var limit = typePrefix === "B" ? 100000 : 1000;
    var ids = await odpListCreatorPassports(mainContract, wallet, 100);
    var now = new Date();
    var year = now.getUTCFullYear();
    var month = now.getUTCMonth() + 1;
    var used = 0;
    for (var i = 0; i < ids.length; i++) {
      try {
        var header = await mainContract.getPassportHeader(ids[i]);
        var hy = Number(header && header.year != null ? header.year : 0);
        var hm = Number(header && header.month != null ? header.month : 0);
        if (hy === year && hm === month) used++;
      } catch (_) {}
    }
    return { remaining: Math.max(0, limit - used), limit: limit, used: used, unlimited: false };
  }

  /** getPassport passport tuple — v0.2 layout (CONTRACT_VERSION packed < 3). */
  function odpPassportTupleComponentsV02() {
    return [
      { name: "humanId", type: "string" },
      { name: "contractVersion", type: "uint8" },
      { name: "creator", type: "address" },
      { name: "creatorId", type: "string" },
      { name: "year", type: "uint32" },
      { name: "month", type: "uint8" },
      { name: "objectType", type: "string" },
      { name: "dataHash", type: "bytes32" },
      { name: "imageHash", type: "bytes32" },
      { name: "fileHash", type: "bytes32" },
      { name: "sealType", type: "uint8" },
      { name: "sealHash", type: "bytes32" },
      { name: "nfcPublicKey", type: "bytes" },
      { name: "nfcModel", type: "string" },
      { name: "dataUrl", type: "string" },
      { name: "imageUrl", type: "string" },
      { name: "timestamp", type: "uint256" },
    ];
  }

  /** v0.3+: owner, extra image hashes/URLs, revocation fields. */
  function odpPassportTupleComponentsV03(generation, net) {
    var idn = odpPassportIdAbiName(generation, net);
    var out = [
      { name: idn, type: "string" },
      { name: "contractVersion", type: "uint8" },
      { name: "creator", type: "address" },
      { name: "owner", type: "address" },
      { name: "creatorId", type: "string" },
      { name: "year", type: "uint32" },
      { name: "month", type: "uint8" },
      { name: "objectType", type: "string" },
      { name: "dataHash", type: "bytes32" },
      { name: "imageHash", type: "bytes32" },
      { name: "imageHash2", type: "bytes32" },
      { name: "imageHash3", type: "bytes32" },
      { name: "fileHash", type: "bytes32" },
      { name: "sealType", type: "uint8" },
      { name: "sealHash", type: "bytes32" },
      { name: "nfcPublicKey", type: "bytes" },
      { name: "nfcModel", type: "string" },
      { name: "dataUrl", type: "string" },
      { name: "imageUrl", type: "string" },
      { name: "imageUrl2", type: "string" },
      { name: "imageUrl3", type: "string" },
      { name: "timestamp", type: "uint256" },
      { name: "revoked", type: "bool" },
      { name: "revokedAt", type: "uint256" },
      { name: "revocationReasonHash", type: "bytes32" },
      { name: "auxCommitmentHash", type: "bytes32" },
      { name: "auxCommitmentUri", type: "string" },
      { name: "mintAgent", type: "address" },
    ];
    if (odpSupportsContentClass(generation)) {
      out.splice(8, 0, { name: "contentClass", type: "uint8" });
    }
    return out;
  }

  function odpPassportTupleComponentsV05(generation, net) {
    var idn = odpPassportIdAbiName(generation, net);
    return [
      { name: idn, type: "string" },
      { name: "contractVersion", type: "uint8" },
      { name: "creator", type: "address" },
      { name: "owner", type: "address" },
      { name: "creatorId", type: "string" },
      { name: "year", type: "uint32" },
      { name: "month", type: "uint8" },
      { name: "title", type: "string" },
      { name: "domain", type: "string" },
      { name: "objectType", type: "string" },
      { name: "contentClass", type: "uint8" },
      { name: "lifecycleStatus", type: "uint8" },
      { name: "aiStatus", type: "uint8" },
      { name: "verificationMethod", type: "uint8" },
      { name: "editionModel", type: "uint8" },
      { name: "currentLocation", type: "string" },
      { name: "rightsNote", type: "string" },
      { name: "conditionNote", type: "string" },
      { name: "damageHistoryHash", type: "bytes32" },
      { name: "damageHistoryUrl", type: "string" },
      { name: "dataHash", type: "bytes32" },
      { name: "imageHash", type: "bytes32" },
      { name: "imageHash2", type: "bytes32" },
      { name: "imageHash3", type: "bytes32" },
      { name: "fileHash", type: "bytes32" },
      { name: "sealType", type: "uint8" },
      { name: "sealHash", type: "bytes32" },
      { name: "nfcPublicKey", type: "bytes" },
      { name: "nfcModel", type: "string" },
      { name: "dataUrl", type: "string" },
      { name: "imageUrl", type: "string" },
      { name: "imageUrl2", type: "string" },
      { name: "imageUrl3", type: "string" },
      { name: "timestamp", type: "uint256" },
      { name: "revoked", type: "bool" },
      { name: "revokedAt", type: "uint256" },
      { name: "revocationReasonHash", type: "bytes32" },
      { name: "auxCommitmentHash", type: "bytes32" },
      { name: "auxCommitmentUri", type: "string" },
      { name: "ndppCommitmentHash", type: "bytes32" },
      { name: "ndppCommitmentUri", type: "string" },
      { name: "mintAgent", type: "address" },
    ];
  }

  function odpPassportTupleComponents(generation, net) {
    if (generation >= 5) return odpPassportTupleComponentsV05(generation, net);
    return odpSupportsV03(generation) ? odpPassportTupleComponentsV03(generation, net) : odpPassportTupleComponentsV02();
  }

  function odpPassportHeaderViewComponents(generation, net) {
    var idn = odpPassportIdAbiName(generation, net);
    if (odpSupportsV06(generation)) {
      return [
        { name: idn, type: "string" },
        { name: "contractVersion", type: "uint8" },
        { name: "creator", type: "address" },
        { name: "owner", type: "address" },
        { name: "creatorId", type: "string" },
        { name: "year", type: "uint32" },
        { name: "month", type: "uint8" },
        { name: "title", type: "string" },
        { name: "authorName", type: "string" },
        { name: "shortDescription", type: "string" },
        { name: "domain", type: "string" },
        { name: "objectType", type: "string" },
      ];
    }
    return [
      { name: idn, type: "string" },
      { name: "contractVersion", type: "uint8" },
      { name: "creator", type: "address" },
      { name: "owner", type: "address" },
      { name: "creatorId", type: "string" },
      { name: "year", type: "uint32" },
      { name: "month", type: "uint8" },
      { name: "title", type: "string" },
      { name: "domain", type: "string" },
      { name: "objectType", type: "string" },
    ];
  }

  function odpPassportClassificationViewComponents() {
    return [
      { name: "contentClass", type: "uint8" },
      { name: "lifecycleStatus", type: "uint8" },
      { name: "aiStatus", type: "uint8" },
      { name: "verificationMethod", type: "uint8" },
      { name: "editionModel", type: "uint8" },
      { name: "timestamp", type: "uint256" },
      { name: "revoked", type: "bool" },
      { name: "revokedAt", type: "uint256" },
      { name: "revocationReasonHash", type: "bytes32" },
      { name: "mintAgent", type: "address" },
    ];
  }

  function odpPassportMediaViewComponents(generation) {
    if (odpSupportsV06(generation)) {
      return [
        { name: "dataHash", type: "bytes32" },
        { name: "dataUrl", type: "string" },
        { name: "imageHash", type: "bytes32" },
        { name: "imageUrl", type: "string" },
        { name: "fileHash", type: "bytes32" },
        { name: "anchorsHash", type: "bytes32" },
        { name: "anchorTypesMask", type: "uint32" },
      ];
    }
    return [
      { name: "dataHash", type: "bytes32" },
      { name: "dataUrl", type: "string" },
      { name: "imageHash", type: "bytes32" },
      { name: "imageUrl", type: "string" },
      { name: "imageHash2", type: "bytes32" },
      { name: "imageUrl2", type: "string" },
      { name: "imageHash3", type: "bytes32" },
      { name: "imageUrl3", type: "string" },
      { name: "fileHash", type: "bytes32" },
    ];
  }

  /** Spec 0.6 (gen >= 6): append-only event summary view. */
  function odpPassportEventsViewComponents() {
    return [
      { name: "eventCount", type: "uint32" },
      { name: "lastEventKind", type: "uint8" },
      { name: "lastEventAt", type: "uint256" },
      { name: "lifecycleStatus", type: "uint8" },
    ];
  }

  function odpPassportPhysicalViewComponents() {
    return [
      { name: "sealType", type: "uint8" },
      { name: "sealHash", type: "bytes32" },
      { name: "nfcPublicKey", type: "bytes" },
      { name: "nfcModel", type: "string" },
    ];
  }

  function odpPassportStateViewComponents() {
    return [
      { name: "currentLocation", type: "string" },
      { name: "rightsNote", type: "string" },
      { name: "conditionNote", type: "string" },
      { name: "damageHistoryHash", type: "bytes32" },
      { name: "damageHistoryUrl", type: "string" },
      { name: "auxCommitmentHash", type: "bytes32" },
      { name: "auxCommitmentUri", type: "string" },
      { name: "ndppCommitmentHash", type: "bytes32" },
      { name: "ndppCommitmentUri", type: "string" },
    ];
  }

  function odpRegistrySessionKey(chainId) {
    return "odp_registry_contract_" + String(chainId != null ? chainId : 137);
  }

  /** True if `net.contract` looks like a 20-byte hex address (EIP-55 not required). */
  function odpHasValidRegistryAddress(net) {
    if (!net) return false;
    var c = String(net.contract || "").trim();
    return /^0x[a-fA-F0-9]{40}$/i.test(c);
  }

  /** Short neutral banner HTML when the site build has no registry address (GitHub Pages / local). */
  function odpRegistryMisconfiguredBannerHtml(isLocal) {
    var readmeUrl = "https://github.com/object-digital-passport/object-digital-passport/blob/main/README.md";
    try {
      var loc = window.localStorage && window.localStorage.getItem("odp_locale");
      if (loc === "ru") {
        readmeUrl = "https://github.com/object-digital-passport/object-digital-passport/blob/main/web/frontend/localization/ru/README.md";
      }
    } catch (eLoc) {}
    if (isLocal) {
      return (
        '<div class="info neutral" style="line-height:1.55">Set <code>NET.contract</code>, add <code>registry-config.json</code>, or open once with <code>?contract=0x…</code> (40 hex chars).</div>'
      );
    }
    return (
      '<div class="info neutral" style="line-height:1.55">Set repository <strong>secret</strong> or <strong>variable</strong> <code>ODP_CONTRACT_ADDRESS</code> under <strong>Settings → Secrets and variables → Actions</strong>, then redeploy. Or open this page once with <code>?contract=0x…</code> in the URL. <a href="' + readmeUrl + '" target="_blank" rel="noopener noreferrer">See README</a>.</div>'
    );
  }

  /**
   * Sync: URL `?contract=0x…` / `?odp_contract=0x…`, then sessionStorage, then localStorage (per chainId).
   */
  function odpApplyInlineRegistryOverrides(net) {
    if (!net) return;
    var existing = String(net.contract || "").trim();
    if (existing && /^0x[a-fA-F0-9]{40}$/i.test(existing)) return;
    try {
      if (typeof global.location !== "undefined" && global.location.search) {
        var q = new URLSearchParams(global.location.search);
        var fromQ = q.get("contract") || q.get("odp_contract") || q.get("registry");
        if (fromQ && /^0x[a-fA-F0-9]{40}$/i.test(fromQ.trim())) {
          net.contract = fromQ.trim();
          return;
        }
      }
      if (global.sessionStorage) {
        var s = global.sessionStorage.getItem(odpRegistrySessionKey(net.chainId));
        if (s && /^0x[a-fA-F0-9]{40}$/i.test(s.trim())) {
          net.contract = s.trim();
          return;
        }
      }
      if (global.localStorage) {
        var ls = global.localStorage.getItem(odpRegistrySessionKey(net.chainId));
        if (ls && /^0x[a-fA-F0-9]{40}$/i.test(ls.trim())) {
          net.contract = ls.trim();
        }
      }
    } catch (e0) {}
  }

  /** Remember registry address after a successful wallet session (sessionStorage + localStorage for stale-cache first loads). */
  function odpPersistRegistryContractToSession(net) {
    if (!net) return;
    var c = String(net.contract || "").trim();
    if (!c || !/^0x[a-fA-F0-9]{40}$/i.test(c)) return;
    var k = odpRegistrySessionKey(net.chainId);
    try {
      if (global.sessionStorage) global.sessionStorage.setItem(k, c);
    } catch (e1) {}
    try {
      if (global.localStorage) global.localStorage.setItem(k, c);
    } catch (e2) {}
  }

  /**
   * If `net.contract` is empty (stale cached HTML / JSON on first visit), load `registry-config.json`
   * next to the page. First `no-store`, then `reload` if still empty (bypasses some CDN/browser caches).
   */
  function odpMergeRegistryConfigAsync(net) {
    odpApplyInlineRegistryOverrides(net);
    if (!net) return Promise.resolve();
    if (odpHasValidRegistryAddress(net)) {
      return Promise.resolve();
    }
    if (typeof global.location === "undefined" || !global.location || !global.location.href) {
      return Promise.resolve();
    }

    function fetchAndMerge(cacheMode) {
      var url = new URL("backend/config/registry-config.json", global.location.href);
      url.searchParams.set("_", String(Date.now()) + "_" + Math.random().toString(16).slice(2));
      return global
        .fetch(url.toString(), {
          cache: cacheMode || "no-store",
          headers: { Pragma: "no-cache" },
        })
        .then(function (r) {
          if (!r.ok) return null;
          return r.json();
        })
        .then(function (j) {
          var c = j && j.contract != null ? String(j.contract).trim() : "";
          if (odpHasValidRegistryAddress({ contract: c, chainId: net.chainId })) {
            net.contract = c;
            try {
              var k = odpRegistrySessionKey(net.chainId);
              if (global.sessionStorage) global.sessionStorage.setItem(k, c);
              if (global.localStorage) global.localStorage.setItem(k, c);
            } catch (e2) {}
          }
        });
    }

    return fetchAndMerge("no-store")
      .catch(function () {})
      .then(function () {
        if (odpHasValidRegistryAddress(net)) return;
        return fetchAndMerge("reload").catch(function () {});
      });
  }

  /** If RPC probe fails, use net.contractGenerationFallback (number), else 2 (v0.2-shaped). */
  function odpResolveGeneration(probed, net) {
    if (probed !== null && probed !== undefined) return probed;
    if (net && typeof net.contractGenerationFallback === "number") return net.contractGenerationFallback;
    return 2;
  }

  /** Public GitHub Pages base (trailing slash omitted); keep in sync with README live demo links. */
  var ODP_LIVE_BASE = "https://object-digital-passport.github.io/object-digital-passport";

  /** Canonical public Verify base for reference exports, QR, and NFC helper links. */
  function odpCanonicalVerifyBase() {
    var base = typeof ODP_LIVE_BASE === "string" ? ODP_LIVE_BASE.trim() : "";
    return base || "";
  }

  /**
   * Resolve the public Verify host.
   * Explicit self-host overrides still work, but the reference flow defaults to GitHub Verify first.
   */
  function odpResolvePublicVerifyBase(explicitBase) {
    var override = typeof explicitBase === "string" ? explicitBase.trim() : "";
    return override || odpCanonicalVerifyBase();
  }

  /** Build an absolute Verify URL for a passport ID. */
  function odpBuildVerifyUrl(passportId, explicitBase, fallbackHref) {
    var rel = "verify.html?id=" + encodeURIComponent(String(passportId == null ? "" : passportId));
    var base = odpResolvePublicVerifyBase(explicitBase);
    if (base) {
      try {
        return new URL(rel, base.endsWith("/") ? base : base + "/").href;
      } catch (e) {}
    }
    var fallback = typeof fallbackHref === "string" && fallbackHref ? fallbackHref : ((global.location && global.location.href) || odpCanonicalVerifyBase());
    return new URL(rel, fallback).href;
  }

  /** First line of EIP-191 creator proof messages (must match SPEC / verify.html). */
  var ODP_CREATOR_PROOF_PREFIX = "Object Digital Passport — creator wallet proof (EIP-191) v2";

  /**
   * Canonical text signed with the creator wallet (EIP-191 `personal_sign`).
   * @param {string} passportId Passport ID (`ODP-…`; message line `passportId:` — v2; v1 used `humanId:`).
   * @param {string} contractAddress — registry contract (checksum recommended; verifier binds to this line)
   */
  function odpBuildCreatorProofMessageV1(passportId, chainId, contractAddress, nonce) {
    var addr = String(contractAddress || "").trim();
    return [
      ODP_CREATOR_PROOF_PREFIX,
      "",
      "passportId: " + String(passportId),
      "chainId: " + String(chainId),
      "contract: " + addr,
      "nonce: " + String(nonce),
    ].join("\n");
  }

  /** 128-bit random nonce, hex with 0x prefix. */
  function odpGenerateCreatorProofNonce() {
    if (typeof global.crypto !== "undefined" && global.crypto.getRandomValues) {
      var b = new Uint8Array(16);
      global.crypto.getRandomValues(b);
      var hex = "0x";
      for (var i = 0; i < b.length; i++) hex += ("0" + b[i].toString(16)).slice(-2);
      return hex;
    }
    return "0x" + Date.now().toString(16) + Math.random().toString(16).slice(2);
  }

  /**
   * Latest stable **site** SemVer **major** (marketing / static release). Bump when you ship a new major (e.g. 2 after 1.x).
   * Used for red/yellow/green stack flags: 0.x = red; current major = green; older majors 1…(N−1) = yellow when N≥2.
   */
  var ODP_LATEST_STABLE_MAJOR = 1;

  function odpEscHtml(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function odpEscAttr(s) {
    return odpEscHtml(s).replace(/'/g, "&#39;");
  }

  /** Use after `odpInitI18n` sets `window.odpT` (common.json `stack.*`). */
  function odpStackT(key, fallback) {
    try {
      if (typeof global.odpT === "function") {
        var v = global.odpT(key);
        if (typeof v === "string" && v !== key) return v;
      }
    } catch (eT) {}
    return fallback;
  }

  function odpStackTpl(key, fallbackTpl, vars) {
    var tpl = odpStackT(key, fallbackTpl);
    if (typeof tpl !== "string") tpl = fallbackTpl;
    var out = tpl;
    if (vars) {
      for (var k in vars) {
        if (Object.prototype.hasOwnProperty.call(vars, k)) {
          out = out.split("{" + k + "}").join(String(vars[k]));
        }
      }
    }
    return out;
  }

  function odpParseSiteSemverMajor(siteVer) {
    var parts = String(siteVer || "0.0.0").split(".");
    var m = parseInt(parts[0], 10);
    return isNaN(m) ? 0 : m;
  }

  function odpSiteSemverTrust(siteVer, latestMajor) {
    var maj = odpParseSiteSemverMajor(siteVer);
    var L = typeof latestMajor === "number" && latestMajor >= 1 ? latestMajor : 1;
    if (maj === 0) {
      return {
        level: "red",
        label: odpStackT("stack.trust.redLabel", "🚩 Red flag"),
        title: odpStackT("stack.trust.redTitle", "Site version 0.x — proof-of-concept; not production-stable."),
      };
    }
    if (maj > L) {
      return {
        level: "yellow",
        label: odpStackT("stack.trust.yellowLabel", "⚠️ Yellow flag"),
        title: odpStackT(
          "stack.trust.yellowNewerTitle",
          "Site major is newer than the configured latest stable major — confirm release notes before trusting."
        ),
      };
    }
    if (maj >= 1 && maj < L) {
      return {
        level: "yellow",
        label: odpStackT("stack.trust.yellowLabel", "⚠️ Yellow flag"),
        title: odpStackT(
          "stack.trust.yellowOlderTitle",
          "Older stable major (not the latest). Review migration and trust assumptions."
        ),
      };
    }
    return {
      level: "green",
      label: odpStackT("stack.trust.greenLabel", "Stable"),
      title: odpStackT("stack.trust.greenTitle", "Site major matches the current stable line (≥1.0)."),
    };
  }

  function odpFormatStackLabel(generation) {
    var g = generation;
    var spec =
      g >= 3
        ? "ODP registry pack 3 (v0.3 tuple; v0.4 branch adds optional counterfeit satellite; NFC TT only)"
        : g >= 2
          ? "ODP spec v0.2 (gas-only, optional dataUrl, PDF/doc hash anchor)"
          : g === 0
            ? "legacy CONTRACT_VERSION 0 — not supported by this UI"
            : "unknown generation";
    return "Site " + ODP_SITE_VERSION + " · on-chain generation " + g + " — " + spec;
  }

  /** v0.2: wallet doc anchor on the main registry. v0.3+: anchor lives in optional `ODPWalletDocumentAnchor` (`NET.docAnchor` in verify.html). */
  function odpSupportsExternalDocAttest(generation) {
    return generation >= 2;
  }

  function odpStackSpecForGeneration(generation) {
    if (generation === 0) {
      return odpStackT("stack.spec.legacy", "legacy CONTRACT_VERSION 0 — not supported by this UI");
    }
    if (generation >= 3) {
      return odpStackT(
        "stack.spec.v03",
        "ODP registry pack 3 — v0.3 features + v0.4-branch optional ODPCounterfeitConcern; NFC NTAG424DNA_TT only"
      );
    }
    if (generation >= 2) {
      return odpStackT(
        "stack.spec.v02",
        "ODP spec (gas-only, optional dataUrl, PDF/doc anchor; unlimited P/M; proofs P/M)"
      );
    }
    return odpStackT("stack.spec.unknown", "unknown generation");
  }

  /** Long disclosure copy (also in `odp-site-trust-disclosure.html` for the modal). */
  function odpStackDisclosureParagraphsHtml() {
    var L = ODP_LATEST_STABLE_MAJOR;
    var noteSemver;
    if (L <= 1) {
      noteSemver = odpStackT(
        "stack.disclosure.semverLte1",
        "<strong>0.x</strong> site releases are <strong>experimental</strong> (red flag). Stable numbering starts at <strong>major 1</strong>. If several stable lines exist, older majors are a <strong>yellow flag</strong> — read upgrade notes."
      );
    } else {
      noteSemver = odpStackTpl(
        "stack.disclosure.semverGt1",
        "<strong>0.x</strong> = red flag. <strong>Major {L}</strong> (latest stable) = green. <strong>Majors 1…{prevMajorsEnd}</strong> = yellow — older stable lines; check migration. Small updates under the same major stay green while that major is current.",
        { L: String(L), prevMajorsEnd: String(L - 1) }
      );
    }
    var noteRead = odpStackT(
      "stack.disclosure.readPara",
      "The checker talks to the main registry first. If a record isn’t there, it may look at older registry addresses you configured — useful when data moved between deployments."
    );
    var noteOdpass = odpStackT(
      "stack.disclosure.odpassPara",
      "<strong>Verify</strong> can open a <strong>.odpass</strong> file on your computer (it’s a ZIP). Inside is <strong>passport.json</strong>. The page checks that this file still matches what was saved in the public registry (a fingerprint of the data). Extra files (original artwork, pictures) sit in the <strong>originals/</strong> folder; the bundle lists their paths. Previews are built on your device — nothing is uploaded to this website. Older bundle layouts still work."
    );
    var gen =
      typeof global.odpContractGeneration === "number" && !isNaN(global.odpContractGeneration)
        ? global.odpContractGeneration
        : null;
    var registryBlock = "";
    if (gen !== null) {
      registryBlock =
        '<p class="odp-stack-note">' +
        odpStackTpl(
          "stack.disclosure.registryPara",
          "<strong>On-chain registry generation {gen}.</strong> {spec}",
          { gen: String(gen), spec: odpStackSpecForGeneration(gen) }
        ) +
        "</p>";
    }
    return (
      '<p class="odp-stack-note">' +
        noteRead +
        "</p>" +
        registryBlock +
        '<p class="odp-stack-note">' +
        noteOdpass +
        "</p>" +
        '<p class="odp-stack-note">' +
        noteSemver +
        "</p>"
    );
  }

  /**
   * Compact stack line (header + under-step strips): flag + meta + Details link. Long text only in modal / `odp-site-trust-disclosure.html`.
   */
  function odpFormatStackSummaryHtml(generation) {
    var g = generation == null ? "?" : String(generation);
    var trust = odpSiteSemverTrust(ODP_SITE_VERSION, ODP_LATEST_STABLE_MAJOR);
    var flagClass = "odp-stack-flag--" + trust.level;
    var metaLine = odpStackTpl("stack.summaryLine", "Site {siteVer} · on-chain registry generation {gen}.", {
      siteVer: ODP_SITE_VERSION,
      gen: g,
    });
    return (
      '<div class="odp-stack-block odp-stack-block--compact">' +
      '<div class="odp-stack-row">' +
      '<span class="odp-stack-flag ' +
      flagClass +
      '" title="' +
      odpEscAttr(trust.title) +
      '">' +
      odpEscHtml(trust.label) +
      "</span>" +
      '<span class="odp-stack-meta"> ' +
      odpEscHtml(metaLine) +
      "</span>" +
      '<button type="button" class="odp-stack-details-btn">' +
      odpEscHtml(odpStackT("stack.detailsBtn", "Details")) +
      "</button>" +
      "</div></div>"
    );
  }

  /** Back-compat: same as summary (no long paragraphs). */
  function odpFormatStackBlockHtml(generation) {
    return odpFormatStackSummaryHtml(generation);
  }

  function odpCloseSiteTrustModal() {
    var el = global.document && global.document.getElementById("odpSiteTrustModalBackdrop");
    if (!el) return;
    el.hidden = true;
    el.setAttribute("aria-hidden", "true");
    try {
      global.sessionStorage.setItem("odp_site_trust_disclosure_ok", "1");
    } catch (e0) {}
  }

  function odpRefreshSiteTrustModalChrome() {
    var doc = global.document;
    if (!doc) return;
    var titleEl = doc.getElementById("odpSiteTrustModalTitle");
    var okEl = doc.getElementById("odpSiteTrustModalOk");
    var bodyEl = doc.getElementById("odpSiteTrustModalBody");
    if (titleEl) titleEl.textContent = odpStackT("stack.modalTitle", "Site release & trust");
    if (okEl) okEl.textContent = odpStackT("stack.modalOk", "Got it");
    if (bodyEl) bodyEl.innerHTML = odpStackDisclosureParagraphsHtml();
  }

  function odpOpenSiteTrustModal() {
    var doc = global.document;
    if (!doc || !doc.body) return;
    var backdrop = doc.getElementById("odpSiteTrustModalBackdrop");
    if (!backdrop) {
      backdrop = doc.createElement("div");
      backdrop.id = "odpSiteTrustModalBackdrop";
      backdrop.className = "odp-modal-backdrop";
      backdrop.setAttribute("role", "presentation");
      backdrop.innerHTML =
        '<div class="odp-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="odpSiteTrustModalTitle">' +
        '<h3 id="odpSiteTrustModalTitle" class="odp-modal-title"></h3>' +
        '<div id="odpSiteTrustModalBody" class="odp-modal-body"></div>' +
        '<div class="odp-modal-actions"><button type="button" class="btn" id="odpSiteTrustModalOk"></button></div></div>';
      doc.body.appendChild(backdrop);
      doc.getElementById("odpSiteTrustModalOk").onclick = function () {
        odpCloseSiteTrustModal();
      };
      backdrop.addEventListener("click", function (ev) {
        if (ev.target === backdrop) odpCloseSiteTrustModal();
      });
    }
    odpRefreshSiteTrustModalChrome();
    backdrop.hidden = false;
    backdrop.setAttribute("aria-hidden", "false");
  }

  function odpMaybeAutoShowSiteTrustModal() {
    var trust = odpSiteSemverTrust(ODP_SITE_VERSION, ODP_LATEST_STABLE_MAJOR);
    if (trust.level !== "red") return;
    try {
      if (global.sessionStorage && global.sessionStorage.getItem("odp_site_trust_disclosure_ok") === "1") return;
    } catch (e1) {}
    odpOpenSiteTrustModal();
  }

  if (typeof global.document !== "undefined" && global.document.addEventListener) {
    global.document.addEventListener(
      "click",
      function (ev) {
        var t = ev.target;
        if (!t || !t.closest) return;
        if (t.closest(".odp-stack-details-btn")) {
          ev.preventDefault();
          odpOpenSiteTrustModal();
        }
      },
      true
    );
  }

  async function odpRequireSingleEthereumAccount(eth) {
    if (!eth) {
      return { ok: false, count: 0, message: "No injected wallet." };
    }
    var accounts = await eth.request({ method: "eth_accounts" }).catch(function () {
      return [];
    });
    if (accounts.length === 0) {
      return { ok: false, count: 0, message: "No account connected." };
    }
    if (accounts.length > 1) {
      return {
        ok: false,
        count: accounts.length,
        message:
          "Multiple accounts are connected (" +
          accounts.length +
          "). ODP allows only one wallet account at a time. Open MetaMask → this site → disconnect extra accounts, or disable all but one for this site, then refresh and connect again.",
      };
    }
    return { ok: true, address: accounts[0] };
  }

  function odpInstallSingleAccountGuard(eth, callbacks) {
    if (!eth || eth._odpSingleAccountGuardInstalled) return;
    eth._odpSingleAccountGuardInstalled = true;
    eth.on("accountsChanged", function (accounts) {
      if (accounts.length > 1) {
        if (callbacks && callbacks.onMultiple) callbacks.onMultiple(accounts);
      } else if (accounts.length === 0) {
        if (callbacks && callbacks.onEmpty) callbacks.onEmpty();
      }
    });
  }

  function odpClearContractGenerationCache(address) {
    if (!address) return;
    var low = String(address).toLowerCase();
    try {
      if (global.sessionStorage) {
        global.sessionStorage.removeItem("odp_cv2_" + low);
        global.sessionStorage.removeItem("odp_cv_" + low);
      }
    } catch (e0) {}
  }

  async function odpProbeContractGenerationCached(address, chainId, rpcFallbacks, ethersRef) {
    var E = ethersRef || global.ethers;
    if (!address || !E) return null;
    var key = "odp_cv2_" + String(address).toLowerCase();
    try {
      var cached = sessionStorage.getItem(key);
      if (cached !== null && cached !== "") {
        var parsed = parseInt(cached, 10);
        if (isFinite(parsed)) return parsed;
      }
    } catch (e0) {}

    var gen = null;
    for (var i = 0; i < rpcFallbacks.length; i++) {
      try {
        var provider = new E.providers.JsonRpcProvider(rpcFallbacks[i], { name: "polygon", chainId: chainId });
        await provider.getBlockNumber();
        var ctr = new E.Contract(address, CV_ABI, provider);
        var cvRaw = await ctr.CONTRACT_VERSION();
        if (cvRaw && typeof cvRaw.toNumber === "function") {
          gen = cvRaw.toNumber();
        } else if (cvRaw && typeof cvRaw.toString === "function") {
          gen = Number(cvRaw.toString());
        } else {
          gen = Number(cvRaw);
        }
        if (!isFinite(gen)) {
          throw new Error("Invalid CONTRACT_VERSION value");
        }
        try {
          sessionStorage.setItem(key, String(gen));
        } catch (e1) {}
        break;
      } catch (e2) {
        continue;
      }
    }

    return gen;
  }

  function odpBuildPassportAbi(generation, net) {
    var pid = odpPassportIdAbiName(generation, net);
    var folder = generation >= 2;
    var mintMut = "nonpayable";
    if (odpSupportsV06(generation)) {
      // spec 0.6: unified PassportMintInputs, on-chain card, anchors, append-only events.
      var v06Core = [
        { name: "year", type: "uint32" },
        { name: "month", type: "uint8" },
        { name: "title", type: "string" },
        { name: "authorName", type: "string" },
        { name: "shortDescription", type: "string" },
        { name: "domain", type: "string" },
        { name: "contentClass", type: "uint8" },
        { name: "lifecycleStatus", type: "uint8" },
        { name: "aiStatus", type: "uint8" },
        { name: "verificationMethod", type: "uint8" },
        { name: "editionModel", type: "uint8" },
      ];
      var v06MintTuple = {
        name: "m",
        type: "tuple",
        components: [
          { name: "core", type: "tuple", components: v06Core },
          { name: "dataHash", type: "bytes32" },
          { name: "dataUrl", type: "string" },
          { name: "imageHash", type: "bytes32" },
          { name: "imageUrl", type: "string" },
          { name: "fileHash", type: "bytes32" },
          { name: "anchorsHash", type: "bytes32" },
          { name: "anchorTypesMask", type: "uint32" },
        ],
      };
      var v06Suffix = [
        { name: "dataUrlIsFolderBase", type: "bool" },
        { name: "mintOnBehalfOfCreatorId", type: "string" },
      ];
      var v06MintedEvent =
        "event PassportMinted(string indexed " +
        pid +
        ",address indexed creator,string creatorId,string title,string authorName,string domain,string objectType,uint8 contentClass,uint32 year,uint8 month,bytes32 dataHash,bytes32 anchorsHash,uint32 anchorTypesMask,uint256 timestamp,address mintAgent)";

      return [
        {
          name: "getCreatorByWallet",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "wallet", type: "address" }],
          outputs: [{ name: "", type: "string" }],
        },
        {
          name: "getPassportsByCreatorPaged",
          type: "function",
          stateMutability: "view",
          inputs: [
            { name: "creator", type: "address" },
            { name: "offset", type: "uint256" },
            { name: "limit", type: "uint256" },
          ],
          outputs: [
            { name: "result", type: "string[]" },
            { name: "total", type: "uint256" },
          ],
        },
        {
          name: "getPassportHeader",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: pid, type: "string" }],
          outputs: [{ name: "", type: "tuple", components: odpPassportHeaderViewComponents(generation, net) }],
        },
        {
          name: "getPassportClassification",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: pid, type: "string" }],
          outputs: [{ name: "", type: "tuple", components: odpPassportClassificationViewComponents() }],
        },
        {
          name: "getPassportMedia",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: pid, type: "string" }],
          outputs: [{ name: "", type: "tuple", components: odpPassportMediaViewComponents(generation) }],
        },
        {
          name: "getPassportEvents",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: pid, type: "string" }],
          outputs: [{ name: "", type: "tuple", components: odpPassportEventsViewComponents() }],
        },
        v06MintedEvent,
        "event PassportEventRecorded(string indexed " +
          pid +
          ",uint8 indexed kind,uint8 value,string note,bytes32 attachmentHash,string attachmentUrl,address recordedBy,uint256 timestamp)",
        { name: "mintPhysical", type: "function", stateMutability: mintMut, inputs: [v06MintTuple].concat(v06Suffix), outputs: [{ name: pid, type: "string" }] },
        { name: "mintDigital", type: "function", stateMutability: mintMut, inputs: [v06MintTuple].concat(v06Suffix), outputs: [{ name: pid, type: "string" }] },
        { name: "mintMixed", type: "function", stateMutability: mintMut, inputs: [v06MintTuple].concat(v06Suffix), outputs: [{ name: pid, type: "string" }] },
        {
          name: "updatePassportUrls",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [
            { name: pid, type: "string" },
            { name: "newDataUrl", type: "string" },
            { name: "newImageUrl", type: "string" },
            { name: "confirmedDataHash", type: "bytes32" },
          ],
          outputs: [],
        },
        {
          name: "recordPassportEvent",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [
            { name: pid, type: "string" },
            { name: "kind", type: "uint8" },
            { name: "value", type: "uint8" },
            { name: "note", type: "string" },
            { name: "attachmentHash", type: "bytes32" },
            { name: "attachmentUrl", type: "string" },
          ],
          outputs: [],
        },
        {
          name: "submitProof",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [
            { name: pid, type: "string" },
            { name: "documentHash", type: "bytes32" },
            { name: "documentUrl", type: "string" },
            { name: "year", type: "uint32" },
            { name: "month", type: "uint8" },
          ],
          outputs: [{ name: "proofId", type: "string" }],
        },
        {
          name: "getProofsByInstitution",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "creatorId", type: "string" }],
          outputs: [{ name: "", type: "string[]" }],
        },
        {
          name: "getProofsForPassport",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: pid, type: "string" }],
          outputs: [{ name: "", type: "string[]" }],
        },
        {
          name: "getProof",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "proofId", type: "string" }],
          outputs: [
            {
              name: "",
              type: "tuple",
              components: [
                { name: "proofId", type: "string" },
                { name: "contractVersion", type: "uint8" },
                { name: "prover", type: "string" },
                { name: pid, type: "string" },
                { name: "documentHash", type: "bytes32" },
                { name: "documentUrl", type: "string" },
                { name: "timestamp", type: "uint256" },
              ],
            },
          ],
        },
        {
          name: "transferPassport",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [
            { name: pid, type: "string" },
            { name: "newOwner", type: "address" },
          ],
          outputs: [],
        },
        {
          name: "delegateCreatorPublishing",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [
            { name: "agent", type: "address" },
            { name: "expiresAt", type: "uint256" },
          ],
          outputs: [],
        },
        {
          name: "revokeCreatorPublishing",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [],
          outputs: [],
        },
        {
          name: "getCreatorPublishingDelegation",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "creatorWallet", type: "address" }],
          outputs: [
            { name: "agent", type: "address" },
            { name: "expiresAt", type: "uint256" },
          ],
        },
        {
          name: "requestMintAgentRole",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [{ name: "principalCreatorId", type: "string" }],
          outputs: [],
        },
        {
          name: "confirmMintAgentRole",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [{ name: "agent", type: "address" }],
          outputs: [],
        },
        {
          name: "revokeMintAgentRole",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [],
          outputs: [],
        },
        {
          name: "renounceMintAgentRole",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [{ name: "principalCreatorId", type: "string" }],
          outputs: [],
        },
        {
          name: "cancelMintAgentRequest",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [{ name: "principalCreatorId", type: "string" }],
          outputs: [],
        },
        {
          name: "mintAgentForCreator",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "", type: "string" }],
          outputs: [{ name: "", type: "address" }],
        },
        {
          name: "mintAgentDelegationPending",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "", type: "bytes32" }],
          outputs: [{ name: "", type: "bool" }],
        },
        {
          name: "revokePassport",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [
            { name: pid, type: "string" },
            { name: "reasonHash", type: "bytes32" },
          ],
          outputs: [],
        },
        {
          name: "getPAffiliationAudit",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "childPId", type: "string" }],
          outputs: [
            { name: "activeParent", type: "string" },
            { name: "joinedAt", type: "uint256" },
            { name: "detachedAt", type: "uint256" },
            { name: "lastDetachedFromParent", type: "string" },
          ],
        },
        {
          name: "detachPAffiliation",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [{ name: "childPId", type: "string" }],
          outputs: [],
        },
        {
          name: "governance",
          type: "function",
          stateMutability: "view",
          inputs: [],
          outputs: [{ name: "", type: "address" }],
        },
        {
          name: "transferGovernance",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [{ name: "newGovernance", type: "address" }],
          outputs: [],
        },
      ];
    }
    if (generation >= 5) {
      var coreMintInputs = [
        { name: "year", type: "uint32" },
        { name: "month", type: "uint8" },
        { name: "title", type: "string" },
        { name: "domain", type: "string" },
        { name: "contentClass", type: "uint8" },
        { name: "lifecycleStatus", type: "uint8" },
        { name: "aiStatus", type: "uint8" },
        { name: "verificationMethod", type: "uint8" },
        { name: "editionModel", type: "uint8" },
        { name: "currentLocation", type: "string" },
        { name: "rightsNote", type: "string" },
        { name: "conditionNote", type: "string" },
        { name: "damageHistoryHash", type: "bytes32" },
        { name: "damageHistoryUrl", type: "string" },
      ];
      var commonTail = [
        { name: "dataHash", type: "bytes32" },
        { name: "dataUrl", type: "string" },
        { name: "imageHash", type: "bytes32" },
        { name: "imageUrl", type: "string" },
      ];
      var extraImages = [
        { name: "imageHash2", type: "bytes32" },
        { name: "imageUrl2", type: "string" },
        { name: "imageHash3", type: "bytes32" },
        { name: "imageUrl3", type: "string" },
      ];
      var physicalSeal = [
        { name: "sealType", type: "uint8" },
        { name: "sealHash", type: "bytes32" },
        { name: "nfcPublicKey", type: "bytes" },
        { name: "nfcModel", type: "string" },
      ];
      var filePart = [{ name: "fileHash", type: "bytes32" }];
      var physicalMintTuple = {
        name: "m",
        type: "tuple",
        components: [
          { name: "core", type: "tuple", components: coreMintInputs },
          { name: "dataHash", type: "bytes32" },
          { name: "dataUrl", type: "string" },
          { name: "imageHash", type: "bytes32" },
          { name: "imageUrl", type: "string" },
          { name: "sealType", type: "uint8" },
          { name: "sealHash", type: "bytes32" },
          { name: "nfcPublicKey", type: "bytes" },
          { name: "nfcModel", type: "string" },
          { name: "imageHash2", type: "bytes32" },
          { name: "imageUrl2", type: "string" },
          { name: "imageHash3", type: "bytes32" },
          { name: "imageUrl3", type: "string" },
          { name: "auxCommitmentHash", type: "bytes32" },
          { name: "auxCommitmentUri", type: "string" },
          { name: "ndppCommitmentHash", type: "bytes32" },
          { name: "ndppCommitmentUri", type: "string" },
        ],
      };
      var digitalMintTuple = {
        name: "dm",
        type: "tuple",
        components: [
          { name: "core", type: "tuple", components: coreMintInputs },
          { name: "dataHash", type: "bytes32" },
          { name: "dataUrl", type: "string" },
          { name: "imageHash", type: "bytes32" },
          { name: "imageUrl", type: "string" },
          { name: "imageHash2", type: "bytes32" },
          { name: "imageUrl2", type: "string" },
          { name: "imageHash3", type: "bytes32" },
          { name: "imageUrl3", type: "string" },
          { name: "fileHash", type: "bytes32" },
          { name: "auxCommitmentHash", type: "bytes32" },
          { name: "auxCommitmentUri", type: "string" },
          { name: "ndppCommitmentHash", type: "bytes32" },
          { name: "ndppCommitmentUri", type: "string" },
        ],
      };
      var mixedMintTuple = {
        name: "mm",
        type: "tuple",
        components: [
          { name: "core", type: "tuple", components: coreMintInputs },
          { name: "dataHash", type: "bytes32" },
          { name: "dataUrl", type: "string" },
          { name: "imageHash", type: "bytes32" },
          { name: "imageUrl", type: "string" },
          { name: "sealType", type: "uint8" },
          { name: "sealHash", type: "bytes32" },
          { name: "nfcPublicKey", type: "bytes" },
          { name: "nfcModel", type: "string" },
          { name: "imageHash2", type: "bytes32" },
          { name: "imageUrl2", type: "string" },
          { name: "imageHash3", type: "bytes32" },
          { name: "imageUrl3", type: "string" },
          { name: "fileHash", type: "bytes32" },
          { name: "auxCommitmentHash", type: "bytes32" },
          { name: "auxCommitmentUri", type: "string" },
          { name: "ndppCommitmentHash", type: "bytes32" },
          { name: "ndppCommitmentUri", type: "string" },
        ],
      };
      var sharedSuffix = [
        { name: "dataUrlIsFolderBase", type: "bool" },
        { name: "mintOnBehalfOfCreatorId", type: "string" },
      ];
      var passportHeaderView = [
        { name: "passportId", type: "string" },
        { name: "contractVersion", type: "uint8" },
        { name: "creator", type: "address" },
        { name: "owner", type: "address" },
        { name: "creatorId", type: "string" },
        { name: "year", type: "uint32" },
        { name: "month", type: "uint8" },
        { name: "title", type: "string" },
        { name: "domain", type: "string" },
        { name: "objectType", type: "string" },
      ];
      var passportClassificationView = [
        { name: "contentClass", type: "uint8" },
        { name: "lifecycleStatus", type: "uint8" },
        { name: "aiStatus", type: "uint8" },
        { name: "verificationMethod", type: "uint8" },
        { name: "editionModel", type: "uint8" },
        { name: "timestamp", type: "uint256" },
        { name: "revoked", type: "bool" },
        { name: "revokedAt", type: "uint256" },
        { name: "revocationReasonHash", type: "bytes32" },
        { name: "mintAgent", type: "address" },
      ];
      var passportMediaView = [
        { name: "dataHash", type: "bytes32" },
        { name: "dataUrl", type: "string" },
        { name: "imageHash", type: "bytes32" },
        { name: "imageUrl", type: "string" },
        { name: "imageHash2", type: "bytes32" },
        { name: "imageUrl2", type: "string" },
        { name: "imageHash3", type: "bytes32" },
        { name: "imageUrl3", type: "string" },
        { name: "fileHash", type: "bytes32" },
      ];
      var passportPhysicalView = [
        { name: "sealType", type: "uint8" },
        { name: "sealHash", type: "bytes32" },
        { name: "nfcPublicKey", type: "bytes" },
        { name: "nfcModel", type: "string" },
      ];
      var passportStateView = [
        { name: "currentLocation", type: "string" },
        { name: "rightsNote", type: "string" },
        { name: "conditionNote", type: "string" },
        { name: "damageHistoryHash", type: "bytes32" },
        { name: "damageHistoryUrl", type: "string" },
        { name: "auxCommitmentHash", type: "bytes32" },
        { name: "auxCommitmentUri", type: "string" },
        { name: "ndppCommitmentHash", type: "bytes32" },
        { name: "ndppCommitmentUri", type: "string" },
      ];
      var passportMintedEvent =
        "event PassportMinted(string indexed " +
        pid +
        ",address indexed creator,string creatorId,string title,string domain,string objectType,uint8 contentClass,uint32 year,uint8 month,bytes32 dataHash,uint8 sealType,string nfcModel,uint256 timestamp,address mintAgent)";

      return [
        {
          name: "getCreatorByWallet",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "wallet", type: "address" }],
          outputs: [{ name: "", type: "string" }],
        },
        {
          name: "getPassportsByCreator",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "creator", type: "address" }],
          outputs: [{ name: "", type: "string[]" }],
        },
        {
          name: "getPassportsByCreatorPaged",
          type: "function",
          stateMutability: "view",
          inputs: [
            { name: "creator", type: "address" },
            { name: "offset", type: "uint256" },
            { name: "limit", type: "uint256" },
          ],
          outputs: [
            { name: "result", type: "string[]" },
            { name: "total", type: "uint256" },
          ],
        },
        {
          name: "getPassportHeader",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: pid, type: "string" }],
          outputs: [
            {
              name: "",
              type: "tuple",
              components: passportHeaderView,
            },
          ],
        },
        {
          name: "getPassportClassification",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: pid, type: "string" }],
          outputs: [
            {
              name: "",
              type: "tuple",
              components: passportClassificationView,
            },
          ],
        },
        {
          name: "getPassportMedia",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: pid, type: "string" }],
          outputs: [
            {
              name: "",
              type: "tuple",
              components: passportMediaView,
            },
          ],
        },
        {
          name: "getPassportPhysical",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: pid, type: "string" }],
          outputs: [
            {
              name: "",
              type: "tuple",
              components: passportPhysicalView,
            },
          ],
        },
        {
          name: "getPassportState",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: pid, type: "string" }],
          outputs: [
            {
              name: "",
              type: "tuple",
              components: passportStateView,
            },
          ],
        },
        passportMintedEvent,
        { name: "mintPhysical", type: "function", stateMutability: mintMut, inputs: [physicalMintTuple].concat(sharedSuffix), outputs: [{ name: pid, type: "string" }] },
        { name: "mintDigital", type: "function", stateMutability: mintMut, inputs: [digitalMintTuple].concat(sharedSuffix), outputs: [{ name: pid, type: "string" }] },
        { name: "mintMixed", type: "function", stateMutability: mintMut, inputs: [mixedMintTuple].concat(sharedSuffix), outputs: [{ name: pid, type: "string" }] },
        {
          name: "updatePassportUrls",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [
            { name: pid, type: "string" },
            { name: "newDataUrl", type: "string" },
            { name: "newImageUrl", type: "string" },
            { name: "confirmedDataHash", type: "bytes32" },
          ],
          outputs: [],
        },
        {
          name: "updatePassportStatus",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [
            { name: pid, type: "string" },
            { name: "newLifecycleStatus", type: "uint8" },
          ],
          outputs: [],
        },
        {
          name: "updatePassportLocation",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [
            { name: pid, type: "string" },
            { name: "newLocation", type: "string" },
          ],
          outputs: [],
        },
        {
          name: "updatePassportRights",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [
            { name: pid, type: "string" },
            { name: "newRightsNote", type: "string" },
          ],
          outputs: [],
        },
        {
          name: "updatePassportCondition",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [
            { name: pid, type: "string" },
            { name: "newConditionNote", type: "string" },
            { name: "newDamageHistoryHash", type: "bytes32" },
            { name: "newDamageHistoryUrl", type: "string" },
          ],
          outputs: [],
        },
        {
          name: "updatePassportAuxCommitment",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [
            { name: pid, type: "string" },
            { name: "newHash", type: "bytes32" },
            { name: "newUri", type: "string" },
          ],
          outputs: [],
        },
        {
          name: "updatePassportNdppCommitment",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [
            { name: pid, type: "string" },
            { name: "newHash", type: "bytes32" },
            { name: "newUri", type: "string" },
          ],
          outputs: [],
        },
        {
          name: "getRemainingMints",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "wallet", type: "address" }],
          outputs: [{ name: "", type: "uint32" }],
        },
        {
          name: "submitProof",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [
            { name: pid, type: "string" },
            { name: "noteHash", type: "bytes32" },
            { name: "noteUrl", type: "string" },
            { name: "year", type: "uint32" },
            { name: "month", type: "uint8" },
          ],
          outputs: [{ name: "proofId", type: "string" }],
        },
        {
          name: "getProofsByInstitution",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "creatorId", type: "string" }],
          outputs: [{ name: "", type: "string[]" }],
        },
        {
          name: "getProofsForPassport",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: pid, type: "string" }],
          outputs: [{ name: "", type: "string[]" }],
        },
        {
          name: "getProof",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "proofId", type: "string" }],
          outputs: [
            {
              name: "",
              type: "tuple",
              components: [
                { name: "proofId", type: "string" },
                { name: "contractVersion", type: "uint8" },
                { name: "prover", type: "string" },
                { name: pid, type: "string" },
                { name: "noteHash", type: "bytes32" },
                { name: "noteUrl", type: "string" },
                { name: "timestamp", type: "uint256" },
              ],
            },
          ],
        },
        {
          name: "transferPassport",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [
            { name: pid, type: "string" },
            { name: "newOwner", type: "address" },
          ],
          outputs: [],
        },
        {
          name: "delegateCreatorPublishing",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [
            { name: "agent", type: "address" },
            { name: "expiresAt", type: "uint256" },
          ],
          outputs: [],
        },
        {
          name: "revokeCreatorPublishing",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [],
          outputs: [],
        },
        {
          name: "getCreatorPublishingDelegation",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "creatorWallet", type: "address" }],
          outputs: [
            { name: "agent", type: "address" },
            { name: "expiresAt", type: "uint256" },
          ],
        },
        {
          name: "requestMintAgentRole",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [{ name: "principalCreatorId", type: "string" }],
          outputs: [],
        },
        {
          name: "confirmMintAgentRole",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [{ name: "agent", type: "address" }],
          outputs: [],
        },
        {
          name: "revokeMintAgentRole",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [],
          outputs: [],
        },
        {
          name: "renounceMintAgentRole",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [{ name: "principalCreatorId", type: "string" }],
          outputs: [],
        },
        {
          name: "cancelMintAgentRequest",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [{ name: "principalCreatorId", type: "string" }],
          outputs: [],
        },
        {
          name: "mintAgentForCreator",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "", type: "string" }],
          outputs: [{ name: "", type: "address" }],
        },
        {
          name: "mintAgentDelegationPending",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "", type: "bytes32" }],
          outputs: [{ name: "", type: "bool" }],
        },
        {
          name: "revokePassport",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [
            { name: pid, type: "string" },
            { name: "reasonHash", type: "bytes32" },
          ],
          outputs: [],
        },
        {
          name: "getPAffiliationAudit",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "childPId", type: "string" }],
          outputs: [
            { name: "activeParent", type: "string" },
            { name: "joinedAt", type: "uint256" },
            { name: "detachedAt", type: "uint256" },
            { name: "lastDetachedFromParent", type: "string" },
          ],
        },
        {
          name: "detachPAffiliation",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [{ name: "childPId", type: "string" }],
          outputs: [],
        },
        {
          name: "governance",
          type: "function",
          stateMutability: "view",
          inputs: [],
          outputs: [{ name: "", type: "address" }],
        },
        {
          name: "transferGovernance",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [{ name: "newGovernance", type: "address" }],
          outputs: [],
        },
      ];
    }

    var hasContentClass = odpSupportsContentClass(generation);
    var mintPhysicalInputs = [
      { name: "year", type: "uint32" },
      { name: "month", type: "uint8" },
    ];
    var mintDigitalInputs = [
      { name: "year", type: "uint32" },
      { name: "month", type: "uint8" },
    ];
    if (hasContentClass) {
      mintPhysicalInputs.push({ name: "contentClass", type: "uint8" });
      mintDigitalInputs.push({ name: "contentClass", type: "uint8" });
    }
    mintPhysicalInputs.push(
      { name: "dataHash", type: "bytes32" },
      { name: "dataUrl", type: "string" },
      { name: "imageHash", type: "bytes32" },
      { name: "imageUrl", type: "string" },
      { name: "sealType", type: "uint8" },
      { name: "sealHash", type: "bytes32" },
      { name: "nfcPublicKey", type: "bytes" },
      { name: "nfcModel", type: "string" }
    );
    mintDigitalInputs.push(
      { name: "dataHash", type: "bytes32" },
      { name: "dataUrl", type: "string" },
      { name: "imageHash", type: "bytes32" },
      { name: "imageUrl", type: "string" }
    );
    if (odpSupportsV03(generation)) {
      mintPhysicalInputs.push(
        { name: "imageHash2", type: "bytes32" },
        { name: "imageUrl2", type: "string" },
        { name: "imageHash3", type: "bytes32" },
        { name: "imageUrl3", type: "string" }
      );
      mintDigitalInputs.push(
        { name: "imageHash2", type: "bytes32" },
        { name: "imageUrl2", type: "string" },
        { name: "imageHash3", type: "bytes32" },
        { name: "imageUrl3", type: "string" }
      );
    }
    mintDigitalInputs.push({ name: "fileHash", type: "bytes32" });
    if (folder) {
      mintPhysicalInputs.push({ name: "dataUrlIsFolderBase", type: "bool" });
      mintDigitalInputs.push({ name: "dataUrlIsFolderBase", type: "bool" });
    }
    if (odpSupportsV03(generation)) {
      mintDigitalInputs.push(
        { name: "auxCommitmentHash", type: "bytes32" },
        { name: "auxCommitmentUri", type: "string" }
      );
      mintPhysicalInputs.push(
        { name: "auxCommitmentHash", type: "bytes32" },
        { name: "auxCommitmentUri", type: "string" }
      );
      if (generation >= 5) {
        mintDigitalInputs.push(
          { name: "ndppCommitmentHash", type: "bytes32" },
          { name: "ndppCommitmentUri", type: "string" }
        );
        mintPhysicalInputs.push(
          { name: "ndppCommitmentHash", type: "bytes32" },
          { name: "ndppCommitmentUri", type: "string" }
        );
      }
      mintDigitalInputs.push({ name: "mintOnBehalfOfCreatorId", type: "string" });
      mintPhysicalInputs.push({ name: "mintOnBehalfOfCreatorId", type: "string" });
    }

    var passportMintedEvent;
    if (odpSupportsV03(generation)) {
      passportMintedEvent =
        "event PassportMinted(string indexed " +
        pid +
        (hasContentClass
          ? ",address indexed creator,string creatorId,string objectType,uint8 contentClass,uint32 year,uint8 month,bytes32 dataHash,uint8 sealType,string nfcModel,uint256 timestamp,address mintAgent)"
          : ",address indexed creator,string creatorId,string objectType,uint32 year,uint8 month,bytes32 dataHash,uint8 sealType,string nfcModel,uint256 timestamp,address mintAgent)");
    } else {
      passportMintedEvent =
        "event PassportMinted(string indexed " +
        pid +
        (hasContentClass
          ? ",address indexed creator,string creatorId,string objectType,uint8 contentClass,uint32 year,uint8 month,bytes32 dataHash,uint8 sealType,string nfcModel,uint256 timestamp)"
          : ",address indexed creator,string creatorId,string objectType,uint32 year,uint8 month,bytes32 dataHash,uint8 sealType,string nfcModel,uint256 timestamp)");
    }

    var passportAbi = [
      {
        name: "getCreatorByWallet",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "wallet", type: "address" }],
        outputs: [{ name: "", type: "string" }],
      },
      {
        name: "getPassportsByCreator",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "creator", type: "address" }],
        outputs: [{ name: "", type: "string[]" }],
      },
      {
        name: "getPassport",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: pid, type: "string" }],
        outputs: [
          {
            name: "",
            type: "tuple",
            components: odpPassportTupleComponents(generation, net),
          },
        ],
      },
      passportMintedEvent,
      { name: "mintPhysical", type: "function", stateMutability: mintMut, inputs: mintPhysicalInputs, outputs: [{ name: pid, type: "string" }] },
      { name: "mintDigital", type: "function", stateMutability: mintMut, inputs: mintDigitalInputs, outputs: [{ name: pid, type: "string" }] },
      {
        name: "updatePassportUrls",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
          { name: pid, type: "string" },
          { name: "newDataUrl", type: "string" },
          { name: "newImageUrl", type: "string" },
          { name: "confirmedDataHash", type: "bytes32" },
        ],
        outputs: [],
      },
    ];

    if (folder) {
      passportAbi.push(
        {
          name: "getRemainingMints",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "wallet", type: "address" }],
          outputs: [{ name: "", type: "uint32" }],
        },
        {
          name: "submitProof",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [
            { name: pid, type: "string" },
            { name: "noteHash", type: "bytes32" },
            { name: "noteUrl", type: "string" },
            { name: "year", type: "uint32" },
            { name: "month", type: "uint8" },
          ],
          outputs: [{ name: "proofId", type: "string" }],
        },
        {
          name: "getProofsByInstitution",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "creatorId", type: "string" }],
          outputs: [{ name: "", type: "string[]" }],
        },
        {
          name: "getProof",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "proofId", type: "string" }],
          outputs: [
            {
              name: "",
              type: "tuple",
              components: [
                { name: "proofId", type: "string" },
                { name: "contractVersion", type: "uint8" },
                { name: "prover", type: "string" },
                { name: pid, type: "string" },
                { name: "noteHash", type: "bytes32" },
                { name: "noteUrl", type: "string" },
                { name: "timestamp", type: "uint256" },
              ],
            },
          ],
        },
        {
          name: "raiseCounterfeitConcern",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [
            { name: pid, type: "string" },
            { name: "reasonHash", type: "bytes32" },
          ],
          outputs: [],
        },
        {
          name: "clearCounterfeitConcern",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [{ name: pid, type: "string" }],
          outputs: [],
        },
        {
          name: "getCounterfeitConcern",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: pid, type: "string" }],
          outputs: [
            { name: "active", type: "bool" },
            { name: "proverCreatorId", type: "string" },
            { name: "reasonHash", type: "bytes32" },
            { name: "timestamp", type: "uint256" },
          ],
        }
      );
    }

    if (odpSupportsV03(generation) && folder) {
      passportAbi.push(
        {
          name: "transferPassport",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [
            { name: pid, type: "string" },
            { name: "newOwner", type: "address" },
          ],
          outputs: [],
        },
        {
          name: "delegateCreatorPublishing",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [
            { name: "agent", type: "address" },
            { name: "expiresAt", type: "uint256" },
          ],
          outputs: [],
        },
        {
          name: "revokeCreatorPublishing",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [],
          outputs: [],
        },
        {
          name: "getCreatorPublishingDelegation",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "creatorWallet", type: "address" }],
          outputs: [
            { name: "agent", type: "address" },
            { name: "expiresAt", type: "uint256" },
          ],
        },
        {
          name: "requestMintAgentRole",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [{ name: "principalCreatorId", type: "string" }],
          outputs: [],
        },
        {
          name: "confirmMintAgentRole",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [{ name: "agent", type: "address" }],
          outputs: [],
        },
        {
          name: "revokeMintAgentRole",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [],
          outputs: [],
        },
        {
          name: "renounceMintAgentRole",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [{ name: "principalCreatorId", type: "string" }],
          outputs: [],
        },
        {
          name: "cancelMintAgentRequest",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [{ name: "principalCreatorId", type: "string" }],
          outputs: [],
        },
        {
          name: "mintAgentForCreator",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "", type: "string" }],
          outputs: [{ name: "", type: "address" }],
        },
        {
          name: "mintAgentDelegationPending",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "", type: "bytes32" }],
          outputs: [{ name: "", type: "bool" }],
        },
        {
          name: "revokePassport",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [
            { name: pid, type: "string" },
            { name: "reasonHash", type: "bytes32" },
          ],
          outputs: [],
        },
        {
          name: "updatePassportAuxCommitment",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [
            { name: pid, type: "string" },
            { name: "newHash", type: "bytes32" },
            { name: "newUri", type: "string" },
          ],
          outputs: [],
        },
        {
          name: "detachPAffiliation",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [{ name: "childPId", type: "string" }],
          outputs: [],
        },
        {
          name: "getPassportsByCreatorPaged",
          type: "function",
          stateMutability: "view",
          inputs: [
            { name: "creator", type: "address" },
            { name: "offset", type: "uint256" },
            { name: "limit", type: "uint256" },
          ],
          outputs: [
            { name: "result", type: "string[]" },
            { name: "total", type: "uint256" },
          ],
        },
        {
          name: "getPAffiliationAudit",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "childPId", type: "string" }],
          outputs: [
            { name: "activeParent", type: "string" },
            { name: "joinedAt", type: "uint256" },
            { name: "detachedAt", type: "uint256" },
            { name: "lastDetachedFromParent", type: "string" },
          ],
        },
        {
          name: "governance",
          type: "function",
          stateMutability: "view",
          inputs: [],
          outputs: [{ name: "", type: "address" }],
        },
        {
          name: "transferGovernance",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [{ name: "newGovernance", type: "address" }],
          outputs: [],
        }
      );
    }

    return passportAbi;
  }

  function odpBuildCreatorAbi(generation, net) {
    var pid = odpPassportIdAbiName(generation, net);
    var abi = [
      {
        name: "registerCreator",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [{ name: "typePrefix", type: "bytes1" }],
        outputs: [{ name: "creatorId", type: "string" }],
      },
      {
        name: "getCreatorByWallet",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "wallet", type: "address" }],
        outputs: [{ name: "", type: "string" }],
      },
      {
        name: "getCreator",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "creatorId", type: "string" }],
        outputs: [
          {
            name: "",
            type: "tuple",
            components: [
              { name: "creatorId", type: "string" },
              { name: "wallet", type: "address" },
              { name: "typePrefix", type: "bytes1" },
              { name: "timestamp", type: "uint256" },
            ],
          },
        ],
      },
    ];
    if (generation >= 2) {
      abi.push(
        {
          name: "proposePAffiliation",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [{ name: "parentPId", type: "string" }],
          outputs: [],
        },
        {
          name: "confirmPAffiliation",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [{ name: "childPId", type: "string" }],
          outputs: [],
        },
        {
          name: "cancelPAffiliationRequest",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [{ name: "parentPId", type: "string" }],
          outputs: [],
        },
        {
          name: "isPAffiliationPending",
          type: "function",
          stateMutability: "view",
          inputs: [
            { name: "parentPId", type: "string" },
            { name: "childPId", type: "string" },
          ],
          outputs: [{ name: "", type: "bool" }],
        },
        {
          name: "getPAffiliatedParent",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "childPId", type: "string" }],
          outputs: [{ name: "", type: "string" }],
        },
        {
          name: "getPAffiliatedChildren",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "parentPId", type: "string" }],
          outputs: [{ name: "", type: "string[]" }],
        },
        {
          name: "submitProof",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [
            { name: pid, type: "string" },
            { name: "noteHash", type: "bytes32" },
            { name: "noteUrl", type: "string" },
            { name: "year", type: "uint32" },
            { name: "month", type: "uint8" },
          ],
          outputs: [{ name: "proofId", type: "string" }],
        },
        {
          name: "getProofsByInstitution",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "creatorId", type: "string" }],
          outputs: [{ name: "", type: "string[]" }],
        },
        {
          name: "getProof",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "proofId", type: "string" }],
          outputs: [
            {
              name: "",
              type: "tuple",
              components: [
                { name: "proofId", type: "string" },
                { name: "contractVersion", type: "uint8" },
                { name: "prover", type: "string" },
                { name: pid, type: "string" },
                { name: "noteHash", type: "bytes32" },
                { name: "noteUrl", type: "string" },
                { name: "timestamp", type: "uint256" },
              ],
            },
          ],
        }
      );
    }
    if (odpSupportsV03(generation)) {
      abi.push(
        {
          name: "detachPAffiliation",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [{ name: "childPId", type: "string" }],
          outputs: [],
        },
        {
          name: "getPAffiliationAudit",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "childPId", type: "string" }],
          outputs: [
            { name: "activeParent", type: "string" },
            { name: "joinedAt", type: "uint256" },
            { name: "detachedAt", type: "uint256" },
            { name: "lastDetachedFromParent", type: "string" },
          ],
        },
        {
          name: "getPAffiliatedChildrenPaged",
          type: "function",
          stateMutability: "view",
          inputs: [
            { name: "parentPId", type: "string" },
            { name: "offset", type: "uint256" },
            { name: "limit", type: "uint256" },
          ],
          outputs: [
            { name: "result", type: "string[]" },
            { name: "total", type: "uint256" },
          ],
        }
      );
    }
    return abi;
  }

  /**
   * Read-only ABI for verify.html. Pass probed **generation** (CONTRACT_VERSION uint8) so `getPassport` tuple matches chain.
   * @param {number} [generation] defaults to 2 (v0.2-shaped) when unknown — prefer RPC probe first.
   */
  function odpBuildVerifyReadAbi(generation, net) {
    var gen = generation == null || generation === undefined ? 2 : generation;
    var pid = odpPassportIdAbiName(gen, net);
    var abi = [
      CV_ABI[0],
      {
        name: "getCreator",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "creatorId", type: "string" }],
        outputs: [
          {
            name: "",
            type: "tuple",
            components: [
              { name: "creatorId", type: "string" },
              { name: "wallet", type: "address" },
              { name: "typePrefix", type: "bytes1" },
              { name: "timestamp", type: "uint256" },
            ],
          },
        ],
      },
      {
        name: "getCreatorByWallet",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "wallet", type: "address" }],
        outputs: [{ name: "", type: "string" }],
      },
      {
        name: "getProofsForPassport",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: pid, type: "string" }],
        outputs: [{ name: "", type: "string[]" }],
      },
      {
        name: "getProof",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "proofId", type: "string" }],
        outputs: [
          {
            name: "",
            type: "tuple",
            components: [
              { name: "proofId", type: "string" },
              { name: "contractVersion", type: "uint8" },
              { name: "prover", type: "string" },
              { name: pid, type: "string" },
              { name: "noteHash", type: "bytes32" },
              { name: "noteUrl", type: "string" },
              { name: "timestamp", type: "uint256" },
            ],
          },
        ],
      },
      {
        name: "getCounterfeitConcern",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: pid, type: "string" }],
        outputs: [
          { name: "active", type: "bool" },
          { name: "proverCreatorId", type: "string" },
          { name: "reasonHash", type: "bytes32" },
          { name: "timestamp", type: "uint256" },
        ],
      },
      {
        name: "isPAffiliationPending",
        type: "function",
        stateMutability: "view",
        inputs: [
          { name: "parentPId", type: "string" },
          { name: "childPId", type: "string" },
        ],
        outputs: [{ name: "", type: "bool" }],
      },
      {
        name: "getPAffiliatedParent",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "childPId", type: "string" }],
        outputs: [{ name: "", type: "string" }],
      },
      {
        name: "getPAffiliatedChildren",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "parentPId", type: "string" }],
        outputs: [{ name: "", type: "string[]" }],
      },
    ];
    if (gen >= 5) {
      abi.push(
        {
          name: "getPassportHeader",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: pid, type: "string" }],
          outputs: [{ name: "", type: "tuple", components: odpPassportHeaderViewComponents(gen, net) }],
        },
        {
          name: "getPassportClassification",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: pid, type: "string" }],
          outputs: [{ name: "", type: "tuple", components: odpPassportClassificationViewComponents() }],
        },
        {
          name: "getPassportMedia",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: pid, type: "string" }],
          outputs: [{ name: "", type: "tuple", components: odpPassportMediaViewComponents(gen) }],
        }
      );
      if (odpSupportsV06(gen)) {
        abi.push({
          name: "getPassportEvents",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: pid, type: "string" }],
          outputs: [{ name: "", type: "tuple", components: odpPassportEventsViewComponents() }],
        });
      } else {
        abi.push(
          {
            name: "getPassportPhysical",
            type: "function",
            stateMutability: "view",
            inputs: [{ name: pid, type: "string" }],
            outputs: [{ name: "", type: "tuple", components: odpPassportPhysicalViewComponents() }],
          },
          {
            name: "getPassportState",
            type: "function",
            stateMutability: "view",
            inputs: [{ name: pid, type: "string" }],
            outputs: [{ name: "", type: "tuple", components: odpPassportStateViewComponents() }],
          }
        );
      }
    } else {
      abi.push(
        {
          name: "getPassport",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: pid, type: "string" }],
          outputs: [{ name: "", type: "tuple", components: odpPassportTupleComponents(gen, net) }],
        },
        {
          name: "exists",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: pid, type: "string" }],
          outputs: [{ name: "", type: "bool" }],
        }
      );
    }
    if (odpSupportsV03(gen)) {
      abi.push(
        {
          name: "getPAffiliationAudit",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "childPId", type: "string" }],
          outputs: [
            { name: "activeParent", type: "string" },
            { name: "joinedAt", type: "uint256" },
            { name: "detachedAt", type: "uint256" },
            { name: "lastDetachedFromParent", type: "string" },
          ],
        },
        {
          name: "governance",
          type: "function",
          stateMutability: "view",
          inputs: [],
          outputs: [{ name: "", type: "address" }],
        },
        {
          name: "getCreatorPublishingDelegation",
          type: "function",
          stateMutability: "view",
          inputs: [{ name: "creatorWallet", type: "address" }],
          outputs: [
            { name: "agent", type: "address" },
            { name: "expiresAt", type: "uint256" },
          ],
        },
        {
          name: "getPassportsByCreatorPaged",
          type: "function",
          stateMutability: "view",
          inputs: [
            { name: "creator", type: "address" },
            { name: "offset", type: "uint256" },
            { name: "limit", type: "uint256" },
          ],
          outputs: [
            { name: "result", type: "string[]" },
            { name: "total", type: "uint256" },
          ],
        }
      );
    }
    if (gen === 2) {
      abi.push({
        name: "getExternalDocumentAttestation",
        type: "function",
        stateMutability: "view",
        inputs: [
          { name: "wallet", type: "address" },
          { name: "documentHash", type: "bytes32" },
        ],
        outputs: [
          { name: "attested", type: "bool" },
          { name: "creatorId", type: "string" },
          { name: "timestamp", type: "uint256" },
          { name: "documentUri", type: "string" },
        ],
      });
    }
    return abi;
  }

  async function odpFinalizeWalletContract(net, signer, rpcFallbacks, kind) {
    var probed = await odpProbeContractGenerationCached(net.contract, net.chainId, rpcFallbacks, global.ethers);
    var gen = odpResolveGeneration(probed, net);
    if (gen === 0) {
      return {
        contract: null,
        generation: null,
        abi: null,
        legacyUnsupported: true,
        message: ODP_UNSUPPORTED_LEGACY_CONTRACT_MSG,
      };
    }
    var abi = kind === "creator" ? odpBuildCreatorAbi(gen, net) : odpBuildPassportAbi(gen, net);
    var contract = new global.ethers.Contract(net.contract, abi, signer);
    return { contract: contract, generation: gen, abi: abi, legacyUnsupported: false };
  }

  async function odpGetPassportRecord(contract, passportId) {
    if (!contract || !passportId) throw new Error("contract and passportId required");
    if (typeof contract.getPassport === "function") {
      return await contract.getPassport(passportId);
    }
    var calls = [
      contract.getPassportHeader(passportId),
      contract.getPassportClassification(passportId),
      contract.getPassportMedia(passportId),
    ];
    if (typeof contract.getPassportEvents === "function") {
      // v2 (gen >= 6): physical/state views are replaced by the append-only event summary
      calls.push(contract.getPassportEvents(passportId));
    } else {
      calls.push(contract.getPassportPhysical(passportId), contract.getPassportState(passportId));
    }
    var parts = await Promise.all(calls);
    var merged = {};
    function normalizeResult(part) {
      if (part && typeof part.toObject === "function") return part.toObject();
      return part || {};
    }
    for (var i = 0; i < parts.length; i++) {
      var part = normalizeResult(parts[i]);
      for (var k in part) {
        if (Object.prototype.hasOwnProperty.call(part, k) && isNaN(Number(k))) {
          merged[k] = part[k];
        }
      }
    }
    return merged;
  }

  /** MetaMask / EIP-1193: pick one provider when `window.ethereum.providers` exists. */
  function odpInjectedEthereum() {
    var w = global.ethereum;
    if (!w) return null;
    if (w.providers && w.providers.length) {
      return w.providers.find(function (p) {
        return p && p.isMetaMask;
      }) || w.providers[0];
    }
    return w;
  }

  /** Public Polygon RPC endpoints for `wallet_addEthereumChain` when the wallet has no chain yet. */
  function odpDefaultPolygonRpcUrls(cfg) {
    var out = [];
    var seen = {};
    function push(u) {
      if (!u || typeof u !== "string") return;
      var k = u.trim();
      if (!k || seen[k]) return;
      seen[k] = true;
      out.push(k);
    }
    if (cfg && Array.isArray(cfg.rpcUrls)) {
      for (var i = 0; i < cfg.rpcUrls.length; i++) push(cfg.rpcUrls[i]);
    }
    if (cfg && cfg.rpc) push(String(cfg.rpc));
    push("https://polygon-bor.publicnode.com");
    push("https://1rpc.io/matic");
    push("https://polygon.drpc.org");
    return out.length ? out : ["https://polygon-bor.publicnode.com"];
  }

  /** Ask the injected wallet to use `cfg.chainId` (Polygon PoS in reference builds). */
  function odpEnsureWalletChain(eth, cfg) {
    if (!eth || !cfg) return Promise.resolve();
    var target = cfg.chainId;
    return eth.request({ method: "eth_chainId" }).then(function (hex) {
      var cur = parseInt(hex, 16);
      if (cur === target) return;
      var chainIdHex = "0x" + target.toString(16);
      var rpcList = odpDefaultPolygonRpcUrls(cfg);
      return eth
        .request({ method: "wallet_switchEthereumChain", params: [{ chainId: chainIdHex }] })
        .catch(function (e) {
          if (e && e.code === 4902) {
            return eth.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: chainIdHex,
                  chainName: cfg.name || "Polygon PoS",
                  nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
                  rpcUrls: rpcList,
                  blockExplorerUrls: cfg.explorer ? [String(cfg.explorer)] : ["https://polygonscan.com"],
                },
              ],
            });
          }
          throw e;
        });
    });
  }

  var ODP_OFFLINE_VERSION = 1;
  var ODP_OFFLINE_NDEF_TYPE = "odp:off";
  var ODP_OFFLINE_CARRIER_LEGACY = "legacy";
  var ODP_OFFLINE_CARRIER_NDPP = "odp-in-ndpp";
  var ODP_OFFLINE_NDEF_URI_TYPE = "U";
  var ODP_OFFLINE_NDEF_URI_PREFIXES = [
    "",
    "http://www.",
    "https://www.",
    "http://",
    "https://",
    "tel:",
    "mailto:",
    "ftp://anonymous:anonymous@",
    "ftp://ftp.",
    "ftps://",
    "sftp://",
    "smb://",
    "nfs://",
    "ftp://",
    "dav://",
    "news:",
    "telnet://",
    "imap:",
    "rtsp://",
    "urn:",
    "pop:",
    "sip:",
    "sips:",
    "tftp:",
    "btspp://",
    "btl2cap://",
    "btgoep://",
    "tcpobex://",
    "irdaobex://",
    "file://",
    "urn:epc:id:",
    "urn:epc:tag:",
    "urn:epc:pat:",
    "urn:epc:raw:",
    "urn:epc:",
    "urn:nfc:",
  ];
  var ODP_OFFLINE_TARGET_BYTES = 180;
  var ODP_OFFLINE_SOFT_MAX_BYTES = 200;
  var ODP_OFFLINE_HARD_MAX_BYTES = 256;

  function odpOfflineUtf8Bytes(text) {
    return new global.TextEncoder().encode(String(text == null ? "" : text));
  }

  // #region agent log
  function odpOfflineDebugLog(location, message, data, hypothesisId) {
    if (!global || typeof global.fetch !== "function") return;
    global.fetch("http://127.0.0.1:7870/ingest/2f5a31df-775f-46ef-a661-30ac4fb319a1", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c94472" },
      body: JSON.stringify({
        sessionId: "c94472",
        runId: "pre-fix",
        hypothesisId: hypothesisId || "A",
        location: location,
        message: message,
        data: data || {},
        timestamp: Date.now(),
      }),
    }).catch(function () {});
  }
  // #endregion

  function odpOfflineHexToBytes(hex, expectedLength) {
    var s = String(hex == null ? "" : hex).trim();
    if (!/^0x[0-9a-fA-F]*$/.test(s) || s.length % 2 !== 0) throw new Error("Invalid hex bytes");
    var out = new Uint8Array((s.length - 2) / 2);
    for (var i = 0; i < out.length; i++) out[i] = parseInt(s.slice(2 + i * 2, 4 + i * 2), 16);
    if (expectedLength != null && out.length !== expectedLength) throw new Error("Unexpected byte length");
    return out;
  }

  function odpOfflineBytesToHex(bytes) {
    var b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
    var out = "0x";
    for (var i = 0; i < b.length; i++) out += b[i].toString(16).padStart(2, "0");
    return out;
  }

  function odpOfflineConcatBytes(parts) {
    var total = 0;
    for (var i = 0; i < parts.length; i++) total += parts[i].length;
    var out = new Uint8Array(total);
    var offset = 0;
    for (var j = 0; j < parts.length; j++) {
      out.set(parts[j], offset);
      offset += parts[j].length;
    }
    return out;
  }

  function odpOfflineEncodeCborUint(major, value) {
    if (!Number.isInteger(value) || value < 0) throw new Error("CBOR encoder supports only non-negative integers");
    if (value < 24) return new Uint8Array([(major << 5) | value]);
    if (value < 256) return new Uint8Array([(major << 5) | 24, value]);
    if (value < 65536) return new Uint8Array([(major << 5) | 25, (value >> 8) & 255, value & 255]);
    if (value <= 0xffffffff) {
      return new Uint8Array([(major << 5) | 26, (value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255]);
    }
    throw new Error("CBOR integer too large");
  }

  function odpOfflineEncodeCborValue(value) {
    if (value instanceof Uint8Array) {
      return odpOfflineConcatBytes([odpOfflineEncodeCborUint(2, value.length), value]);
    }
    if (typeof value === "string") {
      var textBytes = odpOfflineUtf8Bytes(value);
      return odpOfflineConcatBytes([odpOfflineEncodeCborUint(3, textBytes.length), textBytes]);
    }
    if (typeof value === "number") {
      return odpOfflineEncodeCborUint(0, value);
    }
    if (Array.isArray(value)) {
      var items = [odpOfflineEncodeCborUint(4, value.length)];
      for (var i = 0; i < value.length; i++) items.push(odpOfflineEncodeCborValue(value[i]));
      return odpOfflineConcatBytes(items);
    }
    if (value && typeof value === "object") {
      var keys = Object.keys(value).sort(function (a, b) {
        var na = Number(a);
        var nb = Number(b);
        if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
        return String(a).localeCompare(String(b));
      });
      var parts = [odpOfflineEncodeCborUint(5, keys.length)];
      for (var j = 0; j < keys.length; j++) {
        var key = keys[j];
        var nk = Number(key);
        parts.push(odpOfflineEncodeCborValue(Number.isFinite(nk) ? nk : String(key)));
        parts.push(odpOfflineEncodeCborValue(value[key]));
      }
      return odpOfflineConcatBytes(parts);
    }
    throw new Error("Unsupported CBOR value");
  }

  function odpOfflineReadCborLength(bytes, offset, ai) {
    if (ai < 24) return { value: ai, offset: offset };
    if (ai === 24) {
      if (offset >= bytes.length) throw new Error("Truncated CBOR");
      return { value: bytes[offset], offset: offset + 1 };
    }
    if (ai === 25) {
      if (offset + 1 >= bytes.length) throw new Error("Truncated CBOR");
      return { value: (bytes[offset] << 8) | bytes[offset + 1], offset: offset + 2 };
    }
    if (ai === 26) {
      if (offset + 3 >= bytes.length) throw new Error("Truncated CBOR");
      return {
        value: bytes[offset] * 0x1000000 + ((bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]),
        offset: offset + 4,
      };
    }
    throw new Error("Unsupported CBOR additional info");
  }

  function odpOfflineDecodeCborValue(bytes, offset) {
    if (offset >= bytes.length) throw new Error("Truncated CBOR");
    var first = bytes[offset++];
    var major = first >> 5;
    var ai = first & 31;
    var meta = odpOfflineReadCborLength(bytes, offset, ai);
    var len = meta.value;
    offset = meta.offset;
    if (major === 0) return { value: len, offset: offset };
    if (major === 2) {
      if (offset + len > bytes.length) throw new Error("Truncated CBOR bytes");
      return { value: bytes.slice(offset, offset + len), offset: offset + len };
    }
    if (major === 3) {
      if (offset + len > bytes.length) throw new Error("Truncated CBOR string");
      return { value: new global.TextDecoder().decode(bytes.slice(offset, offset + len)), offset: offset + len };
    }
    if (major === 4) {
      var arr = [];
      for (var i = 0; i < len; i++) {
        var item = odpOfflineDecodeCborValue(bytes, offset);
        arr.push(item.value);
        offset = item.offset;
      }
      return { value: arr, offset: offset };
    }
    if (major === 5) {
      var obj = {};
      for (var j = 0; j < len; j++) {
        var key = odpOfflineDecodeCborValue(bytes, offset);
        offset = key.offset;
        var value = odpOfflineDecodeCborValue(bytes, offset);
        offset = value.offset;
        obj[String(key.value)] = value.value;
      }
      return { value: obj, offset: offset };
    }
    throw new Error("Unsupported CBOR major type");
  }

  function odpOfflineObjectTypeToCode(objectType) {
    var v = String(objectType == null ? "" : objectType).trim().toLowerCase();
    if (v === "physical") return 0;
    if (v === "digital") return 1;
    if (v === "mixed") return 2;
    throw new Error("Unsupported object type for odpOffline");
  }

  function odpOfflineObjectTypeFromCode(code) {
    if (Number(code) === 0) return "physical";
    if (Number(code) === 1) return "digital";
    if (Number(code) === 2) return "mixed";
    return "unknown";
  }

  function odpOfflineContentClassFromCode(code) {
    switch (Number(code)) {
      case 1: return "static";
      case 2: return "time_based";
      case 3: return "spatial";
      case 4: return "textual";
      case 5: return "composite";
      case 6: return "executable";
      default: return "unknown";
    }
  }

  function odpOfflineVerificationMethodFromCode(code) {
    switch (Number(code)) {
      case 1: return "self_asserted";
      case 2: return "institutional";
      case 3: return "nfc";
      case 4: return "c2pa";
      case 5: return "hybrid";
      default: return "unknown";
    }
  }

  function odpOfflineLifecycleStatusFromCode(code) {
    switch (Number(code)) {
      case 1: return "concept";
      case 2: return "prototype";
      case 3: return "produced_object";
      case 4: return "archived";
      default: return "unknown";
    }
  }

  function odpOfflineTruncateUtf8(text, maxBytes) {
    var src = String(text == null ? "" : text);
    var out = "";
    var used = 0;
    var truncated = false;
    for (var i = 0; i < src.length; i++) {
      var next = src.charAt(i);
      var cc = src.charCodeAt(i);
      if (cc >= 0xd800 && cc <= 0xdbff && i + 1 < src.length) {
        next = src.slice(i, i + 2);
        i += 1;
      }
      var size = odpOfflineUtf8Bytes(next).length;
      if (used + size > maxBytes) {
        truncated = true;
        break;
      }
      out += next;
      used += size;
    }
    return { value: out, bytes: used, truncated: truncated };
  }

  function odpOfflineToSemantic(decoded) {
    var top = decoded || {};
    var reg = Array.isArray(top["1"]) ? top["1"] : [];
    var identity = top["2"] || {};
    var state = top["3"] || null;
    var flags = state ? Number(state["2"] || 0) : 0;
    return {
      version: Number(top["0"] || 0),
      registry: {
        chainId: Number(reg[0] || 0),
        contract: reg[1] instanceof Uint8Array ? odpOfflineBytesToHex(reg[1]) : "",
        contractVersion: Number(reg[2] || 0),
      },
      identity: {
        passportId: String(identity["0"] || ""),
        creatorId: String(identity["1"] || ""),
        title: String(identity["2"] || ""),
        objectTypeCode: Number(identity["3"] || 0),
        objectType: odpOfflineObjectTypeFromCode(identity["3"]),
        contentClassCode: Number(identity["4"] || 0),
        contentClass: odpOfflineContentClassFromCode(identity["4"]),
        verificationMethodCode: Number(identity["5"] || 0),
        verificationMethod: odpOfflineVerificationMethodFromCode(identity["5"]),
        dataHash: identity["6"] instanceof Uint8Array ? odpOfflineBytesToHex(identity["6"]) : "",
      },
      state: state
        ? {
            asOf: Number(state["0"] || 0),
            statusCode: Number(state["1"] || 0),
            status: odpOfflineLifecycleStatusFromCode(state["1"]),
            flags: flags,
            revoked: !!(flags & 1),
            counterfeitConcern: !!(flags & 2),
          }
        : null,
    };
  }

  function odpOfflineEncodeNdefRecord(record, isFirst, isLast) {
    var rec = record || {};
    var payload = rec.payloadBytes instanceof Uint8Array ? rec.payloadBytes : new Uint8Array(rec.payloadBytes || []);
    var typeBytes = rec.typeBytes instanceof Uint8Array ? rec.typeBytes : odpOfflineUtf8Bytes(String(rec.type || ""));
    var header = Number(rec.tnf) & 0x07;
    if (isFirst) header |= 0x80;
    if (isLast) header |= 0x40;
    if (payload.length <= 255) header |= 0x10;
    var out = [new Uint8Array([header, typeBytes.length])];
    if (payload.length <= 255) {
      out.push(new Uint8Array([payload.length]));
    } else {
      out.push(new Uint8Array([
        (payload.length >>> 24) & 255,
        (payload.length >>> 16) & 255,
        (payload.length >>> 8) & 255,
        payload.length & 255,
      ]));
    }
    out.push(typeBytes, payload);
    return odpOfflineConcatBytes(out);
  }

  function odpOfflineEncodeNdefRecords(records) {
    var src = Array.isArray(records) ? records : [];
    if (!src.length) throw new Error("At least one NDEF record required");
    var parts = [];
    for (var i = 0; i < src.length; i++) {
      parts.push(odpOfflineEncodeNdefRecord(src[i], i === 0, i === src.length - 1));
    }
    return odpOfflineConcatBytes(parts);
  }

  function odpOfflineEncodeUriPayload(uri) {
    var text = String(uri == null ? "" : uri).trim();
    if (!/^https?:\/\//i.test(text)) throw new Error("Absolute http(s) verify URL required for NDPP carrier");
    var lower = text.toLowerCase();
    var bestCode = 0;
    var bestPrefix = "";
    for (var i = 1; i < ODP_OFFLINE_NDEF_URI_PREFIXES.length; i++) {
      var prefix = ODP_OFFLINE_NDEF_URI_PREFIXES[i];
      if (prefix && lower.indexOf(prefix) === 0 && prefix.length > bestPrefix.length) {
        bestCode = i;
        bestPrefix = prefix;
      }
    }
    return odpOfflineConcatBytes([
      new Uint8Array([bestCode]),
      odpOfflineUtf8Bytes(bestPrefix ? text.slice(bestPrefix.length) : text),
    ]);
  }

  function odpOfflineDecodeUriPayload(payloadBytes) {
    var payload = payloadBytes instanceof Uint8Array ? payloadBytes : new Uint8Array(payloadBytes || []);
    if (!payload.length) return "";
    var prefixCode = payload[0];
    var prefix = ODP_OFFLINE_NDEF_URI_PREFIXES[prefixCode] || "";
    return prefix + new global.TextDecoder().decode(payload.slice(1));
  }

  function odpOfflineEncodeNdefMessage(payloadBytes, opts) {
    var payload = payloadBytes instanceof Uint8Array ? payloadBytes : new Uint8Array(payloadBytes || []);
    var options = opts || {};
    var carrierMode = String(options.carrierMode || ODP_OFFLINE_CARRIER_LEGACY).trim().toLowerCase() === ODP_OFFLINE_CARRIER_NDPP
      ? ODP_OFFLINE_CARRIER_NDPP
      : ODP_OFFLINE_CARRIER_LEGACY;
    var records = [];
    var uriPayloadBytes = null;
    if (carrierMode === ODP_OFFLINE_CARRIER_NDPP) {
      uriPayloadBytes = odpOfflineEncodeUriPayload(options.verifyUrl || "");
      records.push({
        tnf: 0x01,
        type: ODP_OFFLINE_NDEF_URI_TYPE,
        payloadBytes: uriPayloadBytes,
      });
    }
    records.push({
      tnf: 0x04,
      type: ODP_OFFLINE_NDEF_TYPE,
      payloadBytes: payload,
    });
    var encoded = odpOfflineEncodeNdefRecords(records);
    // #region agent log
    odpOfflineDebugLog("odp-contract.js:odpOfflineEncodeNdefMessage", "ndef message size breakdown", {
      carrierMode: carrierMode,
      recordCount: records.length,
      verifyUrlChars: String(options.verifyUrl || "").length,
      uriPayloadBytes: uriPayloadBytes ? uriPayloadBytes.length : 0,
      payloadBytes: payload.length,
      messageBytes: encoded.length,
      messageOverheadBytes: encoded.length - payload.length - (uriPayloadBytes ? uriPayloadBytes.length : 0),
      targetBytes: ODP_OFFLINE_TARGET_BYTES,
      hardMaxBytes: ODP_OFFLINE_HARD_MAX_BYTES,
    }, carrierMode === ODP_OFFLINE_CARRIER_NDPP ? "A" : "D");
    // #endregion
    return encoded;
  }

  function odpOfflineWrapNdefFile(messageBytes) {
    var msg = messageBytes instanceof Uint8Array ? messageBytes : new Uint8Array(messageBytes || []);
    if (msg.length > 0xffff) throw new Error("NDEF message too large");
    return odpOfflineConcatBytes([new Uint8Array([(msg.length >> 8) & 255, msg.length & 255]), msg]);
  }

  function odpOfflineReadNdefMessage(bytes) {
    var fileBytes = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
    var buf = fileBytes;
    if (buf.length >= 3) {
      var nlen = (buf[0] << 8) | buf[1];
      if (nlen > 0 && nlen <= buf.length - 2) buf = buf.slice(2, 2 + nlen);
    }
    if (!buf.length) throw new Error("Empty NDEF message");
    var offset = 0;
    var records = [];
    while (offset < buf.length) {
      var header = buf[offset++];
      var me = !!(header & 0x40);
      var cf = !!(header & 0x20);
      var sr = !!(header & 0x10);
      var il = !!(header & 0x08);
      var tnf = header & 0x07;
      if (cf) throw new Error("Chunked NDEF records are not supported");
      if (offset >= buf.length) throw new Error("Truncated NDEF");
      var typeLen = buf[offset++];
      var payloadLen;
      if (sr) {
        if (offset >= buf.length) throw new Error("Truncated NDEF payload length");
        payloadLen = buf[offset++];
      } else {
        if (offset + 3 >= buf.length) throw new Error("Truncated NDEF payload length");
        payloadLen = buf[offset] * 0x1000000 + ((buf[offset + 1] << 16) | (buf[offset + 2] << 8) | buf[offset + 3]);
        offset += 4;
      }
      var idLen = 0;
      if (il) {
        if (offset >= buf.length) throw new Error("Truncated NDEF id length");
        idLen = buf[offset++];
      }
      if (offset + typeLen + idLen + payloadLen > buf.length) throw new Error("Truncated NDEF body");
      var typeBytes = buf.slice(offset, offset + typeLen);
      var type = new global.TextDecoder().decode(typeBytes);
      offset += typeLen;
      var idBytes = idLen ? buf.slice(offset, offset + idLen) : new Uint8Array([]);
      offset += idLen;
      var payloadBytes = buf.slice(offset, offset + payloadLen);
      offset += payloadLen;
      var rec = {
        index: records.length,
        tnf: tnf,
        type: type,
        typeBytes: typeBytes,
        idBytes: idBytes,
        payloadBytes: payloadBytes,
      };
      if (tnf === 0x01 && type === ODP_OFFLINE_NDEF_URI_TYPE) {
        rec.uri = odpOfflineDecodeUriPayload(payloadBytes);
      }
      records.push(rec);
      if (me) break;
    }
    if (!records.length) throw new Error("Empty NDEF message");
    var payloadRecord = null;
    for (var i = 0; i < records.length; i++) {
      if (records[i].tnf === 0x04 && records[i].type === ODP_OFFLINE_NDEF_TYPE) {
        payloadRecord = records[i];
        break;
      }
    }
    if (!payloadRecord) throw new Error("NDEF carrier does not contain an odp:off payload record");
    var first = records[0];
    var carrierMode = records.length === 1 && payloadRecord.index === 0
      ? ODP_OFFLINE_CARRIER_LEGACY
      : (first && first.tnf === 0x01 && first.type === ODP_OFFLINE_NDEF_URI_TYPE
        ? ODP_OFFLINE_CARRIER_NDPP
        : "mixed");
    return {
      type: payloadRecord.type,
      payloadBytes: payloadRecord.payloadBytes,
      messageBytes: buf,
      fileBytes: fileBytes,
      records: records,
      carrierMode: carrierMode,
      primaryUri: first && first.uri ? first.uri : "",
    };
  }

  function odpOfflineNdefFootprint(payloadBytesLength, ndefFileBytesLength) {
    var payloadLen = Number(payloadBytesLength || 0);
    var fileBytes = Number(ndefFileBytesLength || 0);
    if (!fileBytes) {
      var messageBytesDefault = 3 + odpOfflineUtf8Bytes(ODP_OFFLINE_NDEF_TYPE).length + payloadLen;
      fileBytes = messageBytesDefault + 2;
    }
    var messageBytes = Math.max(0, fileBytes - 2);
    return {
      payloadBytes: payloadLen,
      messageBytes: messageBytes,
      ndefFileBytes: fileBytes,
      targetBytes: ODP_OFFLINE_TARGET_BYTES,
      softMaxBytes: ODP_OFFLINE_SOFT_MAX_BYTES,
      hardMaxBytes: ODP_OFFLINE_HARD_MAX_BYTES,
      withinTarget: fileBytes <= ODP_OFFLINE_TARGET_BYTES,
      withinSoftMax: fileBytes <= ODP_OFFLINE_SOFT_MAX_BYTES,
      withinHardMax: fileBytes <= ODP_OFFLINE_HARD_MAX_BYTES,
    };
  }

  function odpOfflineBytesToBase64(bytes) {
    var b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
    var binary = "";
    for (var i = 0; i < b.length; i++) binary += String.fromCharCode(b[i]);
    return global.btoa(binary);
  }

  function odpOfflineBytesFromBase64(text) {
    var raw = global.atob(String(text == null ? "" : text).trim());
    var out = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }

  function odpOfflineBuildMap(passport, opts) {
    if (!passport) throw new Error("Passport record required");
    var options = opts || {};
    var contractAddr = options.contractAddress || passport.contractAddress || (global.NET && global.NET.contract) || "";
    var chainId = options.chainId != null ? Number(options.chainId) : Number((global.NET && global.NET.chainId) || 0);
    var contractVersion = options.contractVersion != null ? Number(options.contractVersion) : Number(passport.contractVersion || 0);
    if (!/^0x[0-9a-fA-F]{40}$/.test(String(contractAddr || "").trim())) throw new Error("Valid contract address required");
    if (!passport.dataHash) throw new Error("dataHash required");
    var title = odpOfflineTruncateUtf8(passport.title || "", options.maxTitleBytes != null ? Number(options.maxTitleBytes) : 48);
    var map = {
      0: ODP_OFFLINE_VERSION,
      1: [chainId, odpOfflineHexToBytes(String(contractAddr).trim(), 20), contractVersion],
      2: {
        0: String(options.passportId || passport.passportId || passport.humanId || ""),
        1: String(passport.creatorId || ""),
        2: title.value,
        3: odpOfflineObjectTypeToCode(passport.objectType),
        4: Number(passport.contentClass || 0),
        5: Number(passport.verificationMethod || 0),
        6: odpOfflineHexToBytes(String(passport.dataHash || ""), 32),
      },
    };
    if (!map[2][0]) throw new Error("Passport ID required");
    if (!map[2][1]) throw new Error("creatorId required");
    if (options.includeState) {
      var flags = 0;
      if (passport.revoked) flags |= 1;
      if (passport.counterfeitConcernActive) flags |= 2;
      map[3] = {
        0: options.asOf != null ? Number(options.asOf) : Math.floor(Date.now() / 1000),
        1: Number(passport.lifecycleStatus || 0),
        2: flags,
      };
    }
    return {
      map: map,
      titleBytes: title.bytes,
      titleTruncated: title.truncated,
    };
  }

  function odpOfflineDecodeBytes(bytesLike) {
    var input = bytesLike instanceof Uint8Array ? bytesLike : new Uint8Array(bytesLike || []);
    var raw = input;
    var parsed = null;
    var format = "cbor";
    var carrierMode = "";
    try {
      parsed = odpOfflineReadNdefMessage(raw);
      raw = parsed.payloadBytes;
      carrierMode = String(parsed.carrierMode || "");
      format = carrierMode === ODP_OFFLINE_CARRIER_NDPP ? "ndef-url-first" : "ndef";
    } catch (_) {}
    var decoded = odpOfflineDecodeCborValue(raw, 0);
    if (decoded.offset !== raw.length) throw new Error("Unexpected trailing bytes in odpOffline payload");
    return {
      format: format,
      payloadBytes: raw,
      ndef: parsed,
      carrierMode: carrierMode,
      primaryUri: parsed && parsed.primaryUri ? parsed.primaryUri : "",
      decoded: decoded.value,
      semantic: odpOfflineToSemantic(decoded.value),
      footprint: odpOfflineNdefFootprint(raw.length, parsed ? parsed.fileBytes.length : 0),
    };
  }

  function odpOfflineEncode(passport, opts) {
    var options = opts || {};
    var carrierMode = String(options.carrierMode || ODP_OFFLINE_CARRIER_LEGACY).trim().toLowerCase() === ODP_OFFLINE_CARRIER_NDPP
      ? ODP_OFFLINE_CARRIER_NDPP
      : ODP_OFFLINE_CARRIER_LEGACY;
    function encodeOnce(buildOptions) {
      var built = odpOfflineBuildMap(passport, buildOptions);
      var payloadBytes = odpOfflineEncodeCborValue(built.map);
      var ndefMessageBytes = odpOfflineEncodeNdefMessage(payloadBytes, buildOptions);
      var ndefFileBytes = odpOfflineWrapNdefFile(ndefMessageBytes);
      return {
        built: built,
        payloadBytes: payloadBytes,
        ndefMessageBytes: ndefMessageBytes,
        ndefFileBytes: ndefFileBytes,
      };
    }
    function cloneOptionsWithMaxTitle(maxTitleBytes) {
      var out = {};
      for (var k in options) {
        if (Object.prototype.hasOwnProperty.call(options, k)) out[k] = options[k];
      }
      out.maxTitleBytes = Math.max(0, Number(maxTitleBytes || 0));
      return out;
    }
    var encoded = encodeOnce(options);
    var built = encoded.built;
    var payloadBytes = encoded.payloadBytes;
    var ndefMessageBytes = encoded.ndefMessageBytes;
    var ndefFileBytes = encoded.ndefFileBytes;
    if (carrierMode === ODP_OFFLINE_CARRIER_NDPP && ndefFileBytes.length > ODP_OFFLINE_HARD_MAX_BYTES && built.titleBytes > 0) {
      var maxTitleBytes = options.maxTitleBytes != null
        ? Math.min(Number(options.maxTitleBytes), built.titleBytes)
        : built.titleBytes;
      var guard = 0;
      while (ndefFileBytes.length > ODP_OFFLINE_HARD_MAX_BYTES && maxTitleBytes > 0 && guard < 64) {
        var over = Math.max(1, ndefFileBytes.length - ODP_OFFLINE_HARD_MAX_BYTES);
        maxTitleBytes = Math.max(0, maxTitleBytes - over);
        encoded = encodeOnce(cloneOptionsWithMaxTitle(maxTitleBytes));
        built = encoded.built;
        payloadBytes = encoded.payloadBytes;
        ndefMessageBytes = encoded.ndefMessageBytes;
        ndefFileBytes = encoded.ndefFileBytes;
        guard++;
      }
      // #region agent log
      odpOfflineDebugLog("odp-contract.js:odpOfflineEncode", "url-first carrier auto-fit", {
        carrierMode: carrierMode,
        finalMaxTitleBytes: maxTitleBytes,
        titleBytes: built.titleBytes,
        titleTruncated: built.titleTruncated,
        ndefFileBytes: ndefFileBytes.length,
        hardMaxBytes: ODP_OFFLINE_HARD_MAX_BYTES,
        fit: ndefFileBytes.length <= ODP_OFFLINE_HARD_MAX_BYTES,
      }, "B");
      // #endregion
    }
    // #region agent log
    odpOfflineDebugLog("odp-contract.js:odpOfflineEncode", "offline payload size breakdown", {
      carrierMode: carrierMode,
      includeState: !!options.includeState,
      passportIdChars: String(options.passportId || passport.passportId || passport.humanId || "").length,
      creatorIdChars: String(passport.creatorId || "").length,
      titleBytes: built.titleBytes,
      titleTruncated: built.titleTruncated,
      verifyUrlChars: String(options.verifyUrl || "").length,
      payloadBytes: payloadBytes.length,
      ndefMessageBytes: ndefMessageBytes.length,
      ndefFileBytes: ndefFileBytes.length,
      overTargetBytes: ndefFileBytes.length - ODP_OFFLINE_TARGET_BYTES,
      overHardMaxBytes: ndefFileBytes.length - ODP_OFFLINE_HARD_MAX_BYTES,
    }, options.includeState ? "C" : "A");
    // #endregion
    return {
      version: ODP_OFFLINE_VERSION,
      payloadBytes: payloadBytes,
      ndefMessageBytes: ndefMessageBytes,
      ndefFileBytes: ndefFileBytes,
      carrierMode: carrierMode,
      verifyUrl: carrierMode === ODP_OFFLINE_CARRIER_NDPP ? String(options.verifyUrl || "") : "",
      payloadHex: odpOfflineBytesToHex(payloadBytes),
      payloadBase64: odpOfflineBytesToBase64(payloadBytes),
      decoded: built.map,
      semantic: odpOfflineToSemantic(built.map),
      titleBytes: built.titleBytes,
      titleTruncated: built.titleTruncated,
      footprint: odpOfflineNdefFootprint(payloadBytes.length, ndefFileBytes.length),
    };
  }

  function odpOfflineSha256Hex(bytesLike) {
    var raw = bytesLike instanceof Uint8Array ? bytesLike : new Uint8Array(bytesLike || []);
    return global.crypto.subtle.digest("SHA-256", raw).then(function (digest) {
      return odpOfflineBytesToHex(new Uint8Array(digest));
    });
  }

  global.ODP_SITE_VERSION = ODP_SITE_VERSION;
  global.ODP_UNSUPPORTED_LEGACY_CONTRACT_MSG = ODP_UNSUPPORTED_LEGACY_CONTRACT_MSG;
  global.ODP_LIVE_BASE = ODP_LIVE_BASE;
  global.odpCanonicalVerifyBase = odpCanonicalVerifyBase;
  global.odpResolvePublicVerifyBase = odpResolvePublicVerifyBase;
  global.odpBuildVerifyUrl = odpBuildVerifyUrl;
  global.ODP_LATEST_STABLE_MAJOR = ODP_LATEST_STABLE_MAJOR;
  global.ODP_OFFLINE_VERSION = ODP_OFFLINE_VERSION;
  global.ODP_OFFLINE_NDEF_TYPE = ODP_OFFLINE_NDEF_TYPE;
  global.ODP_OFFLINE_CARRIER_LEGACY = ODP_OFFLINE_CARRIER_LEGACY;
  global.ODP_OFFLINE_CARRIER_NDPP = ODP_OFFLINE_CARRIER_NDPP;
  global.ODP_OFFLINE_TARGET_BYTES = ODP_OFFLINE_TARGET_BYTES;
  global.ODP_OFFLINE_SOFT_MAX_BYTES = ODP_OFFLINE_SOFT_MAX_BYTES;
  global.ODP_OFFLINE_HARD_MAX_BYTES = ODP_OFFLINE_HARD_MAX_BYTES;
  global.odpProtocolFeeWei = odpProtocolFeeWei;
  global.odpSupportsFolderBaseMint = odpSupportsFolderBaseMint;
  global.odpSupportsOptionalDataUrl = odpSupportsOptionalDataUrl;
  global.odpSupportsV03 = odpSupportsV03;
  global.odpSupportsContentClass = odpSupportsContentClass;
  global.odpSupportsV06 = odpSupportsV06;
  global.odpPassportIdAbiName = odpPassportIdAbiName;
  global.odpCounterfeitConcernAbiFragments = odpCounterfeitConcernAbiFragments;
  global.odpCounterfeitReadContract = odpCounterfeitReadContract;
  global.odpCounterfeitWriteContract = odpCounterfeitWriteContract;
  global.odpCounterfeitSatelliteAddress = odpCounterfeitSatelliteAddress;
  global.odpProofRegistryAbiFragments = odpProofRegistryAbiFragments;
  global.odpRelationsAbiFragments = odpRelationsAbiFragments;
  global.odpProofReadContract = odpProofReadContract;
  global.odpProofWriteContract = odpProofWriteContract;
  global.odpRelationsReadContract = odpRelationsReadContract;
  global.odpRelationsWriteContract = odpRelationsWriteContract;
  global.odpListCreatorPassports = odpListCreatorPassports;
  global.odpEstimateRemainingMints = odpEstimateRemainingMints;
  global.odpSupportsExternalDocAttest = odpSupportsExternalDocAttest;
  global.odpPassportTupleComponents = odpPassportTupleComponents;
  global.odpResolveGeneration = odpResolveGeneration;
  global.odpMergeRegistryConfigAsync = odpMergeRegistryConfigAsync;
  global.odpHasValidRegistryAddress = odpHasValidRegistryAddress;
  global.odpRegistryMisconfiguredBannerHtml = odpRegistryMisconfiguredBannerHtml;
  global.odpApplyInlineRegistryOverrides = odpApplyInlineRegistryOverrides;
  global.odpPersistRegistryContractToSession = odpPersistRegistryContractToSession;
  global.odpFormatStackLabel = odpFormatStackLabel;
  global.odpFormatStackSummaryHtml = odpFormatStackSummaryHtml;
  global.odpFormatStackBlockHtml = odpFormatStackBlockHtml;
  global.odpOpenSiteTrustModal = odpOpenSiteTrustModal;
  global.odpMaybeAutoShowSiteTrustModal = odpMaybeAutoShowSiteTrustModal;
  global.odpStackDisclosureParagraphsHtml = odpStackDisclosureParagraphsHtml;
  global.odpProbeContractGenerationCached = odpProbeContractGenerationCached;
  global.odpClearContractGenerationCache = odpClearContractGenerationCache;
  global.odpBuildPassportAbi = odpBuildPassportAbi;
  global.odpGetPassportRecord = odpGetPassportRecord;
  global.odpOfflineBytesToHex = odpOfflineBytesToHex;
  global.odpOfflineHexToBytes = odpOfflineHexToBytes;
  global.odpOfflineBytesToBase64 = odpOfflineBytesToBase64;
  global.odpOfflineBytesFromBase64 = odpOfflineBytesFromBase64;
  global.odpOfflineEncode = odpOfflineEncode;
  global.odpOfflineDecodeBytes = odpOfflineDecodeBytes;
  global.odpOfflineSha256Hex = odpOfflineSha256Hex;
  global.odpOfflineNdefFootprint = odpOfflineNdefFootprint;
  global.odpOfflineObjectTypeFromCode = odpOfflineObjectTypeFromCode;
  global.odpOfflineContentClassFromCode = odpOfflineContentClassFromCode;
  global.odpOfflineVerificationMethodFromCode = odpOfflineVerificationMethodFromCode;
  global.odpOfflineLifecycleStatusFromCode = odpOfflineLifecycleStatusFromCode;
  global.odpBuildCreatorAbi = odpBuildCreatorAbi;
  global.odpBuildVerifyReadAbi = odpBuildVerifyReadAbi;
  global.odpFinalizeWalletContract = odpFinalizeWalletContract;
  global.odpRequireSingleEthereumAccount = odpRequireSingleEthereumAccount;
  global.odpInstallSingleAccountGuard = odpInstallSingleAccountGuard;
  /** Profile IDs are `C-…`, `B-…`, `P-…`, `M-…` (ASCII). Ignores BOM/trim; requires the hyphen. */
  function odpPassportProfileTypeLetter(id) {
    if (id == null) return "";
    var s = String(id).replace(/^\uFEFF/, "").trim();
    var m = /^([CBPM])-/i.exec(s);
    return m ? m[1].toUpperCase() : "";
  }
  global.odpPassportProfileTypeLetter = odpPassportProfileTypeLetter;
  global.ODP_CREATOR_PROOF_PREFIX = ODP_CREATOR_PROOF_PREFIX;
  global.odpBuildCreatorProofMessageV1 = odpBuildCreatorProofMessageV1;
  global.odpGenerateCreatorProofNonce = odpGenerateCreatorProofNonce;
  global.odpInjectedEthereum = odpInjectedEthereum;
  global.odpEnsureWalletChain = odpEnsureWalletChain;
})(typeof window !== "undefined" ? window : globalThis);
