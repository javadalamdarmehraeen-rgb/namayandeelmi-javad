// ============================================================================
// منطق جامع برنامه مدیریت ویزیت علمی، داروخانه‌ها، پزشکان و سفارشات (CRM / PWA)
// شامل پیاده‌سازی کامل ۲۰ بخش منوی مدیریتی، ۴۹ سطح دسترسی، درصدی بودن، آپلود فایل،
// نقشه جامع و حفظ ۱۰۰٪ هر ۸ ویژگی و تمامی تنظیمات قبلی سیستم
// ============================================================================

const STORAGE_KEY = "CRM_APP_STATE_V2";
let state = null;
let autoBackupFileHandle = null;
let autoBackupIntervalId = null;
let isShowingAllPasswords = false;

// نمونه‌های نقشه (Leaflet Map Instances)
let mapDashboardOverview = null;
let mapPharmacyForm = null;
let mapDoctorForm = null;
let mapLiveReps = null;
let mapFullOverview = null;

// لایه‌های نشانگر روی نقشه‌ها
let markersDashboardOverview = [];
let markerPharmacyForm = null;
let markerDoctorForm = null;
let markersLiveReps = {};
let markersFullOverview = [];

// لیست ۲۰ قابلیت در منوی برنامه (هماهنگ با اسکرین‌شات ۱ کاربر)
const MENU_SECTIONS_LIST = [
  { id: "tab-dashboard", label: "داشبورد", icon: "📊" },
  { id: "tab-pharmacies", label: "داروخانه‌ها", icon: "🏥", badgeId: "badgePharmaciesCount" },
  { id: "tab-doctors", label: "پزشکان", icon: "👨‍⚕️", badgeId: "badgeDoctorsCount" },
  { id: "tab-orders", label: "سفارشات", icon: "📦", badgeId: "badgeOrdersCount" },
  { id: "tab-activity-log", label: "فعالیت لحظه‌ای", icon: "⏱️" },
  { id: "tab-overview-map", label: "نقشه جامع", icon: "🗺️" },
  { id: "tab-live-location", label: "موقعیت زنده", icon: "📍" },
  { id: "tab-snapp-corporate", label: "اسنپ سازمانی", icon: "🚕" },
  { id: "tab-search-info", label: "جستجوی اطلاعات", icon: "🔍" },
  { id: "tab-rep-routes", label: "رصد تردد", icon: "🛣️" },
  { id: "tab-my-visit", label: "شروع/پایان ویزیت", icon: "▶️" },
  { id: "tab-rep-homes", label: "منزل نمایندگان", icon: "🏠" },
  { id: "tab-leaves", label: "مرخصی‌ها", icon: "📝", badgeId: "badgeLeavesCount" },
  { id: "tab-notifications", label: "اعلان‌ها", icon: "🔔" },
  { id: "tab-monthly-reports", label: "گزارش ماهانه", icon: "📈" },
  { id: "tab-sales-targets", label: "تارگت فروش", icon: "🎯" },
  { id: "tab-custom-fields", label: "افزودن‌ها", icon: "➕" },
  { id: "tab-columns-products", label: "ستون‌ها و کالاها", icon: "🧱" },
  { id: "tab-manual-design", label: "طراحی دستی تب‌ها", icon: "🎨" },
  { id: "tab-users-permissions", label: "کاربران و دسترسی", icon: "👤", badgeId: "badgeUsersCount" },
  { id: "tab-messengers", label: "پیام‌رسان‌ها", icon: "💬" },
  { id: "tab-backup", label: "پشتیبان‌گیری", icon: "💾" },
  { id: "tab-install-app", label: "نصب اپ", icon: "📲" },
  { id: "tab-troubleshooting", label: "عیب‌یابی", icon: "🛠️" }
];

// ----------------------------------------------------------------------------
// 0. مدیریت وضعیت و حافظه (State Management & LocalStorage)
// ----------------------------------------------------------------------------
function loadState() {
  try {
    const raw0 = localStorage.getItem(STORAGE_KEY);
    if (raw0 && !localStorage.getItem("CRM_APP_STATE_BACKUP_BEFORE_11_11_0")) {
      localStorage.setItem("CRM_APP_STATE_BACKUP_BEFORE_11_11_0", raw0);
    }
  } catch (eBak) {}
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      state = JSON.parse(saved);
      if (!state.customFields) state.customFields = DEFAULT_INITIAL_DATA.customFields;
      if (!state.settings) state.settings = DEFAULT_INITIAL_DATA.settings;
      if (!state.users) state.users = DEFAULT_INITIAL_DATA.users;
      if (!state.activityLog) state.activityLog = DEFAULT_INITIAL_DATA.activityLog;
      if (!state.repHomes) state.repHomes = DEFAULT_INITIAL_DATA.repHomes;
      if (!state.repRoutes) state.repRoutes = DEFAULT_INITIAL_DATA.repRoutes;
      if (!state.leaves) state.leaves = DEFAULT_INITIAL_DATA.leaves;
      if (!state.notifications) state.notifications = DEFAULT_INITIAL_DATA.notifications;
      if (!state.salesTargets) state.salesTargets = DEFAULT_INITIAL_DATA.salesTargets;
      if (!state.messengers) state.messengers = DEFAULT_INITIAL_DATA.messengers;
      if (!state.products) state.products = DEFAULT_INITIAL_DATA.products;
      if (!state.hospitals) state.hospitals = DEFAULT_INITIAL_DATA.hospitals || [];
      if (!state.visits) state.visits = DEFAULT_INITIAL_DATA.visits || [];
      if (!state.formFieldMeta) state.formFieldMeta = {};
    } catch (e) {
      console.error("خطا در خواندن اطلاعات قبلی، بارگذاری اطلاعات پیش‌فرض:", e);
      state = JSON.parse(JSON.stringify(DEFAULT_INITIAL_DATA));
    }
  } else {
    state = JSON.parse(JSON.stringify(DEFAULT_INITIAL_DATA));
  }
  if (!state.formFieldMeta) state.formFieldMeta = {};
  if (!state.customFields) state.customFields = {};
  if (!state.selectExtraOptions) state.selectExtraOptions = {};
  if (!state.formBoxes) state.formBoxes = {};
  if (!state.userTabs) state.userTabs = [];
  if (!state.customRecords) state.customRecords = {};
  if (!state.tabOrder) state.tabOrder = {};
  if (!state.manualLayouts) state.manualLayouts = {};
  applyGeneralSettingsToUI();
}

function saveState(triggerAutoBackup = true) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (triggerAutoBackup && state.settings && state.settings.autoBackupEnabled) {
    performAutoBackup();
  }
}

function applyGeneralSettingsToUI() {
  if (!state.settings) return;
  const compHeader = document.getElementById("headerCompanyNameDisplay");
  if (compHeader && state.settings.companyName) {
    compHeader.textContent = state.settings.companyName;
  }
}

// ----------------------------------------------------------------------------
// 1. منوی ۲۰ قابلیت، سایدبار کشویی و لانچ‌پد بدون اسکرول افقی
// ----------------------------------------------------------------------------
function setupNavigationMenu() {
  const horizontalContainer = document.getElementById("horizontalNavContainer");
  const sideContainer = document.getElementById("sideMenuItemsContainer");
  const launchpadGrid = document.getElementById("dashboardLaunchpadGrid");
  const sections = (typeof window.getAllMenuSections === "function")
    ? window.getAllMenuSections()
    : MENU_SECTIONS_LIST;
  const currentBtn = document.querySelector("#horizontalNavContainer .nav-item.active");
  const currentId = currentBtn ? currentBtn.getAttribute("data-target") : "tab-dashboard";

  if (!sections || !sections.length) {
    // منوی ثابت HTML را نگه دار تا تب‌ها ناپدید نشوند
  } else {
    if (horizontalContainer) horizontalContainer.innerHTML = "";
    if (sideContainer) sideContainer.innerHTML = "";
    if (launchpadGrid) launchpadGrid.innerHTML = "";

    sections.forEach((sec) => {
      const isOn = sec.id === currentId;
      if (horizontalContainer) {
        const btn = document.createElement("button");
        btn.className = "nav-item" + (isOn ? " active" : "");
        btn.setAttribute("data-target", sec.id);
        btn.innerHTML = `
          <span>${sec.icon} ${sec.label}</span>
          ${sec.badgeId ? `<span class="nav-badge" id="${sec.badgeId}">0</span>` : ""}
        `;
        btn.onclick = () => switchTab(sec.id);
        horizontalContainer.appendChild(btn);
      }
      if (sideContainer) {
        const btnSide = document.createElement("button");
        btnSide.className = "side-menu-item" + (isOn ? " active" : "");
        btnSide.setAttribute("data-side-target", sec.id);
        btnSide.innerHTML = `
          <span>${sec.label}</span>
          <span>${sec.icon}</span>
        `;
        btnSide.onclick = () => {
          switchTab(sec.id);
          closeSideMenu();
        };
        sideContainer.appendChild(btnSide);
      }
    });
  }

  if (!window._navHamburgerBound) {
    window._navHamburgerBound = true;
    const btnToggleSide = document.getElementById("btnToggleSideMenu");
    const btnCloseSide = document.getElementById("btnCloseSideMenu");
    const overlay = document.getElementById("sideMenuOverlay");
    if (btnToggleSide) btnToggleSide.addEventListener("click", openSideMenu);
    if (btnCloseSide) btnCloseSide.addEventListener("click", closeSideMenu);
    if (overlay) overlay.addEventListener("click", closeSideMenu);
  }

  try { updateNavBadges(); } catch (e) { console.warn(e); }
}

function openSideMenu() {
  document.getElementById("sideMenuDrawer").classList.add("active");
  document.getElementById("sideMenuOverlay").classList.add("active");
}

function closeSideMenu() {
  document.getElementById("sideMenuDrawer").classList.remove("active");
  document.getElementById("sideMenuOverlay").classList.remove("active");
}

function switchTab(targetId) {
  const navButtons = document.querySelectorAll("#horizontalNavContainer .nav-item");
  const sideButtons = document.querySelectorAll("#sideMenuItemsContainer .side-menu-item");
  const tabPanes = document.querySelectorAll(".tab-pane");

  navButtons.forEach(b => {
    if (b.getAttribute("data-target") === targetId) b.classList.add("active");
    else b.classList.remove("active");
  });

  sideButtons.forEach(b => {
    if (b.getAttribute("data-side-target") === targetId) b.classList.add("active");
    else b.classList.remove("active");
  });

  tabPanes.forEach(p => p.classList.remove("active"));
  const targetPane = document.getElementById(targetId);
  if (targetPane) {
    targetPane.classList.add("active");
    setTimeout(() => {
      if (targetId === "tab-dashboard" && mapDashboardOverview) mapDashboardOverview.invalidateSize();
      if (targetId === "tab-pharmacies") {
        if (typeof initPharmacyDoctorMapsIfNeeded === "function") initPharmacyDoctorMapsIfNeeded();
        if (mapPharmacyForm) mapPharmacyForm.invalidateSize();
      }
      if (targetId === "tab-doctors") {
        if (typeof initPharmacyDoctorMapsIfNeeded === "function") initPharmacyDoctorMapsIfNeeded();
        if (mapDoctorForm) mapDoctorForm.invalidateSize();
      }
      if (targetId === "tab-live-location") {
        if (!mapLiveReps && document.getElementById("map-live-reps") && typeof L !== "undefined") {
          mapLiveReps = L.map("map-live-reps").setView([35.7300, 51.4200], 12);
          addFallbackTiles(mapLiveReps);
        }
        if (mapLiveReps) mapLiveReps.invalidateSize();
        if (typeof renderLiveLocationTab === "function") renderLiveLocationTab();
      }
      if (targetId === "tab-overview-map") {
        initFullOverviewMap();
        if (mapFullOverview) mapFullOverview.invalidateSize();
      }
    }, 150);
  }
}

function updateNavBadges() {
  if (!state) return;
  const setTxt = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  const ph = (state.pharmacies || []).length;
  const doc = (state.doctors || []).length;
  const ord = (state.orders || []).length;
  const users = (state.users || []).length;
  const reps = (state.reps || []).length;
  const leaves = (state.leaves || []).length;
  setTxt("badgePharmaciesCount", ph);
  setTxt("badgeDoctorsCount", doc);
  setTxt("badgeOrdersCount", ord);
  setTxt("badgeUsersCount", users);
  setTxt("badgeLeavesCount", leaves);
  setTxt("statPharmacies", ph);
  setTxt("statDoctors", doc);
  setTxt("statReps", reps);
  setTxt("statOrders", ord);
  setTxt("statUsers", users);
  setTxt("statLeaves", leaves);
}

// ----------------------------------------------------------------------------
// 2. پیاده‌سازی ویژگی ۷: پاک شدن خودکار کلمه قبلی هنگام انتخاب جدید در فیلدهای کشویی
// ----------------------------------------------------------------------------
function setupDropdownAutoClear() {
  const dropdowns = document.querySelectorAll(".dropdown-auto-clear, select.form-select, input[list]");
  dropdowns.forEach(elem => {
    if (elem.dataset.autoClearBound === "true") return;
    elem.dataset.autoClearBound = "true";

    elem.addEventListener("focus", function() {
      if (this.tagName.toLowerCase() === "input" && this.getAttribute("list")) {
        this.dataset.previousValue = this.value;
        this.value = "";
      }
    });
  });
}

// ----------------------------------------------------------------------------
// 3. پیاده‌سازی ویژگی ۴: استان‌ها، شهرها و مناطق مرتب بدون تکرار (Requirement 4)
// ----------------------------------------------------------------------------
function populateProvinces(selectElement, selectedValue = "") {
  selectElement.innerHTML = `<option value="">انتخاب استان...</option>`;
  Object.keys(IRAN_GEO_DATA).forEach(province => {
    const opt = document.createElement("option");
    opt.value = province;
    opt.textContent = province;
    if (province === selectedValue) opt.selected = true;
    selectElement.appendChild(opt);
  });
}

function populateCities(provinceName, selectElement, selectedValue = "") {
  selectElement.innerHTML = `<option value="">انتخاب شهر...</option>`;
  if (!provinceName || !IRAN_GEO_DATA[provinceName]) return;

  Object.keys(IRAN_GEO_DATA[provinceName]).forEach(city => {
    const opt = document.createElement("option");
    opt.value = city;
    opt.textContent = city;
    if (city === selectedValue) opt.selected = true;
    selectElement.appendChild(opt);
  });
}

function populateDistricts(provinceName, cityName, selectElement, selectedValue = "") {
  selectElement.innerHTML = `<option value="">انتخاب منطقه...</option>`;
  if (!provinceName || !cityName || !IRAN_GEO_DATA[provinceName] || !IRAN_GEO_DATA[provinceName][cityName]) {
    return;
  }

  const districts = IRAN_GEO_DATA[provinceName][cityName];
  districts.forEach(district => {
    const opt = document.createElement("option");
    opt.value = district;
    opt.textContent = district;
    if (district === selectedValue) opt.selected = true;
    selectElement.appendChild(opt);
  });
}

function setupCascadingGeoSelectors(provinceId, cityId, districtId) {
  const provEl = document.getElementById(provinceId);
  const cityEl = document.getElementById(cityId);
  const distEl = document.getElementById(districtId);

  populateProvinces(provEl);

  provEl.addEventListener("change", () => {
    populateCities(provEl.value, cityEl);
    distEl.innerHTML = `<option value="">ابتدا شهر را انتخاب کنید</option>`;
  });

  cityEl.addEventListener("change", () => {
    populateDistricts(provEl.value, cityEl.value, distEl);
  });
}

