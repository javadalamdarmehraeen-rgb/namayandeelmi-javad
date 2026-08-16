// ============================================================
// v20 (نسخه 11.16.0) — لایه آخر؛ فقط افزودنی/بازنویسی امن، بدون حذف اسکلت
// ۱) در دسترس بودن state برای عیب‌یابی
// ۲) تکراری‌گیر دقیق: اطلاعات کاملاً یکسان ⇒ قفل کامل (فقط ویرایش) — نزدیک ⇒ تأیید/انصراف
// ۳) مدیر پیشرفته کشویی‌ها در تب افزودن‌ها: زیرمجموعه‌ها زیر هم + ویرایش/حذف هرکدام
//    + جستجوی لحظه‌ای + نام فارسی + اعمال فوری افزودن/حذف فیلد کشویی
// ۴) زنجیره طوسی فیلدها (غیرفعال تا پر شدن والد) + تنظیم توسط مدیر + کلید کلی
// ۵) قفل طوسی فرم سفارش تا انتخاب/جایگذاری داروخانه (فقط بخش کالا فعال می‌ماند)
// ۶) افزودن لحظه‌ای نام داروخانه در فرم داروخانه = ذخیره خودکار رکورد
// ۷) همگام‌سازی خودکار فیلدهای افزوده/حذف‌شده داروخانه ↔ سفارشات
// ۸) رفع نقص ورود فیلد جدید به باکس کالا + اعمال اندازه و شماره ترتیب
// ۹) اعمال قطعی «شماره ترتیب لیست» روی جدول‌ها (ردیف=ستون ۱، نام نماینده=ستون ۲)
// ۱۰) دکمه «تغییر رمز» بالای همه صفحه‌ها برای هر کاربر (ثبت در سیستم ورود)
// ۱۱) سطوح دسترسی آماده: نماینده علمی / کارشناس فروش / سرپرست
// ۱۲) حذف فلش‌های بالا/پایین اعداد تعداد کالا و جایزه در سفارش
// ============================================================
(function () {
  "use strict";

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  // نرمال‌سازی برای مقایسه دقیق (ارقام فارسی/عربی، یکسان‌سازی حروف، حذف فاصله و خط‌تیره)
  function norm(v) {
    var FA = "۰۱۲۳۴۵۶۷۸۹", AR = "٠١٢٣٤٥٦٧٨٩";
    return String(v == null ? "" : v)
      .replace(/[۰-۹]/g, function (c) { return String(FA.indexOf(c)); })
      .replace(/[٠-٩]/g, function (c) { return String(AR.indexOf(c)); })
      .replace(/[يى]/g, "ی").replace(/ك/g, "ک").replace(/‌/g, " ")
      .replace(/[\s\-ـ]+/g, "").trim().toLowerCase();
  }
  function st() { return window.state || null; }
  function save() { try { if (typeof saveState === "function") saveState(); } catch (e) {} }
  function log(m) { try { console.log("[v20]", m); } catch (e) {} }

  /* ---------- ۱) state برای عیب‌یابی ---------- */
  try {
    Object.defineProperty(window, "state", {
      configurable: true,
      get: function () {
        try { return (typeof state !== "undefined") ? state : undefined; } catch (e) { return undefined; }
      }
    });
  } catch (e) {}

  /* ---------- ۱۲+۴+۵) استایل‌های تزریقی ---------- */
  (function injectCss() {
    var css =
      "#orderItemsContainer input[type=number]::-webkit-outer-spin-button," +
      "#orderItemsContainer input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;margin:0;}" +
      "#orderItemsContainer input[type=number]{-moz-appearance:textfield;appearance:textfield;}" +
      ".v20-grey,.v20-grey:disabled{background:#e5e7eb!important;color:#6b7280!important;" +
      "cursor:not-allowed!important;opacity:.85!important;border-color:#d1d5db!important;}" +
      ".crm-combo.v20-locked{pointer-events:none;}" +
      ".v20-grey-zone .form-label{color:#9ca3af!important;}" +
      ".v20-cards{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(min(260px,100%),1fr))!important;gap:12px;align-items:start;width:100%;}" +
      ".v20-combo-card{min-width:0!important;width:auto!important;margin:0!important;}" +
      ".v20-local-match{position:sticky;top:8px;z-index:40;margin:8px 0;box-shadow:0 5px 18px rgba(15,23,42,.16);}" +
      ".v20-visit-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:10px;margin:12px 0;}" +
      ".v20-metric{background:#f0fdfa;border:1px solid #99f6e4;border-radius:12px;padding:12px;text-align:center}.v20-metric b{display:block;font-size:1.2rem;color:#0f766e;margin-top:4px;}" +
      ".v20-version{background:#312e81;color:#fff;border-radius:999px;padding:5px 10px;font-weight:800;white-space:nowrap;}" +
      "#v20ChpassFab{background:#0d9488;color:#fff;border:none;border-radius:10px;padding:8px 14px;" +
      "font-weight:700;cursor:pointer;font-family:inherit;font-size:.85rem;margin:0 6px;vertical-align:middle;}" +
      "#v20ChpassFab:hover{background:#0f766e;}" +
      ".v20-toast{position:fixed;bottom:24px;right:24px;background:#065f46;color:#fff;padding:12px 20px;" +
      "border-radius:12px;box-shadow:0 6px 24px rgba(0,0,0,.3);z-index:1400;font-weight:700;direction:rtl;}" +
      ".v20-modal{position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:1300;display:flex;" +
      "align-items:center;justify-content:center;}" +
      ".v20-modal-card{background:#fff;border-radius:14px;padding:22px;min-width:300px;max-width:92vw;" +
      "box-shadow:0 10px 40px rgba(0,0,0,.35);direction:rtl;}" +
      ".v20-modal-card input{width:100%;margin:6px 0;padding:9px;border:1px solid #cbd5e1;border-radius:8px;box-sizing:border-box;}" +
      ".v20-opt-row{display:flex;align-items:center;gap:6px;padding:5px 8px;border:1px solid #e2e8f0;" +
      "border-radius:8px;margin-top:5px;background:#fff;}" +
      ".v20-opt-row span{flex:1;}" +
      ".v20-opt-row button{border:1px solid #cbd5e1;background:#f8fafc;border-radius:7px;cursor:pointer;padding:2px 8px;}" +
      ".v20-combo-card{border:1px solid #dbe2ea;border-radius:12px;padding:12px;background:#fbfdff;}" +
      ".v20-combo-card h5{margin:0 0 8px;color:#0f172a;}" +
      ".v20-card-tools{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:6px;}" +
      ".v20-card-tools input[type=text]{flex:1;min-width:140px;padding:8px;border:1px solid #cbd5e1;border-radius:8px;}" +
      ".v20-mini{font-size:.78rem;color:#64748b;}" +
      ".v20-tabbar{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0;}" +
      ".v20-tabbar button{border:1px solid #cbd5e1;background:#fff;border-radius:9px;padding:7px 14px;cursor:pointer;font-family:inherit;}" +
      ".v20-tabbar button.v20-on{background:#0d9488;color:#fff;border-color:#0d9488;}";
    var tag = document.createElement("style");
    tag.id = "v20Style";
    tag.textContent = css;
    (document.head || document.documentElement).appendChild(tag);
  })();

  /* ---------- ۲) تکراری‌گیر دقیق ---------- */
  function dupPairs(isDoc) {
    return isDoc
      ? [["name", "doctorName"], ["phone", "doctorPhone"], ["specialty", "doctorSpecialty"],
         ["province", "doctorProvince"], ["city", "doctorCity"], ["district", "doctorDistrict"], ["address", "doctorAddress"]]
      : [["name", "pharmacyName"], ["phone", "pharmacyPhone"], ["manager", "pharmacyManager"],
         ["province", "pharmacyProvince"], ["city", "pharmacyCity"], ["district", "pharmacyDistrict"], ["address", "pharmacyAddress"]];
  }
  function gvById(id) { var e = $(id); return e ? String(e.value || "") : ""; }
  function v20SigOf(kind) {
    var isDoc = kind === "doctor";
    var parts = dupPairs(isDoc).map(function (p) { return norm(gvById(p[1])); });
    return kind + "|" + parts.join("|");
  }
  window.v20DupGate = function (kind) {
    try {
      var isDoc = kind === "doctor";
      var S = st(); if (!S) return true;
      var list = isDoc ? (S.doctors || []) : (S.pharmacies || []);
      var pairs = dupPairs(isDoc);
      var draft = {};
      pairs.forEach(function (p) { draft[p[0]] = norm(gvById(p[1])); });
      // رکوردی که همین الان در حال ویرایشش هستیم از بررسی تکراری خارج می‌شود
      var editEl = $(isDoc ? "doctorEditId" : "pharmacyEditId");
      var editingId = editEl ? String(editEl.value || "") : "";
      var title = isDoc ? "پزشک/مطب" : "داروخانه";
      var listFa = isDoc ? "پزشکان" : "داروخانه‌ها";
      var exact = null, partial = false;
      list.forEach(function (r) {
        if (editingId && String(r.id) === editingId) return;
        var allSame = true, anyVal = false;
        pairs.forEach(function (p) {
          var a = draft[p[0]];
          var b = norm(r[p[0]] == null ? "" : r[p[0]]);
          if (a) anyVal = true;
          if (a !== b) allSame = false;
        });
        if (allSame && anyVal && draft.name) exact = r;
        if (draft.name && norm(r.name) === draft.name) partial = true;
        if (draft.phone && norm(r.phone || "") === draft.phone) partial = true;
      });
      if (exact) {
        var sig = v20SigOf(kind);
        if (window._v20AutoSaveSig === sig && (Date.now() - (window._v20AutoSaveT || 0)) < 120000) {
          alert("✔ این " + title + " همین چند لحظه پیش با موفقیت ثبت شد؛ نیازی به ثبت دوباره نیست.");
          return false;
        }
        alert("⛔ این " + title + " قبلاً با دقیقاً همین اطلاعات ثبت شده است" +
          (exact.repName ? " (توسط «" + exact.repName + "»)" : "") +
          ".\n\nثبت مجدد مجاز نیست؛ برای تغییر، از لیست «" + listFa + "» دکمه ✏️ ویرایش همان رکورد را بزنید.");
        return false;
      }
      if (partial) {
        return window.confirm("هشدار: " + title + (isDoc ? "ی" : "‌ای") + " با این نام یا تلفن قبلاً ثبت شده است.\n\nتأیید/بله = با این حال ذخیره شود  |  انصراف/خیر = ذخیره نشود");
      }
      return true;
    } catch (e) {
      return true;
    }
  };

  /* ---------- ۳) مدیر کشویی‌های افزودن‌ها ---------- */
  var V20_PANES = [
    ["tab-pharmacies", "🏥 داروخانه‌ها"],
    ["tab-doctors", "👨‍⚕️ پزشکان"],
    ["tab-orders", "📦 سفارشات"],
    ["tab-columns-products", "💊 کالاها"],
    ["tab-users-permissions", "👤 کاربران"]
  ];
  var v20AddPane = "tab-pharmacies";

  var V20_FA_IDS = {
    pharmacyName: "نام داروخانه", pharmacyProvince: "استان", pharmacyCity: "شهر", pharmacyDistrict: "منطقه",
    pharmacyType: "نوع داروخانه", pharmacyCategory: "نوع داروخانه", pharmacyIsPercentage: "وضعیت درصدی داروخانه", pharmacyPhone: "تلفن داروخانه",
    pharmacyAddress: "آدرس دقیق داروخانه", pharmacyManager: "نام مسئول داروخانه",
    doctorName: "نام پزشک", doctorSpecialty: "تخصص پزشک", doctorProvince: "استان", doctorCity: "شهر", doctorDistrict: "منطقه",
    doctorPhone: "تلفن پزشک", doctorAddress: "آدرس دقیق مطب", doctorIsPercentage: "وضعیت درصدی پزشک",
    orderPharmacyName: "نام داروخانه", orderProvince: "استان", orderCity: "شهر", orderDistrict: "منطقه",
    orderRepName: "نام نماینده", orderStatus: "وضعیت سفارش", orderDate: "تاریخ سفارش",
    cfTargetEntity: "تب مربوطه", cfType: "نوع فیلد"
  };
  function faLabel(el, pane) {
    var lab = (pane && el.id) ? pane.querySelector('label[for="' + el.id + '"]') : null;
    var t = lab ? lab.textContent : "";
    if (!t) {
      var g = el.closest ? el.closest(".form-group") : null;
      var l2 = g ? g.querySelector(".form-label, label") : null;
      if (l2) t = l2.textContent;
    }
    if (!t && el.getAttribute) t = el.getAttribute("placeholder") || "";
    t = String(t || "").replace(/\*/g, "").replace(/\(.*?\)/g, "").replace(/\s+/g, " ").trim();
    // اگر برچسب خالی یا انگلیسی بود، از واژه‌نامه فارسی استفاده شود
    if (!t || /^[A-Za-z0-9_\-\s]+$/.test(t)) t = V20_FA_IDS[el.id] || t;
    return t || "";
  }
  function isDatePartField(id, label) {
    if (/year|month|jyear|jmonth|روز/i.test(String(id))) return true;
    if (/^(سال|ماه|روز)$/.test(String(label))) return true;
    return false;
  }

  function collectCombos(paneId) {
    var pane = $(paneId);
    if (!pane) return [];
    var out = [], seen = {};
    function skipped(el) {
      return el.closest("#columnsDesignerHost") || el.closest("#jalaliCalendarPopup") ||
        el.closest(".modal-overlay") || el.closest("#addTabGrid") || el.closest("#addTabPanel") ||
        el.closest("#v20PresetBar");
    }
    Array.prototype.forEach.call(pane.querySelectorAll("select[id]"), function (sel) {
      if (!sel.id || seen[sel.id] || skipped(sel)) return;
      if (sel.id.indexOf("jalali") === 0 || sel.id.indexOf("v20") === 0) return;
      var lab = faLabel(sel, pane);
      // برای کشویی‌های کمبووشده، برچسب از ورودی دیداری خوانده شود
      if (!lab) {
        var combo = sel.closest(".crm-combo");
        var vis = combo ? combo.querySelector(".crm-combo-input") : null;
        if (vis) lab = faLabel(vis, pane);
      }
      if (isDatePartField(sel.id, lab)) return; // سال/ماه تاریخ شمسی در این بخش نیاید (مثل بقیه کشویی‌ها)
      seen[sel.id] = true;
      var opts = [];
      Array.prototype.forEach.call(sel.options, function (o, i) {
        var v = String(o.value == null ? "" : o.value);
        var t = String(o.textContent || "");
        if (i === 0 && !v) return; // جای‌نگهدار «انتخاب کنید...»
        opts.push({ v: v, t: t });
      });
      out.push({ el: sel, id: sel.id, label: lab, opts: opts });
    });
    // ورودی‌های متصل به datalist (کشویی تایپ‌شونده)
    Array.prototype.forEach.call(pane.querySelectorAll("input[list][id]"), function (inp) {
      if (seen[inp.id] || skipped(inp)) return;
      if (inp.id.indexOf("v20") === 0) return;
      var lab2 = faLabel(inp, pane);
      if (isDatePartField(inp.id, lab2)) return;
      var dl = $(inp.getAttribute("list"));
      if (!dl) return;
      seen[inp.id] = true;
      var opts = [];
      Array.prototype.forEach.call(dl.options, function (o) {
        var v = String(o.value || o.textContent || "");
        if (v) opts.push({ v: v, t: v });
      });
      out.push({ el: inp, id: inp.id, label: lab2, opts: opts, datalist: dl });
    });
    return out;
  }

  function persistAdd(storeId, val) {
    var S = st(); if (!S) return;
    S.selectExtraOptions = S.selectExtraOptions || {};
    S.selectExtraOptions[storeId] = S.selectExtraOptions[storeId] || [];
    if (S.selectExtraOptions[storeId].indexOf(val) === -1) { S.selectExtraOptions[storeId].push(val); save(); }
  }
  function persistRemove(storeId, val) {
    var S = st(); if (!S) return;
    var arr = (S.selectExtraOptions || {})[storeId];
    if (arr) { var i = arr.indexOf(val); if (i >= 0) arr.splice(i, 1); }
    S.v20HiddenOptions = S.v20HiddenOptions || {};
    S.v20HiddenOptions[storeId] = S.v20HiddenOptions[storeId] || [];
    if (S.v20HiddenOptions[storeId].indexOf(val) === -1) S.v20HiddenOptions[storeId].push(val);
    save();
  }
  function persistRename(storeId, oldV, newV) {
    var S = st(); if (!S) return;
    var arr = (S.selectExtraOptions || {})[storeId];
    if (arr && arr.indexOf(oldV) >= 0) { arr[arr.indexOf(oldV)] = newV; }
    else {
      S.v20Renames = S.v20Renames || {};
      S.v20Renames[storeId] = S.v20Renames[storeId] || {};
      S.v20Renames[storeId][oldV] = newV;
    }
    save();
  }

  function optionRowsHtml(entry) {
    var h = "";
    entry.opts.forEach(function (o) {
      h += "<div class='v20-opt-row' data-v='" + esc(o.v) + "'>" +
        "<span>" + esc(o.t || o.v) + "</span>" +
        "<button type='button' class='v20-opt-edit' data-store='" + esc(entry.id) + "' data-v='" + esc(o.v) + "' title='ویرایش'>✏️</button>" +
        "<button type='button' class='v20-opt-del' data-store='" + esc(entry.id) + "' data-v='" + esc(o.v) + "' title='حذف'>🗑️</button>" +
        "</div>";
    });
    return h || "<div class='v20-mini'>گزینه‌ای ثبت نشده است.</div>";
  }

  function greyParentOptions(entry, paneId) {
    var pane = $(paneId); if (!pane) return "";
    var h = "<option value=''>— بدون زنجیره —</option>";
    Array.prototype.forEach.call(pane.querySelectorAll("select[id], input[id]"), function (el) {
      if (!el.id || el.id === entry.id) return;
      if (el.closest("#addTabPanel") || el.closest("#columnsDesignerHost") || el.closest(".modal-overlay")) return;
      if (el.id.indexOf("v20") === 0) return;
      var lab = faLabel(el, pane) || el.id;
      var cur = (st() && st().v20GreyMap && st().v20GreyMap[entry.id]) || "";
      h += "<option value='" + esc(el.id) + "'" + (cur === el.id ? " selected" : "") + ">" + esc(lab) + "</option>";
    });
    return h;
  }

  window.v20RenderComboManager = function () {
    var host = $("addTabPanel");
    if (!host || !document.getElementById("tab-custom-fields")) return;
    var entries = collectCombos(v20AddPane);
    var S = st() || {};
    var greyOn = !(S.settings && S.settings.v20GreyOn === false);
    var lockOn = !(S.settings && S.settings.v20OrderLock === false);
    var tabs = "";
    V20_PANES.forEach(function (p) {
      tabs += "<button type='button' class='" + (p[0] === v20AddPane ? "v20-on" : "") + "' data-pane='" + p[0] + "'>" + p[1] + "</button>";
    });
    var h = "<div class='v20-addmgr' style='border-top:2px solid #e2e8f0;padding-top:10px;'>" +
      "<h4 style='margin:8px 0;color:#0f172a;'>🎛️ مدیر کشویی‌ها (نسخه ۱۱.۱۶) — هر فیلد، زیرمجموعه‌هایش دقیقاً زیر همان فیلد است</h4>" +
      "<div class='v20-tabbar'>" + tabs + "</div>" +
      "<div class='v20-card-tools' style='margin-bottom:4px'>" +
      "<label class='v20-mini'><input type='checkbox' id='v20GreyOnChk'" + (greyOn ? " checked" : "") + "> حالت طوسی زنجیره‌ای فعال باشد</label>" +
      "<label class='v20-mini'><input type='checkbox' id='v20OrderLockChk'" + (lockOn ? " checked" : "") + "> قفل طوسی فرم سفارش تا انتخاب داروخانه فعال باشد</label>" +
      "</div>";
    h += "<div class='v20-cards'>";
    if (!entries.length) h += "<div class='v20-mini'>در این تب فیلد کشویی پیدا نشد.</div>";
    entries.forEach(function (en) {
      var parentSel = en.el.tagName === "SELECT" ? greyParentOptions(en, v20AddPane) : "";
      h += "<div class='v20-combo-card' data-store='" + esc(en.id) + "'>" +
        "<h5>🔽 " + esc(en.label || V20_FA_IDS[en.id] || "فیلد کشویی") + "</h5>" +
        "<div class='v20-card-tools'>" +
        "<input type='text' class='v20-search' placeholder='🔍 جستجوی لحظه‌ای در زیرمجموعه‌ها...'>" +
        "<input type='text' class='v20-newopt' placeholder='گزینه جدید...' style='flex:.8'>" +
        "<button type='button' class='v20-addopt' data-store='" + esc(en.id) + "' style='padding:7px 12px;border:1px solid #0d9488;background:#0d9488;color:#fff;border-radius:8px;cursor:pointer;'>➕ افزودن</button>" +
        (parentSel ? "<label class='v20-mini'>طوسی تا انتخاب: <select class='v20-grey-sel' data-store='" + esc(en.id) + "'>" + parentSel + "</select></label>" : "") +
        "</div>" +
        "<div class='v20-opts' data-store='" + esc(en.id) + "'>" + optionRowsHtml(en) + "</div>" +
        "</div>";
    });
    h += "</div>"; // پایان .v20-cards
    h += "</div>"; // پایان .v20-addmgr
    var old = host.querySelector(".v20-addmgr");
    if (old) old.parentNode.removeChild(old);
    var div = document.createElement("div");
    div.innerHTML = h;
    // مدیر جدید همیشه ابتدای تب دیده شود؛ کاربر مجبور به اسکرول زیر پنل قدیمی نباشد.
    host.insertBefore(div.firstChild, host.firstChild);
    bindManager(host);
    v20RenderEntityManager();
  };

  function bindManager(host) {
    Array.prototype.forEach.call(host.querySelectorAll(".v20-tabbar button"), function (b) {
      b.addEventListener("click", function () { v20AddPane = b.getAttribute("data-pane"); window.v20RenderComboManager(); });
    });
    var g1 = host.querySelector("#v20GreyOnChk");
    if (g1) g1.addEventListener("change", function () { var S = st(); if (!S) return; S.settings = S.settings || {}; S.settings.v20GreyOn = g1.checked; save(); v20ApplyGreyChains(); v20ApplyOrderLock(); });
    var g2 = host.querySelector("#v20OrderLockChk");
    if (g2) g2.addEventListener("change", function () { var S = st(); if (!S) return; S.settings = S.settings || {}; S.settings.v20OrderLock = g2.checked; save(); v20ApplyOrderLock(); });

    Array.prototype.forEach.call(host.querySelectorAll(".v20-card-tools .v20-search"), function (inp) {
      inp.addEventListener("input", function () {
        var card = inp.closest(".v20-combo-card");
        var q = norm(inp.value);
        Array.prototype.forEach.call(card.querySelectorAll(".v20-opt-row"), function (row) {
          row.style.display = (!q || norm(row.getAttribute("data-v")).indexOf(q) >= 0) ? "" : "none";
        });
      });
    });
    Array.prototype.forEach.call(host.querySelectorAll(".v20-addopt"), function (b) {
      b.addEventListener("click", function () {
        var card = b.closest(".v20-combo-card");
        var inp = card.querySelector(".v20-newopt");
        var val = String(inp.value || "").trim();
        if (!val) { alert("متن گزینه جدید را بنویسید."); return; }
        var id = b.getAttribute("data-store");
        var el = $(id);
        if (el && el.tagName === "SELECT") {
          var o = document.createElement("option"); o.value = val; o.textContent = val; el.appendChild(o);
        } else if (el && el.getAttribute("list") && $(el.getAttribute("list"))) {
          var o2 = document.createElement("option"); o2.value = val; $(el.getAttribute("list")).appendChild(o2);
        }
        persistAdd(id, val);
        log("گزینه اضافه شد: " + id + " ← " + val);
        window.v20RenderComboManager();
      });
    });
    Array.prototype.forEach.call(host.querySelectorAll(".v20-opt-edit"), function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-store"), oldV = b.getAttribute("data-v");
        var nw = prompt("ویرایش زیرمجموعه:\n«" + oldV + "» به:", oldV);
        if (nw === null) return;
        nw = String(nw).trim();
        if (!nw || nw === oldV) return;
        var el = $(id);
        if (el && el.tagName === "SELECT") {
          Array.prototype.forEach.call(el.options, function (o) { if (String(o.value) === oldV) { o.value = nw; o.textContent = nw; } });
        }
        persistRename(id, oldV, nw);
        window.v20RenderComboManager();
      });
    });
    Array.prototype.forEach.call(host.querySelectorAll(".v20-opt-del"), function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-store"), v = b.getAttribute("data-v");
        if (!window.confirm("زیرمجموعه «" + v + "» حذف شود؟")) return;
        var el = $(id);
        if (el && el.tagName === "SELECT") {
          Array.prototype.slice.call(el.options).forEach(function (o) { if (String(o.value) === v) el.removeChild(o); });
        } else if (el && el.getAttribute("list") && $(el.getAttribute("list"))) {
          var dl = $(el.getAttribute("list"));
          Array.prototype.slice.call(dl.options).forEach(function (o) { if (String(o.value) === v) dl.removeChild(o); });
        }
        persistRemove(id, v);
        window.v20RenderComboManager();
      });
    });
    Array.prototype.forEach.call(host.querySelectorAll(".v20-grey-sel"), function (sel) {
      sel.addEventListener("change", function () {
        var S = st(); if (!S) return;
        S.v20GreyMap = S.v20GreyMap || {};
        var id = sel.getAttribute("data-store");
        if (sel.value) S.v20GreyMap[id] = sel.value; else delete S.v20GreyMap[id];
        save();
        v20ApplyGreyChains();
      });
    });
  }

  /* ---------- ۴) موتور زنجیره طوسی ---------- */
  function setFieldGrey(el, grey) {
    var y = window.scrollY;
    try {
      el.disabled = !!grey;
      el.classList.toggle("v20-grey", !!grey);
      var combo = el.closest ? el.closest(".crm-combo") : null;
      if (combo) {
        combo.classList.toggle("v20-locked", !!grey);
        var inp = combo.querySelector(".crm-combo-input");
        if (inp) { inp.disabled = !!grey; inp.classList.toggle("v20-grey", !!grey); }
      }
      var fg = el.closest ? el.closest(".form-group") : null;
      if (fg) fg.classList.toggle("v20-grey-zone", !!grey);
    } catch (e) {}
    if (window.scrollY !== y) window.scrollTo(0, y);
  }
  function seedGreyDefaults() {
    var S = st(); if (!S || S._v20GreySeeded) return;
    S.v20GreyMap = S.v20GreyMap || {};
    [["pharmacyCity", "pharmacyProvince"], ["pharmacyDistrict", "pharmacyCity"],
     ["doctorCity", "doctorProvince"], ["doctorDistrict", "doctorCity"],
     ["orderCity", "orderProvince"], ["orderDistrict", "orderCity"]].forEach(function (p) {
      if (!(p[0] in S.v20GreyMap)) S.v20GreyMap[p[0]] = p[1];
    });
    S._v20GreySeeded = true;
    save();
  }
  function v20ApplyGreyChains() {
    var S = st(); if (!S) return;
    var on = !(S.settings && S.settings.v20GreyOn === false);
    var y = window.scrollY;
    Object.keys(S.v20GreyMap || {}).forEach(function (id) {
      var el = $(id); if (!el) return;
      // قفل سفارشات مالک فیلدهای سفارش است
      if (id.indexOf("order") === 0 && !(S.settings && S.settings.v20OrderLock === false)) return;
      var pEl = $(S.v20GreyMap[id]);
      var locked = on && pEl && !String(pEl.value || "").trim();
      setFieldGrey(el, locked);
    });
    if (window.scrollY !== y) window.scrollTo(0, y);
  }
  window.v20ApplyGreyChains = v20ApplyGreyChains;

  /* ---------- ۵) قفل طوسی فرم سفارش ---------- */
  var ORDER_DESCRIPTORS = ["orderProvince", "orderCity", "orderDistrict", "orderAddress", "orderRepName"];
  var ORDER_PRODUCT_SCOPE = "#orderItemsContainer, #orderProductCatalogBar, #orderProductCatalogList, #orderTotalsArea";
  function orderMatched() { return !!(($("orderPharmacyMatchedId") || {}).value); }
  function v20ApplyOrderLock() {
    var pane = $("tab-orders"); if (!pane) return;
    var S = st(); if (!S) return;
    var on = !(S.settings && S.settings.v20OrderLock === false);
    var inputs = pane.querySelectorAll("input, select, textarea");
    var y = window.scrollY;
    if (!on) {
      Array.prototype.forEach.call(inputs, function (el) { setFieldGrey(el, false); });
      return;
    }
    var locked = !orderMatched();
    Array.prototype.forEach.call(inputs, function (el) {
      if (!el.id || el.type === "hidden") return;
      // نام داروخانه و همه فیلدهای بخش کالا: همیشه فعال و عادی
      if (el.id === "orderPharmacyName") { setFieldGrey(el, false); return; }
      if (el.closest && el.closest(ORDER_PRODUCT_SCOPE)) { setFieldGrey(el, false); return; }
      // فیلدهای توصیفی داروخانه: طوسی (اطلاعات سر جای خودش می‌نشیند)
      if (ORDER_DESCRIPTORS.indexOf(el.id) >= 0) { setFieldGrey(el, true); return; }
      // بقیه فیلدها: تا انتخاب/جایگذاری داروخانه طوسی‌اند
      setFieldGrey(el, locked);
    });
    if (window.scrollY !== y) window.scrollTo(0, y);
  }
  window.v20ApplyOrderLock = v20ApplyOrderLock;

  /* ---------- ۶) افزودن لحظه‌ای نام = ذخیره خودکار (بدون تکرار کاذب) ---------- */
  function v20Toast(msg) {
    try {
      var d = document.createElement("div");
      d.className = "v20-toast";
      d.textContent = msg;
      document.body.appendChild(d);
      setTimeout(function () { try { d.parentNode.removeChild(d); } catch (e) {} }, 3200);
    } catch (e) {}
  }
  function bindInstantAddSave() {
    document.addEventListener("click", function (e) {
      var b = e.target && e.target.closest ? e.target.closest("button") : null;
      if (!b) return;
      var t = String(b.textContent || "").trim();
      if (t.indexOf("➕ افزودن") !== 0) return;
      var pane = b.closest("#tab-pharmacies, #tab-doctors");
      if (!pane) return;
      var isDoc = pane.id === "tab-doctors";
      setTimeout(function () {
        var nameInp = $(isDoc ? "doctorName" : "pharmacyName");
        var val = nameInp ? String(nameInp.value || "").trim() : "";
        if (!val) return;
        var kind = isDoc ? "doctor" : "pharmacy";
        var sig = v20SigOf(kind);
        // اگر همین رکورد لحظاتی پیش با همین امضا ذخیره شد، دوباره ذخیره نکن
        if (window._v20AutoSaveSig === sig && (Date.now() - (window._v20AutoSaveT || 0)) < 120000) {
          v20Toast("این رکورد همین الان ذخیره شده؛ دوباره ثبت نمی‌شود.");
          return;
        }
        var S = st();
        var before = S ? (isDoc ? (S.doctors || []).length : (S.pharmacies || []).length) : 0;
        window._v20AutoSaveSig = sig;
        window._v20AutoSaveT = Date.now();
        var saveBtn = $(isDoc ? "btnSaveDoctor" : "btnSavePharmacy");
        if (saveBtn) {
          log("افزودن لحظه‌ای ⇒ ذخیره خودکار رکورد");
          saveBtn.click();
          setTimeout(function () {
            var S2 = st();
            var after = S2 ? (isDoc ? (S2.doctors || []).length : (S2.pharmacies || []).length) : 0;
            if (after > before) v20Toast("✅ «" + val + "» ثبت شد.");
          }, 240);
        }
      }, 90);
    }, true);
  }

  /* ---------- ۷) همگام‌سازی فیلدهای داروخانه ↔ سفارشات ---------- */
  function mirrorPharmacyFieldsToOrder(boot) {
    var S = st(); if (!S) return;
    S.customFields = S.customFields || {};
    var ph = S.customFields.pharmacy || [];
    S.customFields.order = S.customFields.order || [];
    var or = S.customFields.order;
    var moved = 0;
    ph.forEach(function (f) {
      if (!f || !f.id) return;
      var mirrorId = "ordm-" + f.id;
      var exists = or.some(function (g) { return g && (g.id === mirrorId || g.label === f.label); });
      if (!exists) {
        var clone = {};
        Object.keys(f).forEach(function (k) { clone[k] = f[k]; });
        clone.id = mirrorId;
        or.push(clone);
        moved++;
      }
    });
    if (moved) {
      save();
      log("همگام فیلد داروخانه→سفارش: " + moved + " فیلد");
      try { if (typeof window.applyFullFormLayout === "function") window.applyFullFormLayout("tab-orders"); } catch (e) {}
      try { if (typeof window.renderExtraTabCustomFields === "function") window.renderExtraTabCustomFields("order"); } catch (e) {}
    }
    if (boot) S._v20MirrorBoot = true;
  }
  function bindMirror() {
    document.addEventListener("click", function (e) {
      var t = e.target;
      if (t && t.id === "btnSaveCustomField") {
        setTimeout(function () {
          try {
            var ent = ($("cfTargetEntity") || {}).value;
            if (ent === "pharmacy") mirrorPharmacyFieldsToOrder(false);
            if (ent === "products") renderProductExtras();
          } catch (err) {}
        }, 150);
      }
    });
    // حذف فیلد داروخانه ⇒ حذف آینه‌ای از سفارش
    var od = window.deleteCustomField;
    if (typeof od === "function") {
      window.deleteCustomField = function (entity, fieldId) {
        var S = st();
        var label = "";
        if (S && S.customFields && S.customFields[entity]) {
          (S.customFields[entity] || []).forEach(function (f) { if (f && f.id === fieldId) label = f.label || ""; });
        }
        var r = od.apply(this, arguments);
        try {
          if (entity === "pharmacy" && S) {
            var or = (S.customFields && S.customFields.order) || [];
            var target = null;
            or.forEach(function (g) {
              if (!g) return;
              if (g.id === "ordm-" + fieldId || (label && g.label === label)) target = g.id;
            });
            if (target) od.call(this, "order", target);
            setTimeout(function () {
              try { if (typeof window.applyFullFormLayout === "function") window.applyFullFormLayout("tab-orders"); } catch (e) {}
            }, 80);
          }
        } catch (e2) {}
        return r;
      };
    }
  }

  /* ---------- ۸) رفع نقص فیلدهای باکس کالا ---------- */
  function renderProductExtras() {
    var anchor = $("productName");
    if (!anchor) return;
    var S = st(); if (!S) return;
    var grid = anchor.closest(".form-grid") || anchor.parentElement;
    if (!grid) return;
    var old = $("v20ProductExtrasHost");
    if (old) old.parentNode.removeChild(old);
    var fields = (S.customFields && (S.customFields.products || S.customFields.product)) || [];
    fields = fields.filter(function (f) { return f && !f.deleted && f.showInForm !== false; });
    fields.sort(function (a, b) { return (Number(a.order) || 999) - (Number(b.order) || 999); });
    if (!fields.length) return;
    var host = document.createElement("div");
    host.id = "v20ProductExtrasHost";
    host.style.display = "contents";
    fields.forEach(function (f) {
      var g = document.createElement("div");
      g.className = "form-group";
      var w = parseInt(f.size, 10) || 220;
      var inner;
      if (f.type === "select") {
        inner = "<select class='form-select' id='v20pf_" + esc(f.id) + "' style='width:100%;max-width:" + w + "px'>" +
          "<option value=''>انتخاب کنید...</option>" +
          String(f.options || "").split(/[,،]/).map(function (s) { return s.trim(); }).filter(Boolean)
            .map(function (s) { return "<option value='" + esc(s) + "'>" + esc(s) + "</option>"; }).join("") +
          "</select>";
      } else {
        inner = "<input type='text' class='form-input' id='v20pf_" + esc(f.id) + "' style='width:100%;max-width:" + w + "px" +
          (f.height ? ";height:" + parseInt(f.height, 10) + "px" : "") + "' placeholder='" + esc(f.label) + "...'>";
      }
      g.innerHTML = "<label class='form-label' for='v20pf_" + esc(f.id) + "'>" + esc(f.label) + "</label>" + inner;
      host.appendChild(g);
    });
    grid.appendChild(host);
    log("فیلدهای سفارشی کالا رسم شد: " + fields.length);
  }
  window.v20RenderProductExtras = renderProductExtras;

  /* ---------- ۹) اعمال ترتیب ستون‌های لیست ---------- */
  var LIST_TARGETS = [
    ["renderPharmaciesList", "tab-pharmacies", "pharmacy"],
    ["renderDoctorsList", "tab-doctors", "doctor"],
    ["renderOrdersList", "tab-orders", "order"]
  ];
  function thText(th) { return String(th.textContent || "").replace(/\s+/g, " ").replace(/[*]/g, "").trim(); }
  function v20ReorderListColumns(paneId, key) {
    try {
      if (typeof window.getUnifiedFieldList !== "function") return;
      var pane = $(paneId); if (!pane) return;
      var table = pane.querySelector("table"); if (!table) return;
      var headRow = table.querySelector("thead tr"); if (!headRow) return;
      var ths = Array.prototype.slice.call(headRow.children);
      if (ths.length < 3) return;
      var fields = (window.getUnifiedFieldList(key) || []).filter(function (f) {
        return f && !f.deleted && f.showInList !== false;
      }).sort(function (a, b) {
        return (Number(a.listOrder) || Number(a.order) || 999) - (Number(b.listOrder) || Number(b.order) || 999);
      });
      var mapLabel = {};
      ths.forEach(function (th, i) { mapLabel[i] = thText(th); });
      var matched = 0;
      var newOrder = new Array(ths.length).fill(-1);
      var taken = {};
      newOrder[0] = 0; taken[0] = true; // ستون اول: ردیف واقعی
      // ستون دوم: نام نماینده
      for (var r = 1; r < ths.length; r++) {
        if (/نماینده/.test(mapLabel[r])) { newOrder[1] = r; taken[r] = true; break; }
      }
      // آخرین ستون اگر عملیات/خالی است در آخر بماند
      var lastIdx = ths.length - 1;
      var keepLast = (!mapLabel[lastIdx] || /عملیات|ویرایش|حذف/.test(mapLabel[lastIdx]));
      if (keepLast) { taken[lastIdx] = true; }
      var desiredMvids = fields.map(function (f) { return String(f.label || "").replace(/\s+/g, " ").replace(/[*]/g, "").trim(); });
      var fillPos = 1;
      if (newOrder[1] !== -1) fillPos = 2;
      desiredMvids.forEach(function (lab) {
        if (!lab) return;
        for (var i = 1; i < ths.length; i++) {
          if (taken[i]) continue;
          if (mapLabel[i] === lab) {
            while (fillPos <= lastIdx && newOrder[fillPos] !== -1 && taken[newOrder[fillPos]]) fillPos++;
            while (fillPos <= lastIdx && newOrder[fillPos] !== -1) fillPos++;
            if (keepLast && fillPos >= lastIdx) return;
            if (fillPos >= ths.length) return;
            newOrder[fillPos] = i; taken[i] = true; matched++; fillPos++;
            break;
          }
        }
      });
      if (matched < 2) return; // اطمینان نداریم — دست نزن
      var rest = [];
      for (var k = 1; k < ths.length; k++) if (!taken[k]) rest.push(k);
      var pos = 1;
      var finalOrder = [];
      for (var p = 0; p < ths.length; p++) finalOrder.push(-1);
      finalOrder[0] = 0;
      if (keepLast) finalOrder[lastIdx] = lastIdx;
      if (newOrder[1] !== -1) finalOrder[1] = newOrder[1];
      for (var q = 0; q < ths.length; q++) if (newOrder[q] !== -1 && q !== 0 && !(q === 1)) finalOrder[q] = newOrder[q];
      rest.forEach(function (idx) {
        while (pos < ths.length && finalOrder[pos] !== -1) pos++;
        if (pos < ths.length) finalOrder[pos] = idx;
      });
      for (var fix = 0; fix < ths.length; fix++) if (finalOrder[fix] === -1) { finalOrder[fix] = fix; }
      function reorderRow(row) {
        var cells = Array.prototype.slice.call(row.children);
        if (cells.length !== finalOrder.length) return;
        var copy = cells.slice();
        finalOrder.forEach(function (srcIdx, i) { row.appendChild(copy[srcIdx]); });
      }
      reorderRow(headRow);
      Array.prototype.forEach.call(table.querySelectorAll("tbody tr"), reorderRow);
      log("ترتیب ستون لیست اعمال شد: " + paneId);
    } catch (e) {}
  }
  function wrapListRenderers() {
    LIST_TARGETS.forEach(function (t) {
      var orig = window[t[0]];
      if (typeof orig !== "function" || orig._v20wrapped) return;
      var wrapped = function () {
        var r = orig.apply(this, arguments);
        var pane = t[1], key = t[2];
        setTimeout(function () { v20ReorderListColumns(pane, key); }, 0);
        return r;
      };
      wrapped._v20wrapped = true;
      window[t[0]] = wrapped;
    });
  }

  /* ---------- ۱۰) دکمه تغییر رمز (کنار دکمه خروج، نه روی آن) ---------- */
  function persistPass(username, newPass) {
    try {
      var map = JSON.parse(localStorage.getItem("CRM_USERS_AUTH") || "{}");
      if (!map[username]) map[username] = {};
      map[username].password = newPass;
      localStorage.setItem("CRM_USERS_AUTH", JSON.stringify(map));
    } catch (e) {}
  }
  function bindChpassFab() {
    if ($("v20ChpassFab")) return;
    var b = document.createElement("button");
    b.type = "button";
    b.id = "v20ChpassFab";
    b.textContent = "🔑 تغییر رمز";
    b.addEventListener("click", function () {
      var who = sessionStorage.getItem("crmUsername") || "";
      var S = st();
      var u = S ? (S.users || []).filter(function (x) { return x.username === who; })[0] : null;
      var modal = document.createElement("div");
      modal.className = "v20-modal";
      modal.innerHTML =
        "<div class='v20-modal-card'>" +
        "<h4 style='margin:0 0 8px'>🔑 تغییر رمز عبور «" + esc(sessionStorage.getItem("crmUserName") || who) + "»</h4>" +
        "<input type='password' id='v20p1' placeholder='رمز فعلی'>" +
        "<input type='password' id='v20p2' placeholder='رمز جدید'>" +
        "<input type='password' id='v20p3' placeholder='تکرار رمز جدید'>" +
        "<div style='display:flex;gap:8px;justify-content:flex-end;margin-top:10px'>" +
        "<button type='button' id='v20pOk' style='background:#0d9488;color:#fff;border:none;border-radius:8px;padding:8px 18px;cursor:pointer;font-weight:700;'>ثبت رمز جدید</button>" +
        "<button type='button' id='v20pNo' style='background:#e2e8f0;border:none;border-radius:8px;padding:8px 18px;cursor:pointer;'>انصراف</button>" +
        "</div></div>";
      document.body.appendChild(modal);
      modal.querySelector("#v20pNo").addEventListener("click", function () { modal.parentNode.removeChild(modal); });
      modal.querySelector("#v20pOk").addEventListener("click", function () {
        var p1 = modal.querySelector("#v20p1").value;
        var p2 = String(modal.querySelector("#v20p2").value || "").trim();
        var p3 = String(modal.querySelector("#v20p3").value || "").trim();
        var map = {};
        try { map = JSON.parse(localStorage.getItem("CRM_USERS_AUTH") || "{}"); } catch (e) {}
        var cur = u ? u.password : (map[who] ? map[who].password : null);
        if (cur != null && p1 !== cur) { alert("رمز فعلی نادرست است."); return; }
        if (!p2) { alert("رمز جدید خالی است."); return; }
        if (p2 !== p3) { alert("دو رمز جدید یکسان نیستند."); return; }
        if (u) { u.password = p2; }
        persistPass(who, p2);
        save();
        modal.parentNode.removeChild(modal);
        alert("✅ رمز شما تغییر کرد و در سیستم ورود هم ثبت شد. از ورود بعدی همان رمز جدید معتبر است.");
      });
    });
    // میزبانی درون هدر، درست قبل از دکمه «خروج» — اگر هدر پیدا نشد، پایینِ هدر شناور می‌شود
    var logout = $("btnLogoutSystem");
    if (logout && logout.parentNode) {
      logout.parentNode.insertBefore(b, logout);
    } else {
      b.style.position = "fixed";
      b.style.top = "64px";
      b.style.left = "8px";
      b.style.zIndex = "1100";
      document.body.appendChild(b);
    }
    v20RefreshFab();
  }
  function v20RefreshFab() {
    var b = $("v20ChpassFab"); if (!b) return;
    b.style.display = sessionStorage.getItem("crmLoggedIn") === "1" ? "inline-block" : "none";
  }

  /* ---------- ۱۱) سطوح دسترسی آماده ---------- */
  var ROLE_PRESETS = [
    {
      id: "rep", label: "نماینده علمی",
      on: ["dash_login", "dash_stats", "ph_access", "ph_create", "ph_list", "ph_view_loc", "ph_create_loc",
        "ph_percentage", "ph_send_mgr", "doc_access", "doc_create", "doc_list", "doc_view_loc", "doc_create_loc",
        "doc_upload", "doc_send_mgr", "ord_access", "ord_create", "ord_list", "ord_view_detail", "ord_items",
        "ord_send", "fld_visit", "fld_start_stop", "fld_pause", "fld_home_loc", "hr_leave_req", "rep_monthly",
        "sys_install", "usr_chpass"]
    },
    {
      id: "sales", label: "کارشناس فروش",
      on: ["dash_login", "dash_stats", "dash_activity", "dash_all_reps", "dash_export",
        "ph_access", "ph_create", "ph_list", "ph_all_reps", "ph_view_loc", "ph_create_loc", "ph_percentage",
        "ph_send_mgr", "ph_excel", "doc_access", "doc_create", "doc_list", "doc_all_reps", "doc_view_loc",
        "doc_create_loc", "doc_upload", "doc_print", "doc_send_mgr", "doc_excel", "ord_access", "ord_create",
        "ord_list", "ord_all_reps", "ord_view_detail", "ord_items", "ord_send", "ord_excel",
        "fld_visit", "fld_start_stop", "fld_pause", "fld_home_loc", "hr_leave_req",
        "rep_monthly", "rep_all_reports", "rep_item_sales", "rep_excel", "sys_targets", "sys_notify",
        "sys_install", "usr_chpass"]
    },
    {
      id: "supervisor", label: "سرپرست",
      on: "ALL_EXCEPT",
      off: ["sys_users", "sys_manual_design", "sys_copy_tabs", "sys_restore", "ord_formula"]
    }
  ];
  function renderPresetBar() {
    var pane = $("tab-users-permissions");
    if (!pane || $("v20PresetBar")) return;
    var S = st(); if (!S) return;
    var card = pane.querySelector(".card") || pane;
    var bar = document.createElement("div");
    bar.id = "v20PresetBar";
    bar.style.cssText = "border:1px solid #c7d2fe;background:#eef2ff;border-radius:12px;padding:12px;margin-bottom:14px;display:flex;gap:10px;flex-wrap:wrap;align-items:center;";
    var opts = ROLE_PRESETS.map(function (p) { return "<option value='" + p.id + "'>" + p.label + "</option>"; }).join("");
    var users = (S.users || []).map(function (u) { return "<option value='" + esc(u.id) + "'>" + esc(u.fullName || u.username) + " (" + esc(u.username) + ")</option>"; }).join("");
    bar.innerHTML =
      "<strong>🎚️ سطوح دسترسی آماده:</strong>" +
      "<select id='v20PresetSel' class='form-select' style='min-width:150px'>" + opts + "</select>" +
      "<select id='v20PresetUser' class='form-select' style='min-width:190px'>" + users + "</select>" +
      "<button type='button' id='v20PresetApply' style='background:#4f46e5;color:#fff;border:none;border-radius:9px;padding:8px 16px;cursor:pointer;font-weight:700;'>اعمال سطح روی کاربر</button>" +
      "<span class='v20-mini'>با این کار همه تیک‌های دسترسی کاربر یکجا بر اساس سطح انتخابی تنظیم می‌شود؛ بعداً هم می‌توانید تیک‌ها را دستی عوض کنید.</span>";
    card.insertBefore(bar, card.firstChild);
    bar.querySelector("#v20PresetApply").addEventListener("click", function () {
      var pid = bar.querySelector("#v20PresetSel").value;
      var uid = bar.querySelector("#v20PresetUser").value;
      var S2 = st(); if (!S2) return;
      var u = (S2.users || []).filter(function (x) { return String(x.id) === String(uid); })[0];
      var preset = ROLE_PRESETS.filter(function (p) { return p.id === pid; })[0];
      if (!u || !preset) return;
      if (u.username === "admin") { alert("سطح مدیر اصلی (admin) قابل تغییر نیست."); return; }
      if (typeof getDefaultPermissionsObject !== "function") { alert("موتور دسترسی‌ها در دسترس نیست."); return; }
      var perms;
      if (preset.on === "ALL_EXCEPT") {
        perms = getDefaultPermissionsObject(true);
        (preset.off || []).forEach(function (k) { perms[k] = false; });
      } else {
        perms = getDefaultPermissionsObject(false);
        preset.on.forEach(function (k) { perms[k] = true; });
      }
      u.permissions = perms;
      u.role = preset.label;
      u.preset = preset.label;
      save();
      if (typeof renderUserCardsList === "function") { try { renderUserCardsList(); } catch (e) {} }
      alert("✅ سطح «" + preset.label + "» روی «" + (u.fullName || u.username) + "» اعمال شد.");
    });
  }

  /* ---------- ۷-ب) همگام‌سازی «جای فیلدها» داروخانه → سفارشات ---------- */
  var ORDER_TO_PH_CORE = { PharmacyName: "Name" };
  function mirrorPharmacyOrderToOrders() {
    // از نسخه ۱۱.۱۷ جای فیلدها فقط از تنظیم ذخیره‌شده مدیر خوانده می‌شود.
    // جابه‌جایی خودکار DOM در هر بار اجرای نسخه، کد/جای فیلدها را به‌هم می‌زد.
    return;
    try {
      var ph = $("tab-pharmacies"), od = $("tab-orders");
      if (!ph || !od) return;
      var seq = [];
      Array.prototype.forEach.call(ph.querySelectorAll("[id^='pharmacy']"), function (el) {
        var core = el.id.substring("pharmacy".length);
        if (core && seq.indexOf(core) < 0) seq.push(core);
      });
      if (!seq.length) return;
      var groups = [];
      Array.prototype.forEach.call(od.querySelectorAll(".form-group"), function (g) {
        var el = g.querySelector("[id^='order']");
        if (el) groups.push({ g: g, core: el.id.substring("order".length), orig: groups.length });
      });
      if (!groups.length) return;
      var parent = groups[0].g.parentNode;
      var sorted = groups.slice().sort(function (a, b) {
        var ca = ORDER_TO_PH_CORE[a.core] || a.core;
        var cb = ORDER_TO_PH_CORE[b.core] || b.core;
        var ia = seq.indexOf(ca), ib = seq.indexOf(cb);
        if (ia < 0 && ib < 0) return Math.min(a.orig, b.orig) - Math.max(a.orig, b.orig);
        if (ia < 0) return 1;
        if (ib < 0) return -1;
        return ia - ib;
      });
      sorted.forEach(function (it) { parent.appendChild(it.g); });
    } catch (e) {}
  }
  function wrapFormLayoutMirror() {
    var of = window.applyFullFormLayout;
    if (typeof of !== "function" || of._v20mirror) return;
    var w = function (tabId) {
      var r = of.apply(this, arguments);
      if (tabId === "tab-pharmacies" || tabId === "pharmacy") setTimeout(mirrorPharmacyOrderToOrders, 60);
      return r;
    };
    w._v20mirror = true;
    window.applyFullFormLayout = w;
  }


  /* ---------- ۱۲) تثبیت شناسه‌ها + مدیر نام داروخانه/پزشک و وابستگی‌ها ---------- */
  function v20EntityRecordsHtml(kind) {
    var S = st() || {};
    var list = kind === "pharmacy" ? (S.pharmacies || []) : (S.doctors || []);
    var title = kind === "pharmacy" ? "نام داروخانه و همه اطلاعات وابسته" : "نام پزشک و همه اطلاعات وابسته";
    var rows = list.slice().reverse().map(function (r) {
      var sub = [r.province, r.city, r.district, r.address, r.phone, r.specialty].filter(Boolean).join("، ");
      return "<div class='v20-opt-row' data-entity='" + kind + "' data-id='" + esc(r.id) + "'>" +
        "<span><strong>" + esc(r.name || "بدون نام") + "</strong><small style='display:block;color:#64748b'>" + esc(sub || "بدون اطلاعات تکمیلی") + "</small></span>" +
        "<button type='button' class='v20-ent-edit' title='ویرایش نام و همه وابستگی‌ها'>✏️</button>" +
        "<button type='button' class='v20-ent-del' title='حذف رکورد و وابستگی‌ها'>🗑️</button></div>";
    }).join("");
    return "<div class='v20-combo-card v20-entity-card'><h5>🗂️ " + title + "</h5>" +
      "<div class='v20-mini'>ویرایش نام، سفارش‌ها و ارجاع‌های وابسته را هم اصلاح می‌کند. حذف فقط با تأیید مدیر انجام می‌شود.</div>" +
      "<div class='v20-card-tools'><input class='v20-ent-search' placeholder='🔍 جستجوی لحظه‌ای نام یا اطلاعات...'></div>" +
      "<div class='v20-entity-rows'>" + (rows || "<div class='v20-mini'>رکوردی ثبت نشده است.</div>") + "</div></div>";
  }
  function v20RenderEntityManager() {
    var mgr = document.querySelector("#addTabPanel .v20-addmgr");
    if (!mgr) return;
    var old = mgr.querySelector(".v20-entity-grid"); if (old) old.remove();
    if (v20AddPane !== "tab-pharmacies" && v20AddPane !== "tab-doctors") return;
    var grid = document.createElement("div"); grid.className = "v20-cards v20-entity-grid"; grid.style.marginTop = "14px";
    grid.innerHTML = v20EntityRecordsHtml(v20AddPane === "tab-pharmacies" ? "pharmacy" : "doctor");
    mgr.appendChild(grid);
    var search = grid.querySelector(".v20-ent-search");
    if (search) search.addEventListener("input", function () {
      var q = String(search.value || "").toLowerCase();
      Array.prototype.forEach.call(grid.querySelectorAll(".v20-opt-row"), function (r) { r.style.display = !q || r.textContent.toLowerCase().indexOf(q) >= 0 ? "flex" : "none"; });
    });
    grid.addEventListener("click", function (e) {
      var row = e.target.closest && e.target.closest(".v20-opt-row"); if (!row) return;
      var kind = row.getAttribute("data-entity"), id = row.getAttribute("data-id"), S = st();
      var arr = kind === "pharmacy" ? S.pharmacies : S.doctors;
      var rec = (arr || []).filter(function (x) { return String(x.id) === String(id); })[0]; if (!rec) return;
      if (e.target.closest(".v20-ent-edit")) {
        var nn = prompt("نام جدید را وارد کنید؛ همه اطلاعات وابسته هم اصلاح می‌شود:", rec.name || "");
        if (nn == null || !String(nn).trim()) return; nn = String(nn).trim(); var oldName = rec.name;
        rec.name = nn;
        if (kind === "pharmacy") (S.orders || []).forEach(function (o) { if (String(o.pharmacyId || "") === String(id) || o.pharmacyName === oldName) { o.pharmacyName = nn; o.pharmacyId = id; } });
        [S.visits || [], S.activityLog || [], S.repRoutes || []].forEach(function (a) { a.forEach(function (x) { if (x.doctorName === oldName) x.doctorName = nn; if (x.pharmacyName === oldName) x.pharmacyName = nn; }); });
        save(); window.v20RenderComboManager(); v20Toast("✅ نام و همه ارجاع‌های وابسته ویرایش شد.");
      }
      if (e.target.closest(".v20-ent-del")) {
        var deps = kind === "pharmacy" ? (S.orders || []).filter(function (o) { return String(o.pharmacyId || "") === String(id) || o.pharmacyName === rec.name; }).length :
          (S.visits || []).filter(function (v) { return String(v.doctorId || "") === String(id) || v.doctorName === rec.name; }).length;
        if (!confirm("«" + rec.name + "» و " + deps + " رکورد وابسته حذف شود؟ این کار قابل بازگشت نیست.")) return;
        if (kind === "pharmacy") { S.pharmacies = arr.filter(function (x) { return x.id !== id; }); S.orders = (S.orders || []).filter(function (o) { return !(String(o.pharmacyId || "") === String(id) || o.pharmacyName === rec.name); }); }
        else { S.doctors = arr.filter(function (x) { return x.id !== id; }); S.visits = (S.visits || []).filter(function (v) { return !(String(v.doctorId || "") === String(id) || v.doctorName === rec.name); }); }
        save(); window.v20RenderComboManager(); v20Toast("✅ رکورد و اطلاعات وابسته حذف شد.");
      }
    });
  }

  /* ---------- ۱۳) پیام هم‌نام کنار همان فیلد + جایگذاری دقیق ---------- */
  function v20SetValue(id, value) {
    var el = $(id); if (!el) return;
    el.disabled = false; el.value = value == null ? "" : value;
    try { el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); } catch (e) {}
    var combo = el.closest && el.closest(".crm-combo"); var vis = combo && combo.querySelector(".crm-combo-input"); if (vis) vis.value = el.options && el.selectedIndex >= 0 ? el.options[el.selectedIndex].text : el.value;
  }
  function v20PlaceMatchNearInput() {
    var inp = $("orderPharmacyName"), box = $("existingPharmacyTopAlert"); if (!inp || !box) return;
    var group = inp.closest(".form-group") || inp.parentNode;
    if (group && box.parentNode !== group) group.appendChild(box);
    box.classList.add("v20-local-match"); box.style.width = "100%";
  }
  function v20FillOrderPharmacy() {
    var S = st(), mid = ($("orderPharmacyMatchedId") || {}).value, name = String(($("orderPharmacyName") || {}).value || "").trim();
    var rec = ((S && S.pharmacies) || []).filter(function (p) { return String(p.id) === String(mid) || p.name === name; })[0];
    if (!rec) { v20Toast("داروخانه انتخاب‌شده پیدا نشد."); return; }
    v20SetValue("orderPharmacyName", rec.name); v20SetValue("orderPharmacyMatchedId", rec.id);
    v20SetValue("orderProvince", rec.province); try { if (typeof populateCities === "function") populateCities(rec.province, $("orderCity"), rec.city); } catch (e) {}
    v20SetValue("orderCity", rec.city); try { if (typeof populateDistricts === "function") populateDistricts(rec.province, rec.city, $("orderDistrict"), rec.district); } catch (e2) {}
    v20SetValue("orderDistrict", rec.district); v20SetValue("orderAddress", rec.address);
    var phFields = (S.customFields && S.customFields.pharmacy) || [], orFields = (S.customFields && S.customFields.order) || [];
    phFields.forEach(function (f) { var of = orFields.filter(function (x) { return x.id === "ordm-" + f.id || x.label === f.label; })[0]; if (of) v20SetValue(of.id, (rec.customFields || {})[f.label]); });
    v20ApplyOrderLock(); v20Toast("✅ همه اطلاعات داروخانه دقیقاً در فیلدهای متناظر جایگذاری شد.");
  }
  function bindOrderLocalMatch() {
    v20PlaceMatchNearInput();
    var btn = $("btnTopAutoFillPharmacy"); if (btn) btn.addEventListener("click", function (e) { e.preventDefault(); e.stopImmediatePropagation(); v20FillOrderPharmacy(); }, true);
    var inp = $("orderPharmacyName"); if (inp) inp.addEventListener("input", function () { setTimeout(v20PlaceMatchNearInput, 0); });
  }

  /* ---------- ۱۴) نسخه دقیق در هدر مدیر ---------- */
  function renderVersionBadge() {
    if ($("v20VersionBadge")) return;
    var actions = document.querySelector(".header-actions"); if (!actions) return;
    var b = document.createElement("span"); b.id = "v20VersionBadge"; b.className = "v20-version"; b.textContent = "نسخه ۱۱.۱۷.۰"; b.title = "نسخه دقیق برنامه نصب‌شده";
    actions.insertBefore(b, actions.firstChild);
  }

  /* ---------- ۱۵) متن ارسالی تحت قفل مدیر ---------- */
  var SHARE_FIELDS = {
    pharmacy: [["name","نام داروخانه"],["repName","نام نماینده"],["province","استان"],["city","شهر"],["district","منطقه"],["address","آدرس دقیق"],["phone","تلفن"],["isPercentage","وضعیت درصدی"]],
    doctor: [["name","نام پزشک"],["specialty","تخصص"],["repName","نام نماینده"],["province","استان"],["city","شهر"],["district","منطقه"],["address","آدرس دقیق"],["phone","تلفن"]],
    order: [["pharmacyName","نام داروخانه"],["repName","نام نماینده"],["orderDate","تاریخ"],["province","استان"],["city","شهر"],["address","آدرس"],["status","وضعیت"],["items","اقلام"],["totalAmount","مبلغ کل"]]
  };
  function shareSettings() { var S = st(); S.settings = S.settings || {}; S.settings.v20ShareFields = S.settings.v20ShareFields || {}; return S.settings.v20ShareFields; }
  function buildLockedShare(rec, kind) {
    var cfg = shareSettings(), enabled = cfg[kind] || SHARE_FIELDS[kind].map(function (x) { return x[0]; });
    return SHARE_FIELDS[kind].filter(function (x) { return enabled.indexOf(x[0]) >= 0; }).map(function (x) {
      var v = rec[x[0]]; if (x[0] === "items") v = (v || []).map(function (i) { return (i.name || "کالا") + " × " + (i.count || 0); }).join("، ");
      if (x[0] === "totalAmount") v = Number(v || 0).toLocaleString("fa-IR") + " ریال";
      if (typeof v === "boolean") v = v ? "بله" : "خیر";
      return x[1] + ": " + (v == null || v === "" ? "—" : v);
    }).join("\n");
  }
  function renderShareManager() {
    var host = $("messengerTogglesBox"); if (!host || $("v20ShareManager")) return;
    var box = document.createElement("div"); box.id = "v20ShareManager"; box.style.cssText = "margin-top:16px;border-top:2px solid #cbd5e1;padding-top:12px";
    box.innerHTML = "<h4>🔒 تعیین اطلاعات مجاز برای ارسال (فقط مدیر)</h4>" + Object.keys(SHARE_FIELDS).map(function (kind) {
      var title = kind === "pharmacy" ? "داروخانه" : kind === "doctor" ? "پزشک" : "سفارش", cfg = shareSettings(), on = cfg[kind] || SHARE_FIELDS[kind].map(function (x) { return x[0]; });
      return "<fieldset style='margin:8px 0;padding:10px;border:1px solid #cbd5e1;border-radius:10px'><legend>" + title + "</legend>" + SHARE_FIELDS[kind].map(function (f) { return "<label style='display:inline-flex;gap:5px;margin:5px 8px'><input type='checkbox' data-kind='" + kind + "' data-field='" + f[0] + "' " + (on.indexOf(f[0]) >= 0 ? "checked" : "") + ">" + f[1] + "</label>"; }).join("") + "</fieldset>";
    }).join("") + "<div class='v20-mini'>کاربر متن و فیلدهای انتخابی مدیر را نمی‌تواند تغییر دهد.</div>";
    host.appendChild(box);
    box.addEventListener("change", function () { var cfg = shareSettings(); Object.keys(SHARE_FIELDS).forEach(function (k) { cfg[k] = Array.prototype.map.call(box.querySelectorAll("input[data-kind='" + k + "']:checked"), function (i) { return i.getAttribute("data-field"); }); }); save(); v20Toast("تنظیم ارسال مدیر ذخیره شد."); });
  }
  function wrapShareModal() {
    var old = window.openRowDetailsModal; if (typeof old !== "function" || old._v20share) return;
    var w = function (rec, kind) { var r = old.apply(this, arguments), text = buildLockedShare(rec, kind); var map = {btnShareBale:"https://ble.ir/share?text=",btnShareEitaa:"https://eitaa.com/share/url?url=&text=",btnShareTelegram:"https://t.me/share/url?url=&text=",btnShareSoroush:"https://splus.ir/share?text=",btnShareWhatsApp:"https://api.whatsapp.com/send?text="}; Object.keys(map).forEach(function (id) { var b=$(id); if(b)b.onclick=function(){window.open(map[id]+encodeURIComponent(text),"_blank");}; }); var cp=$("btnRowCopyText"); if(cp)cp.onclick=function(){navigator.clipboard.writeText(text).then(function(){v20Toast("متن مجاز مدیر کپی شد.");});}; return r; };
    w._v20share = true; window.openRowDetailsModal = w;
  }

  /* ---------- ۱۶) GPS واقعی، کارت آمار، سابقه و جستجو/اکسل رصد ---------- */
  var v20Watch = null, v20VisitTimer = null;
  function hav(a,b){if(!a||!b)return 0;var R=6371000,p=Math.PI/180,d1=(b.lat-a.lat)*p,d2=(b.lng-a.lng)*p,x=Math.sin(d1/2)*Math.sin(d1/2)+Math.cos(a.lat*p)*Math.cos(b.lat*p)*Math.sin(d2/2)*Math.sin(d2/2);return 2*R*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));}
  function visitDate(){return new Date().toLocaleDateString("fa-IR",{timeZone:"Asia/Tehran"});}
  function ensureVisitCards(){var stBox=$("visitStatusBox");if(!stBox)return null;var h=$("v20VisitMetrics");if(!h){h=document.createElement("div");h.id="v20VisitMetrics";h.className="v20-visit-metrics";stBox.parentNode.insertBefore(h,stBox.nextSibling);}return h;}
  function refreshVisitCards(){var S=st(),v=S&&S.v20ActiveVisit,h=ensureVisitCards();if(!h)return;var dur=v?Math.max(0,Math.floor((Date.now()-v.startedAt)/1000)):0;h.innerHTML=[["مسافت طی‌شده",Math.round(v?v.distance:0)+" متر"],["مدت توقف",Math.round((v?v.stopMs:0)/60000)+" دقیقه"],["نقاط ثبت‌شده",v?(v.points||[]).length:0],["ساعت شروع",v?v.startTime:"—"]].map(function(x){return "<div class='v20-metric'>"+x[0]+"<b>"+x[1]+"</b></div>";}).join("");var sb=$("visitStatusBox");if(sb&&v)sb.textContent="GPS متصل است — مدت فعالیت: "+Math.floor(dur/60)+" دقیقه و "+(dur%60)+" ثانیه";}
  function startV20Visit(){var S=st();if(S.v20ActiveVisit){v20Toast("یک ویزیت هم‌اکنون فعال است.");return;}if(!navigator.geolocation){alert("این دستگاه GPS یا دسترسی موقعیت مکانی ندارد.");return;}var rep=sessionStorage.getItem("crmUserName")||"نماینده";S.v20ActiveVisit={id:"route-"+Date.now(),repName:rep,date:visitDate(),startedAt:Date.now(),startTime:new Date().toLocaleTimeString("fa-IR"),points:[],distance:0,stopMs:0,lastMoveAt:Date.now()};save();
    v20Watch=navigator.geolocation.watchPosition(function(pos){var V=st().v20ActiveVisit;if(!V)return;var p={lat:pos.coords.latitude,lng:pos.coords.longitude,t:Date.now(),acc:pos.coords.accuracy};var prev=V.points[V.points.length-1],d=hav(prev,p);if(d>=3){V.distance+=d;V.lastMoveAt=p.t;}else if(prev){V.stopMs+=Math.max(0,p.t-prev.t);}V.points.push(p);save(false);refreshVisitCards();},function(err){alert(err.code===1?"برای شروع ویزیت، اجازه موقعیت مکانی (GPS) را در مرورگر فعال کنید.":"اتصال GPS برقرار نشد؛ دوباره تلاش کنید.");},{enableHighAccuracy:true,maximumAge:0,timeout:15000});
    clearInterval(v20VisitTimer);v20VisitTimer=setInterval(refreshVisitCards,1000);refreshVisitCards();v20Toast("✅ GPS متصل شد و ثبت مسیر آغاز شد.");}
  function stopV20Visit(){var S=st(),V=S&&S.v20ActiveVisit;if(!V){v20Toast("ویزیت فعالی وجود ندارد.");return;}if(v20Watch!=null)navigator.geolocation.clearWatch(v20Watch);v20Watch=null;clearInterval(v20VisitTimer);V.endTime=new Date().toLocaleTimeString("fa-IR");V.endedAt=Date.now();V.durationMs=V.endedAt-V.startedAt;V.status="پایان‌یافته";V.path=(V.points||[]).map(function(p){return[p.lat,p.lng];});V.visited=(V.points||[]).length;V.pending=0;V.lastStop=V.points.length?"آخرین نقطه GPS":"بدون نقطه";S.repRoutes=S.repRoutes||[];S.repRoutes.unshift(V);S.visitTracks=S.visitTracks||[];S.visitTracks.unshift(V);S.v20ActiveVisit=null;save();refreshVisitCards();renderV20Routes();v20Toast("✅ همه فعالیت‌ها با تاریخ در رصد تردد ذخیره شد.");}
  function bindV20Visit(){var b1=$("btnStartVisit"),b2=$("btnEndVisit");if(b1){var n1=b1.cloneNode(true);b1.parentNode.replaceChild(n1,b1);n1.addEventListener("click",startV20Visit);}if(b2){var n2=b2.cloneNode(true);b2.parentNode.replaceChild(n2,b2);n2.addEventListener("click",stopV20Visit);}refreshVisitCards();}
  function ensureRouteTools(){var body=$("tableRepRoutesBody");if(!body)return;var table=body.closest("table"),wrap=table&&table.parentNode;if(!wrap||$("v20RouteTools"))return;var d=document.createElement("div");d.id="v20RouteTools";d.style.cssText="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0";d.innerHTML="<input id='v20RouteSearch' class='form-input' style='max-width:360px' placeholder='🔍 جستجوی لحظه‌ای نماینده، تاریخ یا وضعیت...'><button type='button' id='v20RouteExcel' class='btn btn-primary'>📊 خروجی اکسل</button>";wrap.insertBefore(d,table);$("v20RouteSearch").addEventListener("input",renderV20Routes);$("v20RouteExcel").addEventListener("click",exportV20Routes);}
  function renderV20Routes(){ensureRouteTools();var body=$("tableRepRoutesBody");if(!body)return;var q=String(($("v20RouteSearch")||{}).value||"").toLowerCase(),rep=String(($("routeRepFilterSelect")||{}).value||"");var rows=((st()&&st().repRoutes)||[]).slice().sort(function(a,b){return Number(b.endedAt||b.startedAt||0)-Number(a.endedAt||a.startedAt||0);}).filter(function(r){return(!rep||r.repName===rep)&&(!q||[r.repName,r.date,r.status,r.startTime,r.endTime].join(" ").toLowerCase().indexOf(q)>=0);});var table=body.closest("table"),head=table&&table.querySelector("thead tr");if(head)head.innerHTML="<th>ردیف</th><th>نام نماینده</th><th>تاریخ</th><th>شروع</th><th>پایان</th><th>مسافت (متر)</th><th>توقف (دقیقه)</th><th>نقاط</th><th>وضعیت</th>";body.innerHTML=rows.map(function(r,i){return"<tr><td>"+(i+1)+"</td><td><strong>"+esc(r.repName||"—")+"</strong></td><td>"+esc(r.date||"—")+"</td><td>"+esc(r.startTime||"—")+"</td><td>"+esc(r.endTime||"—")+"</td><td>"+Math.round(r.distance||0)+"</td><td>"+Math.round((r.stopMs||0)/60000)+"</td><td>"+((r.points||[]).length||r.visited||0)+"</td><td>"+esc(r.status||"—")+"</td></tr>";}).join("");}
  function exportV20Routes(){var rows=((st()&&st().repRoutes)||[]).slice().sort(function(a,b){return Number(b.endedAt||0)-Number(a.endedAt||0);}).map(function(r,i){return[i+1,r.repName||"—",r.date||"—",r.startTime||"—",r.endTime||"—",Math.round(r.distance||0),Math.round((r.stopMs||0)/60000),(r.points||[]).length,r.status||"—"];});window.downloadCSVFile("rep-routes.xls",["ردیف","نام نماینده","تاریخ","ساعت شروع","ساعت پایان","مسافت (متر)","توقف (دقیقه)","نقاط","وضعیت"],rows);}

  /* ---------- ۱۷) آدرس ریز تا کوچه/پلاک ---------- */
  window.reverseGeocodeCoordinates = async function(lat,lng){try{var res=await fetch("/api/reverse?lat="+encodeURIComponent(lat)+"&lng="+encodeURIComponent(lng)+"&zoom=18");var d=await res.json();if(d&&d.display_name){var a=d.address||{},parts=[a.house_number,a.road||a.pedestrian||a.footway,a.neighbourhood||a.quarter,a.suburb,a.city_district,a.city||a.town||a.village,a.state].filter(Boolean);var precise=parts.join("، ");return precise&&precise.length>=d.display_name.length*.45?precise:d.display_name;}}catch(e){}return"موقعیت "+Number(lat).toFixed(6)+"، "+Number(lng).toFixed(6);};

  /* ---------- ۱۸) همه لیست‌های قدیمی هم تازه‌ترین در بالا ---------- */
  function wrapNewestTables(){["renderActivityLogTable","renderRepRoutesTable","renderRepHomesTable","renderLeavesTable","renderMonthlyReportsTable","renderNotificationsTable","renderSalesTargetsTable","renderCustomFieldsTable"].forEach(function(n){var old=window[n];if(typeof old!=="function"||old._v20newest)return;var w=function(){var r=old.apply(this,arguments);setTimeout(function(){var map={renderActivityLogTable:"tableActivityLogBody",renderRepRoutesTable:"tableRepRoutesBody",renderRepHomesTable:"tableRepHomesBody",renderLeavesTable:"tableLeavesBody",renderMonthlyReportsTable:"tableMonthlyReportsBody",renderNotificationsTable:"tableNotificationsBody",renderSalesTargetsTable:"tableSalesTargetsBody",renderCustomFieldsTable:"tableCustomFieldsBody"},tb=$(map[n]);if(tb){var rows=Array.prototype.slice.call(tb.children).reverse();rows.forEach(function(x){tb.appendChild(x);});}},0);return r;};w._v20newest=true;window[n]=w;});}

  /* ---------- هُوک رفتن به تب‌ها ---------- */
  function onTabChanged(id) {
    v20RefreshFab();
    v20ApplyGreyChains();
    if (id === "tab-orders") { v20ApplyOrderLock(); setTimeout(v20PlaceMatchNearInput, 60); }
    if (id === "tab-custom-fields") setTimeout(window.v20RenderComboManager, 60);
    if (id === "tab-columns-products") setTimeout(renderProductExtras, 80);
    if (id === "tab-users-permissions") setTimeout(renderPresetBar, 60);
    if (id === "tab-messengers") setTimeout(renderShareManager, 60);
    if (id === "tab-my-visit") setTimeout(refreshVisitCards, 60);
    if (id === "tab-rep-routes") setTimeout(renderV20Routes, 80);
  }
  function wrapSwitchTab() {
    var os = window.switchTab;
    if (typeof os !== "function" || os._v20wrapped) return;
    var w = function (id) {
      var r = os.apply(this, arguments);
      try { onTabChanged(id); } catch (e) {}
      return r;
    };
    w._v20wrapped = true;
    window.switchTab = w;
  }

  /* ---------- شنونده‌های زنده ---------- */
  function bindLive() {
    // بعد از جایگذاری خودکار داروخانه در سفارش، قفل/بازشدن فیلدها
    document.addEventListener("click", function (e) {
      if (e.target && e.target.closest && e.target.closest("#tab-orders")) {
        setTimeout(v20ApplyOrderLock, 70);
      }
    });
    document.addEventListener("change", function () {
      setTimeout(v20ApplyGreyChains, 30);
      var pn = $("orderPharmacyName");
      if (document.activeElement === pn || (pn && !String(pn.value || "").trim())) setTimeout(v20ApplyOrderLock, 40);
    });
    document.addEventListener("input", function (e) {
      if (e.target && e.target.id === "orderPharmacyName" && !String(e.target.value || "").trim()) {
        setTimeout(v20ApplyOrderLock, 40);
      }
    });
    // اعمال فوری تغییرات کشویی‌ها در مدیر افزودن‌ها
    var pane = $("tab-custom-fields");
    if (pane && window.MutationObserver) {
      var t = null;
      new MutationObserver(function () {
        clearTimeout(t);
        t = setTimeout(function () {
          var host = $("addTabPanel");
          if (host && !host.querySelector(".v20-addmgr")) window.v20RenderComboManager();
        }, 300);
      }).observe(pane, { childList: true, subtree: true });
    }
    // رسم مجدد مدیر کشویی‌ها بعد از هر ذخیره وضعیت (بدون حلقه)
    var osv = window.saveState;
    if (typeof osv === "function") {
      window.saveState = function () {
        var r = osv.apply(this, arguments);
        try {
          var cf = $("tab-custom-fields");
          if (cf && cf.classList.contains("active") && !window._v20Rendering) {
            window._v20Rendering = true;
            setTimeout(function () { window._v20Rendering = false; window.v20RenderComboManager(); }, 350);
          }
        } catch (e) {}
        return r;
      };
    }
  }

  /* ---------- شروع ---------- */
  function init() {
    try { seedGreyDefaults(); } catch (e) {}
    try { wrapSwitchTab(); } catch (e) {}
    try { wrapListRenderers(); } catch (e) {}
    try { bindInstantAddSave(); } catch (e) {}
    try { bindMirror(); } catch (e) {}
    try { wrapFormLayoutMirror(); } catch (e) {}
    try { bindLive(); } catch (e) {}
    try { bindChpassFab(); } catch (e) {}
    try { bindOrderLocalMatch(); } catch (e) {}
    try { renderVersionBadge(); } catch (e) {}
    try { wrapShareModal(); } catch (e) {}
    try { renderShareManager(); } catch (e) {}
    try { bindV20Visit(); } catch (e) {}
    try { wrapNewestTables(); } catch (e) {}
    try { mirrorPharmacyFieldsToOrder(true); } catch (e) {}
    // اعمال اولیه موتورها روی تب فعال
    setTimeout(function () {
      try {
        v20ApplyGreyChains();
        v20ApplyOrderLock();
        mirrorPharmacyOrderToOrders();
        var active = document.querySelector(".tab-pane.active");
        if (active) onTabChanged(active.id);
      } catch (e) {}
    }, 250);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(init, 60); });
  else setTimeout(init, 60);
})();
