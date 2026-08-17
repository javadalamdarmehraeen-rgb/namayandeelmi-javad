// ===========================================================================
// crm-features-v9.js
// لایه تکمیلی روی اسکلت موجود: لوگو، ورود، نقشه دوطرفه، فرم/لیست همزمان،
// نقشه جامع، رصد تردد، منزل، لیست‌ها و ذخیره تک‌منبع.
// این فایل بعد از crm-app.js بارگذاری می‌شود و رفتارهای ناقص را جایگزین می‌کند.
// ===========================================================================

(function () {
  "use strict";

  const PAGE_SIZE = 15;
  const CITY_COORDS = {
    "تهران": [35.6892, 51.3890],
    "کرج": [35.8400, 50.9391],
    "مشهد": [36.2605, 59.6168],
    "اصفهان": [32.6546, 51.6680],
    "شیراز": [29.5918, 52.5837],
    "تبریز": [38.0800, 46.2919],
    "اهواز": [31.3183, 48.6706],
    "قم": [34.6416, 50.8746],
    "کرمان": [30.2839, 57.0834],
    "رشت": [37.2808, 49.5832],
    "ساری": [36.5633, 53.0601],
    "ارومیه": [37.5527, 45.0761],
    "یزد": [31.8974, 54.3569],
    "کرمانشاه": [34.3142, 47.0650],
    "همدان": [34.7992, 48.5146],
    "زاهدان": [29.4963, 60.8629],
    "بندرعباس": [27.1832, 56.2666],
    "اراک": [34.0954, 49.7013],
    "شهرکرد": [32.3256, 50.8644],
    "بوشهر": [28.9234, 50.8203],
    "گرگان": [36.8456, 54.4393],
    "سنندج": [35.3219, 46.9862],
    "خرم‌آباد": [33.4878, 48.3558],
    "ایلام": [33.6374, 46.4227],
    "یاسوج": [30.6684, 51.5880],
    "بجنورد": [37.4747, 57.3290],
    "بیرجند": [32.8649, 59.2262],
    "سمنان": [35.5769, 53.3971],
    "زنجان": [36.6736, 48.4787],
    "قزوین": [36.2797, 50.0049],
    "اردبیل": [38.2498, 48.2933]
  };

  let mapRepRoutes = null;
  let mapRepHomes = null;
  let routeLayers = [];
  let homeLayers = [];
  let liveMoveTimer = null;
  let lastOverviewResults = [];
  const listPage = { pharmacy: 1, doctor: 1, order: 1 };

  function $(id) { return document.getElementById(id); }
  function val(id) { const el = $(id); return el ? String(el.value || "").trim() : ""; }
  function setVal(id, v) { const el = $(id); if (el) el.value = v == null ? "" : v; }

  function replaceNode(el) {
    if (!el || !el.parentNode) return el;
    const clone = el.cloneNode(true);
    el.parentNode.replaceChild(clone, el);
    return clone;
  }

  function debounce(fn, ms) {
    let t = null;
    return function () {
      const args = arguments;
      const ctx = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, ms);
    };
  }

  function safeAlert(msg) {
    try { alert(msg); } catch (e) { console.log(msg); }
  }

  function ensureStateExtras() {
    if (!state) return;
    if (!state.hospitals) state.hospitals = (typeof DEFAULT_INITIAL_DATA !== "undefined" && DEFAULT_INITIAL_DATA.hospitals) ? DEFAULT_INITIAL_DATA.hospitals.slice() : [];
    if (!state.visits) state.visits = [];
    if (!state.messengers) state.messengers = {};
    if (!state.messengers.channels) {
      state.messengers.channels = {
        bale: { auto: false, manual: true },
        eitaa: { auto: false, manual: true },
        telegram: { auto: true, manual: true },
        soroush: { auto: false, manual: true },
        whatsapp: { auto: false, manual: true },
        sms: { auto: false, manual: true }
      };
    }
    if (typeof state.messengers.allowPeerMessaging !== "boolean") state.messengers.allowPeerMessaging = false;
    if (!state.settings) state.settings = {};
  }

  function currentRepName() {
    return (typeof currentUserName === "string" && currentUserName) ? currentUserName : "مدیر سیستم";
  }

  function isAdminLike() {
    const name = currentRepName();
    return name.indexOf("مدیر") !== -1 || name.indexOf("سرپرست") !== -1 || name.indexOf("Admin") !== -1;
  }

  // قانون ثابت لیست‌ها: تازه‌ترین رکورد همیشه سطر اول؛ هرگز آرایه اصلی را reverse نکن.
  function visiblePharmacies() {
    const list = ((state && state.pharmacies) || []).slice().reverse();
    if (isAdminLike()) return list;
    return list.filter(function (p) { return !p.repName || p.repName === currentRepName(); });
  }
  function visibleDoctors() {
    const list = ((state && state.doctors) || []).slice().reverse();
    if (isAdminLike()) return list;
    return list.filter(function (d) { return !d.repName || d.repName === currentRepName(); });
  }
  function visibleOrders() {
    const list = ((state && state.orders) || []).slice().reverse();
    if (isAdminLike()) return list;
    return list.filter(function (o) { return !o.repName || o.repName === currentRepName(); });
  }

  // ---------- Jalali / Gregorian ----------
  function gregorianNowTehran() {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Tehran",
      year: "numeric",
      month: "short",
      day: "2-digit"
    }).formatToParts(new Date());
    const get = function (t) {
      const f = parts.find(function (p) { return p.type === t; });
      return f ? f.value : "";
    };
    return { year: get("year"), month: get("month").toUpperCase(), day: get("day") };
  }

  function gregorianToJalali(gy, gm, gd) {
    const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    let jy;
    if (gy > 1600) {
      jy = 979;
      gy -= 1600;
    } else {
      jy = 0;
      gy -= 621;
    }
    const gy2 = (gm > 2) ? (gy + 1) : gy;
    let days = (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
    jy += 33 * Math.floor(days / 12053);
    days %= 12053;
    jy += 4 * Math.floor(days / 1461);
    days %= 1461;
    if (days > 365) {
      jy += Math.floor((days - 1) / 365);
      days = (days - 1) % 365;
    }
    const jm = (days < 186) ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
    const jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
    return { y: jy, m: jm, d: jd };
  }

  function todayJalaliStr() {
    const p = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()).split("-");
    const j = gregorianToJalali(parseInt(p[0], 10), parseInt(p[1], 10), parseInt(p[2], 10));
    const mm = j.m < 10 ? "0" + j.m : String(j.m);
    const dd = j.d < 10 ? "0" + j.d : String(j.d);
    return j.y + "/" + mm + "/" + dd;
  }

  function updateGregorianBadges() {
    const g = gregorianNowTehran();
    document.querySelectorAll(".jalali-badge-header").forEach(function (el) { el.textContent = g.month; });
    document.querySelectorAll(".jalali-badge-day").forEach(function (el) { el.textContent = String(parseInt(g.day, 10)); });
    const todayBtn = $("jalaliTodayBtn");
    if (todayBtn) todayBtn.textContent = "امروز: " + todayJalaliStr();
  }

  function setupDynamicDateFields() {
    const today = todayJalaliStr();
    ["pharmacyDate", "doctorDate", "orderDate", "leaveFromDate", "leaveToDate"].forEach(function (id) {
      const el = $(id);
      if (el && !el.value) el.value = today;
    });
    const btnToday = $("jalaliTodayBtn");
    if (btnToday) {
      btnToday.onclick = function () {
        if (typeof activeDateInputForPicker !== "undefined" && activeDateInputForPicker) {
          activeDateInputForPicker.value = todayJalaliStr();
        }
        const popup = $("jalaliCalendarPopup");
        if (popup) popup.classList.remove("active");
      };
    }
    updateGregorianBadges();
    setInterval(updateGregorianBadges, 60 * 1000);
  }

  // ---------- Geocoding ----------
  async function fetchJson(url) {
    const res = await fetch(url, { headers: { "Accept": "application/json", "Accept-Language": "fa,en" } });
    if (!res.ok) throw new Error("http " + res.status);
    return res.json();
  }

  async function geoReverse(lat, lng) {
    try {
      const data = await fetchJson("/api/reverse?lat=" + encodeURIComponent(lat) + "&lng=" + encodeURIComponent(lng));
      if (data && data.display_name) return formatNominatim(data, lat, lng);
    } catch (e) { /* fallback */ }
    try {
      const url = "https://nominatim.openstreetmap.org/reverse?format=json&lat=" + lat + "&lon=" + lng + "&zoom=18&addressdetails=1";
      const data = await fetchJson(url);
      if (data && data.display_name) return formatNominatim(data, lat, lng);
    } catch (e2) { /* ignore */ }
    return "موقعیت ثبت‌شده (" + Number(lat).toFixed(5) + ", " + Number(lng).toFixed(5) + ")";
  }

  async function geoSearch(query, limit) {
    limit = limit || 5;
    if (!query || query.trim().length < 2) return [];
    const q = query.trim();
    try {
      const data = await fetchJson("/api/geocode?q=" + encodeURIComponent(q) + "&limit=" + limit);
      if (Array.isArray(data)) return data;
    } catch (e) { /* fallback */ }
    try {
      const url = "https://nominatim.openstreetmap.org/search?format=json&q=" + encodeURIComponent(q) + "&limit=" + limit + "&addressdetails=1&countrycodes=ir";
      const data = await fetchJson(url);
      if (Array.isArray(data)) return data;
    } catch (e2) { /* ignore */ }
    return [];
  }

  function formatNominatim(data, lat, lng) {
    const addr = data.address || {};
    const parts = [
      addr.country,
      addr.state,
      addr.city || addr.town || addr.village || addr.county,
      addr.suburb || addr.neighbourhood || addr.city_district,
      addr.road || addr.pedestrian || addr.street,
      addr.house_number
    ].filter(Boolean);
    const uniq = [];
    parts.forEach(function (p) { if (uniq.indexOf(p) === -1) uniq.push(p); });
    if (uniq.length) return uniq.join("، ");
    return data.display_name || ("موقعیت " + Number(lat).toFixed(5) + ", " + Number(lng).toFixed(5));
  }

  function renderSuggestBox(box, items, onPick) {
    if (!box) return;
    box.innerHTML = "";
    if (!items || !items.length) {
      box.hidden = true;
      return;
    }
    items.forEach(function (it) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "geo-suggest-item";
      btn.textContent = it.display_name;
      btn.addEventListener("click", function () { onPick(it); });
      box.appendChild(btn);
    });
    box.hidden = false;
  }

  function bindAutocomplete(inputId, boxId, applyFn) {
    const input = $(inputId);
    const box = $(boxId);
    if (!input || !box) return;
    const run = debounce(async function () {
      const q = input.value.trim();
      if (q.length < 3) { box.hidden = true; return; }
      const items = await geoSearch(q, 5);
      renderSuggestBox(box, items, function (it) {
        const lat = parseFloat(it.lat);
        const lon = parseFloat(it.lon);
        const label = formatNominatim(it, lat, lon);
        input.value = label;
        box.hidden = true;
        applyFn(lat, lon, label);
      });
    }, 380);
    input.addEventListener("input", run);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        box.hidden = true;
        doAddressSearch(input.value, applyFn);
      }
    });
    document.addEventListener("click", function (e) {
      if (!box.contains(e.target) && e.target !== input) box.hidden = true;
    });
  }

  async function doAddressSearch(query, applyFn) {
    const q = (query || "").trim();
    if (!q) { safeAlert("ابتدا آدرس را در فیلد لوکیشن بنویسید."); return; }
    const items = await geoSearch(q, 1);
    if (!items.length) { safeAlert("آدرسی با این مشخصات پیدا نشد."); return; }
    const it = items[0];
    const lat = parseFloat(it.lat);
    const lon = parseFloat(it.lon);
    const label = formatNominatim(it, lat, lon);
    applyFn(lat, lon, label);
  }

  function applyPharmacyLocation(lat, lng, address, nameText) {
    setVal("pharmacyLat", Number(lat).toFixed(5));
    setVal("pharmacyLng", Number(lng).toFixed(5));
    if (address) {
      setVal("phMapSearchInput", address);
      setVal("pharmacyAddress", address);
      setVal("pharmacyLocationText", address);
    }
    if (typeof updatePharmacyFormMarker === "function") {
      updatePharmacyFormMarker(lat, lng, nameText || val("pharmacyName") || "موقعیت داروخانه", true);
    }
  }

  function applyDoctorLocation(lat, lng, address, nameText) {
    setVal("doctorLat", Number(lat).toFixed(5));
    setVal("doctorLng", Number(lng).toFixed(5));
    if (address) {
      setVal("docMapSearchInput", address);
      setVal("doctorAddress", address);
      setVal("doctorLocationText", address);
    }
    if (typeof updateDoctorFormMarker === "function") {
      updateDoctorFormMarker(lat, lng, nameText || val("doctorName") || "موقعیت مطب", true);
    }
  }

  function getCurrentPositionSafe() {
    return new Promise(function (resolve) {
      if (!navigator.geolocation) {
        resolve({ lat: 35.7595, lng: 51.4250, fallback: true });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        function (pos) { resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, fallback: false }); },
        function () { resolve({ lat: 35.7595, lng: 51.4250, fallback: true }); },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 15000 }
      );
    });
  }

  function setupTwoWayLocationSync() {
    const btnPhCur = replaceNode($("btnPharmacyCurrentLocation"));
    const btnPhAddr = replaceNode($("btnPharmacyGetAddressFromPoint"));
    const btnPhSearch = replaceNode($("btnPhMapSearch"));
    const btnDocCur = replaceNode($("btnDoctorCurrentLocation"));
    const btnDocAddr = replaceNode($("btnDoctorGetAddressFromPoint"));
    const btnDocSearch = replaceNode($("btnDocMapSearch"));

    if (btnPhCur) {
      btnPhCur.addEventListener("click", async function () {
        btnPhCur.disabled = true;
        try {
          const pos = await getCurrentPositionSafe();
          const addr = await geoReverse(pos.lat, pos.lng);
          applyPharmacyLocation(pos.lat, pos.lng, addr, val("pharmacyName") || "موقعیت فعلی داروخانه");
          safeAlert(pos.fallback
            ? ("موقعیت تستی تنظیم شد و آدرس در فیلد لوکیشن نشست:\n" + addr)
            : ("موقعیت فعلی روی نقشه آمد و آدرس در فیلد لوکیشن نوشته شد:\n" + addr));
        } finally { btnPhCur.disabled = false; }
      });
    }
    if (btnPhAddr) {
      btnPhAddr.addEventListener("click", async function () {
        const lat = parseFloat(val("pharmacyLat")) || 35.7605;
        const lng = parseFloat(val("pharmacyLng")) || 51.4180;
        const addr = await geoReverse(lat, lng);
        applyPharmacyLocation(lat, lng, addr, val("pharmacyName") || "داروخانه");
        safeAlert("آدرس این نقطه در فیلد لوکیشن قرار گرفت:\n" + addr);
      });
    }
    if (btnPhSearch) {
      btnPhSearch.addEventListener("click", function () {
        doAddressSearch(val("phMapSearchInput"), function (lat, lng, label) {
          applyPharmacyLocation(lat, lng, label, val("pharmacyName") || label);
        });
      });
    }
    if (btnDocCur) {
      btnDocCur.addEventListener("click", async function () {
        btnDocCur.disabled = true;
        try {
          const pos = await getCurrentPositionSafe();
          const addr = await geoReverse(pos.lat, pos.lng);
          applyDoctorLocation(pos.lat, pos.lng, addr, val("doctorName") || "موقعیت فعلی مطب");
          safeAlert("موقعیت فعلی روی نقشه آمد و آدرس در فیلد لوکیشن مطب نوشته شد:\n" + addr);
        } finally { btnDocCur.disabled = false; }
      });
    }
    if (btnDocAddr) {
      btnDocAddr.addEventListener("click", async function () {
        const lat = parseFloat(val("doctorLat")) || 35.7580;
        const lng = parseFloat(val("doctorLng")) || 51.4400;
        const addr = await geoReverse(lat, lng);
        applyDoctorLocation(lat, lng, addr, val("doctorName") || "مطب");
        safeAlert("آدرس این نقطه در فیلد لوکیشن مطب قرار گرفت:\n" + addr);
      });
    }
    if (btnDocSearch) {
      btnDocSearch.addEventListener("click", function () {
        doAddressSearch(val("docMapSearchInput"), function (lat, lng, label) {
          applyDoctorLocation(lat, lng, label, val("doctorName") || label);
        });
      });
    }

    bindAutocomplete("phMapSearchInput", "phMapSuggestBox", function (lat, lng, label) {
      applyPharmacyLocation(lat, lng, label, val("pharmacyName") || label);
    });
    bindAutocomplete("docMapSearchInput", "docMapSuggestBox", function (lat, lng, label) {
      applyDoctorLocation(lat, lng, label, val("doctorName") || label);
    });

    // کلیک روی نقشه هم آدرس را در همان فیلد لوکیشن بنشاند
    if (typeof mapPharmacyForm !== "undefined" && mapPharmacyForm) {
      mapPharmacyForm.on("click", async function (e) {
        const addr = await geoReverse(e.latlng.lat, e.latlng.lng);
        applyPharmacyLocation(e.latlng.lat, e.latlng.lng, addr, val("pharmacyName") || "نقطه انتخابی");
      });
    }
    if (typeof mapDoctorForm !== "undefined" && mapDoctorForm) {
      mapDoctorForm.on("click", async function (e) {
        const addr = await geoReverse(e.latlng.lat, e.latlng.lng);
        applyDoctorLocation(e.latlng.lat, e.latlng.lng, addr, val("doctorName") || "نقطه انتخابی");
      });
    }
  }

  // ---------- Form / List: never hide the form ----------
  function setupSplitFormList() {
    function bindPair(btnFormId, btnListId, formCardId, listCardId) {
      const bF = replaceNode($(btnFormId));
      const bL = replaceNode($(btnListId));
      const cF = $(formCardId);
      const cL = $(listCardId);
      if (cF) cF.style.display = "block";
      if (cL) cL.style.display = "block";
      if (bF) {
        bF.addEventListener("click", function () {
          bF.className = "btn btn-primary btn-sm";
          bF.style.background = "#0d9488";
          if (bL) { bL.className = "btn btn-outline btn-sm"; bL.style.background = ""; }
          if (cF) { cF.style.display = "block"; cF.scrollIntoView({ behavior: "smooth", block: "start" }); }
          if (cL) cL.style.display = "block";
        });
      }
      if (bL) {
        bL.addEventListener("click", function () {
          bL.className = "btn btn-primary btn-sm";
          bL.style.background = "#0d9488";
          if (bF) { bF.className = "btn btn-outline btn-sm"; bF.style.background = ""; }
          if (cF) cF.style.display = "block";
          if (cL) { cL.style.display = "block"; cL.scrollIntoView({ behavior: "smooth", block: "start" }); }
        });
      }
    }
    bindPair("btnShowPhForm", "btnShowPhList", "cardPhForm", "cardPhList");
    bindPair("btnShowDocForm", "btnShowDocList", "cardDocForm", "cardDocList");
    bindPair("btnShowOrdForm", "btnShowOrdList", "cardOrdForm", "cardOrdList");
  }

  // ---------- Single save handlers ----------
  const saveLock = { pharmacy: false, doctor: false, order: false };

  function setupSingleSaveHandlers() {
    // فرم را clone نمی‌کنیم تا لیسنرهای استان/شهر و درصدی از بین نروند.
    // با capture + stopImmediatePropagation از ذخیره تکراری جلوگیری می‌شود.
    ["formPharmacy", "formDoctor", "formOrder"].forEach(function (id) {
      const f = $(id);
      if (f) f.onsubmit = function (e) { e.preventDefault(); };
    });
    ["btnSavePharmacy", "btnSaveDoctor", "btnSaveOrder"].forEach(function (id) {
      const b = $(id);
      if (b) b.onclick = null;
    });
    bindOneSubmit($("formPharmacy"), function () { savePharmacyV9(); });
    bindOneSubmit($("formDoctor"), function () { saveDoctorV9(); });
    bindOneSubmit($("formOrder"), function () { saveOrderV9(); });
  }

  function bindOneSubmit(form, handler) {
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      handler();
    }, true);
  }

  function savePharmacyV9() {
    if (saveLock.pharmacy) return;
    saveLock.pharmacy = true;
    setTimeout(function () { saveLock.pharmacy = false; }, 400);
    ensureStateExtras();
    const editId = val("pharmacyEditId");
    const rec = {
      id: editId || ("ph-" + Date.now()),
      dateAdded: val("pharmacyDate") || todayJalaliStr(),
      name: val("pharmacyName"),
      phone: val("pharmacyPhone"),
      manager: val("pharmacyManager"),
      managerPhone: val("pharmacyManagerPhone"),
      province: val("pharmacyProvince"),
      city: val("pharmacyCity"),
      district: val("pharmacyDistrict"),
      address: val("pharmacyAddress") || val("phMapSearchInput"),
      lat: parseFloat(val("pharmacyLat")) || 35.7605,
      lng: parseFloat(val("pharmacyLng")) || 51.4180,
      isPercentage: val("pharmacyIsPercentage") === "true",
      fileName: ($("phFileInput") && $("phFileInput").files && $("phFileInput").files[0]) ? $("phFileInput").files[0].name : null,
      repName: currentRepName(),
      customFields: (typeof extractCustomFieldValuesFromForm === "function")
        ? extractCustomFieldValuesFromForm("pharmacy", "pharmacyCustomFieldsContainer")
        : {}
    };
    if (typeof window.validateRequiredFields === "function" && !window.validateRequiredFields("tab-pharmacies")) return;
    if (!editId) {
      const dup = state.pharmacies.some(function (p) { return p.name === rec.name || (rec.phone && p.phone === rec.phone); });
      if (dup && !window.v20DupGate("pharmacy")) return;
      state.pharmacies.push(rec);
    } else {
      const idx = state.pharmacies.findIndex(function (p) { return p.id === editId; });
      if (idx !== -1) state.pharmacies[idx] = Object.assign({}, state.pharmacies[idx], rec);
    }
    saveState();
    if (typeof resetPharmacyForm === "function") {
      try { resetPharmacyForm(); } catch (e) { /* ignore hidden field errors */ }
    }
    renderPharmaciesListV9();
    if (typeof renderDashboardOverviewMap === "function") renderDashboardOverviewMap();
    if (typeof updateNavBadges === "function") updateNavBadges();
    if (typeof populatePharmacyDatalistInOrders === "function") populatePharmacyDatalistInOrders();
    logActivity("ثبت/ویرایش داروخانه «" + rec.name + "»");
    const listCard = $("cardPhList");
    if (listCard) listCard.scrollIntoView({ behavior: "smooth", block: "start" });
    safeAlert("داروخانه «" + rec.name + "» ذخیره شد.");
  }

  function saveDoctorV9() {
    if (saveLock.doctor) return;
    saveLock.doctor = true;
    setTimeout(function () { saveLock.doctor = false; }, 400);
    ensureStateExtras();
    const editId = val("doctorEditId");
    const rec = {
      id: editId || ("doc-" + Date.now()),
      dateAdded: val("doctorDate") || todayJalaliStr(),
      name: val("doctorName"),
      specialty: val("doctorSpecialty"),
      phone: val("doctorPhone"),
      province: val("doctorProvince"),
      city: val("doctorCity"),
      district: val("doctorDistrict"),
      address: val("doctorAddress") || val("docMapSearchInput"),
      lat: parseFloat(val("doctorLat")) || 35.7580,
      lng: parseFloat(val("doctorLng")) || 51.4400,
      isPercentage: val("doctorIsPercentage") === "true",
      fileName: ($("docFileInput") && $("docFileInput").files && $("docFileInput").files[0]) ? $("docFileInput").files[0].name : null,
      repName: currentRepName(),
      customFields: (typeof extractCustomFieldValuesFromForm === "function")
        ? extractCustomFieldValuesFromForm("doctor", "doctorCustomFieldsContainer")
        : {}
    };
    if (typeof window.validateRequiredFields === "function" && !window.validateRequiredFields("tab-doctors")) return;
    if (!editId) {
      const dup = state.doctors.some(function (d) { return d.name === rec.name || (rec.phone && d.phone === rec.phone); });
      if (dup && !window.v20DupGate("doctor")) return;
      state.doctors.push(rec);
    } else {
      const idx = state.doctors.findIndex(function (d) { return d.id === editId; });
      if (idx !== -1) state.doctors[idx] = Object.assign({}, state.doctors[idx], rec);
    }
    saveState();
    if (typeof resetDoctorForm === "function") {
      try { resetDoctorForm(); } catch (e) { /* ignore */ }
    }
    renderDoctorsListV9();
    if (typeof renderDashboardOverviewMap === "function") renderDashboardOverviewMap();
    if (typeof updateNavBadges === "function") updateNavBadges();
    logActivity("ثبت/ویرایش پزشک «" + rec.name + "»");
    const listCard = $("cardDocList");
    if (listCard) listCard.scrollIntoView({ behavior: "smooth", block: "start" });
    safeAlert("پزشک/مطب «" + rec.name + "» ذخیره شد.");
  }

  function collectOrderItems() {
    const container = $("orderItemsContainer");
    if (!container) return [];
    const rows = container.children;
    const items = [];
    for (let i = 0; i < rows.length; i++) {
      const nameEl = rows[i].querySelector(".order-item-name");
      const countEl = rows[i].querySelector(".order-item-count");
      const giftEl = rows[i].querySelector(".order-item-gift");
      const priceEl = rows[i].querySelector(".order-item-price");
      if (nameEl && nameEl.value.trim()) {
        // کالای بدون تعداد اصلاً سفارش نیست؛ قبلاً || 1 به‌اشتباه آن را یک عدد حساب می‌کرد.
        const qty = parseInt(countEl && countEl.value, 10) || 0;
        if (qty <= 0) continue;
        items.push({
          name: nameEl.value.trim(),
          count: qty,
          giftCount: parseInt(giftEl && giftEl.value, 10) || 0,
          price: parseInt(priceEl && priceEl.value, 10) || 0
        });
      }
    }
    return items;
  }

  function saveOrderV9() {
    ensureStateExtras();
    const editId = val("orderEditId");
    const items = collectOrderItems();
    const matchedPharmacy = (state.pharmacies || []).find(function(p){ return p.id === val("orderPharmacyMatchedId") || p.name === val("orderPharmacyName"); }) || {};
    const rec = {
      id: editId || ("ord-" + Date.now()),
      pharmacyName: val("orderPharmacyName"),
      pharmacyId: matchedPharmacy.id || val("orderPharmacyMatchedId"),
      orderManager: matchedPharmacy.manager || "",
      orderManagerPhone: matchedPharmacy.managerPhone || "",
      province: val("orderProvince"),
      city: val("orderCity"),
      district: val("orderDistrict"),
      address: val("orderAddress"),
      repName: val("orderRepName") || currentRepName(),
      orderDate: val("orderDate") || todayJalaliStr(),
      status: val("orderStatus") || "در حال بررسی",
      notes: val("orderNotes"),
      items: items,
      quantityValidated: true,
      totalAmount: items.reduce(function (s, it) { return s + (it.count * it.price); }, 0),
      customFields: (typeof extractCustomFieldValuesFromForm === "function")
        ? extractCustomFieldValuesFromForm("order", "orderCustomFieldsContainer")
        : {}
    };
    if (typeof window.validateRequiredFields === "function" && !window.validateRequiredFields("tab-orders")) return;
    if (!items.length) {
      safeAlert("حداقل یک قلم کالا وارد کنید.");
      return;
    }
    items.forEach(function (item) {
      const tgt = (state.salesTargets || []).find(function (t) { return t.repName === rec.repName && t.productName === item.name; });
      if (tgt) {
        tgt.achievedCount = (tgt.achievedCount || 0) + item.count;
        const prod = (state.products || []).find(function (p) { return p.name === item.name; });
        tgt.achievedAmount = tgt.achievedCount * (prod ? (prod.pharmacyPrice || prod.price || 45000) : 45000);
      }
    });
    if (editId) {
      const idx = state.orders.findIndex(function (o) { return o.id === editId; });
      if (idx !== -1) state.orders[idx] = Object.assign({}, state.orders[idx], rec);
    } else {
      state.orders.push(rec);
    }
    saveState();
    if (typeof resetOrderForm === "function") {
      try { resetOrderForm(); } catch (e) { /* ignore */ }
    }
    renderOrdersListV9();
    if (typeof renderSalesTargetsTable === "function") renderSalesTargetsTable();
    if (typeof updateNavBadges === "function") updateNavBadges();
    logActivity("ثبت سفارش برای «" + rec.pharmacyName + "»");
    const listCard = $("cardOrdList");
    if (listCard) listCard.scrollIntoView({ behavior: "smooth", block: "start" });
    safeAlert("سفارش «" + rec.pharmacyName + "» ذخیره شد.");
  }

  function logActivity(action) {
    if (!state.activityLog) state.activityLog = [];
    const now = new Date();
    const time = now.toLocaleTimeString("fa-IR", { timeZone: "Asia/Tehran", hour: "2-digit", minute: "2-digit" });
    state.activityLog.unshift({ id: "act-" + Date.now(), time: time + " - امروز", repName: currentRepName(), action: action });
    saveState(false);
    renderActivityChartAndTable();
  }

  // ---------- Lists with location / routing / row modal ----------
  function pageSlice(arr, key) {
    const page = listPage[key] || 1;
    const start = (page - 1) * PAGE_SIZE;
    return { rows: arr.slice(start, start + PAGE_SIZE), total: arr.length, page: page, pages: Math.max(1, Math.ceil(arr.length / PAGE_SIZE)) };
  }

  function renderPager(hostId, key, pages, page, redraw) {
    let host = $(hostId);
    if (!host) {
      const table = document.querySelector("#" + (key === "pharmacy" ? "tablePharmacies" : key === "doctor" ? "tableDoctors" : "tableOrders"));
      if (!table || !table.parentNode) return;
      host = document.createElement("div");
      host.id = hostId;
      host.className = "table-pager";
      table.parentNode.appendChild(host);
    }
    host.innerHTML = "";
    for (let i = 1; i <= pages; i++) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn btn-sm " + (i === page ? "btn-primary" : "btn-outline");
      if (i === page) b.style.background = "#0d9488";
      b.textContent = String(i);
      b.addEventListener("click", function () { listPage[key] = i; redraw(); });
      host.appendChild(b);
    }
  }

  function locCell(rec) {
    const ok = !!(rec.lat && rec.lng);
    return ok
      ? '<span class="loc-ok">ثبت شده</span> <button type="button" class="btn btn-outline btn-sm btn-show-on-map">نقشه</button>'
      : '<span class="loc-miss">ثبت نشده</span>';
  }

  function sortedListFields(entity) {
    return ((state.customFields || {})[entity] || []).filter(function (f) { return f.showInList; })
      .slice().sort(function (a, b) { return (Number(a.order) || 999) - (Number(b.order) || 999); });
  }
  function thVis(entity, id, label) {
    if (typeof window.isColShownInList === "function" && !window.isColShownInList(entity, id)) return "";
    return "<th>" + label + "</th>";
  }
  function tdVis(entity, id, html) {
    if (typeof window.isColShownInList === "function" && !window.isColShownInList(entity, id)) return "";
    return html;
  }
  function extraHead(entity) {
    if (typeof window.extraListColumns !== "function") return "";
    return window.extraListColumns(entity).map(function (c) { return "<th>" + c.label + "</th>"; }).join("");
  }
  function extraCells(entity, rec) {
    if (typeof window.extraListColumns !== "function") return "";
    return window.extraListColumns(entity).map(function (c) {
      var val = (typeof window.builtinFieldValue === "function") ? window.builtinFieldValue(entity, c.id, rec) : "—";
      return "<td>" + val + "</td>";
    }).join("");
  }
  function cfHeaderHtml(entity) {
    return sortedListFields(entity).map(function (f) { return "<th>" + f.label + "</th>"; }).join("");
  }
  function cfCellHtml(entity, rec) {
    return sortedListFields(entity).map(function (f) {
      var val = (rec.customFields && rec.customFields[f.label]) ? rec.customFields[f.label] : "—";
      return "<td><strong>" + val + "</strong></td>";
    }).join("");
  }

  function renderPharmaciesListV9(q) {
    const tbody = $("tablePharmaciesBody");
    const thead = $("tablePharmaciesHeader");
    if (!tbody || !thead) return;
    thead.innerHTML = "<th>ردیف</th><th>نام نماینده</th>" +
      thVis("pharmacy", "pharmacyDate", "تاریخ ثبت") +
      thVis("pharmacy", "pharmacyProvince", "استان") +
      thVis("pharmacy", "pharmacyCity", "شهر") +
      thVis("pharmacy", "pharmacyName", "نام داروخانه") +
      thVis("pharmacy", "pharmacyPhone", "شماره همراه") +
      thVis("pharmacy", "pharmacyIsPercentage", "درصدی") +
      thVis("pharmacy", "phMapSearchInput", "لوکیشن") +
      "<th>مسیریابی</th>" + extraHead("pharmacy") + cfHeaderHtml("pharmacy") + "<th>عملیات</th>";
    const query = (q != null ? q : val("searchPharmacyInput")).toLowerCase();
    const filtered = visiblePharmacies().filter(function (ph) {
      if (!query) return true;
      return [ph.name, ph.address, ph.phone, ph.repName, ph.city].join(" ").toLowerCase().indexOf(query) !== -1;
    });
    const slice = pageSlice(filtered, "pharmacy");
    tbody.innerHTML = "";
    slice.rows.forEach(function (ph, i) {
      const tr = document.createElement("tr");
      tr.style.cursor = "pointer";
      const abs = ((listPage.pharmacy - 1) * PAGE_SIZE) + i + 1;
      tr.innerHTML =
        "<td>" + abs + "</td>" +
        "<td><strong>" + (ph.repName || "—") + "</strong></td>" +
        tdVis("pharmacy", "pharmacyDate", "<td>" + (ph.dateAdded || "—") + "</td>") +
        tdVis("pharmacy", "pharmacyProvince", "<td>" + (ph.province || "—") + "</td>") +
        tdVis("pharmacy", "pharmacyCity", "<td>" + (ph.city || "—") + "</td>") +
        tdVis("pharmacy", "pharmacyName", "<td><strong style='color:#0d9488'>" + ph.name + "</strong></td>") +
        tdVis("pharmacy", "pharmacyPhone", "<td style='direction:ltr'>" + (ph.phone || "—") + "</td>") +
        tdVis("pharmacy", "pharmacyIsPercentage", "<td>" + (ph.isPercentage ? "بله" : "خیر") + "</td>") +
        tdVis("pharmacy", "phMapSearchInput", "<td>" + locCell(ph) + "</td>") +
        "<td><button type='button' class='btn btn-outline btn-sm btn-route'>مسیریابی</button></td>" +
        extraCells("pharmacy", ph) +
        cfCellHtml("pharmacy", ph) +
        "<td><button type='button' class='btn btn-outline btn-sm btn-edit'>ویرایش</button> <button type='button' class='btn btn-danger btn-sm btn-del'>حذف</button></td>";
      tr.addEventListener("click", function () { if (typeof openRowDetailsModal === "function") openRowDetailsModal(ph, "pharmacy"); });
      const showBtn = tr.querySelector(".btn-show-on-map");
      if (showBtn) showBtn.addEventListener("click", function (e) { e.stopPropagation(); focusOnMap(ph.lat, ph.lng, ph.name); });
      const routeBtn = tr.querySelector(".btn-route");
      if (routeBtn) routeBtn.addEventListener("click", function (e) { e.stopPropagation(); if (typeof openNavigationAppModal === "function") openNavigationAppModal(ph.lat, ph.lng, ph.name); });
      tr.querySelector(".btn-edit").addEventListener("click", function (e) { e.stopPropagation(); if (typeof editPharmacy === "function") editPharmacy(ph.id); });
      tr.querySelector(".btn-del").addEventListener("click", function (e) { e.stopPropagation(); if (typeof deletePharmacy === "function") deletePharmacy(ph.id); });
      tbody.appendChild(tr);
    });
    const badge = $("phListCountBadge");
    const tableBadge = $("phTableCountBadge");
    if (badge) badge.textContent = filtered.length;
    if (tableBadge) tableBadge.textContent = filtered.length;
    renderPager("phListPager", "pharmacy", slice.pages, slice.page, function () { renderPharmaciesListV9(query); });
  }

  function renderDoctorsListV9(q) {
    const tbody = $("tableDoctorsBody");
    const thead = $("tableDoctorsHeader");
    if (!tbody || !thead) return;
    thead.innerHTML = "<th>ردیف</th><th>نام نماینده</th>" +
      thVis("doctor", "doctorDate", "تاریخ ثبت") +
      thVis("doctor", "doctorProvince", "استان / شهر / منطقه") +
      thVis("doctor", "doctorName", "نام پزشک / مطب") +
      thVis("doctor", "doctorSpecialty", "تخصص") +
      thVis("doctor", "doctorIsPercentage", "درصدی") +
      thVis("doctor", "docMapSearchInput", "لوکیشن") +
      "<th>مسیریابی</th>" + extraHead("doctor") + cfHeaderHtml("doctor") + "<th>عملیات</th>";
    const query = (q != null ? q : val("searchDoctorInput")).toLowerCase();
    const filtered = visibleDoctors().filter(function (d) {
      if (!query) return true;
      return [d.name, d.specialty, d.address, d.repName, d.city].join(" ").toLowerCase().indexOf(query) !== -1;
    });
    const slice = pageSlice(filtered, "doctor");
    tbody.innerHTML = "";
    slice.rows.forEach(function (doc, i) {
      const tr = document.createElement("tr");
      tr.style.cursor = "pointer";
      const abs = ((listPage.doctor - 1) * PAGE_SIZE) + i + 1;
      tr.innerHTML =
        "<td>" + abs + "</td>" +
        "<td><strong>" + (doc.repName || "—") + "</strong></td>" +
        "<td>" + (doc.dateAdded || "—") + "</td>" +
        "<td>" + [doc.province, doc.city, doc.district].filter(Boolean).join(" / ") + "</td>" +
        "<td><strong style='color:#0d9488'>" + doc.name + "</strong></td>" +
        "<td>" + (doc.specialty || "—") + "</td>" +
        "<td>" + (doc.isPercentage ? "بله" : "خیر") + "</td>" +
        "<td>" + locCell(doc) + "</td>" +
        "<td><button type='button' class='btn btn-outline btn-sm btn-route'>مسیریابی</button></td>" +
        cfCellHtml("doctor", doc) +
        "<td><button type='button' class='btn btn-outline btn-sm btn-edit'>ویرایش</button> <button type='button' class='btn btn-danger btn-sm btn-del'>حذف</button></td>";
      tr.addEventListener("click", function () { if (typeof openRowDetailsModal === "function") openRowDetailsModal(doc, "doctor"); });
      const showBtn = tr.querySelector(".btn-show-on-map");
      if (showBtn) showBtn.addEventListener("click", function (e) { e.stopPropagation(); focusOnMap(doc.lat, doc.lng, doc.name); });
      tr.querySelector(".btn-route").addEventListener("click", function (e) { e.stopPropagation(); if (typeof openNavigationAppModal === "function") openNavigationAppModal(doc.lat, doc.lng, doc.name); });
      tr.querySelector(".btn-edit").addEventListener("click", function (e) { e.stopPropagation(); if (typeof editDoctor === "function") editDoctor(doc.id); });
      tr.querySelector(".btn-del").addEventListener("click", function (e) { e.stopPropagation(); if (typeof deleteDoctor === "function") deleteDoctor(doc.id); });
      tbody.appendChild(tr);
    });
    renderPager("docListPager", "doctor", slice.pages, slice.page, function () { renderDoctorsListV9(query); });
  }

  function cleanOrderItemsV9(ord){var items=(ord.items||[]).filter(function(i){return Number(i.count)>0;});if(!ord.quantityValidated){var ones=items.filter(function(i){return Number(i.count)===1;}),real=items.filter(function(i){return Number(i.count)>1;});if(ones.length>=2&&real.length)items=real;}return items;}
  function renderOrdersListV9(q) {
    const tbody = $("tableOrdersBody");
    const thead = $("tableOrdersHeader");
    if (!tbody || !thead) return;
    thead.innerHTML = "<th>ردیف</th>" +
      thVis("order", "orderRepName", "نام نماینده") +
      thVis("order", "orderPharmacyName", "نام داروخانه") +
      thVis("order", "orderProvince", "استان / شهر") +
      thVis("order", "orderDate", "تاریخ") +
      "<th>اقلام / جایزه</th><th>مبلغ کل</th>" +
      thVis("order", "orderStatus", "وضعیت") +
      extraHead("order") + cfHeaderHtml("order") + "<th>عملیات</th>";
    const query = (q != null ? q : val("searchOrderInput")).toLowerCase();
    const filtered = visibleOrders().filter(function (o) {
      if (!query) return true;
      return [o.pharmacyName, o.repName, o.status].join(" ").toLowerCase().indexOf(query) !== -1;
    });
    const slice = pageSlice(filtered, "order");
    tbody.innerHTML = "";
    slice.rows.forEach(function (ord, i) {
      const validItems = cleanOrderItemsV9(ord);
      const gifts = validItems.map(function (it) { return it.name + " = تعداد کالا: " + it.count + " / تعداد جایزه: " + (it.giftCount || 0); }).join("، ");
      const cleanTotal = validItems.reduce(function(s,it){return s+(Number(it.count)||0)*(Number(it.price)||0);},0);
      const tr = document.createElement("tr");
      tr.style.cursor = "pointer";
      const abs = ((listPage.order - 1) * PAGE_SIZE) + i + 1;
      tr.innerHTML =
        "<td>" + abs + "</td>" +
        tdVis("order", "orderRepName", "<td><strong>" + (ord.repName || "—") + "</strong></td>") +
        tdVis("order", "orderPharmacyName", "<td><strong style='color:#0d9488'>" + ord.pharmacyName + "</strong></td>") +
        tdVis("order", "orderProvince", "<td>" + [ord.province, ord.city].filter(Boolean).join(" / ") + "</td>") +
        tdVis("order", "orderDate", "<td>" + (ord.orderDate || "—") + "</td>") +
        "<td>" + (gifts || "—") + "</td>" +
        "<td>" + Number(cleanTotal || 0).toLocaleString("fa-IR") + "</td>" +
        tdVis("order", "orderStatus", "<td>" + (ord.status || "—") + "</td>") +
        extraCells("order", ord) +
        cfCellHtml("order", ord) +
        "<td><button type='button' class='btn btn-outline btn-sm btn-edit'>ویرایش</button> <button type='button' class='btn btn-danger btn-sm btn-del'>حذف</button></td>";
      tr.addEventListener("click", function () { if (typeof openRowDetailsModal === "function") openRowDetailsModal(ord, "order"); });
      tr.querySelector(".btn-edit").addEventListener("click", function (e) { e.stopPropagation(); if (typeof editOrder === "function") editOrder(ord.id); });
      tr.querySelector(".btn-del").addEventListener("click", function (e) { e.stopPropagation(); if (typeof deleteOrder === "function") deleteOrder(ord.id); });
      tbody.appendChild(tr);
    });
    const badge = $("ordListCountBadge");
    if (badge) badge.textContent = filtered.length;
    renderPager("ordListPager", "order", slice.pages, slice.page, function () { renderOrdersListV9(query); });
  }

  function focusOnMap(lat, lng, name) {
    if (typeof switchTab === "function") switchTab("tab-overview-map");
    setTimeout(function () {
      if (typeof initFullOverviewMap === "function") initFullOverviewMap();
      if (typeof mapFullOverview !== "undefined" && mapFullOverview && lat && lng) {
        mapFullOverview.setView([lat, lng], 16);
        if (typeof L !== "undefined") L.popup().setLatLng([lat, lng]).setContent(name || "موقعیت").openOn(mapFullOverview);
      }
    }, 220);
  }

  function bindInstantSearch() {
    const ph = $("searchPharmacyInput");
    const doc = $("searchDoctorInput");
    const ord = $("searchOrderInput");
    if (ph) ph.addEventListener("input", function () { listPage.pharmacy = 1; renderPharmaciesListV9(ph.value); });
    if (doc) doc.addEventListener("input", function () { listPage.doctor = 1; renderDoctorsListV9(doc.value); });
    if (ord) ord.addEventListener("input", function () { listPage.order = 1; renderOrdersListV9(ord.value); });
  }

  // ---------- Comprehensive map ----------
  function setupOverviewMapV9() {
    const prov = $("mapFilterProvince");
    const city = $("mapFilterCity");
    const dist = $("mapFilterDistrict");
    const btn = replaceNode($("btnFocusMapRegion"));
    const btnX = replaceNode($("btnExportOverviewMapCSV"));

    if (prov) {
      const keep = prov.value || "ایران";
      if (typeof populateProvinces === "function") populateProvinces(prov);
      const iran = document.createElement("option");
      iran.value = "ایران";
      iran.textContent = "ایران";
      prov.insertBefore(iran, prov.firstChild);
      if (!Array.from(prov.options).some(function (o) { return o.value === keep; })) prov.value = "ایران";
      else prov.value = keep;
      const freshProv = replaceNode(prov);
      freshProv.addEventListener("change", function () {
        const iranMode = freshProv.value === "ایران" || !freshProv.value;
        if (city) { city.disabled = iranMode; if (iranMode) city.innerHTML = '<option value="">همه شهرها</option>'; }
        if (dist) { dist.disabled = iranMode; if (iranMode) dist.innerHTML = '<option value="">همه مناطق</option>'; }
        if (!iranMode && typeof populateCities === "function" && city) populateCities(freshProv.value, city);
      });
    }
    if (city) {
      const freshCity = replaceNode(city);
      freshCity.addEventListener("change", function () {
        const p = val("mapFilterProvince");
        if (typeof populateDistricts === "function" && dist) populateDistricts(p, freshCity.value, dist);
      });
    }
    if (btn) btn.addEventListener("click", applyOverviewFilters);
    if (btnX) btnX.addEventListener("click", exportOverviewResults);
  }

  function applyOverviewFilters() {
    if (typeof initFullOverviewMap === "function") initFullOverviewMap();
    const p = val("mapFilterProvince");
    const c = val("mapFilterCity");
    const d = val("mapFilterDistrict");
    const iranMode = p === "ایران" || !p;

    function matchGeo(rec) {
      if (iranMode) return true;
      if (p && rec.province !== p) return false;
      if (c && rec.city !== c) return false;
      if (d && rec.district !== d) return false;
      return true;
    }

    const ph = ((state && state.pharmacies) || []).filter(matchGeo);
    const docs = ((state && state.doctors) || []).filter(matchGeo);
    const hos = ((state && state.hospitals) || []).filter(matchGeo);
    lastOverviewResults = []
      .concat(ph.map(function (x) { return Object.assign({ kind: "داروخانه" }, x); }))
      .concat(docs.map(function (x) { return Object.assign({ kind: "پزشک" }, x); }))
      .concat(hos.map(function (x) { return Object.assign({ kind: x.type || "بیمارستان" }, x); }));

    if ($("cntOverviewPharmacies")) $("cntOverviewPharmacies").textContent = ph.length;
    if ($("cntOverviewDoctors")) $("cntOverviewDoctors").textContent = docs.length;
    if ($("cntOverviewHospitals")) $("cntOverviewHospitals").textContent = hos.length;

    if (typeof mapFullOverview !== "undefined" && mapFullOverview && typeof markersFullOverview !== "undefined") {
      markersFullOverview.forEach(function (m) { try { mapFullOverview.removeLayer(m); } catch (e) {} });
      markersFullOverview = [];
      const pts = [];
      lastOverviewResults.forEach(function (rec) {
        if (!rec.lat || !rec.lng) return;
        const type = rec.kind === "پزشک" ? "doctor" : (rec.kind === "داروخانه" ? "pharmacy" : "rep");
        if (typeof createCustomMarker === "function") {
          const m = createCustomMarker(rec.lat, rec.lng, type, rec.name, mapFullOverview);
          markersFullOverview.push(m);
        }
        pts.push([rec.lat, rec.lng]);
      });
      if (iranMode) {
        mapFullOverview.setView([32.4279, 53.6880], 5);
      } else if (c && CITY_COORDS[c]) {
        mapFullOverview.setView(CITY_COORDS[c], 12);
      } else if (p && CITY_COORDS[p]) {
        mapFullOverview.setView(CITY_COORDS[p], 8);
      } else if (pts.length) {
        mapFullOverview.fitBounds(pts, { padding: [40, 40] });
      }
    }
  }

  function exportOverviewResults() {
    const hdrs = ["ردیف", "نام نماینده", "نوع", "نام", "استان", "شهر", "منطقه", "آدرس"];
    const rows = lastOverviewResults.map(function (r, i) {
      return [i + 1, r.repName || "—", r.kind || "", r.name || "", r.province || "", r.city || "", r.district || "", r.address || ""];
    });
    if (typeof downloadCSVFile === "function") downloadCSVFile("overview-map-results.csv", hdrs, rows);
  }

  // ---------- Routes / Homes / Live / Activity ----------
  function ensureLeafletMap(id, holderName, zoom, center) {
    const el = $(id);
    if (!el || typeof L === "undefined") return null;
    if (window[holderName]) {
      setTimeout(function () { window[holderName].invalidateSize(); }, 120);
      return window[holderName];
    }
    const map = L.map(id).setView(center || [35.72, 51.42], zoom || 11);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(map);
    window[holderName] = map;
    return map;
  }

  function initRepRoutesMap() {
    mapRepRoutes = ensureLeafletMap("map-rep-routes-full", "_mapRepRoutes", 12, [35.73, 51.42]);
    if (!mapRepRoutes) return;
    routeLayers.forEach(function (l) { try { mapRepRoutes.removeLayer(l); } catch (e) {} });
    routeLayers = [];
    const filter = val("routeRepFilterSelect");
    const routes = ((state && state.repRoutes) || []).filter(function (r) { return !filter || r.repName === filter; });
    const pts = [];
    routes.forEach(function (rt, idx) {
      const colors = ["#0d9488", "#2563eb", "#f59e0b"];
      const path = rt.path || [];
      if (path.length && typeof L !== "undefined") {
        const line = L.polyline(path, { color: colors[idx % colors.length], weight: 4, opacity: 0.85 }).addTo(mapRepRoutes);
        routeLayers.push(line);
        path.forEach(function (p) { pts.push(p); });
      }
      (rt.stops || []).forEach(function (st) {
        if (!st.lat || !st.lng) return;
        const color = st.visited ? "#16a34a" : "#ea580c";
        const mk = L.circleMarker([st.lat, st.lng], { radius: 8, color: "#fff", weight: 2, fillColor: color, fillOpacity: 1 })
          .bindTooltip((st.visited ? "✅ " : "⏳ ") + st.name + (st.time ? (" — " + st.time) : ""), { permanent: false });
        mk.addTo(mapRepRoutes);
        routeLayers.push(mk);
        pts.push([st.lat, st.lng]);
      });
    });
    if (pts.length) mapRepRoutes.fitBounds(pts, { padding: [30, 30] });
    renderRoutesTableV9(routes);
  }

  function renderRoutesTableV9(routes) {
    const tbody = $("tableRepRoutesBody");
    if (!tbody) return;
    tbody.innerHTML = "";
    (routes || state.repRoutes || []).forEach(function (rt) {
      const tr = document.createElement("tr");
      tr.innerHTML =
        "<td><strong>" + rt.repName + "</strong></td>" +
        "<td>" + (rt.startTime || "—") + "</td>" +
        "<td>" + (rt.endTime || "—") + "</td>" +
        "<td>" + (rt.lastStop || rt.checkpoint || "—") + "</td>" +
        "<td>✅ " + (rt.visited || 0) + " / ⏳ " + (rt.pending || 0) + "</td>" +
        "<td>" + (rt.status || "—") + "</td>";
      tbody.appendChild(tr);
    });
  }

  function setupRoutesUi() {
    const sel = $("routeRepFilterSelect");
    if (sel) {
      sel.innerHTML = '<option value="">همه نمایندگان</option>';
      ((state && state.reps) || []).forEach(function (r) {
        sel.innerHTML += '<option value="' + r.name + '">' + r.name + "</option>";
      });
      sel.addEventListener("change", initRepRoutesMap);
    }
    const btn = $("btnRefreshRepRoutesMap");
    if (btn) btn.addEventListener("click", initRepRoutesMap);
  }

  function initRepHomesMap() {
    mapRepHomes = ensureLeafletMap("map-rep-homes", "_mapRepHomes", 11, [35.73, 51.42]);
    if (!mapRepHomes) return;
    homeLayers.forEach(function (l) { try { mapRepHomes.removeLayer(l); } catch (e) {} });
    homeLayers = [];
    const pts = [];
    ((state && state.repHomes) || []).forEach(function (hm) {
      if (!hm.lat || !hm.lng) return;
      if (typeof createCustomMarker === "function") {
        const m = createCustomMarker(hm.lat, hm.lng, "rep", "منزل " + hm.repName, mapRepHomes);
        homeLayers.push(m);
      }
      pts.push([hm.lat, hm.lng]);
    });
    if (pts.length) mapRepHomes.fitBounds(pts, { padding: [40, 40] });
    if (typeof renderRepHomesTable === "function") renderRepHomesTable();
  }

  function setupHomesUi() {
    const sel = $("repHomeSelect");
    if (sel) {
      sel.innerHTML = "";
      ((state && state.reps) || []).forEach(function (r) {
        sel.innerHTML += '<option value="' + r.name + '">' + r.name + "</option>";
      });
      if (!isAdminLike()) sel.value = currentRepName();
    }
    const btn = replaceNode($("btnRepHomeCurrentLocation"));
    if (btn) {
      btn.addEventListener("click", async function () {
        const pos = await getCurrentPositionSafe();
        const addr = await geoReverse(pos.lat, pos.lng);
        setVal("repHomeAddressInput", addr);
        const name = val("repHomeSelect") || currentRepName();
        if (!state.repHomes) state.repHomes = [];
        const idx = state.repHomes.findIndex(function (h) { return h.repName === name; });
        const rec = { id: "home-" + Date.now(), repName: name, address: addr, lat: pos.lat, lng: pos.lng };
        if (idx === -1) state.repHomes.push(rec);
        else state.repHomes[idx] = Object.assign({}, state.repHomes[idx], rec);
        saveState();
        initRepHomesMap();
        if (mapRepHomes) mapRepHomes.setView([pos.lat, pos.lng], 16);
        safeAlert("لوکیشن منزل «" + name + "» ثبت شد و آدرس در فیلد نشست.");
      });
    }
  }

  function setupLiveLocationV9() {
    const sel = $("liveRepSearchSelect");
    if (sel) {
      sel.innerHTML = '<option value="">جستجوی نماینده روی نقشه...</option>';
      ((state && state.reps) || []).forEach(function (r) {
        sel.innerHTML += '<option value="' + r.id + '">' + r.name + "</option>";
      });
    }
    const btnFind = replaceNode($("btnFindLiveRep"));
    if (btnFind) btnFind.addEventListener("click", function () {
      const id = val("liveRepSearchSelect");
      const rep = ((state && state.reps) || []).find(function (r) { return r.id === id || r.name === id; });
      if (!rep) { safeAlert("نماینده را انتخاب کنید."); return; }
      renderLiveLocationTabV9();
      if (typeof mapLiveReps !== "undefined" && mapLiveReps && rep.lat) {
        mapLiveReps.setView([rep.lat, rep.lng], 15);
      }
    });
    const btnSim = replaceNode($("btnSimulateLiveMovement"));
    if (btnSim) btnSim.addEventListener("click", function () {
      if (liveMoveTimer) { clearInterval(liveMoveTimer); liveMoveTimer = null; btnSim.textContent = "▶️ شبیه‌سازی حرکت زنده نمایندگان"; return; }
      btnSim.textContent = "⏸️ توقف شبیه‌سازی";
      liveMoveTimer = setInterval(function () {
        ((state && state.reps) || []).forEach(function (r) {
          if (!r.lat) return;
          r.lat += (Math.random() - 0.5) * 0.004;
          r.lng += (Math.random() - 0.5) * 0.004;
          r.lastUpdate = "لحظاتی پیش";
        });
        renderLiveLocationTabV9();
      }, 2500);
    });
    const btnRef = replaceNode($("btnRefreshLiveMap"));
    if (btnRef) btnRef.addEventListener("click", renderLiveLocationTabV9);
    renderLiveLocationTabV9();
  }

  function renderLiveLocationTabV9() {
    if (typeof mapLiveReps !== "undefined" && mapLiveReps && typeof createCustomMarker === "function") {
      Object.keys(markersLiveReps || {}).forEach(function (k) {
        try { mapLiveReps.removeLayer(markersLiveReps[k]); } catch (e) {}
      });
      markersLiveReps = {};
      ((state && state.reps) || []).forEach(function (r) {
        if (!r.lat || !r.lng) return;
        markersLiveReps[r.id] = createCustomMarker(r.lat, r.lng, "rep", r.name, mapLiveReps);
      });
      try { mapLiveReps.invalidateSize(); } catch (e) {}
    }
    const tbody = $("tableLiveRepsBody");
    if (!tbody) return;
    tbody.innerHTML = "";
    ((state && state.reps) || []).forEach(function (r) {
      const tr = document.createElement("tr");
      tr.innerHTML =
        "<td><strong>" + r.name + "</strong></td>" +
        "<td>" + (r.status || "—") + "</td>" +
        "<td style='direction:ltr'>" + (r.lat ? (Number(r.lat).toFixed(4) + ", " + Number(r.lng).toFixed(4)) : "—") + "</td>" +
        "<td>" + (r.lastUpdate || "—") + "</td>" +
        "<td>" + (r.currentVisit || "—") + "</td>" +
        "<td><button type='button' class='btn btn-outline btn-sm'>نمایش</button></td>";
      tr.querySelector("button").addEventListener("click", function () {
        if (typeof mapLiveReps !== "undefined" && mapLiveReps && r.lat) mapLiveReps.setView([r.lat, r.lng], 15);
      });
      tbody.appendChild(tr);
    });
  }

  function renderActivityChartAndTable() {
    const box = $("activityChartBox");
    const counts = {};
    ((state && state.activityLog) || []).forEach(function (a) {
      counts[a.repName] = (counts[a.repName] || 0) + 1;
    });
    const max = Math.max(1, ...Object.values(counts), 1);
    if (box) {
      box.innerHTML = Object.keys(counts).map(function (name) {
        const n = counts[name];
        const pct = Math.round((n / max) * 100);
        return '<div class="activity-bar-card"><strong>' + name + "</strong><div>" + n + " فعالیت</div><div class='activity-bar-track'><div class='activity-bar-fill' style='width:" + pct + "%'></div></div></div>";
      }).join("") || "<div class='activity-bar-card'>هنوز فعالیتی ثبت نشده است.</div>";
    }
    if (typeof renderActivityLogTable === "function") renderActivityLogTable();
  }

  // ---------- Login gate + role filter ----------
  function setupLoginGate() {
    const gate = $("loginGateOverlay");
    const already = sessionStorage.getItem("crmLoggedIn") === "1";
    if (already && gate) gate.classList.add("hidden");
    if (!already) {
      document.body.classList.add("is-gated");
      if (typeof openModalLogin === "function") {
        /* gate is the first page; keep modal as secondary */
      }
    }
    const btn = $("btnGateLogin");
    if (btn) btn.addEventListener("click", function () { attemptLogin(val("gateUsername"), val("gatePassword"), val("gatePhone")); });
    ["gatePassword", "gateUsername", "gatePhone"].forEach(function (id) {
      const el = $(id);
      if (el) el.addEventListener("keydown", function (e) { if (e.key === "Enter") attemptLogin(val("gateUsername"), val("gatePassword"), val("gatePhone")); });
    });

    const formLogin = $("formLoginModal");
    if (formLogin) {
      const fresh = replaceNode(formLogin);
      fresh.addEventListener("submit", function (e) {
        e.preventDefault();
        attemptLogin(val("loginUsernameInput"), val("loginPasswordInput"), val("loginUserName"), val("loginRoleSelect"));
      });
    }
  }

  function attemptLogin(username, password, phone, roleIdx) {
    ensureStateExtras();
    const users = (state && state.users) || [];
    let user = users.find(function (u) {
      const uOk = !username || u.username === username;
      const pOk = !password || u.password === password;
      const phOk = !phone || !u.phone || u.phone === phone;
      return uOk && pOk && (username || phone);
    });
    if (!user && (username === "admin" && password === "123")) user = users[0];
    if (!user && roleIdx != null && users[parseInt(roleIdx, 10)]) user = users[parseInt(roleIdx, 10)];
    if (!user) { safeAlert("نام کاربری، رمز عبور یا شماره همراه نادرست است."); return; }

    try {
      currentRoleIndex = users.indexOf(user);
      currentUserName = user.fullName;
    } catch (e) {}
    sessionStorage.setItem("crmLoggedIn", "1");
    sessionStorage.setItem("crmUserId", user.id);
    const gate = $("loginGateOverlay");
    if (gate) gate.classList.add("hidden");
    document.body.classList.remove("is-gated");
    if (typeof closeModalLogin === "function") closeModalLogin();
    if (typeof applyUserRolePermissions === "function") applyUserRolePermissions();
    applyRoleDataFilter();
    safeAlert("ورود موفق: " + user.fullName);
  }

  function applyRoleDataFilter() {
    renderPharmaciesListV9();
    renderDoctorsListV9();
    renderOrdersListV9();
    if (typeof updateNavBadges === "function") updateNavBadges();
  }

  // ---------- Messengers / backup / install / excel ----------
  function setupMessengersUi() {
    const box = $("messengerTogglesBox");
    if (!box || !state.messengers) return;
    const labels = { bale: "بله", eitaa: "ایتا", telegram: "تلگرام", soroush: "سروش", whatsapp: "واتساپ", sms: "پیامک" };
    const peer = state.messengers.allowPeerMessaging ? "checked" : "";
    let html = '<label style="display:flex;gap:0.5rem;align-items:center;margin-bottom:0.75rem;"><input type="checkbox" id="chkPeerMsg" ' + peer + ' /> نمایندگان بتوانند به یکدیگر پیام بدهند</label>';
    html += '<div class="form-grid">';
    Object.keys(labels).forEach(function (k) {
      const ch = state.messengers.channels[k] || { auto: false, manual: true };
      html += '<div class="form-group"><strong>' + labels[k] + '</strong>' +
        '<label style="display:flex;gap:0.4rem;align-items:center;"><input type="checkbox" data-ch="' + k + '" data-k="auto" ' + (ch.auto ? "checked" : "") + ' /> ارسال خودکار</label>' +
        '<label style="display:flex;gap:0.4rem;align-items:center;"><input type="checkbox" data-ch="' + k + '" data-k="manual" ' + (ch.manual ? "checked" : "") + ' /> ارسال دستی</label></div>';
    });
    html += "</div>";
    box.innerHTML = html;
    box.querySelectorAll("input[type=checkbox]").forEach(function (inp) {
      inp.addEventListener("change", function () {
        if (inp.id === "chkPeerMsg") state.messengers.allowPeerMessaging = inp.checked;
        else {
          const ch = inp.getAttribute("data-ch");
          const k = inp.getAttribute("data-k");
          if (!state.messengers.channels[ch]) state.messengers.channels[ch] = {};
          state.messengers.channels[ch][k] = inp.checked;
        }
        saveState(false);
      });
    });
  }

  function setupBackupExtras() {
    const interval = $("backupIntervalSelect");
    const email = $("backupEmailInput");
    if (interval && state.settings) {
      interval.value = String(state.settings.autoBackupIntervalMinutes || 5);
      interval.addEventListener("change", function () {
        state.settings.autoBackupIntervalMinutes = parseInt(interval.value, 10) || 5;
        saveState(false);
      });
    }
    if (email && state.settings) {
      email.value = state.settings.backupEmail || "";
      email.addEventListener("change", function () {
        state.settings.backupEmail = email.value.trim();
        saveState(false);
      });
    }
  }

  function setupInstallLinks() {
    const win = $("btnInstallWindows");
    const andr = $("btnInstallAndroid");
    const ios = $("btnInstallIos");
    let deferred = null;
    window.addEventListener("beforeinstallprompt", function (e) {
      e.preventDefault();
      deferred = e;
    });
    function tryInstall(e) {
      if (e) e.preventDefault();
      if (deferred) { deferred.prompt(); return; }
      safeAlert("از منوی مرورگر گزینه Install app / افزودن به صفحه اصلی را بزنید. آیکون برنامه لوگوی طنین طب طاها است.");
    }
    if (win) win.addEventListener("click", tryInstall);
    if (andr) andr.addEventListener("click", tryInstall);
    if (ios) ios.addEventListener("click", function (e) {
      e.preventDefault();
      safeAlert("در آیفون: دکمه Share سپس Add to Home Screen را بزنید.");
    });
  }

  function patchExcelExports() {
    if (typeof downloadCSVFile !== "function") return;
    const orig = downloadCSVFile;
    window.downloadCSVFile = function (filename, headers, rows) {
      let hdrs = headers.slice();
      let rws = rows.map(function (r) { return r.slice(); });
      if (hdrs[0] !== "ردیف") {
        hdrs = ["ردیف"].concat(hdrs);
        rws = rws.map(function (r, i) { return [i + 1].concat(r); });
      }
      if (hdrs[1] !== "نام نماینده" && hdrs.indexOf("نام نماینده") === -1 && hdrs.indexOf("نماینده علمی") === -1) {
        hdrs.splice(1, 0, "نام نماینده");
        rws = rws.map(function (r) { return [r[0], currentRepName()].concat(r.slice(1)); });
      }
      return orig(filename, hdrs, rws);
    };
  }

  function setupOnTheFlyNameFields() {
    function attach(id, getter) {
      const el = $(id);
      if (!el || el.dataset.flyBound === "1") return;
      el.dataset.flyBound = "1";
      el.addEventListener("blur", function () {
        const v = el.value.trim();
        if (!v) return;
        const list = getter();
        if (list.indexOf(v) === -1) {
          /* مقدار جدید همان لحظه در فیلد می‌ماند و هنگام ذخیره به دیتابیس می‌رود */
        }
      });
    }
    attach("pharmacyName", function () { return state.pharmacies.map(function (p) { return p.name; }); });
    attach("doctorName", function () { return state.doctors.map(function (d) { return d.name; }); });
  }

  function setupWidgetManager() {
    const btn = document.querySelector("#dashboardChartsWidget .btn");
    if (!btn || btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";
    btn.onclick = function () {
      const card = $("dashboardChartsWidget");
      if (!card) return;
      const hide = card.getAttribute("data-collapsed") === "1";
      card.setAttribute("data-collapsed", hide ? "0" : "1");
      const body = card.querySelector("div[style*='grid']");
      if (body) body.style.display = hide ? "grid" : "none";
    };
  }

  function hookSwitchTab() {
    if (typeof switchTab !== "function") return;
    const orig = switchTab;
    window.switchTab = function (id) {
      orig(id);
      setTimeout(function () {
        if (id === "tab-overview-map") applyOverviewFilters();
        if (id === "tab-rep-routes") initRepRoutesMap();
        if (id === "tab-rep-homes") initRepHomesMap();
        if (id === "tab-live-location") renderLiveLocationTabV9();
        if (id === "tab-activity-log") renderActivityChartAndTable();
        if (id === "tab-pharmacies" && typeof mapPharmacyForm !== "undefined" && mapPharmacyForm) mapPharmacyForm.invalidateSize();
        if (id === "tab-doctors" && typeof mapDoctorForm !== "undefined" && mapDoctorForm) mapDoctorForm.invalidateSize();
      }, 180);
    };
  }

  function overrideListRenderers() {
    if (typeof renderPharmaciesList === "function") window.renderPharmaciesList = renderPharmaciesListV9;
    if (typeof renderDoctorsList === "function") window.renderDoctorsList = renderDoctorsListV9;
    if (typeof renderOrdersList === "function") window.renderOrdersList = renderOrdersListV9;
    if (typeof getOrderItemsFromUI === "function") window.getOrderItemsFromUI = collectOrderItems;
    window.setupRepsTab = window.setupRepsTab || function () {};
    window.setupLiveLocationTab = setupLiveLocationV9;
    window.renderLiveLocationTab = renderLiveLocationTabV9;
  }

  function boot() {
    try { ensureStateExtras(); } catch (e) { console.error(e); }
    try { setupLoginGate(); } catch (e) { console.error(e); }
    try { setupDynamicDateFields(); } catch (e) { console.error(e); }
    try { setupTwoWayLocationSync(); } catch (e) { console.error(e); }
    try { setupSplitFormList(); } catch (e) { console.error(e); }
    try { setupSingleSaveHandlers(); } catch (e) { console.error(e); }
    try { overrideListRenderers(); } catch (e) { console.error(e); }
    try { renderPharmaciesListV9(); renderDoctorsListV9(); renderOrdersListV9(); } catch (e) { console.error(e); }
    try { bindInstantSearch(); } catch (e) { console.error(e); }
    try { setupOverviewMapV9(); } catch (e) { console.error(e); }
    try { setupRoutesUi(); } catch (e) { console.error(e); }
    try { setupHomesUi(); } catch (e) { console.error(e); }
    try { setupLiveLocationV9(); } catch (e) { console.error(e); }
    try { renderActivityChartAndTable(); } catch (e) { console.error(e); }
    try { setupMessengersUi(); } catch (e) { console.error(e); }
    try { setupBackupExtras(); } catch (e) { console.error(e); }
    try { setupInstallLinks(); } catch (e) { console.error(e); }
    try { patchExcelExports(); } catch (e) { console.error(e); }
    try { setupOnTheFlyNameFields(); } catch (e) { console.error(e); }
    try { setupWidgetManager(); } catch (e) { console.error(e); }
    try { hookSwitchTab(); } catch (e) { console.error(e); }
    console.log("✅ لایه v9.1.0 طنین طب طاها فعال شد (لوگو، نقشه دوطرفه، فرم/لیست همزمان، ذخیره تک‌منبع).");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