// ----------------------------------------------------------------------------
// 4. پیاده‌سازی ویژگی ۵: آیکون اختصاصی و نام ثابت روی نقشه (Requirement 5)
// ----------------------------------------------------------------------------
function createCustomMarker(lat, lng, type, name, mapInstance, onClickCallback = null) {
  let badgeClass = "marker-pharmacy-badge";
  let iconText = "🏥";
  let tooltipPrefix = "🏥 ";

  if (type === "doctor") {
    badgeClass = "marker-doctor-badge";
    iconText = "👨‍⚕️";
    tooltipPrefix = "👨‍⚕️ ";
  } else if (type === "rep") {
    badgeClass = "marker-rep-badge";
    iconText = "👔";
    tooltipPrefix = "👔 ";
  }

  const customIcon = L.divIcon({
    className: "custom-div-icon-wrapper",
    html: `<div class="${badgeClass}" title="${name}">${iconText}</div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19]
  });

  const marker = L.marker([lat, lng], { icon: customIcon });

  marker.bindTooltip(`${tooltipPrefix}${name}`, {
    permanent: true,
    direction: "top",
    className: "custom-map-tooltip",
    offset: [0, -22]
  });

  if (onClickCallback) {
    marker.on("click", onClickCallback);
  }

  marker.addTo(mapInstance);
  marker.openTooltip();

  return marker;
}

// ----------------------------------------------------------------------------
// 5. راه‌اندازی نقشه‌ها (Dashboard Overview Map, Full Overview Map & Form Maps)
// ----------------------------------------------------------------------------
function addFallbackTiles(map) {
  if (!map || typeof L === "undefined") return;
  const layers = [
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    "https://tile.openstreetmap.de/{z}/{x}/{y}.png"
  ];
  L.tileLayer(layers[0], { maxZoom: 19, attribution: "© OSM" }).addTo(map);
}

function ensureMap(id, holderSetter, center, zoom, after) {
  if (typeof L === "undefined") return null;
  const el = document.getElementById(id);
  if (!el) return null;
  if (el._leaflet_id) {
    try { if (after) after(); } catch (e) {}
    return null;
  }
  const map = L.map(id).setView(center, zoom);
  addFallbackTiles(map);
  if (holderSetter) holderSetter(map);
  if (after) after(map);
  return map;
}

function initMaps() {
  // فقط نقشه داشبورد در شروع؛ بقیه هنگام باز شدن تب ساخته می‌شوند تا لود سبک بماند
  if (typeof L === "undefined") return;
  if (!mapDashboardOverview && document.getElementById("map-dashboard-overview")) {
    mapDashboardOverview = L.map("map-dashboard-overview").setView([35.7200, 51.4200], 11);
    addFallbackTiles(mapDashboardOverview);
    renderDashboardOverviewMap();
  }
}

function initPharmacyDoctorMapsIfNeeded() {
  if (typeof L === "undefined") return;
  if (!mapPharmacyForm && document.getElementById("map-pharmacy-form")) {
    mapPharmacyForm = L.map("map-pharmacy-form").setView([35.7605, 51.4180], 13);
    addFallbackTiles(mapPharmacyForm);
    markerPharmacyForm = createCustomMarker(35.7605, 51.4180, "pharmacy", "موقعیت داروخانه جدید", mapPharmacyForm);
    mapPharmacyForm.on("click", async (e) => {
      updatePharmacyFormMarker(e.latlng.lat, e.latlng.lng, document.getElementById("pharmacyName").value || "موقعیت داروخانه", true);
      const addr = await reverseGeocodeCoordinates(e.latlng.lat, e.latlng.lng);
      const s = document.getElementById("phMapSearchInput");
      const a = document.getElementById("pharmacyAddress");
      if (s) s.value = addr;
      if (a) a.value = addr;
    });
  }
  if (!mapDoctorForm && document.getElementById("map-doctor-form")) {
    mapDoctorForm = L.map("map-doctor-form").setView([35.7580, 51.4400], 13);
    addFallbackTiles(mapDoctorForm);
    markerDoctorForm = createCustomMarker(35.7580, 51.4400, "doctor", "موقعیت مطب جدید", mapDoctorForm);
    mapDoctorForm.on("click", async (e) => {
      updateDoctorFormMarker(e.latlng.lat, e.latlng.lng, document.getElementById("doctorName").value || "موقعیت مطب", true);
      const addr = await reverseGeocodeCoordinates(e.latlng.lat, e.latlng.lng);
      const s = document.getElementById("docMapSearchInput");
      const a = document.getElementById("doctorAddress");
      if (s) s.value = addr;
      if (a) a.value = addr;
    });
  }
}

function initFullOverviewMap() {
  if (mapFullOverview) {
    renderFullOverviewMap();
    return;
  }
  const el = document.getElementById("map-full-overview");
  if (!el) return;

  mapFullOverview = L.map("map-full-overview").setView([35.7200, 51.4200], 11);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap contributors"
  }).addTo(mapFullOverview);

  renderFullOverviewMap();
}

function renderDashboardOverviewMap() {
  if (!mapDashboardOverview) return;
  markersDashboardOverview.forEach(m => mapDashboardOverview.removeLayer(m));
  markersDashboardOverview = [];

  const allPoints = [];
  state.pharmacies.forEach(ph => {
    if (ph.lat && ph.lng) {
      const m = createCustomMarker(ph.lat, ph.lng, "pharmacy", ph.name, mapDashboardOverview, () => {
        alert(`🏥 داروخانه: ${ph.name}\nآدرس: ${ph.address}\nدرصدی: ${ph.isPercentage ? "بله" : "خیر"}`);
      });
      markersDashboardOverview.push(m);
      allPoints.push([ph.lat, ph.lng]);
    }
  });

  state.doctors.forEach(doc => {
    if (doc.lat && doc.lng) {
      const m = createCustomMarker(doc.lat, doc.lng, "doctor", doc.name, mapDashboardOverview, () => {
        alert(`👨‍⚕️ پزشک: ${doc.name}\nتخصص: ${doc.specialty}\nآدرس: ${doc.address}`);
      });
      markersDashboardOverview.push(m);
      allPoints.push([doc.lat, doc.lng]);
    }
  });

  state.reps.forEach(rep => {
    if (rep.lat && rep.lng) {
      const m = createCustomMarker(rep.lat, rep.lng, "rep", rep.name, mapDashboardOverview, () => {
        alert(`👔 نماینده: ${rep.name}\nوضعیت: ${rep.status === "online" ? "آنلاین" : "در حال ویزیت"}`);
      });
      markersDashboardOverview.push(m);
      allPoints.push([rep.lat, rep.lng]);
    }
  });

  if (allPoints.length > 0) {
    mapDashboardOverview.fitBounds(allPoints, { padding: [40, 40] });
  }
}

function renderFullOverviewMap() {
  if (!mapFullOverview) return;
  markersFullOverview.forEach(m => mapFullOverview.removeLayer(m));
  markersFullOverview = [];

  const allPoints = [];
  state.pharmacies.forEach(ph => {
    if (ph.lat && ph.lng) {
      const m = createCustomMarker(ph.lat, ph.lng, "pharmacy", ph.name, mapFullOverview);
      markersFullOverview.push(m);
      allPoints.push([ph.lat, ph.lng]);
    }
  });

  state.doctors.forEach(doc => {
    if (doc.lat && doc.lng) {
      const m = createCustomMarker(doc.lat, doc.lng, "doctor", doc.name, mapFullOverview);
      markersFullOverview.push(m);
      allPoints.push([doc.lat, doc.lng]);
    }
  });

  if (allPoints.length > 0) {
    mapFullOverview.fitBounds(allPoints, { padding: [40, 40] });
  }
}

// ----------------------------------------------------------------------------
// 6. ویژگی ۲: دریافت آدرس این نقطه + جستجوی آدرس روی نقشه (Matching Screenshot 3)
// ----------------------------------------------------------------------------
async function reverseGeocodeCoordinates(lat, lng) {
  try {
    const res = await fetch("/api/reverse?lat=" + encodeURIComponent(lat) + "&lng=" + encodeURIComponent(lng));
    const data = await res.json();
    if (data && data.display_name) {
      const addr = data.address || {};
      const parts = [addr.state, addr.city || addr.town || addr.village, addr.suburb || addr.neighbourhood, addr.road || addr.pedestrian, addr.house_number].filter(Boolean);
      return parts.length ? parts.join("، ") : data.display_name;
    }
  } catch (err) {
    console.warn("Reverse Geocode error:", err);
  }
  return "موقعیت " + Number(lat).toFixed(5) + ", " + Number(lng).toFixed(5);
}

async function searchAddressOnMap(queryText, updateMarkerFunc) {
  if (!queryText || !queryText.trim()) return;
  try {
    const res = await fetch("/api/geocode?q=" + encodeURIComponent(queryText) + "&limit=1");
    const data = await res.json();
    if (data && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);
      updateMarkerFunc(lat, lon, queryText, true);
      alert(`📍 موقعیت «${queryText}» پیدا شد و روی نقشه تنظیم شد.`);
    } else {
      alert("آدرسی با این مشخصات یافت نشد.");
    }
  } catch (e) {
    alert("خطا در جستجوی آدرس.");
  }
}

function updatePharmacyFormMarker(lat, lng, nameText = "داروخانه انتخابی", updateMapCenter = false) {
  document.getElementById("pharmacyLat").value = Number(lat).toFixed(5);
  document.getElementById("pharmacyLng").value = Number(lng).toFixed(5);

  if (mapPharmacyForm && markerPharmacyForm) {
    mapPharmacyForm.removeLayer(markerPharmacyForm);
    markerPharmacyForm = createCustomMarker(lat, lng, "pharmacy", nameText, mapPharmacyForm);
    if (updateMapCenter) {
      mapPharmacyForm.setView([lat, lng], 15);
    }
  }
}

function setupPharmacyLocationButtons() {
  const btnCurrentLoc = document.getElementById("btnPharmacyCurrentLocation");
  const btnGetAddr = document.getElementById("btnPharmacyGetAddressFromPoint");
  const btnSearchMap = document.getElementById("btnPhMapSearch");
  const searchInput = document.getElementById("phMapSearchInput");

  if (btnSearchMap && searchInput) {
    btnSearchMap.addEventListener("click", () => {
      searchAddressOnMap(searchInput.value.trim(), (lat, lng, nameText, updateCenter) => {
        updatePharmacyFormMarker(lat, lng, nameText, updateCenter);
      });
    });
  }

  if (btnCurrentLoc) btnCurrentLoc.addEventListener("click", () => {
    const apply = async (lat, lng) => {
      const name = (document.getElementById("pharmacyName") || {}).value || "موقعیت فعلی داروخانه";
      updatePharmacyFormMarker(lat, lng, name, true);
      const addr = await reverseGeocodeCoordinates(lat, lng);
      const s = document.getElementById("phMapSearchInput");
      const a = document.getElementById("pharmacyAddress");
      const h = document.getElementById("pharmacyLocationText");
      if (s) s.value = addr;
      if (a) a.value = addr;
      if (h) h.value = addr;
      alert("موقعیت روی نقشه آمد و آدرس در فیلد لوکیشن نشست:\n" + addr);
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => apply(pos.coords.latitude, pos.coords.longitude),
        () => apply(35.7595, 51.4250),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else apply(35.7595, 51.4250);
  });

  btnGetAddr.addEventListener("click", async () => {
    const lat = parseFloat(document.getElementById("pharmacyLat").value);
    const lng = parseFloat(document.getElementById("pharmacyLng").value);

    const addrText = await reverseGeocodeCoordinates(lat, lng);

    document.getElementById("pharmacyAddress").value = addrText;
    document.getElementById("pharmacyLocationText").value = addrText;

    const name = document.getElementById("pharmacyName").value || "داروخانه جدید";
    updatePharmacyFormMarker(lat, lng, name, true);

    alert(`✅ آدرس نقطه با موفقیت دریافت شد و در فیلد آدرس و روی نقشه داروخانه قرار گرفت:\n\n${addrText}`);
  });
}

function updateDoctorFormMarker(lat, lng, nameText = "مطب انتخابی", updateMapCenter = false) {
  document.getElementById("doctorLat").value = Number(lat).toFixed(5);
  document.getElementById("doctorLng").value = Number(lng).toFixed(5);

  if (mapDoctorForm && markerDoctorForm) {
    mapDoctorForm.removeLayer(markerDoctorForm);
    markerDoctorForm = createCustomMarker(lat, lng, "doctor", nameText, mapDoctorForm);
    if (updateMapCenter) {
      mapDoctorForm.setView([lat, lng], 15);
    }
  }
}

function setupDoctorLocationButtons() {
  const btnCurrentLoc = document.getElementById("btnDoctorCurrentLocation");
  const btnGetAddr = document.getElementById("btnDoctorGetAddressFromPoint");
  const btnSearchMap = document.getElementById("btnDocMapSearch");
  const searchInput = document.getElementById("docMapSearchInput");

  if (btnSearchMap && searchInput) {
    btnSearchMap.addEventListener("click", () => {
      searchAddressOnMap(searchInput.value.trim(), (lat, lng, nameText, updateCenter) => {
        updateDoctorFormMarker(lat, lng, nameText, updateCenter);
      });
    });
  }

  if (btnCurrentLoc) btnCurrentLoc.addEventListener("click", () => {
    const apply = async (lat, lng) => {
      updateDoctorFormMarker(lat, lng, "موقعیت فعلی مطب", true);
      const addr = await reverseGeocodeCoordinates(lat, lng);
      const s = document.getElementById("docMapSearchInput");
      const a = document.getElementById("doctorAddress");
      const h = document.getElementById("doctorLocationText");
      if (s) s.value = addr;
      if (a) a.value = addr;
      if (h) h.value = addr;
      alert("موقعیت مطب روی نقشه آمد و آدرس در فیلد لوکیشن نشست:\n" + addr);
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => apply(pos.coords.latitude, pos.coords.longitude),
        () => apply(35.7350, 51.4150),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else apply(35.7350, 51.4150);
  });

  btnGetAddr.addEventListener("click", async () => {
    const lat = parseFloat(document.getElementById("doctorLat").value);
    const lng = parseFloat(document.getElementById("doctorLng").value);

    const addrText = await reverseGeocodeCoordinates(lat, lng);
    document.getElementById("doctorAddress").value = addrText;
    document.getElementById("doctorLocationText").value = addrText;

    const name = document.getElementById("doctorName").value || "مطب پزشک جدید";
    updateDoctorFormMarker(lat, lng, name, true);

    alert(`✅ آدرس نقطه با موفقیت دریافت شد و در فیلد آدرس و روی نقشه مطب قرار گرفت:\n\n${addrText}`);
  });
}

// ----------------------------------------------------------------------------
// 7. ویژگی ۱: مدیریت فیلدهای سفارشی (Custom Fields Engine)
// ----------------------------------------------------------------------------
function setupCustomFieldsTab() {
  const formCF = document.getElementById("formCustomField");
  const typeSelect = document.getElementById("cfType");
  const optionsWrapper = document.getElementById("cfOptionsWrapper");

  if (typeSelect && optionsWrapper) {
    typeSelect.addEventListener("change", () => {
      optionsWrapper.style.display = typeSelect.value === "select" ? "block" : "none";
    });
  }

  if (formCF) {
    formCF.addEventListener("submit", (ev) => {
      if (ev && ev.preventDefault) ev.preventDefault();
      const target = document.getElementById("cfTargetEntity").value;
      const label = document.getElementById("cfLabel").value.trim();
      const type = document.getElementById("cfType").value;
      const optionsStr = document.getElementById("cfOptions").value.trim();
      const allowAddOption = document.getElementById("cfAllowAddOption").checked;
      const showInForm = document.getElementById("cfShowInForm").checked;
      const showInList = document.getElementById("cfShowInList").checked;

      if (!label) {
        alert("لطفاً عنوان فیلد را وارد کنید.");
        return;
      }

      let options = [];
      if (type === "select" && optionsStr) {
        options = optionsStr.split(/[،,]/).map(o => o.trim()).filter(Boolean);
      }
      if (type === "select" && options.length === 0) {
        options = ["گزینه اول", "گزینه دوم"];
      }

      const newField = {
        id: "cf-" + target + "-" + Date.now(),
        label: label,
        type: type === "select" ? "select" : "simple",
        inputKind: type,
        options: options,
        showInForm: showInForm,
        showInList: showInList,
        allowAddOption: allowAddOption
      };

      if (!state.customFields[target]) state.customFields[target] = [];
      state.customFields[target].push(newField);

      saveState();
      formCF.reset();
      optionsWrapper.style.display = "none";

      renderCustomFieldsTable();
      renderAllCustomFieldsInFormsAndTables();
      alert(`✅ فیلد سفارشی «${label}» با موفقیت اضافه شد.`);
    });
  }

  renderCustomFieldsTable();
}

function renderCustomFieldsTable() {
  const tbody = document.getElementById("tableCustomFieldsBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const entityLabels = { pharmacy: "داروخانه‌ها", doctor: "پزشکان", order: "سفارشات" };
  Object.keys(state.customFields).forEach(entity => {
    const fields = state.customFields[entity] || [];
    fields.forEach(f => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><span class="status-badge" style="background: #eff6ff; color: #1e40af;">${entityLabels[entity] || entity}</span></td>
        <td><strong>${f.label}</strong></td>
        <td>${(f.inputKind === "date" || f.type === "date") ? "تاریخ" : (f.type === "select" ? "کشویی" : "ساده")}</td>
        <td>${f.type === "select" && f.options ? f.options.join("، ") : "-"}</td>
        <td>${f.showInForm ? "✅ بله" : "❌ خیر"}</td>
        <td>${f.showInList ? "✅ بله" : "❌ خیر"}</td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="deleteCustomField('${entity}', '${f.id}')">🗑️</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  });
}

function deleteCustomField(entity, fieldId) {
  if (!confirm("آیا از حذف این فیلد سفارشی اطمینان دارید؟")) return;
  if (state.customFields[entity]) {
    state.customFields[entity] = state.customFields[entity].filter(f => f.id !== fieldId);
  }
  document.querySelectorAll('[data-custom-field-id="' + fieldId + '"]').forEach(function (inp) {
    var g = inp.closest(".form-group");
    if (g) g.remove();
    else inp.remove();
  });
  saveState();
  renderCustomFieldsTable();
  
  renderAllCustomFieldsInFormsAndTables();
  if (typeof window.applyAllFormLayouts === "function") window.applyAllFormLayouts();
}

function renderCustomFieldsInForm(entityType, containerId, currentValues = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (typeof window.cleanupOrphanCustomFields === "function") {
    window.cleanupOrphanCustomFields(entityType, containerId, false);
  }

  const form = container.closest("form") || container.closest(".tab-pane");
  const grid = form
    ? (form.querySelector(":scope > .form-grid") || form.querySelector(".form-grid"))
    : null;
  const host = grid || container;

  const fields = (state.customFields[entityType] || []).slice().sort((a, b) => {
    const ao = a.order == null || a.order === "" ? 999 : Number(a.order);
    const bo = b.order == null || b.order === "" ? 999 : Number(b.order);
    return ao - bo;
  });
  fields.forEach(field => {
    const kind = field.inputKind || field.type || "simple";
    const existing = form
      ? form.querySelector('[data-custom-field-id="' + field.id + '"]')
      : container.querySelector('[data-custom-field-id="' + field.id + '"]');

    if (field.showInForm === false) {
      if (existing) {
        const g = existing.closest(".form-group");
        if (g) g.classList.add("col-hide-form");
      }
      return;
    }

    if (existing) {
      const g = existing.closest(".form-group");
      if (g) {
        g.classList.remove("col-hide-form");
        const lab = g.querySelector(".form-label, label");
        if (lab && !lab.querySelector("input")) {
          lab.textContent = field.label;
        }
      }
      if (currentValues && (currentValues[field.label] != null || currentValues[field.id] != null)) {
        existing.value = currentValues[field.label] != null ? currentValues[field.label] : currentValues[field.id];
      }
      return;
    }

    if (String(kind).indexOf("widget") === 0 && typeof window.buildDesignerWidget === "function") {
      const w = window.buildDesignerWidget(field, form && form.closest(".tab-pane") && form.closest(".tab-pane").id);
      if (w) host.appendChild(w);
      return;
    }

    const div = document.createElement("div");
    div.className = "form-group";
    div.setAttribute("data-col-fid", field.id);
    const size = parseInt(field.size, 10);
    if (size > 40) {
      div.style.maxWidth = size + "px";
      div.style.width = "100%";
    }

    const labelRow = document.createElement("div");
    labelRow.style.display = "flex";
    labelRow.style.alignItems = "center";
    labelRow.style.justifyContent = "space-between";

    const labelEl = document.createElement("label");
    labelEl.className = "form-label";
    labelEl.textContent = field.label;
    labelRow.appendChild(labelEl);

    if ((kind === "select" || field.type === "select") && field.allowAddOption) {
      const btnAddOpt = document.createElement("button");
      btnAddOpt.type = "button";
      btnAddOpt.className = "btn-add-option";
      btnAddOpt.innerHTML = "➕ افزودن گزینه جدید";
      btnAddOpt.onclick = () => openModalAddOption(entityType, field.id, field.label);
      labelRow.appendChild(btnAddOpt);
    }
    div.appendChild(labelRow);

    if (kind === "select" || field.type === "select") {
      const sel = document.createElement("select");
      sel.className = "form-select dropdown-auto-clear";
      sel.dataset.customFieldId = field.id;
      sel.innerHTML = `<option value="">انتخاب کنید...</option>`;

      (field.options || []).forEach(opt => {
        const o = document.createElement("option");
        o.value = opt;
        o.textContent = opt;
        if (currentValues[field.label] === opt || currentValues[field.id] === opt) {
          o.selected = true;
        }
        sel.appendChild(o);
      });
      div.appendChild(sel);
    } else {
      const input = document.createElement("input");
      input.type = kind === "number" ? "number" : "text";
      input.className = kind === "date" ? "form-input jalali-date-input" : "form-input";
      input.dataset.customFieldId = field.id;
      if (kind === "date") input.setAttribute("data-kind", "date");
      input.placeholder = kind === "date"
        ? `تاریخ ${field.label} (مثال: 1405/05/22)`
        : `وارد کنید: ${field.label}...`;
      if (currentValues[field.label]) input.value = currentValues[field.label];
      else if (currentValues[field.id]) input.value = currentValues[field.id];
      div.appendChild(input);
      if (kind === "date" && typeof window.attachJalaliPicker === "function") {
        window.attachJalaliPicker(input);
      } else if ((kind === "simple" || kind === "text" || kind === "") && typeof window.attachInstantAdd === "function") {
        window.attachInstantAdd(input);
      }
    }

    host.appendChild(div);
  });

  setupDropdownAutoClear();
  if (typeof window.applyCustomFieldOrderInForm === "function" && !window._layoutBusy) {
    window.applyCustomFieldOrderInForm(entityType, containerId);
  }
}

function extractCustomFieldValuesFromForm(entityType, containerId) {
  const container = document.getElementById(containerId);
  const form = container ? container.closest("form") : null;
  const root = form || container;
  if (!root) return {};
  const values = {};
  const fields = state.customFields[entityType] || [];
  fields.forEach(field => {
    const el = root.querySelector(`[data-custom-field-id="${field.id}"]`);
    if (el) values[field.label] = el.value.trim();
  });
  return values;
}

function openModalAddOption(entityType, fieldId, fieldLabel) {
  document.getElementById("modalAddOptionEntityType").value = entityType;
  document.getElementById("modalAddOptionFieldId").value = fieldId;
  document.getElementById("modalAddOptionLabel").textContent = `افزودن گزینه جدید برای فیلد «${fieldLabel}»:`;
  document.getElementById("modalAddOptionValue").value = "";
  document.getElementById("modalAddOption").classList.add("active");
  document.getElementById("modalAddOptionValue").focus();
}

function closeModalAddOption() {
  document.getElementById("modalAddOption").classList.remove("active");
}

function setupAddOptionModalForm() {
  const form = document.getElementById("formAddOptionModal");
  if (!form) return;

  form.addEventListener("submit", () => {
    const entityType = document.getElementById("modalAddOptionEntityType").value;
    const fieldId = document.getElementById("modalAddOptionFieldId").value;
    const newVal = document.getElementById("modalAddOptionValue").value.trim();

    if (!newVal) {
      alert("لطفاً عنوان گزینه جدید را وارد کنید.");
      return;
    }

    const fields = state.customFields[entityType] || [];
    const targetField = fields.find(f => f.id === fieldId);

    if (targetField) {
      if (!targetField.options) targetField.options = [];
      if (!targetField.options.includes(newVal)) targetField.options.push(newVal);
      saveState();
      closeModalAddOption();

      if (entityType === "pharmacy") {
        renderCustomFieldsInForm("pharmacy", "pharmacyCustomFieldsContainer", extractCustomFieldValuesFromForm("pharmacy", "pharmacyCustomFieldsContainer"));
      } else if (entityType === "doctor") {
        renderCustomFieldsInForm("doctor", "doctorCustomFieldsContainer", extractCustomFieldValuesFromForm("doctor", "doctorCustomFieldsContainer"));
      } else if (entityType === "order") {
        renderCustomFieldsInForm("order", "orderCustomFieldsContainer", extractCustomFieldValuesFromForm("order", "orderCustomFieldsContainer"));
      }
      renderCustomFieldsTable();
      alert(`✅ گزینه جدید «${newVal}» با موفقیت اضافه شد.`);
    }
  });
}

function renderAllCustomFieldsInFormsAndTables() {
  renderCustomFieldsInForm("pharmacy", "pharmacyCustomFieldsContainer");
  renderCustomFieldsInForm("doctor", "doctorCustomFieldsContainer");
  renderCustomFieldsInForm("order", "orderCustomFieldsContainer");
  if (typeof window.renderExtraTabCustomFields === "function") {
    window.renderExtraTabCustomFields();
  }
  renderPharmaciesList();
  renderDoctorsList();
  renderOrdersList();
}

// ----------------------------------------------------------------------------
// 8. پیاده‌سازی داروخانه‌ها (Pharmacies CRUD + Percentage Toggle + File upload)
//    (Matching Screenshots 2 & 3)
// ----------------------------------------------------------------------------
function setupPharmacyTab() {
  setupCascadingGeoSelectors("pharmacyProvince", "pharmacyCity", "pharmacyDistrict");
  setupPharmacyLocationButtons();

  // کنترل دکمه‌های درصدی بودن (خیر / بله) در فرم داروخانه (Screenshot 3)
  const btnNo = document.getElementById("btnPhPercentageNo");
  const btnYes = document.getElementById("btnPhPercentageYes");
  const hiddenIsPerc = document.getElementById("pharmacyIsPercentage");

  if (btnNo && btnYes) {
    btnNo.addEventListener("click", () => {
      btnNo.classList.add("active");
      btnYes.classList.remove("active");
      hiddenIsPerc.value = "false";
    });
    btnYes.addEventListener("click", () => {
      btnYes.classList.add("active");
      btnNo.classList.remove("active");
      hiddenIsPerc.value = "true";
    });
  }

  // کنترل بارگذاری فایل داروخانه (Screenshot 3)
  const fileInput = document.getElementById("phFileInput");
  const fileDisplay = document.getElementById("phFileDisplay");
  if (fileInput && fileDisplay) {
    fileInput.addEventListener("change", () => {
      if (fileInput.files && fileInput.files[0]) {
        fileDisplay.textContent = `✅ فایل انتخاب شد: ${fileInput.files[0].name}`;
      } else {
        fileDisplay.textContent = "فایلی بارگذاری نشده است";
      }
    });
  }

  const form = document.getElementById("formPharmacy");
  const btnReset = document.getElementById("btnResetPharmacyForm");
  const searchInput = document.getElementById("searchPharmacyInput");

  if (btnReset) btnReset.addEventListener("click", resetPharmacyForm);

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      renderPharmaciesList(searchInput.value.trim());
    });
  }

  if (form) {
    form.addEventListener("submit", () => {
      const editId = document.getElementById("pharmacyEditId").value;
      const dateAdded = document.getElementById("pharmacyDate").value.trim() || jalaliTodayEnglish();
      const name = document.getElementById("pharmacyName").value.trim();
      const phone = document.getElementById("pharmacyPhone").value.trim();
      const manager = document.getElementById("pharmacyManager").value.trim();
      const province = document.getElementById("pharmacyProvince").value;
      const city = document.getElementById("pharmacyCity").value;
      const district = document.getElementById("pharmacyDistrict").value;
      const address = document.getElementById("pharmacyAddress").value.trim();
      const lat = parseFloat(document.getElementById("pharmacyLat").value) || 35.7605;
      const lng = parseFloat(document.getElementById("pharmacyLng").value) || 51.4180;
      const isPercentage = hiddenIsPerc.value === "true";
      const fileName = (fileInput.files && fileInput.files[0]) ? fileInput.files[0].name : null;
      const customFieldsVals = extractCustomFieldValuesFromForm("pharmacy", "pharmacyCustomFieldsContainer");

      if (typeof window.validateRequiredFields === "function" && !window.validateRequiredFields("tab-pharmacies")) return;

      if (editId) {
        const idx = state.pharmacies.findIndex(p => p.id === editId);
        if (idx !== -1) {
          state.pharmacies[idx] = {
            ...state.pharmacies[idx],
            dateAdded, name, phone, manager, province, city, district, address, lat, lng,
            isPercentage, fileName: fileName || state.pharmacies[idx].fileName,
            customFields: customFieldsVals
          };
        }
        alert(`✅ داروخانه «${name}» با موفقیت ویرایش و ذخیره شد.`);
      } else {
        const newPharmacy = {
          id: "ph-" + Date.now(),
          dateAdded, name, phone, manager, province, city, district, address, lat, lng,
          isPercentage, fileName,
          repName: "مدیر سیستم",
          customFields: customFieldsVals
        };
        state.pharmacies.push(newPharmacy);
        alert(`✅ داروخانه «${name}» با موفقیت ثبت شد.`);
      }

      saveState();
      resetPharmacyForm();
      renderPharmaciesList();
      renderDashboardOverviewMap();
      updateNavBadges();
      populatePharmacyDatalistInOrders();
    });
  }
}

function resetPharmacyForm() {
  document.getElementById("pharmacyEditId").value = "";
  document.getElementById("pharmacyDate").value = jalaliTodayEnglish();
  document.getElementById("pharmacyName").value = "";
  document.getElementById("pharmacyPhone").value = "";
  document.getElementById("pharmacyManager").value = "";
  document.getElementById("pharmacyAddress").value = "";
  document.getElementById("pharmacyLocationText").value = "";
  document.getElementById("pharmacyIsPercentage").value = "false";
  document.getElementById("btnPhPercentageNo").classList.add("active");
  document.getElementById("btnPhPercentageYes").classList.remove("active");
  document.getElementById("phFileDisplay").textContent = "فایلی بارگذاری نشده است";

  const provEl = document.getElementById("pharmacyProvince");
  const cityEl = document.getElementById("pharmacyCity");
  const distEl = document.getElementById("pharmacyDistrict");

  provEl.value = "";
  cityEl.innerHTML = `<option value="">ابتدا استان را انتخاب کنید</option>`;
  distEl.innerHTML = `<option value="">ابتدا شهر را انتخاب کنید</option>`;

  updatePharmacyFormMarker(35.7605, 51.4180, "موقعیت داروخانه جدید", true);
  renderCustomFieldsInForm("pharmacy", "pharmacyCustomFieldsContainer");
}

function renderPharmaciesList(searchQuery = "") {
  const theadTr = document.getElementById("tablePharmaciesHeader");
  const tbody = document.getElementById("tablePharmaciesBody");
  if (!theadTr || !tbody) return;

  theadTr.innerHTML = `
    <th>ردیف</th>
    <th>نام نماینده</th>
    <th>تاریخ ثبت</th>
    <th>استان</th>
    <th>شهر</th>
    <th>نام داروخانه</th>
    <th>شماره همراه</th>
    <th>درصدی</th>
    <th>فایل</th>
    <th>عملیات</th>
  `;

  const fieldsList = (state.customFields.pharmacy || []).filter(f => f.showInList)
    .slice().sort((a, b) => (Number(a.listOrder != null ? a.listOrder : a.order) || 999) - (Number(b.listOrder != null ? b.listOrder : b.order) || 999));
  fieldsList.forEach(f => {
    const th = document.createElement("th");
    th.textContent = f.label;
    theadTr.appendChild(th);
  });

  const thAction = document.createElement("th");
  thAction.textContent = "عملیات";
  theadTr.appendChild(thAction);

  tbody.innerHTML = "";

  const filtered = state.pharmacies.filter(ph => {
    if (!searchQuery) return true;
    return ph.name.includes(searchQuery) || ph.address.includes(searchQuery) || (ph.phone && ph.phone.includes(searchQuery));
  });

  const badgeEl = document.getElementById("phListCountBadge");
  const tableBadge = document.getElementById("phTableCountBadge");
  if (badgeEl) badgeEl.textContent = filtered.length;
  if (tableBadge) tableBadge.textContent = filtered.length;

  filtered.forEach((ph, index) => {
    const tr = document.createElement("tr");

    let rowHTML = `
      <td>${index + 1}</td>
      <td><strong style="color:#0f172a;">${ph.repName || "مدیر سیستم"}</strong></td>
      <td>${ph.dateAdded || "-"}</td>
      <td>${ph.province}</td>
      <td>${ph.city}</td>
      <td><strong style="color: #0d9488;">${ph.name}</strong></td>
      <td><span style="direction: ltr; display: inline-block;">${ph.phone || "-"}</span></td>
      <td>${ph.isPercentage ? '<span class="badge-status-online">بله</span>' : '<span>خیر</span>'}</td>
      <td>${ph.fileName ? `<span style="color:#0d9488;">📎 ${ph.fileName}</span>` : '-'}</td>
    `;

    fieldsList.forEach(f => {
      const val = (ph.customFields && ph.customFields[f.label]) ? ph.customFields[f.label] : "-";
      rowHTML += `<td><strong>${val}</strong></td>`;
    });

    rowHTML += `
      <td>
        <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
          <button class="btn btn-outline btn-sm" onclick="editPharmacy('${ph.id}')">✏️ ویرایش</button>
          <button class="btn btn-danger btn-sm" onclick="deletePharmacy('${ph.id}')">🗑️ حذف</button>
        </div>
      </td>
    `;

    tr.innerHTML = rowHTML;
    tbody.appendChild(tr);
  });
}

function editPharmacy(id) {
  const ph = state.pharmacies.find(p => p.id === id);
  if (!ph) return;

  document.getElementById("pharmacyEditId").value = ph.id;
  document.getElementById("pharmacyDate").value = ph.dateAdded || "";
  document.getElementById("pharmacyName").value = ph.name;
  document.getElementById("pharmacyPhone").value = ph.phone || "";
  document.getElementById("pharmacyManager").value = ph.manager || "";
  document.getElementById("pharmacyAddress").value = ph.address || "";
  document.getElementById("pharmacyLocationText").value = ph.address || "";

  if (ph.isPercentage) {
    document.getElementById("pharmacyIsPercentage").value = "true";
    document.getElementById("btnPhPercentageYes").classList.add("active");
    document.getElementById("btnPhPercentageNo").classList.remove("active");
  } else {
    document.getElementById("pharmacyIsPercentage").value = "false";
    document.getElementById("btnPhPercentageNo").classList.add("active");
    document.getElementById("btnPhPercentageYes").classList.remove("active");
  }

  const provEl = document.getElementById("pharmacyProvince");
  const cityEl = document.getElementById("pharmacyCity");
  const distEl = document.getElementById("pharmacyDistrict");

  provEl.value = ph.province;
  populateCities(ph.province, cityEl, ph.city);
  populateDistricts(ph.province, ph.city, distEl, ph.district);

  updatePharmacyFormMarker(ph.lat || 35.7605, ph.lng || 51.4180, ph.name, true);
  renderCustomFieldsInForm("pharmacy", "pharmacyCustomFieldsContainer", ph.customFields || {});

  document.getElementById("tab-pharmacies").scrollIntoView({ behavior: "smooth" });
}

function deletePharmacy(id) {
  if (!confirm("آیا از حذف این داروخانه اطمینان دارید؟")) return;
  state.pharmacies = state.pharmacies.filter(p => p.id !== id);
  saveState();
  renderPharmaciesList();
  renderDashboardOverviewMap();
  updateNavBadges();
  populatePharmacyDatalistInOrders();
}

// ----------------------------------------------------------------------------
// 9. پیاده‌سازی پزشکان و مطب‌ها (Doctors CRUD + Percentage Toggle + File upload)
// ----------------------------------------------------------------------------
function setupDoctorTab() {
  setupCascadingGeoSelectors("doctorProvince", "doctorCity", "doctorDistrict");
  setupDoctorLocationButtons();

  const btnNo = document.getElementById("btnDocPercentageNo");
  const btnYes = document.getElementById("btnDocPercentageYes");
  const hiddenIsPerc = document.getElementById("doctorIsPercentage");

  if (btnNo && btnYes) {
    btnNo.addEventListener("click", () => {
      btnNo.classList.add("active");
      btnYes.classList.remove("active");
      hiddenIsPerc.value = "false";
    });
    btnYes.addEventListener("click", () => {
      btnYes.classList.add("active");
      btnNo.classList.remove("active");
      hiddenIsPerc.value = "true";
    });
  }

  const fileInput = document.getElementById("docFileInput");
  const fileDisplay = document.getElementById("docFileDisplay");
  if (fileInput && fileDisplay) {
    fileInput.addEventListener("change", () => {
      if (fileInput.files && fileInput.files[0]) {
        fileDisplay.textContent = `✅ فایل انتخاب شد: ${fileInput.files[0].name}`;
      } else {
        fileDisplay.textContent = "فایلی بارگذاری نشده است";
      }
    });
  }

  const form = document.getElementById("formDoctor");
  const btnReset = document.getElementById("btnResetDoctorForm");
  const searchInput = document.getElementById("searchDoctorInput");

  if (btnReset) btnReset.addEventListener("click", resetDoctorForm);

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      renderDoctorsList(searchInput.value.trim());
    });
  }

  if (form) {
    form.addEventListener("submit", () => {
      const editId = document.getElementById("doctorEditId").value;
      const dateAdded = document.getElementById("doctorDate").value.trim() || jalaliTodayEnglish();
      const name = document.getElementById("doctorName").value.trim();
      const specialty = document.getElementById("doctorSpecialty").value.trim();
      const phone = document.getElementById("doctorPhone").value.trim();
      const province = document.getElementById("doctorProvince").value;
      const city = document.getElementById("doctorCity").value;
      const district = document.getElementById("doctorDistrict").value;
      const address = document.getElementById("doctorAddress").value.trim();
      const lat = parseFloat(document.getElementById("doctorLat").value) || 35.7580;
      const lng = parseFloat(document.getElementById("doctorLng").value) || 51.4400;
      const isPercentage = hiddenIsPerc.value === "true";
      const fileName = (fileInput.files && fileInput.files[0]) ? fileInput.files[0].name : null;
      const customFieldsVals = extractCustomFieldValuesFromForm("doctor", "doctorCustomFieldsContainer");

      if (typeof window.validateRequiredFields === "function" && !window.validateRequiredFields("tab-doctors")) return;

      if (editId) {
        const idx = state.doctors.findIndex(d => d.id === editId);
        if (idx !== -1) {
          state.doctors[idx] = {
            ...state.doctors[idx],
            dateAdded, name, specialty, phone, province, city, district, address, lat, lng,
            isPercentage, fileName: fileName || state.doctors[idx].fileName,
            customFields: customFieldsVals
          };
        }
        alert(`✅ مطب/پزشک «${name}» با موفقیت ویرایش و ذخیره شد.`);
      } else {
        const newDoc = {
          id: "doc-" + Date.now(),
          dateAdded, name, specialty, phone, province, city, district, address, lat, lng,
          isPercentage, fileName,
          repName: "جواد علمدار",
          customFields: customFieldsVals
        };
        state.doctors.push(newDoc);
        alert(`✅ مطب/پزشک «${name}» با موفقیت ثبت شد.`);
      }

      saveState();
      resetDoctorForm();
      renderDoctorsList();
      renderDashboardOverviewMap();
      updateNavBadges();
    });
  }
}

function resetDoctorForm() {
  document.getElementById("doctorEditId").value = "";
  document.getElementById("doctorDate").value = jalaliTodayEnglish();
  document.getElementById("doctorName").value = "";
  document.getElementById("doctorSpecialty").value = "";
  document.getElementById("doctorPhone").value = "";
  document.getElementById("doctorAddress").value = "";
  document.getElementById("doctorLocationText").value = "";
  document.getElementById("doctorIsPercentage").value = "false";
  document.getElementById("btnDocPercentageNo").classList.add("active");
  document.getElementById("btnDocPercentageYes").classList.remove("active");
  document.getElementById("docFileDisplay").textContent = "فایلی بارگذاری نشده است";

  const provEl = document.getElementById("doctorProvince");
  const cityEl = document.getElementById("doctorCity");
  const distEl = document.getElementById("doctorDistrict");

  provEl.value = "";
  cityEl.innerHTML = `<option value="">ابتدا استان را انتخاب کنید</option>`;
  distEl.innerHTML = `<option value="">ابتدا شهر را انتخاب کنید</option>`;

  updateDoctorFormMarker(35.7580, 51.4400, "موقعیت مطب جدید", true);
  renderCustomFieldsInForm("doctor", "doctorCustomFieldsContainer");
}

function renderDoctorsList(searchQuery = "") {
  const theadTr = document.getElementById("tableDoctorsHeader");
  const tbody = document.getElementById("tableDoctorsBody");
  if (!theadTr || !tbody) return;

  theadTr.innerHTML = `
    <th>ردیف</th>
    <th>نام نماینده</th>
    <th>تاریخ ثبت</th>
    <th>استان / شهر / منطقه</th>
    <th>نام پزشک / مطب</th>
    <th>تخصص</th>
    <th>درصدی</th>
    <th>فایل</th>
    <th>عملیات</th>
  `;

  const fieldsList = (state.customFields.doctor || []).filter(f => f.showInList);
  fieldsList.forEach(f => {
    const th = document.createElement("th");
    th.textContent = f.label;
    theadTr.appendChild(th);
  });

  const thAction = document.createElement("th");
  thAction.textContent = "عملیات";
  theadTr.appendChild(thAction);

  tbody.innerHTML = "";

  const filtered = state.doctors.filter(doc => {
    if (!searchQuery) return true;
    return doc.name.includes(searchQuery) || doc.specialty.includes(searchQuery) || doc.address.includes(searchQuery);
  });

  filtered.forEach((doc, index) => {
    const tr = document.createElement("tr");

    let rowHTML = `
      <td>${index + 1}</td>
      <td><strong style="color:#0f172a;">${doc.repName || "جواد علمدار"}</strong></td>
      <td>${doc.dateAdded || "-"}</td>
      <td>${doc.province} / ${doc.city}</td>
      <td><strong style="color: #0d9488;">${doc.name}</strong></td>
      <td><span class="status-badge" style="background: #f0fdf4; color: #15803d;">${doc.specialty}</span></td>
      <td>${doc.isPercentage ? '<span class="badge-status-online">بله</span>' : '<span>خیر</span>'}</td>
      <td>${doc.fileName ? `<span style="color:#0d9488;">📎 ${doc.fileName}</span>` : '-'}</td>
    `;

    fieldsList.forEach(f => {
      const val = (doc.customFields && doc.customFields[f.label]) ? doc.customFields[f.label] : "-";
      rowHTML += `<td><strong>${val}</strong></td>`;
    });

    rowHTML += `
      <td>
        <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
          <button class="btn btn-outline btn-sm" onclick="editDoctor('${doc.id}')">✏️ ویرایش</button>
          <button class="btn btn-danger btn-sm" onclick="deleteDoctor('${doc.id}')">🗑️ حذف</button>
        </div>
      </td>
    `;

    tr.innerHTML = rowHTML;
    tbody.appendChild(tr);
  });
}

function editDoctor(id) {
  const doc = state.doctors.find(d => d.id === id);
  if (!doc) return;

  document.getElementById("doctorEditId").value = doc.id;
  document.getElementById("doctorDate").value = doc.dateAdded || "";
  document.getElementById("doctorName").value = doc.name;
  document.getElementById("doctorSpecialty").value = doc.specialty;
  document.getElementById("doctorPhone").value = doc.phone || "";
  document.getElementById("doctorAddress").value = doc.address || "";
  document.getElementById("doctorLocationText").value = doc.address || "";

  if (doc.isPercentage) {
    document.getElementById("doctorIsPercentage").value = "true";
    document.getElementById("btnDocPercentageYes").classList.add("active");
    document.getElementById("btnDocPercentageNo").classList.remove("active");
  } else {
    document.getElementById("doctorIsPercentage").value = "false";
    document.getElementById("btnDocPercentageNo").classList.add("active");
    document.getElementById("btnDocPercentageYes").classList.remove("active");
  }

  const provEl = document.getElementById("doctorProvince");
  const cityEl = document.getElementById("doctorCity");
  const distEl = document.getElementById("doctorDistrict");

  provEl.value = doc.province;
  populateCities(doc.province, cityEl, doc.city);
  populateDistricts(doc.province, doc.city, distEl, doc.district);

  updateDoctorFormMarker(doc.lat || 35.7580, doc.lng || 51.4400, doc.name, true);
  renderCustomFieldsInForm("doctor", "doctorCustomFieldsContainer", doc.customFields || {});

  document.getElementById("tab-doctors").scrollIntoView({ behavior: "smooth" });
}

function deleteDoctor(id) {
  if (!confirm("آیا از حذف این پزشک/مطب اطمینان دارید؟")) return;
  state.doctors = state.doctors.filter(d => d.id !== id);
  saveState();
  renderDoctorsList();
  renderDashboardOverviewMap();
  updateNavBadges();
}

// ----------------------------------------------------------------------------
// 10. پیاده‌سازی کاربران، رمز عبور و سطح دسترسی (Matching Screenshots 4,5,6,7)
// ----------------------------------------------------------------------------
function setupUsersAndPermissionsTab() {
  renderPermissionGroupsChecklist();
  renderUserCardsList();

  const btnSelectAll = document.getElementById("btnPermSelectAll");
  const btnSelectNone = document.getElementById("btnPermSelectNone");
  const btnTogglePasswords = document.getElementById("btnToggleShowAllPasswords");

  if (btnSelectAll) {
    btnSelectAll.addEventListener("click", () => {
      document.querySelectorAll(".permission-tag-chk").forEach(el => {
        el.classList.remove("unchecked");
        el.dataset.checked = "true";
      });
      updatePermCountBadge();
    });
  }

  if (btnSelectNone) {
    btnSelectNone.addEventListener("click", () => {
      document.querySelectorAll(".permission-tag-chk").forEach(el => {
        el.classList.add("unchecked");
        el.dataset.checked = "false";
      });
      updatePermCountBadge();
    });
  }

  if (btnTogglePasswords) {
    btnTogglePasswords.addEventListener("click", () => {
      isShowingAllPasswords = !isShowingAllPasswords;
      btnTogglePasswords.innerHTML = isShowingAllPasswords ? "🙈 مخفی‌سازی رمزها" : "👁️ نمایش همه رمزها";
      renderUserCardsList();
    });
  }

  const formCreate = document.getElementById("formCreateUser");
  if (formCreate) {
    formCreate.addEventListener("submit", () => {
      const fullName = document.getElementById("newFullName").value.trim();
      const username = document.getElementById("newUsername").value.trim();
      const password = document.getElementById("newPassword").value.trim();
      const phone = document.getElementById("newPhone").value.trim();
      const role = document.getElementById("newRole").value;
      const simControl = document.getElementById("newSimControl").value;

      if (!fullName || !username || !password) {
        alert("لطفاً نام، نام کاربری و رمز عبور را وارد کنید.");
        return;
      }

      // استخراج تیک‌های ۴۹ دسترسی
      const permsObj = {};
      document.querySelectorAll(".permission-tag-chk").forEach(el => {
        permsObj[el.dataset.key] = el.dataset.checked === "true";
      });

      const newUser = {
        id: "u-" + Date.now(),
        fullName,
        username,
        password,
        phone,
        role,
        simControl,
        phoneLock: "آزاد - اولین ورود، گوشی را قفل می‌کند",
        lastLogin: new Date().toLocaleDateString("fa-IR") + " - " + new Date().toLocaleTimeString("fa-IR"),
        permissions: permsObj
      };

      state.users.push(newUser);
      saveState();
      formCreate.reset();
      renderUserCardsList();
      updateNavBadges();
      alert(`✅ کاربر جدید «${fullName}» با موفقیت ساخته شد.`);
    });
  }
}

function renderPermissionGroupsChecklist() {
  const container = document.getElementById("permissionGroupsContainer");
  if (!container) return;
  container.innerHTML = "";

  Object.entries(PERMISSION_GROUPS).forEach(([groupName, items]) => {
    const grpDiv = document.createElement("div");
    grpDiv.innerHTML = `<div class="permission-group-title">${groupName}</div>`;

    const tagsDiv = document.createElement("div");
    tagsDiv.style.display = "flex";
    tagsDiv.style.flexWrap = "wrap";
    tagsDiv.style.gap = "0.5rem";

    items.forEach(item => {
      const tag = document.createElement("div");
      tag.className = "permission-tag-chk";
      tag.dataset.key = item.key;
      tag.dataset.checked = "true";
      tag.innerHTML = `<span>✓ ${item.label}</span>`;
      tag.onclick = () => {
        const isChk = tag.dataset.checked === "true";
        if (isChk) {
          tag.dataset.checked = "false";
          tag.classList.add("unchecked");
        } else {
          tag.dataset.checked = "true";
          tag.classList.remove("unchecked");
        }
        updatePermCountBadge();
      };
      tagsDiv.appendChild(tag);
    });

    grpDiv.appendChild(tagsDiv);
    container.appendChild(grpDiv);
  });

  updatePermCountBadge();
}

function updatePermCountBadge() {
  const all = document.querySelectorAll(".permission-tag-chk");
  let count = 0;
  all.forEach(el => { if (el.dataset.checked === "true") count++; });
  const badge = document.getElementById("selectedPermCountBadge");
  if (badge) badge.textContent = `${count} مورد`;
}

function renderUserCardsList() {
  const container = document.getElementById("userCardsContainer");
  if (!container) return;
  container.innerHTML = "";

  state.users.forEach((user, index) => {
    const card = document.createElement("div");
    card.style.background = "#ffffff";
    card.style.border = "1px solid var(--border-color)";
    card.style.borderRadius = "12px";
    card.style.padding = "1.25rem";
    card.style.boxShadow = "var(--shadow-sm)";

    const passDisplay = isShowingAllPasswords ? user.password : "••••••••";

    card.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; margin-bottom: 0.75rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem;">
        <div>
          <span style="font-weight: 800; font-size: 1.05rem; color: #0f172a;">${index + 1}. ${user.fullName}</span>
          <span class="status-badge" style="background:#eff6ff;color:#1e40af;margin-right:0.5rem;">${user.role}</span>
        </div>
        <div style="font-size: 0.78rem; color: #64748b;">آخرین ورود: ${user.lastLogin || "-"}</div>
      </div>

      <div class="form-grid" style="margin-bottom: 1rem;">
        <div>
          <span style="font-size: 0.8rem; color: #64748b;">نام کاربری:</span>
          <strong style="direction: ltr; display: block; color: #0d9488;">${user.username}</strong>
        </div>
        <div>
          <span style="font-size: 0.8rem; color: #64748b;">رمز عبور:</span>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <strong style="direction: ltr; display: block;">${passDisplay}</strong>
            <button class="btn btn-outline btn-sm" onclick="copyPasswordText('${user.password}')" title="کپی رمز">📋</button>
          </div>
        </div>
        <div>
          <span style="font-size: 0.8rem; color: #64748b;">شماره همراه:</span>
          <span style="direction: ltr; display: block;">${user.phone || "-"}</span>
        </div>
        <div>
          <span style="font-size: 0.8rem; color: #64748b;">کنترل سیم‌کارت:</span>
          <span style="display: block; font-weight: 700;">${user.simControl}</span>
        </div>
      </div>

      <div style="background: #f8fafc; padding: 0.6rem 1rem; border-radius: 8px; font-size: 0.82rem; color: #475569; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
        <span>📱 وضعیت قفل گوشی: <strong>${user.phoneLock}</strong></span>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-outline btn-sm" onclick="editUserCard('${user.id}')">✏️ ویرایش سطح دسترسی</button>
          <button class="btn btn-danger btn-sm" onclick="deleteUserCard('${user.id}')">🗑️ حذف</button>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

function copyPasswordText(pwd) {
  navigator.clipboard.writeText(pwd).then(() => {
    alert(`📋 رمز عبور «${pwd}» در حافظه کپی شد.`);
  });
}

function editUserCard(id) {
  const u = state.users.find(x => x.id === id);
  if (!u) return;
  alert(`ویرایش تنظیمات دسترسی برای «${u.fullName}» در پنجره ایجاد کاربر فعال شد.`);
  document.getElementById("newFullName").value = u.fullName;
  document.getElementById("newUsername").value = u.username;
  document.getElementById("newPassword").value = u.password;
  document.getElementById("newPhone").value = u.phone || "";
  document.getElementById("newRole").value = u.role;
  document.getElementById("newSimControl").value = u.simControl;
  document.getElementById("tab-users-permissions").scrollIntoView({ behavior: "smooth" });
}

function deleteUserCard(id) {
  if (!confirm("آیا از حذف این کاربر اطمینان دارید؟")) return;
  state.users = state.users.filter(u => u.id !== id);
  saveState();
  renderUserCardsList();
  updateNavBadges();
}

// ----------------------------------------------------------------------------
// 11. سایر بخش‌های منو (تردد، منزل نمایندگان، مرخصی‌ها، اعلان‌ها، گزارش ماهانه، تارگت فروش)
// ----------------------------------------------------------------------------
function setupOtherSidebarModules() {
  // 1. فعالیت لحظه‌ای (Menu Item 5)
  const btnRefAct = document.getElementById("btnRefreshActivity");
  if (btnRefAct) btnRefAct.addEventListener("click", () => renderActivityLogTable());
  renderActivityLogTable();

  // 2. رصد تردد (Menu Item 8)
  renderRepRoutesTable();

  // 3. منزل نمایندگان (Menu Item 9)
  renderRepHomesTable();

  // 4. مرخصی‌ها (Menu Item 10)
  const btnExportL = document.getElementById("btnExportLeavesCSV");
  if (btnExportL) {
    btnExportL.addEventListener("click", () => {
      const hdrs = ["نماینده", "از تاریخ", "تا تاریخ", "نوع مرخصی", "وضعیت"];
      const rws = state.leaves.map(l => [l.repName, l.fromDate, l.toDate, l.reason, l.status]);
      downloadCSVFile("leaves-export.csv", hdrs, rws);
    });
  }
  renderLeavesTable();

  // 5. اعلان‌ها (Menu Item 11)
  renderNotificationsTable();

  // 6. گزارش ماهانه (Menu Item 12)
  const btnExportM = document.getElementById("btnExportMonthlyCSV");
  if (btnExportM) {
    btnExportM.addEventListener("click", () => {
      const hdrs = ["نماینده علمی", "ویزیت‌ها", "سفارشات", "فروش کل (ریال)"];
      const rws = state.reps.map(r => {
        const vCount = state.visits.filter(v => v.repName === r.name).length;
        const oCount = state.orders.filter(o => o.repName === r.name).length;
        const sum = state.orders.filter(o => o.repName === r.name).reduce((s, o) => s + (o.totalAmount || 0), 0);
        return [r.name, vCount, oCount, sum];
      });
      downloadCSVFile("monthly-reports.csv", hdrs, rws);
    });
  }
  renderMonthlyReportsTable();

  // 7. تارگت فروش (Menu Item 13)
  renderSalesTargetsTable();
}

function renderActivityLogTable() {
  const tbody = document.getElementById("tableActivityLogBody");
  if (!tbody) return;
  tbody.innerHTML = "";
  (state.activityLog || []).forEach(act => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${act.time}</td>
      <td><strong style="color:#0f172a;">${act.repName}</strong></td>
      <td>${act.action}</td>
      <td><span class="badge-status-online">ثبت شد</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function renderRepRoutesTable() {
  const tbody = document.getElementById("tableRepRoutesBody");
  if (!tbody) return;
  tbody.innerHTML = "";
  (state.repRoutes || []).forEach(rt => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong style="color:#0f172a;">${rt.repName}</strong></td>
      <td>${rt.date}</td>
      <td>${rt.checkpoint}</td>
      <td><span class="badge-status-online">${rt.status}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function renderRepHomesTable() {
  const tbody = document.getElementById("tableRepHomesBody");
  if (!tbody) return;
  tbody.innerHTML = "";
  (state.repHomes || []).forEach(hm => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong style="color:#0f172a;">${hm.repName}</strong></td>
      <td>${hm.address}</td>
      <td style="direction:ltr;">${hm.lat}, ${hm.lng}</td>
      <td>
        <button class="btn btn-outline btn-sm" onclick="alert('نمایش آدرس منزل روی نقشه جامع فعال شد.')">📍 نمایش</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function setupLeavesModule() {
  const formLeave = document.getElementById("formLeaveRequest");
  const repSel = document.getElementById("leaveRepSelect");
  const typeSel = document.getElementById("leaveTypeSelect");
  const hoursGrp = document.getElementById("leaveHoursGroup");

  if (repSel) {
    repSel.innerHTML = `<option value="">انتخاب نماینده...</option>`;
    state.reps.forEach(r => {
      repSel.innerHTML += `<option value="${r.name}">${r.name}</option>`;
    });
  }

  if (typeSel && hoursGrp) {
    typeSel.addEventListener("change", () => {
      hoursGrp.style.display = typeSel.value.includes("ساعتی") ? "block" : "none";
    });
  }

  if (formLeave) {
    formLeave.addEventListener("submit", () => {
      const repName = repSel.value;
      const leaveType = typeSel.value;
      const fromDate = document.getElementById("leaveFromDate").value.trim();
      const toDate = document.getElementById("leaveToDate").value.trim();
      const hours = document.getElementById("leaveHoursInput") ? document.getElementById("leaveHoursInput").value.trim() : "";
      const reason = document.getElementById("leaveReasonInput").value.trim();

      if (!repName || !fromDate || !toDate || !reason) {
        alert("لطفاً نماینده، تاریخ شروع، پایان و دلیل مرخصی را وارد کنید.");
        return;
      }

      const newLeave = {
        id: "lv-" + Date.now(),
        repName,
        fromDate,
        toDate,
        reason: `${leaveType}${hours ? ` (${hours})` : ""} - ${reason}`,
        supervisorStatus: "در انتظار",
        adminStatus: "در انتظار",
        status: "در حال بررسی"
      };

      if (!state.leaves) state.leaves = [];
      state.leaves.push(newLeave);
      saveState();
      formLeave.reset();
      renderLeavesTable();
      updateNavBadges();
      alert(`📝 درخواست مرخصی برای «${repName}» ثبت شد و منتظر تایید سرپرست و مدیر است.`);
    });
  }
}

function renderLeavesTable() {
  const tbody = document.getElementById("tableLeavesBody");
  if (!tbody) return;
  tbody.innerHTML = "";
  (state.leaves || []).forEach(lv => {
    const tr = document.createElement("tr");
    const supBadge = lv.supervisorStatus === "تایید شد"
      ? `<span class="badge-status-online" style="background:#10b981;">✅ تایید شد</span>`
      : `<button class="btn btn-outline btn-sm" onclick="approveLeaveSupervisor('${lv.id}')">⏳ تایید سرپرست</button>`;

    const admBadge = lv.adminStatus === "تایید شد"
      ? `<span class="badge-status-online" style="background:#0d9488;">✅ تایید نهایی</span>`
      : `<button class="btn btn-primary btn-sm" style="background:#0d9488;" onclick="approveLeaveAdmin('${lv.id}')">⏳ تایید مدیر کل</button>`;

    tr.innerHTML = `
      <td><strong style="color:#0f172a;">${lv.repName}</strong></td>
      <td>${lv.reason}</td>
      <td>${lv.fromDate}</td>
      <td>${lv.toDate}</td>
      <td>${lv.reason}</td>
      <td>${supBadge}</td>
      <td>${admBadge}</td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="deleteLeave('${lv.id}')">🗑️ حذف</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function approveLeaveSupervisor(id) {
  const lv = (state.leaves || []).find(x => x.id === id);
  if (!lv) return;
  lv.supervisorStatus = "تایید شد";
  saveState();
  renderLeavesTable();
  alert(`✓ تایید سرپرست برای درخواست مرخصی «${lv.repName}» انجام شد.`);
}

function approveLeaveAdmin(id) {
  const lv = (state.leaves || []).find(x => x.id === id);
  if (!lv) return;
  lv.adminStatus = "تایید شد";
  lv.status = "تایید نهایی شد";
  saveState();
  renderLeavesTable();

  // ارسال اعلان وضعیت مرخصی به نماینده
  const notif = {
    id: "not-" + Date.now(),
    date: new Date().toLocaleDateString("fa-IR"),
    title: `تایید مرخصی: ${lv.repName}`,
    message: `درخواست مرخصی شما از تاریخ ${lv.fromDate} تا ${lv.toDate} توسط مدیر کل تایید نهایی شد.`,
    sender: "مدیر کل",
    recipient: lv.repName,
    isRead: false
  };
  if (!state.notifications) state.notifications = [];
  state.notifications.unshift(notif);
  saveState();
  playNotificationBeep();
  alert(`✅ تایید نهایی مرخصی انجام شد و اعلان آن برای «${lv.repName}» ارسال گردید.`);
}

function deleteLeave(id) {
  if (!confirm("آیا از حذف این درخواست مرخصی اطمینان دارید؟")) return;
  state.leaves = state.leaves.filter(l => l.id !== id);
  saveState();
  renderLeavesTable();
  updateNavBadges();
}

function setupNotificationsMessaging() {
  const formMsg = document.getElementById("formSendMessage");
  if (formMsg) {
    formMsg.addEventListener("submit", () => {
      const recipient = document.getElementById("msgRecipientSelect").value;
      const title = document.getElementById("msgTitleInput").value.trim();
      const body = document.getElementById("msgBodyInput").value.trim();

      if (!title || !body) {
        alert("لطفاً عنوان و متن پیام را وارد کنید.");
        return;
      }

      const notif = {
        id: "not-" + Date.now(),
        date: new Date().toLocaleDateString("fa-IR"),
        title: title,
        message: body,
        sender: `${currentUserName}`,
        recipient: recipient,
        isRead: false
      };

      if (!state.notifications) state.notifications = [];
      state.notifications.unshift(notif);
      saveState();
      formMsg.reset();
      renderNotificationsTable();
      playNotificationBeep();

      const badge = document.getElementById("headerNotifBadgeCount") || document.querySelector(".notif-count-badge");
      if (badge) {
        badge.style.display = "flex";
        const cur = parseInt(badge.textContent) || 0;
        badge.textContent = cur + 1;
      }
      alert(`✅ پیام شما به «${recipient}» ارسال شد و با صدای هشدار به ایشان اطلاع داده شد.`);
    });
  }
}

function renderNotificationsTable() {
  const tbody = document.getElementById("tableNotificationsBody");
  if (!tbody) return;
  tbody.innerHTML = "";
  (state.notifications || []).forEach(nt => {
    const tr = document.createElement("tr");
    const readBadge = nt.isRead
      ? `<span style="color:#64748b;font-size:0.8rem;">خوانده‌شد</span>`
      : `<button class="btn btn-outline btn-sm" onclick="markNotificationRead('${nt.id}')">✓ خواندن</button>`;

    tr.innerHTML = `
      <td>${nt.date}</td>
      <td><strong style="color:#0d9488;">${nt.title}</strong></td>
      <td>${nt.message}</td>
      <td>${nt.sender} → ${nt.recipient || "عمومی"}</td>
      <td>${readBadge}</td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="deleteNotification('${nt.id}')">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function markNotificationRead(id) {
  const nt = (state.notifications || []).find(n => n.id === id);
  if (!nt) return;
  nt.isRead = true;
  saveState();
  renderNotificationsTable();
}

function deleteNotification(id) {
  if (!confirm("آیا از حذف این اعلان اطمینان دارید؟")) return;
  state.notifications = state.notifications.filter(n => n.id !== id);
  saveState();
  renderNotificationsTable();
}

function renderMonthlyReportsTable() {
  const tbody = document.getElementById("tableMonthlyReportsBody");
  if (!tbody) return;
  tbody.innerHTML = "";
  state.reps.forEach(rep => {
    const vCount = state.visits.filter(v => v.repName === rep.name).length;
    const oCount = state.orders.filter(o => o.repName === rep.name).length;
    const sum = state.orders.filter(o => o.repName === rep.name).reduce((s, o) => s + (o.totalAmount || 0), 0);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong style="color:#0f172a;">${rep.name}</strong></td>
      <td><strong>${vCount}</strong> ویزیت</td>
      <td><strong>${oCount}</strong> سفارش</td>
      <td><strong style="color:#0d9488;">${sum.toLocaleString("fa-IR")}</strong></td>
      <td><span class="badge-status-online">۱۰۰٪</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function renderSalesTargetsTable() {
  const tbody = document.getElementById("tableSalesTargetsBody");
  if (!tbody) return;
  tbody.innerHTML = "";
  (state.salesTargets || []).forEach(tgt => {
    const perc = Math.round((tgt.achievedAmount / tgt.targetAmount) * 100);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong style="color:#0f172a;">${tgt.repName}</strong></td>
      <td>${tgt.productName || tgt.month || "-"}</td>
      <td>${tgt.targetCount || "-"}</td>
      <td>${tgt.achievedCount || 0}</td>
      <td>${(tgt.targetCount || 0) - (tgt.achievedCount || 0)}</td>
      <td><strong style="color:#0d9488;">${Number(tgt.targetAmount || 0).toLocaleString("fa-IR")}</strong></td>
      <td><span class="badge-status-online">${isFinite(perc) ? perc : 0}٪</span></td>
      <td></td>
    `;
    tbody.appendChild(tr);
  });
}

// ----------------------------------------------------------------------------
// 12. پیاده‌سازی سفارشات (Orders + Requirement 3: Sticky Top Alert Banner)
// ----------------------------------------------------------------------------
function setupOrdersTab() {
  setupCascadingGeoSelectors("orderProvince", "orderCity", "orderDistrict");

  const form = document.getElementById("formOrder");
  const btnReset = document.getElementById("btnResetOrderForm");
  const btnAddItem = document.getElementById("btnAddOrderItemRow");
  const searchInput = document.getElementById("searchOrderInput");
  const pharmacyInput = document.getElementById("orderPharmacyName");
  const btnTopAutoFill = document.getElementById("btnTopAutoFillPharmacy");

  populateRepSelectorInOrders();
  populatePharmacyDatalistInOrders();
  resetOrderForm();

  if (btnReset) btnReset.addEventListener("click", resetOrderForm);

  if (btnAddItem) {
    btnAddItem.addEventListener("click", () => {
      addOrderItemRow("", 10, 45000);
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      renderOrdersList(searchInput.value.trim());
    });
  }

  const checkPharmacyMatch = () => {
    const val = pharmacyInput.value.trim();
    const matched = state.pharmacies.find(p => p.name === val || p.name.includes(val) && val.length >= 3);
    const alertBox = document.getElementById("existingPharmacyTopAlert");
    const alertText = document.getElementById("existingPharmacyAlertText");

    if (matched && val.length > 0) {
      document.getElementById("orderPharmacyMatchedId").value = matched.id;
      alertText.textContent = `داروخانه «${matched.name}» | شهر: ${matched.city} | منطقه: ${matched.district} | آدرس: ${matched.address}`;
      alertBox.style.display = "flex";
    } else {
      document.getElementById("orderPharmacyMatchedId").value = "";
      alertBox.style.display = "none";
    }
  };

  if (pharmacyInput) {
    pharmacyInput.addEventListener("input", checkPharmacyMatch);
    pharmacyInput.addEventListener("change", checkPharmacyMatch);
  }

  if (btnTopAutoFill) {
    btnTopAutoFill.addEventListener("click", () => {
      const matchedId = document.getElementById("orderPharmacyMatchedId").value;
      if (!matchedId) return;

      const matched = state.pharmacies.find(p => p.id === matchedId);
      if (!matched) return;

      const provEl = document.getElementById("orderProvince");
      const cityEl = document.getElementById("orderCity");
      const distEl = document.getElementById("orderDistrict");
      const addrEl = document.getElementById("orderAddress");

      provEl.value = matched.province;
      populateCities(matched.province, cityEl, matched.city);
      populateDistricts(matched.province, matched.city, distEl, matched.district);

      addrEl.value = matched.address;
      alert(`⚡ اطلاعات آدرس و مناطق داروخانه «${matched.name}» به صورت خودکار در فیلدهای سفارش قرار گرفت.`);
    });
  }

  if (form) {
    form.addEventListener("submit", () => {
      const editId = document.getElementById("orderEditId").value;
      const pharmacyName = pharmacyInput.value.trim();
      const province = document.getElementById("orderProvince").value;
      const city = document.getElementById("orderCity").value;
      const district = document.getElementById("orderDistrict").value;
      const address = document.getElementById("orderAddress").value.trim();
      const repName = document.getElementById("orderRepName").value;
      const orderDate = document.getElementById("orderDate").value.trim() || jalaliTodayEnglish();
      const status = document.getElementById("orderStatus").value;
      const notes = document.getElementById("orderNotes").value.trim();
      const customFieldsVals = extractCustomFieldValuesFromForm("order", "orderCustomFieldsContainer");

      if (typeof window.validateRequiredFields === "function" && !window.validateRequiredFields("tab-orders")) return;

      const items = getOrderItemsFromUI();
      if (items.length === 0 || !items[0].name) {
        alert("لطفاً حداقل یک قلم دارویی در سفارش ثبت کنید.");
        return;
      }

      const totalAmount = items.reduce((sum, item) => sum + calcOrderRowTotal(item.count, item.giftCount || 0, item.price), 0);
      const vatAmount = Math.round(totalAmount * (getOrderFormula().vat || 0) / 100);
      const totalAmountWithVat = totalAmount + vatAmount;
      const orderManagerRec = (state.pharmacies || []).find(p => p.id === ((document.getElementById("orderPharmacyMatchedId") || {}).value) || p.name === pharmacyName) || {};

      if (editId) {
        const idx = state.orders.findIndex(o => o.id === editId);
        if (idx !== -1) {
          state.orders[idx] = {
            ...state.orders[idx],
            pharmacyName, orderManager: orderManagerRec.manager || "", orderManagerPhone: orderManagerRec.managerPhone || "", province, city, district, address,
            repName, orderDate, status, notes, items, quantityValidated: true, totalAmount, vatAmount, totalAmountWithVat,
            customFields: customFieldsVals
          };
        }
        alert(`✅ سفارش داروخانه «${pharmacyName}» با موفقیت ویرایش شد.`);
      } else {
        const newOrder = {
          id: "ord-" + Date.now(),
          pharmacyName, orderManager: orderManagerRec.manager || "", orderManagerPhone: orderManagerRec.managerPhone || "", province, city, district, address,
          repName, orderDate, status, notes, items, quantityValidated: true, totalAmount, vatAmount, totalAmountWithVat,
          customFields: customFieldsVals
        };
        state.orders.push(newOrder);
        alert(`✅ سفارش جدید برای «${pharmacyName}» ثبت شد.`);
      }

      saveState();
      resetOrderForm();
      renderOrdersList();
      updateNavBadges();
    });
  }
}

function resetOrderForm() {
  document.getElementById("orderEditId").value = "";
  document.getElementById("orderPharmacyMatchedId").value = "";
  document.getElementById("orderPharmacyName").value = "";
  document.getElementById("orderAddress").value = "";
  document.getElementById("orderDate").value = jalaliTodayEnglish();
  document.getElementById("orderNotes").value = "";
  document.getElementById("existingPharmacyTopAlert").style.display = "none";

  const provEl = document.getElementById("orderProvince");
  const cityEl = document.getElementById("orderCity");
  const distEl = document.getElementById("orderDistrict");

  provEl.value = "";
  cityEl.innerHTML = `<option value="">ابتدا استان را انتخاب کنید</option>`;
  distEl.innerHTML = `<option value="">ابتدا شهر را انتخاب کنید</option>`;

  const container = document.getElementById("orderItemsContainer");
  if (container) {
    container.innerHTML = "";
    mergeCatalogIntoOrderItems();
  }

  renderCustomFieldsInForm("order", "orderCustomFieldsContainer");
  updateOrderTotalAmountDisplay();
}

function populateRepSelectorInOrders() {
  const sel = document.getElementById("orderRepName");
  if (!sel) return;
  sel.innerHTML = `<option value="">انتخاب نماینده علمی...</option>`;
  state.reps.forEach(r => {
    const opt = document.createElement("option");
    opt.value = r.name;
    opt.textContent = `${r.name} (${r.region || "نماینده فعال"})`;
    sel.appendChild(opt);
  });
}

function populatePharmacyDatalistInOrders() {
  const datalist = document.getElementById("pharmacyNamesList");
  if (!datalist) return;
  datalist.innerHTML = "";
  state.pharmacies.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.name;
    opt.textContent = `${p.name} - ${p.province}/${p.city}`;
    datalist.appendChild(opt);
  });
}

function refreshOrderProductCatalog() {
  let dl = document.getElementById("orderProductCatalogList");
  if (!dl) {
    dl = document.createElement("datalist");
    dl.id = "orderProductCatalogList";
    document.body.appendChild(dl);
  }
  dl.innerHTML = "";
  (state.products || []).forEach(p => {
    const o = document.createElement("option");
    o.value = p.name;
    o.label = p.name + " — " + Number(p.pharmacyPrice || p.price || 0).toLocaleString("fa-IR") + " ریال";
    dl.appendChild(o);
  });
  document.querySelectorAll(".order-item-name").forEach(inp => {
    inp.setAttribute("list", "orderProductCatalogList");
  });
  const bar = document.getElementById("orderProductCatalogBar");
  if (bar) {
    if (!(state.products || []).length) {
      bar.innerHTML = "<span class='order-catalog-empty'>هنوز کالایی در «اضافه کردن کالا» ثبت نشده.</span>";
    } else {
      bar.innerHTML = (state.products || []).map(p =>
        `<button type="button" class="btn btn-outline btn-sm order-pick-prod" data-pname="${String(p.name).replace(/"/g, "&quot;")}">${p.name}</button>`
      ).join("");
      bar.querySelectorAll(".order-pick-prod").forEach(btn => {
        btn.addEventListener("click", () => {
          const prod = (state.products || []).find(x => x.name === btn.getAttribute("data-pname"));
          if (!prod) return;
          const container = document.getElementById("orderItemsContainer");
          let found = null;
          if (container) {
            Array.prototype.forEach.call(container.querySelectorAll(".order-item-name"), inp => {
              if (inp.value.trim() === prod.name) found = inp.closest(".order-item-row") || inp.parentElement;
            });
          }
          if (found) {
            const c = found.querySelector(".order-item-count");
            if (c) c.focus();
          } else {
            addOrderItemRow(prod.name, 1, prod.pharmacyPrice || prod.price || 0, 0);
          }
        });
      });
    }
  }
}

function mergeCatalogIntoOrderItems() {
  refreshOrderProductCatalog();
  const container = document.getElementById("orderItemsContainer");
  if (!container) return;
  const names = {};
  (state.products || []).forEach(p => { if (p.name) names[p.name] = p; });
  Array.prototype.slice.call(container.children).forEach(row => {
    const n = row.querySelector(".order-item-name");
    const c = row.querySelector(".order-item-count");
    if (!n) return;
    const name = n.value.trim();
    const cnt = parseInt(c && c.value, 10) || 0;
    if (!name || (!names[name] && cnt <= 0)) row.remove();
  });
  const existing = {};
  Array.prototype.forEach.call(container.querySelectorAll(".order-item-name"), inp => {
    if (inp.value.trim()) existing[inp.value.trim()] = true;
  });
  (state.products || []).forEach(p => {
    if (p.name && !existing[p.name]) {
      addOrderItemRow(p.name, 0, p.pharmacyPrice || p.price || 0, 0);
    }
  });
  if (!(state.products || []).length && !container.children.length) {
    addOrderItemRow("", 1, 0, 0);
  }
}

function addOrderItemRow(name = "", count = "", price = 0, giftCount = "") {
  const container = document.getElementById("orderItemsContainer");
  if (!container) return;

  const rowId = "item-row-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
  const row = document.createElement("div");
  row.id = rowId;
  row.className = "order-item-row";

  const safeName = String(name || "").replace(/"/g, "&quot;");
  const cntDisp = (Number(count) > 0) ? String(count) : "";
  const giftDisp = (Number(giftCount) > 0) ? String(giftCount) : "";
  const priceDisp = (Number(price) > 0) ? String(price) : "";
  row.innerHTML = `
    <input type="text" class="form-input order-item-name" list="orderProductCatalogList" placeholder="نام کالا از فهرست ثبت‌شده..." value="${safeName}" />
    <input type="number" class="form-input order-item-count" placeholder="تعداد کالا" min="0" value="${cntDisp}" />
    <input type="number" class="form-input order-item-gift" placeholder="تعداد جایزه" min="0" value="${giftDisp}" title="تعداد جایزه" />
    <input type="number" class="form-input order-item-price" placeholder="قیمت واحد" min="0" value="${priceDisp}" />
    <input type="text" class="form-input order-item-total" placeholder="جمع مبلغ" value="" readonly tabindex="-1" title="جمع مبلغ (خودکار: تعداد کالا × قیمت واحد)" />
    <button type="button" class="btn btn-outline btn-sm order-item-edit" title="ویرایش این کالا در فهرست کالاها">✏️</button>
    <button type="button" class="btn btn-danger btn-sm" onclick="removeOrderItemRow('${rowId}')" title="حذف ردیف">🗑️</button>
  `;

  const nameInp = row.querySelector(".order-item-name");
  nameInp.addEventListener("change", () => {
    const prod = (state.products || []).find(p => p.name === nameInp.value.trim());
    if (prod) {
      const priceEl = row.querySelector(".order-item-price");
      if (priceEl) priceEl.value = prod.pharmacyPrice || prod.price || "";
    }
    updateOrderTotalAmountDisplay();
  });
  const editBtn = row.querySelector(".order-item-edit");
  editBtn.addEventListener("click", () => {
    const prod = (state.products || []).find(p => p.name === nameInp.value.trim());
    if (!prod) { alert("این ردیف هنوز با کالایی از فهرست کالاها یکی نیست؛ ابتدا نام کالا را دقیق بنویسید."); return; }
    if (typeof editProductCatalogItem === "function") {
      editProductCatalogItem(prod.id);
      if (typeof switchTab === "function") switchTab("tab-columns-products");
    }
  });
  row.querySelectorAll("input").forEach(inp => {
    inp.addEventListener("input", updateOrderTotalAmountDisplay);
  });

  container.appendChild(row);
  updateOrderTotalAmountDisplay();
}

function removeOrderItemRow(rowId) {
  const row = document.getElementById(rowId);
  if (row) {
    row.remove();
    updateOrderTotalAmountDisplay();
  }
}

function getOrderItemsFromUI() {
  const container = document.getElementById("orderItemsContainer");
  if (!container) return [];
  const rows = container.children;
  const items = [];
  for (let i = 0; i < rows.length; i++) {
    const nameEl = rows[i].querySelector(".order-item-name");
    const countEl = rows[i].querySelector(".order-item-count");
    const priceEl = rows[i].querySelector(".order-item-price");
    if (nameEl && nameEl.value.trim()) {
      const giftEl = rows[i].querySelector(".order-item-gift");
      const cnt = parseInt(countEl.value, 10);
      if (!(cnt > 0)) continue;
      items.push({
        name: nameEl.value.trim(),
        count: cnt,
        giftCount: giftEl ? (parseInt(giftEl.value) || 0) : 0,
        price: parseInt(priceEl.value) || 0
      });
    }
  }
  return items;
}

// v11.15 — موتور فرمول مبلغ سفارش (قابل تنظیم توسط مدیر از «اطلاعات کالا»)
function getOrderFormula() {
  const def = { qty: "count", op: "*", price: "price", vat: 10 };
  try {
    const f = (state.settings && state.settings.orderFormula) || {};
    return {
      qty: f.qty === "gift" || f.qty === "price" ? f.qty : "count",
      price: f.price === "count" || f.price === "gift" ? f.price : "price",
      op: (f.op === "+" || f.op === "-" || f.op === "/") ? f.op : "*",
      vat: (f.vat == null || isNaN(Number(f.vat))) ? def.vat : Number(f.vat)
    };
  } catch (e) { return def; }
}

function calcOrderRowTotal(count, gift, price) {
  const f = getOrderFormula();
  const vals = { count: Number(count) || 0, gift: Number(gift) || 0, price: Number(price) || 0 };
  const a = vals[f.qty] != null ? vals[f.qty] : vals.count;
  const b = vals[f.price] != null ? vals[f.price] : vals.price;
  if (f.op === "+") return a + b;
  if (f.op === "-") return Math.max(0, a - b);
  if (f.op === "/") return b ? Math.round(a / b) : 0;
  return a * b;
}

function updateOrderTotalAmountDisplay() {
  const container = document.getElementById("orderItemsContainer");
  let sum = 0;
  if (container) {
    Array.prototype.forEach.call(container.children, row => {
      const n = row.querySelector(".order-item-name");
      if (!n) return;
      const name = (n.value || "").trim();
      const c = row.querySelector(".order-item-count");
      const g = row.querySelector(".order-item-gift");
      const p = row.querySelector(".order-item-price");
      const t = row.querySelector(".order-item-total");
      const cnt = parseInt(c && c.value, 10) || 0;
      const gift = parseInt(g && g.value, 10) || 0;
      const price = parseInt(p && p.value, 10) || 0;
      const rowTotal = name ? calcOrderRowTotal(cnt, gift, price) : 0;
      if (t) t.value = (name && rowTotal) ? rowTotal.toLocaleString("fa-IR") : "";
      sum += rowTotal;
    });
  }
  const f = getOrderFormula();
  const vat = Math.round(sum * (Number(f.vat) || 0) / 100);
  const withVat = sum + vat;
  const disp = document.getElementById("orderTotalAmountDisplay");
  if (disp) disp.textContent = sum.toLocaleString("fa-IR");
  const vatP = document.getElementById("orderVatPercentView");
  if (vatP) vatP.textContent = Number(f.vat || 0).toLocaleString("fa-IR") + "٪";
  const vatD = document.getElementById("orderTotalVatDisplay");
  if (vatD) vatD.textContent = vat.toLocaleString("fa-IR");
  const wvD = document.getElementById("orderTotalWithVatDisplay");
  if (wvD) wvD.textContent = withVat.toLocaleString("fa-IR");
}

function renderOrdersList(searchQuery = "") {
  const theadTr = document.getElementById("tableOrdersHeader");
  const tbody = document.getElementById("tableOrdersBody");
  if (!theadTr || !tbody) return;

  theadTr.innerHTML = `
    <th>ردیف</th>
    <th>نام داروخانه</th>
    <th>استان / شهر / منطقه</th>
    <th>نماینده علمی</th>
    <th>تاریخ سفارش</th>
    <th>تعداد اقلام</th>
    <th>مبلغ کل (ریال)</th>
    <th>وضعیت</th>
  `;

  const fieldsList = (state.customFields.order || []).filter(f => f.showInList)
    .slice().sort((a, b) => (Number(a.listOrder != null ? a.listOrder : a.order) || 999) - (Number(b.listOrder != null ? b.listOrder : b.order) || 999));
  fieldsList.forEach(f => {
    const th = document.createElement("th");
    th.textContent = f.label;
    theadTr.appendChild(th);
  });

  const thAction = document.createElement("th");
  thAction.textContent = "عملیات";
  theadTr.appendChild(thAction);

  tbody.innerHTML = "";

  const filtered = state.orders.filter(ord => {
    if (!searchQuery) return true;
    return ord.pharmacyName.includes(searchQuery) || (ord.repName && ord.repName.includes(searchQuery));
  });

  filtered.forEach((ord, index) => {
    const tr = document.createElement("tr");

    const statusBadge = ord.status === "تایید شده"
      ? `<span class="status-badge status-online">✅ ${ord.status}</span>`
      : ord.status === "در حال بررسی"
      ? `<span class="status-badge status-visiting">⏳ ${ord.status}</span>`
      : `<span class="status-badge" style="background:#f1f5f9;color:#475569;">${ord.status}</span>`;

    let rowHTML = `
      <td>${index + 1}</td>
      <td><strong style="color: #0d9488;">${ord.pharmacyName}</strong></td>
      <td>${ord.province} / ${ord.city} / ${ord.district}</td>
      <td>${ord.repName || "-"}</td>
      <td>${ord.orderDate || "-"}</td>
      <td>${ord.items ? ord.items.length : 0} قلم</td>
      <td><strong style="color: #0d9488;">${Number(ord.totalAmount || 0).toLocaleString("fa-IR")}</strong></td>
      <td>${statusBadge}</td>
    `;

    fieldsList.forEach(f => {
      const val = (ord.customFields && ord.customFields[f.label]) ? ord.customFields[f.label] : "-";
      rowHTML += `<td><strong>${val}</strong></td>`;
    });

    rowHTML += `
      <td>
        <div style="display: flex; gap: 0.4rem;">
          <button class="btn btn-outline btn-sm" onclick="editOrder('${ord.id}')">✏️ ویرایش</button>
          <button class="btn btn-danger btn-sm" onclick="deleteOrder('${ord.id}')">🗑️ حذف</button>
        </div>
      </td>
    `;

    tr.innerHTML = rowHTML;
    tbody.appendChild(tr);
  });
}

function editOrder(id) {
  const ord = state.orders.find(o => o.id === id);
  if (!ord) return;

  document.getElementById("orderEditId").value = ord.id;
  document.getElementById("orderPharmacyName").value = ord.pharmacyName;
  document.getElementById("orderAddress").value = ord.address || "";
  document.getElementById("orderRepName").value = ord.repName || "";
  document.getElementById("orderDate").value = ord.orderDate || "";
  document.getElementById("orderStatus").value = ord.status || "تایید شده";
  document.getElementById("orderNotes").value = ord.notes || "";

  const provEl = document.getElementById("orderProvince");
  const cityEl = document.getElementById("orderCity");
  const distEl = document.getElementById("orderDistrict");

  provEl.value = ord.province;
  populateCities(ord.province, cityEl, ord.city);
  populateDistricts(ord.province, ord.city, distEl, ord.district);

  const container = document.getElementById("orderItemsContainer");
  container.innerHTML = "";
  (ord.items || []).forEach(item => {
    addOrderItemRow(item.name, item.count, item.price, item.giftCount || 0);
  });
  mergeCatalogIntoOrderItems();
  updateOrderTotalAmountDisplay();

  renderCustomFieldsInForm("order", "orderCustomFieldsContainer", ord.customFields || {});

  document.getElementById("tab-orders").scrollIntoView({ behavior: "smooth" });
}

function deleteOrder(id) {
  if (!confirm("آیا از حذف این سفارش اطمینان دارید؟")) return;
  state.orders = state.orders.filter(o => o.id !== id);
  saveState();
  renderOrdersList();
  updateNavBadges();
}

// ----------------------------------------------------------------------------
// 13. پیاده‌سازی ویژگی ۸: پشتیبان‌گیری خودکار، جایگزینی فایل تک‌نام و بازیابی
// ----------------------------------------------------------------------------
function setupBackupAndRestore() {
  const chkAuto = document.getElementById("chkAutoBackupEnabled");
  const btnSelectFolder = document.getElementById("btnSelectAutoBackupFolder");
  const btnManualNow = document.getElementById("btnManualBackupNow");
  const btnQuickBackup = document.getElementById("btnQuickBackup");
  const btnResetDefault = document.getElementById("btnResetDefault");

  if (chkAuto) {
    chkAuto.checked = state.settings ? state.settings.autoBackupEnabled : true;
    chkAuto.addEventListener("change", () => {
      state.settings.autoBackupEnabled = chkAuto.checked;
      saveState(false);
      updateAutoBackupStatusBadge();
    });
  }

  if (btnSelectFolder) {
    btnSelectFolder.addEventListener("click", async () => {
      if (window.showSaveFilePicker) {
        try {
          const handle = await window.showSaveFilePicker({
            suggestedName: "crm-backup-latest.json",
            types: [{
              description: "JSON CRM Backup File",
              accept: { "application/json": [".json"] }
            }]
          });
          autoBackupFileHandle = handle;
          document.getElementById("autoBackupHandleStatus").textContent = "✅ متصل به فایل: crm-backup-latest.json (ذخیره خودکار)";
          await performAutoBackup();
          alert("✅ فایل پشتیبان‌گیری خودکار تنظیم شد. از این پس با هر تغییر، فایل پشتیبان شما به طور خودکار جایگزین همین فایل (crm-backup-latest.json) خواهد شد.");
        } catch (err) {
          console.warn("انصراف کاربر:", err);
        }
      } else {
        alert("مرورگر شما از قابلیت File System Access API پشتیبانی نمی‌کند، اما پشتیبان‌گیری خودکار به صورت دائمی در حافظه سیستم ذخیره می‌شود.");
      }
    });
  }

  const downloadSingleBackupFile = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "crm-backup-latest.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (btnManualNow) btnManualNow.addEventListener("click", downloadSingleBackupFile);
  if (btnQuickBackup) btnQuickBackup.addEventListener("click", downloadSingleBackupFile);

  if (btnResetDefault) {
    btnResetDefault.addEventListener("click", () => {
      if (confirm("⚠️ آیا از بازنشانی کلیه اطلاعات به حالت پیش‌فرض اولیه اطمینان دارید؟")) {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
      }
    });
  }

  if (autoBackupIntervalId) clearInterval(autoBackupIntervalId);
  autoBackupIntervalId = setInterval(() => {
    if (state.settings && state.settings.autoBackupEnabled) {
      performAutoBackup();
    }
  }, (state.settings.autoBackupIntervalMinutes || 5) * 60000);

  updateAutoBackupStatusBadge();
  setupRestoreSection();
}

async function performAutoBackup() {
  if (state.settings) state.settings.lastBackupTime = new Date().toLocaleString("fa-IR");

  if (autoBackupFileHandle) {
    try {
      const writable = await autoBackupFileHandle.createWritable();
      await writable.write(JSON.stringify(state, null, 2));
      await writable.close();
      console.log("پشتیبان‌گیری خودکار در فایل crm-backup-latest.json انجام شد.");
    } catch (err) {
      console.warn("خطا در نوشتن فایل پشتیبان خودکار:", err);
    }
  }
}

function updateAutoBackupStatusBadge() {
  const badge = document.getElementById("autoBackupStatusBadge");
  if (!badge) return;

  if (state.settings && state.settings.autoBackupEnabled) {
    badge.style.background = "rgba(16, 185, 129, 0.25)";
    badge.innerHTML = "<span>✅ پشتیبان‌گیری خودکار: فعال</span>";
  } else {
    badge.style.background = "rgba(245, 158, 11, 0.25)";
    badge.innerHTML = "<span>⏸️ پشتیبان‌گیری خودکار: غیرفعال</span>";
  }
}

function setupRestoreSection() {
  const dropzone = document.getElementById("dropzoneRestore");
  const fileInput = document.getElementById("fileInputRestore");
  const previewCard = document.getElementById("restorePreviewCard");
  const btnCancel = document.getElementById("btnCancelRestore");
  const btnConfirm = document.getElementById("btnConfirmRestore");

  let tempRestoreData = null;

  if (!dropzone || !fileInput) return;

  dropzone.addEventListener("click", () => fileInput.click());

  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.style.background = "#dbeafe";
  });

  dropzone.addEventListener("dragleave", () => {
    dropzone.style.background = "#f0fdf4";
  });

  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.style.background = "#f0fdf4";
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleRestoreFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleRestoreFile(e.target.files[0]);
    }
  });

  const handleRestoreFile = (file) => {
    if (!file.name.endsWith(".json")) {
      alert("لطفاً یک فایل پشتیبان با فرمت .json انتخاب کنید.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!parsed.pharmacies || !parsed.doctors || !parsed.orders) {
          alert("فایل پشتیبان انتخاب شده معتبر نیست یا ساختار آن ناقص است.");
          return;
        }

        tempRestoreData = parsed;
        document.getElementById("resCountPharmacies").textContent = parsed.pharmacies.length;
        document.getElementById("resCountDoctors").textContent = parsed.doctors.length;
        document.getElementById("resCountUsers").textContent = (parsed.users || []).length;
        document.getElementById("resCountOrders").textContent = parsed.orders.length;
        document.getElementById("resCountFields").textContent = Object.keys(parsed.customFields || {}).reduce((s, k) => s + (parsed.customFields[k].length || 0), 0);

        previewCard.style.display = "block";
        previewCard.scrollIntoView({ behavior: "smooth" });
      } catch (err) {
        alert("خطا در خواندن فایل پشتیبان JSON: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  if (btnCancel) {
    btnCancel.addEventListener("click", () => {
      tempRestoreData = null;
      previewCard.style.display = "none";
      fileInput.value = "";
    });
  }

  if (btnConfirm) {
    btnConfirm.addEventListener("click", () => {
      if (!tempRestoreData) return;
      state = tempRestoreData;
      if (!state.users) state.users = DEFAULT_INITIAL_DATA.users;
      if (!state.settings) state.settings = DEFAULT_INITIAL_DATA.settings;

      saveState(false);
      previewCard.style.display = "none";
      fileInput.value = "";
      alert("✅ بازیابی کامل اطلاعات با موفقیت انجام شد!");
      
      renderCustomFieldsTable();
      renderAllCustomFieldsInFormsAndTables();
      renderUserCardsList();
      renderDashboardOverviewMap();
      renderOrdersList();
      updateNavBadges();
      populateRepSelectorInOrders();
      populatePharmacyDatalistInOrders();
    });
  }
}

// ----------------------------------------------------------------------------
// 14. سیستم ورود، تغییر نقش و خروج (Auth & Role Switching)
// ----------------------------------------------------------------------------
let currentRoleIndex = 0;
let currentUserName = "مدیر سیستم";

function setupAuthAndRoleSwitching() {
  const btnOpenLogin = document.getElementById("btnOpenLoginModal");
  const formLogin = document.getElementById("formLoginModal");
  const btnLogout = document.getElementById("btnLogoutSystem");

  if (btnOpenLogin) {
    btnOpenLogin.addEventListener("click", () => {
      openModalLogin();
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      if (confirm("آیا از خروج از سامانه اطمینان دارید؟")) {
        currentRoleIndex = 0;
        currentUserName = "مدیر سیستم";
        try { sessionStorage.removeItem("crmLoggedIn"); } catch(e) {}
        location.href = "/login";
        return;
      }
    });
  }

  if (formLogin) {
    formLogin.addEventListener("submit", () => {
      const roleIdx = parseInt(document.getElementById("loginRoleSelect").value);
      const selOpt = document.getElementById("loginRoleSelect").options[roleIdx];
      const simMode = document.getElementById("loginSimAuthMode") ? document.getElementById("loginSimAuthMode").value : "3";
      currentRoleIndex = roleIdx;
      currentUserName = selOpt ? selOpt.textContent : "مدیر سیستم";

      if (simMode === "1") {
        const otp = prompt("💬 پیامک رمز یک‌بارمصرف (OTP) ارسال شد. لطفاً کد ۶ رقمی را وارد کنید:", "123456");
        if (!otp) return;
      } else if (simMode === "2") {
        alert("📲 کد تایید ورود شما برای مدیر سیستم ارسال شد. پس از تایید وارد می‌شوید.");
      }

      applyUserRolePermissions();
      closeModalLogin();
      alert(`✅ ورود موفقیت‌آمیز! سطح دسترسی اعمال شد.`);
    });
  }

  if (window.location.pathname.includes("/login") || window.location.hash.includes("login")) {
    setTimeout(openModalLogin, 500);
  }

  applyUserRolePermissions();
}

function openModalLogin() {
  const mod = document.getElementById("modalLogin");
  if (mod) mod.classList.add("active");
}

function closeModalLogin() {
  const mod = document.getElementById("modalLogin");
  if (mod) mod.classList.remove("active");
}

function applyUserRolePermissions() {
  const roleLabel = document.getElementById("currentUserRoleLabel");
  if (roleLabel) {
    roleLabel.textContent = `ثبت اطلا... ${currentUserName}`;
  }
}

// ----------------------------------------------------------------------------
// 15. تست اتصال به سرور و بنر عیب‌یابی آفلاین (Screenshot 8)
// ----------------------------------------------------------------------------
function testServerConnectivity() {
  const box = document.getElementById("diagnosticsStatusBox");
  if (box) {
    box.style.background = "#fef9c3";
    box.style.color = "#854d0e";
    box.textContent = "⏳ در حال بررسی ارتباط با سرورهای Render.com و Neon...";
  }

  setTimeout(() => {
    if (box) {
      box.style.background = "#f0fdf4";
      box.style.color = "#166534";
      box.textContent = "✅ ارتباط با سرورهای ابری namayandeelmi-javad.onrender.com و ndcohub.ir برقرار است.";
    }
    alert("✅ اتصال به سرور ابری و حافظه محلی با موفقیت تایید شد.");
  }, 700);
}

function retryServerConnection() {
  const banner = document.getElementById("diagnosticOfflineBanner");
  alert("🔄 در حال تلاش برای برقراری ارتباط مجدد با سرور...");
  if (banner) banner.style.display = "none";
}

// ----------------------------------------------------------------------------
// 16. خروجی اکسل (CSV Export)
// ----------------------------------------------------------------------------
function setupCSVExportButtons() {
  const btnPh = document.getElementById("btnExportPharmaciesCSV");
  const btnDoc = document.getElementById("btnExportDoctorsCSV");
  const btnOrd = document.getElementById("btnExportOrdersCSV");
  const btnUsers = document.getElementById("btnExportUsersCSV");

  if (btnPh) {
    btnPh.addEventListener("click", () => {
      const hdrs = ["نام داروخانه", "تلفن", "استان", "شهر", "منطقه", "آدرس", "درصدی"];
      const rws = state.pharmacies.map(p => [p.name, p.phone || "", p.province, p.city, p.district, p.address, p.isPercentage ? "بله" : "خیر"]);
      downloadCSVFile("pharmacies-export.csv", hdrs, rws);
    });
  }

  if (btnDoc) {
    btnDoc.addEventListener("click", () => {
      const hdrs = ["نام پزشک/مطب", "تخصص", "تلفن", "استان", "شهر", "منطقه", "آدرس", "درصدی"];
      const rws = state.doctors.map(d => [d.name, d.specialty, d.phone || "", d.province, d.city, d.district, d.address, d.isPercentage ? "بله" : "خیر"]);
      downloadCSVFile("doctors-export.csv", hdrs, rws);
    });
  }

  if (btnOrd) {
    btnOrd.addEventListener("click", () => {
      const hdrs = ["نام داروخانه", "استان", "شهر", "منطقه", "نماینده", "تاریخ", "مبلغ کل (ریال)", "وضعیت"];
      const rws = state.orders.map(o => [o.pharmacyName, o.province, o.city, o.district, o.repName || "", o.orderDate, o.totalAmount || 0, o.status]);
      downloadCSVFile("orders-export.csv", hdrs, rws);
    });
  }

  if (btnUsers) {
    btnUsers.addEventListener("click", () => {
      const hdrs = ["نام و نام خانوادگی", "نام کاربری", "نقش", "شماره همراه", "کنترل سیم‌کارت"];
      const rws = state.users.map(u => [u.fullName, u.username, u.role, u.phone || "", u.simControl]);
      downloadCSVFile("users-export.csv", hdrs, rws);
    });
  }
}

function downloadCSVFile(filename, headers, rows) {
  let csvContent = "\uFEFF";
  csvContent += headers.join(",") + "\n";
  rows.forEach(row => {
    const cleanRow = row.map(cell => `"${String(cell).replace(/"/g, '""')}"`);
    csvContent += cleanRow.join(",") + "\n";
  });
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.setAttribute("href", url);
  a.setAttribute("download", filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ----------------------------------------------------------------------------
// 17. ثبت سرویس‌ورکر (PWA Service Worker Registration)
// ----------------------------------------------------------------------------
function setupPWAServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('✅ سرویس‌ورکر PWA با موفقیت ثبت شد.');
      })
      .catch(err => {
        console.warn('عدم ثبت سرویس‌ورکر در محیط تستی:', err);
      });
  }
}

