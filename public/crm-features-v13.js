// v13 — یک‌بار شدن امکانات آماده + تب طراحی دستی تب‌ها (درگ، اندازه، کپی چیدمان)
(function () {
  "use strict";

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function ensureState() {
    if (typeof state === "undefined" || !state) return;
    if (!state.manualLayouts) state.manualLayouts = {};
    if (!state.customFields) state.customFields = {};
    if (!state.formBoxes) state.formBoxes = {};
    if (!state.formFieldMeta) state.formFieldMeta = {};
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

  window.dedupeTabWidgets = function (tabId) {
    var pane = $(tabId);
    if (!pane) return 0;
    var seen = {};
    var removed = 0;
    Array.prototype.slice.call(pane.querySelectorAll(".col-widget-wrap[data-col-fid], [data-custom-field-id]")).forEach(function (el) {
      var id = el.getAttribute("data-col-fid") || el.getAttribute("data-custom-field-id");
      if (!id) return;
      var group = el.classList.contains("col-widget-wrap") || el.classList.contains("form-group")
        ? el : el.closest(".col-widget-wrap, .form-group");
      if (!group) return;
      if (seen[id]) {
        if (group.parentNode) group.parentNode.removeChild(group);
        removed += 1;
      } else {
        seen[id] = true;
      }
    });
    return removed;
  };

  function wrapRenderCustomFields() {
    if (typeof window.renderCustomFieldsInForm !== "function" || window._v13RenderWrap) return;
    window._v13RenderWrap = true;
    var orig = window.renderCustomFieldsInForm;
    window.renderCustomFieldsInForm = function (entityType, containerId, currentValues) {
      var container = document.getElementById(containerId);
      var form = container ? (container.closest("form") || container.closest(".tab-pane")) : null;
      var root = form || container;
      if (root) {
        ((state.customFields && state.customFields[entityType]) || []).forEach(function (f) {
          var nodes = root.querySelectorAll('[data-custom-field-id="' + f.id + '"], [data-col-fid="' + f.id + '"]');
          if (nodes.length > 1) {
            Array.prototype.slice.call(nodes).slice(1).forEach(function (n) {
              var g = n.closest(".form-group, .col-widget-wrap");
              if (g && g.parentNode) g.parentNode.removeChild(g);
            });
          }
        });
      }
      return orig(entityType, containerId, currentValues || {});
    };
  }

  function wrapApplyOrderTabId() {
    if (typeof window.applyCustomFieldOrderInForm !== "function" || window._v13OrderId) return;
    window._v13OrderId = true;
    var orig = window.applyCustomFieldOrderInForm;
    window.applyCustomFieldOrderInForm = function (entityType, containerId) {
      if (window._layoutBusy) return;
      try { orig(entityType, containerId); } catch (e) {}
    };
  }

  function wrapApplyLayoutDedupe() {
    if (typeof window.applyFullFormLayout !== "function" || window._v13LayoutWrap) return;
    window._v13LayoutWrap = true;
    var orig = window.applyFullFormLayout;
    window.applyFullFormLayout = function (tabId) {
      try { window.dedupeTabWidgets(tabId); } catch (e) {}
      var out = orig(tabId);
      try { window.dedupeTabWidgets(tabId); } catch (e) {}
      try { applyManualLayout(tabId); } catch (e) {}
      return out;
    };
  }

  function designableSections() {
    var secs = typeof window.getAllMenuSections === "function" ? window.getAllMenuSections() : [];
    return secs.filter(function (s) { return s.id !== "tab-manual-design"; });
  }

  function renderManualGrid() {
    var grid = $("manualTabGrid");
    if (!grid) return;
    var html = "";
    designableSections().forEach(function (sec) {
      var n = 0;
      try {
        if (typeof window.getUnifiedFieldList === "function") n = 0;
        var pane = $(sec.id);
        if (pane) n = pane.querySelectorAll(".form-group, .stat-card, .card, .map-container, .col-user-box").length;
      } catch (e) {}
      var on = window._activeManualTab === sec.id ? " active" : "";
      html += '<button type="button" class="nav-item col-designer-tab col-tab-card' + on + '" data-man-tab="' + esc(sec.id) + '">' +
        "<span>" + (sec.icon || "📋") + " " + esc(sec.label) + "</span>" +
        '<span class="nav-badge">' + n + "</span></button>";
    });
    grid.innerHTML = html;
    Array.prototype.forEach.call(grid.querySelectorAll("[data-man-tab]"), function (btn) {
      btn.addEventListener("click", function () {
        openManualCanvas(btn.getAttribute("data-man-tab"));
      });
    });
  }

  function collectDesignTargets(root) {
    var out = [];
    var skip = { BUTTON: 1 };
    function take(el, kind) {
      if (!el || el.getAttribute("data-man-skip") === "1") return;
      if (el.closest(".data-table") && kind === "btn") return;
      if (el.closest(".col-ops")) return;
      out.push({ el: el, kind: kind });
    }
    Array.prototype.forEach.call(root.querySelectorAll(".stat-card"), function (el) { take(el, "stat"); });
    Array.prototype.forEach.call(root.querySelectorAll(".col-user-box"), function (el) { take(el, "box"); });
    Array.prototype.forEach.call(root.querySelectorAll(".form-group"), function (el) {
      if (el.closest(".col-user-box-body")) return;
      if (el.id && /CustomFieldsContainer|cfHost-/.test(el.id)) return;
      take(el, "field");
    });
    Array.prototype.forEach.call(root.querySelectorAll(".map-container"), function (el) { take(el, "map"); });
    Array.prototype.forEach.call(root.querySelectorAll(".card"), function (el) {
      if (el.parentNode === root || el.parentNode.classList.contains("man-canvas-inner")) take(el, "card");
    });
    Array.prototype.forEach.call(root.querySelectorAll("button.btn, .btn-toggle-option"), function (el) {
      if (el.closest(".form-group")) return;
      if (el.closest("table")) return;
      if (el.closest(".card-header") && el.closest(".man-toolbar")) return;
      take(el, "btn");
    });
    return out;
  }

  function designIdOf(el) {
    return el.getAttribute("data-col-fid") ||
      el.getAttribute("data-custom-field-id") ||
      el.id ||
      el.getAttribute("data-man-id") ||
      "";
  }

  function ensureDesignId(el, idx) {
    var id = designIdOf(el);
    if (!id) {
      id = "man-auto-" + idx;
      el.setAttribute("data-man-id", id);
    }
    el.setAttribute("data-man-id", id);
    return id;
  }

  function layoutOf(tabId) {
    ensureState();
    if (!state.manualLayouts[tabId]) state.manualLayouts[tabId] = { items: {} };
    if (!state.manualLayouts[tabId].items) state.manualLayouts[tabId].items = {};
    return state.manualLayouts[tabId];
  }

  function openManualCanvas(tabId) {
    window._activeManualTab = tabId;
    renderManualGrid();
    var host = $("manualDesignCanvas");
    var src = $(tabId);
    var hint = $("manualDesignHint");
    if (!host || !src) {
      if (host) host.innerHTML = "<p class='col-help'>این تب در صفحه پیدا نشد.</p>";
      return;
    }
    var sec = designableSections().filter(function (s) { return s.id === tabId; })[0] || { label: tabId, icon: "📋" };
    if (hint) hint.innerHTML = "الان صفحهٔ «" + esc(sec.icon + " " + sec.label) + "» را می‌چینید. بکشید، گوشه را برای اندازه بگیرید. ذخیره را بزنید تا روی تب اصلی بنشیند.";

    host.innerHTML = "";
    var stage = document.createElement("div");
    stage.className = "man-stage";
    var inner = document.createElement("div");
    inner.className = "man-canvas-inner";
    inner.id = "manualCanvasInner";
    var clone = src.cloneNode(true);
    clone.id = "man-clone-" + tabId;
    clone.classList.add("man-clone", "tab-pane", "active");
    clone.classList.remove("tab-pane");
    clone.style.display = "block";
    Array.prototype.forEach.call(clone.querySelectorAll("[id]"), function (el) {
      el.setAttribute("data-src-id", el.id);
      el.id = "man-" + el.id;
    });
    Array.prototype.forEach.call(clone.querySelectorAll(".map-container"), function (el) {
      el.innerHTML = '<div class="man-map-ph">🗺️ نقشه (جایگاه — شکل نقشه ایران عوض نمی‌شود)</div>';
    });
    Array.prototype.forEach.call(clone.querySelectorAll("script"), function (el) {
      if (el.parentNode) el.parentNode.removeChild(el);
    });
    inner.appendChild(clone);
    stage.appendChild(inner);
    host.appendChild(stage);

    var targets = collectDesignTargets(clone);
    targets.forEach(function (t, i) {
      enableDesignItem(t.el, tabId, i);
    });
    applySavedToClone(tabId, clone);
    fillCopySelects(tabId);
  }

  function enableDesignItem(el, tabId, idx) {
    var id = ensureDesignId(el, idx);
    el.classList.add("man-item");
    if (!el.querySelector(":scope > .man-handle")) {
      var h = document.createElement("span");
      h.className = "man-handle";
      h.textContent = "⠿";
      h.title = "بکشید";
      el.insertBefore(h, el.firstChild);
    }
    if (!el.querySelector(":scope > .man-resize")) {
      var r = document.createElement("span");
      r.className = "man-resize";
      r.title = "اندازه";
      el.appendChild(r);
    }
    bindDrag(el, tabId, id);
    bindResize(el, tabId, id);
  }

  function bindDrag(el, tabId, id) {
    var handle = el.querySelector(":scope > .man-handle") || el;
    handle.addEventListener("pointerdown", function (ev) {
      if (ev.target.classList && ev.target.classList.contains("man-resize")) return;
      ev.preventDefault();
      ev.stopPropagation();
      var canvas = $("manualCanvasInner");
      if (!canvas) return;
      var cr = canvas.getBoundingClientRect();
      var er = el.getBoundingClientRect();
      if (el.style.position !== "absolute") {
        el.style.position = "absolute";
        el.style.left = (er.left - cr.left + canvas.scrollLeft) + "px";
        el.style.top = (er.top - cr.top + canvas.scrollTop) + "px";
        el.style.width = er.width + "px";
        el.style.margin = "0";
        el.style.zIndex = "5";
      }
      var startX = ev.clientX;
      var startY = ev.clientY;
      var origL = parseFloat(el.style.left) || 0;
      var origT = parseFloat(el.style.top) || 0;
      function move(e2) {
        el.style.left = (origL + (e2.clientX - startX)) + "px";
        el.style.top = (origT + (e2.clientY - startY)) + "px";
      }
      function up() {
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerup", up);
        writeItemBox(tabId, id, el, canvas);
      }
      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", up);
    });
  }

  function bindResize(el, tabId, id) {
    var rz = el.querySelector(":scope > .man-resize");
    if (!rz) return;
    rz.addEventListener("pointerdown", function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      var canvas = $("manualCanvasInner");
      var startX = ev.clientX;
      var startY = ev.clientY;
      var startW = el.offsetWidth;
      var startH = el.offsetHeight;
      if (el.style.position !== "absolute") {
        var cr = canvas.getBoundingClientRect();
        var er = el.getBoundingClientRect();
        el.style.position = "absolute";
        el.style.left = (er.left - cr.left + canvas.scrollLeft) + "px";
        el.style.top = (er.top - cr.top + canvas.scrollTop) + "px";
      }
      function move(e2) {
        var w = Math.max(80, startW - (e2.clientX - startX));
        var h = Math.max(36, startH + (e2.clientY - startY));
        el.style.width = w + "px";
        el.style.height = h + "px";
        el.style.maxWidth = w + "px";
        var map = el.classList.contains("map-container") ? el : el.querySelector(".map-container");
        if (map) map.style.height = Math.max(120, h - 24) + "px";
      }
      function up() {
        document.removeEventListener("pointermove", move);
        document.removeEventListener("pointerup", up);
        writeItemBox(tabId, id, el, canvas);
      }
      document.addEventListener("pointermove", move);
      document.addEventListener("pointerup", up);
    });
  }

  function writeItemBox(tabId, id, el, canvas) {
    var lay = layoutOf(tabId);
    var cr = canvas.getBoundingClientRect();
    var er = el.getBoundingClientRect();
    lay.items[id] = {
      x: Math.round(er.left - cr.left + canvas.scrollLeft),
      y: Math.round(er.top - cr.top + canvas.scrollTop),
      w: Math.round(er.width),
      h: Math.round(er.height),
      abs: true
    };
    if (typeof saveState === "function") saveState(false);
  }

  function applySavedToClone(tabId, clone) {
    var items = layoutOf(tabId).items || {};
    Object.keys(items).forEach(function (id) {
      var box = items[id];
      if (!box || !box.abs) return;
      var el = clone.querySelector('[data-man-id="' + id + '"]') ||
        clone.querySelector('[data-col-fid="' + id + '"]') ||
        clone.querySelector('[data-src-id="' + id + '"]') ||
        clone.querySelector("#man-" + id);
      if (!el) return;
      el.style.position = "absolute";
      el.style.left = box.x + "px";
      el.style.top = box.y + "px";
      if (box.w) { el.style.width = box.w + "px"; el.style.maxWidth = box.w + "px"; }
      if (box.h) el.style.height = box.h + "px";
      el.style.margin = "0";
      el.style.zIndex = "5";
    });
  }

  function applyManualLayout(tabId) {
    if (!tabId || tabId === "tab-manual-design") return;
    ensureState();
    var pane = $(tabId);
    var lay = (state.manualLayouts || {})[tabId];
    if (!pane || !lay || !lay.items) return;
    var parent = pane.querySelector("form") || pane.querySelector(".card") || pane;
    if (getComputedStyle(parent).position === "static") parent.style.position = "relative";
    var maxY = 480;
    Object.keys(lay.items).forEach(function (id) {
      var box = lay.items[id];
      if (!box || !box.abs) return;
      if (box.y + box.h > maxY) maxY = box.y + box.h;
      var el = null;
      try {
        el = pane.querySelector('[data-col-fid="' + id + '"]') ||
          (id && document.getElementById(id) && pane.contains(document.getElementById(id)) ? document.getElementById(id) : null) ||
          pane.querySelector('[data-man-id="' + id + '"]');
      } catch (e) { el = null; }
      if (!el) return;
      el.style.position = "absolute";
      el.style.left = (box.x || 0) + "px";
      el.style.top = (box.y || 0) + "px";
      el.style.margin = "0";
      el.style.zIndex = "4";
      if (box.w) {
        el.style.width = box.w + "px";
        el.style.maxWidth = box.w + "px";
      }
      if (box.h) el.style.height = box.h + "px";
      if (el.classList.contains("map-container") || el.querySelector(".map-container")) {
        var map = el.classList.contains("map-container") ? el : el.querySelector(".map-container");
        if (map && box.h) {
          map.style.height = box.h + "px";
          try {
            var m = null;
            if (tabId === "tab-pharmacies" && typeof mapPharmacyForm !== "undefined") m = mapPharmacyForm;
            if (tabId === "tab-doctors" && typeof mapDoctorForm !== "undefined") m = mapDoctorForm;
            if (m) setTimeout(function () { try { m.invalidateSize(); } catch (e2) {} }, 80);
          } catch (e3) {}
        }
      }
    });
    parent.style.minHeight = (maxY + 40) + "px";
  }

  function cssEscape(id) {
    if (window.CSS && CSS.escape) return CSS.escape(id);
    return String(id).replace(/[^a-zA-Z0-9_\-]/g, "\\$&");
  }

  function fillCopySelects(currentId) {
    var from = $("manCopyFrom");
    var to = $("manCopyTo");
    var secs = designableSections();
    function fill(sel, prefer) {
      if (!sel) return;
      var keep = sel.value;
      sel.innerHTML = secs.map(function (s) {
        return '<option value="' + esc(s.id) + '">' + esc((s.icon || "") + " " + s.label) + "</option>";
      }).join("");
      sel.value = keep || prefer || (secs[0] && secs[0].id) || "";
    }
    fill(from, currentId);
    fill(to, currentId);
  }

  function copyPageToTab(fromId, toId) {
    if (!fromId || !toId || fromId === toId) { alert("مبدأ و مقصد را جدا انتخاب کنید."); return; }
    ensureState();
    var fromKey = fieldKeyForTab(fromId);
    var toKey = fieldKeyForTab(toId);
    var copiedFields = 0;
    var srcFields = ((state.customFields || {})[fromKey] || []);
    if (!state.customFields[toKey]) state.customFields[toKey] = [];
    srcFields.forEach(function (f) {
      var dup = state.customFields[toKey].filter(function (x) {
        return x.inputKind === f.inputKind && x.label === f.label;
      })[0];
      if (dup) return;
      var neu = JSON.parse(JSON.stringify(f));
      neu.id = "cf-" + toKey + "-" + Date.now() + "-" + Math.floor(Math.random() * 999);
      state.customFields[toKey].push(neu);
      copiedFields += 1;
    });
    if ((state.formBoxes || {})[fromKey]) {
      if (!state.formBoxes[toKey]) state.formBoxes[toKey] = [];
      (state.formBoxes[fromKey] || []).forEach(function (b) {
        if (state.formBoxes[toKey].filter(function (x) { return x.label === b.label; })[0]) return;
        state.formBoxes[toKey].push({
          id: "box-" + toKey + "-" + Date.now(),
          label: b.label,
          fieldIds: [],
          order: b.order || 1
        });
      });
    }
    var srcLay = layoutOf(fromId);
    state.manualLayouts[toId] = { items: JSON.parse(JSON.stringify(srcLay.items || {})), copiedFrom: fromId };
    if (typeof saveState === "function") saveState();
    if (typeof window.applyFullFormLayout === "function") {
      try { window.applyFullFormLayout(toId); } catch (e) {}
    }
    applyManualLayout(toId);
    alert("از «" + fromId + "» به «" + toId + "» کپی شد: " + copiedFields + " فیلد/کلید + چیدمان دستی.");
  }

  function resetLayout(tabId) {
    ensureState();
    if (state.manualLayouts) delete state.manualLayouts[tabId];
    if (typeof saveState === "function") saveState();
    var pane = $(tabId);
    if (pane) {
      pane.querySelectorAll(".man-item, .form-group, .map-container, .stat-card").forEach(function (el) {
        el.style.position = "";
        el.style.left = "";
        el.style.top = "";
        el.style.width = "";
        el.style.height = "";
        el.style.maxWidth = "";
        el.style.flex = "";
      });
    }
    if (window._activeManualTab === tabId) openManualCanvas(tabId);
    alert("چیدمان دستی این تب پاک شد. چیدمان پیش‌فرض برگشت.");
  }

  function bindToolbar() {
    var save = $("btnManSave");
    var copy = $("btnManCopy");
    var reset = $("btnManReset");
    var open = $("btnManOpenTab");
    if (save && !save.dataset.bound) {
      save.dataset.bound = "1";
      save.addEventListener("click", function () {
        var id = window._activeManualTab;
        if (!id) { alert("اول یک تب را از گرید انتخاب کنید."); return; }
        if (typeof saveState === "function") saveState();
        applyManualLayout(id);
        alert("چیدمان ذخیره شد و روی تب اصلی اعمال شد.");
      });
    }
    if (copy && !copy.dataset.bound) {
      copy.dataset.bound = "1";
      copy.addEventListener("click", function () {
        copyPageToTab(($("manCopyFrom") || {}).value, ($("manCopyTo") || {}).value);
      });
    }
    if (reset && !reset.dataset.bound) {
      reset.dataset.bound = "1";
      reset.addEventListener("click", function () {
        if (!window._activeManualTab) return;
        if (confirm("چیدمان دستی این تب پاک شود؟")) resetLayout(window._activeManualTab);
      });
    }
    if (open && !open.dataset.bound) {
      open.dataset.bound = "1";
      open.addEventListener("click", function () {
        if (window._activeManualTab && typeof switchTab === "function") switchTab(window._activeManualTab);
      });
    }
  }

  function scrubDuplicateWidgetsInState() {
    ensureState();
    var changed = false;
    Object.keys(state.customFields || {}).forEach(function (key) {
      var arr = state.customFields[key] || [];
      var seen = {};
      var next = [];
      arr.forEach(function (f) {
        var k = String(f.inputKind || "");
        if (k.indexOf("widget-") === 0) {
          if (seen[k]) { changed = true; return; }
          seen[k] = true;
        }
        next.push(f);
      });
      state.customFields[key] = next;
    });
    if (changed && typeof saveState === "function") saveState(false);
  }

  function boot() {
    try { ensureState(); } catch (e) {}
    try { scrubDuplicateWidgetsInState(); } catch (e) {}
    try { wrapRenderCustomFields(); } catch (e) {}
    try { wrapApplyOrderTabId(); } catch (e) {}
    try { wrapApplyLayoutDedupe(); } catch (e) {}
    try { renderManualGrid(); } catch (e) {}
    try { bindToolbar(); } catch (e) {}
    try {
      (typeof window.getAllMenuSections === "function" ? window.getAllMenuSections() : []).forEach(function (s) {
        try { window.dedupeTabWidgets(s.id); } catch (e2) {}
        try { applyManualLayout(s.id); } catch (e2) {}
      });
    } catch (e) {}

    var origSw = window.switchTab;
    if (typeof origSw === "function" && !window._v13Sw) {
      window._v13Sw = true;
      window.switchTab = function (id) {
        origSw(id);
        setTimeout(function () {
          if (id === "tab-manual-design") {
            renderManualGrid();
            bindToolbar();
            if (window._activeManualTab) openManualCanvas(window._activeManualTab);
          } else {
            try { window.dedupeTabWidgets(id); } catch (e) {}
            try { applyManualLayout(id); } catch (e) {}
          }
        }, 160);
      };
    }
    console.log("v13 ready");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
