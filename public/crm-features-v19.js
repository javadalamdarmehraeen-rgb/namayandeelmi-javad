// v19 (11.15.0) — ستاره فقط تیک مدیر، کشویی‌های کنارهم + افزودن با تایپ،
// حذف کادرهای اضافی افزودن‌ها، آیکون سطل/مداد، ترتیب واقعی لیست، آیکون GPS،
// کلید پاک کردن، اطلاعات کالا + فرمول/ارزش افزوده، پشتیبان واقعی، عیب‌یابی ریز
(function () {
  "use strict";

  var VER = "11.15.0";
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function fieldKeyForTab(tabId) {
    try {
      var ut = ((state && state.userTabs) || []).filter(function (t) { return t.id === tabId; })[0];
      if (ut && ut.key) return ut.key;
    } catch (e) {}
    var map = {
      "tab-dashboard": "dashboard", "tab-pharmacies": "pharmacy", "tab-doctors": "doctor",
      "tab-orders": "order", "tab-activity-log": "activity", "tab-overview-map": "overview",
      "tab-live-location": "live", "tab-search-info": "search", "tab-rep-routes": "routes",
      "tab-my-visit": "visit", "tab-rep-homes": "homes", "tab-leaves": "leave",
      "tab-notifications": "notifications", "tab-monthly-reports": "reports",
      "tab-sales-targets": "target", "tab-custom-fields": "additions",
      "tab-columns-products": "products", "tab-users-permissions": "users",
      "tab-messengers": "messengers", "tab-backup": "backup",
      "tab-install-app": "install", "tab-troubleshooting": "diagnostics",
      "tab-manual-design": "manualdesign"
    };
    return map[tabId] || String(tabId || "").replace(/^tab-/, "") || "misc";
  }
  function isAdmin() {
    var role = sessionStorage.getItem("crmUserRole") || "";
    var user = sessionStorage.getItem("crmUsername") || "";
    return role.indexOf("مدیر") !== -1 || user === "admin";
  }
  function saveSoft() { try { if (typeof saveState === "function") saveState(false); } catch (e) {} }

  /* ======================================================================
     CSS
     ====================================================================== */
  function injectCss() {
    if ($("v19Style")) return;
    var st = document.createElement("style");
    st.id = "v19Style";
    st.textContent = `
/* کشویی‌های هر تب کنار هم (تب افزودن‌ها) */
#addTabPanel{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:.7rem;align-items:start}
#addTabPanel .add-panel-head{grid-column:1/-1}
#addTabPanel .col-help{grid-column:1/-1}
#addTabPanel .add-sel-card{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:.6rem;min-width:0}
#addTabPanel .add-sel-card.add-sel-geo{grid-column:1/-1;background:#f8fafc}
#addTabPanel .add-sel-head{display:flex;align-items:center;gap:.4rem;flex-wrap:wrap;justify-content:space-between}
#addTabPanel .add-opt-list{max-height:180px;overflow:auto;margin:.4rem 0;padding:0;list-style:none}
#addTabPanel .add-opt-list li{display:flex;justify-content:space-between;align-items:center;gap:.3rem;padding:.18rem 0;border-bottom:1px dashed #f1f5f9;font-size:.82rem}
/* مخفی شدن کلید رنگی «افزودن گزینه جدید» کنار لیبل فیلدها */
.btn-add-option{display:none!important}
/* سطر افزودن داخل خود کشویی هنگام تایپ */
.v19-combo-add{color:#0d9488!important;font-weight:800;border-top:1px dashed #99f6e4;background:#f0fdfa!important}
/* آیکونی شدن کلیدهای حذف/ویرایش */
button.v19-ic{min-width:34px;padding:.3rem .45rem;font-size:.95rem;line-height:1}
/* کلید مسیریابی به شکل GPS */
button.v19-gps{padding:.3rem .45rem;color:#0d9488}
button.v19-gps svg{display:block}
/* ردیف اقلام سفارش با ستون‌های جدید */
.order-item-head,.order-item-row{grid-template-columns:1.9fr .6fr .7fr .95fr .95fr 34px 34px!important}
.order-item-row .order-item-total{background:#f0fdfa;border-style:dashed;font-weight:800;color:#0f766e;text-align:center}
@media (max-width:720px){.order-item-row{grid-template-columns:1fr 1fr 34px 34px!important}}
/* جمع‌های سفارش */
.v19-order-totals{display:flex;flex-direction:column;gap:.25rem;align-items:flex-end;margin-top:.75rem;font-weight:700;color:#0f172a;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:10px;padding:.6rem .9rem}
.v19-order-totals strong{color:#0d9488;font-size:1.02rem}
.v19-ot-grand{border-top:1px solid #e2e8f0;padding-top:.3rem;color:#166534}
.v19-ot-grand strong{color:#166534;font-size:1.1rem}
/* کادر افزودن فیلد به فرم کالا: لیبل‌دار و فلش نزدیک فیلد */
#prodFieldBar{display:flex;flex-wrap:wrap;gap:.5rem .7rem;align-items:flex-end;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:.7rem}
#prodFieldBar>strong{width:100%}
#prodFieldBar .v19-mini{display:flex;flex-direction:column;gap:.15rem;font-size:.72rem;font-weight:700;color:#475569}
#prodFieldBar .v19-mini .form-input,#prodFieldBar .v19-mini .form-select{width:auto;min-width:110px;max-width:170px;background-position:left .4rem center;padding-left:1.4rem}
#prodFieldBar .prod-field-extra{display:flex;flex-wrap:wrap;gap:.5rem .7rem;align-items:flex-end;margin-top:0!important;width:auto}
#prodFieldBar .prod-field-extra .form-input,#prodFieldBar .prod-field-extra .form-select{max-width:130px}
/* پنل اطلاعات کالا */
.v19-prod-info{background:#fff;border:1px solid #99f6e4;border-radius:12px;padding:.8rem;margin:.8rem 0}
.v19-prod-info h4{margin:.2rem 0 .6rem;color:#0f766e;font-size:.95rem}
.v19-prod-info table{font-size:.8rem}
.v19-prod-info input[type=number]{max-width:70px}
.v19-prod-info .v19-sec-title{font-weight:800;color:#0f172a;margin:.8rem 0 .35rem;font-size:.86rem}
.v19-formula-box{display:flex;flex-wrap:wrap;gap:.7rem;align-items:flex-end;background:#f0fdfa;border:1px dashed #5eead4;border-radius:10px;padding:.6rem;margin-top:.5rem}
.v19-formula-box .v19-mini{display:flex;flex-direction:column;gap:.15rem;font-size:.72rem;font-weight:700;color:#0f766e}
.v19-formula-box select,.v19-formula-box input{max-width:150px}
/* صفحه پشتیبان‌گیری: چیدمان مرتب */
#tab-backup .form-grid{display:block!important}
#tab-backup .form-group{margin-bottom:1rem;max-width:520px}
#tab-backup .form-group.full-width{max-width:100%}
.v19-bk-status{font-size:.84rem;font-weight:800;border-radius:8px;padding:.45rem .8rem;margin-top:.6rem}
.v19-bk-ok{background:#f0fdf4;color:#166534;border:1px solid #bbf7d0}
.v19-bk-warn{background:#fffbeb;color:#92400e;border:1px solid #fde68a}
/* عیب‌یابی ریز */
.v19-diag-table{width:100%;border-collapse:collapse;font-size:.82rem}
.v19-diag-table th{background:#0f766e;color:#fff;padding:.4rem .5rem;text-align:right}
.v19-diag-table td{border-bottom:1px solid #e2e8f0;padding:.4rem .5rem;vertical-align:top}
.v19-diag-table .ok{color:#15803d;font-weight:800}
.v19-diag-table .warn{color:#b45309;font-weight:800}
.v19-diag-table .bad{color:#b91c1c;font-weight:800}
.v19-diag-table .hint{color:#64748b;font-size:.76rem}
/* بازگردانی فیلدهای حذف‌شده */
.v19-restore-row{display:flex;flex-wrap:wrap;gap:.4rem;align-items:center;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:.5rem .7rem;margin:.5rem 0;font-size:.8rem}
.v19-restore-row .chip{background:#fff;border:1px solid #fdba74;border-radius:999px;padding:.15rem .6rem;display:inline-flex;gap:.35rem;align-items:center}
.v19-restore-row .chip button{border:0;background:#0d9488;color:#fff;border-radius:999px;font-size:.72rem;padding:.1rem .5rem;cursor:pointer}
`;
    document.head.appendChild(st);
  }

  /* ======================================================================
     ۱) ستاره الزامی فقط همان‌هایی که مدیر تیک زده
     ====================================================================== */
  function fixRequiredDefaults() {
    try { window._v18DefaultReq = { pharmacyName: 1, doctorName: 1 }; } catch (e) {}
    if (!window.state || !state.formFieldMeta) return;
    if (state._v19ReqFixed) return;
    var OLD = ["pharmacyDate", "pharmacyProvince", "pharmacyCity", "pharmacyDistrict", "pharmacyAddress",
      "doctorDate", "doctorSpecialty", "doctorProvince", "doctorCity", "doctorDistrict", "doctorAddress",
      "orderPharmacyName", "orderProvince", "orderCity", "orderDistrict",
      "productName", "productDistPrice", "productPrice"];
    Object.keys(state.formFieldMeta).forEach(function (tab) {
      OLD.forEach(function (id) {
        var m = state.formFieldMeta[tab] && state.formFieldMeta[tab][id];
        if (m && m.required === true) m.required = false;
      });
    });
    state._v19ReqFixed = true;
    saveSoft();
  }

  /* ======================================================================
     ۲) تب افزودن‌ها: افزودن گزینه با تایپ داخل خود کشویی
     ====================================================================== */
  function findCustomFieldById(id) {
    var out = null;
    try {
      Object.keys((state && state.customFields) || {}).forEach(function (k) {
        (state.customFields[k] || []).forEach(function (f) { if (f.id === id) out = f; });
      });
    } catch (e) {}
    return out;
  }
  function comboAllowsAdd(sel) {
    if (!sel || !sel.id) return false;
    if (/Province$|City$|District$/.test(sel.id)) return false; // استان/شهر/منطقه ویرایشگر خودشان را دارند
    if (sel.closest("#columnsDesignerHost") || sel.closest(".modal-overlay") || sel.closest("#manualDesignCanvas")) return false;
    var cf = sel.getAttribute("data-custom-field-id") || (sel.dataset && sel.dataset.customFieldId);
    if (cf) {
      var f = findCustomFieldById(cf);
      return !!(f && f.allowAddOption !== false);
    }
    return true; // کشویی‌های ثابت فرم‌ها
  }
  function addTypedOptionToSelect(sel, value) {
    value = String(value || "").trim();
    if (!value) return;
    var cfId = sel.getAttribute("data-custom-field-id") || (sel.dataset && sel.dataset.customFieldId);
    var custom = cfId ? findCustomFieldById(cfId) : null;
    if (custom) {
      if (!custom.options) custom.options = [];
      if (custom.options.indexOf(value) === -1) custom.options.push(value);
    } else {
      if (!state.selectExtraOptions) state.selectExtraOptions = {};
      if (!state.selectExtraOptions[sel.id]) state.selectExtraOptions[sel.id] = [];
      if (state.selectExtraOptions[sel.id].indexOf(value) === -1) state.selectExtraOptions[sel.id].push(value);
    }
    var exists = false;
    Array.prototype.forEach.call(sel.options, function (o) { if (o.value === value) exists = true; });
    if (!exists) {
      var o = document.createElement("option");
      o.value = value; o.textContent = value; sel.appendChild(o);
    }
    saveSoft();
    try { if (typeof window.applySelectExtraOptions === "function") window.applySelectExtraOptions(); } catch (e) {}
    try { if (typeof window.renderAllCustomFieldsInFormsAndTables === "function") window.renderAllCustomFieldsInFormsAndTables(); } catch (e) {}
    try { if (typeof window.renderPharmaciesList === "function") window.renderPharmaciesList(); } catch (e) {}
  }
  function hookComboInstantAdd() {
    if (window._v19ComboHook) return;
    window._v19ComboHook = true;
    document.addEventListener("input", function (ev) {
      var inp = ev.target && ev.target.closest ? ev.target.closest(".crm-combo-input") : null;
      if (!inp) return;
      var wrap = inp.closest(".crm-combo");
      if (!wrap) return;
      var sel = wrap.querySelector("select.crm-combo-src");
      var list = wrap.querySelector(".crm-combo-list");
      if (!sel || !list) return;
      var old = list.querySelector(".v19-combo-add");
      if (old) old.parentNode.removeChild(old);
      if (!comboAllowsAdd(sel)) return;
      var q = String(inp.value || "").trim();
      if (!q) return;
      var dup = false;
      Array.prototype.forEach.call(sel.options, function (o) {
        if ((o.textContent || o.value || "").trim() === q) dup = true;
      });
      if (dup) return;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "crm-combo-item v19-combo-add";
      btn.textContent = "➕ افزودن «" + q + "»";
      btn.addEventListener("mousedown", function (e) { e.preventDefault(); });
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        addTypedOptionToSelect(sel, q);
        sel.value = q;
        inp.value = q;
        list.hidden = true;
        try { sel.dispatchEvent(new Event("change", { bubbles: true })); } catch (err) {}
      });
      list.appendChild(btn);
      list.hidden = false;
    });
  }

  /* ======================================================================
     ۳) آیکون سطل زباله / مداد برای همه کلیدهای حذف/ویرایش
     ====================================================================== */
  function cleanBtnText(t) {
    return String(t || "").replace(/[✏️🗑️🖊️]/g, "").replace(/\s+/g, " ").trim();
  }
  function iconifyButtons(root) {
    root = root || document;
    Array.prototype.forEach.call(root.querySelectorAll("button"), function (b) {
      try {
        if (b.dataset.v19ic === "1") return;
        if (b.closest(".app-header, .app-nav, .side-menu-drawer, #manualDesignCanvas, #tab-manual-design, .modal-overlay")) return;
        if (b.classList.contains("nav-item") || b.classList.contains("side-menu-item")) return;
        var t = cleanBtnText(b.textContent || "");
        if (t === "حذف") {
          b.dataset.v19ic = "1";
          b.innerHTML = "🗑️";
          b.title = "حذف";
          b.setAttribute("aria-label", "حذف");
          b.classList.add("v19-ic");
        } else if (t === "ویرایش") {
          b.dataset.v19ic = "1";
          b.innerHTML = "✏️";
          b.title = "ویرایش";
          b.setAttribute("aria-label", "ویرایش");
          b.classList.add("v19-ic");
        }
      } catch (e) {}
    });
  }
  function watchIcons() {
    if (window._v19IcObs) return;
    window._v19IcObs = true;
    var t;
    new MutationObserver(function () {
      clearTimeout(t);
      t = setTimeout(function () { iconifyButtons(document); }, 120);
    }).observe(document.body, { childList: true, subtree: true });
  }

  /* ======================================================================
     ۴) ترتیب واقعی ستون‌های لیست + ۶) آیکون GPS مسیریابی
     ====================================================================== */
  function listOrderMap(tabId) {
    var m = {};
    try {
      (window.getUnifiedFieldList(tabId) || []).forEach(function (f) {
        if (f && f.id) m[f.id] = (f.listOrder != null && f.listOrder !== "") ? Number(f.listOrder) : (Number(f.order) || 999);
      });
    } catch (e) {}
    return m;
  }
  function shownInList(entity, id) {
    try { return typeof window.isColShownInList !== "function" || window.isColShownInList(entity, id); }
    catch (e) { return true; }
  }
  function customListFields(entity) {
    try {
      return (((state || {}).customFields || {})[entity] || [])
        .filter(function (f) { return f.showInList !== false; })
        .slice()
        .sort(function (a, b) {
          var ao = Number(a.listOrder != null ? a.listOrder : a.order) || 999;
          var bo = Number(b.listOrder != null ? b.listOrder : b.order) || 999;
          return ao - bo;
        })
        .map(function (f) { return { fid: f.id }; });
    } catch (e) { return []; }
  }
  function extraCols(entity) {
    try {
      return (typeof window.extraListColumns === "function" ? window.extraListColumns(entity) : [])
        .map(function (c) { return { fid: c.id }; });
    } catch (e) { return []; }
  }
  function slotsFor(entity) {
    if (entity === "pharmacy") {
      var bi = ["pharmacyDate", "pharmacyProvince", "pharmacyCity", "pharmacyName", "pharmacyPhone", "pharmacyIsPercentage", "phMapSearchInput"]
        .filter(function (id) { return shownInList("pharmacy", id); })
        .map(function (id) { return { fid: id }; });
      return [{ pin: "row" }, { pin: "rep" }].concat(bi, [{ pin: "route" }], extraCols("pharmacy"), customListFields("pharmacy"), [{ pin: "ops" }]);
    }
    if (entity === "doctor") {
      var bj = ["doctorDate", "doctorProvince", "doctorName", "doctorSpecialty", "doctorIsPercentage", "docMapSearchInput"]
        .map(function (id) { return { fid: id }; }); // سلول‌ها در اجرای فعلی فیلتر نمی‌شوند
      return [{ pin: "row" }, { pin: "rep" }].concat(bj, [{ pin: "route" }], extraCols("doctor"), customListFields("doctor"), [{ pin: "ops" }]);
    }
    // order
    var bo = ["orderPharmacyName", "orderProvince", "orderRepName", "orderDate"].map(function (id) { return { fid: id }; });
    return [{ pin: "row" }].concat(bo, [{ pin: "items" }, { pin: "total" }, { fid: "orderStatus" }], extraCols("order"), customListFields("order"), [{ pin: "ops" }]);
  }
  function GPS_SVG() {
    return '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 14.5 9 2.5 2.5 0 0 1 12 11.5z"/></svg>';
  }
  function paintRouteIcons(tbody) {
    if (!tbody) return;
    Array.prototype.forEach.call(tbody.querySelectorAll(".btn-route"), function (b) {
      if (b.dataset.v19gps === "1") return;
      b.dataset.v19gps = "1";
      b.innerHTML = GPS_SVG();
      b.title = "مسیریابی (GPS)";
      b.setAttribute("aria-label", "مسیریابی");
      b.classList.add("v19-gps");
    });
  }
  function reorderOneList(entity, theadTrId, tbodyId) {
    var theadTr = $(theadTrId), tbody = $(tbodyId);
    if (!theadTr || !tbody) return;
    var tabId = entity === "pharmacy" ? "tab-pharmacies" : entity === "doctor" ? "tab-doctors" : "tab-orders";
    var slots = slotsFor(entity);
    var orderMap = listOrderMap(tabId);
    var headCells = theadTr.children;
    if (headCells.length !== slots.length) return; // عدم تطابق → دست نزن
    var repIdx = -1, fieldIdx = [], tailIdx = [];
    slots.forEach(function (s, i) {
      if (s.pin === "rep") repIdx = i;
      else if (s.fid) fieldIdx.push(i);
      else if (i !== 0) tailIdx.push(i);
    });
    if (entity === "order") {
      // نام نماینده به‌عنوان ستون دوم
      slots.forEach(function (s, i) { if (s.fid === "orderRepName") repIdx = i; });
      fieldIdx = fieldIdx.filter(function (i) { return slots[i].fid !== "orderRepName"; });
    }
    fieldIdx.sort(function (a, b) {
      var av = orderMap[slots[a].fid] != null ? orderMap[slots[a].fid] : 999;
      var bv = orderMap[slots[b].fid] != null ? orderMap[slots[b].fid] : 999;
      return av - bv;
    });
    var desired = [0];
    if (repIdx > 0) desired.push(repIdx);
    desired = desired.concat(fieldIdx).concat(tailIdx.filter(function (i) {
      return desired.indexOf(i) === -1 && fieldIdx.indexOf(i) === -1;
    }));
    function applyTo(rowEl) {
      var cells = rowEl.children;
      if (cells.length !== slots.length) return;
      var arr = Array.prototype.slice.call(cells).slice();
      desired.forEach(function (cur) { rowEl.appendChild(arr[cur]); });
    }
    try { applyTo(theadTr); } catch (e) {}
    Array.prototype.forEach.call(tbody.children, applyTo);
    paintRouteIcons(tbody);
    iconifyButtons(tbody);
  }
  function wrapListRenderers() {
    var cfgs = [
      ["renderPharmaciesList", "pharmacy", "tablePharmaciesHeader", "tablePharmaciesBody"],
      ["renderDoctorsList", "doctor", "tableDoctorsHeader", "tableDoctorsBody"],
      ["renderOrdersList", "order", "tableOrdersHeader", "tableOrdersBody"]
    ];
    cfgs.forEach(function (c) {
      if (typeof window[c[0]] !== "function" || window["_v19" + c[0]]) return;
      window["_v19" + c[0]] = true;
      var orig = window[c[0]];
      window[c[0]] = function () {
        var r = orig.apply(this, arguments);
        try { reorderOneList(c[1], c[2], c[3]); } catch (e) {}
        return r;
      };
    });
  }

  /* ======================================================================
     ۵) کلید پاک کردن برای فرم‌ها
     ====================================================================== */
  function addClearButtons() {
    function mk(saveId, resetName) {
      var btn = $(saveId);
      if (!btn || $(saveId + "ClearV19")) return;
      var c = document.createElement("button");
      c.type = "button";
      c.id = saveId + "ClearV19";
      c.className = "btn btn-outline";
      c.style.marginRight = ".5rem";
      c.innerHTML = "🧹 پاک کردن";
      c.title = "پاک کردن همه فیلدهای این فرم";
      c.addEventListener("click", function () {
        if (!confirm("همه فیلدهای این فرم پاک شود؟")) return;
        try { if (typeof window[resetName] === "function") window[resetName](); } catch (e) {}
        var form = btn.closest("form");
        if (form) {
          Array.prototype.forEach.call(form.querySelectorAll("input, select, textarea"), function (el) {
            if (el.type === "button" || el.type === "submit" || el.type === "hidden") return;
            if (el.readOnly) return;
            if (el.type === "checkbox") { el.checked = false; return; }
            if (el.tagName === "SELECT") {
              el.selectedIndex = 0;
              try { el.dispatchEvent(new Event("change", { bubbles: true })); } catch (e) {}
            } else {
              el.value = "";
              try { el.dispatchEvent(new Event("input", { bubbles: true })); } catch (e) {}
            }
          });
        }
        if (saveId === "btnSaveOrder") {
          var cont = $("orderItemsContainer");
          if (cont) cont.innerHTML = "";
          var hid = $("orderEditId"); if (hid) hid.value = "";
        }
        ["editingPharmacyId", "editingDoctorId", "_editingOrderId"].forEach(function (k) {
          try { window[k] = ""; } catch (e) {}
        });
        try { if (typeof updateOrderTotalAmountDisplay === "function") updateOrderTotalAmountDisplay(); } catch (e) {}
      });
      btn.parentNode.insertBefore(c, btn);
    }
    mk("btnSavePharmacy", "resetPharmacyForm");
    mk("btnSaveDoctor", "resetDoctorForm");
    mk("btnSaveOrder", "resetOrderForm");
  }

  /* ======================================================================
     ۸) بازگردانی فیلدهای حذف‌شده (پایین طراح ستون‌ها)
     ====================================================================== */
  function injectRestoreChips() {
    var panel = $("colDesignerPanel");
    if (!panel || panel.hidden) return;
    var tabId = window._activeColTab;
    var old = $("v19RestoreRow");
    if (old) old.parentNode.removeChild(old);
    if (!tabId || !window.state) return;
    var key = fieldKeyForTab(tabId);
    var meta = ((state.formFieldMeta || {})[key]) || {};
    var deletedIds = Object.keys(meta).filter(function (id) { return meta[id] && meta[id].deleted; });
    if (!deletedIds.length) return;
    var row = document.createElement("div");
    row.id = "v19RestoreRow";
    row.className = "v19-restore-row";
    row.innerHTML = "<strong>فیلدهای حذف‌شده این تب:</strong> " + deletedIds.map(function (id) {
      var lab = (meta[id] && meta[id].label) || id;
      return '<span class="chip">' + esc(lab) + ' <button type="button" data-rid="' + esc(id) + '">بازگردانی</button></span>';
    }).join("");
    var head = panel.querySelector(".col-panel-head");
    if (head && head.parentNode) head.parentNode.insertBefore(row, head.nextSibling);
    else panel.insertBefore(row, panel.firstChild);
    Array.prototype.forEach.call(row.querySelectorAll("button[data-rid]"), function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-rid");
        if (meta[id]) meta[id].deleted = false;
        saveSoft();
        alert("فیلد بازگردانی شد؛ صفحه تازه‌سازی می‌شود.");
        location.reload();
      });
    });
  }
  function watchDesignerForChips() {
    var host = $("columnsDesignerHost");
    if (!host || host.dataset.v19chips === "1") return;
    host.dataset.v19chips = "1";
    var t;
    new MutationObserver(function () {
      clearTimeout(t);
      t = setTimeout(injectRestoreChips, 150);
    }).observe(host, { childList: true, subtree: true });
  }

  /* ======================================================================
     ۱۱) اطلاعات کالا + فرمول مبلغ + ارزش افزوده
     ====================================================================== */
  function productFieldsList() {
    var out = [];
    try { out = (window.getUnifiedFieldList("tab-columns-products") || []).slice(); } catch (e) {}
    return out.filter(function (f) {
      return f && f.kind !== "box" && f.kind !== "widget" && String(f.inputKind || f.type || "").indexOf("widget-") !== 0;
    });
  }
  function writeProdFieldFlag(f, flag, value) {
    try {
      var customs = ((state.customFields || {}).products) || [];
      var rec = null;
      customs.forEach(function (x) { if (x.id === f.id) rec = x; });
      if (rec) { rec[flag] = value; saveSoft(); return; }
      if (!state.formFieldMeta) state.formFieldMeta = {};
      if (!state.formFieldMeta.products) state.formFieldMeta.products = {};
      if (!state.formFieldMeta.products[f.id]) state.formFieldMeta.products[f.id] = {};
      state.formFieldMeta.products[f.id][flag] = value;
      saveSoft();
    } catch (e) {}
  }
  function renderProdInfoPanel() {
    var form = $("formProduct");
    if (!form) return;
    var host = $("v19ProdInfo");
    if (!host) {
      host = document.createElement("div");
      host.id = "v19ProdInfo";
      host.className = "v19-prod-info";
      var bar = $("prodFieldBar");
      form.insertBefore(host, bar ? bar.nextSibling : form.firstChild.nextSibling);
    }
    var fields = productFieldsList();
    var html = "<h4>🧾 اطلاعات کالا — فیلدهای فرم کالا</h4>";
    html += "<div class='table-responsive'><table class='data-table'><thead><tr>" +
      "<th>ترتیب در کادر کالا</th><th>ترتیب در لیست</th><th>عنوان</th><th>نوع</th><th>عرض</th><th>ارتفاع</th><th>عملیات</th></tr></thead><tbody>";
    fields.forEach(function (f) {
      html += "<tr data-fid='" + esc(f.id) + "'>" +
        "<td><input type='number' min='1' class='form-input v19-pf-ord' data-fid='" + esc(f.id) + "' value='" + (f.order || "") + "'></td>" +
        "<td><input type='number' min='1' class='form-input v19-pf-lord' data-fid='" + esc(f.id) + "' value='" + (f.listOrder || f.order || "") + "'></td>" +
        "<td><strong>" + esc(f.label) + "</strong>" + (f.builtin ? " <span class='col-help'>(ثابت)</span>" : "") + "</td>" +
        "<td>" + esc(f.inputKind || f.type || "ساده") + "</td>" +
        "<td><input type='number' min='60' max='900' class='form-input v19-pf-size' data-fid='" + esc(f.id) + "' value='" + (f.size || 220) + "'></td>" +
        "<td><input type='number' min='24' max='400' class='form-input v19-pf-h' data-fid='" + esc(f.id) + "' value='" + (f.height || 42) + "'></td>" +
        "<td>" + (f.builtin ? "—" : "<button type='button' class='btn btn-danger btn-sm v19-pf-del' data-fid='" + esc(f.id) + "'>🗑️</button>") + "</td></tr>";
    });
    html += "</tbody></table></div>";

    /* فهرست کالاها با ویرایش/حذف واقعی */
    html += "<div class='v19-sec-title'>📦 اطلاعات کالاهای ثبت‌شده</div>";
    html += "<div class='table-responsive'><table class='data-table'><thead><tr><th>ردیف</th><th>نام کالا</th><th>قیمت پخش</th><th>قیمت داروخانه</th><th>موجودی</th><th>عملیات</th></tr></thead><tbody>";
    ((state.products || [])).forEach(function (p, i) {
      html += "<tr><td>" + (i + 1).toLocaleString("fa-IR") + "</td>" +
        "<td><strong>" + esc(p.name || "—") + "</strong></td>" +
        "<td>" + Number(p.distributorPrice || p.price || 0).toLocaleString("fa-IR") + " ریال</td>" +
        "<td style='color:#0d9488;font-weight:800'>" + Number(p.pharmacyPrice || p.price || 0).toLocaleString("fa-IR") + " ریال</td>" +
        "<td>" + Number(p.stock || 0).toLocaleString("fa-IR") + "</td>" +
        "<td><button type='button' class='btn btn-outline btn-sm v19-prod-edit' data-pid='" + esc(p.id) + "'>✏️</button> " +
        "<button type='button' class='btn btn-danger btn-sm v19-prod-del' data-pid='" + esc(p.id) + "'>🗑️</button></td></tr>";
    });
    html += "</tbody></table></div>";

    /* فرمول مبلغ و ارزش افزوده (فقط مدیر) */
    html += "<div class='v19-sec-title'>🧮 فرمول محاسبه مبلغ سفارش و ارزش افزوده</div>";
    if (isAdmin()) {
      var fm = (typeof getOrderFormula === "function") ? getOrderFormula() : { qty: "count", op: "*", price: "price", vat: 10 };
      var fldOpts = function (cur) {
        return "<option value='count'" + (cur === "count" ? " selected" : "") + ">تعداد کالا</option>" +
          "<option value='gift'" + (cur === "gift" ? " selected" : "") + ">تعداد جایزه</option>" +
          "<option value='price'" + (cur === "price" ? " selected" : "") + ">قیمت واحد</option>";
      };
      var opOpts = function (cur) {
        return "<option value='*'" + (cur === "*" ? " selected" : "") + ">ضربدر (×)</option>" +
          "<option value='/'" + (cur === "/" ? " selected" : "") + ">تقسیم بر (÷)</option>" +
          "<option value='+'" + (cur === "+" ? " selected" : "") + ">به‌علاوه (+)</option>" +
          "<option value='-'" + (cur === "-" ? " selected" : "") + ">منهای (−)</option>";
      };
      html += "<div class='v19-formula-box'>" +
        "<span class='v19-mini'>جمع هر ردیف =</span>" +
        "<label class='v19-mini'>فیلد اول<select id='v19FmQty' class='form-select'>" + fldOpts(fm.qty) + "</select></label>" +
        "<label class='v19-mini'>عملگر<select id='v19FmOp' class='form-select'>" + opOpts(fm.op) + "</select></label>" +
        "<label class='v19-mini'>فیلد دوم<select id='v19FmPrice' class='form-select'>" + fldOpts(fm.price) + "</select></label>" +
        "<label class='v19-mini'>درصد ارزش افزوده<input id='v19FmVat' type='number' min='0' max='100' class='form-input' value='" + fm.vat + "'></label>" +
        "<button type='button' id='v19FmSave' class='btn btn-primary btn-sm' style='background:#0d9488'>ذخیره فرمول</button>" +
        "</div>";
    } else {
      html += "<p class='col-help'>تنظیم فرمول مبلغ و درصد ارزش افزوده فقط برای «مدیر سیستم» فعال است. درصد فعلی: " +
        ((typeof getOrderFormula === "function") ? getOrderFormula().vat : 10).toLocaleString("fa-IR") + "٪</p>";
    }
    host.innerHTML = html;

    /* اتصال رویدادها */
    Array.prototype.forEach.call(host.querySelectorAll(".v19-pf-ord"), function (inp) {
      inp.addEventListener("change", function () {
        var f = fields.filter(function (x) { return x.id === inp.getAttribute("data-fid"); })[0];
        if (!f) return;
        writeProdFieldFlag(f, "order", parseInt(inp.value, 10) || 1);
        try { window.applyFullFormLayout("tab-columns-products"); } catch (e) {}
        renderProdInfoPanel();
      });
    });
    Array.prototype.forEach.call(host.querySelectorAll(".v19-pf-lord"), function (inp) {
      inp.addEventListener("change", function () {
        var f = fields.filter(function (x) { return x.id === inp.getAttribute("data-fid"); })[0];
        if (!f) return;
        writeProdFieldFlag(f, "listOrder", parseInt(inp.value, 10) || 1);
        renderProdInfoPanel();
      });
    });
    Array.prototype.forEach.call(host.querySelectorAll(".v19-pf-size"), function (inp) {
      inp.addEventListener("change", function () {
        var f = fields.filter(function (x) { return x.id === inp.getAttribute("data-fid"); })[0];
        if (!f) return;
        writeProdFieldFlag(f, "size", parseInt(inp.value, 10) || 220);
        try { window.applyFullFormLayout("tab-columns-products"); } catch (e) {}
      });
    });
    Array.prototype.forEach.call(host.querySelectorAll(".v19-pf-h"), function (inp) {
      inp.addEventListener("change", function () {
        var f = fields.filter(function (x) { return x.id === inp.getAttribute("data-fid"); })[0];
        if (!f) return;
        writeProdFieldFlag(f, "height", parseInt(inp.value, 10) || 42);
        try { window.applyFullFormLayout("tab-columns-products"); } catch (e) {}
      });
    });
    Array.prototype.forEach.call(host.querySelectorAll(".v19-pf-del"), function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-fid");
        if (!confirm("این فیلد کاملاً از فرم کالا حذف شود؟")) return;
        state.customFields.products = ((state.customFields || {}).products || []).filter(function (x) { return x.id !== id; });
        document.querySelectorAll('[data-custom-field-id="' + id + '"], [data-col-fid="' + id + '"]').forEach(function (n) {
          var g = n.closest(".form-group, .col-widget-wrap") || n;
          if (g && g.parentNode) g.parentNode.removeChild(g);
        });
        saveSoft();
        try { window.applyFullFormLayout("tab-columns-products"); } catch (e) {}
        renderProdInfoPanel();
      });
    });
    Array.prototype.forEach.call(host.querySelectorAll(".v19-prod-edit"), function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-pid");
        try { if (typeof editProductCatalogItem === "function") editProductCatalogItem(id); } catch (e) {}
      });
    });
    Array.prototype.forEach.call(host.querySelectorAll(".v19-prod-del"), function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-pid");
        try { if (typeof deleteProductCatalogItem === "function") deleteProductCatalogItem(id); } catch (e) {}
        renderProdInfoPanel();
      });
    });
    var fmSave = $("v19FmSave");
    if (fmSave) {
      fmSave.addEventListener("click", function () {
        if (!state.settings) state.settings = {};
        state.settings.orderFormula = {
          qty: ($("v19FmQty") || {}).value || "count",
          op: ($("v19FmOp") || {}).value || "*",
          price: ($("v19FmPrice") || {}).value || "price",
          vat: parseInt(($("v19FmVat") || {}).value, 10) || 0
        };
        saveSoft();
        try { if (typeof updateOrderTotalAmountDisplay === "function") updateOrderTotalAmountDisplay(); } catch (e) {}
        alert("فرمول محاسبه ذخیره شد: «" +
          ({ count: "تعداد کالا", gift: "تعداد جایزه", price: "قیمت واحد" })[state.settings.orderFormula.qty] + " " +
          ({ "*": "×", "/": "÷", "+": "+", "-": "−" })[state.settings.orderFormula.op] + " " +
          ({ count: "تعداد کالا", gift: "تعداد جایزه", price: "قیمت واحد" })[state.settings.orderFormula.price] +
          "» و ارزش افزوده " + Number(state.settings.orderFormula.vat).toLocaleString("fa-IR") + "٪");
      });
    }
  }
  function upgradeProdBarV19() {
    var bar = $("prodFieldBar");
    if (!bar || bar.dataset.v19 === "1") return;
    bar.dataset.v19 = "1";
    // لیبل‌دار کردن کنترل‌ها
    var pairs = [
      ["prodNewFieldLabel", "عنوان فیلد"], ["prodNewFieldType", "نوع فیلد"], ["prodNewFieldOpts", "گزینه‌ها"],
      ["prodNewFieldOrder", "شماره ترتیب در کادر کالا"], ["prodNewFieldPlace", "چینش"],
      ["prodNewFieldSize", "عرض پیکسل"], ["prodNewFieldHeight", "ارتفاع پیکسل"]
    ];
    pairs.forEach(function (pr) {
      var el = $(pr[0]);
      if (!el || el.closest(".v19-mini")) return;
      var w = document.createElement("label");
      w.className = "v19-mini";
      el.parentNode.insertBefore(w, el);
      w.appendChild(el);
      w.insertBefore(document.createTextNode(pr[1]), el);
    });
    // شماره ترتیب در لیست (کنار ترتیب کادر)
    if (!$("prodNewFieldListOrder")) {
      var ord = $("prodNewFieldOrder");
      if (ord) {
        var w2 = document.createElement("label");
        w2.className = "v19-mini";
        w2.innerHTML = "شماره ترتیب در لیست<input id='prodNewFieldListOrder' class='form-input' type='number' min='1' placeholder='ترتیب لیست'>";
        var mini = ord.closest(".v19-mini");
        if (mini && mini.parentNode) mini.parentNode.insertBefore(w2, mini.nextSibling);
        else bar.appendChild(w2);
      }
    }
    var add = $("btnAddProductField");
    if (add && add.dataset.v19 !== "1") {
      add.dataset.v19 = "1";
      add.addEventListener("click", function () {
        var last = ((state.customFields || {}).products || []).slice(-1)[0];
        if (last) {
          var lo = parseInt(($("prodNewFieldListOrder") || {}).value, 10);
          if (lo > 0) last.listOrder = lo;
          saveSoft();
        }
        if ($("prodNewFieldListOrder")) $("prodNewFieldListOrder").value = "";
        setTimeout(renderProdInfoPanel, 60);
      });
    }
    var ed = $("btnEditProductForm");
    if (ed) ed.parentNode.removeChild(ed); // «ویرایش کالای جدول» حذف شد
  }

  /* ======================================================================
     ۴) افزودن لحظه‌ای برای فیلدهای غیرکشویی (حافظه پیشنهاد)
     ====================================================================== */
  function attachHistoryDatalist(inp) {
    if (!inp || inp.dataset.v19hist === "1") return;
    var fid = inp.getAttribute("data-custom-field-id") || "";
    if (!fid) return;
    var f = findCustomFieldById(fid);
    if (!f || f.allowAddOption === false) return;
    var kind = String(f.inputKind || f.type || "simple");
    if (kind === "select" || kind === "date") return;
    inp.dataset.v19hist = "1";
    var listId = "v19hist-" + fid;
    var dl = $(listId);
    if (!dl) {
      dl = document.createElement("datalist");
      dl.id = listId;
      document.body.appendChild(dl);
    }
    inp.setAttribute("list", listId);
    var hist = ((state.instantValueHistory || {})[fid]) || [];
    dl.innerHTML = hist.map(function (v) { return "<option value='" + esc(v) + "'></option>"; }).join("");
  }
  function hookInstantHistory() {
    if (window._v19Hist || !window.state) return;
    window._v19Hist = true;
    if (!state.instantValueHistory) state.instantValueHistory = {};
    document.addEventListener("focusin", function (e) {
      if (e.target && e.target.getAttribute && e.target.getAttribute("data-custom-field-id")) attachHistoryDatalist(e.target);
    });
    document.addEventListener("focusout", function (e) {
      var inp = e.target;
      if (!inp || !inp.getAttribute || !inp.getAttribute("data-custom-field-id")) return;
      var fid = inp.getAttribute("data-custom-field-id");
      var v = String(inp.value || "").trim();
      if (!v) return;
      var f = findCustomFieldById(fid);
      if (!f || f.allowAddOption === false) return;
      var kind = String(f.inputKind || f.type || "simple");
      if (kind === "select" || kind === "date") return;
      var arr = state.instantValueHistory[fid] || (state.instantValueHistory[fid] = []);
      if (arr.indexOf(v) === -1) {
        arr.unshift(v);
        if (arr.length > 30) arr.length = 30;
        saveSoft();
      }
    });
  }

  /* ======================================================================
     ۱۲) پشتیبان‌گیری واقعی در پوشه انتخابی مدیر
     ====================================================================== */
  var bk = { file: null, dir: null };
  function idbOpen() {
    return new Promise(function (res, rej) {
      if (!window.indexedDB) return rej(new Error("no idb"));
      var rq = indexedDB.open("crmV19", 1);
      rq.onupgradeneeded = function () { rq.result.createObjectStore("kv"); };
      rq.onsuccess = function () { res(rq.result); };
      rq.onerror = function () { rej(rq.error || new Error("idb err")); };
    });
  }
  function idbSet(k, v) {
    return idbOpen().then(function (db) {
      return new Promise(function (res, rej) {
        var tx = db.transaction("kv", "readwrite");
        tx.objectStore("kv").put(v, k);
        tx.oncomplete = function () { res(); };
        tx.onerror = function () { rej(tx.error); };
      });
    });
  }
  function idbGet(k) {
    return idbOpen().then(function (db) {
      return new Promise(function (res, rej) {
        var tx = db.transaction("kv", "readonly");
        var g = tx.objectStore("kv").get(k);
        g.onsuccess = function () { res(g.result || null); };
        g.onerror = function () { rej(g.error); };
      });
    });
  }
  function bkStatus(msg, ok) {
    var el = $("autoBackupHandleStatus");
    if (el) {
      el.textContent = msg;
      el.className = ok ? "v19-bk-status v19-bk-ok" : "v19-bk-status v19-bk-warn";
      el.style.cssText = "";
    }
  }
  function bkWriteJson(name) {
    var json = JSON.stringify(state, null, 2);
    if (bk.dir) {
      return bk.dir.getFileHandle(name, { create: true }).then(function (fh) {
        return fh.createWritable().then(function (w) {
          return w.write(json).then(function () { return w.close(); });
        });
      });
    }
    if (bk.file) {
      return bk.file.createWritable().then(function (w) {
        return w.write(json).then(function () { return w.close(); });
      });
    }
    return Promise.reject(new Error("no-target"));
  }
  function bkHasTarget() { return !!(bk.dir || bk.file); }

  function overrideAutoBackup() {
    window.performAutoBackup = function () {
      try {
        if (state.settings) state.settings.lastBackupTime = new Date().toLocaleString("fa-IR");
      } catch (e) {}
      if (!bkHasTarget()) return Promise.resolve(false);
      return bkWriteJson("crm-backup-latest.json").then(function () {
        bkStatus("✅ ذخیره خودکار فعال است — آخرین: " + (state.settings && state.settings.lastBackupTime || ""), true);
        return true;
      }).catch(function (err) {
        bkStatus("⚠️ خطا در نوشتن فایل پشتیبان: " + (err && err.message ? err.message : err), false);
        return false;
      });
    };
  }

  function connectBackupTarget() {
    function afterPick() {
      idbSet("backupHandles", { file: bk.file || null, dir: bk.dir || null }).catch(function () {});
      bkStatus("✅ متصل شد — پشتیبان‌ها در محل انتخاب‌شده ذخیره می‌شوند", true);
    }
    if (window.showDirectoryPicker) {
      return window.showDirectoryPicker({ id: "crmBackupFolder" }).then(function (d) {
        bk.dir = d; bk.file = null;
        afterPick();
        if (typeof window.performAutoBackup === "function") window.performAutoBackup();
        return undefined;
      }).catch(function () { });
    }
    if (window.showSaveFilePicker) {
      return window.showSaveFilePicker({
        suggestedName: "crm-backup-latest.json",
        types: [{ description: "JSON CRM Backup File", accept: { "application/json": [".json"] } }]
      }).then(function (f) {
        bk.file = f; bk.dir = null;
        afterPick();
        if (typeof window.performAutoBackup === "function") window.performAutoBackup();
        return undefined;
      }).catch(function () { });
    }
    bkStatus("⚠️ این مرورگر ذخیره مستقیم در پوشه را پشتیبانی نمی‌کند؛ فایل در دانلودها ذخیره می‌شود.", false);
    return Promise.resolve();
  }

  function manualBackupNow() {
    function fallbackDownload() {
      var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
      var a = document.createElement("a");
      a.setAttribute("href", dataStr);
      a.setAttribute("download", "crm-backup-latest.json");
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
    if (bkHasTarget()) {
      bkWriteJson("crm-backup-latest.json").then(function () {
        try { state.settings.lastBackupTime = new Date().toLocaleString("fa-IR"); } catch (e) {}
        bkStatus("✅ پشتیبان دستی در محل انتخاب‌شده ذخیره شد — " + (state.settings && state.settings.lastBackupTime || ""), true);
        alert("✅ فایل پشتیبان در همان پوشه‌ای که انتخاب کرده بودید ذخیره شد.");
      }).catch(function (err) {
        bkStatus("⚠️ خطا: " + (err && err.message ? err.message : err), false);
        alert("⚠️ ذخیره در پوشه ممکن نشد؛ دوباره پوشه را انتخاب کنید.");
      });
      return;
    }
    if (window.showDirectoryPicker || window.showSaveFilePicker) {
      connectBackupTarget().then(function () {
        if (bkHasTarget()) alert("✅ فایل پشتیبان در پوشه انتخاب‌شده ذخیره شد.");
      });
      return;
    }
    fallbackDownload();
  }

  function restoreBackupHandles() {
    idbGet("backupHandles").then(function (h) {
      if (!h) {
        bkStatus("⚠️ محل ذخیره انتخاب نشده — برای فعال شدن ذخیره خودکار یک‌بار «انتخاب پوشه/فایل» را بزنید.", false);
        return;
      }
      var target = h.dir || h.file;
      if (!target) return;
      function ready(p) {
        if (p === "granted") {
          bk.dir = h.dir || null; bk.file = h.file || null;
          bkStatus("✅ ذخیره خودکار فعال است", true);
        } else {
          bkStatus("⚠️ برای ادامه ذخیره خودکار، یک‌بار روی صفحه کلیک کنید تا دسترسی پوشه تأیید شود.", false);
          var once = function () {
            target.requestPermission({ mode: "readwrite" }).then(function (p2) {
              if (p2 === "granted") {
                bk.dir = h.dir || null; bk.file = h.file || null;
                bkStatus("✅ ذخیره خودکار فعال است", true);
              }
            }).catch(function () {});
            document.removeEventListener("click", once);
          };
          document.addEventListener("click", once);
        }
      }
      try {
        if (target.queryPermission) target.queryPermission({ mode: "readwrite" }).then(ready).catch(function () {});
        else ready("granted");
      } catch (e) { }
    }).catch(function () {
      bkStatus("⚠️ محل ذخیره انتخاب نشده است.", false);
    });
  }

  function rewireBackupButtons() {
    [["btnSelectAutoBackupFolder", "📁 انتخاب پوشه/فایل پشتیبان‌گیری"], ["btnManualBackupNow", null], ["btnQuickBackup", null]].forEach(function (it) {
      var b = $(it[0]);
      if (!b || b.dataset.v19bk === "1") return;
      b.dataset.v19bk = "1";
      var clone = b.cloneNode(true);
      b.parentNode.replaceChild(clone, b);
      if (it[1]) clone.innerHTML = "<span>" + it[1] + "</span>";
      if (it[0] === "btnSelectAutoBackupFolder") clone.addEventListener("click", connectBackupTarget);
      else clone.addEventListener("click", manualBackupNow);
    });
  }

  function fixBackupPage() {
    // موتور چیدمان نباید صفحه پشتیبان را جابه‌جا کند
    if (typeof window.applyFullFormLayout === "function" && !window._v19BackupLayoutGuard) {
      window._v19BackupLayoutGuard = true;
      var prev = window.applyFullFormLayout;
      window.applyFullFormLayout = function (tabId) {
        if (tabId === "tab-backup") return;
        return prev.apply(this, arguments);
      };
    }
    rewireBackupButtons();
    overrideAutoBackup();
    restoreBackupHandles();
  }

  /* ======================================================================
     ۱۳) عیب‌یابی ریز و دقیق
     ====================================================================== */
  function diagRow(name, status, detail, hint) {
    return { name: name, status: status, detail: detail || "", hint: hint || "" };
  }
  function runDetailedDiagnostics() {
    var host = $("diagnosticsVisual");
    var box = $("diagnosticsStatusBox");
    if (!host) return;
    if (box) {
      box.style.background = "#fef9c3";
      box.style.color = "#854d0e";
      box.textContent = "⏳ بررسی ریز به‌ریز سیستم در حال انجام است...";
    }
    host.innerHTML = "<table class='v19-diag-table'><thead><tr><th>بخش</th><th>وضعیت</th><th>جزئیات دقیق</th><th>راهنمای رفع</th></tr></thead><tbody id='v19DiagBody'></tbody></table>";
    var tb = $("v19DiagBody");
    var rows = [];
    function push(r) {
      rows.push(r);
      var icon = r.status === "ok" ? "<span class='ok'>✅ سالم</span>" : r.status === "warn" ? "<span class='warn'>⚠️ هشدار</span>" : "<span class='bad'>❌ مشکل</span>";
      var tr = document.createElement("tr");
      tr.innerHTML = "<td><strong>" + esc(r.name) + "</strong></td><td>" + icon + "</td><td>" + r.detail + "</td><td class='hint'>" + r.hint + "</td>";
      tb.appendChild(tr);
    }

    // همگام
    push(diagRow("اتصال اینترنت مرورگر", navigator.onLine ? "ok" : "bad",
      "navigator.onLine = " + navigator.onLine,
      navigator.onLine ? "" : "اینترنت دستگاه را بررسی کنید؛ برنامه آفلاین کار می‌کند ولی همگام‌سازی نه."));
    try {
      var raw = localStorage.getItem("CRM_APP_STATE_V2");
      var kb = raw ? Math.round(raw.length / 1024) : 0;
      push(diagRow("حافظه محلی (localStorage)", raw ? "ok" : "bad",
        "حجم داده ذخیره‌شده: " + kb.toLocaleString("fa-IR") + " کیلوبایت",
        raw ? "" : "داده‌ای نیست؛ یک‌بار صفحه را باز و ذخیره کنید."));
    } catch (e) {
      push(diagRow("حافظه محلی (localStorage)", "bad", "خطا: " + esc(e.message), "حالت خصوصی/حریم مرورگرstorage را محدود کرده است."));
    }
    var sess = sessionStorage.getItem("crmLoggedIn") === "1";
    push(diagRow("نشست ورود", sess ? "ok" : "warn",
      sess ? ("کاربر: " + esc(sessionStorage.getItem("crmUserName") || "—") + " | نقش: " + esc(sessionStorage.getItem("crmUserRole") || "—")) : "ورود فعال نیست",
      sess ? "" : "از صفحه ورود وارد شوید."));

    // داده‌ها
    if (window.state) {
      push(diagRow("داده‌های برنامه", "ok",
        "داروخانه: <strong>" + (state.pharmacies || []).length.toLocaleString("fa-IR") + "</strong> | پزشک: <strong>" + (state.doctors || []).length.toLocaleString("fa-IR") + "</strong> | سفارش: <strong>" + (state.orders || []).length.toLocaleString("fa-IR") + "</strong> | کالا: <strong>" + (state.products || []).length.toLocaleString("fa-IR") + "</strong> | کاربر: <strong>" + (state.users || []).length.toLocaleString("fa-IR") + "</strong>", ""));
      var cfCount = 0;
      try { Object.keys(state.customFields || {}).forEach(function (k) { cfCount += (state.customFields[k] || []).length; }); } catch (e) {}
      var deletedCount = 0;
      try {
        Object.keys(state.formFieldMeta || {}).forEach(function (k) {
          Object.keys(state.formFieldMeta[k] || {}).forEach(function (id) { if (state.formFieldMeta[k][id].deleted) deletedCount++; });
        });
      } catch (e) {}
      push(diagRow("فیلدهای سفارشی/طراح", "ok",
        "فیلدهای اضافه‌شده: " + cfCount.toLocaleString("fa-IR") + " | فیلدهای حذف‌شده (قابل بازگردانی): " + deletedCount.toLocaleString("fa-IR"), ""));
      push(diagRow("آخرین پشتیبان", (state.settings && state.settings.lastBackupTime) ? "ok" : "warn",
        "زمان: " + esc((state.settings && state.settings.lastBackupTime) || "هنوز انجام نشده"),
        (state.settings && state.settings.lastBackupTime) ? "" : "از تب پشتیبان‌گیری، محل ذخیره را انتخاب کنید."));
    } else {
      push(diagRow("داده‌های برنامه", "bad", "شی state در دسترس نیست", "صفحه را کامل بارگذاری مجدد کنید (Ctrl+F5)."));
    }

    // سرویس‌ورکر و کش
    var swSupported = "serviceWorker" in navigator;
    if (!swSupported) push(diagRow("سرویس‌ورکر (PWA)", "warn", "مرورگر پشتیبانی نمی‌کند", "از Chrome/Edge استفاده کنید."));
    else if (navigator.serviceWorker.controller) push(diagRow("سرویس‌ورکر (PWA)", "ok", "فعال و کنترل‌کننده صفحه است", ""));
    else push(diagRow("سرویس‌ورکر (PWA)", "warn", "ثبت شده ولی هنوز کنترل‌کننده نیست", "یک‌بار صفحه را تازه‌سازی کنید."));
    if (window.caches) {
      caches.keys().then(function (keys) {
        push(diagRow("کش آفلاین", keys.length ? "ok" : "warn",
          keys.length ? "کش‌ها: " + keys.map(esc).join("، ") : "کشی نیست",
          keys.length ? "" : "یک‌بار آنلاین باز کنید تا کش ساخته شود."));
      }).catch(function () {});
    }
    push(diagRow("IndexedDB / File System Access",
      (window.indexedDB ? 1 : 0) ? (window.showDirectoryPicker || window.showSaveFilePicker ? "ok" : "warn") : "bad",
      "IndexedDB: " + (window.indexedDB ? "دارد" : "ندارد") + " | انتخاب پوشه: " + (window.showDirectoryPicker ? "دارد" : window.showSaveFilePicker ? "فقط فایل" : "ندارد"),
      (window.showDirectoryPicker || window.showSaveFilePicker) ? "" : "برای پشتیبان در پوشه مشخص، از Chrome/Edge استفاده کنید."));
    push(diagRow("نقشه (Leaflet)", window.L ? "ok" : "bad",
      window.L ? "نسخه " + esc(L.version || "?") + " بارگذاری شده" : "کتابخانه نقشه لود نشده",
      window.L ? "" : "فایل‌های vendor/leaflet.js را بررسی کنید."));

    // شبکه
    var t0 = Date.now();
    fetch("/api/health").then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        push(diagRow("سرور برنامه (/api/health)", r.ok ? "ok" : "bad",
          "HTTP " + r.status + " | زمان پاسخ: " + (Date.now() - t0).toLocaleString("fa-IR") + "ms | نسخه سرور: " + esc(j.version || "—"),
          r.ok ? "" : "سرور پاسخ غیرمنتظره داد؛ لاگ سرور را ببینید."));
        finish();
      });
    }).catch(function (e) {
      push(diagRow("سرور برنامه (/api/health)", "bad", "خطا در اتصال: " + esc(e.message || e),
        "اتصال اینترنت/سرور را بررسی کنید؛ در حالت آفلاین طبیعی است."));
      finish();
    });
    fetch("/api/state").then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        var st2 = j && j.status ? j.status : "—";
        var isOff = st2 !== "success";
        push(diagRow("فایل وضعیت سرور (/api/state)", "ok",
          isOff ? "ذخیره‌سازی سروری غیرفعال است (حالت عادی برنامه)" : ("وضعیت: " + esc(st2)),
          isOff ? "هیچ اقدامی لازم نیست؛ همه داده‌ها در حافظه محلی مرورگر ذخیره می‌شوند." : ""));
      });
    }).catch(function () {});

    var finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      setTimeout(function () {
        var bads = rows.filter(function (r) { return r.status === "bad"; }).length;
        var warns = rows.filter(function (r) { return r.status === "warn"; }).length;
        if (box) {
          if (bads) {
            box.style.background = "#fef2f2"; box.style.color = "#b91c1c";
            box.textContent = "❌ " + bads.toLocaleString("fa-IR") + " مشکل جدی پیدا شد — ستون «راهنمای رفع» را ببینید.";
          } else if (warns) {
            box.style.background = "#fffbeb"; box.style.color = "#92400e";
            box.textContent = "⚠️ سیستم کار می‌کند ولی " + warns.toLocaleString("fa-IR") + " هشدار جزئی وجود دارد.";
          } else {
            box.style.background = "#f0fdf4"; box.style.color = "#166534";
            box.textContent = "✅ همه بررسی‌ها سالم است.";
          }
        }
      }, 250);
    }
  }

  /* ======================================================================
     ۱۴) همگام‌سازی دسترسی‌ها با امکانات جدید
     ====================================================================== */
  function migratePermissions() {
    var groups = null;
    try { groups = (typeof PERMISSION_GROUPS !== "undefined") ? PERMISSION_GROUPS : window.PERMISSION_GROUPS; } catch (e) {}
    if (!groups || !window.state || !state.users) return;
    var keys = [];
    Object.keys(groups).forEach(function (g) { (groups[g] || []).forEach(function (it) { keys.push(it.key); }); });
    var changed = false;
    (state.users || []).forEach(function (u) {
      if (!u.permissions) u.permissions = {};
      keys.forEach(function (k) {
        if (u.permissions[k] == null) { u.permissions[k] = true; changed = true; }
      });
    });
    if (changed) saveSoft();
  }

  /* ======================================================================
     بوت
     ====================================================================== */
  function boot() {
    injectCss();
    try { fixRequiredDefaults(); } catch (e) {}
    try { hookComboInstantAdd(); } catch (e) {}
    try { iconifyButtons(document); } catch (e) {}
    try { watchIcons(); } catch (e) {}
    try { wrapListRenderers(); } catch (e) {}
    try { addClearButtons(); } catch (e) {}
    try { watchDesignerForChips(); } catch (e) {}
    try { injectRestoreChips(); } catch (e) {}
    try { upgradeProdBarV19(); } catch (e) {}
    try { renderProdInfoPanel(); } catch (e) {}
    try { hookInstantHistory(); } catch (e) {}
    try { fixBackupPage(); } catch (e) {}
    try { migratePermissions(); } catch (e) {}
    // دکمه «بررسی مجدد اتصال» به عیب‌یابی ریز واقعی وصل شود (به‌جای تست ساختگی)
    window.testServerConnectivity = function () { try { runDetailedDiagnostics(); } catch (e) {} };

    var origSw = window.switchTab;
    if (typeof origSw === "function" && !window._v19Sw) {
      window._v19Sw = true;
      window.switchTab = function (id) {
        origSw(id);
        setTimeout(function () {
          try { iconifyButtons(document.getElementById(id) || document); } catch (e) {}
          try { addClearButtons(); } catch (e) {}
          if (id === "tab-columns-products") {
            try { upgradeProdBarV19(); renderProdInfoPanel(); } catch (e) {}
            try { injectRestoreChips(); } catch (e) {}
          }
          if (id === "tab-backup") { try { fixBackupPage(); } catch (e) {} }
          if (id === "tab-troubleshooting") { try { runDetailedDiagnostics(); } catch (e) {} }
        }, 150);
      };
    }
    // پنل اطلاعات کالا بعد از ذخیره کالا هم تازه شود
    if (typeof window.renderColumnsProductsTable === "function" && !window._v19ProdTableWrap) {
      window._v19ProdTableWrap = true;
      var origP = window.renderColumnsProductsTable;
      window.renderColumnsProductsTable = function () {
        var r = origP.apply(this, arguments);
        try { iconifyButtons(document.getElementById("tableProductsBody")); } catch (e) {}
        try { renderProdInfoPanel(); } catch (e) {}
        return r;
      };
    }
    console.log("v19 ready", VER);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