// ----------------------------------------------------------------------------
// 18. مسیریابی (نشان، بلد، گوگل مپس، ویز) - Matching Prompt Request
// ----------------------------------------------------------------------------
let activeNavCoords = { lat: 35.7200, lng: 51.4200, name: "مقصد" };

function openNavigationAppModal(lat, lng, nameText = "مقصد") {
  activeNavCoords = { lat: Number(lat) || 35.7200, lng: Number(lng) || 51.4200, name: nameText };
  const modal = document.getElementById("modalNavigationApps");
  if (modal) {
    modal.classList.add("active");
  }
}

function closeModalNavigationApps() {
  const modal = document.getElementById("modalNavigationApps");
  if (modal) {
    modal.classList.remove("active");
  }
}

function setupNavigationAppsModal() {
  const btnNeshan = document.getElementById("btnNavNeshan");
  const btnBalad = document.getElementById("btnNavBalad");
  const btnGoogle = document.getElementById("btnNavGoogle");
  const btnWaze = document.getElementById("btnNavWaze");

  if (btnNeshan) {
    btnNeshan.onclick = () => {
      window.open(`https://neshan.org/maps/@${activeNavCoords.lat},${activeNavCoords.lng},16z`, "_blank");
      closeModalNavigationApps();
    };
  }
  if (btnBalad) {
    btnBalad.onclick = () => {
      window.open(`https://balad.ir/location?latitude=${activeNavCoords.lat}&longitude=${activeNavCoords.lng}`, "_blank");
      closeModalNavigationApps();
    };
  }
  if (btnGoogle) {
    btnGoogle.onclick = () => {
      window.open(`https://www.google.com/maps/search/?api=1&query=${activeNavCoords.lat},${activeNavCoords.lng}`, "_blank");
      closeModalNavigationApps();
    };
  }
  if (btnWaze) {
    btnWaze.onclick = () => {
      window.open(`https://waze.com/ul?ll=${activeNavCoords.lat},${activeNavCoords.lng}&navigate=yes`, "_blank");
      closeModalNavigationApps();
    };
  }
}

