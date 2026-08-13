// v18 — ستاره چسبیده، فونت نه عرض، ترتیب فرم/لیست جدا، ارتفاع واقعی،
// اطلاعات کادر/کلید، طراح دستی آزاد، کپی همه/انتخابی، کلید هم‌شکل با تأیید
(function () {
  "use strict";

  var VER = "11.14.0";
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

  window._v18DefaultReq = {
    pharmacyDate: 1, pharmacyProvince: 1, pharmacyCity: 1, pharmacyDistrict: 1,
    pharmacyName: 1, pharmacyAddress: 1,
    doctorDate: 1, doctorName: 1, doctorSpecialty: 1, doctorProvince: 1,
    doctorCity: 1, doctorDistrict: 1, doctorAddress: 1,
    orderPharmacyName: 1, orderProvince: 1, orderCity: 1, orderDistrict: 1,
    productName: 1, productDistPrice: 1, productPrice: 1
  };

  function stripAllBlackStars(root) {
    root = root || document;
    Array.prototype.forEach.call(root.querySelectorAll(".form-label, label"), function (lab) {
      if (lab.closest("#columnsDesignerHost") || lab.closest("#jalaliCalendarPopup")) return;
      if (lab.querySelector("input")) return;
      var nodes = lab.childNodes;
      for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].nodeType === 3) {
          nodes[i].nodeValue = String(nodes[i].nodeValue || "")
            .replace(/\s*\*+\s*$/g, "")
            .replace(/\s+\*\s+/g, " ");
        }
      }
    });
  }

  function disableNativeRequired() {
    document.querySelectorAll("form").forEach(function (f) {
      f.setAttribute("novalidate", "novalidate");
    });
    document.querySelectorAll("input[required], select[required], textarea[required]").forEach(function (el) {
      el.setAttribute("data-req", "1");
      el.removeAttribute("required");
    });
  }

  function seedRequiredMeta() {
    if (!window.state) return;
    if (!state.formFieldMeta) state.formFieldMeta = {};
    Object.keys(window._v18DefaultReq).forEach(function (id) {
      var tab = id.indexOf("pharmacy") === 0 || id.indexOf("ph") === 0 ? "pharmacy"
        : id.indexOf("doctor") === 0 || id.indexOf("doc") === 0 ? "doctor"
        : id.indexOf("order") === 0 ? "order"
        : id.indexOf("product") === 0 ? "products" : "";
      if (!tab) return;
      if (!state.formFieldMeta[tab]) state.formFieldMeta[tab] = {};
      if (!state.formFieldMeta[tab][id]) state.formFieldMeta[tab][id] = {};
      if (state.formFieldMeta[tab][id].required == null) state.formFieldMeta[tab][id].required = true;
    });
  }

  function wrapValidate() {
    var prev = window.validateRequiredFields;
    window.validateRequiredFields = function (tabId) {
      var ok = true;
      if (typeof prev === "function") {
        try { ok = prev(tabId); } catch (e) { ok = true; }
      }
      if (!ok) return false;
      var pane = $(tabId);
      if (!pane) return true;
      var missing = [];
      Array.prototype.forEach.call(pane.querySelectorAll("input[data-req='1'], select[data-req='1'], textarea[data-req='1']"), function (el) {
        if (el.closest("#columnsDesignerHost") || el.closest(".modal-overlay") || el.closest("#manualDesignCanvas")) return;
        if (el.type === "hidden" || el.disabled) return;
        if (String(el.value || "").trim()) return;
        var lab = (el.id && pane.querySelector('label[for="' + el.id + '"]')) ||
          (el.closest(".form-group") && el.closest(".form-group").querySelector(".form-label, label"));
        var name = lab ? String(lab.textContent || "").replace(/\*/g, "").replace(/\s+/g, " ").trim() : (el.id || "فیلد");
        if (missing.indexOf(name) === -1) missing.push(name);
      });
      if (missing.length) {
        alert(missing.map(function (n) { return "فیلد «" + n + "» خالی است و باید پر شود."; }).join("\n"));
        return false;
      }
      return true;
    };
  }

  /* ---------- کالا: ترتیب / زیرهم / پیکسل ---------- */
  function upgradeProdFieldBar() {
    var bar = $("prodFieldBar");
    if (!bar) return;
    if (!$("prodNewFieldOrder")) {
      var extra = document.createElement("div");
      extra.className = "prod-field-extra";
      extra.style.cssText = "display:flex;flex-wrap:wrap;gap:.4rem;align-items:center;width:100%;margin-top:.35rem";
      extra.innerHTML =
        '<input id="prodNewFieldOrder" class="form-input" type="number" min="1" placeholder="شماره ترتیب" style="max-width:120px" title="شماره ترتیب">' +
        '<select id="prodNewFieldPlace" class="form-select" style="max-width:140px"><option value="beside">روبرو</option><option value="under">زیر هم</option></select>' +
        '<input id="prodNewFieldSize" class="form-input" type="number" min="80" max="900" value="220" placeholder="عرض پیکسل" style="max-width:120px" title="عرض پیکسل">' +
        '<input id="prodNewFieldHeight" class="form-input" type="number" min="24" max="400" value="42" placeholder="ارتفاع پیکسل" style="max-width:120px" title="ارتفاع پیکسل">';
      bar.appendChild(extra);
    }
    var add = $("btnAddProductField");
    if (add && add.dataset.v18 !== "1") {
      add.dataset.v18 = "1";
      add.addEventListener("click", function () {
        var last = ((state.customFields || {}).products || []).slice(-1)[0];
        if (!last) return;
        var ord = parseInt(($("prodNewFieldOrder") || {}).value, 10);
        if (ord > 0) last.order = ord;
        last.place = ($("prodNewFieldPlace") || {}).value || "beside";
        var sz = parseInt(($("prodNewFieldSize") || {}).value, 10);
        if (sz > 40) last.size = sz;
        var hg = parseInt(($("prodNewFieldHeight") || {}).value, 10);
        if (hg > 20) last.height = hg;
        if (typeof saveState === "function") saveState();
        if (typeof window.applyFullFormLayout === "function") window.applyFullFormLayout("tab-columns-products");
      });
    }
  }

  /* ---------- جداول اطلاعات کادر و کلید ---------- */
  function liveSizeOf(id) {
    var el = document.getElementById(id);
    if (!el) return { w: 0, h: 0 };
    var r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height) };
  }

  window.renderColBoxInfoTable = function (tabId, key) {
    var host = $("colBoxInfoList");
    if (!host) return;
    if (!state.formBoxes) state.formBoxes = {};
    var boxes = state.formBoxes[key] || [];
    if (!boxes.length) {
      host.innerHTML = "<div class='col-empty'>کادری در این تب نیست. از کشویی «کادر» یکی بسازید.</div>";
      return;
    }
    var html = "<table class='data-table'><thead><tr><th>ترتیب</th><th>عنوان کادر</th><th>عرض واقعی</th><th>ارتفاع واقعی</th><th>عملیات</th></tr></thead><tbody>";
    boxes.forEach(function (b, i) {
      var live = liveSizeOf(b.id);
      var w = (b.size > 40 ? b.size : (live.w || 220));
      var h = (b.height > 20 ? b.height : (live.h || 80));
      html += "<tr data-box='" + esc(b.id) + "'>" +
        "<td><input type='number' min='1' class='form-input col-box-ord' data-box='" + esc(b.id) + "' value='" + (b.order || (i + 1)) + "'></td>" +
        "<td><strong>" + esc(b.label) + "</strong></td>" +
        "<td>" + w + "</td><td>" + h + "</td>" +
        "<td class='col-ops'>" +
        "<button type='button' class='btn btn-outline btn-sm col-info-edit-box' data-box='" + esc(b.id) + "'>✏️ ویرایش</button> " +
        "<button type='button' class='btn btn-danger btn-sm col-info-del-box' data-box='" + esc(b.id) + "'>حذف</button></td></tr>";
    });
    html += "</tbody></table>";
    host.innerHTML = html;
    Array.prototype.forEach.call(host.querySelectorAll(".col-info-edit-box"), function (btn) {
      btn.addEventListener("click", function () {
        if (!confirm("کادر برای ویرایش باز شود؟")) return;
        var box = boxes.filter(function (x) { return x.id === btn.getAttribute("data-box"); })[0];
        if (!box) return;
        if ($("colAddKind")) $("colAddKind").value = "box";
        if ($("colFieldLabelCap")) $("colFieldLabelCap").textContent = "عنوان کادر";
        if ($("colFieldLabel")) $("colFieldLabel").value = box.label || "";
        if ($("colFieldSize")) $("colFieldSize").value = (box.size > 40 ? box.size : liveSizeOf(box.id).w) || 220;
        if ($("colFieldHeight")) $("colFieldHeight").value = (box.height > 20 ? box.height : liveSizeOf(box.id).h) || 80;
        if ($("colBoxLabel")) $("colBoxLabel").value = box.label || "";
        window._editingBoxId = box.id;
        if ($("colFieldLabel")) $("colFieldLabel").scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });
    Array.prototype.forEach.call(host.querySelectorAll(".col-info-del-box"), function (btn) {
      btn.addEventListener("click", function () {
        var bid = btn.getAttribute("data-box");
        var box = boxes.filter(function (x) { return x.id === bid; })[0];
        if (!confirm("کادر «" + ((box && box.label) || bid) + "» حذف شود؟")) return;
        state.formBoxes[key] = (state.formBoxes[key] || []).filter(function (x) { return x.id !== bid; });
        var el = document.getElementById(bid);
        if (el && el.parentNode) el.parentNode.removeChild(el);
        if (typeof saveState === "function") saveState();
        if (typeof window.applyFullFormLayout === "function") window.applyFullFormLayout(tabId);
        window.renderColBoxInfoTable(tabId, key);
      });
    });
    Array.prototype.forEach.call(host.querySelectorAll(".col-box-ord"), function (inp) {
      inp.addEventListener("change", function () {
        var box = (state.formBoxes[key] || []).filter(function (x) { return x.id === inp.getAttribute("data-box"); })[0];
        if (box) box.order = parseInt(inp.value, 10) || 1;
        if (typeof saveState === "function") saveState();
      });
    });
  };

  window.renderColBtnInfoTable = function (tabId, key) {
    var host = $("colBtnInfoList");
    if (!host) return;
    var list = [];
    try {
      if (typeof window.getUnifiedFieldList === "function") {
        list = window.getUnifiedFieldList(tabId).filter(function (f) {
          return f.kind === "widget" || String(f.inputKind || f.type || "").indexOf("widget-") === 0;
        });
      }
    } catch (e) {}
    if (!list.length) {
      host.innerHTML = "<div class='col-empty'>کلیدی در این تب نیست. از کشویی «کلید» یکی بسازید.</div>";
      return;
    }
    var html = "<table class='data-table'><thead><tr><th>ترتیب</th><th>عنوان کلید</th><th>نوع</th><th>عرض واقعی</th><th>ارتفاع واقعی</th><th>عملیات</th></tr></thead><tbody>";
    list.forEach(function (f, i) {
      var live = liveSizeOf(f.id);
      var w = (parseInt(f.size, 10) > 40 ? parseInt(f.size, 10) : (live.w || 120));
      var h = (parseInt(f.height, 10) > 20 ? parseInt(f.height, 10) : (live.h || 36));
      html += "<tr>" +
        "<td>" + (f.order || (i + 1)) + "</td>" +
        "<td><strong>" + esc(f.label) + "</strong></td>" +
        "<td>" + esc(f.inputKind || f.type || "کلید") + "</td>" +
        "<td>" + w + "</td><td>" + h + "</td>" +
        "<td class='col-ops'>" +
        "<button type='button' class='btn btn-outline btn-sm col-info-edit-btn' data-fid='" + esc(f.id) + "'>✏️ ویرایش</button> " +
        "<button type='button' class='btn btn-danger btn-sm col-info-del-btn' data-fid='" + esc(f.id) + "'>حذف</button></td></tr>";
    });
    html += "</tbody></table>";
    host.innerHTML = html;
    Array.prototype.forEach.call(host.querySelectorAll(".col-info-edit-btn"), function (btn) {
      btn.addEventListener("click", function () {
        if (!confirm("کلید برای ویرایش باز شود؟")) return;
        var id = btn.getAttribute("data-fid");
        var field = list.filter(function (f) { return f.id === id; })[0];
        if (!field) return;
        window._editingColField = field;
        if ($("colAddKind")) $("colAddKind").value = "button";
        if ($("colFieldLabelCap")) $("colFieldLabelCap").textContent = "عنوان کلید";
        if ($("colFieldLabel")) $("colFieldLabel").value = field.label || "";
        var live = liveSizeOf(field.id);
        if ($("colFieldSize")) $("colFieldSize").value = (parseInt(field.size, 10) > 40 ? field.size : live.w) || 120;
        if ($("colFieldHeight")) $("colFieldHeight").value = (parseInt(field.height, 10) > 20 ? field.height : live.h) || 36;
        if ($("colFieldLabel")) $("colFieldLabel").scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });
    Array.prototype.forEach.call(host.querySelectorAll(".col-info-del-btn"), function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-fid");
        var field = list.filter(function (f) { return f.id === id; })[0];
        if (!confirm("کلید «" + ((field && field.label) || id) + "» حذف شود؟")) return;
        if (!state.customFields) state.customFields = {};
        state.customFields[key] = (state.customFields[key] || []).filter(function (f) { return f.id !== id; });
        document.querySelectorAll('[data-custom-field-id="' + id + '"], [data-col-fid="' + id + '"]').forEach(function (n) {
          var g = n.closest(".form-group, .col-widget-wrap");
          if (g && g.parentNode) g.parentNode.removeChild(g);
        });
        if (typeof saveState === "function") saveState();
        if (typeof window.applyFullFormLayout === "function") window.applyFullFormLayout(tabId);
        window.renderColBtnInfoTable(tabId, key);
      });
    });
  };

  function refreshExtraInfoTables() {
    var tabId = window._activeColTab;
    if (!tabId) return;
    var key = fieldKeyForTab(tabId);
    try { window.renderColBoxInfoTable(tabId, key); } catch (e) {}
    try { window.renderColBtnInfoTable(tabId, key); } catch (e) {}
  }

  function watchDesignerPanel() {
    var host = $("columnsDesignerHost");
    if (!host || host.dataset.v18obs === "1") return;
    host.dataset.v18obs = "1";
    var t;
    new MutationObserver(function () {
      clearTimeout(t);
      t = setTimeout(refreshExtraInfoTables, 80);
    }).observe(host, { childList: true, subtree: true });
  }

  /* ---------- کلیدها: شکل یکدست + تأیید + کار حذف ردیف ---------- */
  function classifyBtn(btn) {
    if (!btn || btn.closest(".app-nav") || btn.closest(".side-menu-drawer") || btn.closest(".app-header")) return;
    if (btn.classList.contains("nav-item") || btn.classList.contains("side-menu-item")) return;
    if (btn.classList.contains("btn-toggle-option") || btn.classList.contains("launchpad-card")) return;
    var txt = String(btn.textContent || btn.title || "");
    if (/حذف|پاک/.test(txt) && !/برگشت|پیش‌فرض/.test(txt)) {
      btn.classList.add("btn", "btn-danger");
      btn.classList.remove("btn-outline", "btn-primary", "btn-success");
    } else if (/ذخیره|ثبت اطلاعات|ثبت و ذخیره|ثبت فیلد|ثبت کادر|ثبت کلید/.test(txt)) {
      btn.classList.add("btn", "btn-primary");
      btn.style.background = "#0d9488";
    } else if (/ویرایش/.test(txt)) {
      btn.classList.add("btn", "btn-outline");
    }
  }

  function unifyButtons(root) {
    root = root || document;
    Array.prototype.forEach.call(root.querySelectorAll("button.btn, button[id]"), function (b) {
      try { classifyBtn(b); } catch (e) {}
    });
  }

  function wrapConfirms() {
    if (window._v18Confirm) return;
    window._v18Confirm = true;
    document.addEventListener("click", function (ev) {
      var btn = ev.target.closest("button");
      if (!btn) return;
      if (btn.closest("#manualDesignCanvas")) return;
      if (btn.dataset.v18ok === "1") return;
      var txt = String(btn.textContent || "");
      if (/حذف/.test(txt) && !btn.getAttribute("onclick") && !btn.classList.contains("col-del-field") && !btn.classList.contains("col-info-del-box") && !btn.classList.contains("col-info-del-btn") && !btn.classList.contains("col-del-box")) {
        /* native handlers already confirm in most places */
      }
      if ((btn.id === "btnSavePharmacy" || btn.id === "btnSaveDoctor" || btn.id === "btnSaveOrder" || btn.id === "btnSaveProduct" || btn.id === "btnSaveColField" || btn.id === "btnManSave") && !btn.dataset.v18ask) {
        btn.dataset.v18ask = "1";
      }
    }, true);

    ["btnSavePharmacy", "btnSaveDoctor", "btnSaveOrder", "btnSaveProduct", "btnSaveColField", "btnManSave"].forEach(function (id) {
      var b = $(id);
      if (!b || b.dataset.v18save === "1") return;
      b.dataset.v18save = "1";
      b.addEventListener("click", function (e) {
        if (b.dataset.v18pass === "1") { b.dataset.v18pass = ""; return; }
        if (!confirm("اطلاعات ذخیره شود؟")) {
          e.preventDefault();
          e.stopImmediatePropagation();
          return false;
        }
      }, true);
    });
  }

  function enhanceWidgetActions() {
    if (typeof window.buildDesignerWidget !== "function" || window._v18Widget) return;
    window._v18Widget = true;
    var orig = window.buildDesignerWidget;
    window.buildDesignerWidget = function (field, tabId) {
      var wrap = orig(field, tabId);
      var kind = field && (field.inputKind || field.type || "");
      setTimeout(function () {
        var b = wrap && wrap.querySelector("button");
        if (!b) return;
        if (kind === "widget-delete") {
          b.className = "btn btn-danger btn-sm";
          if (!b.dataset.v18row) {
            b.dataset.v18row = "1";
            b.addEventListener("click", function (ev) {
              var tr = wrap.closest("tr") || (function () {
                var r = wrap.getBoundingClientRect();
                var rows = document.querySelectorAll((tabId ? "#" + tabId + " " : "") + "tbody tr");
                for (var i = 0; i < rows.length; i++) {
                  var rr = rows[i].getBoundingClientRect();
                  if (Math.abs((rr.top + rr.bottom) / 2 - (r.top + r.bottom) / 2) < 28) return rows[i];
                }
                return null;
              })();
              if (!tr) return;
              var del = tr.querySelector(".btn-danger, [onclick*='delete']");
              if (del && del !== b) {
                ev.preventDefault();
                ev.stopPropagation();
                del.click();
              }
            });
          }
        }
        if (kind === "widget-save") {
          b.className = "btn btn-primary";
          b.style.background = "#0d9488";
          if (!b.dataset.v18sv) {
            b.dataset.v18sv = "1";
            b.addEventListener("click", function (ev) {
              if (!confirm("اطلاعات ذخیره شود؟")) {
                ev.preventDefault();
                ev.stopImmediatePropagation();
              }
            }, true);
          }
        }
        if (kind === "widget-edit") {
          b.className = "btn btn-outline btn-sm";
          if (!b.dataset.v18ed) {
            b.dataset.v18ed = "1";
            b.addEventListener("click", function (ev) {
              if (!confirm("این مورد ویرایش شود؟")) {
                ev.preventDefault();
                ev.stopImmediatePropagation();
              }
            }, true);
          }
        }
      }, 40);
      return wrap;
    };
  }

  /* ---------- طراحی دستی: همه چیز روی بوم قابل ویرایش ---------- */
  function unlockManualCanvas() {
    var host = $("manualDesignCanvas");
    if (!host) return;
    var clone = host.querySelector(".man-clone");
    if (!clone) return;
    clone.classList.add("man-design-mode");
    Array.prototype.forEach.call(clone.querySelectorAll(".jalali-badge, .jalali-input-wrapper, .jalali-helper-text"), function (el) {
      el.style.pointerEvents = "none";
    });
    Array.prototype.forEach.call(clone.querySelectorAll("[data-man-skip='1']"), function (el) {
      if (el.classList && el.classList.contains("card-header")) return;
      el.removeAttribute("data-man-skip");
    });
    var targets = [];
    function take(el) {
      if (!el || el.getAttribute("data-man-skip") === "1") return;
      if (el.closest(".man-toolbar") || el.closest("#manualTabGrid")) return;
      if (targets.indexOf(el) !== -1) return;
      targets.push(el);
    }
    Array.prototype.forEach.call(clone.querySelectorAll(".card, .col-user-box, .stat-card, .map-container, .form-group, button.btn, .btn-toggle-option"), function (el) {
      if (el.classList.contains("form-group") && el.querySelector(":scope > .form-group")) return;
      if (el.id && /CustomFieldsContainer|cfHost-/.test(el.id)) return;
      if (el.closest && el.closest(".card-header") && el.tagName === "BUTTON" && /صفحه اصلی|بازگشت/.test(el.textContent || "")) return;
      take(el);
    });
    targets.forEach(function (el, i) {
      if (!el.classList.contains("man-item")) el.classList.add("man-item");
      if (getComputedStyle(el).position === "static") el.style.position = "relative";
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
      if (!el.getAttribute("data-man-id")) {
        var sid = el.getAttribute("data-src-id") || el.getAttribute("data-col-fid") || el.id || ("man-auto-" + i);
        el.setAttribute("data-man-id", String(sid).replace(/^man-/, ""));
      }
    });
    if (typeof window.lockManualDesigner === "function") {
      try { window.lockManualDesigner(); } catch (e) {}
    }
  }

  function watchManual() {
    var host = $("manualDesignCanvas");
    if (!host || host.dataset.v18man === "1") return;
    host.dataset.v18man = "1";
    var t;
    new MutationObserver(function () {
      clearTimeout(t);
      t = setTimeout(unlockManualCanvas, 80);
    }).observe(host, { childList: true, subtree: true });
  }

  /* ---------- کپی همه / انتخابی ---------- */
  function featureCatalog(tabId) {
    var key = fieldKeyForTab(tabId);
    var out = [];
    ((state.customFields || {})[key] || []).forEach(function (f) {
      out.push({ type: "field", id: f.id, label: (f.label || f.id) + (String(f.inputKind || "").indexOf("widget-") === 0 ? " (کلید)" : " (فیلد)") });
    });
    ((state.formBoxes || {})[key] || []).forEach(function (b) {
      out.push({ type: "box", id: b.id, label: (b.label || b.id) + " (کادر)" });
    });
    var meta = ((state.formFieldMeta || {})[key]) || {};
    Object.keys(meta).forEach(function (id) {
      if (!meta[id]) return;
      out.push({ type: "meta", id: id, label: (meta[id].label || id) + " (تنظیم فیلد ثابت)" });
    });
    var lay = ((state.manualLayouts || {})[tabId] || {}).items || {};
    var n = Object.keys(lay).length;
    if (n) out.push({ type: "layout", id: "__layout__", label: "چیدمان دستی (" + n + " مورد)" });
    return out;
  }

  function mountCopyUi() {
    var from = $("manCopyFrom");
    var to = $("manCopyTo");
    if (!from || !to) return;
    var row = from.closest(".man-toolbar-row");
    if (row && !$("manCopyModeAll")) {
      var mode = document.createElement("div");
      mode.className = "man-toolbar-row man-copy-mode-row";
      mode.innerHTML =
        '<label class="man-copy-opt"><input type="radio" name="manCopyMode" id="manCopyModeAll" value="all" checked> کل امکانات تب</label>' +
        '<label class="man-copy-opt"><input type="radio" name="manCopyMode" id="manCopyModePart" value="part"> انتخاب بخشی از امکانات</label>';
      row.parentNode.insertBefore(mode, row.nextSibling);
    }
    if (!$("manCopyPickList")) {
      var pick0 = document.createElement("div");
      pick0.id = "manCopyPickList";
      pick0.className = "man-copy-pick";
      pick0.hidden = true;
      var after = $("manCopyModeAll") ? $("manCopyModeAll").closest(".man-toolbar-row") : row;
      if (after && after.parentNode) after.parentNode.insertBefore(pick0, after.nextSibling);
    }
    if (from.dataset.v18copy === "1") return;
    from.dataset.v18copy = "1";
    function syncPick() {
      var pick = $("manCopyPickList");
      if (!pick) return;
      var part = $("manCopyModePart") && $("manCopyModePart").checked;
      pick.hidden = !part;
      if (!part) return;
      var src = from.value;
      var feats = featureCatalog(src);
      if (!feats.length) {
        pick.innerHTML = "<p class='col-help'>در تب مبدأ فیلد/کادر/کلید سفارشی یا چیدمان دستی نیست. باز هم می‌توان کل تنظیمات و چیدمان را با گزینه «کل امکانات» کپی کرد.</p>";
        return;
      }
      pick.innerHTML = "<strong>امکانات مبدأ را تیک بزنید:</strong><div class='man-copy-checks'>" +
        feats.map(function (f) {
          return "<label class='col-box-chk'><input type='checkbox' class='man-copy-item' data-ctype='" + esc(f.type) + "' data-cid='" + esc(f.id) + "' checked> " + esc(f.label) + "</label>";
        }).join("") + "</div>";
    }
    Array.prototype.forEach.call(document.querySelectorAll("input[name='manCopyMode']"), function (r) {
      r.addEventListener("change", syncPick);
    });
    from.addEventListener("change", syncPick);
  }

  function copySelected(fromId, toId) {
    if (!fromId || !toId || fromId === toId) {
      alert("مبدأ و مقصد را جدا انتخاب کنید.");
      return;
    }
    if (!state.customFields) state.customFields = {};
    if (!state.formBoxes) state.formBoxes = {};
    if (!state.formFieldMeta) state.formFieldMeta = {};
    if (!state.manualLayouts) state.manualLayouts = {};
    var fromKey = fieldKeyForTab(fromId);
    var toKey = fieldKeyForTab(toId);
    var part = $("manCopyModePart") && $("manCopyModePart").checked;
    var allow = { field: {}, box: {}, meta: {}, layout: true };
    if (part) {
      allow.layout = false;
      var any = false;
      document.querySelectorAll(".man-copy-item").forEach(function (chk) {
        any = true;
        if (!chk.checked) return;
        var tp = chk.getAttribute("data-ctype");
        var id = chk.getAttribute("data-cid");
        if (tp === "layout") allow.layout = true;
        else if (allow[tp]) allow[tp][id] = true;
      });
      if (!any) {
        alert("حالت انتخابی است ولی فهرستی نیست. یک‌بار مبدأ را عوض کنید تا فهرست بیاید.");
        return;
      }
    }
    var copiedFields = 0, copiedBoxes = 0, copiedMeta = 0, copiedLay = 0;
    if (!state.customFields[toKey]) state.customFields[toKey] = [];
    ((state.customFields[fromKey] || [])).forEach(function (f) {
      if (part && !allow.field[f.id]) return;
      var dup = state.customFields[toKey].filter(function (x) {
        return x.inputKind === f.inputKind && x.label === f.label;
      })[0];
      if (dup) return;
      var neu = JSON.parse(JSON.stringify(f));
      neu.id = "cf-" + toKey + "-" + Date.now() + "-" + Math.floor(Math.random() * 999);
      state.customFields[toKey].push(neu);
      copiedFields += 1;
    });
    if (!state.formBoxes[toKey]) state.formBoxes[toKey] = [];
    ((state.formBoxes[fromKey] || [])).forEach(function (b) {
      if (part && !allow.box[b.id]) return;
      if (state.formBoxes[toKey].filter(function (x) { return x.label === b.label; })[0]) return;
      state.formBoxes[toKey].push({
        id: "box-" + toKey + "-" + Date.now() + "-" + Math.floor(Math.random() * 99),
        label: b.label,
        fieldIds: [],
        order: b.order || 1,
        size: b.size,
        height: b.height
      });
      copiedBoxes += 1;
    });
    if (!state.formFieldMeta[toKey]) state.formFieldMeta[toKey] = {};
    Object.keys((state.formFieldMeta[fromKey] || {})).forEach(function (id) {
      if (part && !allow.meta[id]) return;
      state.formFieldMeta[toKey][id] = JSON.parse(JSON.stringify(state.formFieldMeta[fromKey][id]));
      copiedMeta += 1;
    });
    if (!part || allow.layout) {
      var srcLay = ((state.manualLayouts[fromId] || {}).items) || {};
      state.manualLayouts[toId] = { items: JSON.parse(JSON.stringify(srcLay)), copiedFrom: fromId };
      copiedLay = Object.keys(srcLay).length;
    }
    if (typeof saveState === "function") saveState();
    if (typeof window.applyFullFormLayout === "function") {
      try { window.applyFullFormLayout(toId); } catch (e) {}
    }
    alert("کپی از مبدأ به مقصد انجام شد:\n• " + copiedFields + " فیلد/کلید\n• " + copiedBoxes + " کادر\n• " + copiedMeta + " تنظیم فیلد ثابت\n• " + copiedLay + " مورد چیدمان دستی");
  }

  function wrapCopy() {
    window.copyPageToTab = function (fromId, toId) {
      copySelected(fromId, toId);
    };
  }

  /* ---------- لیست: مرتب‌سازی با listOrder ---------- */
  function wrapListSort() {
    ["renderPharmaciesList", "renderDoctorsList", "renderOrdersList"].forEach(function (name) {
      if (typeof window[name] !== "function" || window["_v18" + name]) return;
      window["_v18" + name] = true;
      var orig = window[name];
      window[name] = function () {
        var r = orig.apply(this, arguments);
        try {
          var ent = name.indexOf("Pharm") !== -1 ? "pharmacy" : name.indexOf("Doc") !== -1 ? "doctor" : "order";
          var arr = (state.customFields && state.customFields[ent]) || [];
          arr.slice().sort(function (a, b) {
            var ao = Number(a.listOrder != null ? a.listOrder : a.order) || 999;
            var bo = Number(b.listOrder != null ? b.listOrder : b.order) || 999;
            return ao - bo;
          });
        } catch (e) {}
        return r;
      };
    });
  }

  function boot() {
    try { disableNativeRequired(); } catch (e) {}
    try { stripAllBlackStars(document); } catch (e) {}
    try { seedRequiredMeta(); } catch (e) {}
    try { wrapValidate(); } catch (e) {}
    try { upgradeProdFieldBar(); } catch (e) {}
    try { watchDesignerPanel(); } catch (e) {}
    try { refreshExtraInfoTables(); } catch (e) {}
    try { unifyButtons(document); } catch (e) {}
    try { wrapConfirms(); } catch (e) {}
    try { enhanceWidgetActions(); } catch (e) {}
    try { watchManual(); } catch (e) {}
    try { mountCopyUi(); } catch (e) {}
    try { wrapCopy(); } catch (e) {}
    try { wrapListSort(); } catch (e) {}
    try {
      if (typeof window.applyAllFormLayouts === "function") window.applyAllFormLayouts();
    } catch (e) {}

    var origSw = window.switchTab;
    if (typeof origSw === "function" && !window._v18Sw) {
      window._v18Sw = true;
      window.switchTab = function (id) {
        origSw(id);
        setTimeout(function () {
          stripAllBlackStars(document.getElementById(id) || document);
          disableNativeRequired();
          unifyButtons(document.getElementById(id) || document);
          if (id === "tab-columns-products") {
            upgradeProdFieldBar();
            refreshExtraInfoTables();
          }
          if (id === "tab-manual-design") {
            mountCopyUi();
            unlockManualCanvas();
          }
        }, 180);
      };
    }
    console.log("v18 ready", VER);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
