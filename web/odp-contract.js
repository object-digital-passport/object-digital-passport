/**
 * ODP — shared helpers for contract generation detection and ABI selection.
 * README: site semver 0.X.Y vs on-chain deployment generation (CONTRACT_VERSION uint8).
 *
 * Naming: ABI / Solidity use `humanId` for the Passport ID string (`ODP-…`) and `creatorId` for the profile ID (`C-…` / `B-…` / `P-…` / `M-…`). Do not rename ABI `name` fields unless the contract and JSON schema change to match.
 */
(function (global) {
  "use strict";

  /** Static site / repo release: bump Y for docs-only; bump X with new contract (see README). */
  var ODP_SITE_VERSION = "0.3";

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
  function odpPassportTupleComponentsV03() {
    return [
      { name: "humanId", type: "string" },
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
  }

  function odpPassportTupleComponents(generation) {
    return odpSupportsV03(generation) ? odpPassportTupleComponentsV03() : odpPassportTupleComponentsV02();
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
        readmeUrl = "https://github.com/object-digital-passport/object-digital-passport/blob/main/localization/ru/README.md";
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
      var url = new URL("registry-config.json", global.location.href);
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

  /** First line of EIP-191 creator proof messages (must match SPEC / verify.html). */
  var ODP_CREATOR_PROOF_PREFIX = "Object Digital Passport — creator wallet proof (EIP-191) v1";

  /**
   * Canonical text signed with the creator wallet (EIP-191 `personal_sign`).
   * @param {string} humanId Passport ID (`ODP-…`; message line still labeled `humanId:` per SPEC).
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
        ? "ODP spec v0.3 (owner/transfer, account publishing agent for URLs, revocation, extra image hashes, P-affiliation)"
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
    return (
      '<p class="odp-stack-note">' +
        noteRead +
        "</p>" +
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
    var spec;
    if (generation === 0) {
      spec = odpStackT("stack.spec.legacy", "legacy CONTRACT_VERSION 0 — not supported by this UI");
    } else if (generation >= 3) {
      spec = odpStackT(
        "stack.spec.v03",
        "ODP v0.3 — ownership, account-scoped publishing agent (updatePassportUrls), revocation, 3 image hashes, P-affiliation detach"
      );
    } else if (generation >= 2) {
      spec = odpStackT(
        "stack.spec.v02",
        "ODP spec (gas-only, optional dataUrl, PDF/doc anchor; unlimited P/M; proofs P/M)"
      );
    } else {
      spec = odpStackT("stack.spec.unknown", "unknown generation");
    }
    var trust = odpSiteSemverTrust(ODP_SITE_VERSION, ODP_LATEST_STABLE_MAJOR);
    var flagClass = "odp-stack-flag--" + trust.level;
    var metaLine = odpStackTpl("stack.summaryMeta", "Site {siteVer} · on-chain gen {gen} — {spec}", {
      siteVer: ODP_SITE_VERSION,
      gen: g,
      spec: spec,
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
    if (titleEl) titleEl.textContent = odpStackT("stack.modalTitle", "Site release & trust");
    if (okEl) okEl.textContent = odpStackT("stack.modalOk", "Got it");
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
      odpRefreshSiteTrustModalChrome();
      doc.getElementById("odpSiteTrustModalOk").onclick = function () {
        odpCloseSiteTrustModal();
      };
      backdrop.addEventListener("click", function (ev) {
        if (ev.target === backdrop) odpCloseSiteTrustModal();
      });
    } else {
      odpRefreshSiteTrustModalChrome();
    }
    var body = doc.getElementById("odpSiteTrustModalBody");
    function fillBody(html) {
      body.innerHTML = html;
    }
    function fillFallback() {
      fillBody(odpStackDisclosureParagraphsHtml());
    }
    var localeRu = typeof global.odpGetLocale === "function" && global.odpGetLocale() === "ru";
    if (localeRu) {
      fillFallback();
    } else if (typeof global.location !== "undefined" && global.location && global.location.href) {
      var url = new URL("odp-site-trust-disclosure.html", global.location.href);
      url.searchParams.set("_", String(Date.now()));
      global
        .fetch(url.toString(), { cache: "no-store" })
        .then(function (r) {
          return r.ok ? r.text() : Promise.reject();
        })
        .then(function (html) {
          var m = html.match(/<div[^>]*class="[^"]*odp-site-trust-disclosure[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
          if (m && m[1]) fillBody(m[1].trim());
          else fillFallback();
        })
        .catch(fillFallback);
    } else {
      fillFallback();
    }
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
    global.document.addEventListener("DOMContentLoaded", function () {
      setTimeout(function () {
        odpMaybeAutoShowSiteTrustModal();
      }, 0);
    });
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
      if (cached !== null && cached !== "") {
        return parseInt(cached, 10);
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
    ];
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
        { name: "auxCommitmentUri", type: "string" },
        { name: "mintOnBehalfOfCreatorId", type: "string" }
      );
      mintPhysicalInputs.push(
        { name: "auxCommitmentHash", type: "bytes32" },
        { name: "auxCommitmentUri", type: "string" },
        { name: "mintOnBehalfOfCreatorId", type: "string" }
      );
    }

    var passportMintedEvent =
      odpSupportsV03(generation)
        ? "event PassportMinted(string indexed humanId,address indexed creator,string creatorId,string objectType,uint32 year,uint8 month,bytes32 dataHash,uint8 sealType,string nfcModel,uint256 timestamp,address mintAgent)"
        : "event PassportMinted(string indexed humanId,address indexed creator,string creatorId,string objectType,uint32 year,uint8 month,bytes32 dataHash,uint8 sealType,string nfcModel,uint256 timestamp)";

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
            components: odpPassportTupleComponents(generation),
          },
        ],
      },
      passportMintedEvent,
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
        },
        {
          name: "submitProof",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [
            { name: "humanId", type: "string" },
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
                { name: "humanId", type: "string" },
                { name: "noteHash", type: "bytes32" },
                { name: "noteUrl", type: "string" },
                { name: "timestamp", type: "uint256" },
              ],
            },
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
            { name: "humanId", type: "string" },
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
            { name: "humanId", type: "string" },
            { name: "reasonHash", type: "bytes32" },
          ],
          outputs: [],
        },
        {
          name: "updatePassportAuxCommitment",
          type: "function",
          stateMutability: "nonpayable",
          inputs: [
            { name: "humanId", type: "string" },
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
            { name: "humanId", type: "string" },
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
                { name: "humanId", type: "string" },
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
  function odpBuildVerifyReadAbi(generation) {
    var gen = generation == null || generation === undefined ? 2 : generation;
    var passComps = odpPassportTupleComponents(gen);
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
            components: passComps,
          },
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
  global.odpSupportsV03 = odpSupportsV03;
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
  global.odpBuildPassportAbi = odpBuildPassportAbi;
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
})(typeof window !== "undefined" ? window : globalThis);