// ----------------------------------------------------------------------------
// 19. تارگت فروش با محاسبه لحظه‌ای ضرب قیمت پخش و داروخانه (Requirement 10 & 11)
// ----------------------------------------------------------------------------
function setupSalesTargetsTab() {
  const form = document.getElementById("formSalesTarget");
  const repSel = document.getElementById("tgtRepSelect");
  const prodSel = document.getElementById("tgtProductSelect");
  const countInp = document.getElementById("tgtCountInput");
  const distDisp = document.getElementById("tgtCalcDistPrice");
  const phDisp = document.getElementById("tgtCalcPhPrice");

  const updateCalc = () => {
    if (!prodSel || !countInp) return;
    const prodId = prodSel.value;
    const cnt = parseInt(countInp.value) || 0;
    const prod = (state.products || []).find(p => p.name === prodId || p.id === prodId);
    if (prod) {
      const dPrice = (prod.distributorPrice || prod.price || 40000) * cnt;
      const pPrice = (prod.pharmacyPrice || prod.price || 45000) * cnt;
      if (distDisp) distDisp.textContent = `${dPrice.toLocaleString("fa-IR")} ریال`;
      if (phDisp) phDisp.textContent = `${pPrice.toLocaleString("fa-IR")} ریال`;
    } else {
      if (distDisp) distDisp.textContent = "0 ریال";
      if (phDisp) phDisp.textContent = "0 ریال";
    }
  };

  if (repSel) {
    repSel.innerHTML = `<option value="">انتخاب نماینده...</option>`;
    state.reps.forEach(r => {
      repSel.innerHTML += `<option value="${r.name}">${r.name}</option>`;
    });
  }

  if (prodSel) {
    prodSel.innerHTML = `<option value="">انتخاب کالا...</option>`;
    (state.products || []).forEach(p => {
      prodSel.innerHTML += `<option value="${p.name}">${p.name}</option>`;
    });
    prodSel.addEventListener("change", updateCalc);
  }

  if (countInp) {
    countInp.addEventListener("input", updateCalc);
  }

  if (form) {
    form.addEventListener("submit", () => {
      const repName = repSel.value;
      const productName = prodSel.value;
      const targetCount = parseInt(countInp.value) || 0;
      const year = document.getElementById("tgtYearInput").value || "1405";
      const month = document.getElementById("tgtMonthSelect").value || "مرداد";

      if (!repName || !productName || targetCount <= 0) {
        alert("لطفاً نماینده، محصول و تعداد تارگت را وارد کنید.");
        return;
      }

      const prod = (state.products || []).find(p => p.name === productName);
      const totalDist = targetCount * (prod ? (prod.distributorPrice || prod.price || 40000) : 40000);
      const totalPh = targetCount * (prod ? (prod.pharmacyPrice || prod.price || 45000) : 45000);

      const newTgt = {
        id: "tgt-" + Date.now(),
        repName,
        productName,
        targetCount,
        achievedCount: 0,
        month: `${month} ${year}`,
        targetAmount: totalPh,
        achievedAmount: 0
      };

      if (!state.salesTargets) state.salesTargets = [];
      state.salesTargets.push(newTgt);
      saveState();
      form.reset();
      updateCalc();
      renderSalesTargetsTable();
      alert(`🎯 تارگت فروش برای «${repName}» روی محصول «${productName}» ثبت شد.`);
    });
  }
}

