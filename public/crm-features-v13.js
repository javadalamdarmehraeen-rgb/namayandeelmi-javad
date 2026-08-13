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
    var seen = {};
    function take(el, kind) {
      if (!el || el.getAttribute("data-man-skip") === "1") return;
      if (el.closest(".man-toolbar") || el.closest("#manualTabGrid")) return;
      if (el.closest("table") && kind === "btn") return;
      if (el.closest(".col-ops")) return;
      if (seen[el]) return;
      seen[el] = true;
      out.push({ el: el, kind: kind });
    }
    Array.prototype.forEach.call(root.querySelectorAll(".card"), function (el) {
      if (el.closest(".man-toolbar") || el.closest("#manualTabGrid")) return;
      take(el, "card");
    });
    Array.prototype.forEach.call(root.querySelectorAll(".stat-card"), function (el) { take(el, "stat"); });
    Array.prototype.forEach.call(root.querySelectorAll(".col-user-box"), function (el) { take(el, "box"); });
    Array.prototype.forEach.call(root.querySelectorAll(".form-group"), function (el) {
      if (el.id && /CustomFieldsContainer|cfHost-/.test(el.id)) return;
      if (el.classList.contains("extra-cf-host")) return;
      if (el.closest && el.closest(".card-header")) return;
      if (el.querySelector(":scope > .form-group")) return;
      take(el, "field");
    });
    Array.prototype.forEach.call(root.querySelectorAll(".map-container"), function (el) {
      if (el.closest(".form-group") && el.closest(".form-group").querySelector("input, select, textarea")) return;
      take(el, "map");
    });
    Array.prototype.forEach.call(root.querySelectorAll("button.btn, .btn-toggle-option"), function (el) {
      if (el.closest("table")) return;
      if (el.closest(".card-header") && /صفحه اصلی|بازگشت/.test(el.textContent || "")) return;
      if (el.closest(".man-toolbar") || el.classList.contains("man-handle")) return;
      take(el, "btn");
    });
    return out;
  }

  function paletteList() {
    return window.WIDGET_PALETTE || [];
  }

  function renderManPalette() {
    var host = $("manWidgetPalette");
    if (!host) return;
    host.innerHTML = "<strong>امکانات آماده همین برنامه</strong>" +
      "<p class='col-help'>تب را از گرید بالا انتخاب کنید. روی امکان بزنید یا آن را روی بوم بکشید. بعد جایش را با ⠿ عوض کنید.</p>" +
      '<div class="col-widget-btns">' +
      paletteList().map(function (w) {
        return '<button type="button" class="btn btn-outline btn-sm col-add-widget man-pal-btn" draggable="true" data-kind="' +
          w.kind + '" data-label="' + esc(w.label) + '">' + w.icon + " " + esc(w.label) + "</button>";
      }).join("") + "</div>";
    var box = $("manBoxMaker");
    if (box && !box.dataset.ready) {
      box.dataset.ready = "1";
      box.innerHTML = "<strong>ساخت کادر</strong>" +
        '<div class="form-grid" style="margin-top:.4rem">' +
        '<div class="form-group"><label class="form-label">نام کادر</label><input id="manBoxLabel" class="form-input" placeholder="مثلاً اطلاعات تماس"></div></div>' +
        '<button type="button" id="btnManAddBox" class="btn btn-primary btn-sm" style="background:#0d9488;margin-top:.4rem">➕ ثبت کادر روی تب فعال</button>';
      var bb = $("btnManAddBox");
      if (bb) bb.addEventListener("click", function () {
        var name = (($("manBoxLabel") || {}).value || "").trim();
        if (!name) { alert("نام کادر را بنویسید."); return; }
        var tabId = window._activeManualTab;
        if (!tabId) { alert("اول تب را انتخاب کنید."); return; }
        var key = fieldKeyForTab(tabId);
        if (!state.formBoxes) state.formBoxes = {};
        if (!state.formBoxes[key]) state.formBoxes[key] = [];
        state.formBoxes[key].push({ id: "box-" + key + "-" + Date.now(), label: name, fieldIds: [] });
        if (typeof saveState === "function") saveState();
        if (typeof window.applyFullFormLayout === "function") window.applyFullFormLayout(tabId);
        openManualCanvas(tabId);
        $("manBoxLabel").value = "";
      });
    }
    Array.prototype.forEach.call(host.querySelectorAll(".man-pal-btn"), function (b) {
      b.addEventListener("dragstart", function (ev) {
        ev.dataTransfer.setData("text/plain", JSON.stringify({
          kind: b.getAttribute("data-kind"),
          label: b.getAttribute("data-label")
        }));
        ev.dataTransfer.effectAllowed = "copy";
      });
    });
  }

  window.refreshManualCanvas = function (tabId) {
    if (!tabId) tabId = window._activeManualTab;
    if (tabId && window._activeManualTab === tabId && $("manualDesignCanvas")) openManualCanvas(tabId);
  };

  window.placeFieldOnTab = function (tabId, fieldId, x, y, scope, scopeId) {
    var lay = layoutOf(tabId);
    lay.items[fieldId] = { x: x || 20, y: y || 20, w: 220, h: 72, abs: true, scope: scope || "form", scopeId: scopeId || "" };
    var key = fieldKeyForTab(tabId);
    ((state.customFields[key] || [])).forEach(function (f) {
      if (f.id === fieldId) {
        f.actionScope = scope || "form";
        f.scopeId = scopeId || "";
      }
    });
    if (typeof saveState === "function") saveState(false);
    applyManualLayout(tabId);
  };

  function detectScope(el, root) {
    var r = el.getBoundingClientRect();
    var cx = r.left + r.width / 2;
    var cy = r.top + r.height / 2;
    var rows = root.querySelectorAll("tbody tr");
    for (var i = 0; i < rows.length; i++) {
      var rr = rows[i].getBoundingClientRect();
      if (cx >= rr.left && cx <= rr.right && cy >= rr.top - 8 && cy <= rr.bottom + 8) {
        return { type: "row", id: rows[i].getAttribute("data-edit") || rows[i].getAttribute("data-rid") || ("row-" + i), label: "ردیف " + (i + 1) };
      }
    }
    var boxes = root.querySelectorAll(".col-user-box");
    var best = null, bestD = 1e9;
    for (var j = 0; j < boxes.length; j++) {
      var br = boxes[j].getBoundingClientRect();
      var inside = cx >= br.left && cx <= br.right && cy >= br.top && cy <= br.bottom;
      var near = cy >= br.top - 48 && cy <= br.bottom + 48 && cx >= br.left - 24 && cx <= br.right + 24;
      if (inside || near) {
        var d = Math.abs(cy - (br.top + br.height / 2));
        if (d < bestD) {
          bestD = d;
          best = { type: "box", id: boxes[j].id || boxes[j].getAttribute("data-man-id"), label: (boxes[j].querySelector(".col-user-box-title") || {}).textContent || "کادر" };
        }
      }
    }
    if (best) return best;
    return { type: "form", id: "", label: "کل فرم" };
  }

  function paintScopeBadge(el, scope) {
    if (!el) return;
    var b = el.querySelector(":scope > .man-scope-badge");
    if (!b) {
      b = document.createElement("span");
      b.className = "man-scope-badge";
      el.appendChild(b);
    }
    b.className = "man-scope-badge man-scope-" + (scope.type || "form");
    b.textContent = scope.type === "row" ? ("برای " + (scope.label || "همین ردیف")) :
      scope.type === "box" ? ("برای کادر: " + (scope.label || "")) : "برای کل فرم";
    el.setAttribute("data-action-scope", scope.type || "form");
    el.setAttribute("data-scope-id", scope.id || "");
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
    if (hint) hint.innerHTML = "الان صفحهٔ «" + esc(sec.icon + " " + sec.label) + "» را می‌چینید. فیلد، کلید، نقشه و کادر را بکشید. برچسب رنگی می‌گوید این کلید برای ردیف است، کادر است یا کل فرم.";
    var st = $("manAddStatus");
    if (st) st.textContent = "تب فعال: " + (sec.icon || "") + " " + (sec.label || tabId);
    renderManPalette();

    host.innerHTML = "";
    var stage = document.createElement("div");
    stage.className = "man-stage";
    var inner = document.createElement("div");
    inner.className = "man-canvas-inner";
    inner.id = "manualCanvasInner";
    var clone = src.cloneNode(true);
    clone.id = "man-clone-" + tabId;
    clone.classList.add("man-clone", "tab-pane", "active", "man-design-mode");
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

    inner.addEventListener("dragover", function (ev) {
      ev.preventDefault();
      ev.dataTransfer.dropEffect = "copy";
    });
    inner.addEventListener("drop", function (ev) {
      ev.preventDefault();
      var raw = ev.dataTransfer.getData("text/plain");
      var pack;
      try { pack = JSON.parse(raw); } catch (e) { return; }
      if (!pack || !pack.kind) return;
      var cr = inner.getBoundingClientRect();
      var x = Math.round(ev.clientX - cr.left + inner.scrollLeft);
      var y = Math.round(ev.clientY - cr.top + inner.scrollTop);
      var ghost = document.createElement("div");
      ghost.style.position = "absolute";
      ghost.style.left = x + "px";
      ghost.style.top = y + "px";
      ghost.style.width = "40px";
      ghost.style.height = "40px";
      inner.appendChild(ghost);
      var sc = detectScope(ghost, clone);
      if (ghost.parentNode) ghost.parentNode.removeChild(ghost);
      if (typeof window.addWidgetToActiveTab === "function") {
        window.addWidgetToActiveTab(pack.kind, pack.label, {
          tabId: tabId, x: x, y: y, scope: sc.type, scopeId: sc.id
        });
      }
    });

    var targets = collectDesignTargets(clone);
    targets.forEach(function (t, i) {
      enableDesignItem(t.el, tabId, i);
    });
    applySavedToClone(tabId, clone);
    fillCopySelects(tabId);
    if (typeof window.lockManualDesigner === "function") {
      try { window.lockManualDesigner(); } catch (eLk) {}
    }
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
    var saved = (layoutOf(tabId).items || {})[id] || {};
    paintScopeBadge(el, {
      type: el.getAttribute("data-action-scope") || saved.scope || "form",
      id: el.getAttribute("data-scope-id") || saved.scopeId || "",
      label: saved.scope === "box" ? "کادر" : (saved.scope === "row" ? "ردیف" : "کل فرم")
    });
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
        writeItemBox(tabId, id, el, canvas, null, { forceAbs: true });
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

  function writeItemBox(tabId, id, el, canvas, scope, opts) {
    opts = opts || {};
    var lay = layoutOf(tabId);
    var prev = (lay.items || {})[id] || {};
    var host = (el && el.closest && el.closest(".card")) || canvas;
    var cr = (host && host.getBoundingClientRect) ? host.getBoundingClientRect() : canvas.getBoundingClientRect();
    var er = el.getBoundingClientRect();
    scope = scope || detectScope(el, canvas);
    var abs = opts.forceAbs ? true : !!prev.abs;
    var srcId = ((el && el.getAttribute && el.getAttribute("data-src-id")) || id || "").replace(/^man-/, "");
    if (!opts.forceAbs && srcId && /^(formPharmacy|formDoctor|formOrder)$/.test(srcId) && el && el.tagName === "FORM") abs = false;
    lay.items[id] = {
      x: Math.round(er.left - cr.left + (canvas.scrollLeft || 0)),
      y: Math.round(er.top - cr.top + (canvas.scrollTop || 0)),
      w: Math.round(er.width),
      h: Math.round(er.height),
      abs: abs,
      scope: scope.type || "form",
      scopeId: scope.id || "",
      cardId: (host && host.id) || prev.cardId || ""
    };
    var key = fieldKeyForTab(tabId);
    ((state.customFields && state.customFields[key]) || []).forEach(function (f) {
      if (f.id === id) {
        f.actionScope = scope.type || "form";
        f.scopeId = scope.id || "";
      }
    });
    if (typeof saveState === "function") saveState(false);
  }

  function applySavedToClone(tabId, clone) {
    var items = layoutOf(tabId).items || {};
    Object.keys(items).forEach(function (id) {
      var box = items[id];
      if (!box) return;
      var el = clone.querySelector('[data-man-id="' + id + '"]') ||
        clone.querySelector('[data-col-fid="' + id + '"]') ||
        clone.querySelector('[data-src-id="' + id + '"]') ||
        clone.querySelector("#man-" + id);
      if (!el) return;
      if (box.w) { el.style.width = box.w + "px"; el.style.maxWidth = box.w + "px"; }
      if (box.h) el.style.height = box.h + "px";
      if (!box.abs) return;
      el.style.position = "absolute";
      el.style.left = box.x + "px";
      el.style.top = box.y + "px";
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
    var skipId = /^(cardPhForm|cardPhList|cardDocForm|cardDocList|cardOrdForm|cardOrdList|formPharmacy|formDoctor|formOrder)$/;
    var maxByHost = {};
    Object.keys(lay.items).forEach(function (id) {
      var box = lay.items[id];
      if (!box) return;
      if (skipId.test(id)) return;
      var el = null;
      try {
        el = pane.querySelector('[data-col-fid="' + id + '"]') ||
          (id && document.getElementById(id) && pane.contains(document.getElementById(id)) ? document.getElementById(id) : null) ||
          pane.querySelector('[data-man-id="' + id + '"]');
      } catch (e) { el = null; }
      if (!el) return;
      if (el.id && skipId.test(el.id)) return;
      if (box.w) {
        el.style.width = box.w + "px";
        el.style.maxWidth = box.w + "px";
      }
      if (box.h) el.style.height = box.h + "px";
      if (!box.abs) {
        el.style.position = "";
        el.style.left = "";
        el.style.top = "";
        return;
      }
      var host = (box.cardId && document.getElementById(box.cardId)) || el.closest(".card") || pane;
      if (host && getComputedStyle(host).position === "static") host.style.position = "relative";
      var hk = host.id || "_";
      if ((box.y || 0) + (box.h || 0) > (maxByHost[hk] || 0)) maxByHost[hk] = (box.y || 0) + (box.h || 0);
      el.style.position = "absolute";
      el.style.left = (box.x || 0) + "px";
      el.style.top = (box.y || 0) + "px";
      el.style.margin = "0";
      el.style.zIndex = "4";
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
    Object.keys(maxByHost).forEach(function (hk) {
      var hostEl = hk === "_" ? pane : document.getElementById(hk);
      if (hostEl) hostEl.style.minHeight = (maxByHost[hk] + 40) + "px";
    });
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
  window.copyPageToTab = copyPageToTab;

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
        (window.copyPageToTab || copyPageToTab)(($("manCopyFrom") || {}).value, ($("manCopyTo") || {}).value);
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
    try { renderManPalette(); } catch (e) {}
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
