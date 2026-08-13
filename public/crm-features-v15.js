// v15 — سایز واقعی فیلد، فریز سرستون+اسکرول افقی زیر آن، ذخیره افزودن، حفظ تنظیمات، طراح دستی بدون خراب کردن فرم/لیست
(function () {
  "use strict";

  var VER = "11.11.0";
  var BACKUP_KEY = "CRM_APP_STATE_BACKUP_BEFORE_11_11_0";
  var PROTECTED_CARD = {
    cardPhForm: 1, cardPhList: 1, cardDocForm: 1, cardDocList: 1,
    cardOrdForm: 1, cardOrdList: 1, formPharmacy: 1, formDoctor: 1, formOrder: 1
  };

  function $(id) { return document.getElementById(id); }

  function backupUserStateOnce() {
    try {
      var raw = localStorage.getItem("CRM_APP_STATE_V2");
      if (!raw) return;
      if (!localStorage.getItem(BACKUP_KEY)) localStorage.setItem(BACKUP_KEY, raw);
      localStorage.setItem("CRM_APP_STATE_BACKUP_LATEST", raw);
    } catch (e) {}
  }


  function softenBrokenAbsLayouts() {
    try {
      if (localStorage.getItem("CRM_SOFTEN_ABS_11_11_0") === "1") return;
    } catch (e) {}
    if (!window.state || !state.manualLayouts) return;
    var changed = false;
    ["tab-pharmacies", "tab-doctors", "tab-orders"].forEach(function (tabId) {
      var items = state.manualLayouts[tabId] && state.manualLayouts[tabId].items;
      if (!items) return;
      Object.keys(items).forEach(function (id) {
        if (items[id] && items[id].abs) {
          items[id].abs = false;
          changed = true;
        }
      });
    });
    try { localStorage.setItem("CRM_SOFTEN_ABS_11_11_0", "1"); } catch (e) {}
    if (changed && typeof saveState === "function") saveState(false);
  }

  function restoreProtectedCards() {
    Object.keys(PROTECTED_CARD).forEach(function (id) {
      var el = $(id);
      if (!el) return;
      el.style.position = "";
      el.style.left = "";
      el.style.top = "";
      el.style.display = "block";
      el.style.visibility = "visible";
      el.style.opacity = "1";
      el.style.height = "";
      el.style.maxHeight = "";
      el.style.overflow = "";
      el.classList.remove("col-hide-form");
    });
    try {
      if (!window.state || !state.manualLayouts) return;
      Object.keys(state.manualLayouts).forEach(function (tabId) {
        var items = state.manualLayouts[tabId] && state.manualLayouts[tabId].items;
        if (!items) return;
        Object.keys(PROTECTED_CARD).forEach(function (id) {
          if (items[id]) delete items[id];
        });
      });
    } catch (e) {}
  }

  /* ---------- سایز فیلد: مقدار ذخیره‌شده کاربر دست نخورد؛ نمایش واقعی؛ اعمال روی خود اینپوت ---------- */
  function inferredDisplaySize(field) {
    if (!field) return 220;
    var saved = parseInt(field.size, 10);
    if (saved > 40) return saved;
    var el = document.getElementById(field.id);
    if (el) {
      var w = Math.round(el.getBoundingClientRect().width);
      if (w > 60) return w;
    }
    if (field.full || field.place === "under" || /Address|address|Notes|notes/.test(field.id || "") || /آدرس/.test(field.label || "")) {
      return 560;
    }
    return 220;
  }

  function applySizeToInput(group, size) {
    if (!group) return;
    var n = parseInt(size, 10);
    if (!(n > 40)) return;
    var inp = group.querySelector(".form-input, .form-select, .form-textarea, input:not([type=hidden]), select, textarea");
    if (!inp) return;
    if (inp.classList && inp.classList.contains("map-container")) return;
    inp.style.setProperty("width", n + "px", "important");
    inp.style.setProperty("max-width", "100%", "important");
    inp.setAttribute("data-col-width", String(n));
  }

  function wrapPaintFieldBox() {
    /* paintFieldBox داخل v11 است؛ بعد از applyFullFormLayout دوباره عرض اینپوت را می‌نشانیم */
    if (typeof window.applyFullFormLayout !== "function" || window._v15Paint) return;
    window._v15Paint = true;
    var orig = window.applyFullFormLayout;
    window.applyFullFormLayout = function (tabId) {
      var out = orig(tabId);
      try { paintSavedSizes(tabId); } catch (e) {}
      return out;
    };
  }

  function paintSavedSizes(tabId) {
    if (!tabId || typeof window.getUnifiedFieldList !== "function") {
      /* getUnifiedFieldList روی window نیست؛ از meta می‌خوانیم */
    }
    var pane = $(tabId);
    if (!pane || !window.state) return;
    var key = tabId.replace(/^tab-/, "");
    try {
      if (typeof window.fieldKeyForTab === "function") key = window.fieldKeyForTab(tabId);
    } catch (e) {}
    var map = {
      "tab-pharmacies": "pharmacy", "tab-doctors": "doctor", "tab-orders": "order",
      "tab-columns-products": "products"
    };
    key = map[tabId] || key;
    var meta = ((state.formFieldMeta || {})[key]) || {};
    Object.keys(meta).forEach(function (fid) {
      var size = parseInt(meta[fid] && meta[fid].size, 10);
      if (!(size > 40)) return;
      var el = document.getElementById(fid) || pane.querySelector('[data-col-fid="' + fid + '"]');
      var g = el && (el.classList && el.classList.contains("form-group") ? el : el.closest(".form-group"));
      applySizeToInput(g || el, size);
    });
    ((state.customFields || {})[key] || []).forEach(function (f) {
      var size = parseInt(f.size, 10);
      if (!(size > 40)) return;
      var inp = pane.querySelector('[data-custom-field-id="' + f.id + '"]');
      var g = inp && inp.closest(".form-group");
      applySizeToInput(g || inp, size);
    });
  }

  function hookDesignerSizeDisplay() {
    document.addEventListener("focusin", function (e) {
      var t = e.target;
      if (!t || t.id !== "colFieldSize") return;
      if (t.dataset.v15filled === "1") return;
      if (window._editingColField) {
        var shown = inferredDisplaySize(window._editingColField);
        if (!t.value || t.value === "220") t.value = String(shown);
        t.dataset.v15filled = "1";
      }
    });
    document.addEventListener("change", function (e) {
      var t = e.target;
      if (!t || !t.classList || !t.classList.contains("col-size-input")) return;
      var tabId = window._activeColTab;
      var fid = t.getAttribute("data-fid");
      var size = parseInt(t.value, 10);
      if (!tabId || !fid || !(size > 40)) return;
      if (typeof window.writeFieldSize === "function") {
        window.writeFieldSize(tabId, fid, size);
      } else {
        writeSizeFallback(tabId, fid, size);
      }
      if (typeof saveState === "function") saveState();
      if (typeof window.applyFullFormLayout === "function") window.applyFullFormLayout(tabId);
      paintSavedSizes(tabId);
    });
  }

  function writeSizeFallback(tabId, fieldId, size) {
    if (!window.state) return;
    size = parseInt(size, 10) || 220;
    var keyMap = {
      "tab-pharmacies": "pharmacy", "tab-doctors": "doctor", "tab-orders": "order",
      "tab-columns-products": "products"
    };
    var key = keyMap[tabId] || String(tabId || "").replace(/^tab-/, "");
    var custom = ((state.customFields || {})[key] || []).filter(function (f) { return f.id === fieldId; })[0];
    if (custom) { custom.size = size; return; }
    if (!state.formFieldMeta) state.formFieldMeta = {};
    if (!state.formFieldMeta[key]) state.formFieldMeta[key] = {};
    if (!state.formFieldMeta[key][fieldId]) state.formFieldMeta[key][fieldId] = {};
    state.formFieldMeta[key][fieldId].size = size;
  }

  /* ---------- فریز سرستون + اسکرول افقی چسبیده زیر سرستون ---------- */
  function installFrozenTable(wrap) {
    if (!wrap || wrap.dataset.v15freeze === "1") return;
    if (wrap.closest(".tbl-freeze-shell")) return;
    var table = wrap.querySelector("table.data-table, table");
    if (!table || !table.tHead) return;
    wrap.dataset.v15freeze = "1";

    var shell = document.createElement("div");
    shell.className = "tbl-freeze-shell";
    wrap.parentNode.insertBefore(shell, wrap);

    var headBar = document.createElement("div");
    headBar.className = "tbl-freeze-head";
    var headTable = document.createElement("table");
    headTable.className = table.className || "data-table";
    headTable.appendChild(table.tHead.cloneNode(true));
    headBar.appendChild(headTable);

    var xbar = document.createElement("div");
    xbar.className = "tbl-freeze-xbar";
    xbar.setAttribute("aria-hidden", "true");
    var xinner = document.createElement("div");
    xinner.className = "tbl-freeze-xbar-inner";
    xbar.appendChild(xinner);

    var body = document.createElement("div");
    body.className = "tbl-freeze-body";
    shell.appendChild(headBar);
    shell.appendChild(xbar);
    shell.appendChild(body);
    body.appendChild(wrap);
    table.classList.add("tbl-freeze-src");

    function syncWidths() {
      var dstTh = headTable.tHead ? headTable.tHead.querySelectorAll("th") : [];
      var srcCells = [];
      var firstRow = table.tBodies[0] && table.tBodies[0].rows[0];
      if (firstRow) srcCells = firstRow.cells;
      if (!srcCells.length && table.tHead) srcCells = table.tHead.querySelectorAll("th");
      var total = 0;
      for (var i = 0; i < dstTh.length; i++) {
        var w = 80;
        if (srcCells[i]) {
          w = Math.ceil(srcCells[i].getBoundingClientRect().width) || srcCells[i].offsetWidth || 80;
        }
        if (w < 48) w = 80;
        dstTh[i].style.width = w + "px";
        dstTh[i].style.minWidth = w + "px";
        if (srcCells[i] && srcCells[i].style) srcCells[i].style.minWidth = w + "px";
        total += w;
      }
      var tw = Math.max(table.scrollWidth, total, 400);
      headTable.style.width = tw + "px";
      table.style.minWidth = tw + "px";
      xinner.style.width = tw + "px";
    }

    var lock = false;
    function syncX(from) {
      if (lock) return;
      lock = true;
      var sl = from.scrollLeft;
      if (from !== body) body.scrollLeft = sl;
      if (from !== headBar) headBar.scrollLeft = sl;
      if (from !== xbar) xbar.scrollLeft = sl;
      lock = false;
    }

    body.addEventListener("scroll", function () { syncX(body); });
    headBar.addEventListener("scroll", function () { syncX(headBar); });
    xbar.addEventListener("scroll", function () { syncX(xbar); });
    window.addEventListener("resize", function () { setTimeout(syncWidths, 40); });

    var obs = new MutationObserver(function () { setTimeout(syncWidths, 30); });
    obs.observe(table, { childList: true, subtree: true });
    wrap._v15sync = syncWidths;
    shell._v15sync = syncWidths;
    setTimeout(syncWidths, 50);
    setTimeout(syncWidths, 300);
  }

  function freezeAllTables() {
    [
      "colFieldList",
      "tablePharmacies", "tableDoctors", "tableOrders",
      "tableCustomFields", "tableProductsBody"
    ].forEach(function (id) {
      var el = $(id);
      if (!el) return;
      var wrap = el.classList && el.classList.contains("table-responsive")
        ? el
        : (el.closest(".table-responsive") || el.parentElement);
      if (wrap) installFrozenTable(wrap);
    });
    document.querySelectorAll(".table-responsive").forEach(function (w) {
      installFrozenTable(w);
    });
    document.querySelectorAll(".tbl-freeze-shell").forEach(function (s) {
      if (typeof s._v15sync === "function") s._v15sync();
    });
  }

  /* ---------- افزودن فیلد ساده: ذخیره قطعی ---------- */
  function saveCustomFieldNow(ev) {
    if (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
    }
    var targetSel = $("cfTargetEntity");
    var target = targetSel && targetSel.value ? targetSel.value : "pharmacy";
    var tabId = "";
    if (targetSel && targetSel.selectedOptions && targetSel.selectedOptions[0]) {
      tabId = targetSel.selectedOptions[0].getAttribute("data-tab") || "";
    }
    if (!tabId) {
      var rev = {
        pharmacy: "tab-pharmacies", doctor: "tab-doctors", order: "tab-orders",
        products: "tab-columns-products"
      };
      tabId = rev[target] || ("tab-" + target);
    }
    var label = (($("cfLabel") || {}).value || "").trim();
    var type = (($("cfType") || {}).value || "simple");
    var optionsStr = (($("cfOptions") || {}).value || "").trim();
    var allowAdd = $("cfAllowAddOption") ? $("cfAllowAddOption").checked : true;
    var showInForm = $("cfShowInForm") ? $("cfShowInForm").checked : true;
    var showInList = $("cfShowInList") ? $("cfShowInList").checked : true;
    var st = $("cfSaveStatus");
    if (!label) {
      if (st) st.textContent = "عنوان فیلد خالی است.";
      alert("عنوان فیلد را بنویسید.");
      return false;
    }
    if (!window.state) {
      alert("وضعیت برنامه هنوز بارگذاری نشده. صفحه را تازه کنید.");
      return false;
    }
    if (!state.customFields) state.customFields = {};
    if (!state.customFields[target]) state.customFields[target] = [];
    var opts = [];
    if (type === "select") {
      opts = optionsStr.split(/[،,]/).map(function (s) { return s.trim(); }).filter(Boolean);
      if (!opts.length) opts = ["گزینه اول", "گزینه دوم"];
    }
    var neu = {
      id: "cf-" + target + "-" + Date.now(),
      label: label,
      type: type === "select" ? "select" : "simple",
      inputKind: type,
      options: opts,
      allowAddOption: allowAdd,
      showInForm: showInForm,
      showInList: showInList,
      order: state.customFields[target].length + 1,
      size: 220
    };
    state.customFields[target].push(neu);
    try { if (typeof saveState === "function") saveState(); } catch (e) { console.error(e); }
    if ($("cfLabel")) $("cfLabel").value = "";
    if ($("cfOptions")) $("cfOptions").value = "";
    try { if (typeof renderCustomFieldsTable === "function") renderCustomFieldsTable(); } catch (e) {}
    try { if (typeof renderAllCustomFieldsInFormsAndTables === "function") renderAllCustomFieldsInFormsAndTables(); } catch (e) {}
    try { if (tabId && typeof window.applyFullFormLayout === "function") window.applyFullFormLayout(tabId); } catch (e) {}
    try {
      if (typeof window.renderAddTabGrid === "function") window.renderAddTabGrid();
      if (typeof window.renderAddTabPanel === "function") window.renderAddTabPanel();
    } catch (e) {}
    if (st) st.textContent = "ذخیره شد: «" + label + "» روی تب نشست.";
    alert("فیلد «" + label + "» ذخیره شد.");
    return false;
  }

  function bindAddFieldHard() {
    var form = $("formCustomField");
    var btn = $("btnSaveCustomField");
    if (btn && btn.dataset.v15 !== "1") {
      var neu = btn.cloneNode(true);
      neu.type = "button";
      neu.dataset.v15 = "1";
      if (btn.parentNode) btn.parentNode.replaceChild(neu, btn);
      neu.addEventListener("click", function (ev) { saveCustomFieldNow(ev); });
    }
    if (form && form.dataset.v15 !== "1") {
      form.dataset.v15 = "1";
      form.addEventListener("submit", saveCustomFieldNow, true);
    }
    var sel = $("cfTargetEntity");
    if (sel && !sel.options.length) {
      sel.innerHTML =
        '<option value="pharmacy">🏥 داروخانه‌ها</option>' +
        '<option value="doctor">👨‍⚕️ پزشکان</option>' +
        '<option value="order">📦 سفارشات</option>' +
        '<option value="products">💊 کالاها</option>';
    }
  }

  /* ---------- انتخاب داروخانه: کادر شناور، فیلد را بزرگ نکن ---------- */
  function shrinkPharmacyField() {
    var inp = $("orderPharmacyName");
    if (!inp) return;
    var g = inp.closest(".form-group");
    if (g && g.classList.contains("full-width")) {
      var userPlace = null;
      try {
        userPlace = (((state.formFieldMeta || {}).order || {}).orderPharmacyName || {}).place;
      } catch (e) {}
      if (!userPlace || userPlace === "beside") {
        g.classList.remove("full-width");
        g.classList.remove("col-place-under");
        g.classList.add("col-place-beside");
        g.style.width = "";
        g.style.maxWidth = "";
        g.style.minWidth = "";
        g.style.flex = "";
      }
    }
    var box = $("orderPharmacyPickBox");
    if (box) {
      box.classList.add("ph-pick-overlay");
      if (g) {
        if (getComputedStyle(g).position === "static") g.style.position = "relative";
      }
    }
  }

  /* ---------- طراح دستی: حالت طراحی نه حالت فعال فرم ---------- */
  function selectManItem(el) {
    if (!el) return;
    document.querySelectorAll(".man-item.man-selected").forEach(function (n) {
      n.classList.remove("man-selected");
    });
    el.classList.add("man-selected");
    var lab = el.querySelector(".form-label, label, h4, .card-title, .col-user-box-title");
    var name = (lab && (lab.textContent || "").replace(/\s+/g, " ").trim()) ||
      (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 40) ||
      el.id || "آیتم";
    var w = Math.round(el.getBoundingClientRect().width);
    var h = Math.round(el.getBoundingClientRect().height);
    if ($("manPropName")) $("manPropName").value = name;
    if ($("manPropW")) $("manPropW").value = String(w);
    if ($("manPropH")) $("manPropH").value = String(h);
    window._manSelected = el;
    var box = $("manInspector");
    if (box) box.hidden = false;
  }

  function applyInspector() {
    var el = window._manSelected;
    if (!el) { alert("اول روی یک فیلد یا کلید بزنید."); return; }
    var name = (($("manPropName") || {}).value || "").trim();
    var w = parseInt(($("manPropW") || {}).value, 10);
    var h = parseInt(($("manPropH") || {}).value, 10);
    var lab = el.querySelector(".form-label, label, h4, .card-title span, .card-title, .col-user-box-title");
    if (name && lab && !lab.querySelector("input")) lab.textContent = name;
    if (w > 40) {
      el.style.width = w + "px";
      el.style.maxWidth = w + "px";
      applySizeToInput(el, w);
    }
    if (h > 20) el.style.height = h + "px";
    var tabId = window._activeManualTab;
    var id = el.getAttribute("data-man-id") || el.getAttribute("data-col-fid") || el.getAttribute("data-src-id") || el.id;
    if (tabId && id && window.state) {
      if (!state.manualLayouts) state.manualLayouts = {};
      if (!state.manualLayouts[tabId]) state.manualLayouts[tabId] = { items: {} };
      var prev = state.manualLayouts[tabId].items[id] || {};
      state.manualLayouts[tabId].items[id] = {
        x: prev.x, y: prev.y,
        w: w > 40 ? w : prev.w,
        h: h > 20 ? h : prev.h,
        abs: !!prev.abs,
        scope: prev.scope || "form",
        scopeId: prev.scopeId || "",
        cardId: prev.cardId || ((el.closest(".card") || {}).id || "")
      };
      var keyMap = { "tab-pharmacies": "pharmacy", "tab-doctors": "doctor", "tab-orders": "order" };
      var key = keyMap[tabId] || String(tabId || "").replace(/^tab-/, "");
      if (name) {
        if (!state.formFieldMeta) state.formFieldMeta = {};
        if (!state.formFieldMeta[key]) state.formFieldMeta[key] = {};
        var fid = el.getAttribute("data-col-fid") || el.getAttribute("data-src-id") || "";
        if (fid) {
          if (!state.formFieldMeta[key][fid]) state.formFieldMeta[key][fid] = {};
          state.formFieldMeta[key][fid].label = name;
          if (w > 40) state.formFieldMeta[key][fid].size = w;
        }
      }
      if (typeof saveState === "function") saveState(false);
    }
    alert("اندازه و نام همین مورد ذخیره شد. فرم لیست دست نخورد.");
  }

  function bindDesignerClicks() {
    var canvas = $("manualDesignCanvas");
    if (!canvas) return;
    canvas.classList.add("man-design-mode");
    if (canvas.dataset.v15insp === "1") return;
    canvas.dataset.v15insp = "1";
    canvas.addEventListener("click", function (e) {
      var item = e.target.closest(".man-item");
      if (!item) return;
      e.preventDefault();
      e.stopPropagation();
      selectManItem(item);
    }, true);
    canvas.addEventListener("submit", function (e) {
      e.preventDefault();
      e.stopPropagation();
    }, true);
  }

  function ensureInspectorBar() {
    if ($("manInspector")) return;
    var toolbar = document.querySelector("#tab-manual-design .man-toolbar");
    if (!toolbar) return;
    var box = document.createElement("div");
    box.id = "manInspector";
    box.className = "man-inspector";
    box.innerHTML =
      "<strong>ویرایش مورد انتخاب‌شده</strong>" +
      '<p class="col-help">روی فیلد یا کلید بزنید. اینجا اسم و اندازه عوض می‌شود. فیلدها در این تب «فعال» نیستند.</p>' +
      '<div class="man-toolbar-row">' +
      '<label>اسم</label><input id="manPropName" class="form-input" style="max-width:240px">' +
      '<label>عرض</label><input id="manPropW" class="form-input" type="number" min="80" style="max-width:90px">' +
      '<label>ارتفاع</label><input id="manPropH" class="form-input" type="number" min="28" style="max-width:90px">' +
      '<button type="button" id="btnManApplyProp" class="btn btn-primary btn-sm" style="background:#0d9488">اعمال روی همین مورد</button>' +
      "</div>";
    toolbar.appendChild(box);
    var btn = $("btnManApplyProp");
    if (btn) btn.addEventListener("click", applyInspector);
  }

  /* ---------- ذخیره سفارش: اگر متغیرها جا افتاده باشند ---------- */
  function guardOrderSaveVars() {
    /* خود handleSaveOrd در crm-app پچ می‌شود؛ اینجا فقط اطمینان از وجود فیلدها */
    if (!$("orderTotalAmountDisplay")) {
      var host = document.querySelector("#formOrder .order-item-head");
      if (host && host.parentNode) {
        var row = document.createElement("div");
        row.style.cssText = "display:flex;justify-content:flex-end;margin-top:.75rem;font-weight:700;color:#0f172a";
        row.innerHTML = 'مبلغ کل سفارش: <strong id="orderTotalAmountDisplay">0</strong> ریال';
        host.parentNode.appendChild(row);
      }
    }
  }

  function boot() {
    try { backupUserStateOnce(); } catch (e) {}
    try { softenBrokenAbsLayouts(); } catch (e) {}
    try { restoreProtectedCards(); } catch (e) {}
    try { wrapPaintFieldBox(); } catch (e) {}
    try { hookDesignerSizeDisplay(); } catch (e) {}
    try { bindAddFieldHard(); } catch (e) {}
    try { shrinkPharmacyField(); } catch (e) {}
    try { guardOrderSaveVars(); } catch (e) {}
    try { ensureInspectorBar(); } catch (e) {}
    try { bindDesignerClicks(); } catch (e) {}
    setTimeout(function () {
      try { shrinkPharmacyField(); } catch (e) {}
      try { restoreProtectedCards(); } catch (e) {}
    }, 200);

    var origSw = window.switchTab;
    if (typeof origSw === "function" && !window._v15Sw) {
      window._v15Sw = true;
      window.switchTab = function (id) {
        origSw(id);
        setTimeout(function () {
          try { restoreProtectedCards(); } catch (e) {}
          try { bindAddFieldHard(); } catch (e) {}
          if (id === "tab-orders") shrinkPharmacyField();
          if (id === "tab-manual-design") {
            ensureInspectorBar();
            bindDesignerClicks();
          }
          if (id === "tab-custom-fields") bindAddFieldHard();
          if (id === "tab-columns-products") {
            hookDesignerSizeDisplay();
          }
          try { paintSavedSizes(id); } catch (e) {}
        }, 180);
      };
    }
    console.log("v15 ready", VER);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