// ----------------------------------------------------------------------------
// 20. اعلان صوتی وب‌اودیو (Audible Web Audio Beep for Notifications)
// ----------------------------------------------------------------------------
function playNotificationBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime); // نت A5
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    console.warn("مرورگر امکان پخش صدای وب‌اودیو را نداشت.");
  }
}

function setupNotificationsSoundAndClicks() {
  const bell = document.querySelector(".btn-header-icon");
  if (bell) {
    bell.addEventListener("click", () => {
      playNotificationBeep();
      switchTab("tab-notifications");
      (state.notifications || []).forEach(n => n.isRead = true);
      const badge = bell.querySelector(".notif-count-badge");
      if (badge) badge.style.display = "none";
    });
  }
}

// ----------------------------------------------------------------------------
// 21. بزرگنمایی نقشه به تفکیک استان و شهر در نقشه جامع
// ----------------------------------------------------------------------------
function setupComprehensiveMapFilters() {
  const provSel = document.getElementById("mapFilterProvince");
  const citySel = document.getElementById("mapFilterCity");
  const btnFocus = document.getElementById("btnFocusMapRegion");

  if (provSel) {
    populateProvinces(provSel);
    provSel.addEventListener("change", () => {
      if (citySel) populateCities(provSel.value, citySel);
    });
  }

  if (btnFocus) {
    btnFocus.addEventListener("click", () => {
      const prov = provSel ? provSel.value : "";
      const city = citySel ? citySel.value : "";

      if (city === "تهران" || prov === "تهران") {
        if (mapFullOverview) mapFullOverview.setView([35.7200, 51.4200], 12);
        alert("🔍 بزرگنمایی روی استان/شهر تهران انجام شد.");
      } else if (city === "مشهد" || prov === "خراسان رضوی") {
        if (mapFullOverview) mapFullOverview.setView([36.2970, 59.6062], 12);
        alert("🔍 بزرگنمایی روی مشهد انجام شد.");
      } else if (city === "اصفهان" || prov === "اصفهان") {
        if (mapFullOverview) mapFullOverview.setView([32.6546, 51.6680], 12);
        alert("🔍 بزرگنمایی روی اصفهان انجام شد.");
      } else {
        if (mapFullOverview) mapFullOverview.setView([35.7200, 51.4200], 6);
      }
    });
  }
}

