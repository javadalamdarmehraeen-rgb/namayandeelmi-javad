// v14 — تب افزودن‌ها مثل ستون‌ها، گزینه کشویی با ویرایش/حذف، انتخاب داروخانه هم‌نام، فیلد کالا، ویرایش تب
(function () {
  "use strict";

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
      "tab-install-app": "install", "tab-troubleshooting": "diagnostics"
    };
    return map[tabId] || String(tabId || "").replace(/^tab-/, "") || "misc";
  }

  function allSections() {
    return (typeof window.getAllMenuSections === "function")
      ? window.getAllMenuSections()
      : [];
  }

  function collectCustom(entity, containerId) {
    if (typeof extractCustomFieldValuesFromForm === "function") {
      try { return extractCustomFieldValuesFromForm(entity, containerId) || {}; } catch (e) {}
    }
    return {};
  }

  function patchRecordSaves() {
    if (window._v14SavePatch) return;
    window._v14SavePatch = true;
    if (typeof setupAllFormSubmitHandlers === "function") {
      var orig = setupAllFormSubmitHandlers;
      window.setupAllFormSubmitHandlers = function () {
        orig();
        wrapPhSave();
        wrapDocSave();
        wrapOrdSave();
      };
    }
    wrapPhSave();
    wrapDocSave();
    wrapOrdSave();
    wrapProdSave();
  }

  function wrapPhSave() {
    var form = $("formPharmacy");
    var btn = $("btnSavePharmacy");
    if (!form || form.dataset.v14cf === "1") return;
    form.dataset.v14cf = "1";
    function attach(el, prop) {
      if (!el || !el[prop]) return;
      var prev = el[prop];
      el[prop] = function (e) {
        if (e && e.preventDefault) e.preventDefault();
        var vals = collectCustom("pharmacy", "pharmacyCustomFieldsContainer");
        var editId = ($("pharmacyEditId") || {}).value;
        var nameNow = (($("pharmacyName") || {}).value || "").trim();
        var r = prev.call(this, e);
        try {
          var rec = editId
            ? (state.pharmacies || []).filter(function (p) { return p.id === editId; })[0]
            : (state.pharmacies || []).filter(function (p) { return p.name === nameNow; }).slice(-1)[0]
              || (state.pharmacies || [])[state.pharmacies.length - 1];
          if (rec) {
            rec.customFields = Object.assign({}, rec.customFields || {}, vals);
            if (typeof saveState === "function") saveState(false);
          }
        } catch (err) { console.error("v14 ph cf", err); }
        return r;
      };
    }
    attach(form, "onsubmit");
    attach(btn, "onclick");
  }

  function wrapDocSave() {
    var form = $("formDoctor");
    var btn = $("btnSaveDoctor");
    if (!form || form.dataset.v14cf === "1") return;
    form.dataset.v14cf = "1";
    function attach(el, prop) {
      if (!el || !el[prop]) return;
      var prev = el[prop];
      el[prop] = function (e) {
        if (e && e.preventDefault) e.preventDefault();
        var vals = collectCustom("doctor", "doctorCustomFieldsContainer");
        var editId = ($("doctorEditId") || {}).value;
        var nameNow = (($("doctorName") || {}).value || "").trim();
        var r = prev.call(this, e);
        try {
          var rec = editId
            ? (state.doctors || []).filter(function (d) { return d.id === editId; })[0]
            : (state.doctors || []).filter(function (d) { return d.name === nameNow; }).slice(-1)[0]
              || (state.doctors || [])[state.doctors.length - 1];
          if (rec) {
            rec.customFields = Object.assign({}, rec.customFields || {}, vals);
            if (typeof saveState === "function") saveState(false);
          }
        } catch (err) { console.error("v14 doc cf", err); }
        return r;
      };
    }
    attach(form, "onsubmit");
    attach(btn, "onclick");
  }

  function wrapOrdSave() {
    var form = $("formOrder");
    var btn = $("btnSaveOrder");
    if (!form || form.dataset.v14cf === "1") return;
    form.dataset.v14cf = "1";
    function attach(el, prop) {
      if (!el || !el[prop]) return;
      var prev = el[prop];
      el[prop] = function (e) {
        if (e && e.preventDefault) e.preventDefault();
        var vals = collectCustom("order", "orderCustomFieldsContainer");
        var editId = ($("orderEditId") || {}).value;
        var phId = ($("orderPharmacyMatchedId") || {}).value || "";
        var r = prev.call(this, e);
        try {
          var rec = editId
            ? (state.orders || []).filter(function (o) { return o.id === editId; })[0]
            : (state.orders || [])[state.orders.length - 1];
          if (rec) {
            rec.customFields = Object.assign({}, rec.customFields || {}, vals);
            rec.pharmacyId = phId || rec.pharmacyId || "";
            if (typeof saveState === "function") saveState(false);
          }
        } catch (err) { console.error("v14 ord cf", err); }
        return r;
      };
    }
    attach(form, "onsubmit");
    attach(btn, "onclick");
  }

  function wrapProdSave() {
    var form = $("formProduct");
    if (!form || form.dataset.v14cf === "1") return;
    form.dataset.v14cf = "1";
    var prev = form.onsubmit;
    form.onsubmit = function (e) {
      if (e && e.preventDefault) e.preventDefault();
      var r = prev ? prev.call(this, e) : undefined;
      try {
        var vals = collectCustom("products", "productCustomFieldsContainer");
        var rec = (state.products || []).filter(function (p) {
          return p.id === window._lastSavedProductId || p.name === window._lastSavedProductName;
        })[0] || (state.products || [])[state.products.length - 1];
        if (rec) {
          rec.customFields = Object.assign({}, rec.customFields || {}, vals);
          if (typeof saveState === "function") saveState(false);
        }
      } catch (err) {}
      return r;
    };
    var btn = $("btnSaveProduct");
    if (btn) btn.onclick = function (e) { e.preventDefault(); form.onsubmit(e); };
  }

  /* ---------- افزودن‌ها: گرید تب + کشویی‌ها با زیرمجموعه ---------- */
  function fillCfTargets() {
    var sel = $("cfTargetEntity");
    if (!sel) return;
    var secs = allSections();
    if (!secs.length) return;
    var keep = sel.value || (sel.options[0] && sel.options[0].value) || "pharmacy";
    sel.innerHTML = "";
    secs.forEach(function (sec) {
      if (sec.id === "tab-custom-fields" || sec.id === "tab-manual-design") return;
      var o = document.createElement("option");
      o.value = fieldKeyForTab(sec.id);
      o.setAttribute("data-tab", sec.id);
      o.textContent = (sec.icon || "") + " " + sec.label;
      sel.appendChild(o);
    });
    if (keep) sel.value = keep;
    if (!sel.value && sel.options.length) sel.selectedIndex = 0;
    sel.dataset.v14 = "1";
  }

  function hardenCustomFieldForm() {
    var form = $("formCustomField");
    var btn = $("btnSaveCustomField");
    if (!form || form.dataset.v14save === "1") return;
    form.dataset.v14save = "1";
    function saveCf(e) {
      if (e) e.preventDefault();
      var targetSel = $("cfTargetEntity");
      var target = targetSel ? targetSel.value : "pharmacy";
      var tabId = targetSel && targetSel.selectedOptions[0]
        ? (targetSel.selectedOptions[0].getAttribute("data-tab") || "")
        : "";
      var label = (($("cfLabel") || {}).value || "").trim();
      var type = (($("cfType") || {}).value || "simple");
      var optionsStr = (($("cfOptions") || {}).value || "").trim();
      var allowAdd = $("cfAllowAddOption") ? $("cfAllowAddOption").checked : true;
      var showInForm = $("cfShowInForm") ? $("cfShowInForm").checked : true;
      var showInList = $("cfShowInList") ? $("cfShowInList").checked : true;
      if (!label) { alert("عنوان فیلد را بنویسید."); return; }
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
        order: state.customFields[target].length + 1
      };
      state.customFields[target].push(neu);
      if (typeof saveState === "function") saveState();
      if ($("cfLabel")) $("cfLabel").value = "";
      if ($("cfOptions")) $("cfOptions").value = "";
      if (typeof renderCustomFieldsTable === "function") renderCustomFieldsTable();
      if (typeof renderAllCustomFieldsInFormsAndTables === "function") renderAllCustomFieldsInFormsAndTables();
      if (tabId && typeof window.applyFullFormLayout === "function") window.applyFullFormLayout(tabId);
      renderAddTabGrid();
      renderAddTabPanel();
      var st = $("cfSaveStatus");
      if (st) st.textContent = "فیلد «" + label + "» ذخیره شد و روی فرم تب نشست.";
      alert("فیلد «" + label + "» ذخیره شد.");
    }
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      ev.stopImmediatePropagation();
      saveCf(ev);
    }, true);
    if (btn) {
      btn.type = "button";
      btn.addEventListener("click", function (ev) {
        ev.preventDefault();
        saveCf(ev);
      });
    }
  }

  function renderAddTabGrid() {
    var grid = $("addTabGrid");
    if (!grid) return;
    var html = "";
    allSections().forEach(function (sec) {
      if (sec.id === "tab-custom-fields" || sec.id === "tab-manual-design") return;
      var n = selectsOfTab(sec.id).length;
      var on = window._activeAddTab === sec.id ? " active" : "";
      html += '<button type="button" class="nav-item col-designer-tab col-tab-card' + on + '" data-add-tab="' + esc(sec.id) + '">' +
        "<span>" + (sec.icon || "📋") + " " + esc(sec.label) + "</span>" +
        '<span class="nav-badge">' + n + "</span></button>";
    });
    grid.innerHTML = html;
    Array.prototype.forEach.call(grid.querySelectorAll("[data-add-tab]"), function (btn) {
      btn.addEventListener("click", function () {
        window._activeAddTab = btn.getAttribute("data-add-tab");
        renderAddTabGrid();
        renderAddTabPanel();
      });
    });
  }

  function selectsOfTab(tabId) {
    var pane = $(tabId);
    var out = [];
    var seen = {};
    function push(item) {
      if (!item || !item.id || seen[item.id]) return;
      seen[item.id] = true;
      out.push(item);
    }
    if (pane) {
      Array.prototype.forEach.call(pane.querySelectorAll("select.form-select, select[id]"), function (sel) {
        if (!sel.id) return;
        if (sel.id.indexOf("jalali") === 0) return;
        if (sel.closest("#jalaliCalendarPopup") || sel.closest(".modal-overlay")) return;
        var label = "";
        var lab = pane.querySelector('label[for="' + sel.id + '"]');
        if (lab) label = lab.textContent.replace(/\s+/g, " ").trim();
        if (!label) {
          var g = sel.closest(".form-group");
          var l2 = g && g.querySelector(".form-label, label");
          if (l2) label = l2.textContent.replace(/\s+/g, " ").trim();
        }
        var opts = [];
        Array.prototype.forEach.call(sel.options, function (o) {
          if (o.value) opts.push({ value: o.value, text: o.textContent || o.value, extra: false });
        });
        ((state.selectExtraOptions || {})[sel.id] || []).forEach(function (v) {
          if (!opts.filter(function (x) { return x.value === v; }).length) {
            opts.push({ value: v, text: v, extra: true });
          }
        });
        push({ id: sel.id, label: label || sel.id, builtin: true, options: opts, tabId: tabId });
      });
    }
    var key = fieldKeyForTab(tabId);
    ((state.customFields || {})[key] || []).forEach(function (f) {
      if ((f.inputKind || f.type) !== "select") return;
      var opts = (f.options || []).map(function (v) { return { value: v, text: v, extra: false }; });
      push({ id: f.id, label: f.label, builtin: false, custom: true, options: opts, tabId: tabId, field: f });
    });
    return out;
  }

  function renderAddTabPanel() {
    var panel = $("addTabPanel");
    if (!panel) return;
    var tabId = window._activeAddTab;
    if (!tabId) {
      panel.innerHTML = "<p class='col-help'>یک تب را از بالا انتخاب کنید تا همه کشویی‌های همان تب با گزینه‌هایش دیده شود.</p>";
      return;
    }
    var sec = allSections().filter(function (s) { return s.id === tabId; })[0] || { label: tabId, icon: "📋" };
    var list = selectsOfTab(tabId);
    var html = "<div class='add-panel-head'><strong>" + esc((sec.icon || "") + " " + sec.label) +
      "</strong><span class='col-help'>هر کشویی و زیرمجموعه‌اش. روبه‌روی هر مورد ویرایش و حذف است.</span></div>";
    if (!list.length) {
      html += "<p class='col-help'>در این تب کشویی‌ای پیدا نشد.</p>";
      panel.innerHTML = html;
      return;
    }
    var geoIds = /Province|City|District/;
    list.forEach(function (f) {
      if (geoIds.test(f.id || "")) {
        html += "<div class='add-sel-card add-sel-geo' data-sid='" + esc(f.id) + "'>";
        html += "<div class='add-sel-head'><strong>" + esc(f.label) + "</strong>";
        html += "<span class='col-help'>از کادر استان←شهر←منطقه بالای همین صفحه استفاده کنید</span></div></div>";
        return;
      }
      html += "<div class='add-sel-card' data-sid='" + esc(f.id) + "'>";
      html += "<div class='add-sel-head'><strong>" + esc(f.label) + "</strong>";
      html += "<span class='col-help'>" + (f.custom ? "فیلد اضافه‌شده" : "کشویی فرم") + "</span>";
      if (f.custom) {
        html += "<button type='button' class='btn btn-outline btn-sm add-edit-field' data-sid='" + esc(f.id) + "'>✏️ ویرایش</button>";
        html += "<button type='button' class='btn btn-danger btn-sm add-del-field' data-sid='" + esc(f.id) + "'>🗑️ حذف</button>";
      }
      html += "</div><ul class='add-opt-list add-opt-tight'>";
      (f.options || []).forEach(function (op, i) {
        html += "<li><span class='add-opt-name'>" + esc(op.text) + "</span><span class='add-opt-ops'>" +
          "<button type='button' class='btn btn-outline btn-sm add-edit-opt' data-sid='" + esc(f.id) + "' data-idx='" + i + "' data-val='" + esc(op.value) + "'>✏️</button>" +
          "<button type='button' class='btn btn-danger btn-sm add-del-opt' data-sid='" + esc(f.id) + "' data-idx='" + i + "' data-val='" + esc(op.value) + "'>🗑️</button>" +
          "</span></li>";
      });
      html += "</ul><button type='button' class='btn btn-outline btn-sm add-new-opt' data-sid='" + esc(f.id) + "'>➕ گزینه جدید</button></div>";
    });
    panel.innerHTML = html;

    Array.prototype.forEach.call(panel.querySelectorAll(".add-new-opt"), function (btn) {
      btn.addEventListener("click", function () { addOptionToField(tabId, btn.getAttribute("data-sid")); });
    });
    Array.prototype.forEach.call(panel.querySelectorAll(".add-edit-opt"), function (btn) {
      btn.addEventListener("click", function () {
        editOptionOfField(tabId, btn.getAttribute("data-sid"), btn.getAttribute("data-val"));
      });
    });
    Array.prototype.forEach.call(panel.querySelectorAll(".add-del-opt"), function (btn) {
      btn.addEventListener("click", function () {
        deleteOptionOfField(tabId, btn.getAttribute("data-sid"), btn.getAttribute("data-val"));
      });
    });
    Array.prototype.forEach.call(panel.querySelectorAll(".add-edit-field"), function (btn) {
      btn.addEventListener("click", function () { editCustomSelectField(tabId, btn.getAttribute("data-sid")); });
    });
    Array.prototype.forEach.call(panel.querySelectorAll(".add-del-field"), function (btn) {
      btn.addEventListener("click", function () { deleteCustomSelectField(tabId, btn.getAttribute("data-sid")); });
    });
  }

  function findCustomField(tabId, fieldId) {
    var key = fieldKeyForTab(tabId);
    return ((state.customFields || {})[key] || []).filter(function (f) { return f.id === fieldId; })[0] || null;
  }

  function addOptionToField(tabId, fieldId) {
    var val = prompt("گزینه جدید:");
    if (!val || !String(val).trim()) return;
    val = String(val).trim();
    var cf = findCustomField(tabId, fieldId);
    if (cf) {
      if (!cf.options) cf.options = [];
      if (cf.options.indexOf(val) === -1) cf.options.push(val);
    } else {
      if (!state.selectExtraOptions) state.selectExtraOptions = {};
      if (!state.selectExtraOptions[fieldId]) state.selectExtraOptions[fieldId] = [];
      if (state.selectExtraOptions[fieldId].indexOf(val) === -1) state.selectExtraOptions[fieldId].push(val);
      var sel = document.getElementById(fieldId);
      if (sel) {
        var o = document.createElement("option");
        o.value = val;
        o.textContent = val;
        sel.appendChild(o);
      }
    }
    if (typeof saveState === "function") saveState();
    if (typeof window.applySelectExtraOptions === "function") window.applySelectExtraOptions();
    renderAddTabPanel();
    renderAddTabGrid();
  }

  function editOptionOfField(tabId, fieldId, oldVal) {
    var nw = prompt("ویرایش گزینه:", oldVal || "");
    if (nw == null) return;
    nw = String(nw).trim();
    if (!nw) { alert("خالی نباشد."); return; }
    var cf = findCustomField(tabId, fieldId);
    if (cf && cf.options) {
      var i = cf.options.indexOf(oldVal);
      if (i !== -1) cf.options[i] = nw;
    }
    if (state.selectExtraOptions && state.selectExtraOptions[fieldId]) {
      var j = state.selectExtraOptions[fieldId].indexOf(oldVal);
      if (j !== -1) state.selectExtraOptions[fieldId][j] = nw;
    }
    var sel = document.getElementById(fieldId);
    if (sel) {
      Array.prototype.forEach.call(sel.options, function (o) {
        if (o.value === oldVal) { o.value = nw; o.textContent = nw; }
      });
    }
    if (typeof saveState === "function") saveState();
    renderAddTabPanel();
  }

  function deleteOptionOfField(tabId, fieldId, oldVal) {
    if (!confirm("گزینه «" + oldVal + "» حذف شود؟")) return;
    var cf = findCustomField(tabId, fieldId);
    if (cf && cf.options) cf.options = cf.options.filter(function (v) { return v !== oldVal; });
    if (state.selectExtraOptions && state.selectExtraOptions[fieldId]) {
      state.selectExtraOptions[fieldId] = state.selectExtraOptions[fieldId].filter(function (v) { return v !== oldVal; });
    }
    if (!state.selectHiddenOptions) state.selectHiddenOptions = {};
    if (!state.selectHiddenOptions[fieldId]) state.selectHiddenOptions[fieldId] = [];
    if (state.selectHiddenOptions[fieldId].indexOf(oldVal) === -1) state.selectHiddenOptions[fieldId].push(oldVal);
    var sel = document.getElementById(fieldId);
    if (sel) {
      Array.prototype.slice.call(sel.options).forEach(function (o) {
        if (o.value === oldVal) o.parentNode.removeChild(o);
      });
    }
    if (typeof saveState === "function") saveState();
    renderAddTabPanel();
  }

  function editCustomSelectField(tabId, fieldId) {
    var cf = findCustomField(tabId, fieldId);
    if (!cf) return;
    var name = prompt("عنوان فیلد:", cf.label || "");
    if (name == null) return;
    name = String(name).trim();
    if (!name) return;
    cf.label = name;
    if (typeof saveState === "function") saveState();
    if (typeof renderCustomFieldsTable === "function") renderCustomFieldsTable();
    if (typeof window.applyFullFormLayout === "function") window.applyFullFormLayout(tabId);
    renderAddTabPanel();
  }

  function deleteCustomSelectField(tabId, fieldId) {
    var cf = findCustomField(tabId, fieldId);
    if (!cf) return;
    if (!confirm("فیلد «" + cf.label + "» حذف شود؟")) return;
    var key = fieldKeyForTab(tabId);
    state.customFields[key] = (state.customFields[key] || []).filter(function (f) { return f.id !== fieldId; });
    document.querySelectorAll('[data-custom-field-id="' + fieldId + '"]').forEach(function (inp) {
      var g = inp.closest(".form-group");
      if (g) g.remove();
      else inp.remove();
    });
    if (typeof saveState === "function") saveState();
    if (typeof renderCustomFieldsTable === "function") renderCustomFieldsTable();
    renderAddTabPanel();
    renderAddTabGrid();
  }

  /* ---------- داروخانه هم‌نام در سفارش ---------- */
  function fillPharmacyFromRec(rec) {
    if (!rec) return;
    if ($("orderPharmacyName")) $("orderPharmacyName").value = rec.name || "";
    if ($("orderPharmacyMatchedId")) $("orderPharmacyMatchedId").value = rec.id || "";
    var provEl = $("orderProvince");
    var cityEl = $("orderCity");
    var distEl = $("orderDistrict");
    var addrEl = $("orderAddress");
    if (provEl) {
      provEl.value = rec.province || "";
      if (typeof populateCities === "function" && cityEl) populateCities(rec.province, cityEl, rec.city);
      if (typeof populateDistricts === "function" && distEl) populateDistricts(rec.province, rec.city, distEl, rec.district);
    }
    if (addrEl) addrEl.value = rec.address || "";
    var box = $("existingPharmacyTopAlert");
    var txt = $("existingPharmacyAlertText");
    if (box && txt) {
      txt.textContent = "انتخاب شد: «" + rec.name + "» | " + [rec.province, rec.city, rec.district].filter(Boolean).join(" / ") + " | " + (rec.address || "") + (rec.phone ? " | " + rec.phone : "");
      box.style.display = "flex";
    }
  }

  function renderPharmacyPicks(q) {
    var host = $("orderPharmacyPickBox");
    if (!host) return;
    q = String(q || "").trim();
    if (q.length < 1) {
      host.hidden = true;
      host.innerHTML = "";
      return;
    }
    var ql = q.toLowerCase();
    var hits = (state.pharmacies || []).filter(function (p) {
      var blob = [p.name, p.province, p.city, p.district, p.address, p.phone, p.manager].join(" ").toLowerCase();
      return blob.indexOf(ql) !== -1 || (p.name && p.name.indexOf(q) !== -1);
    });
    if (!hits.length) {
      host.hidden = false;
      host.innerHTML = "<div class='ph-pick-empty'>داروخانه ثبت‌شده‌ای با این مشخصات نیست. می‌توانید همین نام را تایپ کنید.</div>";
      return;
    }
    host.hidden = false;
    host.innerHTML = "<div class='ph-pick-hint'>" + hits.length + " داروخانه پیدا شد — یکی را انتخاب کنید (ممکن است چند داروخانه هم‌نام در شهرهای مختلف باشد)</div>" +
      hits.slice(0, 30).map(function (p) {
        return "<button type='button' class='ph-pick-card' data-pid='" + esc(p.id) + "'>" +
          "<strong>🏥 " + esc(p.name || "") + "</strong>" +
          "<span>" + esc([p.province, p.city, p.district].filter(Boolean).join(" / ")) + "</span>" +
          "<span>" + esc(p.address || "بدون آدرس") + "</span>" +
          "<span>" + esc((p.phone || "") + (p.manager ? " — مسئول: " + p.manager : "")) + "</span>" +
          "</button>";
      }).join("");
    Array.prototype.forEach.call(host.querySelectorAll(".ph-pick-card"), function (btn) {
      btn.addEventListener("click", function () {
        var rec = (state.pharmacies || []).filter(function (p) { return p.id === btn.getAttribute("data-pid"); })[0];
        fillPharmacyFromRec(rec);
        host.hidden = true;
      });
    });
  }

  function setupPharmacyPicker() {
    var inp = $("orderPharmacyName");
    if (!inp || inp.dataset.v14pick === "1") return;
    inp.dataset.v14pick = "1";
    inp.removeAttribute("list");
    inp.setAttribute("autocomplete", "off");
    var host = $("orderPharmacyPickBox");
    if (!host) {
      host = document.createElement("div");
      host.id = "orderPharmacyPickBox";
      host.className = "ph-pick-box";
      host.hidden = true;
      var g = inp.closest(".form-group") || inp.parentNode;
      if (g) g.appendChild(host);
    }
    inp.addEventListener("input", function () { renderPharmacyPicks(inp.value); });
    inp.addEventListener("focus", function () { if ((inp.value || "").trim()) renderPharmacyPicks(inp.value); });
    document.addEventListener("click", function (e) {
      if (!host || host.hidden) return;
      if (host.contains(e.target) || e.target === inp) return;
      host.hidden = true;
    });
  }

  /* ---------- کالا: افزودن فیلد + ویرایش ---------- */
  function setupProductExtras() {
    var form = $("formProduct");
    if (!form || form.dataset.v14prod === "1") return;
    form.dataset.v14prod = "1";
    var grid = form.querySelector(".form-grid");
    if (grid && !$("productCustomFieldsContainer")) {
      var host = document.createElement("div");
      host.id = "productCustomFieldsContainer";
      host.className = "form-group full-width form-grid extra-cf-host";
      host.setAttribute("data-cf-host", "products");
      grid.appendChild(host);
    }
    if (!$("prodFieldBar")) {
      var bar = document.createElement("div");
      bar.id = "prodFieldBar";
      bar.className = "prod-field-bar";
      bar.innerHTML =
        "<strong>افزودن فیلد به فرم کالا</strong>" +
        '<input id="prodNewFieldLabel" class="form-input" placeholder="عنوان فیلد، مثلاً شکل دارویی">' +
        '<select id="prodNewFieldType" class="form-select"><option value="simple">ساده</option><option value="select">کشویی</option><option value="date">تاریخ</option><option value="number">عددی</option></select>' +
        '<input id="prodNewFieldOpts" class="form-input" placeholder="گزینه‌های کشویی با ویرگول" style="display:none">' +
        '<button type="button" id="btnAddProductField" class="btn btn-primary btn-sm" style="background:#0d9488">➕ افزودن فیلد</button>';
      form.insertBefore(bar, form.querySelector(".form-grid"));
      var typeSel = $("prodNewFieldType");
      if (typeSel) typeSel.addEventListener("change", function () {
        if ($("prodNewFieldOpts")) $("prodNewFieldOpts").style.display = typeSel.value === "select" ? "" : "none";
      });
      var add = $("btnAddProductField");
      if (add) add.addEventListener("click", function () {
        var label = (($("prodNewFieldLabel") || {}).value || "").trim();
        if (!label) { alert("عنوان فیلد کالا را بنویسید."); return; }
        var type = (($("prodNewFieldType") || {}).value || "simple");
        var opts = (($("prodNewFieldOpts") || {}).value || "").split(/[،,]/).map(function (s) { return s.trim(); }).filter(Boolean);
        if (!state.customFields) state.customFields = {};
        if (!state.customFields.products) state.customFields.products = [];
        state.customFields.products.push({
          id: "cf-products-" + Date.now(),
          label: label,
          type: type === "select" ? "select" : "simple",
          inputKind: type,
          options: opts,
          showInForm: true,
          showInList: true,
          order: state.customFields.products.length + 1
        });
        if (typeof saveState === "function") saveState();
        if ($("prodNewFieldLabel")) $("prodNewFieldLabel").value = "";
        if (typeof renderCustomFieldsInForm === "function") renderCustomFieldsInForm("products", "productCustomFieldsContainer");
        alert("فیلد «" + label + "» به فرم کالا اضافه و ذخیره شد.");
      });
    }
    var actions = form.querySelector("div[style*='justify-content: flex-end']");
    if (actions && !$("btnEditProductForm")) {
      var ed = document.createElement("button");
      ed.type = "button";
      ed.id = "btnEditProductForm";
      ed.className = "btn btn-outline";
      ed.textContent = "✏️ ویرایش کالای جدول";
      ed.addEventListener("click", function () {
        var recs = state.products || [];
        if (!recs.length) { alert("هنوز کالایی نیست."); return; }
        var names = recs.map(function (p, i) { return (i + 1) + ". " + p.name; }).join("\n");
        var n = prompt("شماره ردیف کالا برای ویرایش:\n" + names, "1");
        var idx = parseInt(n, 10) - 1;
        if (recs[idx] && typeof editProductCatalogItem === "function") {
          editProductCatalogItem(recs[idx].id);
          var cf = recs[idx].customFields || {};
          if (typeof renderCustomFieldsInForm === "function") {
            renderCustomFieldsInForm("products", "productCustomFieldsContainer", cf);
          }
        }
      });
      actions.insertBefore(ed, actions.firstChild);
    }
    if (typeof renderCustomFieldsInForm === "function" && $("productCustomFieldsContainer")) {
      renderCustomFieldsInForm("products", "productCustomFieldsContainer");
    }
  }

  /* ---------- ویرایش تب کنار حذف ---------- */
  window.editUserTab = function (tabId) {
    var tab = ((state.userTabs || []).filter(function (t) { return t.id === tabId; })[0]);
    if (!tab) {
      alert("ویرایش نام فقط برای تب‌هایی است که خود مدیر ساخته است.");
      return;
    }
    var name = prompt("نام جدید تب:", tab.label || "");
    if (name == null) return;
    name = String(name).trim();
    if (!name) { alert("نام خالی است."); return; }
    tab.label = name;
    if (typeof window.iconFromTabLabel === "function") tab.icon = window.iconFromTabLabel(name);
    var ord = prompt("شماره تب در منوی اصلی:", String((state.tabOrder || {})[tab.id] || 1));
    if (ord != null && parseInt(ord, 10) > 0) {
      if (!state.tabOrder) state.tabOrder = {};
      state.tabOrder[tab.id] = parseInt(ord, 10);
    }
    if (typeof saveState === "function") saveState();
    var pane = $(tab.id);
    if (pane) {
      var title = pane.querySelector(".card-title span");
      if (title) title.textContent = (tab.icon || "📋") + " " + tab.label;
    }
    if (typeof setupNavigationMenu === "function") setupNavigationMenu();
    if (typeof window.refreshColumnsDesigner === "function") window.refreshColumnsDesigner();
    alert("تب به «" + name + "» ویرایش شد.");
  };

  function ensureEditTabButton() {
    var del = $("btnDeleteUserTab");
    if (!del || $("btnEditUserTab")) return;
    var ed = document.createElement("button");
    ed.type = "button";
    ed.id = "btnEditUserTab";
    ed.className = "btn btn-outline btn-sm";
    ed.textContent = "✏️ ویرایش این تب";
    ed.addEventListener("click", function () { window.editUserTab(window._activeColTab); });
    if (del.parentNode) del.parentNode.insertBefore(ed, del);
  }

  /* ---------- کپی از/به: منوی سفارشی بالای بوم ---------- */
  function upgradeCopySelects() {
    var from = $("manCopyFrom");
    var to = $("manCopyTo");
    if (!from || !to) return;
    from.classList.add("man-copy-select");
    to.classList.add("man-copy-select");
    var row = from.closest(".man-toolbar-row");
    if (row) {
      row.classList.add("man-copy-row");
      if (row.parentNode && row.parentNode.classList) row.parentNode.classList.add("man-toolbar-raised");
    }
  }

  function boot() {
    try { patchRecordSaves(); } catch (e) { console.error("v14 save", e); }
    try { fillCfTargets(); } catch (e) {}
    try { hardenCustomFieldForm(); } catch (e) {}
    try { renderAddTabGrid(); } catch (e) {}
    try { renderAddTabPanel(); } catch (e) {}
    try { setupPharmacyPicker(); } catch (e) { console.error("v14 ph pick", e); }
    try { setupProductExtras(); } catch (e) { console.error("v14 prod", e); }
    try { ensureEditTabButton(); } catch (e) {}
    try { upgradeCopySelects(); } catch (e) {}

    var origSw = window.switchTab;
    if (typeof origSw === "function" && !window._v14Sw) {
      window._v14Sw = true;
      window.switchTab = function (id) {
        origSw(id);
        setTimeout(function () {
          if (id === "tab-custom-fields") {
            fillCfTargets();
            hardenCustomFieldForm();
            renderAddTabGrid();
            renderAddTabPanel();
          }
          if (id === "tab-orders") setupPharmacyPicker();
          if (id === "tab-columns-products") {
            setupProductExtras();
            ensureEditTabButton();
          }
          if (id === "tab-manual-design") upgradeCopySelects();
        }, 150);
      };
    }

    document.addEventListener("click", function (e) {
      if (e.target.closest(".col-designer-tab") || e.target.id === "btnDeleteUserTab") {
        setTimeout(ensureEditTabButton, 80);
      }
    });

    console.log("v14 ready");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
