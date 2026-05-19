(function (global) {
  "use strict";

  var HANDOFF_TYPE = "odp-android-companion-handoff";
  var HANDOFF_VERSION = 2;
  var DEEP_LINK_BASE = "odpcompanion://import";
  var PILOT_TAGTAMPER_NFC_MODEL = "ntag424dna_tagtamper";
  var PILOT_EV2_SYMMETRIC_PROFILE_ID = "odp-ntag424-ev2-symmetric-cr-v1";
  var PILOT_MIRROR_PROFILE_ID = "odp-ntag424-nfc-public-key-file-v1";
  var PILOT_TRUE_CR_METHOD = "true-challenge-response";
  var PILOT_DIRECT_PROOF_METHOD = "direct-comparable-stored-key";
  var PILOT_PROOF_METHODS = [
    "manufacturer-originality",
    "ev2-session-auth",
    "tag-tamper-state",
    "true-challenge-response",
    "direct-comparable-stored-key"
  ];
  var PILOT_SYMMETRIC_TRUST_SUMMARY =
    "NTAG 424 EV2 symmetric challenge-response: publish the 16-byte EV2 application key on-chain as nfcPublicKey, then verify with AuthenticateEV2First (RndA/RndB).";
  var PILOT_SYMMETRIC_LIMITATION_SUMMARY =
    "This is AES mutual authentication, not ECC signature over an arbitrary verifier challenge. Anyone who reads the chain can run the same EV2 check.";
  var PILOT_MIRROR_TRUST_SUMMARY =
    "Mirror-profile path: read a protected StandardData file after EV2 auth and compare live bytes with on-chain nfcPublicKey.";
  var PILOT_MIRROR_LIMITATION_SUMMARY =
    "Use this only when on-chain nfcPublicKey stores mirror bytes rather than the 16-byte EV2 application key.";
  var PILOT_TAGTAMPER_HIGH_ASSURANCE_TRUST_SUMMARY =
    "High-assurance TagTamper: EV2 symmetric challenge-response, authenticated TagTamper INTACT, and optional chip UID from passport.json.";
  var PILOT_TAGTAMPER_HIGH_ASSURANCE_LIMITATION_SUMMARY =
    "Not perfectly uncheatable: stolen original tag, bad provisioning, or leaked EV2 key still break trust. Blocks URL-only fakes, wrong chips, and opened seals.";
  var ISSUER_CHIP_SETUP_TYPE = "odp-chip-issuer-setup";
  var ISSUER_CHIP_SETUP_VERSION = 1;
  var ROUTE_INTENT_ISSUER_CHIP_SETUP = "issuer-chip-setup";

  function androidCompanionPassportNfcSeal(passport) {
    if (!passport || typeof passport !== "object") return { uid: "", model: "" };
    var physical = passport.physical && typeof passport.physical === "object" ? passport.physical : null;
    var seal = (physical && physical.seal) || passport.seal || null;
    if (!seal || typeof seal !== "object") return { uid: "", model: "" };
    var nfc = seal.nfc;
    if (!nfc || typeof nfc !== "object") return { uid: "", model: "" };
    return {
      uid: cleanHex(nfc.uid),
      model: cleanText(nfc.model)
    };
  }

  function cleanText(value) {
    return String(value == null ? "" : value).trim();
  }

  function cleanHex(value) {
    var raw = cleanText(value);
    if (!raw) return "";
    var normalized = raw.replace(/^0x/i, "").toLowerCase();
    return /^[0-9a-f]+$/.test(normalized) ? "0x" + normalized : raw;
  }

  function cleanLowerText(value) {
    return cleanText(value).toLowerCase();
  }

  function cleanStringArray(values) {
    if (!Array.isArray(values)) return [];
    return values
      .map(function (value) {
        return cleanLowerText(value);
      })
      .filter(Boolean);
  }

  function normalizedHexByteLength(hex) {
    var raw = cleanHex(hex).replace(/^0x/i, "");
    if (!raw || raw.length % 2 !== 0) return 0;
    return raw.length / 2;
  }

  function androidCompanionPilotChipBindingProfileIdForNfcModel(nfcModel, nfcPublicKeyHex) {
    if (normalizedHexByteLength(nfcPublicKeyHex) === 16) {
      return PILOT_EV2_SYMMETRIC_PROFILE_ID;
    }
    return cleanLowerText(nfcModel) === PILOT_TAGTAMPER_NFC_MODEL ? PILOT_MIRROR_PROFILE_ID : "";
  }

  function buildChipBinding(fields) {
    var input = fields || {};
    var raw = input.chipBinding && typeof input.chipBinding === "object" ? input.chipBinding : {};
    var profileId = cleanLowerText(raw.profileId || input.chipBindingProfileId);
    var fileNumberHex = cleanHex(raw.fileNumberHex || input.bindingFileNumberHex);
    var offsetHex = cleanHex(raw.offsetHex || input.bindingFileOffsetHex);
    var lengthHex = cleanHex(raw.lengthHex || input.bindingFileLengthHex);
    var readMode = cleanLowerText(raw.readMode || input.bindingReadMode);
    var materialKind = cleanLowerText(raw.materialKind || input.bindingMaterialKind);
    if (!profileId && !fileNumberHex && !offsetHex && !lengthHex && !readMode && !materialKind) {
      return null;
    }
    var chipBinding = {};
    if (profileId) chipBinding.profileId = profileId;
    if (fileNumberHex) chipBinding.fileNumberHex = fileNumberHex;
    if (offsetHex) chipBinding.offsetHex = offsetHex;
    if (lengthHex) chipBinding.lengthHex = lengthHex;
    if (readMode) chipBinding.readMode = readMode;
    if (materialKind) chipBinding.materialKind = materialKind;
    return chipBinding;
  }

  function buildProof(fields, chipBinding) {
    var input = fields || {};
    var raw = input.proof && typeof input.proof === "object" ? input.proof : {};
    var primaryMethodId = cleanLowerText(raw.primaryMethodId || input.primaryProofMethodId);
    var availableMethodIds = cleanStringArray(raw.availableMethodIds || input.availableProofMethodIds);
    var trustSummary = cleanText(raw.trustSummary || input.proofTrustSummary);
    var limitationSummary = cleanText(raw.limitationSummary || input.proofLimitationSummary);
    if (!primaryMethodId && chipBinding && chipBinding.profileId === PILOT_EV2_SYMMETRIC_PROFILE_ID) {
      primaryMethodId = PILOT_TRUE_CR_METHOD;
    } else if (!primaryMethodId && chipBinding && chipBinding.profileId) {
      primaryMethodId = PILOT_DIRECT_PROOF_METHOD;
    } else if (!primaryMethodId && cleanText(input.nfcPublicKey)) {
      primaryMethodId = normalizedHexByteLength(input.nfcPublicKey) === 16
        ? PILOT_TRUE_CR_METHOD
        : "manufacturer-originality";
    }
    if (!availableMethodIds.length) {
      if (chipBinding && chipBinding.profileId) {
        availableMethodIds = PILOT_PROOF_METHODS.slice();
      } else if (cleanText(input.nfcPublicKey)) {
        availableMethodIds = ["manufacturer-originality"];
        if (normalizedHexByteLength(input.nfcPublicKey) === 16) {
          availableMethodIds.push("ev2-session-auth", "tag-tamper-state", PILOT_TRUE_CR_METHOD);
        }
      }
    }
    var nfcModel = cleanLowerText(input.nfcModel);
    var tagTamperModel = nfcModel === PILOT_TAGTAMPER_NFC_MODEL;
    if (!trustSummary && tagTamperModel && primaryMethodId === PILOT_TRUE_CR_METHOD) {
      trustSummary = PILOT_TAGTAMPER_HIGH_ASSURANCE_TRUST_SUMMARY;
    } else if (!trustSummary && primaryMethodId === PILOT_TRUE_CR_METHOD) {
      trustSummary = PILOT_SYMMETRIC_TRUST_SUMMARY;
    } else if (!trustSummary && primaryMethodId === PILOT_DIRECT_PROOF_METHOD) {
      trustSummary = PILOT_MIRROR_TRUST_SUMMARY;
    }
    if (!limitationSummary && tagTamperModel && primaryMethodId === PILOT_TRUE_CR_METHOD) {
      limitationSummary = PILOT_TAGTAMPER_HIGH_ASSURANCE_LIMITATION_SUMMARY;
    } else if (!limitationSummary && primaryMethodId === PILOT_TRUE_CR_METHOD) {
      limitationSummary = PILOT_SYMMETRIC_LIMITATION_SUMMARY;
    } else if (!limitationSummary && primaryMethodId === PILOT_DIRECT_PROOF_METHOD) {
      limitationSummary = PILOT_MIRROR_LIMITATION_SUMMARY;
    }
    if (!primaryMethodId && !availableMethodIds.length && !trustSummary && !limitationSummary) {
      return null;
    }
    var proof = {};
    if (primaryMethodId) proof.primaryMethodId = primaryMethodId;
    if (availableMethodIds.length) proof.availableMethodIds = availableMethodIds;
    if (trustSummary) proof.trustSummary = trustSummary;
    if (limitationSummary) proof.limitationSummary = limitationSummary;
    return proof;
  }

  function buildRoute(fields) {
    var input = fields || {};
    var raw = input.route && typeof input.route === "object" ? input.route : {};
    var initialStep = cleanLowerText(raw.initialStep || input.initialStep);
    var operatorFlowSuggested =
      raw.operatorFlowSuggested === true || input.operatorFlowSuggested === true;
    if (!initialStep) {
      if (cleanText(input.offlinePayloadBase64)) {
        initialStep = "advanced-operator";
      } else if (cleanText(input.verifyUrl)) {
        initialStep = "ready-to-scan";
      }
    }
    if (initialStep === "advanced-operator") operatorFlowSuggested = true;
    var intent = cleanLowerText(raw.intent || input.routeIntent);
    if (intent === ROUTE_INTENT_ISSUER_CHIP_SETUP) {
      if (!initialStep) initialStep = ROUTE_INTENT_ISSUER_CHIP_SETUP;
    }
    if (!initialStep && !operatorFlowSuggested && !intent) return null;
    var route = {};
    if (initialStep) route.initialStep = initialStep;
    if (operatorFlowSuggested) route.operatorFlowSuggested = true;
    if (intent) route.intent = intent;
    var mintPageUrl = cleanText(raw.mintPageUrl || input.mintPageUrl);
    if (mintPageUrl) route.mintPageUrl = mintPageUrl;
    return route;
  }

  function passportIssuerMintPageUrl() {
    if (typeof window === "undefined" || !window.location || !window.location.href) return "";
    try {
      var u = new URL(window.location.href);
      u.search = "";
      u.hash = "";
      return u.toString();
    } catch (e) {
      return String(window.location.href || "").split("#")[0].split("?")[0];
    }
  }

  function buildIssuerChipSetupCompanionFields(nfcModel, nfcPublicKeyHex, mintPageUrl) {
    var model = cleanText(nfcModel) || "NTAG424DNA_TAGTAMPER";
    var key = cleanHex(nfcPublicKeyHex);
    var chipBindingProfileId = androidCompanionPilotChipBindingProfileIdForNfcModel(model, key);
    var pageUrl = cleanText(mintPageUrl) || passportIssuerMintPageUrl();
    return {
      source: "passport-create",
      nfcModel: model,
      nfcPublicKey: key,
      chipBindingProfileId: chipBindingProfileId,
      routeIntent: ROUTE_INTENT_ISSUER_CHIP_SETUP,
      initialStep: ROUTE_INTENT_ISSUER_CHIP_SETUP,
      mintPageUrl: pageUrl
    };
  }

  function buildIssuerChipSetupReturnUrl(mintPageUrl, chipSetupJson) {
    var base = cleanText(mintPageUrl) || passportIssuerMintPageUrl();
    if (!base || !chipSetupJson) return base;
    var encoded = encodeBase64UrlUtf8(chipSetupJson);
    var sep = base.indexOf("?") >= 0 ? "&" : "?";
    return base + sep + "chipSetup=" + encodeURIComponent(encoded);
  }

  function parseIssuerChipSetupText(raw) {
    var trimmed = cleanText(raw);
    if (!trimmed) return { ok: false, error: "empty" };
    var jsonText = trimmed;
    var first = trimmed.indexOf("{");
    var last = trimmed.lastIndexOf("}");
    if (first >= 0 && last > first) jsonText = trimmed.slice(first, last + 1);
    var root;
    try {
      root = JSON.parse(jsonText);
    } catch (e) {
      return { ok: false, error: "invalid_json" };
    }
    if (!root || typeof root !== "object") return { ok: false, error: "not_object" };
    if (cleanText(root.type) !== ISSUER_CHIP_SETUP_TYPE) return { ok: false, error: "wrong_type" };
    var chip = root.chip && typeof root.chip === "object" ? root.chip : root;
    var uid = cleanHex(chip.uid);
    var publicKey = cleanHex(chip.publicKey || chip.nfcPublicKey);
    var model = cleanText(chip.model || chip.nfcModel) || "NTAG424DNA_TAGTAMPER";
    if (!uid) return { ok: false, error: "missing_uid" };
    if (normalizedHexByteLength(publicKey) !== 16) return { ok: false, error: "bad_key_length" };
    if (chip.ev2AuthPassed !== true) return { ok: false, error: "ev2_not_passed" };
    if (model.toUpperCase().indexOf("TAGTAMPER") >= 0) {
      var tt = cleanLowerText(chip.tamperState || chip.tagTamperState);
      if (tt && tt !== "intact") return { ok: false, error: "tagtamper_not_intact" };
    }
    return {
      ok: true,
      chip: {
        uid: uid,
        publicKey: publicKey,
        model: model,
        ev2AuthPassed: true,
        tamperState: cleanLowerText(chip.tamperState || chip.tagTamperState),
        observedChipModel: cleanText(chip.observedChipModel),
        scannedAt: cleanText(root.createdAt || chip.scannedAt)
      }
    };
  }

  function encodeBase64UrlUtf8(text) {
    var bytes = new TextEncoder().encode(String(text == null ? "" : text));
    var binary = "";
    for (var i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  function decodeBase64UrlUtf8(encoded) {
    var normalized = String(encoded || "").replace(/-/g, "+").replace(/_/g, "/");
    while (normalized.length % 4) normalized += "=";
    var binary = atob(normalized);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  function buildAndroidCompanionHandoff(fields) {
    var input = fields || {};
    var chipBinding = buildChipBinding(input);
    var proof = buildProof(input, chipBinding);
    var route = buildRoute(input);
    var handoff = {
      type: HANDOFF_TYPE,
      version: HANDOFF_VERSION,
      createdAt: new Date().toISOString(),
      source: cleanText(input.source),
      expected: {
        passportId: cleanText(input.passportId),
        verifyUrl: cleanText(input.verifyUrl),
        ndppCommitmentHash: cleanHex(input.ndppCommitmentHash),
        nfcPublicKey: cleanHex(input.nfcPublicKey),
        nfcUid: cleanHex(input.nfcUid),
        nfcModel: cleanText(input.nfcModel),
        dataHash: cleanHex(input.dataHash)
      },
      write: (function () {
        var writePayload = cleanText(input.offlinePayloadBase64);
        var write = {
          verifyUrl: cleanText(input.writeVerifyUrl || input.verifyUrl),
          offlinePayloadBase64: writePayload
        };
        if (writePayload) {
          write.lockCarrierAfterWrite = input.lockCarrierAfterWrite !== false;
        }
        return write;
      })()
    };
    if (chipBinding) handoff.chipBinding = chipBinding;
    if (proof) handoff.proof = proof;
    if (route) handoff.route = route;
    return handoff;
  }

  function androidCompanionHandoffJson(fields) {
    return JSON.stringify(buildAndroidCompanionHandoff(fields), null, 2);
  }

  function androidCompanionHandoffDeepLink(fields) {
    var json = JSON.stringify(buildAndroidCompanionHandoff(fields));
    return DEEP_LINK_BASE + "?handoff=" + encodeURIComponent(encodeBase64UrlUtf8(json));
  }

  global.odpBuildAndroidCompanionHandoff = buildAndroidCompanionHandoff;
  global.odpAndroidCompanionHandoffJson = androidCompanionHandoffJson;
  global.odpAndroidCompanionHandoffDeepLink = androidCompanionHandoffDeepLink;
  global.odpAndroidCompanionPilotChipBindingProfileIdForNfcModel = androidCompanionPilotChipBindingProfileIdForNfcModel;
  global.odpAndroidCompanionPassportNfcSeal = androidCompanionPassportNfcSeal;
  global.odpBuildIssuerChipSetupCompanionFields = buildIssuerChipSetupCompanionFields;
  global.odpParseIssuerChipSetupText = parseIssuerChipSetupText;
  global.odpPassportIssuerMintPageUrl = passportIssuerMintPageUrl;
  global.odpBuildIssuerChipSetupReturnUrl = buildIssuerChipSetupReturnUrl;
  global.odpDecodeBase64UrlUtf8 = decodeBase64UrlUtf8;
  global.odpAndroidCompanionIssuerChipSetupDeepLink = function (nfcModel, nfcPublicKeyHex, mintPageUrl) {
    return androidCompanionHandoffDeepLink(
      buildIssuerChipSetupCompanionFields(nfcModel, nfcPublicKeyHex, mintPageUrl)
    );
  };
})(typeof window !== "undefined" ? window : globalThis);