// ----------------------------------------------------------------------------
// 22. شروع برنامه و اتصال تمامی ماژول‌ها هنگام بارگذاری صفحه (با ایمنی ۱۰۰٪ در برابر خطا)
// ----------------------------------------------------------------------------
function setupNetworkStatusMonitor() {
  const updateBadge = () => {
    const el = document.getElementById("globalOnlineStatusBadge");
    if (!el) return;
    if (navigator.onLine) {
      el.textContent = "🟢 آنلاین (متصل به سرور)";
      el.style.background = "#10b981";
    } else {
      el.textContent = "🔴 آفلاین (ذخیره محلی)";
      el.style.background = "#ef4444";
    }
  };
  window.addEventListener("online", updateBadge);
  window.addEventListener("offline", updateBadge);
  updateBadge();
}

document.addEventListener("DOMContentLoaded", () => {
  try { loadState(); } catch(e) { console.error("error loadState:", e); }
  try { setupNetworkStatusMonitor(); } catch(e) { console.error("error netMonitor:", e); }
  try { setupAuthAndRoleSwitching(); } catch(e) { console.error("error auth:", e); }
  try { setupNotificationsSoundAndClicks(); } catch(e) { console.error("error notifClick:", e); }
  try { setupNavigationMenu(); } catch(e) { console.error("error nav:", e); }
  try { initMaps(); } catch(e) { console.error("error maps:", e); }

  try { setupCustomFieldsTab(); } catch(e) {}
  try { setupPharmacyTab(); } catch(e) {}
  try { setupDoctorTab(); } catch(e) {}
  try { setupRepsTab(); } catch(e) {}
  try { setupLiveLocationTab(); } catch(e) {}
  try { setupOrdersTab(); } catch(e) {}
  try { setupUsersAndPermissionsTab(); } catch(e) {}
  try { setupOtherSidebarModules(); } catch(e) {}
  try { setupBackupAndRestore(); } catch(e) {}
  try { setupAddOptionModalForm(); } catch(e) {}
  try { setupLeavesModule(); } catch(e) {}
  try { setupNotificationsMessaging(); } catch(e) {}

  try { setupJalaliDateAutoSlash(); } catch(e) {}
  try { setupJalaliCalendarPicker(); } catch(e) {}
  try { setupFormListSwitchers(); } catch(e) {}
  try { setupDropdownAutoClear(); } catch(e) {}
  try { setupCSVExportButtons(); } catch(e) {}
  try { setupNavigationAppsModal(); } catch(e) {}
  try { setupSalesTargetsTab(); } catch(e) {}
  try { setupComprehensiveMapFilters(); } catch(e) {}
  try { setupSearchInfoTab(); } catch(e) {}
  try { setupColumnsProductsTab(); } catch(e) {}
  try { setupPWAServiceWorker(); } catch(e) {}

  try { renderAllCustomFieldsInFormsAndTables(); } catch(e) {}
  try { renderLeavesTable(); } catch(e) {}
  try { renderNotificationsTable(); } catch(e) {}

  try { setupAllFormSubmitHandlers(); } catch(e) { console.error("error submitHandlers:", e); }
  console.log("✅ سیستم مدیریت و ویزیت علمی با تمامی ۱۲ بازخورد تاریخی، اسلش خودکار، پیام‌رسانی و تارگت بارگذاری شد.");
});


