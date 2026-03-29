/**
 * Shared v0.3 «network passport actions» card + handlers (Profile and optional other pages).
 * Requires: ethers (global), odp-contract.js (odpSupportsV03, odpPassportProfileTypeLetter).
 */
(function (global) {
  "use strict";

  var _ctx = null;
  var passportV03Last = { humanId: null, p: null };

  function install(ctx) {
    _ctx = ctx && typeof ctx.getContract === "function" ? ctx : null;
  }

  function t(key) {
    return _ctx && typeof _ctx.t === "function" ? _ctx.t(key) : key;
  }

  function esc(s) {
    return _ctx && typeof _ctx.esc === "function" ? _ctx.esc(s) : String(s ?? "");
  }

  function getContract() {
    return _ctx && _ctx.getContract();
  }

  function getWallet() {
    return _ctx && _ctx.getWallet && _ctx.getWallet();
  }

  function getCreatorId() {
    return _ctx && _ctx.getCreatorId ? _ctx.getCreatorId() : null;
  }

  function getGeneration() {
    var g = _ctx && _ctx.getGeneration ? _ctx.getGeneration() : null;
    return g == null ? 0 : g;
  }

  function profileLetter(id) {
    if (typeof global.odpPassportProfileTypeLetter === "function") {
      return global.odpPassportProfileTypeLetter(id);
    }
    if (id == null) return "";
    var s = String(id).replace(/^\uFEFF/, "").trim();
    var m = /^([CBPM])-/i.exec(s);
    return m ? m[1].toUpperCase() : "";
  }

  function passportV03UiEnabled() {
    return typeof global.odpSupportsV03 === "function" && global.odpSupportsV03(getGeneration()) && getContract();
  }

  function canShowPassportPmProof() {
    var letter = profileLetter(getCreatorId());
    var c = getContract();
    return (
      (letter === "P" || letter === "M") &&
      getGeneration() >= 2 &&
      c &&
      typeof c.submitProof === "function"
    );
  }

  function passportV03KeccakUtf8(s) {
    return global.ethers.utils.keccak256(global.ethers.utils.toUtf8Bytes(s));
  }

  function passportV03ShortAddr(a) {
    if (!a || typeof a !== "string") return "—";
    var x = a.trim();
    return x.length > 12 ? x.slice(0, 6) + "…" + x.slice(-4) : x;
  }

  function htmlPassportV03OperationsCard() {
    if (!passportV03UiEnabled()) return "";
    var onProfile = !!(_ctx && _ctx.isProfilePage);
    var pAffLead = onProfile
      ? '<p class="fhint" style="margin:0 0 10px">' + esc(t("passport.v03Ops.pAffLeadOnProfile")) + "</p>"
      : '<p class="fhint" style="margin:0 0 10px">' +
        esc(t("passport.v03Ops.pAffLead")) +
        ' <a href="creator.html">' +
        esc(t("passport.v03Ops.pAffProfileLink")) +
        "</a></p>";
    return (
      '<div class="card" id="passportV03OpsCard" style="margin-top:20px">' +
      '<div class="card-head">' +
      esc(t("passport.v03Ops.cardTitle")) +
      "</div>" +
      '<div class="card-body">' +
      '<p class="fhint" style="margin:0 0 14px;line-height:1.6;max-width:52rem">' +
      esc(t("passport.v03Ops.leadProfile")) +
      "</p>" +
      '<div id="passportV03GovStrip" class="info neutral" style="display:none;margin-bottom:14px;padding:12px 14px;border-radius:8px;line-height:1.55">' +
      '<div class="section-label" style="margin-bottom:8px">' +
      esc(t("passport.v03Ops.govSection")) +
      "</div>" +
      '<p class="fhint" style="margin:0 0 10px"><span class="mono" id="passportV03GovStripAddr"></span></p>' +
      '<div class="row2">' +
      '<div class="field"><label for="passportV03GovNew">' +
      esc(t("passport.v03Ops.govNewLabel")) +
      '</label><input type="text" id="passportV03GovNew" placeholder="' +
      esc(t("passport.v03Ops.transferPlaceholder")) +
      '" autocomplete="off" spellcheck="false"></div>' +
      '<div class="field" style="align-self:flex-end">' +
      '<button type="button" class="btn btn-sec" id="passportV03GovTransferBtn">' +
      esc(t("passport.v03Ops.govTransferBtn")) +
      "</button></div></div></div>" +
      '<div class="row2">' +
      '<div class="field"><label for="passportV03Hid">' +
      esc(t("passport.v03Ops.passportIdLabel")) +
      '</label><input type="text" id="passportV03Hid" placeholder="ODP-…" autocomplete="off" spellcheck="false"></div>' +
      '<div class="field" style="align-self:flex-end">' +
      '<button type="button" class="btn" id="passportV03LoadBtn">' +
      esc(t("passport.v03Ops.loadBtn")) +
      "</button></div></div>" +
      '<div id="passportV03Err"></div>' +
      '<div id="passportV03State" class="info neutral" style="display:none;margin-top:12px;padding:12px 14px;border-radius:8px;font-size:12px;line-height:1.6;text-align:left"></div>' +
      '<div id="passportV03AgentUrlBlock" style="display:none;margin-top:14px">' +
      '<div class="section-label">' +
      esc(t("passport.v03Ops.agentUrlSection")) +
      "</div>" +
      '<p class="fhint" style="margin:0 0 10px;line-height:1.55">' +
      esc(t("passport.v03Ops.agentUrlLead")) +
      "</p>" +
      '<div class="field"><label for="passportV03AgentUrlData">' +
      esc(t("passport.v03Ops.agentUrlDataLabel")) +
      '</label><input type="url" id="passportV03AgentUrlData" placeholder="https://…" autocomplete="off" spellcheck="false"></div>' +
      '<div class="field"><label for="passportV03AgentUrlImg">' +
      esc(t("passport.v03Ops.agentUrlImageLabel")) +
      '</label><input type="url" id="passportV03AgentUrlImg" placeholder="https://…" autocomplete="off" spellcheck="false"></div>' +
      '<div id="passportV03AgentUrlErr"></div>' +
      '<div class="btn-row" style="margin-top:10px">' +
      '<button type="button" class="btn" id="passportV03AgentUrlSubmitBtn">' +
      esc(t("passport.v03Ops.agentUrlSubmit")) +
      "</button></div></div>" +
      '<div id="passportV03OwnerBlock" style="display:none;margin-top:14px">' +
      '<div class="section-label">' +
      esc(t("passport.v03Ops.ownerSection")) +
      "</div>" +
      '<div class="row2">' +
      '<div class="field"><label for="passportV03TransferTo">' +
      esc(t("passport.v03Ops.transferLabel")) +
      '</label><input type="text" id="passportV03TransferTo" placeholder="' +
      esc(t("passport.v03Ops.transferPlaceholder")) +
      '" autocomplete="off" spellcheck="false"></div>' +
      '<div class="field" style="align-self:flex-end">' +
      '<button type="button" class="btn" id="passportV03TransferBtn">' +
      esc(t("passport.v03Ops.transferBtn")) +
      "</button></div></div></div>" +
      '<div id="passportV03PublishAgentBlock" style="display:none;margin-top:14px">' +
      '<div class="section-label">' +
      esc(t("passport.v03Ops.publishAgentSection")) +
      "</div>" +
      '<p class="fhint" style="margin:0 0 10px;line-height:1.55">' +
      esc(t("passport.v03Ops.publishAgentHint")) +
      "</p>" +
      '<div class="row2">' +
      '<div class="field"><label for="passportV03DelegateAgent">' +
      esc(t("passport.v03Ops.delegateLabel")) +
      '</label><input type="text" id="passportV03DelegateAgent" placeholder="' +
      esc(t("passport.v03Ops.transferPlaceholder")) +
      '" autocomplete="off" spellcheck="false"></div>' +
      '<div class="field"><label for="passportV03DelegateExpires">' +
      esc(t("passport.v03Ops.delegateExpires")) +
      '</label><input type="datetime-local" id="passportV03DelegateExpires" step="1"></div></div>' +
      '<div class="btn-row" style="margin-top:10px">' +
      '<button type="button" class="btn btn-sec" id="passportV03DelegateBtn">' +
      esc(t("passport.v03Ops.delegateBtn")) +
      '</button><button type="button" class="btn btn-ghost" id="passportV03RevokeDelBtn">' +
      esc(t("passport.v03Ops.revokeDelegationBtn")) +
      "</button></div></div>" +
      '<div id="passportV03RevokeBlock" style="display:none;margin-top:14px">' +
      '<div class="section-label">' +
      esc(t("passport.v03Ops.revokeSection")) +
      "</div>" +
      '<div class="field"><label for="passportV03RevokeReason">' +
      esc(t("passport.v03Ops.revokeReason")) +
      '</label><textarea id="passportV03RevokeReason" rows="2" style="width:100%;max-width:40rem"></textarea></div>' +
      '<button type="button" class="btn" id="passportV03RevokePassportBtn" style="margin-top:8px">' +
      esc(t("passport.v03Ops.revokeBtn")) +
      "</button></div>" +
      '<div id="passportV03InstBlock" style="display:none;margin-top:14px">' +
      '<div class="section-label">' +
      esc(t("passport.v03Ops.instSection")) +
      "</div>" +
      '<div class="field"><label for="passportV03CfReason">' +
      esc(t("passport.v03Ops.cfReason")) +
      '</label><textarea id="passportV03CfReason" rows="2" style="width:100%;max-width:40rem"></textarea></div>' +
      '<div class="btn-row" style="margin-top:8px">' +
      '<button type="button" class="btn" id="passportV03CfRaiseBtn">' +
      esc(t("passport.v03Ops.cfRaiseBtn")) +
      '</button><button type="button" class="btn btn-sec" id="passportV03CfClearBtn">' +
      esc(t("passport.v03Ops.cfClearBtn")) +
      "</button></div></div>" +
      '<div id="passportV03PaffBlock" style="display:none;margin-top:14px">' +
      '<div class="section-label">' +
      esc(t("passport.v03Ops.pAffSection")) +
      "</div>" +
      pAffLead +
      '<div class="row2">' +
      '<div class="field"><label for="passportV03PaffChild">' +
      esc(t("passport.v03Ops.pAffChildLabel")) +
      '</label><input type="text" id="passportV03PaffChild" placeholder="P-…" autocomplete="off" spellcheck="false"></div>' +
      '<div class="field" style="align-self:flex-end">' +
      '<button type="button" class="btn btn-sec" id="passportV03PaffDetachBtn">' +
      esc(t("passport.v03Ops.pAffDetachBtn")) +
      "</button></div></div></div></div></div>"
    );
  }

  async function passportV03UpdateGovStrip() {
    var strip = global.document.getElementById("passportV03GovStrip");
    var contract = getContract();
    var wallet = getWallet();
    if (!strip || !contract || !wallet || !passportV03UiEnabled()) return;
    try {
      if (typeof contract.governance !== "function") {
        strip.style.display = "none";
        return;
      }
      var g = await contract.governance();
      var isGov = g && wallet && g.toLowerCase() === wallet.toLowerCase();
      strip.style.display = isGov ? "block" : "none";
      var el = global.document.getElementById("passportV03GovStripAddr");
      if (el && isGov) el.textContent = t("passport.v03Ops.govCurrent") + ": " + g;
    } catch (e0) {
      strip.style.display = "none";
    }
  }

  async function passportV03RefreshState() {
    var contract = getContract();
    var wallet = getWallet();
    var creatorId = getCreatorId();
    var errEl = global.document.getElementById("passportV03Err");
    var stateEl = global.document.getElementById("passportV03State");
    var ownerBlock = global.document.getElementById("passportV03OwnerBlock");
    var agentUrlBlock = global.document.getElementById("passportV03AgentUrlBlock");
    var publishAgentBlock = global.document.getElementById("passportV03PublishAgentBlock");
    var revokeBlock = global.document.getElementById("passportV03RevokeBlock");
    var instBlock = global.document.getElementById("passportV03InstBlock");
    var paffBlock = global.document.getElementById("passportV03PaffBlock");
    if (errEl) errEl.innerHTML = "";
    if (!passportV03UiEnabled()) {
      if (agentUrlBlock) agentUrlBlock.style.display = "none";
      if (errEl) errEl.innerHTML = '<div class="info warn">' + esc(t("passport.v03Ops.notV03")) + "</div>";
      return;
    }
    var hidInp = global.document.getElementById("passportV03Hid");
    var hid = hidInp && hidInp.value ? String(hidInp.value).trim() : "";
    if (!hid || !/^ODP-/i.test(hid)) {
      var aub0 = global.document.getElementById("passportV03AgentUrlBlock");
      if (aub0) aub0.style.display = "none";
      if (errEl) errEl.innerHTML = '<div class="info warn">' + esc(t("passport.v03Ops.needValidId")) + "</div>";
      return;
    }
    if (stateEl) {
      stateEl.style.display = "block";
      stateEl.innerHTML = esc(t("passport.v03Ops.loading"));
    }
    try {
      var p = await contract.getPassport(hid);
      passportV03Last = { humanId: hid, p: p };
      var govAddr = null;
      if (typeof contract.governance === "function") govAddr = await contract.governance();
      var wl = wallet && typeof wallet === "string" && wallet.trim() ? String(wallet).toLowerCase() : "";
      var ownerAddr = p.owner !== undefined ? p.owner : p.creator;
      var creatorAddr = p.creator;
      var ZERO = "0x0000000000000000000000000000000000000000";
      var agent = ZERO;
      var expBn = global.ethers.BigNumber.from(0);
      if (typeof contract.getCreatorPublishingDelegation === "function" && creatorAddr) {
        var cw = global.ethers.utils.getAddress(String(creatorAddr));
        var d = await contract.getCreatorPublishingDelegation(cw);
        agent = String((d.agent || d[0]) || ZERO);
        var rawExp = d.expiresAt !== undefined ? d.expiresAt : d[1];
        expBn = global.ethers.BigNumber.isBigNumber(rawExp) ? rawExp : global.ethers.BigNumber.from(rawExp || 0);
      }
      var expSec = expBn.toNumber ? expBn.toNumber() : Number(expBn);
      var hasCounterfeitOnChain = typeof contract.getCounterfeitConcern === "function";
      var ccActive = false;
      var ccProver = "";
      if (hasCounterfeitOnChain) {
        var cc = await contract.getCounterfeitConcern(hid);
        ccActive = !!(cc.active !== undefined ? cc.active : cc[0]);
        ccProver = cc.proverCreatorId !== undefined ? String(cc.proverCreatorId) : String(cc[1] || "");
      }
      var isOwner = ownerAddr && wl === String(ownerAddr).toLowerCase();
      var isCreator = creatorAddr && wl === String(creatorAddr).toLowerCase();
      var isGov = govAddr && wl === String(govAddr).toLowerCase();
      var revoked = !!p.revoked;
      var nowSec = Math.floor(Date.now() / 1000);
      var agentLc = agent && String(agent).toLowerCase();
      var delegActive = !!(agentLc && agentLc !== ZERO.toLowerCase() && expSec > nowSec);
      var isPublishAgentWallet = delegActive && wl === agentLc && !isCreator;
      var delLine =
        agent && agent.toLowerCase() !== ZERO
          ? t("passport.v03Ops.delegationLine")
              .replace("{agent}", passportV03ShortAddr(String(agent)))
              .replace("{exp}", expSec ? odpFormatDateTimeLocalDDMMYYYY(new Date(expSec * 1000)) : "—")
          : t("passport.v03Ops.delegationNone");
      var cfLine = ccActive
        ? esc(t("passport.v03Ops.counterfeitActive").replace("{prover}", ccProver || "—"))
        : esc(t("passport.v03Ops.counterfeitInactive"));
      if (stateEl) {
        stateEl.innerHTML =
          '<div style="font-weight:600;margin-bottom:8px">' +
          esc(t("passport.v03Ops.stateTitle")) +
          "</div>" +
          '<div><strong>' +
          esc(t("passport.v03Ops.creator")) +
          ':</strong> <span class="mono">' +
          esc(String(creatorAddr)) +
          "</span></div>" +
          '<div><strong>' +
          esc(t("passport.v03Ops.owner")) +
          ':</strong> <span class="mono">' +
          esc(String(ownerAddr)) +
          "</span></div>" +
          '<div><strong>' +
          esc(t("passport.v03Ops.revoked")) +
          ":</strong> " +
          (revoked ? esc(t("passport.v03Ops.revokedYes")) : esc(t("passport.v03Ops.revokedNo"))) +
          "</div>" +
          '<div><strong>' +
          esc(t("passport.v03Ops.delegation")) +
          ":</strong> " +
          esc(delLine) +
          "</div>" +
          '<div><strong>' +
          esc(t("passport.v03Ops.governanceAddr")) +
          ':</strong> <span class="mono">' +
          esc(govAddr ? String(govAddr) : "—") +
          "</span></div>" +
          (hasCounterfeitOnChain
            ? '<div><strong>' +
              esc(t("passport.v03Ops.counterfeitLine")) +
              ":</strong> " +
              cfLine +
              "</div>"
            : "");
      }
      if (agentUrlBlock) {
        if (!revoked && isPublishAgentWallet) {
          agentUrlBlock.style.display = "block";
          var eA = global.document.getElementById("passportV03AgentUrlErr");
          var dA = global.document.getElementById("passportV03AgentUrlData");
          var iA = global.document.getElementById("passportV03AgentUrlImg");
          if (eA) eA.innerHTML = "";
          if (dA) dA.value = p.dataUrl || "";
          if (iA) iA.value = p.imageUrl || "";
        } else {
          agentUrlBlock.style.display = "none";
        }
      }
      if (ownerBlock) ownerBlock.style.display = !revoked && isOwner ? "block" : "none";
      if (publishAgentBlock) publishAgentBlock.style.display = !revoked && isCreator ? "block" : "none";
      if (revokeBlock) revokeBlock.style.display = !revoked && (isCreator || isGov) ? "block" : "none";
      if (instBlock) {
        instBlock.style.display =
          hasCounterfeitOnChain && !revoked && canShowPassportPmProof() ? "block" : "none";
      }
      if (paffBlock) paffBlock.style.display = profileLetter(creatorId) === "P" ? "block" : "none";
      var canClearCf = ccActive && ccProver && creatorId && ccProver === creatorId;
      var cfRaise = global.document.getElementById("passportV03CfRaiseBtn");
      var cfClear = global.document.getElementById("passportV03CfClearBtn");
      if (cfRaise) cfRaise.disabled = !!ccActive;
      if (cfClear) cfClear.style.display = canClearCf ? "" : "none";
    } catch (e) {
      passportV03Last = { humanId: null, p: null };
      var m = e && (e.reason || e.message) ? String(e.reason || e.message) : String(e);
      if (stateEl) {
        stateEl.style.display = "none";
        stateEl.innerHTML = "";
      }
      if (ownerBlock) ownerBlock.style.display = "none";
      if (publishAgentBlock) publishAgentBlock.style.display = "none";
      var aubE = global.document.getElementById("passportV03AgentUrlBlock");
      if (aubE) aubE.style.display = "none";
      if (revokeBlock) revokeBlock.style.display = "none";
      if (instBlock) instBlock.style.display = "none";
      if (paffBlock) paffBlock.style.display = "none";
      if (errEl) errEl.innerHTML = '<div class="info e">' + esc(m) + "</div>";
    }
  }

  function bindPassportV03Operations() {
    var contract = getContract();
    if (!passportV03UiEnabled()) return;
    var loadBtn = global.document.getElementById("passportV03LoadBtn");
    if (loadBtn)
      loadBtn.onclick = function () {
        void passportV03RefreshState();
      };
    void passportV03UpdateGovStrip();
    var govTx = global.document.getElementById("passportV03GovTransferBtn");
    if (govTx) {
      govTx.onclick = async function () {
        var errEl = global.document.getElementById("passportV03Err");
        if (errEl) errEl.innerHTML = "";
        var raw =
          global.document.getElementById("passportV03GovNew") && global.document.getElementById("passportV03GovNew").value
            ? String(global.document.getElementById("passportV03GovNew").value).trim()
            : "";
        var addr;
        try {
          addr = global.ethers.utils.getAddress(raw);
        } catch (e1) {
          if (errEl) errEl.innerHTML = '<div class="info warn">' + esc(t("passport.v03Ops.needAddress")) + "</div>";
          return;
        }
        govTx.disabled = true;
        if (errEl) errEl.innerHTML = '<div class="info neutral">' + esc(t("passport.v03Ops.sending")) + "</div>";
        try {
          var tx = await contract.transferGovernance(addr);
          await tx.wait();
          if (errEl)
            errEl.innerHTML =
              '<div class="info neutral">' +
              esc(t("passport.v03Ops.doneTx")) +
              ' <code class="mono">' +
              esc(tx.hash) +
              "</code></div>";
          global.document.getElementById("passportV03GovNew").value = "";
          void passportV03UpdateGovStrip();
          void passportV03RefreshState();
        } catch (e2) {
          var m2 = e2 && (e2.reason || e2.message) ? String(e2.reason || e2.message) : String(e2);
          if (errEl) errEl.innerHTML = '<div class="info e">' + esc(m2) + "</div>";
        }
        govTx.disabled = false;
      };
    }
    var transferBtn = global.document.getElementById("passportV03TransferBtn");
    if (transferBtn) {
      transferBtn.onclick = async function () {
        var errEl = global.document.getElementById("passportV03Err");
        if (errEl) errEl.innerHTML = "";
        var hid = passportV03Last.humanId;
        if (!hid) {
          if (errEl) errEl.innerHTML = '<div class="info warn">' + esc(t("passport.v03Ops.needValidId")) + "</div>";
          return;
        }
        var raw =
          global.document.getElementById("passportV03TransferTo") &&
          global.document.getElementById("passportV03TransferTo").value
            ? String(global.document.getElementById("passportV03TransferTo").value).trim()
            : "";
        var addr;
        try {
          addr = global.ethers.utils.getAddress(raw);
        } catch (e3) {
          if (errEl) errEl.innerHTML = '<div class="info warn">' + esc(t("passport.v03Ops.needAddress")) + "</div>";
          return;
        }
        transferBtn.disabled = true;
        if (errEl) errEl.innerHTML = '<div class="info neutral">' + esc(t("passport.v03Ops.sending")) + "</div>";
        try {
          var tx3 = await contract.transferPassport(hid, addr);
          await tx3.wait();
          if (errEl)
            errEl.innerHTML =
              '<div class="info neutral">' +
              esc(t("passport.v03Ops.doneTx")) +
              ' <code class="mono">' +
              esc(tx3.hash) +
              "</code></div>";
          void passportV03RefreshState();
        } catch (e4) {
          var m4 = e4 && (e4.reason || e4.message) ? String(e4.reason || e4.message) : String(e4);
          if (errEl) errEl.innerHTML = '<div class="info e">' + esc(m4) + "</div>";
        }
        transferBtn.disabled = false;
      };
    }
    var delBtn = global.document.getElementById("passportV03DelegateBtn");
    if (delBtn) {
      delBtn.onclick = async function () {
        var errEl = global.document.getElementById("passportV03Err");
        if (errEl) errEl.innerHTML = "";
        if (!passportV03Last || !passportV03Last.p) {
          if (errEl) errEl.innerHTML = '<div class="info warn">' + esc(t("passport.v03Ops.needValidId")) + "</div>";
          return;
        }
        var rawA =
          global.document.getElementById("passportV03DelegateAgent") &&
          global.document.getElementById("passportV03DelegateAgent").value
            ? String(global.document.getElementById("passportV03DelegateAgent").value).trim()
            : "";
        var agent;
        try {
          agent = global.ethers.utils.getAddress(rawA);
        } catch (e5) {
          if (errEl) errEl.innerHTML = '<div class="info warn">' + esc(t("passport.v03Ops.needAddress")) + "</div>";
          return;
        }
        var dtEl = global.document.getElementById("passportV03DelegateExpires");
        var dtVal = dtEl && dtEl.value ? String(dtEl.value) : "";
        if (!dtVal) {
          if (errEl) errEl.innerHTML = '<div class="info warn">' + esc(t("passport.v03Ops.delegateExpires")) + "</div>";
          return;
        }
        var expAt = Math.floor(new Date(dtVal).getTime() / 1000);
        delBtn.disabled = true;
        if (errEl) errEl.innerHTML = '<div class="info neutral">' + esc(t("passport.v03Ops.sending")) + "</div>";
        try {
          var tx5 = await contract.delegateCreatorPublishing(agent, expAt);
          await tx5.wait();
          if (errEl)
            errEl.innerHTML =
              '<div class="info neutral">' +
              esc(t("passport.v03Ops.doneTx")) +
              ' <code class="mono">' +
              esc(tx5.hash) +
              "</code></div>";
          void passportV03RefreshState();
        } catch (e6) {
          var m6 = e6 && (e6.reason || e6.message) ? String(e6.reason || e6.message) : String(e6);
          if (errEl) errEl.innerHTML = '<div class="info e">' + esc(m6) + "</div>";
        }
        delBtn.disabled = false;
      };
    }
    var revDel = global.document.getElementById("passportV03RevokeDelBtn");
    if (revDel) {
      revDel.onclick = async function () {
        var errEl = global.document.getElementById("passportV03Err");
        if (errEl) errEl.innerHTML = "";
        if (!passportV03Last || !passportV03Last.p) {
          if (errEl) errEl.innerHTML = '<div class="info warn">' + esc(t("passport.v03Ops.needValidId")) + "</div>";
          return;
        }
        revDel.disabled = true;
        if (errEl) errEl.innerHTML = '<div class="info neutral">' + esc(t("passport.v03Ops.sending")) + "</div>";
        try {
          var tx6 = await contract.revokeCreatorPublishing();
          await tx6.wait();
          if (errEl)
            errEl.innerHTML =
              '<div class="info neutral">' +
              esc(t("passport.v03Ops.doneTx")) +
              ' <code class="mono">' +
              esc(tx6.hash) +
              "</code></div>";
          void passportV03RefreshState();
        } catch (e7) {
          var m7 = e7 && (e7.reason || e7.message) ? String(e7.reason || e7.message) : String(e7);
          if (errEl) errEl.innerHTML = '<div class="info e">' + esc(m7) + "</div>";
        }
        revDel.disabled = false;
      };
    }
    var agentUrlBtn = global.document.getElementById("passportV03AgentUrlSubmitBtn");
    if (agentUrlBtn) {
      agentUrlBtn.onclick = async function () {
        var errUrl = global.document.getElementById("passportV03AgentUrlErr");
        if (errUrl) errUrl.innerHTML = "";
        var hid = passportV03Last && passportV03Last.humanId;
        var p = passportV03Last && passportV03Last.p;
        if (!hid || !p) {
          if (errUrl) errUrl.innerHTML = '<div class="info warn">' + esc(t("passport.v03Ops.needValidId")) + "</div>";
          return;
        }
        var newData =
          global.document.getElementById("passportV03AgentUrlData") &&
          global.document.getElementById("passportV03AgentUrlData").value
            ? String(global.document.getElementById("passportV03AgentUrlData").value).trim()
            : "";
        var newImg =
          global.document.getElementById("passportV03AgentUrlImg") &&
          global.document.getElementById("passportV03AgentUrlImg").value
            ? String(global.document.getElementById("passportV03AgentUrlImg").value).trim()
            : "";
        if (newData.length > 512 || newImg.length > 512) {
          if (errUrl) errUrl.innerHTML = '<div class="info warn">' + esc(t("passport.v03Ops.agentUrlUrlTooLong")) + "</div>";
          return;
        }
        var confirmed = p.dataHash;
        try {
          if (
            confirmed != null &&
            typeof global.ethers !== "undefined" &&
            global.ethers.utils &&
            typeof global.ethers.utils.hexlify === "function" &&
            !(typeof confirmed === "string" && /^0x[0-9a-f]{64}$/i.test(String(confirmed)))
          ) {
            confirmed = global.ethers.utils.hexlify(confirmed);
          }
        } catch (e8) {}
        agentUrlBtn.disabled = true;
        if (errUrl) errUrl.innerHTML = '<div class="info neutral">' + esc(t("passport.v03Ops.sending")) + "</div>";
        try {
          var tx8 = await contract.updatePassportUrls(hid, newData, newImg, confirmed);
          await tx8.wait();
          if (errUrl)
            errUrl.innerHTML =
              '<div class="info neutral">' +
              esc(t("passport.v03Ops.doneTx")) +
              ' <code class="mono">' +
              esc(tx8.hash) +
              "</code></div>";
          void passportV03RefreshState();
        } catch (e9) {
          var m9 = e9 && (e9.reason || e9.message) ? String(e9.reason || e9.message) : String(e9);
          if (errUrl) errUrl.innerHTML = '<div class="info e">' + esc(m9) + "</div>";
        }
        agentUrlBtn.disabled = false;
      };
    }
    var revP = global.document.getElementById("passportV03RevokePassportBtn");
    if (revP) {
      revP.onclick = async function () {
        var errEl = global.document.getElementById("passportV03Err");
        if (errEl) errEl.innerHTML = "";
        var hid = passportV03Last.humanId;
        if (!hid) {
          if (errEl) errEl.innerHTML = '<div class="info warn">' + esc(t("passport.v03Ops.needValidId")) + "</div>";
          return;
        }
        var reason =
          global.document.getElementById("passportV03RevokeReason") &&
          global.document.getElementById("passportV03RevokeReason").value
            ? String(global.document.getElementById("passportV03RevokeReason").value).trim()
            : "";
        if (!reason.length) {
          if (errEl) errEl.innerHTML = '<div class="info warn">' + esc(t("passport.v03Ops.needReason")) + "</div>";
          return;
        }
        var rh = passportV03KeccakUtf8(reason);
        revP.disabled = true;
        if (errEl) errEl.innerHTML = '<div class="info neutral">' + esc(t("passport.v03Ops.sending")) + "</div>";
        try {
          var tx9 = await contract.revokePassport(hid, rh);
          await tx9.wait();
          if (errEl)
            errEl.innerHTML =
              '<div class="info neutral">' +
              esc(t("passport.v03Ops.doneTx")) +
              ' <code class="mono">' +
              esc(tx9.hash) +
              "</code></div>";
          void passportV03RefreshState();
        } catch (e10) {
          var m10 = e10 && (e10.reason || e10.message) ? String(e10.reason || e10.message) : String(e10);
          if (errEl) errEl.innerHTML = '<div class="info e">' + esc(m10) + "</div>";
        }
        revP.disabled = false;
      };
    }
    var cfRaise = global.document.getElementById("passportV03CfRaiseBtn");
    if (cfRaise) {
      cfRaise.onclick = async function () {
        if (typeof contract.getCounterfeitConcern !== "function") return;
        var errEl = global.document.getElementById("passportV03Err");
        if (errEl) errEl.innerHTML = "";
        var hid = passportV03Last.humanId;
        if (!hid) {
          if (errEl) errEl.innerHTML = '<div class="info warn">' + esc(t("passport.v03Ops.needValidId")) + "</div>";
          return;
        }
        var reason =
          global.document.getElementById("passportV03CfReason") &&
          global.document.getElementById("passportV03CfReason").value
            ? String(global.document.getElementById("passportV03CfReason").value).trim()
            : "";
        if (!reason.length) {
          if (errEl) errEl.innerHTML = '<div class="info warn">' + esc(t("passport.v03Ops.needReason")) + "</div>";
          return;
        }
        var rh2 = passportV03KeccakUtf8(reason);
        cfRaise.disabled = true;
        if (errEl) errEl.innerHTML = '<div class="info neutral">' + esc(t("passport.v03Ops.sending")) + "</div>";
        try {
          var tx10 = await contract.raiseCounterfeitConcern(hid, rh2);
          await tx10.wait();
          if (errEl)
            errEl.innerHTML =
              '<div class="info neutral">' +
              esc(t("passport.v03Ops.doneTx")) +
              ' <code class="mono">' +
              esc(tx10.hash) +
              "</code></div>";
          void passportV03RefreshState();
        } catch (e11) {
          var m11 = e11 && (e11.reason || e11.message) ? String(e11.reason || e11.message) : String(e11);
          if (errEl) errEl.innerHTML = '<div class="info e">' + esc(m11) + "</div>";
        }
        cfRaise.disabled = false;
      };
    }
    var cfClear = global.document.getElementById("passportV03CfClearBtn");
    if (cfClear) {
      cfClear.onclick = async function () {
        if (typeof contract.getCounterfeitConcern !== "function") return;
        var errEl = global.document.getElementById("passportV03Err");
        if (errEl) errEl.innerHTML = "";
        var hid = passportV03Last.humanId;
        if (!hid) {
          if (errEl) errEl.innerHTML = '<div class="info warn">' + esc(t("passport.v03Ops.needValidId")) + "</div>";
          return;
        }
        cfClear.disabled = true;
        if (errEl) errEl.innerHTML = '<div class="info neutral">' + esc(t("passport.v03Ops.sending")) + "</div>";
        try {
          var tx11 = await contract.clearCounterfeitConcern(hid);
          await tx11.wait();
          if (errEl)
            errEl.innerHTML =
              '<div class="info neutral">' +
              esc(t("passport.v03Ops.doneTx")) +
              ' <code class="mono">' +
              esc(tx11.hash) +
              "</code></div>";
          void passportV03RefreshState();
        } catch (e12) {
          var m12 = e12 && (e12.reason || e12.message) ? String(e12.reason || e12.message) : String(e12);
          if (errEl) errEl.innerHTML = '<div class="info e">' + esc(m12) + "</div>";
        }
        cfClear.disabled = false;
      };
    }
    var paffBtn = global.document.getElementById("passportV03PaffDetachBtn");
    if (paffBtn) {
      paffBtn.onclick = async function () {
        var errEl = global.document.getElementById("passportV03Err");
        if (errEl) errEl.innerHTML = "";
        var childP =
          global.document.getElementById("passportV03PaffChild") &&
          global.document.getElementById("passportV03PaffChild").value
            ? String(global.document.getElementById("passportV03PaffChild").value).trim()
            : "";
        if (!childP || childP.charAt(0) !== "P") {
          if (errEl) errEl.innerHTML = '<div class="info warn">' + esc(t("passport.v03Ops.needChildP")) + "</div>";
          return;
        }
        paffBtn.disabled = true;
        if (errEl) errEl.innerHTML = '<div class="info neutral">' + esc(t("passport.v03Ops.sending")) + "</div>";
        try {
          var tx12 = await contract.detachPAffiliation(childP);
          await tx12.wait();
          if (errEl)
            errEl.innerHTML =
              '<div class="info neutral">' +
              esc(t("passport.v03Ops.doneTx")) +
              ' <code class="mono">' +
              esc(tx12.hash) +
              "</code></div>";
        } catch (e13) {
          var m13 = e13 && (e13.reason || e13.message) ? String(e13.reason || e13.message) : String(e13);
          if (errEl) errEl.innerHTML = '<div class="info e">' + esc(m13) + "</div>";
        }
        paffBtn.disabled = false;
      };
    }
  }

  function prefillPassportV03Ops(hid) {
    var inp = global.document.getElementById("passportV03Hid");
    if (inp) inp.value = hid;
    if (_ctx && typeof _ctx.scrollToV03Card === "function") _ctx.scrollToV03Card();
    void passportV03RefreshState();
  }

  global.odpPassportV03OpsInstall = install;
  global.odpHtmlPassportV03OperationsCard = htmlPassportV03OperationsCard;
  global.odpBindPassportV03Operations = bindPassportV03Operations;
  global.odpPrefillPassportV03Ops = prefillPassportV03Ops;
})(typeof window !== "undefined" ? window : globalThis);
