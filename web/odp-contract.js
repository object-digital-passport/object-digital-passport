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

  function odpProtocolFeeWei(generation, ethersRef) {
    var E = ethersRef || global.ethers;
    if (generation === 0) return E.utils.parseEther("0.001");
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
      g === 0 ? "ODP spec v0.1 (fee-era deploy)" : g >= 2 ? "ODP spec v0.2+ (gas-only, optional dataUrl)" : "unknown generation";
    return "Site " + ODP_SITE_VERSION + " · on-chain generation " + g + " — " + spec;
  }

  /**
   * Full stack panel: on-chain generation, read/migration policy, SemVer trust colors (0.x red; stable from 1.0; yellow for older majors when latest is N≥2).
   * Safe HTML (static copy + escaped dynamic parts).
   */
  function odpFormatStackBlockHtml(generation) {
    var g = generation == null ? "?" : String(generation);
    var spec =
      generation === 0
        ? "ODP spec v0.1 (fee-era deploy)"
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

    // #region agent log
    fetch("http://127.0.0.1:7568/ingest/413879c6-a994-407f-b8b7-86c3aa65000a", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "99fdf4" },
      body: JSON.stringify({
        sessionId: "99fdf4",
        location: "odp-contract.js:odpProbeContractGenerationCached",
        message: "CONTRACT_VERSION probe result",
        data: { address: String(address), probed: gen, resolvedWillUseFallback: gen === null },
        timestamp: Date.now(),
        hypothesisId: "H-probe",
      }),
    }).catch(function () {});
    // #endregion

    return gen;
  }

  function odpBuildPassportAbi(generation) {
    var folder = generation >= 2;
    var payableMint = generation === 0;
    var mintMut = payableMint ? "payable" : "nonpayable";

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
  }

  function odpBuildCreatorAbi(generation) {
    var pay = generation === 0;
    return [
      {
        name: "registerCreator",
        type: "function",
        stateMutability: pay ? "payable" : "nonpayable",
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
  }

  /** Read-only ABI for verify.html + deployment generation probe. */
  function odpBuildVerifyReadAbi() {
    return [
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
  }

  /** HTML for the legacy-contract banner (generation 0). Escaping not needed — static copy. */
  function odpLegacyContractBannerInnerHtml() {
    return (
      '<div class="odp-legacy-banner-inner">' +
      '<span class="odp-legacy-badge">Legacy contract</span>' +
      '<p class="odp-legacy-banner-lead">This address is an <strong>older deployment</strong> (on-chain generation <strong>0</strong>, v0.1-era: burned protocol fee on register/mint, older mint signatures).</p>' +
      '<p class="odp-legacy-banner-lead">The site remains <strong>backward compatible</strong>, but you should treat this registry as <strong>not equivalent</strong> to the current <strong>v0.2</strong> contract. <strong>Security and trust properties may be weaker than on the latest deployment</strong> — review <code>README.md</code> and <code>SECURITY.md</code>, and prefer a <strong>v0.2</strong> deployment for new high-assurance records when possible.</p>' +
      "</div>"
    );
  }

  /** Show warning banner when `generation === 0`; hide otherwise (including null / unknown). */
  function odpLegacyBannerUpdate(elId, generation) {
    var el = document.getElementById(elId || "odpLegacyBanner");
    if (!el) return;
    if (generation === 0) {
      el.hidden = false;
      el.innerHTML = odpLegacyContractBannerInnerHtml();
    } else {
      el.hidden = true;
      el.innerHTML = "";
    }
  }

  async function odpFinalizeWalletContract(net, signer, rpcFallbacks, kind) {
    var probed = await odpProbeContractGenerationCached(net.contract, net.chainId, rpcFallbacks, global.ethers);
    var gen = odpResolveGeneration(probed, net);
    // #region agent log
    fetch("http://127.0.0.1:7568/ingest/413879c6-a994-407f-b8b7-86c3aa65000a", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "99fdf4" },
      body: JSON.stringify({
        sessionId: "99fdf4",
        location: "odp-contract.js:odpFinalizeWalletContract",
        message: "finalized generation for wallet",
        data: { kind: kind, generation: gen, probed: probed },
        timestamp: Date.now(),
        hypothesisId: "H-finalize",
      }),
    }).catch(function () {});
    // #endregion
    var abi = kind === "creator" ? odpBuildCreatorAbi(gen) : odpBuildPassportAbi(gen);
    var contract = new global.ethers.Contract(net.contract, abi, signer);
    return { contract: contract, generation: gen, abi: abi };
  }

  global.ODP_SITE_VERSION = ODP_SITE_VERSION;
  global.ODP_LIVE_BASE = ODP_LIVE_BASE;
  global.ODP_LATEST_STABLE_MAJOR = ODP_LATEST_STABLE_MAJOR;
  global.odpProtocolFeeWei = odpProtocolFeeWei;
  global.odpSupportsFolderBaseMint = odpSupportsFolderBaseMint;
  global.odpSupportsOptionalDataUrl = odpSupportsOptionalDataUrl;
  global.odpResolveGeneration = odpResolveGeneration;
  global.odpFormatStackLabel = odpFormatStackLabel;
  global.odpFormatStackBlockHtml = odpFormatStackBlockHtml;
  global.odpProbeContractGenerationCached = odpProbeContractGenerationCached;
  global.odpBuildPassportAbi = odpBuildPassportAbi;
  global.odpBuildCreatorAbi = odpBuildCreatorAbi;
  global.odpBuildVerifyReadAbi = odpBuildVerifyReadAbi;
  global.odpFinalizeWalletContract = odpFinalizeWalletContract;
  global.odpLegacyContractBannerInnerHtml = odpLegacyContractBannerInnerHtml;
  global.odpLegacyBannerUpdate = odpLegacyBannerUpdate;
  global.odpRequireSingleEthereumAccount = odpRequireSingleEthereumAccount;
  global.odpInstallSingleAccountGuard = odpInstallSingleAccountGuard;
})(typeof window !== "undefined" ? window : globalThis);