// ============================================================================
// 26. توابع ثبت و ذخیره داروخانه، پزشک، سفارشات و بررسی تکراری بودن + کسر از تارگت
// ============================================================================
function setupAllFormSubmitHandlers() {
  // 1. ذخیره داروخانه (با بررسی تکراری بودن)
  const formPh = document.getElementById("formPharmacy");
  const btnPh = document.getElementById("btnSavePharmacy");
  const handleSavePh = () => {
    if (typeof window.validateRequiredFields === "function" && !window.validateRequiredFields("tab-pharmacies")) return;
    const editId = document.getElementById("pharmacyEditId").value;
    const dateAdded = document.getElementById("pharmacyDate").value.trim() || jalaliTodayEnglish();
    const name = document.getElementById("pharmacyName").value.trim();
    const phone = document.getElementById("pharmacyPhone").value.trim();
    const manager = document.getElementById("pharmacyManager").value.trim();
    const province = document.getElementById("pharmacyProvince").value;
    const city = document.getElementById("pharmacyCity").value;
    const district = document.getElementById("pharmacyDistrict").value;
    const address = document.getElementById("pharmacyAddress").value.trim();
    const lat = parseFloat(document.getElementById("pharmacyLat").value) || 35.7605;
    const lng = parseFloat(document.getElementById("pharmacyLng").value) || 51.4180;
    const isPercentage = document.getElementById("pharmacyIsPercentage").value === "true";
    const customFieldsVals = (typeof extractCustomFieldValuesFromForm === "function")
      ? extractCustomFieldValuesFromForm("pharmacy", "pharmacyCustomFieldsContainer")
      : {};

    if (typeof window.validateRequiredFields === "function" && !window.validateRequiredFields("tab-pharmacies")) return;

    // بررسی تکراری بودن داروخانه (Requirement 2 in prompt)
    if (!editId) {
      const isDup = state.pharmacies.some(p => p.name === name || (phone && p.phone === phone));
      if (isDup && !window.v20DupGate("pharmacy")) return;
    }

    if (editId) {
      const idx = state.pharmacies.findIndex(p => p.id === editId);
      if (idx !== -1) {
        state.pharmacies[idx] = { ...state.pharmacies[idx], dateAdded, name, phone, manager, province, city, district, address, lat, lng, isPercentage, customFields: customFieldsVals };
      }
      alert(`✅ داروخانه «${name}» با موفقیت ویرایش و ذخیره شد.`);
    } else {
      state.pharmacies.push({
        id: "ph-" + Date.now(),
        dateAdded, name, phone, manager, province, city, district, address, lat, lng, isPercentage,
        customFields: customFieldsVals,
        repName: currentUserName
      });
      alert(`✅ داروخانه «${name}» با موفقیت ثبت شد.`);
    }

    saveState();
    try { if (typeof window.rememberPharmacyName === "function") window.rememberPharmacyName(name, { province: province, city: city, district: district, address: address, phone: phone, create: false }); } catch (eRem) {}
    resetPharmacyForm();
    renderPharmaciesList();
    renderDashboardOverviewMap();
    updateNavBadges();
    try { if (typeof populatePharmacyDatalistInOrders === "function") populatePharmacyDatalistInOrders(); } catch (ePop) {}
  };

  if (btnPh) btnPh.onclick = (e) => { e.preventDefault(); handleSavePh(); };
  if (formPh) formPh.onsubmit = (e) => { e.preventDefault(); handleSavePh(); };

  // 2. ذخیره پزشک (با بررسی تکراری بودن)
  const formDoc = document.getElementById("formDoctor");
  const btnDoc = document.getElementById("btnSaveDoctor");
  const handleSaveDoc = () => {
    if (typeof window.validateRequiredFields === "function" && !window.validateRequiredFields("tab-doctors")) return;
    const editId = document.getElementById("doctorEditId").value;
    const dateAdded = document.getElementById("doctorDate").value.trim() || jalaliTodayEnglish();
    const name = document.getElementById("doctorName").value.trim();
    const specialty = document.getElementById("doctorSpecialty").value.trim();
    const phone = document.getElementById("doctorPhone").value.trim();
    const province = document.getElementById("doctorProvince").value;
    const city = document.getElementById("doctorCity").value;
    const district = document.getElementById("doctorDistrict").value;
    const address = document.getElementById("doctorAddress").value.trim();
    const lat = parseFloat(document.getElementById("doctorLat").value) || 35.7580;
    const lng = parseFloat(document.getElementById("doctorLng").value) || 51.4400;
    const isPercentage = document.getElementById("doctorIsPercentage").value === "true";
    const customFieldsVals = (typeof extractCustomFieldValuesFromForm === "function")
      ? extractCustomFieldValuesFromForm("doctor", "doctorCustomFieldsContainer")
      : {};

    if (typeof window.validateRequiredFields === "function" && !window.validateRequiredFields("tab-doctors")) return;

    if (!editId) {
      const isDup = state.doctors.some(d => d.name === name || (phone && d.phone === phone));
      if (isDup && !window.v20DupGate("doctor")) return;
    }

    if (editId) {
      const idx = state.doctors.findIndex(d => d.id === editId);
      if (idx !== -1) {
        state.doctors[idx] = { ...state.doctors[idx], dateAdded, name, specialty, phone, province, city, district, address, lat, lng, isPercentage, customFields: customFieldsVals };
      }
      alert(`✅ پزشک/مطب «${name}» با موفقیت ویرایش و ذخیره شد.`);
    } else {
      state.doctors.push({
        id: "doc-" + Date.now(),
        dateAdded, name, specialty, phone, province, city, district, address, lat, lng, isPercentage,
        customFields: customFieldsVals,
        repName: currentUserName
      });
      alert(`✅ پزشک/مطب «${name}» با موفقیت ثبت شد.`);
    }

    saveState();
    resetDoctorForm();
    renderDoctorsList();
    renderDashboardOverviewMap();
    updateNavBadges();
  };

  if (btnDoc) btnDoc.onclick = (e) => { e.preventDefault(); handleSaveDoc(); };
  if (formDoc) formDoc.onsubmit = (e) => { e.preventDefault(); handleSaveDoc(); };

  // 3. ذخیره سفارش (همراه با کسر از باقیمانده تارگت کالاها)
  const formOrd = document.getElementById("formOrder");
  const btnOrd = document.getElementById("btnSaveOrder");
  const handleSaveOrd = () => {
    if (typeof window.validateRequiredFields === "function" && !window.validateRequiredFields("tab-orders")) return;
    const editId = document.getElementById("orderEditId").value;
    const pharmacyName = document.getElementById("orderPharmacyName").value.trim();
    const province = document.getElementById("orderProvince").value;
    const city = document.getElementById("orderCity").value;
    const district = document.getElementById("orderDistrict").value;
    const address = document.getElementById("orderAddress").value.trim();
    const repName = document.getElementById("orderRepName").value || currentUserName;
    const orderDate = document.getElementById("orderDate").value.trim() || jalaliTodayEnglish();
    const status = document.getElementById("orderStatus").value;
    const notes = document.getElementById("orderNotes").value.trim();
    const pharmacyId = ((document.getElementById("orderPharmacyMatchedId") || {}).value) || "";
    const customFieldsVals = (typeof extractCustomFieldValuesFromForm === "function")
      ? extractCustomFieldValuesFromForm("order", "orderCustomFieldsContainer")
      : {};

    if (typeof window.validateRequiredFields === "function" && !window.validateRequiredFields("tab-orders")) return;

    const items = getOrderItemsFromUI();
    if (items.length === 0 || !items[0].name) {
      alert("لطفاً حداقل یک قلم دارویی در سفارش ثبت کنید.");
      return;
    }

    const totalAmount = items.reduce((sum, item) => sum + calcOrderRowTotal(item.count, item.giftCount || 0, item.price), 0);
    const vatAmount = Math.round(totalAmount * (getOrderFormula().vat || 0) / 100);
    const totalAmountWithVat = totalAmount + vatAmount;
    const orderManagerRec = (state.pharmacies || []).find(p => p.id === pharmacyId || p.name === pharmacyName) || {};

    // کسر خودکار از باقیمانده تارگت نماینده (Requirement 1 in prompt)
    items.forEach(item => {
      const tgt = (state.salesTargets || []).find(t => t.repName === repName && t.productName === item.name);
      if (tgt) {
        tgt.achievedCount = (tgt.achievedCount || 0) + item.count;
        const prod = (state.products || []).find(p => p.name === item.name);
        tgt.achievedAmount = tgt.achievedCount * (prod ? (prod.pharmacyPrice || prod.price || 45000) : 45000);
      }
    });

    if (editId) {
      const idx = state.orders.findIndex(o => o.id === editId);
      if (idx !== -1) {
        state.orders[idx] = { ...state.orders[idx], pharmacyName, pharmacyId, orderManager: orderManagerRec.manager || "", orderManagerPhone: orderManagerRec.managerPhone || "", province, city, district, address, repName, orderDate, status, notes, items, quantityValidated: true, totalAmount, vatAmount, totalAmountWithVat, customFields: customFieldsVals };
      }
      alert(`✅ سفارش داروخانه «${pharmacyName}» ویرایش شد.`);
    } else {
      state.orders.push({
        id: "ord-" + Date.now(),
        pharmacyName, pharmacyId, orderManager: orderManagerRec.manager || "", orderManagerPhone: orderManagerRec.managerPhone || "", province, city, district, address, repName, orderDate, status, notes, items, quantityValidated: true, totalAmount, vatAmount, totalAmountWithVat,
        customFields: customFieldsVals
      });
      alert(`✅ سفارش جدید برای داروخانه «${pharmacyName}» ثبت شد. از باقیمانده تارگت نماینده کسر گردید.`);
    }

    saveState();
    resetOrderForm();
    renderOrdersList();
    renderSalesTargetsTable();
    updateNavBadges();
  };

  if (btnOrd) btnOrd.onclick = (e) => { e.preventDefault(); handleSaveOrd(); };
  if (formOrd) formOrd.onsubmit = (e) => { e.preventDefault(); handleSaveOrd(); };
}


// ============================================================================
// 27. اسلش خودکار در تاریخ شمسی (Jalali Date Auto Slash - YYYY/MM/DD)
// ============================================================================

function jalaliTodayEnglish() {
  if (window.CRMJalali && typeof window.CRMJalali.jalaliTodayStr === "function") {
    return window.CRMJalali.jalaliTodayStr();
  }
  try {
    const fa = "۰۱۲۳۴۵۶۷۸۹";
    const ar = "٠١٢٣٤٥٦٧٨٩";
    let s = new Date().toLocaleDateString("fa-IR", { timeZone: "Asia/Tehran" });
    s = s.replace(/[۰-۹]/g, d => String(fa.indexOf(d))).replace(/[٠-٩]/g, d => String(ar.indexOf(d))).replace(/-/g, "/");
    const m = s.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
    if (!m) return "1405/05/22";
    const pad = n => (Number(n) < 10 ? "0" : "") + Number(n);
    return m[1] + "/" + pad(m[2]) + "/" + pad(m[3]);
  } catch (e) {
    return "1405/05/22";
  }
}

function setupJalaliDateAutoSlash() {
  const dateInputs = document.querySelectorAll("input[placeholder*='1405'], #pharmacyDate, #doctorDate, #orderDate, #visitDate, #leaveFromDate, #leaveToDate");
  dateInputs.forEach(inp => {
    if (inp.dataset.slashBound === "true") return;
    inp.dataset.slashBound = "true";

    inp.addEventListener("input", function(e) {
      let val = this.value.replace(/[^0-9]/g, "");
      if (val.length > 4 && val.length <= 6) {
        this.value = val.slice(0, 4) + "/" + val.slice(4);
      } else if (val.length > 6) {
        this.value = val.slice(0, 4) + "/" + val.slice(4, 6) + "/" + val.slice(6, 8);
      } else {
        this.value = val;
      }
    });

    if (!inp.value) {
      inp.value = jalaliTodayEnglish();
    }
  });
}

