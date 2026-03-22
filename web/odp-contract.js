/**
 * ODP — shared helpers for contract generation detection and ABI selection.
 * README: site semver 0.X.Y vs on-chain deployment generation (CONTRACT_VERSION uint8).
 */
(function (global) {
  "use strict";

  /** Static site / repo release: bump Y for docs-only; bump X with new contract (see README). */
  var ODP_SITE_VERSION = "0.2.1";

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

  function odpFormatStackLabel(generation) {
    var g = generation;
    var spec =
      g === 0 ? "ODP spec v0.1 (fee-era deploy)" : g >= 2 ? "ODP spec v0.2+ (gas-only, optional dataUrl)" : "unknown generation";
    return "Site " + ODP_SITE_VERSION + " · on-chain generation " + g + " — " + spec;
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
  global.odpProtocolFeeWei = odpProtocolFeeWei;
  global.odpSupportsFolderBaseMint = odpSupportsFolderBaseMint;
  global.odpSupportsOptionalDataUrl = odpSupportsOptionalDataUrl;
  global.odpResolveGeneration = odpResolveGeneration;
  global.odpFormatStackLabel = odpFormatStackLabel;
  global.odpProbeContractGenerationCached = odpProbeContractGenerationCached;
  global.odpBuildPassportAbi = odpBuildPassportAbi;
  global.odpBuildCreatorAbi = odpBuildCreatorAbi;
  global.odpBuildVerifyReadAbi = odpBuildVerifyReadAbi;
  global.odpFinalizeWalletContract = odpFinalizeWalletContract;
})(typeof window !== "undefined" ? window : globalThis);
