/**
 * ODP — shared helpers for contract generation detection and ABI selection.
 * README: site semver 0.X.Y vs on-chain deployment generation (CONTRACT_VERSION uint8).
 */
(function (global) {
  "use strict";

  /** Static site / repo release: bump Y for docs-only; bump X with new contract (see README). */
  var ODP_SITE_VERSION = "0.2.0";

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

  /** If RPC probe fails, use net.contractGenerationFallback (number), else 2 (v0.2-shaped). */
  function odpResolveGeneration(probed, net) {
    if (probed !== null && probed !== undefined) return probed;
    if (net && typeof net.contractGenerationFallback === "number") return net.contractGenerationFallback;
    return 2;
  }

  /** Public GitHub Pages base (trailing slash omitted); keep in sync with README live demo links. */
  var ODP_LIVE_BASE = "https://object-digital-passport.github.io/object-digital-passport";

  /** First line of EIP-191 creator proof messages (must match SPEC / verify.html). */
  var ODP_CREATOR_PROOF_PREFIX = "Object Digital Passport — creator wallet proof (EIP-191) v1";

  /**
   * Canonical text signed with the creator wallet (EIP-191 `personal_sign`).
   * @param {string} contractAddress — registry contract (checksum recommended; verifier binds to this line)
   */
  function odpBuildCreatorProofMessageV1(humanId, chainId, contractAddress, nonce) {
    var addr = String(contractAddress || "").trim();
    return [
      ODP_CREATOR_PROOF_PREFIX,
      "",
      "humanId: " + String(humanId),
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
        label: "Red flag",
        title: "Site version 0.x — proof-of-concept; not production-stable.",
      };
    }
    if (maj > L) {
      return {
        level: "yellow",
        label: "Yellow flag",
        title: "Site major is newer than ODP_LATEST_STABLE_MAJOR — confirm release notes before trusting.",
      };
    }
    if (maj >= 1 && maj < L) {
      return {
        level: "yellow",
        label: "Yellow flag",
        title: "Older stable major (not the latest). Review migration and trust assumptions.",
      };
    }
    return {
      level: "green",
      label: "Stable",
      title: "Site major matches the current stable line (≥1.0).",
    };
  }

  function odpFormatStackLabel(generation) {
    var g = generation;
    var spec =
      g >= 3
        ? "ODP spec v0.2+ (gas-only, PDF/doc hash anchor)"
        : g >= 2
          ? "ODP spec v0.2+ (gas-only, optional dataUrl)"
          : g === 0
            ? "legacy CONTRACT_VERSION 0 — not supported by this UI"
            : "unknown generation";
    return "Site " + ODP_SITE_VERSION + " · on-chain generation " + g + " — " + spec;
  }

  function odpSupportsExternalDocAttest(generation) {
    return generation >= 3;
  }

  /**
   * Full stack panel: on-chain generation, read/migration policy, SemVer trust colors (0.x red; stable from 1.0; yellow for older majors when latest is N≥2).
   * Safe HTML (static copy + escaped dynamic parts).
   */
  function odpFormatStackBlockHtml(generation) {
    var g = generation == null ? "?" : String(generation);
    var spec =
      generation === 0
        ? "legacy CONTRACT_VERSION 0 — not supported by this UI"
        : generation >= 3
          ? "ODP spec v0.2+ (gas-only, PDF/doc hash anchor)"
          : generation >= 2
            ? "ODP spec v0.2+ (gas-only, optional dataUrl)"
            : "unknown generation";
    var trust = odpSiteSemverTrust(ODP_SITE_VERSION, ODP_LATEST_STABLE_MAJOR);
    var flagClass = "odp-stack-flag--" + trust.level;
    var L = ODP_LATEST_STABLE_MAJOR;
    var noteSemver;
    if (L <= 1) {
      noteSemver =
        "<strong>0.x</strong> site releases are <strong>red-flag</strong> (experimental). " +
        "Stable SemVer starts at <strong>major 1</strong>. When <strong>several stable majors</strong> exist, " +
        "any major below the latest stable is <strong>yellow-flag</strong> — verify upgrade notes.";
    } else {
      noteSemver =
        "<strong>0.x</strong> = red-flag. <strong>Major " +
        L +
        "</strong> (latest stable) = green. <strong>Majors 1…" +
        (L - 1) +
        "</strong> = yellow-flag — older stable lines; review migration. " +
        "<strong>1.x</strong> patch releases under the same major stay green when that major is current.";
    }
    var noteRead =
      "The read ABI decodes prior <strong>contractVersion</strong> values on-chain. " +
      "The verifier uses the <strong>primary</strong> deployment first; if a record is missing, it tries <strong>previousContracts</strong> (older deployments — separate registries).";

    return (
      '<div class="odp-stack-block">' +
      '<div class="odp-stack-row">' +
      '<span class="odp-stack-flag ' +
      flagClass +
      '" title="' +
      odpEscAttr(trust.title) +
      '">' +
      odpEscHtml(trust.label) +
      "</span>" +
      '<span class="odp-stack-meta"> Site <strong>' +
      odpEscHtml(ODP_SITE_VERSION) +
      "</strong> · on-chain gen <strong>" +
      odpEscHtml(g) +
      "</strong> — " +
      odpEscHtml(spec) +
      "</span></div>" +
      '<p class="odp-stack-note">' +
      noteRead +
      "</p>" +
      '<p class="odp-stack-note">' +
      noteSemver +
      "</p>" +
      "</div>"
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

  async function odpProbeContractGenerationCached(address, chainId, rpcFallbacks, ethersRef) {
    var E = ethersRef || global.ethers;
    if (!address || !E) return null;
    var key = "odp_cv_" + String(address).toLowerCase();
    try {
      var cached = sessionStorage.getItem(key);
      if (cached !== null && cached !== "") return parseInt(cached, 10);
    } catch (e0) {}

    var gen = null;
    for (var i = 0; i < rpcFallbacks.length; i++) {
      try {
        var provider = new E.providers.JsonRpcProvider(rpcFallbacks[i], { name: "polygon", chainId: chainId });
        await provider.getBlockNumber();
        var ctr = new E.Contract(address, CV_ABI, provider);
        gen = (await ctr.CONTRACT_VERSION()).toNumber();
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

  function odpBuildPassportAbi(generation) {
    var folder = generation >= 2;
    var mintMut = "nonpayable";

    var mintPhysicalInputs = [
      { name: "year", type: "uint32" },
      { name: "month", type: "uint8" },
      { name: "dataHash", type: "bytes32" },
      { name: "dataUrl", type: "string" },
      { name: "imageHash", type: "bytes32" },
      { name: "imageUrl", type: "string" },
      { name: "sealType", type: "uint8" },
      { name: "sealHash", type: "bytes32" },
      { name: "nfcPublicKey", type: "bytes" },
      { name: "nfcModel", type: "string" },
    ];
    var mintDigitalInputs = [
      { name: "year", type: "uint32" },
      { name: "month", type: "uint8" },
      { name: "dataHash", type: "bytes32" },
      { name: "dataUrl", type: "string" },
      { name: "imageHash", type: "bytes32" },
      { name: "imageUrl", type: "string" },
      { name: "fileHash", type: "bytes32" },
    ];
    if (folder) {
      mintPhysicalInputs.push({ name: "dataUrlIsFolderBase", type: "bool" });
      mintDigitalInputs.push({ name: "dataUrlIsFolderBase", type: "bool" });
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
        inputs: [{ name: "humanId", type: "string" }],
        outputs: [
          {
            name: "",
            type: "tuple",
            components: [
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
            ],
          },
        ],
      },
      "event PassportMinted(string indexed humanId,address indexed creator,string creatorId,string objectType,uint32 year,uint8 month,bytes32 dataHash,uint8 sealType,string nfcModel,uint256 timestamp)",
      { name: "mintPhysical", type: "function", stateMutability: mintMut, inputs: mintPhysicalInputs, outputs: [{ name: "humanId", type: "string" }] },
      { name: "mintDigital", type: "function", stateMutability: mintMut, inputs: mintDigitalInputs, outputs: [{ name: "humanId", type: "string" }] },
      {
        name: "updatePassportUrls",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
          { name: "humanId", type: "string" },
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
          name: "MONTHLY_LIMIT_C",
          type: "function",
          stateMutability: "view",
          inputs: [],
          outputs: [{ name: "", type: "uint32" }],
        },
        {
          name: "MONTHLY_LIMIT_B",
          type: "function",
          stateMutability: "view",
          inputs: [],
          outputs: [{ name: "", type: "uint32" }],
        }
      );
    }

    return passportAbi;
  }

  function odpBuildCreatorAbi(generation) {
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
    if (generation >= 3) {
      abi.push(
        {
          name: "attestExternalDocument",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [
            { name: "documentHash", type: "bytes32" },
            { name: "documentUri", type: "string" },
          ],
          outputs: [],
        },
        {
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
        }
      );
    }
    return abi;
  }

  /** Read-only ABI for verify.html + deployment generation probe. */
  function odpBuildVerifyReadAbi() {
    var abi = [
      CV_ABI[0],
      {
        name: "getPassport",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "humanId", type: "string" }],
        outputs: [
          {
            name: "",
            type: "tuple",
            components: [
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
            ],
          },
        ],
      },
      {
        name: "resolvePassport",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "humanId", type: "string" }],
        outputs: [
          {
            name: "passport",
            type: "tuple",
            components: [
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
            ],
          },
          {
            name: "creator",
            type: "tuple",
            components: [
              { name: "creatorId", type: "string" },
              { name: "wallet", type: "address" },
              { name: "typePrefix", type: "bytes1" },
              { name: "timestamp", type: "uint256" },
            ],
          },
          { name: "proofCount", type: "uint256" },
          { name: "version", type: "uint8" },
        ],
      },
      {
        name: "exists",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "humanId", type: "string" }],
        outputs: [{ name: "", type: "bool" }],
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
      {
        name: "getProofsForPassport",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "humanId", type: "string" }],
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
              { name: "humanId", type: "string" },
              { name: "noteHash", type: "bytes32" },
              { name: "noteUrl", type: "string" },
              { name: "timestamp", type: "uint256" },
            ],
          },
        ],
      },
    ];
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
    var abi = kind === "creator" ? odpBuildCreatorAbi(gen) : odpBuildPassportAbi(gen);
    var contract = new global.ethers.Contract(net.contract, abi, signer);
    return { contract: contract, generation: gen, abi: abi, legacyUnsupported: false };
  }

  global.ODP_SITE_VERSION = ODP_SITE_VERSION;
  global.ODP_UNSUPPORTED_LEGACY_CONTRACT_MSG = ODP_UNSUPPORTED_LEGACY_CONTRACT_MSG;
  global.ODP_LIVE_BASE = ODP_LIVE_BASE;
  global.ODP_LATEST_STABLE_MAJOR = ODP_LATEST_STABLE_MAJOR;
  global.odpProtocolFeeWei = odpProtocolFeeWei;
  global.odpSupportsFolderBaseMint = odpSupportsFolderBaseMint;
  global.odpSupportsOptionalDataUrl = odpSupportsOptionalDataUrl;
  global.odpSupportsExternalDocAttest = odpSupportsExternalDocAttest;
  global.odpResolveGeneration = odpResolveGeneration;
  global.odpFormatStackLabel = odpFormatStackLabel;
  global.odpFormatStackBlockHtml = odpFormatStackBlockHtml;
  global.odpProbeContractGenerationCached = odpProbeContractGenerationCached;
  global.odpBuildPassportAbi = odpBuildPassportAbi;
  global.odpBuildCreatorAbi = odpBuildCreatorAbi;
  global.odpBuildVerifyReadAbi = odpBuildVerifyReadAbi;
  global.odpFinalizeWalletContract = odpFinalizeWalletContract;
  global.odpRequireSingleEthereumAccount = odpRequireSingleEthereumAccount;
  global.odpInstallSingleAccountGuard = odpInstallSingleAccountGuard;
  global.ODP_CREATOR_PROOF_PREFIX = ODP_CREATOR_PROOF_PREFIX;
  global.odpBuildCreatorProofMessageV1 = odpBuildCreatorProofMessageV1;
  global.odpGenerateCreatorProofNonce = odpGenerateCreatorProofNonce;
})(typeof window !== "undefined" ? window : globalThis);