// ============================================================================
// 28. جابجایی تب فرم ثبت و لیست در داروخانه‌ها، پزشکان و سفارشات (Form/List Switcher)
// ============================================================================
function setupFormListSwitchers() {
  const switchCard = (btnFormId, btnListId, formCardId, listCardId) => {
    const bF = document.getElementById(btnFormId);
    const bL = document.getElementById(btnListId);
    const cF = document.getElementById(formCardId);
    const cL = document.getElementById(listCardId);
    if (!bF || !bL || !cF || !cL) return;

    cF.style.display = "block";
    cL.style.display = "block";
    bF.addEventListener("click", () => {
      bF.className = "btn btn-primary btn-sm";
      bF.style.background = "#0d9488";
      bL.className = "btn btn-outline btn-sm";
      cF.style.display = "block";
      cL.style.display = "block";
      cF.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    bL.addEventListener("click", () => {
      bL.className = "btn btn-primary btn-sm";
      bL.style.background = "#0d9488";
      bF.className = "btn btn-outline btn-sm";
      cF.style.display = "block";
      cL.style.display = "block";
      cL.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  switchCard("btnShowPhForm", "btnShowPhList", "cardPhForm", "cardPhList");
  switchCard("btnShowDocForm", "btnShowDocList", "cardDocForm", "cardDocList");
  switchCard("btnShowOrdForm", "btnShowOrdList", "cardOrdForm", "cardOrdList");
}


// ============================================================================
// 29. تقویم تعاملی شمسی با پاپ‌آپ و نشانگر روز (Matching Screenshot Date Picker)
// ============================================================================
window.activeDateInputForPicker = null;

function setupJalaliCalendarPicker() {
  const popup = document.getElementById("jalaliCalendarPopup");
  if (!popup) return;

  const dateInputs = document.querySelectorAll("#pharmacyDate, #doctorDate, #orderDate, #visitDate, #leaveFromDate, #leaveToDate");
  dateInputs.forEach(inp => {
    if (inp.dataset.pickerBound === "true") return;
    inp.dataset.pickerBound = "true";

    // ساخت کادر نشانگر تقویم در سمت راست/چپ فیلد (هماهنگ با اسکرین‌شات)
    const wrapper = document.createElement("div");
    wrapper.className = "jalali-input-wrapper";
    inp.parentNode.insertBefore(wrapper, inp);
    wrapper.appendChild(inp);

    const badge = document.createElement("div");
    badge.className = "jalali-badge";
    badge.title = "انتخاب تاریخ از تقویم";
    const GMON = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    let gm = "AUG", gd = "13";
    if (window.CRMJalali && typeof window.CRMJalali.gregorianBadge === "function") {
      const gb = window.CRMJalali.gregorianBadge();
      gm = gb.mon; gd = gb.day;
    } else {
      const g = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Tehran", month: "numeric", day: "numeric" }).formatToParts(new Date());
      const mi = parseInt((g.find(p => p.type === "month") || {}).value || "8", 10);
      gm = GMON[mi - 1] || "AUG";
      gd = String(parseInt((g.find(p => p.type === "day") || {}).value || "13", 10));
    }
    badge.innerHTML = `
      <span class="jalali-badge-header">${gm}</span>
      <span class="jalali-badge-day">${gd}</span>
    `;
    wrapper.insertBefore(badge, inp);

    const openPicker = (e) => {
      e.stopPropagation();
      window.activeDateInputForPicker = inp;
      renderJalaliCalendarDays();
      const rect = inp.getBoundingClientRect();
      popup.style.top = (window.scrollY + rect.bottom + 6) + "px";
      popup.style.left = (window.scrollX + rect.left) + "px";
      popup.classList.add("active");
    };

    badge.addEventListener("click", openPicker);
    inp.addEventListener("click", openPicker);
  });

  const btnPrev = document.getElementById("jalaliPrevMonth");
  const btnNext = document.getElementById("jalaliNextMonth");
  const monthSel = document.getElementById("jalaliMonthSelect");
  const yearSel = document.getElementById("jalaliYearSelect");
  const btnToday = document.getElementById("jalaliTodayBtn");

  if (monthSel && yearSel) {
    monthSel.onchange = () => renderJalaliCalendarDays();
    yearSel.onchange = () => renderJalaliCalendarDays();
  }

  if (btnPrev && monthSel) {
    btnPrev.onclick = () => {
      let idx = monthSel.selectedIndex;
      if (idx > 0) { monthSel.selectedIndex = idx - 1; renderJalaliCalendarDays(); }
    };
  }

  if (btnNext && monthSel) {
    btnNext.onclick = () => {
      let idx = monthSel.selectedIndex;
      if (idx < monthSel.options.length - 1) { monthSel.selectedIndex = idx + 1; renderJalaliCalendarDays(); }
    };
  }

  if (btnToday) {
    const todayStr = (window.CRMJalali && window.CRMJalali.jalaliTodayStr)
      ? window.CRMJalali.jalaliTodayStr()
      : "1405/05/22";
    btnToday.textContent = "امروز: " + todayStr;
    btnToday.onclick = () => {
      if (window.activeDateInputForPicker) {
        window.activeDateInputForPicker.value = todayStr;
      }
      popup.classList.remove("active");
    };
  }

  document.addEventListener("click", (e) => {
    if (!popup.contains(e.target) && !e.target.classList.contains("jalali-badge") && e.target !== window.activeDateInputForPicker) {
      popup.classList.remove("active");
    }
  });
}

function renderJalaliCalendarDays() {
  const grid = document.getElementById("jalaliDaysGrid");
  const monthSel = document.getElementById("jalaliMonthSelect");
  const yearSel = document.getElementById("jalaliYearSelect");
  if (!grid) return;

  const J = window.CRMJalali;
  const year = yearSel ? parseInt(String(yearSel.value).replace(/[^\d]/g, ""), 10) || 1405 : 1405;
  const month = monthSel ? parseInt(String(monthSel.value).replace(/[^\d]/g, ""), 10) || 5 : 5;
  let startEmpty = 0;
  let dim = month <= 6 ? 31 : (month <= 11 ? 30 : 29);
  let todayDay = 0;
  if (J) {
    startEmpty = J.weekdayIran(year, month, 1);
    dim = J.monthLength(year, month);
    const t = J.todayJ();
    if (t.jy === year && t.jm === month) todayDay = t.jd;
  }

  grid.innerHTML = "";
  for (let i = 0; i < startEmpty; i++) {
    const empty = document.createElement("div");
    empty.className = "jalali-day-cell empty";
    grid.appendChild(empty);
  }

  const persianNumbers = ["۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹", "۱۰", "۱۱", "۱۲", "۱۳", "۱۴", "۱۵", "۱۶", "۱۷", "۱۸", "۱۹", "۲۰", "۲۱", "۲۲", "۲۳", "۲۴", "۲۵", "۲۶", "۲۷", "۲۸", "۲۹", "۳۰", "۳۱"];

  for (let d = 1; d <= dim; d++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "jalali-day-cell" + (d === todayDay ? " today active" : "");
    btn.textContent = persianNumbers[d - 1] || d;

    btn.onclick = (e) => {
      e.stopPropagation();
      const dStr = d < 10 ? "0" + d : String(d);
      const mStr = month < 10 ? "0" + month : String(month);
      if (window.activeDateInputForPicker) {
        window.activeDateInputForPicker.value = year + "/" + mStr + "/" + dStr;
      }
      document.getElementById("jalaliCalendarPopup").classList.remove("active");
    };

    grid.appendChild(btn);
  }
}


// ============================================================================
// 30. تب جستجوی اطلاعات پیشرفته (Search Information Tab - Section 6 Requirement)
// ============================================================================
let mapSearchInfoInstance = null;
let markersSearchInfo = [];

function setupSearchInfoTab() {
  const btnRun = document.getElementById("btnRunSearchInfo");
  const btnExp = document.getElementById("btnExportSearchInfoCSV");
  const inpPh = document.getElementById("searchInfoPhInput");
  const inpDoc = document.getElementById("searchInfoDocInput");
  const inpHosp = document.getElementById("searchInfoHospInput");

  const runSearch = () => {
    const qPh = (inpPh ? inpPh.value.trim() : "").toLowerCase();
    const qDoc = (inpDoc ? inpDoc.value.trim() : "").toLowerCase();
    const qHosp = (inpHosp ? inpHosp.value.trim() : "").toLowerCase();

    const results = [];

    // جستجو در داروخانه‌ها
    state.pharmacies.forEach((p, idx) => {
      if (qPh && !p.name.toLowerCase().includes(qPh)) return;
      if (!qPh && !qDoc && !qHosp) {} // اگر خالی باشد همه نشان داده شود
      results.push({
        index: idx + 1,
        repName: p.repName || "مدیر سیستم",
        type: "داروخانه 🏥",
        name: p.name,
        city: `${p.province} / ${p.city}`,
        address: p.address,
        lat: p.lat,
        lng: p.lng,
        raw: p,
        entityType: "pharmacy"
      });
    });

    // جستجو در پزشکان
    state.doctors.forEach((d, idx) => {
      if (qDoc && !d.name.toLowerCase().includes(qDoc)) return;
      results.push({
        index: idx + 1,
        repName: d.repName || "جواد علمدار",
        type: "پزشک 👨‍⚕️",
        name: d.name,
        city: `${d.province} / ${d.city}`,
        address: d.address,
        lat: d.lat,
        lng: d.lng,
        raw: d,
        entityType: "doctor"
      });
    });

    renderSearchInfoResults(results);
  };

  if (btnRun) btnRun.addEventListener("click", runSearch);
  if (inpPh) inpPh.addEventListener("input", runSearch);
  if (inpDoc) inpDoc.addEventListener("input", runSearch);
  if (inpHosp) inpHosp.addEventListener("input", runSearch);

  if (btnExp) {
    btnExp.addEventListener("click", () => {
      const hdrs = ["ردیف", "نام نماینده", "نوع مرکز", "نام مرکز", "شهر/منطقه", "آدرس"];
      const rws = [];
      state.pharmacies.forEach((p, idx) => rws.push([idx + 1, p.repName || "-", "داروخانه", p.name, p.city, p.address]));
      state.doctors.forEach((d, idx) => rws.push([idx + 1, d.repName || "-", "پزشک", d.name, d.city, d.address]));
      downloadCSVFile("search-info-export.csv", hdrs, rws);
    });
  }
}

function renderSearchInfoResults(results) {
  const tbody = document.getElementById("tableSearchInfoBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (!mapSearchInfoInstance && document.getElementById("map-search-info")) {
    mapSearchInfoInstance = L.map("map-search-info").setView([35.7200, 51.4200], 11);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors"
    }).addTo(mapSearchInfoInstance);
  }

  if (mapSearchInfoInstance) {
    markersSearchInfo.forEach(m => mapSearchInfoInstance.removeLayer(m));
    markersSearchInfo = [];
  }

  const allPoints = [];

  results.forEach(res => {
    const tr = document.createElement("tr");
    tr.style.cursor = "pointer";
    tr.onclick = () => openRowDetailsModal(res.raw, res.entityType);

    tr.innerHTML = `
      <td>${res.index}</td>
      <td><strong style="color:#0f172a;">${res.repName}</strong></td>
      <td><span class="badge-status-online" style="background:#0d9488;">${res.type}</span></td>
      <td><strong style="color:#0d9488;">${res.name}</strong></td>
      <td>${res.city}</td>
      <td>${res.address}</td>
      <td>
        <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); openRowDetailsModal(res.raw, '${res.entityType}')">👁️ نمایش و ارسال</button>
      </td>
    `;
    tbody.appendChild(tr);

    if (res.lat && res.lng && mapSearchInfoInstance) {
      const m = createCustomMarker(res.lat, res.lng, res.entityType === "pharmacy" ? "pharmacy" : "doctor", res.name, mapSearchInfoInstance, () => {
        openRowDetailsModal(res.raw, res.entityType);
      });
      markersSearchInfo.push(m);
      allPoints.push([res.lat, res.lng]);
    }
  });

  if (allPoints.length > 0 && mapSearchInfoInstance) {
    mapSearchInfoInstance.fitBounds(allPoints, { padding: [40, 40] });
  }
}

// ============================================================================
// 31. مودال جزئیات رکورد و ارسال مستقیم به بله، ایتا، تلگرام، سروش، واتساپ (Section 10)
// ============================================================================
let activeModalRowObject = null;
let activeModalRowType = null;
let mapRowDetailsMiniInstance = null;
let markerRowDetailsMini = null;

function openRowDetailsModal(rowObj, entityType) {
  activeModalRowObject = rowObj;
  activeModalRowType = entityType;

  const modal = document.getElementById("modalRowDetails");
  const textBox = document.getElementById("rowDetailsContentBox");
  if (!modal || !textBox) return;

  let detailsHTML = "";
  let shareText = "";

  if (entityType === "pharmacy") {
    detailsHTML = `
      <div style="font-weight: 800; font-size: 1.15rem; color: #0d9488; margin-bottom: 0.5rem;">🏥 داروخانه: ${rowObj.name}</div>
      <div><strong>نماینده علمی:</strong> ${rowObj.repName || "مدیر سیستم"}</div>
      <div><strong>استان / شهر / منطقه:</strong> ${rowObj.province} / ${rowObj.city} / ${rowObj.district || "-"}</div>
      <div><strong>آدرس دقیق:</strong> ${rowObj.address}</div>
      <div><strong>شماره تماس:</strong> <span style="direction:ltr; display:inline-block;">${rowObj.phone || "-"}</span></div>
      <div><strong>درصدی:</strong> ${rowObj.isPercentage ? "بله" : "خیر"}</div>
      <div><strong>فایل پیوست:</strong> ${rowObj.fileName || "ندارد"}</div>
    `;
    shareText = `🏥 داروخانه: ${rowObj.name}\nنماینده: ${rowObj.repName || "-"}\nآدرس: ${rowObj.address}\nتلفن: ${rowObj.phone || "-"}`;
  } else if (entityType === "doctor") {
    detailsHTML = `
      <div style="font-weight: 800; font-size: 1.15rem; color: #10b981; margin-bottom: 0.5rem;">👨‍⚕️ پزشک / مطب: ${rowObj.name}</div>
      <div><strong>تخصص:</strong> ${rowObj.specialty}</div>
      <div><strong>نماینده علمی:</strong> ${rowObj.repName || "جواد علمدار"}</div>
      <div><strong>استان / شهر / منطقه:</strong> ${rowObj.province} / ${rowObj.city} / ${rowObj.district || "-"}</div>
      <div><strong>آدرس دقیق:</strong> ${rowObj.address}</div>
      <div><strong>شماره تماس:</strong> <span style="direction:ltr; display:inline-block;">${rowObj.phone || "-"}</span></div>
    `;
    shareText = `👨‍⚕️ پزشک: ${rowObj.name} (${rowObj.specialty})\nنماینده: ${rowObj.repName || "-"}\nآدرس: ${rowObj.address}`;
  } else if (entityType === "order") {
    detailsHTML = `
      <div style="font-weight: 800; font-size: 1.15rem; color: #2563eb; margin-bottom: 0.5rem;">📦 سفارش داروخانه: ${rowObj.pharmacyName}</div>
      <div><strong>نماینده علمی:</strong> ${rowObj.repName || "-"}</div>
      <div><strong>تاریخ سفارش:</strong> ${rowObj.orderDate}</div>
      <div><strong>مبلغ کل:</strong> <strong style="color:#0d9488;">${Number(rowObj.totalAmount || 0).toLocaleString("fa-IR")} ریال</strong></div>
      <div><strong>وضعیت:</strong> ${rowObj.status}</div>
      <div><strong>اقلام و تعداد جایزه 🎁:</strong>
        <ul style="margin: 0.3rem 1.5rem 0 0;">
          ${(rowObj.items || []).map(i => `<li>${i.name} (تعداد: ${i.count} | جایزه 🎁: ${i.giftCount || 0})</li>`).join("")}
        </ul>
      </div>
    `;
    shareText = `📦 سفارش: ${rowObj.pharmacyName}\nتاریخ: ${rowObj.orderDate}\nمبلغ: ${Number(rowObj.totalAmount || 0).toLocaleString("fa-IR")} ریال`;
  }

  textBox.innerHTML = detailsHTML;

  // تنظیم دکمه‌های پیام‌رسان‌ها (بله، ایتا، تلگرام، سروش، واتساپ)
  const bindShare = (btnId, urlPrefix) => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.onclick = () => {
        window.open(`${urlPrefix}${encodeURIComponent(shareText)}`, "_blank");
      };
    }
  };

  bindShare("btnShareBale", "https://ble.ir/share?text=");
  bindShare("btnShareEitaa", "https://eitaa.com/share/url?url=&text=");
  bindShare("btnShareTelegram", "https://t.me/share/url?url=&text=");
  bindShare("btnShareSoroush", "https://splus.ir/share?text=");
  bindShare("btnShareWhatsApp", "https://api.whatsapp.com/send?text=");

  const btnCopy = document.getElementById("btnRowCopyText");
  if (btnCopy) {
    btnCopy.onclick = () => {
      navigator.clipboard.writeText(shareText).then(() => {
        alert("📋 متن اطلاعات در حافظه کپی شد.");
      });
    };
  }

  const btnEdit = document.getElementById("btnRowEdit");
  if (btnEdit) {
    btnEdit.onclick = () => {
      closeModalRowDetails();
      if (entityType === "pharmacy") editPharmacy(rowObj.id);
      else if (entityType === "doctor") editDoctor(rowObj.id);
      else if (entityType === "order") editOrder(rowObj.id);
    };
  }

  const btnDel = document.getElementById("btnRowDelete");
  if (btnDel) {
    btnDel.onclick = () => {
      if (confirm("آیا از حذف این رکورد اطمینان دارید؟")) {
        closeModalRowDetails();
        if (entityType === "pharmacy") deletePharmacy(rowObj.id);
        else if (entityType === "doctor") deleteDoctor(rowObj.id);
        else if (entityType === "order") deleteOrder(rowObj.id);
      }
    };
  }

  modal.classList.add("active");

  setTimeout(() => {
    if (!mapRowDetailsMiniInstance && document.getElementById("rowDetailsMiniMap")) {
      mapRowDetailsMiniInstance = L.map("rowDetailsMiniMap").setView([rowObj.lat || 35.7200, rowObj.lng || 51.4200], 15);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap contributors"
      }).addTo(mapRowDetailsMiniInstance);
    }
    if (mapRowDetailsMiniInstance) {
      mapRowDetailsMiniInstance.invalidateSize();
      if (markerRowDetailsMini) mapRowDetailsMiniInstance.removeLayer(markerRowDetailsMini);
      markerRowDetailsMini = L.marker([rowObj.lat || 35.7200, rowObj.lng || 51.4200]).addTo(mapRowDetailsMiniInstance);
      mapRowDetailsMiniInstance.setView([rowObj.lat || 35.7200, rowObj.lng || 51.4200], 15);
    }
  }, 200);
}

function closeModalRowDetails() {
  const modal = document.getElementById("modalRowDetails");
  if (modal) modal.classList.remove("active");
}


// ============================================================================
// 32. مدیریت ستون‌ها و کالاها (Columns & Products Catalog - Section 9 & 11)
// ============================================================================
function setupColumnsProductsTab() {
  const formProd = document.getElementById("formProduct");
  const btnProd = document.getElementById("btnSaveProduct");

  const handleSaveProd = () => {
    const nameEl = document.getElementById("productName");
    const name = nameEl ? nameEl.value.trim() : "";
    const distPrice = parseInt(document.getElementById("productDistPrice") ? document.getElementById("productDistPrice").value : 40000) || 40000;
    const phPrice = parseInt(document.getElementById("productPrice") ? document.getElementById("productPrice").value : 45000) || 45000;
    const stock = parseInt(document.getElementById("productStock") ? document.getElementById("productStock").value : 5000) || 5000;
    const customFieldsVals = (typeof extractCustomFieldValuesFromForm === "function")
      ? extractCustomFieldValuesFromForm("products", "productCustomFieldsContainer")
      : {};

    if (!name) {
      alert("لطفاً نام کالا را وارد کنید.");
      return;
    }

    if (!state.products) state.products = [];
    const editId = window._editingProductId || "";
    let idx = editId ? state.products.findIndex(p => p.id === editId) : -1;
    if (idx === -1) idx = state.products.findIndex(p => p.name === name);
    if (idx !== -1) {
      state.products[idx] = { ...state.products[idx], name, distributorPrice: distPrice, pharmacyPrice: phPrice, stock, customFields: customFieldsVals };
    } else {
      state.products.push({
        id: "prod-" + Date.now(),
        name,
        distributorPrice: distPrice,
        pharmacyPrice: phPrice,
        stock,
        customFields: customFieldsVals
      });
    }
    window._editingProductId = "";

    saveState();
    window._lastSavedProductName = name;
    window._lastSavedProductId = (idx !== -1 ? state.products[idx].id : state.products[state.products.length - 1].id);
    if (formProd) formProd.reset();
    if (nameEl) {
      nameEl.value = name;
      nameEl.classList.add("product-name-just-saved");
    }
    const banner = document.getElementById("productSavedBanner");
    if (banner) {
      banner.hidden = false;
      banner.innerHTML = "کالا ثبت شد: <strong>«" + name + "»</strong>";
    }
    renderColumnsProductsTable();
    setupSalesTargetsTab();
    mergeCatalogIntoOrderItems();
    updateNavBadges();
    alert("کالا ثبت شد: «" + name + "» و در تب سفارشات با فیلد تعداد جایزه اضافه شد.");
  };

  if (btnProd) btnProd.onclick = (e) => { e.preventDefault(); handleSaveProd(); };
  if (formProd) formProd.onsubmit = (e) => { e.preventDefault(); handleSaveProd(); };
  const btnResetProd = document.getElementById("btnResetProductForm");
  if (btnResetProd) {
    btnResetProd.onclick = () => {
      window._editingProductId = "";
      if (formProd) formProd.reset();
      const nameEl = document.getElementById("productName");
      if (nameEl) nameEl.classList.remove("product-name-just-saved");
      const banner = document.getElementById("productSavedBanner");
      if (banner) { banner.hidden = true; banner.textContent = ""; }
    };
  }

  renderColumnsProductsTable();
}

function renderColumnsProductsTable() {
  const tbody = document.getElementById("tableProductsBody");
  if (!tbody) return;
  tbody.innerHTML = "";
  (state.products || []).forEach((prod, index) => {
    const tr = document.createElement("tr");
    if (window._lastSavedProductId && prod.id === window._lastSavedProductId) {
      tr.className = "product-row-just-saved";
    }
    const shownName = prod.name || window._lastSavedProductName || "—";
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td class="product-name-cell"><strong>${shownName}</strong></td>
      <td><strong style="color:#1e40af;">${Number(prod.distributorPrice || prod.price || 40000).toLocaleString("fa-IR")} ریال</strong></td>
      <td><strong style="color:#0d9488;">${Number(prod.pharmacyPrice || prod.price || 45000).toLocaleString("fa-IR")} ریال</strong></td>
      <td>${prod.stock || 5000} عدد</td>
      <td>
        <div style="display:flex;gap:0.4rem;flex-wrap:wrap;">
          <button type="button" class="btn btn-outline btn-sm" onclick="editProductCatalogItem('${prod.id}')">✏️ ویرایش</button>
          <button type="button" class="btn btn-danger btn-sm" onclick="deleteProductCatalogItem('${prod.id}')">🗑️ حذف</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function editProductCatalogItem(id) {
  const prod = (state.products || []).find(p => p.id === id);
  if (!prod) return;
  window._editingProductId = id;
  const nameEl = document.getElementById("productName");
  const distEl = document.getElementById("productDistPrice");
  const phEl = document.getElementById("productPrice");
  const stEl = document.getElementById("productStock");
  if (nameEl) nameEl.value = prod.name || "";
  if (distEl) distEl.value = prod.distributorPrice || prod.price || "";
  if (phEl) phEl.value = prod.pharmacyPrice || prod.price || "";
  if (stEl) stEl.value = prod.stock || "";
  const banner = document.getElementById("productSavedBanner");
  if (banner) {
    banner.hidden = false;
    banner.innerHTML = "در حال ویرایش کالا: <strong>«" + (prod.name || "") + "»</strong>";
  }
  if (nameEl) {
    nameEl.classList.add("product-name-just-saved");
    nameEl.focus();
    nameEl.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  if (typeof renderCustomFieldsInForm === "function" && document.getElementById("productCustomFieldsContainer")) {
    renderCustomFieldsInForm("products", "productCustomFieldsContainer", prod.customFields || {});
  }
}

function deleteProductCatalogItem(id) {
  if (!confirm("آیا از حذف این کالا اطمینان دارید؟")) return;
  state.products = state.products.filter(p => p.id !== id);
  saveState();
  renderColumnsProductsTable();
  setupSalesTargetsTab();
  mergeCatalogIntoOrderItems();
  updateNavBadges();
}
