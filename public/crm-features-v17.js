// v17 — زیرهم، عرض در فرم ویرایش، اسکرول ویرایش، حذف بدون پنهان‌سازی بعدی،
// برچسب فارسی، ستاره الزامی، داروخانه سفارش مثل پیش‌فرض، تراز یک‌خطی،
// طراح دستی قفل‌شده روی بوم خط‌دار، خروجی اکسل تیک‌خورده
(function () {
  "use strict";

  var VER = "11.14.0";
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;");
  }
  function normName(s) {
    return String(s || "")
      .replace(/ي/g, "ی").replace(/ك/g, "ک")
      .replace(/‌/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function findPharmacyRec(val) {
    val = String(val || "").trim();
    if (!val || !window.state) return null;
    var n = normName(val);
    if (!n) return null;
    var list = state.pharmacies || [];
    var exact = list.filter(function (p) { return p && p.name && normName(p.name) === n; });
    exact.sort(function (a, b) { return (a.stub ? 1 : 0) - (b.stub ? 1 : 0); });
    if (exact.length) return exact[0];
    if (val.length >= 3) {
      var part = list.filter(function (p) { return p && p.name && normName(p.name).indexOf(n) !== -1; });
      part.sort(function (a, b) { return (a.stub ? 1 : 0) - (b.stub ? 1 : 0); });
      if (part.length === 1) return part[0];
    }
    return null;
  }

  function dedupePharmacies() {
    if (!window.state || !state.pharmacies) return;
    var by = {};
    var keep = [];
    state.pharmacies.forEach(function (p) {
      if (!p || !p.name) { keep.push(p); return; }
      var k = normName(p.name);
      if (!k) { keep.push(p); return; }
      if (!by[k]) {
        by[k] = p;
        keep.push(p);
        return;
      }
      if (by[k].stub && !p.stub) {
        var i = keep.indexOf(by[k]);
        if (i !== -1) keep[i] = p;
        by[k] = p;
      }
    });
    state.pharmacies = keep;
  }

  function fillOrderFromPharmacy(rec) {
    if (!rec) return;
    if ($("orderPharmacyName")) $("orderPharmacyName").value = rec.name || "";
    if ($("orderPharmacyMatchedId")) $("orderPharmacyMatchedId").value = rec.id || "";
    var provEl = $("orderProvince");
    var cityEl = $("orderCity");
    var distEl = $("orderDistrict");
    var addrEl = $("orderAddress");
    if (provEl && rec.province) {
      provEl.value = rec.province;
      try { provEl.dispatchEvent(new Event("change", { bubbles: true })); } catch (e) {}
      if (typeof populateCities === "function" && cityEl) populateCities(rec.province, cityEl, rec.city);
      if (typeof populateDistricts === "function" && distEl) populateDistricts(rec.province, rec.city, distEl, rec.district);
    }
    if (addrEl && rec.address) addrEl.value = rec.address;
    var box = $("existingPharmacyTopAlert");
    var txt = $("existingPharmacyAlertText");
    if (box && txt) {
      txt.textContent = "داروخانه «" + (rec.name || "") + "» | شهر: " + (rec.city || "—") +
        " | منطقه: " + (rec.district || "—") + " | آدرس: " + (rec.address || "—") +
        (rec.phone ? " | تلفن: " + rec.phone : "");
      box.style.display = "flex";
    }
  }

  function showPharmacyMatch(val, autofill) {
    var rec = findPharmacyRec(val);
    var box = $("existingPharmacyTopAlert");
    var txt = $("existingPharmacyAlertText");
    if (rec && !rec.stub) {
      if ($("orderPharmacyMatchedId")) $("orderPharmacyMatchedId").value = rec.id || "";
      if (txt) {
        txt.textContent = "داروخانه «" + rec.name + "» | شهر: " + (rec.city || "—") +
          " | منطقه: " + (rec.district || "—") + " | آدرس: " + (rec.address || "—");
      }
      if (box) box.style.display = "flex";
      if (autofill) fillOrderFromPharmacy(rec);
      return rec;
    }
    if ($("orderPharmacyMatchedId")) $("orderPharmacyMatchedId").value = "";
    if (box) box.style.display = "none";
    return null;
  }

  function refreshOrderPharmacyList() {
    try { dedupePharmacies(); } catch (e) {}
    try { if (typeof populatePharmacyDatalistInOrders === "function") populatePharmacyDatalistInOrders(); } catch (e) {}
    try { if (typeof updateNavBadges === "function") updateNavBadges(); } catch (e) {}
  }

  function wrapRememberPharmacy() {
    var prev = window.rememberPharmacyName;
    window.rememberPharmacyName = function (name, extra) {
      name = String(name || "").trim();
      extra = extra || {};
      if (!name || !window.state) return null;
      if (!state.knownPharmacyNames) state.knownPharmacyNames = [];
      if (state.knownPharmacyNames.indexOf(name) === -1) state.knownPharmacyNames.push(name);
      var rec = findPharmacyRec(name);
      if (rec) {
        if (extra.province) rec.province = extra.province;
        if (extra.city) rec.city = extra.city;
        if (extra.district) rec.district = extra.district;
        if (extra.address) rec.address = extra.address;
        if (extra.phone) rec.phone = extra.phone;
        if (rec.stub && (extra.address || extra.province || extra.create === false)) rec.stub = false;
        try { if (typeof saveState === "function") saveState(false); } catch (e) {}
        return rec;
      }
      if (extra.create === true && typeof prev === "function") {
        rec = prev(name, extra);
        refreshOrderPharmacyList();
        return rec;
      }
      return null;
    };
  }

  function bindPharmacyInstantButtons() {
    function hook(inpId, isOrder) {
      var inp = $(inpId);
      if (!inp) return;
      var row = inp.closest(".instant-add-row") || inp.parentNode;
      var btn = row && row.querySelector(".btn-instant-add");
      function refreshBtn() {
        var v = (inp.value || "").trim();
        var rec = findPharmacyRec(v);
        if (!btn) return;
        if (rec && !rec.stub) {
          if (isOrder) {
            btn.hidden = false;
            btn.textContent = "قبلاً ثبت شده — انتخاب";
          } else {
            btn.hidden = true;
          }
        }
      }
      if (inp.dataset.v17phInp !== "1") {
        inp.dataset.v17phInp = "1";
        inp.addEventListener("input", refreshBtn);
        inp.addEventListener("focus", refreshBtn);
        if (isOrder) {
          inp.addEventListener("input", function () { showPharmacyMatch(inp.value, false); });
          inp.addEventListener("change", function () { showPharmacyMatch(inp.value, true); });
          inp.addEventListener("blur", function () { showPharmacyMatch(inp.value, false); });
          inp.addEventListener("focus", function () {
            var host = $("orderPharmacyPickBox");
            if (host && typeof window.renderPharmacyPicks !== "function") {
              var q = (inp.value || "").trim();
              var hits = (state.pharmacies || []).filter(function (p) {
                if (!p || !p.name || p.stub) return !!q && p && p.name;
                if (!q) return !p.stub;
                var blob = [p.name, p.province, p.city, p.district, p.address, p.phone].join(" ");
                return normName(blob).indexOf(normName(q)) !== -1;
              }).filter(function (p) { return p && !p.stub; });
              if (!hits.length && !q) hits = (state.pharmacies || []).filter(function (p) { return p && p.name && !p.stub; });
              host.hidden = !hits.length;
              if (hits.length) {
                host.innerHTML = "<div class='ph-pick-hint'>" + hits.length + " داروخانه ثبت‌شده</div>" +
                  hits.slice(0, 30).map(function (p) {
                    return "<button type='button' class='ph-pick-card' data-pid='" + esc(p.id) + "'>" +
                      "<strong>🏥 " + esc(p.name || "") + "</strong>" +
                      "<span>" + esc([p.province, p.city, p.district].filter(Boolean).join(" / ")) + "</span>" +
                      "<span>" + esc(p.address || "") + "</span></button>";
                  }).join("");
                Array.prototype.forEach.call(host.querySelectorAll(".ph-pick-card"), function (b) {
                  b.addEventListener("click", function () {
                    var rec = (state.pharmacies || []).filter(function (p) { return p.id === b.getAttribute("data-pid"); })[0];
                    fillOrderFromPharmacy(rec);
                    host.hidden = true;
                  });
                });
              }
            }
          });
        }
      }
      if (btn && btn.dataset.v17phBtn !== "1") {
        btn.dataset.v17phBtn = "1";
        btn.addEventListener("click", function (ev) {
          var v = (inp.value || "").trim();
          if (!v) return;
          var rec = findPharmacyRec(v);
          if (rec && !rec.stub) {
            ev.preventDefault();
            ev.stopImmediatePropagation();
            if (isOrder) {
              fillOrderFromPharmacy(rec);
              alert("داروخانه «" + rec.name + "» قبلاً ثبت شده است. اطلاعات برای پر کردن خودکار آمد.");
            } else {
              alert("داروخانه «" + rec.name + "» قبلاً در برنامه ذخیره شده است.");
            }
            return;
          }
          if (!isOrder && typeof window.rememberPharmacyName === "function") {
            ev.preventDefault();
            ev.stopImmediatePropagation();
            window.rememberPharmacyName(v, { create: true });
            refreshOrderPharmacyList();
            alert("نام داروخانه «" + v + "» ذخیره شد و در سفارشات مثل داروخانه‌های پیش‌فرض می‌آید.");
          }
        }, true);
      }
    }
    hook("pharmacyName", false);
    hook("orderPharmacyName", true);
  }

  function wrapPharmacySaveRefresh() {
    function after() {
      setTimeout(function () {
        refreshOrderPharmacyList();
        var name = (($("pharmacyName") || {}).value || "").trim();
        if (name && typeof window.rememberPharmacyName === "function") {
          window.rememberPharmacyName(name, {
            province: (($("pharmacyProvince") || {}).value) || "",
            city: (($("pharmacyCity") || {}).value) || "",
            district: (($("pharmacyDistrict") || {}).value) || "",
            address: (($("pharmacyAddress") || {}).value) || "",
            phone: (($("pharmacyPhone") || {}).value) || "",
            create: false
          });
        }
      }, 80);
    }
    var form = $("formPharmacy");
    var btn = $("btnSavePharmacy");
    if (form && form.dataset.v17save !== "1") {
      form.dataset.v17save = "1";
      form.addEventListener("submit", after);
    }
    if (btn && btn.dataset.v17save !== "1") {
      btn.dataset.v17save = "1";
      btn.addEventListener("click", after);
    }
    if (typeof window.deletePharmacy === "function" && !window._v17delPh) {
      window._v17delPh = true;
      var orig = window.deletePharmacy;
      window.deletePharmacy = function (id) {
        var r = orig.apply(this, arguments);
        refreshOrderPharmacyList();
        return r;
      };
    }
  }

  function excelColumnsFor(entity) {
    var out = [];
    var seen = {};
    var meta = ((window.state && state.formFieldMeta) || {})[entity] || {};
    Object.keys(meta).forEach(function (id) {
      if (!meta[id] || meta[id].exportExcel !== true) return;
      seen[id] = true;
      out.push({ id: id, label: meta[id].label || id, builtin: true });
    });
    (((window.state && state.customFields) || {})[entity] || []).forEach(function (f) {
      if (!f || !f.exportExcel || seen[f.id]) return;
      out.push({ id: f.id, label: f.label, builtin: false });
    });
    return out;
  }

  function appendExcelCols(entity, recs, hdrs, rws) {
    var cols = excelColumnsFor(entity);
    cols.forEach(function (c) { hdrs.push(c.label); });
    rws.forEach(function (row, i) {
      var rec = recs[i];
      cols.forEach(function (c) {
        var v = "";
        if (c.builtin && typeof window.builtinFieldValue === "function") {
          v = window.builtinFieldValue(entity, c.id, rec);
        } else if (rec && rec.customFields) {
          v = rec.customFields[c.label] != null ? rec.customFields[c.label] : (rec.customFields[c.id] || "");
        }
        row.push(v == null || v === "—" ? "" : v);
      });
    });
  }

  function rebindExcelButtons() {
    function bind(btnId, entity, recsFn, baseHdrs, rowFn) {
      var btn = $(btnId);
      if (!btn || btn.dataset.v17ex === "1") return;
      btn.dataset.v17ex = "1";
      var clone = btn.cloneNode(true);
      if (btn.parentNode) btn.parentNode.replaceChild(clone, btn);
      clone.addEventListener("click", function () {
        var recs = recsFn() || [];
        var hdrs = baseHdrs.slice();
        var rws = recs.map(rowFn);
        appendExcelCols(entity, recs, hdrs, rws);
        if (typeof downloadCSVFile === "function") {
          downloadCSVFile(entity + "-export.csv", hdrs, rws);
        }
      });
    }
    if (!window.state) return;
    bind("btnExportPharmaciesCSV", "pharmacy",
      function () { return state.pharmacies || []; },
      ["نام داروخانه", "تلفن", "استان", "شهر", "منطقه", "آدرس", "درصدی"],
      function (p) { return [p.name, p.phone || "", p.province, p.city, p.district, p.address, p.isPercentage ? "بله" : "خیر"]; });
    bind("btnExportDoctorsCSV", "doctor",
      function () { return state.doctors || []; },
      ["نام پزشک/مطب", "تخصص", "تلفن", "استان", "شهر", "منطقه", "آدرس", "درصدی"],
      function (d) { return [d.name, d.specialty, d.phone || "", d.province, d.city, d.district, d.address, d.isPercentage ? "بله" : "خیر"]; });
    bind("btnExportOrdersCSV", "order",
      function () { return state.orders || []; },
      ["نام داروخانه", "استان", "شهر", "منطقه", "نماینده", "تاریخ", "مبلغ کل (ریال)", "وضعیت"],
      function (o) { return [o.pharmacyName, o.province, o.city, o.district, o.repName || "", o.orderDate, o.totalAmount || 0, o.status]; });
  }

  function ensureManInspector() {
    if ($("manInspector")) return;
    var toolbar = document.querySelector(".man-toolbar");
    if (!toolbar) return;
    var box = document.createElement("div");
    box.id = "manInspector";
    box.className = "man-inspector";
    box.hidden = true;
    box.innerHTML =
      "<strong>ویرایش مورد انتخاب‌شده</strong>" +
      "<div class='form-grid' style='margin-top:.4rem'>" +
      "<div class='form-group'><label class='form-label'>نام</label><input id='manPropName' class='form-input' readonly></div>" +
      "<div class='form-group'><label class='form-label'>عرض (پیکسل)</label><input id='manPropW' class='form-input' type='number' min='80'></div>" +
      "<div class='form-group'><label class='form-label'>ارتفاع (پیکسل)</label><input id='manPropH' class='form-input' type='number' min='36'></div>" +
      "</div>";
    toolbar.appendChild(box);
    function applySize() {
      var item = window._manSelected;
      if (!item) return;
      var w = parseInt(($("manPropW") || {}).value, 10);
      var h = parseInt(($("manPropH") || {}).value, 10);
      if (w > 40) {
        item.style.width = w + "px";
        item.style.maxWidth = w + "px";
      }
      if (h > 20) item.style.height = h + "px";
    }
    if ($("manPropW")) $("manPropW").addEventListener("change", applySize);
    if ($("manPropH")) $("manPropH").addEventListener("change", applySize);
  }

  function hardenManualCanvas() {
    var host = $("manualDesignCanvas");
    if (!host) return;
    host.classList.add("man-design-mode");
    var clone = host.querySelector(".man-clone");
    if (!clone) return;
    clone.classList.add("man-design-mode");
    Array.prototype.forEach.call(clone.querySelectorAll(".card-header"), function (el) {
      el.setAttribute("data-man-skip", "1");
    });
    Array.prototype.forEach.call(clone.querySelectorAll(".jalali-badge, .jalali-input-wrapper"), function (el) {
      el.style.pointerEvents = "none";
    });
    Array.prototype.forEach.call(clone.querySelectorAll("input, select, textarea, button.btn, .btn-toggle-option"), function (el) {
      if (el.classList.contains("man-handle") || el.classList.contains("man-resize")) return;
      if (el.closest(".man-toolbar") || el.closest(".man-inspector")) return;
      el.setAttribute("tabindex", "-1");
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") el.setAttribute("readonly", "readonly");
      if (el.tagName === "BUTTON" || el.tagName === "SELECT") el.setAttribute("disabled", "disabled");
      el.style.pointerEvents = "none";
    });
    if (typeof window.lockManualDesigner === "function") {
      try { window.lockManualDesigner(); } catch (e) {}
    }
  }

  function watchManualCanvas() {
    var host = $("manualDesignCanvas");
    if (!host || host.dataset.v17obs === "1") return;
    host.dataset.v17obs = "1";
    var t;
    new MutationObserver(function () {
      clearTimeout(t);
      t = setTimeout(function () {
        ensureManInspector();
        hardenManualCanvas();
      }, 60);
    }).observe(host, { childList: true, subtree: true });
  }

  function wrapAttachInstant() {
    if (typeof window.attachInstantAdd !== "function" || window._v17fly) return;
    window._v17fly = true;
    var orig = window.attachInstantAdd;
    window.attachInstantAdd = function (inp) {
      orig(inp);
      if (inp && (inp.id === "pharmacyName" || inp.id === "orderPharmacyName")) {
        bindPharmacyInstantButtons();
      }
    };
  }

  function applyFaLabelsLive() {
    var map = window.FA_FIELD_LABELS || {};
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      var lab = document.querySelector('label[for="' + id + '"]');
      if (lab && /^[A-Za-z][A-Za-z0-9_\-]*$/.test(String(lab.textContent || "").trim())) {
        lab.textContent = map[id];
      }
    });
  }

  function boot() {
    try { wrapRememberPharmacy(); } catch (e) { console.error("v17 remember", e); }
    try { wrapPharmacySaveRefresh(); } catch (e) { console.error("v17 ph save", e); }
    try { wrapAttachInstant(); } catch (e) {}
    try { bindPharmacyInstantButtons(); } catch (e) { console.error("v17 ph bind", e); }
    try { rebindExcelButtons(); } catch (e) { console.error("v17 excel", e); }
    try { ensureManInspector(); } catch (e) {}
    try { watchManualCanvas(); } catch (e) {}
    try { applyFaLabelsLive(); } catch (e) {}
    try { refreshOrderPharmacyList(); } catch (e) {}

    var origSw = window.switchTab;
    if (typeof origSw === "function" && !window._v17Sw) {
      window._v17Sw = true;
      window.switchTab = function (id) {
        origSw(id);
        setTimeout(function () {
          bindPharmacyInstantButtons();
          if (id === "tab-orders") {
            refreshOrderPharmacyList();
            showPharmacyMatch((($("orderPharmacyName") || {}).value) || "", false);
          }
          if (id === "tab-pharmacies") wrapPharmacySaveRefresh();
          if (id === "tab-manual-design") {
            ensureManInspector();
            hardenManualCanvas();
          }
          if (id === "tab-columns-products") applyFaLabelsLive();
        }, 220);
      };
    }
    console.log("v17 ready", VER);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
