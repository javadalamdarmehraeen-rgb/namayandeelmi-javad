
// ============================================================================
//           (CRM / PWA)
//              
//             
// ============================================================================
const STORAGE_KEY = "CRM_APP_STATE_V2";
let state = null;
let autoBackupFileHandle = null;
let autoBackupIntervalId = null;
let isShowingAllPasswords = false;
//   (Leaflet Map Instances)
let mapDashboardOverview = null;
let mapPharmacyForm = null;
let mapDoctorForm = null;
let mapLiveReps = null;
let mapFullOverview = null;
//    
let markersDashboardOverview = [];
let markerPharmacyForm = null;
let markerDoctorForm = null;
let markersLiveReps = {};
let markersFullOverview = [];
//       (    )
const MENU_SECTIONS_LIST = [
  { id: "tab-dashboard", label: "", icon: "" },
  { id: "tab-pharmacies", label: "", icon: "", badgeId: "badgePharmaciesCount" },
  { id: "tab-doctors", label: "", icon: "", badgeId: "badgeDoctorsCount" },
  { id: "tab-orders", label: "", icon: "", badgeId: "badgeOrdersCount" },
  { id: "tab-activity-log", label: " ", icon: "" },
  { id: "tab-overview-map", label: " ", icon: "" },
  { id: "tab-live-location", label: " ", icon: "" },
  { id: "tab-search-info", label: " ", icon: "" },
  { id: "tab-rep-routes", label: " ", icon: "" },
  { id: "tab-rep-homes", label: " ", icon: "" },
  { id: "tab-leaves", label: "", icon: "", badgeId: "badgeLeavesCount" },
  { id: "tab-notifications", label: "", icon: "" },
  { id: "tab-monthly-reports", label: " ", icon: "" },
  { id: "tab-sales-targets", label: " ", icon: "" },
  { id: "tab-custom-fields", label: "", icon: "" },
  { id: "tab-columns-products", label: "  ", icon: "" },
  { id: "tab-users-permissions", label: "  ", icon: "", badgeId: "badgeUsersCount" },
  { id: "tab-messengers", label: "", icon: "" },
  { id: "tab-backup", label: "", icon: "" },
  { id: "tab-install-app", label: " ", icon: "" },
  { id: "tab-troubleshooting", label: "", icon: "" }
];
// ----------------------------------------------------------------------------
// 0.     (State Management & LocalStorage)
// ----------------------------------------------------------------------------
function loadState() {
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
    } catch (e) {
      console.error("       :", e);
      state = JSON.parse(JSON.stringify(DEFAULT_INITIAL_DATA));
    }
  } else {
    state = JSON.parse(JSON.stringify(DEFAULT_INITIAL_DATA));
  }
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
// 1.          
// ----------------------------------------------------------------------------
function setupNavigationMenu() {
  const horizontalContainer = document.getElementById("horizontalNavContainer");
  const sideContainer = document.getElementById("sideMenuItemsContainer");
  const launchpadGrid = document.getElementById("dashboardLaunchpadGrid");
  if (horizontalContainer) horizontalContainer.innerHTML = "";
  if (sideContainer) sideContainer.innerHTML = "";
  if (launchpadGrid) launchpadGrid.innerHTML = "";
  MENU_SECTIONS_LIST.forEach((sec, index) => {
    // 1.     (wrapping grid -      )
    if (horizontalContainer) {
      const btn = document.createElement("button");
      btn.className = "nav-item" + (index === 0 ? " active" : "");
      btn.setAttribute("data-target", sec.id);
      btn.innerHTML = `
        <span>${sec.icon} ${sec.label}</span>
        ${sec.badgeId ? `<span class="nav-badge" id="${sec.badgeId}">0</span>` : ""}
      `;
      btn.onclick = () => switchTab(sec.id);
      horizontalContainer.appendChild(btn);
    }
    // 2.     
    if (sideContainer) {
      const btnSide = document.createElement("button");
      btnSide.className = "side-menu-item" + (index === 0 ? " active" : "");
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
    // 3.      (  )
    if (launchpadGrid) {
      const card = document.createElement("button");
      card.className = "launchpad-card";
      card.onclick = () => switchTab(sec.id);
      card.innerHTML = `
        <div class="launchpad-icon">${sec.icon}</div>
        <div class="launchpad-text">
          <h4>${sec.label}</h4>
        </div>
      `;
      launchpadGrid.appendChild(card);
    }
  });
  //      
  const btnToggleSide = document.getElementById("btnToggleSideMenu");

  const btnCloseSide = document.getElementById("btnCloseSideMenu");
  const overlay = document.getElementById("sideMenuOverlay");
  if (btnToggleSide) btnToggleSide.addEventListener("click", openSideMenu);
  if (btnCloseSide) btnCloseSide.addEventListener("click", closeSideMenu);
  if (overlay) overlay.addEventListener("click", closeSideMenu);
  updateNavBadges();
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
  const navButtons = document.querySelectorAll(".nav-item");
  const sideButtons = document.querySelectorAll(".side-menu-item");
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
      if (targetId === "tab-pharmacies" && mapPharmacyForm) mapPharmacyForm.invalidateSize();
      if (targetId === "tab-doctors" && mapDoctorForm) mapDoctorForm.invalidateSize();
      if (targetId === "tab-live-location" && mapLiveReps) {
        mapLiveReps.invalidateSize();
        renderLiveLocationTab();
      }
      if (targetId === "tab-overview-map") {
        initFullOverviewMap();
        if (mapFullOverview) mapFullOverview.invalidateSize();
      }
    }, 150);
  }
}
function updateNavBadges() {
  const phBadge = document.getElementById("badgePharmaciesCount");
  const docBadge = document.getElementById("badgeDoctorsCount");
  const ordBadge = document.getElementById("badgeOrdersCount");
  const usersBadge = document.getElementById("badgeUsersCount");
  if (phBadge) phBadge.textContent = state.pharmacies.length;
  if (docBadge) docBadge.textContent = state.doctors.length;
  if (ordBadge) ordBadge.textContent = state.orders.length;
  if (usersBadge) usersBadge.textContent = state.users.length;
  document.getElementById("statPharmacies").textContent = state.pharmacies.length;
  document.getElementById("statDoctors").textContent = state.doctors.length;
  document.getElementById("statReps").textContent = state.reps.length;
  document.getElementById("statOrders").textContent = state.orders.length;
  document.getElementById("statUsers").textContent = state.users.length;
  document.getElementById("statLeaves").textContent = (state.leaves || []).length;
}
// ----------------------------------------------------------------------------
// 2.   :           
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
// 3.   :        (Requirement 4)
// ----------------------------------------------------------------------------
function populateProvinces(selectElement, selectedValue = "") {
  selectElement.innerHTML = `<option value=""> ...</option>`;
  Object.keys(IRAN_GEO_DATA).forEach(province => {
    const opt = document.createElement("option");
    opt.value = province;
    opt.textContent = province;
    if (province === selectedValue) opt.selected = true;
    selectElement.appendChild(opt);
  });
}
function populateCities(provinceName, selectElement, selectedValue = "") {
  selectElement.innerHTML = `<option value=""> ...</option>`;
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
  selectElement.innerHTML = `<option value=""> ...</option>`;
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
    distEl.innerHTML = `<option value="">    </option>`;
  });
  cityEl.addEventListener("change", () => {
    populateDistricts(provEl.value, cityEl.value, distEl);
  });
}
// ----------------------------------------------------------------------------
// 4.   :        (Requirement 5)
// ----------------------------------------------------------------------------
function createCustomMarker(lat, lng, type, name, mapInstance, onClickCallback = null) {
  let badgeClass = "marker-pharmacy-badge";
  let iconText = "";
  let tooltipPrefix = " ";
  if (type === "doctor") {
    badgeClass = "marker-doctor-badge";
    iconText = "";
    tooltipPrefix = " ";
  } else if (type === "rep") {
    badgeClass = "marker-rep-badge";
    iconText = "";
    tooltipPrefix = " ";
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
// 5.   (Dashboard Overview Map, Full Overview Map & Form Maps)
// ----------------------------------------------------------------------------
function initMaps() {
  if (document.getElementById("map-dashboard-overview")) {
    mapDashboardOverview = L.map("map-dashboard-overview").setView([35.7200, 51.4200], 11);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors"
    }).addTo(mapDashboardOverview);
    renderDashboardOverviewMap();
  }
  if (document.getElementById("map-pharmacy-form")) {
    mapPharmacyForm = L.map("map-pharmacy-form").setView([35.7605, 51.4180], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors"
    }).addTo(mapPharmacyForm);
    markerPharmacyForm = createCustomMarker(35.7605, 51.4180, "pharmacy", "  ", mapPharmacyForm);
    mapPharmacyForm.on("click", (e) => {
      updatePharmacyFormMarker(e.latlng.lat, e.latlng.lng, document.getElementById("pharmacyName").value || "بدون نام");
    });
  }
  if (document.getElementById("map-doctor-form")) {
    mapDoctorForm = L.map("map-doctor-form").setView([35.7580, 51.4400], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors"
    }).addTo(mapDoctorForm);
    markerDoctorForm = createCustomMarker(35.7580, 51.4400, "doctor", "  ", mapDoctorForm);
    mapDoctorForm.on("click", (e) => {
      updateDoctorFormMarker(e.latlng.lat, e.latlng.lng, document.getElementById("doctorName").value || " ");
    });
  }
  if (document.getElementById("map-live-reps")) {
    mapLiveReps = L.map("map-live-reps").setView([35.7300, 51.4200], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors"
    }).addTo(mapLiveReps);
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
        alert(` : ${ph.name}\n: ${ph.address}\n: ${ph.isPercentage ? "" : ""}`);
      });
      markersDashboardOverview.push(m);
      allPoints.push([ph.lat, ph.lng]);
    }
  });
  state.doctors.forEach(doc => {
    if (doc.lat && doc.lng) {
      const m = createCustomMarker(doc.lat, doc.lng, "doctor", doc.name, mapDashboardOverview, () => {
        alert(` : ${doc.name}\n: ${doc.specialty}\n: ${doc.address}`);
      });
      markersDashboardOverview.push(m);
      allPoints.push([doc.lat, doc.lng]);
    }
  });
  state.reps.forEach(rep => {
    if (rep.lat && rep.lng) {
      const m = createCustomMarker(rep.lat, rep.lng, "rep", rep.name, mapDashboardOverview, () => {
        alert(` : ${rep.name}\n: ${rep.status === "online" ? "" : "  "}`);
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
// 6.  :     +     (Matching Screenshot 3)
// ----------------------------------------------------------------------------
async function reverseGeocodeCoordinates(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
;
    const res = await fetch(url, { headers: { "Accept-Language": "fa,en" } });

    const data = await res.json();
    if (data && data.display_name) {
      const addr = data.address || {};
      const street = addr.road || addr.street || addr.neighbourhood || addr.suburb || " ";
      const city = addr.city || addr.town || addr.city_district || "";
      return `${city} ${street} (   : ${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)})`;
    }
  } catch (err) {
    console.warn("Reverse Geocode error:", err);
  }
  return `    (Lat: ${Number(lat).toFixed(4)}, Lng: ${Number(lng).toFixed(4)})`;
}
async function searchAddressOnMap(queryText, updateMarkerFunc) {
  if (!queryText || !queryText.trim()) return;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryText)}&limit=1`;
    const res = await fetch(url, { headers: { "Accept-Language": "fa,en" } });
    const data = await res.json();
    if (data && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);
      updateMarkerFunc(lat, lon, queryText, true);
      alert(`  «${queryText}»       .`);
    } else {
      alert("     .");
    }
  } catch (e) {
    alert("   .");
  }
}
function updatePharmacyFormMarker(lat, lng, nameText = " ", updateMapCenter = false) {
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
  btnCurrentLoc.addEventListener("click", () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const name = document.getElementById("pharmacyName").value || "  ";
          updatePharmacyFormMarker(lat, lng, name, true);
          alert(`    .\n   «   »  .`);
        },
        (err) => {
          const lat = 35.7595;
          const lng = 51.4250;
          updatePharmacyFormMarker(lat, lng, "  ", true);
          alert(`     .`);
        }
      );
    } else {
      alert("      .");
    }
  });
  btnGetAddr.addEventListener("click", async () => {
    const lat = parseFloat(document.getElementById("pharmacyLat").value);
    const lng = parseFloat(document.getElementById("pharmacyLng").value);

    const addrText = await reverseGeocodeCoordinates(lat, lng);
    document.getElementById("pharmacyAddress").value = addrText;
    document.getElementById("pharmacyLocationText").value = addrText;
    const name = document.getElementById("pharmacyName").value || " ";
    updatePharmacyFormMarker(lat, lng, name, true);
    alert(`                :\n\n${addrText}`);
  });
}
function updateDoctorFormMarker(lat, lng, nameText = " ", updateMapCenter = false) {
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
  btnCurrentLoc.addEventListener("click", () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          updateDoctorFormMarker(lat, lng, "  ", true);
          alert(`    .\n  «   »  .`);
        },
        (err) => {
          const lat = 35.7350;
          const lng = 51.4150;
          updateDoctorFormMarker(lat, lng, "  ", true);
          alert(`     .`);
        }
      );
    }
  });
  btnGetAddr.addEventListener("click", async () => {
    const lat = parseFloat(document.getElementById("doctorLat").value);
    const lng = parseFloat(document.getElementById("doctorLng").value);
    const addrText = await reverseGeocodeCoordinates(lat, lng);
    document.getElementById("doctorAddress").value = addrText;
    document.getElementById("doctorLocationText").value = addrText;
    const name = document.getElementById("doctorName").value || "  ";
    updateDoctorFormMarker(lat, lng, name, true);
    alert(`                :\n\n${addrText}`);
  });
}
// ----------------------------------------------------------------------------
// 7.  :    (Custom Fields Engine)
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
    formCF.addEventListener("submit", () => {
      const target = document.getElementById("cfTargetEntity").value;
      const label = document.getElementById("cfLabel").value.trim();
      const type = document.getElementById("cfType").value;
      const optionsStr = document.getElementById("cfOptions").value.trim();
      const allowAddOption = document.getElementById("cfAllowAddOption").checked;
      const showInForm = document.getElementById("cfShowInForm").checked;
      const showInList = document.getElementById("cfShowInList").checked;
      if (!label) {
        alert("     .");
        return;
      }
      let options = [];
      if (type === "select" && optionsStr) {
        options = optionsStr.split(/[,]/).map(o => o.trim()).filter(Boolean);
      }
      if (type === "select" && options.length === 0) {
        options = [" ", " "];
      }
      const newField = {
        id: "cf-" + target + "-" + Date.now(),
        label: label,
        type: type,
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
      alert(`   «${label}»    .`);
    });
  }
  renderCustomFieldsTable();
}
function renderCustomFieldsTable() {
  const tbody = document.getElementById("tableCustomFieldsBody");
  if (!tbody) return;
  tbody.innerHTML = "";
  const entityLabels = { pharmacy: "", doctor: "", order: "" };
  Object.keys(state.customFields).forEach(entity => {
    const fields = state.customFields[entity] || [];
    fields.forEach(f => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><span class="status-badge" style="background: #eff6ff; color: #1e40af;">${entityLabels[entity] || entity}</s
pan></td>
        <td><strong>${f.label}</strong></td>
        <td>${f.type === "select" ? "" : ""}</td>
        <td>${f.type === "select" && f.options ? f.options.join(" ") : "-"}</td>
        <td>${f.showInForm ? " " : " "}</td>
        <td>${f.showInList ? " " : " "}</td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="deleteCustomField('${entity}', '${f.id}')"></button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  });
}
function deleteCustomField(entity, fieldId) {
  if (!confirm("       ")) return;
  state.customFields[entity] = state.customFields[entity].filter(f => f.id !== fieldId);
  saveState();
  renderCustomFieldsTable();
  renderAllCustomFieldsInFormsAndTables();
}

function renderCustomFieldsInForm(entityType, containerId, currentValues = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";
  const fields = state.customFields[entityType] || [];
  fields.forEach(field => {
    if (!field.showInForm) return;
    const div = document.createElement("div");
    div.className = "form-group";
    const labelRow = document.createElement("div");
    labelRow.style.display = "flex";
    labelRow.style.alignItems = "center";
    labelRow.style.justifyContent = "space-between";
    const labelEl = document.createElement("label");
    labelEl.className = "form-label";
    labelEl.textContent = field.label;
    labelRow.appendChild(labelEl);
    if (field.type === "select" && field.allowAddOption) {
      const btnAddOpt = document.createElement("button");
      btnAddOpt.type = "button";
      btnAddOpt.className = "btn-add-option";
      btnAddOpt.innerHTML = "   ";
      btnAddOpt.onclick = () => openModalAddOption(entityType, field.id, field.label);
      labelRow.appendChild(btnAddOpt);
    }
    div.appendChild(labelRow);
    if (field.type === "select") {
      const sel = document.createElement("select");
      sel.className = "form-select dropdown-auto-clear";
      sel.dataset.customFieldId = field.id;
      sel.innerHTML = `<option value=""> ...</option>`;
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
      input.type = "text";
      input.className = "form-input";
      input.dataset.customFieldId = field.id;
      input.placeholder = ` : ${field.label}...`;
      if (currentValues[field.label]) input.value = currentValues[field.label];
      div.appendChild(input);
    }
    container.appendChild(div);
  });
  setupDropdownAutoClear();
}
function extractCustomFieldValuesFromForm(entityType, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return {};
  const values = {};
  const fields = state.customFields[entityType] || [];
  fields.forEach(field => {
    const el = container.querySelector(`[data-custom-field-id="${field.id}"]`);
    if (el) values[field.label] = el.value.trim();
  });
  return values;
}
function openModalAddOption(entityType, fieldId, fieldLabel) {
  document.getElementById("modalAddOptionEntityType").value = entityType;
  document.getElementById("modalAddOptionFieldId").value = fieldId;
  document.getElementById("modalAddOptionLabel").textContent = `     «${fieldLabel}»:`;
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
      alert("      .");
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
      alert(`   «${newVal}»    .`);
    }
  });
}
function renderAllCustomFieldsInFormsAndTables() {
  renderCustomFieldsInForm("pharmacy", "pharmacyCustomFieldsContainer");
  renderCustomFieldsInForm("doctor", "doctorCustomFieldsContainer");
  renderCustomFieldsInForm("order", "orderCustomFieldsContainer");
  renderPharmaciesList();
  renderDoctorsList();
  renderOrdersList();
}
// ----------------------------------------------------------------------------
// 8.   (Pharmacies CRUD + Percentage Toggle + File upload)
//    (Matching Screenshots 2 & 3)
// ----------------------------------------------------------------------------
function setupPharmacyTab() {
  setupCascadingGeoSelectors("pharmacyProvince", "pharmacyCity", "pharmacyDistrict");
  setupPharmacyLocationButtons();
  //     ( / )    (Screenshot 3)
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
  //     (Screenshot 3)
  const fileInput = document.getElementById("phFileInput");
  const fileDisplay = document.getElementById("phFileDisplay");
  if (fileInput && fileDisplay) {
    fileInput.addEventListener("change", () => {
      if (fileInput.files && fileInput.files[0]) {

        fileDisplay.textContent = `   : ${fileInput.files[0].name}`;
      } else {
        fileDisplay.textContent = "   ";
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
      const dateAdded = document.getElementById("pharmacyDate").value.trim() || new Date().toLocaleDateString("fa-IR");
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
      if (!name || !province || !city || !district || !address) {
        alert("    (*)     .");
        return;
      }
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
        alert(`  «${name}»      .`);
      } else {
        const newPharmacy = {
          id: "ph-" + Date.now(),
          dateAdded, name, phone, manager, province, city, district, address, lat, lng,
          isPercentage, fileName,
          repName: " ",
          customFields: customFieldsVals
        };
        state.pharmacies.push(newPharmacy);
        alert(`  «${name}»    .`);
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
  document.getElementById("pharmacyDate").value = new Date().toLocaleDateString("fa-IR");
  document.getElementById("pharmacyName").value = "";
  document.getElementById("pharmacyPhone").value = "";
  document.getElementById("pharmacyManager").value = "";
  document.getElementById("pharmacyAddress").value = "";
  document.getElementById("pharmacyLocationText").value = "";
  document.getElementById("pharmacyIsPercentage").value = "false";
  document.getElementById("btnPhPercentageNo").classList.add("active");
  document.getElementById("btnPhPercentageYes").classList.remove("active");

  document.getElementById("phFileDisplay").textContent = "   ";
  const provEl = document.getElementById("pharmacyProvince");
  const cityEl = document.getElementById("pharmacyCity");
  const distEl = document.getElementById("pharmacyDistrict");
  provEl.value = "";
  cityEl.innerHTML = `<option value="">    </option>`;
  distEl.innerHTML = `<option value="">    </option>`;
  updatePharmacyFormMarker(35.7605, 51.4180, "  ", true);
  renderCustomFieldsInForm("pharmacy", "pharmacyCustomFieldsContainer");
}
function renderPharmaciesList(searchQuery = "") {
  const theadTr = document.getElementById("tablePharmaciesHeader");
  const tbody = document.getElementById("tablePharmaciesBody");
  if (!theadTr || !tbody) return;
  theadTr.innerHTML = `
    <th></th>
    <th> </th>
    <th> </th>
    <th></th>
    <th></th>
    <th> </th>
    <th> </th>
    <th></th>
    <th></th>
    <th></th>
  `;
  const fieldsList = (state.customFields.pharmacy || []).filter(f => f.showInList);
  fieldsList.forEach(f => {
    const th = document.createElement("th");
    th.textContent = f.label;
    theadTr.appendChild(th);
  });
  const thAction = document.createElement("th");
  thAction.textContent = "";
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
      <td><strong style="color:#0f172a;">${ph.repName || " "}</strong></td>
      <td>${ph.dateAdded || "-"}</td>
      <td>${ph.province}</td>
      <td>${ph.city}</td>
      <td><strong style="color: #0d9488;">${ph.name}</strong></td>
      <td><span style="direction: ltr; display: inline-block;">${ph.phone || "-"}</span></td>
      <td>${ph.isPercentage ? '<span class="badge-status-online"></span>' : '<span></span>'}</td>
      <td>${ph.fileName ? `<span style="color:#0d9488;"> ${ph.fileName}</span>` : '-'}</td>
    `;
    fieldsList.forEach(f => {
      const val = (ph.customFields && ph.customFields[f.label]) ? ph.customFields[f.label] : "-";
      rowHTML += `<td><strong>${val}</strong></td>`;
    });
    rowHTML += `
      <td>
        <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
          <button class="btn btn-outline btn-sm" onclick="editPharmacy('${ph.id}')"> </button>
          <button class="btn btn-danger btn-sm" onclick="deletePharmacy('${ph.id}')"> </button>
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
  if (!confirm("      ")) return;
  state.pharmacies = state.pharmacies.filter(p => p.id !== id);
  saveState();
  renderPharmaciesList();
  renderDashboardOverviewMap();
  updateNavBadges();
  populatePharmacyDatalistInOrders();
}
// ----------------------------------------------------------------------------
// 9.     (Doctors CRUD + Percentage Toggle + File upload)
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
        fileDisplay.textContent = `   : ${fileInput.files[0].name}`;
      } else {
        fileDisplay.textContent = "   ";
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
      const dateAdded = document.getElementById("doctorDate").value.trim() || new Date().toLocaleDateString("fa-IR");
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
      if (!name || !specialty || !province || !city || !district || !address) {
        alert("    (*)  /   .");
        return;
      }
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
        alert(` / «${name}»      .`);
      } else {
        const newDoc = {
          id: "doc-" + Date.now(),
          dateAdded, name, specialty, phone, province, city, district, address, lat, lng,
          isPercentage, fileName,
          repName: " ",
          customFields: customFieldsVals
        };
        state.doctors.push(newDoc);
        alert(` / «${name}»    .`);
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
  document.getElementById("doctorDate").value = new Date().toLocaleDateString("fa-IR");
  document.getElementById("doctorName").value = "";
  document.getElementById("doctorSpecialty").value = "";
  document.getElementById("doctorPhone").value = "";
  document.getElementById("doctorAddress").value = "";
  document.getElementById("doctorLocationText").value = "";
  document.getElementById("doctorIsPercentage").value = "false";
  document.getElementById("btnDocPercentageNo").classList.add("active");
  document.getElementById("btnDocPercentageYes").classList.remove("active");
  document.getElementById("docFileDisplay").textContent = "   ";
  const provEl = document.getElementById("doctorProvince");
  const cityEl = document.getElementById("doctorCity");
  const distEl = document.getElementById("doctorDistrict");

  provEl.value = "";
  cityEl.innerHTML = `<option value="">    </option>`;
  distEl.innerHTML = `<option value="">    </option>`;
  updateDoctorFormMarker(35.7580, 51.4400, "  ", true);
  renderCustomFieldsInForm("doctor", "doctorCustomFieldsContainer");
}
function renderDoctorsList(searchQuery = "") {
  const theadTr = document.getElementById("tableDoctorsHeader");
  const tbody = document.getElementById("tableDoctorsBody");
  if (!theadTr || !tbody) return;
  theadTr.innerHTML = `
    <th></th>
    <th> </th>
    <th> </th>
    <th> /  / </th>
    <th>  / </th>
    <th></th>
    <th></th>
    <th></th>
    <th></th>
  `;
  const fieldsList = (state.customFields.doctor || []).filter(f => f.showInList);
  fieldsList.forEach(f => {
    const th = document.createElement("th");
    th.textContent = f.label;
    theadTr.appendChild(th);
  });
  const thAction = document.createElement("th");
  thAction.textContent = "";
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
      <td><strong style="color:#0f172a;">${doc.repName || " "}</strong></td>
      <td>${doc.dateAdded || "-"}</td>
      <td>${doc.province} / ${doc.city}</td>
      <td><strong style="color: #0d9488;">${doc.name}</strong></td>
      <td><span class="status-badge" style="background: #f0fdf4; color: #15803d;">${doc.specialty}</span></td>
      <td>${doc.isPercentage ? '<span class="badge-status-online"></span>' : '<span></span>'}</td>
      <td>${doc.fileName ? `<span style="color:#0d9488;"> ${doc.fileName}</span>` : '-'}</td>
    `;
    fieldsList.forEach(f => {
      const val = (doc.customFields && doc.customFields[f.label]) ? doc.customFields[f.label] : "-";
      rowHTML += `<td><strong>${val}</strong></td>`;
    });
    rowHTML += `
      <td>
        <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
          <button class="btn btn-outline btn-sm" onclick="editDoctor('${doc.id}')"> </button>
          <button class="btn btn-danger btn-sm" onclick="deleteDoctor('${doc.id}')"> </button>
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
  if (!confirm("    /  ")) return;
  state.doctors = state.doctors.filter(d => d.id !== id);
  saveState();
  renderDoctorsList();
  renderDashboardOverviewMap();
  updateNavBadges();
}
// ----------------------------------------------------------------------------
// 10.        (Matching Screenshots 4,5,6,7)
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
      btnTogglePasswords.innerHTML = isShowingAllPasswords ? "  " : "   ";
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
        alert("         .");
        return;
      }
      //    
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
        phoneLock: " -      ",
        lastLogin: new Date().toLocaleDateString("fa-IR") + " - " + new Date().toLocaleTimeString("fa-IR"),
        permissions: permsObj
      };
      state.users.push(newUser);
      saveState();
      formCreate.reset();
      renderUserCardsList();
      updateNavBadges();
      alert(`   «${fullName}»    .`);
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
      tag.innerHTML = `<span> ${item.label}</span>`;
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
  if (badge) badge.textContent = `${count} `;
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
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; margin-bottom: 0.
75rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem;">
        <div>
          <span style="font-weight: 800; font-size: 1.05rem; color: #0f172a;">${index + 1}. ${user.fullName}</span>
          <span class="status-badge" style="background:#eff6ff;color:#1e40af;margin-right:0.5rem;">${user.role}</span>
        </div>
        <div style="font-size: 0.78rem; color: #64748b;"> : ${user.lastLogin || "-"}</div>
      </div>
      <div class="form-grid" style="margin-bottom: 1rem;">
        <div>
          <span style="font-size: 0.8rem; color: #64748b;"> :</span>
          <strong style="direction: ltr; display: block; color: #0d9488;">${user.username}</strong>
        </div>
        <div>
          <span style="font-size: 0.8rem; color: #64748b;"> :</span>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <strong style="direction: ltr; display: block;">${passDisplay}</strong>
            <button class="btn btn-outline btn-sm" onclick="copyPasswordText('${user.password}')" title=" "></bu
tton>
          </div>
        </div>
        <div>
          <span style="font-size: 0.8rem; color: #64748b;"> :</span>
          <span style="direction: ltr; display: block;">${user.phone || "-"}</span>
        </div>
        <div>
          <span style="font-size: 0.8rem; color: #64748b;"> :</span>
          <span style="display: block; font-weight: 700;">${user.simControl}</span>
        </div>
      </div>
      <div style="background: #f8fafc; padding: 0.6rem 1rem; border-radius: 8px; font-size: 0.82rem; color: #475569; dis
play: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
        <span>   : <strong>${user.phoneLock}</strong></span>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-outline btn-sm" onclick="editUserCard('${user.id}')">   </button>
          <button class="btn btn-danger btn-sm" onclick="deleteUserCard('${user.id}')"> </button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}
function copyPasswordText(pwd) {
  navigator.clipboard.writeText(pwd).then(() => {
    alert(`   «${pwd}»    .`);
  });
}
function editUserCard(id) {
  const u = state.users.find(x => x.id === id);
  if (!u) return;
  alert(`    «${u.fullName}»      .`);
  document.getElementById("newFullName").value = u.fullName;
  document.getElementById("newUsername").value = u.username;
  document.getElementById("newPassword").value = u.password;
  document.getElementById("newPhone").value = u.phone || "";
  document.getElementById("newRole").value = u.role;
  document.getElementById("newSimControl").value = u.simControl;
  document.getElementById("tab-users-permissions").scrollIntoView({ behavior: "smooth" });
}
function deleteUserCard(id) {
  if (!confirm("      ")) return;
  state.users = state.users.filter(u => u.id !== id);
  saveState();
  renderUserCardsList();
  updateNavBadges();

}
// ----------------------------------------------------------------------------
// 11.    (        )
// ----------------------------------------------------------------------------
function setupOtherSidebarModules() {
  // 1.   (Menu Item 5)
  const btnRefAct = document.getElementById("btnRefreshActivity");
  if (btnRefAct) btnRefAct.addEventListener("click", () => renderActivityLogTable());
  renderActivityLogTable();
  // 2.   (Menu Item 8)
  renderRepRoutesTable();
  // 3.   (Menu Item 9)
  renderRepHomesTable();
  // 4.  (Menu Item 10)
  const btnExportL = document.getElementById("btnExportLeavesCSV");
  if (btnExportL) {
    btnExportL.addEventListener("click", () => {
      const hdrs = ["", " ", " ", " ", ""];
      const rws = state.leaves.map(l => [l.repName, l.fromDate, l.toDate, l.reason, l.status]);
      downloadCSVFile("leaves-export.csv", hdrs, rws);
    });
  }
  renderLeavesTable();
  // 5.  (Menu Item 11)
  renderNotificationsTable();
  // 6.   (Menu Item 12)
  const btnExportM = document.getElementById("btnExportMonthlyCSV");
  if (btnExportM) {
    btnExportM.addEventListener("click", () => {
      const hdrs = [" ", "", "", "  ()"];
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
  // 7.   (Menu Item 13)
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
      <td><span class="badge-status-online"> </span></td>
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
        <button class="btn btn-outline btn-sm" onclick="alert('       .')"> </butto
n>
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
    repSel.innerHTML = `<option value=""> ...</option>`;
    state.reps.forEach(r => {
      repSel.innerHTML += `<option value="${r.name}">${r.name}</option>`;
    });
  }
  if (typeSel && hoursGrp) {
    typeSel.addEventListener("change", () => {
      hoursGrp.style.display = typeSel.value.includes("") ? "block" : "none";
    });
  }
  if (formLeave) {
    formLeave.addEventListener("submit", () => {
      const repName = repSel.value;
      const leaveType = typeSel.value;
      const fromDate = document.getElementById("leaveFromDate").value.trim();
      const toDate = document.getElementById("leaveToDate").value.trim();
      const hours = document.getElementById("leaveHoursInput") ? document.getElementById("leaveHoursInput").value.trim()
 : "";
      const reason = document.getElementById("leaveReasonInput").value.trim();
      if (!repName || !fromDate || !toDate || !reason) {
        alert("          .");
        return;
      }
      const newLeave = {
        id: "lv-" + Date.now(),
        repName,
        fromDate,
        toDate,
        reason: `${leaveType}${hours ? ` (${hours})` : ""} - ${reason}`,
        supervisorStatus: " ",
        adminStatus: " ",
        status: "  "
      };
      if (!state.leaves) state.leaves = [];
      state.leaves.push(newLeave);
      saveState();
      formLeave.reset();
      renderLeavesTable();
      updateNavBadges();
      alert(`    «${repName}»         .`);
    });
  }
}
function renderLeavesTable() {
  const tbody = document.getElementById("tableLeavesBody");
  if (!tbody) return;
  tbody.innerHTML = "";
  (state.leaves || []).forEach(lv => {
    const tr = document.createElement("tr");
    const supBadge = lv.supervisorStatus === " "
      ? `<span class="badge-status-online" style="background:#10b981;">  </span>`
      : `<button class="btn btn-outline btn-sm" onclick="approveLeaveSupervisor('${lv.id}')">  </button>`;
    const admBadge = lv.adminStatus === " "
      ? `<span class="badge-status-online" style="background:#0d9488;">  </span>`

      : `<button class="btn btn-primary btn-sm" style="background:#0d9488;" onclick="approveLeaveAdmin('${lv.id}')"> 
  </button>`;
    tr.innerHTML = `
      <td><strong style="color:#0f172a;">${lv.repName}</strong></td>
      <td>${lv.reason}</td>
      <td>${lv.fromDate}</td>
      <td>${lv.toDate}</td>
      <td>${lv.reason}</td>
      <td>${supBadge}</td>
      <td>${admBadge}</td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="deleteLeave('${lv.id}')"> </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}
function approveLeaveSupervisor(id) {
  const lv = (state.leaves || []).find(x => x.id === id);
  if (!lv) return;
  lv.supervisorStatus = " ";
  saveState();
  renderLeavesTable();
  alert(`      «${lv.repName}»  .`);
}
function approveLeaveAdmin(id) {
  const lv = (state.leaves || []).find(x => x.id === id);
  if (!lv) return;
  lv.adminStatus = " ";
  lv.status = "  ";
  saveState();
  renderLeavesTable();
  //      
  const notif = {
    id: "not-" + Date.now(),
    date: new Date().toLocaleDateString("fa-IR"),
    title: ` : ${lv.repName}`,
    message: `     ${lv.fromDate}  ${lv.toDate}      .`,
    sender: " ",
    recipient: lv.repName,
    isRead: false
  };
  if (!state.notifications) state.notifications = [];
  state.notifications.unshift(notif);
  saveState();
  playNotificationBeep();
  alert(`          «${lv.repName}»  .`);
}
function deleteLeave(id) {
  if (!confirm("       ")) return;
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
        alert("       .");
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
      alert(`    «${recipient}»           .`);
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
      ? `<span style="color:#64748b;font-size:0.8rem;"></span>`
      : `<button class="btn btn-outline btn-sm" onclick="markNotificationRead('${nt.id}')"> </button>`;
    tr.innerHTML = `
      <td>${nt.date}</td>
      <td><strong style="color:#0d9488;">${nt.title}</strong></td>
      <td>${nt.message}</td>
      <td>${nt.sender} → ${nt.recipient || ""}</td>
      <td>${readBadge}</td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="deleteNotification('${nt.id}')"></button>
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
  if (!confirm("      ")) return;
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
      <td><strong>${vCount}</strong> </td>
      <td><strong>${oCount}</strong> </td>
      <td><strong style="color:#0d9488;">${sum.toLocaleString("fa-IR")}</strong></td>
      <td><span class="badge-status-online"></span></td>
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

      <td>${tgt.month}</td>
      <td>${tgt.targetAmount.toLocaleString("fa-IR")}</td>
      <td><strong style="color:#0d9488;">${tgt.achievedAmount.toLocaleString("fa-IR")}</strong></td>
      <td><span class="badge-status-online">${perc}</span></td>
    `;
    tbody.appendChild(tr);
  });
}
// ----------------------------------------------------------------------------
// 12.   (Orders + Requirement 3: Sticky Top Alert Banner)
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
      alertText.textContent = ` «${matched.name}» | : ${matched.city} | : ${matched.district} | : ${
matched.address}`;
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
      alert(`      «${matched.name}»        .`);
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
      const orderDate = document.getElementById("orderDate").value.trim() || new Date().toLocaleDateString("fa-IR");
      const status = document.getElementById("orderStatus").value;
      const notes = document.getElementById("orderNotes").value.trim();
      const customFieldsVals = extractCustomFieldValuesFromForm("order", "orderCustomFieldsContainer");
      if (!pharmacyName || !province || !city || !district) {
        alert("         .");
        return;
      }
      const items = getOrderItemsFromUI();
      if (items.length === 0 || !items[0].name) {
        alert("        .");
        return;
      }
      const totalAmount = items.reduce((sum, item) => sum + (item.count * item.price), 0);
      if (editId) {
        const idx = state.orders.findIndex(o => o.id === editId);
        if (idx !== -1) {
          state.orders[idx] = {
            ...state.orders[idx],
            pharmacyName, province, city, district, address,
            repName, orderDate, status, notes, items, totalAmount,
            customFields: customFieldsVals
          };
        }
        alert(`   «${pharmacyName}»    .`);
      } else {
        const newOrder = {
          id: "ord-" + Date.now(),
          pharmacyName, province, city, district, address,
          repName, orderDate, status, notes, items, totalAmount,
          customFields: customFieldsVals
        };
        state.orders.push(newOrder);
        alert(`    «${pharmacyName}»  .`);
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
  document.getElementById("orderDate").value = new Date().toLocaleDateString("fa-IR");
  document.getElementById("orderNotes").value = "";
  document.getElementById("existingPharmacyTopAlert").style.display = "none";
  const provEl = document.getElementById("orderProvince");
  const cityEl = document.getElementById("orderCity");
  const distEl = document.getElementById("orderDistrict");
  provEl.value = "";
  cityEl.innerHTML = `<option value="">    </option>`;
  distEl.innerHTML = `<option value="">    </option>`;
  const container = document.getElementById("orderItemsContainer");
  if (container) {
    container.innerHTML = "";
    addOrderItemRow("", 10, 45000);
  }
  renderCustomFieldsInForm("order", "orderCustomFieldsContainer");
  updateOrderTotalAmountDisplay();
}
function populateRepSelectorInOrders() {
  const sel = document.getElementById("orderRepName");

  if (!sel) return;
  sel.innerHTML = `<option value="">  ...</option>`;
  state.reps.forEach(r => {
    const opt = document.createElement("option");
    opt.value = r.name;
    opt.textContent = `${r.name} (${r.region || " "})`;
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
function addOrderItemRow(name = "", count = 1, price = 0) {
  const container = document.getElementById("orderItemsContainer");
  if (!container) return;
  const rowId = "item-row-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
  const row = document.createElement("div");
  row.id = rowId;
  row.style.display = "grid";
  row.style.gridTemplateColumns = "3fr 1fr 2fr auto";
  row.style.gap = "0.5rem";
  row.style.alignItems = "center";
  row.innerHTML = `
    <input type="text" class="form-input order-item-name" placeholder="  (: )..." value="${name}" requir
ed />
    <input type="number" class="form-input order-item-count" placeholder=" " min="1" value="${count}" required 
/>
    <input type="number" class="form-input order-item-gift" placeholder="  " min="0" value="0" />
    <input type="number" class="form-input order-item-price" placeholder="  ()" min="0" value="${price}" req
uired />
    <button type="button" class="btn btn-danger btn-sm" onclick="removeOrderItemRow('${rowId}')"></button>
  `;
  const inputs = row.querySelectorAll("input");
  inputs.forEach(inp => {
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
      items.push({
        name: nameEl.value.trim(),
        count: parseInt(countEl.value) || 1,
        price: parseInt(priceEl.value) || 0
      });
    }
  }
  return items;
}
function updateOrderTotalAmountDisplay() {
  const items = getOrderItemsFromUI();
  const total = items.reduce((sum, item) => sum + (item.count * item.price), 0);

  const disp = document.getElementById("orderTotalAmountDisplay");
  if (disp) {
    disp.textContent = total.toLocaleString("fa-IR");
  }
}
function renderOrdersList(searchQuery = "") {
  const theadTr = document.getElementById("tableOrdersHeader");
  const tbody = document.getElementById("tableOrdersBody");
  if (!theadTr || !tbody) return;
  theadTr.innerHTML = `
    <th></th>
    <th> </th>
    <th> /  / </th>
    <th> </th>
    <th> </th>
    <th> </th>
    <th>  ()</th>
    <th></th>
  `;
  const fieldsList = (state.customFields.order || []).filter(f => f.showInList);
  fieldsList.forEach(f => {
    const th = document.createElement("th");
    th.textContent = f.label;
    theadTr.appendChild(th);
  });
  const thAction = document.createElement("th");
  thAction.textContent = "";
  theadTr.appendChild(thAction);
  tbody.innerHTML = "";
  const filtered = state.orders.filter(ord => {
    if (!searchQuery) return true;
    return ord.pharmacyName.includes(searchQuery) || (ord.repName && ord.repName.includes(searchQuery));
  });
  filtered.forEach((ord, index) => {
    const tr = document.createElement("tr");
    const statusBadge = ord.status === " "
      ? `<span class="status-badge status-online"> ${ord.status}</span>`
      : ord.status === "  "
      ? `<span class="status-badge status-visiting"> ${ord.status}</span>`
      : `<span class="status-badge" style="background:#f1f5f9;color:#475569;">${ord.status}</span>`;
    let rowHTML = `
      <td>${index + 1}</td>
      <td><strong style="color: #0d9488;">${ord.pharmacyName}</strong></td>
      <td>${ord.province} / ${ord.city} / ${ord.district}</td>
      <td>${ord.repName || "-"}</td>
      <td>${ord.orderDate || "-"}</td>
      <td>${ord.items ? ord.items.length : 0} </td>
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
          <button class="btn btn-outline btn-sm" onclick="editOrder('${ord.id}')"> </button>
          <button class="btn btn-danger btn-sm" onclick="deleteOrder('${ord.id}')"> </button>
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
  document.getElementById("orderStatus").value = ord.status || " ";
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
    addOrderItemRow(item.name, item.count, item.price);
  });
  updateOrderTotalAmountDisplay();
  renderCustomFieldsInForm("order", "orderCustomFieldsContainer", ord.customFields || {});
  document.getElementById("tab-orders").scrollIntoView({ behavior: "smooth" });
}
function deleteOrder(id) {
  if (!confirm("      ")) return;
  state.orders = state.orders.filter(o => o.id !== id);
  saveState();
  renderOrdersList();
  updateNavBadges();
}
// ----------------------------------------------------------------------------
// 13.   :       
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
          document.getElementById("autoBackupHandleStatus").textContent = "فایل انتخاب شد: crm-backup-latest.json";
          await performAutoBackup();
          alert("پشتیبان خودکار در فایل انتخابی ذخیره می‌شود.");
        } catch (err) {
          console.warn(" :", err);
        }
      } else {
        alert("مرورگر از File System Access API پشتیبانی نمی‌کند.");
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
      if (confirm("           ")) {
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
      console.log("    crm-backup-latest.json  .");
    } catch (err) {
      console.warn("     :", err);
    }
  }
}
function updateAutoBackupStatusBadge() {
  const badge = document.getElementById("autoBackupStatusBadge");
  if (!badge) return;
  if (state.settings && state.settings.autoBackupEnabled) {
    badge.style.background = "rgba(16, 185, 129, 0.25)";
    badge.innerHTML = "<span>  : </span>";
  } else {
    badge.style.background = "rgba(245, 158, 11, 0.25)";
    badge.innerHTML = "<span>  : </span>";
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
      alert("      .json  .");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!parsed.pharmacies || !parsed.doctors || !parsed.orders) {
          alert("          .");
          return;
        }
        tempRestoreData = parsed;
        document.getElementById("resCountPharmacies").textContent = parsed.pharmacies.length;
        document.getElementById("resCountDoctors").textContent = parsed.doctors.length;
        document.getElementById("resCountUsers").textContent = (parsed.users || []).length;
        document.getElementById("resCountOrders").textContent = parsed.orders.length;
        document.getElementById("resCountFields").textContent = Object.keys(parsed.customFields || {}).reduce((s, k) => 
s + (parsed.customFields[k].length || 0), 0);
        previewCard.style.display = "block";
        previewCard.scrollIntoView({ behavior: "smooth" });
      } catch (err) {
        alert("     JSON: " + err.message);
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
      alert("       !");
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
// 14.       (Auth & Role Switching)
// ----------------------------------------------------------------------------
let currentRoleIndex = 0;
let currentUserName = " ";
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
      if (confirm("      ")) {
        currentRoleIndex = 0;
        currentUserName = " ";
        applyUserRolePermissions();
        openModalLogin();
        alert("       .");
      }
    });
  }
  if (formLogin) {
    formLogin.addEventListener("submit", () => {
      const roleIdx = parseInt(document.getElementById("loginRoleSelect").value);
      const selOpt = document.getElementById("loginRoleSelect").options[roleIdx];
      const simMode = document.getElementById("loginSimAuthMode") ? document.getElementById("loginSimAuthMode").value : 
"3";
      currentRoleIndex = roleIdx;
      currentUserName = selOpt ? selOpt.textContent : " ";
      if (simMode === "1") {
        const otp = prompt("    (OTP)  .       :", "123456");
        if (!otp) return;
      } else if (simMode === "2") {
        alert("         .     .");
      }
      applyUserRolePermissions();
      closeModalLogin();
      alert(`  !    .`);
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
    roleLabel.textContent = ` ... ${currentUserName}`;
  }
}
// ----------------------------------------------------------------------------
// 15.         (Screenshot 8)
// ----------------------------------------------------------------------------
function testServerConnectivity() {
  const box = document.getElementById("diagnosticsStatusBox");
  if (box) {
    box.style.background = "#fef9c3";
    box.style.color = "#854d0e";
    box.textContent = "       Render.com  Neon...";
  }
  setTimeout(() => {
    if (box) {
      box.style.background = "#f0fdf4";
      box.style.color = "#166534";
      box.textContent = "     namayandeelmi-javad.onrender.com  ndcohub.ir  .";
    }
    alert("           .");
  }, 700);
}
function retryServerConnection() {
  const banner = document.getElementById("diagnosticOfflineBanner");
  alert("         ...");

  if (banner) banner.style.display = "none";
}
// ----------------------------------------------------------------------------
// 16.   (CSV Export)
// ----------------------------------------------------------------------------
function setupCSVExportButtons() {
  const btnPh = document.getElementById("btnExportPharmaciesCSV");
  const btnDoc = document.getElementById("btnExportDoctorsCSV");
  const btnOrd = document.getElementById("btnExportOrdersCSV");
  const btnUsers = document.getElementById("btnExportUsersCSV");
  if (btnPh) {
    btnPh.addEventListener("click", () => {
      const hdrs = [" ", "", "", "", "", "", ""];
      const rws = state.pharmacies.map(p => [p.name, p.phone || "", p.province, p.city, p.district, p.address, p.isPercentage ? "" : ""]);
      downloadCSVFile("pharmacies-export.csv", hdrs, rws);
    });
  }
  if (btnDoc) {
    btnDoc.addEventListener("click", () => {
      const hdrs = [" /", "", "", "", "", "", "", ""];
      const rws = state.doctors.map(d => [d.name, d.specialty, d.phone || "", d.province, d.city, d.district, d.address,
 d.isPercentage ? "" : ""]);
      downloadCSVFile("doctors-export.csv", hdrs, rws);
    });
  }
  if (btnOrd) {
    btnOrd.addEventListener("click", () => {
      const hdrs = [" ", "", "", "", "", "", "  ()", ""];
      const rws = state.orders.map(o => [o.pharmacyName, o.province, o.city, o.district, o.repName || "", o.orderDate, o
.totalAmount || 0, o.status]);
      downloadCSVFile("orders-export.csv", hdrs, rws);
    });
  }
  if (btnUsers) {
    btnUsers.addEventListener("click", () => {
      const hdrs = ["   ", " ", "", " ", " "];
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
// 17.   (PWA Service Worker Registration)
// ----------------------------------------------------------------------------
function setupPWAServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('  PWA    .');
      })
      .catch(err => {
        console.warn('     :', err);
      });
  }
}
// ----------------------------------------------------------------------------
// 18.  (    ) - Matching Prompt Request
// ----------------------------------------------------------------------------
let activeNavCoords = { lat: 35.7200, lng: 51.4200, name: "" };

function openNavigationAppModal(lat, lng, nameText = "") {
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
      window.open(`https://balad.ir/location?latitude=${activeNavCoords.lat}&longitude=${activeNavCoords.lng}`, "_blank"
);
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
// 19.           (Requirement 10 & 11)
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
      if (distDisp) distDisp.textContent = `${dPrice.toLocaleString("fa-IR")} `;
      if (phDisp) phDisp.textContent = `${pPrice.toLocaleString("fa-IR")} `;
    } else {
      if (distDisp) distDisp.textContent = "0 ";
      if (phDisp) phDisp.textContent = "0 ";
    }
  };
  if (repSel) {
    repSel.innerHTML = `<option value=""> ...</option>`;
    state.reps.forEach(r => {
      repSel.innerHTML += `<option value="${r.name}">${r.name}</option>`;
    });
  }
  if (prodSel) {
    prodSel.innerHTML = `<option value=""> ...</option>`;

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
      const month = document.getElementById("tgtMonthSelect").value || "";
      if (!repName || !productName || targetCount <= 0) {
        alert("        .");
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
      alert(`    «${repName}»   «${productName}»  .`);
    });
  }
}
// ----------------------------------------------------------------------------
// 20.    (Audible Web Audio Beep for Notifications)
// ----------------------------------------------------------------------------
function playNotificationBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime); //  A5
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    console.warn("      .");
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
// 21.          

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
      if (city === "" || prov === "") {
        if (mapFullOverview) mapFullOverview.setView([35.7200, 51.4200], 12);
        alert("   /   .");
      } else if (city === "" || prov === " ") {
        if (mapFullOverview) mapFullOverview.setView([36.2970, 59.6062], 12);
        alert("     .");
      } else if (city === "" || prov === "") {
        if (mapFullOverview) mapFullOverview.setView([32.6546, 51.6680], 12);
        alert("     .");
      } else {
        if (mapFullOverview) mapFullOverview.setView([35.7200, 51.4200], 6);
      }
    });
  }
}
// ----------------------------------------------------------------------------
// 22.          (     )
// ----------------------------------------------------------------------------
function setupNetworkStatusMonitor() {
  const updateBadge = () => {
    const el = document.getElementById("globalOnlineStatusBadge");
    if (!el) return;
    if (navigator.onLine) {
      el.textContent = "  (  )";
      el.style.background = "#10b981";
    } else {
      el.textContent = "  ( )";
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
  console.log("                 .");
});
// ============================================================================
// 26.            +   
// ============================================================================
function setupAllFormSubmitHandlers() {
  // 1.   (   )
  const formPh = document.getElementById("formPharmacy");
  const btnPh = document.getElementById("btnSavePharmacy");
  const handleSavePh = () => {
    const editId = document.getElementById("pharmacyEditId").value;
    const dateAdded = document.getElementById("pharmacyDate").value.trim() || new Date().toLocaleDateString("fa-IR");
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
    if (!name || !province || !city || !district || !address) {
      alert("    (*)     .");
      return;
    }
    //     (Requirement 2 in prompt)
    if (!editId) {
      const isDup = state.pharmacies.some(p => p.name === name || (phone && p.phone === phone));
      if (isDup) {
        alert(` :  «${name}»      !`);
      }
    }
    if (editId) {
      const idx = state.pharmacies.findIndex(p => p.id === editId);
      if (idx !== -1) {
        state.pharmacies[idx] = { ...state.pharmacies[idx], dateAdded, name, phone, manager, province, city, district, address, lat, lng, isPercentage };
      }
      alert(`  «${name}»      .`);
    } else {
      state.pharmacies.push({
        id: "ph-" + Date.now(),
        dateAdded, name, phone, manager, province, city, district, address, lat, lng, isPercentage,
        repName: currentUserName
      });
      alert(`  «${name}»    .`);
    }
    saveState();
    resetPharmacyForm();
    renderPharmaciesList();
    renderDashboardOverviewMap();
    updateNavBadges();
    //     
    const btnList = document.getElementById("btnShowPhList");
    if (btnList) btnList.click();
  };
  if (btnPh) btnPh.onclick = (e) => { e.preventDefault(); handleSavePh(); };
  if (formPh) formPh.onsubmit = (e) => { e.preventDefault(); handleSavePh(); };
  // 2.   (   )
  const formDoc = document.getElementById("formDoctor");
  const btnDoc = document.getElementById("btnSaveDoctor");
  const handleSaveDoc = () => {
    const editId = document.getElementById("doctorEditId").value;
    const dateAdded = document.getElementById("doctorDate").value.trim() || new Date().toLocaleDateString("fa-IR");
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
    if (!name || !specialty || !province || !city || !district || !address) {
      alert("    (*)  /   .");
      return;
    }
    if (!editId) {
      const isDup = state.doctors.some(d => d.name === name || (phone && d.phone === phone));
      if (isDup) {
        alert(` : / «${name}»      !`);
      }
    }
    if (editId) {
      const idx = state.doctors.findIndex(d => d.id === editId);
      if (idx !== -1) {
        state.doctors[idx] = { ...state.doctors[idx], dateAdded, name, specialty, phone, province, city, district, address, lat, lng, isPercentage };
      }
      alert(` / «${name}»      .`);
    } else {
      state.doctors.push({
        id: "doc-" + Date.now(),
        dateAdded, name, specialty, phone, province, city, district, address, lat, lng, isPercentage,
        repName: currentUserName
      });
      alert(` / «${name}»    .`);
    }
    saveState();
    resetDoctorForm();
    renderDoctorsList();
    renderDashboardOverviewMap();
    updateNavBadges();
    const btnList = document.getElementById("btnShowDocList");
    if (btnList) btnList.click();
  };
  if (btnDoc) btnDoc.onclick = (e) => { e.preventDefault(); handleSaveDoc(); };
  if (formDoc) formDoc.onsubmit = (e) => { e.preventDefault(); handleSaveDoc(); };
  // 3.   (      )
  const formOrd = document.getElementById("formOrder");
  const btnOrd = document.getElementById("btnSaveOrder");
  const handleSaveOrd = () => {
    const editId = document.getElementById("orderEditId").value;
    const pharmacyName = document.getElementById("orderPharmacyName").value.trim();
    const province = document.getElementById("orderProvince").value;
    const city = document.getElementById("orderCity").value;
    const district = document.getElementById("orderDistrict").value;
    const address = document.getElementById("orderAddress").value.trim();
    const repName = document.getElementById("orderRepName").value || currentUserName;
    const orderDate = document.getElementById("orderDate").value.trim() || new Date().toLocaleDateString("fa-IR");
    const status = document.getElementById("orderStatus").value;
    const notes = document.getElementById("orderNotes").value.trim();
    if (!pharmacyName || !province || !city || !district) {
      alert("         .");
      return;
    }
    const items = getOrderItemsFromUI();
    if (items.length === 0 || !items[0].name) {
      alert("        .");
      return;
    }
    const totalAmount = items.reduce((sum, item) => sum + (item.count * item.price), 0);
    //       (Requirement 1 in prompt)
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
        state.orders[idx] = { ...state.orders[idx], pharmacyName, province, city, district, address, repName, orderDate,
 status, notes, items, totalAmount };
      }
      alert(`   «${pharmacyName}»  .`);
    } else {
      state.orders.push({
        id: "ord-" + Date.now(),
        pharmacyName, province, city, district, address, repName, orderDate, status, notes, items, totalAmount
      });
      alert(`     «${pharmacyName}»  .      .`);
    }
    saveState();
    resetOrderForm();
    renderOrdersList();
    renderSalesTargetsTable();
    updateNavBadges();
    const btnList = document.getElementById("btnShowOrdList");
    if (btnList) btnList.click();
  };
  if (btnOrd) btnOrd.onclick = (e) => { e.preventDefault(); handleSaveOrd(); };
  if (formOrd) formOrd.onsubmit = (e) => { e.preventDefault(); handleSaveOrd(); };
}
// ============================================================================
// 27.      (Jalali Date Auto Slash - YYYY/MM/DD)
// ============================================================================
function setupJalaliDateAutoSlash() {
  const dateInputs = document.querySelectorAll("#pharmacyDate, #doctorDate, #orderDate, #visitDate, #leaveFromDate, #leaveToDate");
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
      inp.value = new Date().toLocaleDateString("fa-IR");
    }
  });
}
// ============================================================================
// 28.            (Form/List Switcher)
// ============================================================================
function setupFormListSwitchers() {
  const switchCard = (btnFormId, btnListId, formCardId, listCardId) => {
    const bF = document.getElementById(btnFormId);
    const bL = document.getElementById(btnListId);
    const cF = document.getElementById(formCardId);
    const cL = document.getElementById(listCardId);
    if (!bF || !bL || !cF || !cL) return;
    bF.addEventListener("click", () => {
      bF.className = "btn btn-primary btn-sm";
      bF.style.background = "#0d9488";
      bL.className = "btn btn-outline btn-sm";
      cF.style.display = "block";
      cL.style.display = "none";
    });
    bL.addEventListener("click", () => {
      bL.className = "btn btn-primary btn-sm";
      bL.style.background = "#0d9488";
      bF.className = "btn btn-outline btn-sm";
      cF.style.display = "none";
      cL.style.display = "block";
    });
  };
  switchCard("btnShowPhForm", "btnShowPhList", "cardPhForm", "cardPhList");
  switchCard("btnShowDocForm", "btnShowDocList", "cardDocForm", "cardDocList");
  switchCard("btnShowOrdForm", "btnShowOrdList", "cardOrdForm", "cardOrdList");
}

// ============================================================================
// 29.         (Matching Screenshot Date Picker)
// ============================================================================
let activeDateInputForPicker = null;
function setupJalaliCalendarPicker() {
  const popup = document.getElementById("jalaliCalendarPopup");
  if (!popup) return;
  const dateInputs = document.querySelectorAll("#pharmacyDate, #doctorDate, #orderDate, #visitDate, #leaveFromDate, #leaveToDate");
  dateInputs.forEach(inp => {
    if (inp.dataset.pickerBound === "true") return;
    inp.dataset.pickerBound = "true";
    //       /  (  )
    const wrapper = document.createElement("div");
    wrapper.className = "jalali-input-wrapper";
    inp.parentNode.insertBefore(wrapper, inp);
    wrapper.appendChild(inp);
    const badge = document.createElement("div");
    badge.className = "jalali-badge";
    badge.title = "   ";
    badge.innerHTML = `
      <span class="jalali-badge-header">July</span>
      <span class="jalali-badge-day">17</span>
    `;
    wrapper.insertBefore(badge, inp);
    const openPicker = (e) => {
      e.stopPropagation();
      activeDateInputForPicker = inp;
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
    btnToday.onclick = () => {
      if (activeDateInputForPicker) {
        activeDateInputForPicker.value = "1405/05/21";
      }
      popup.classList.remove("active");
    };
  }
  document.addEventListener("click", (e) => {
    if (!popup.contains(e.target) && !e.target.classList.contains("jalali-badge") && e.target !== activeDateInputForPicker) {
      popup.classList.remove("active");
    }
  });

}
function renderJalaliCalendarDays() {
  const grid = document.getElementById("jalaliDaysGrid");
  const monthSel = document.getElementById("jalaliMonthSelect");
  const yearSel = document.getElementById("jalaliYearSelect");
  if (!grid) return;
  grid.innerHTML = "";
  const year = yearSel ? yearSel.value : "1405";
  const month = monthSel ? monthSel.value : "05";
  //        
  for (let i = 0; i < 2; i++) {
    const empty = document.createElement("div");
    empty.className = "jalali-day-cell empty";
    grid.appendChild(empty);
  }
  const persianNumbers = ["۰","۱","۲","۳","۴","۵","۶","۷","۸","۹","۱۰","۱۱","۱۲","۱۳","۱۴","۱۵","۱۶","۱۷","۱۸","۱۹","۲۰","۲۱","۲۲","۲۳","۲۴","۲۵","۲۶","۲۷","۲۸","۲۹","۳۰","۳۱"];
  for (let d = 1; d <= 31; d++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "jalali-day-cell" + (d === 21 ? " active" : "");
    btn.textContent = persianNumbers[d - 1] || d;
    btn.onclick = (e) => {
      e.stopPropagation();
      const dStr = d < 10 ? "0" + d : String(d);
      if (activeDateInputForPicker) {
        activeDateInputForPicker.value = `${year}/${month}/${dStr}`;
      }
      document.getElementById("jalaliCalendarPopup").classList.remove("active");
    };
    grid.appendChild(btn);
  }
}
// ============================================================================
// 30.     (Search Information Tab - Section 6 Requirement)
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
    //   
    state.pharmacies.forEach((p, idx) => {
      if (qPh && !p.name.toLowerCase().includes(qPh)) return;
      if (!qPh && !qDoc && !qHosp) {} //       
      results.push({
        index: idx + 1,
        repName: p.repName || " ",
        type: " ",
        name: p.name,
        city: `${p.province} / ${p.city}`,
        address: p.address,
        lat: p.lat,
        lng: p.lng,
        raw: p,
        entityType: "pharmacy"
      });
    });
    //   
    state.doctors.forEach((d, idx) => {
      if (qDoc && !d.name.toLowerCase().includes(qDoc)) return;
      results.push({
        index: idx + 1,
        repName: d.repName || " ",

        type: " ",
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
      const hdrs = ["", " ", " ", " ", "/", ""];
      const rws = [];
      state.pharmacies.forEach((p, idx) => rws.push([idx + 1, p.repName || "-", "", p.name, p.city, p.address]))
;
      state.doctors.forEach((d, idx) => rws.push([idx + 1, d.repName || "-", "", d.name, d.city, d.address]));
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
        <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); openRowDetailsModal(res.raw, '${res.entityType}')">   </button>
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
// 31.             (Section 10)
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
  const mapRow = (obj, type) => {
    if (type === "pharmacy") {
      return [
        ["نام داروخانه", obj.name], ["نماینده", obj.repName || "-"], ["استان/شهر/منطقه", `${obj.province || ""} / ${obj.city || ""} / ${obj.district || "-"}`],
        ["آدرس", obj.address], ["تلفن", obj.phone || "-"], ["درصدی", obj.isPercentage ? "بله" : "خیر"], ["فایل", obj.fileName || "-"]
      ];
    }
    if (type === "doctor") {
      return [
        ["نام پزشک", obj.name], ["تخصص", obj.specialty], ["نماینده", obj.repName || "-"], ["استان/شهر/منطقه", `${obj.province || ""} / ${obj.city || ""} / ${obj.district || "-"}`],
        ["آدرس", obj.address], ["تلفن", obj.phone || "-"]
      ];
    }
    return [
      ["داروخانه", obj.pharmacyName], ["نماینده", obj.repName || "-"], ["تاریخ", obj.orderDate], ["مبلغ", `${Number(obj.totalAmount || 0).toLocaleString("fa-IR")} ریال`],
      ["وضعیت", obj.status], ["اقلام", (obj.items || []).map(i => `${i.name}: تعداد ${i.count}، جایزه ${i.giftCount || 0}`).join(" | ")]
    ];
  };
  const rows = mapRow(rowObj, entityType);
  detailsHTML = rows.map(([k,v]) => `<div><strong>${k}:</strong> ${v ?? "-"}</div>`).join("");
  shareText = rows.map(([k,v]) => `${k}: ${v ?? ""}`).join("\n");
  textBox.innerHTML = detailsHTML;
  const bindShare = (btnId, urlPrefix) => {
    const btn = document.getElementById(btnId);
    if (btn) btn.onclick = () => window.open(`${urlPrefix}${encodeURIComponent(shareText)}`, "_blank");
  };
  bindShare("btnShareBale", "https://ble.ir/share?text=");
  bindShare("btnShareEitaa", "https://eitaa.com/share/url?url=&text=");
  bindShare("btnShareTelegram", "https://t.me/share/url?url=&text=");
  bindShare("btnShareSoroush", "https://splus.ir/share?text=");
  bindShare("btnShareWhatsApp", "https://api.whatsapp.com/send?text=");
  const btnCopy = document.getElementById("btnRowCopyText");
  if (btnCopy) btnCopy.onclick = () => navigator.clipboard.writeText(shareText).then(() => alert("اطلاعات کپی شد."));
  const btnEdit = document.getElementById("btnRowEdit");
  if (btnEdit) btnEdit.onclick = () => {
    closeModalRowDetails();
    if (entityType === "pharmacy") editPharmacy(rowObj.id);
    else if (entityType === "doctor") editDoctor(rowObj.id);
    else if (entityType === "order") editOrder(rowObj.id);
  };
  const btnDel = document.getElementById("btnRowDelete");
  if (btnDel) btnDel.onclick = () => {
    if (confirm("حذف شود؟")) {
      closeModalRowDetails();
      if (entityType === "pharmacy") deletePharmacy(rowObj.id);
      else if (entityType === "doctor") deleteDoctor(rowObj.id);
      else if (entityType === "order") deleteOrder(rowObj.id);
    }
  };
  modal.classList.add("active");
  setTimeout(() => {
    if (!mapRowDetailsMiniInstance && document.getElementById("rowDetailsMiniMap")) {
      mapRowDetailsMiniInstance = L.map("rowDetailsMiniMap").setView([rowObj.lat || 35.7200, rowObj.lng || 51.4200], 15);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap contributors" }).addTo(mapRowDetailsMiniInstance);
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
// 32.     (Columns & Products Catalog - Section 9 & 11)
// ============================================================================
function setupColumnsProductsTab() {
  const formProd = document.getElementById("formProduct");
  const btnProd = document.getElementById("btnSaveProduct");
  const handleSaveProd = () => {
    const name = document.getElementById("productName").value.trim();
    const category = document.getElementById("productCategory").value.trim();
    const distPrice = parseInt(document.getElementById("productDistPrice") ? document.getElementById("productDistPrice")
.value : 40000) || 40000;
    const phPrice = parseInt(document.getElementById("productPrice") ? document.getElementById("productPrice").value : 45000) || 45000;
    const stock = parseInt(document.getElementById("productStock") ? document.getElementById("productStock").value : 5000) || 5000;
    if (!name || !category) {
      alert("        .");
      return;
    }
    if (!state.products) state.products = [];
    const idx = state.products.findIndex(p => p.name === name);
    if (idx !== -1) {
      state.products[idx] = { ...state.products[idx], category, distributorPrice: distPrice, pharmacyPrice: phPrice, stock };
      alert(`  «${name}»     .`);
    } else {
      state.products.push({

        id: "prod-" + Date.now(),
        name,
        category,
        distributorPrice: distPrice,
        pharmacyPrice: phPrice,
        stock,
        description: ` : ${distPrice.toLocaleString("fa-IR")}  |  : ${phPrice.toLocaleString("fa-IR")} `
      });
      alert(`   «${name}»     .`);
    }
    saveState();
    if (formProd) formProd.reset();
    renderColumnsProductsTable();
    setupSalesTargetsTab();
    updateNavBadges();
  };
  if (btnProd) btnProd.onclick = (e) => { e.preventDefault(); handleSaveProd(); };
  if (formProd) formProd.onsubmit = (e) => { e.preventDefault(); handleSaveProd(); };
  renderColumnsProductsTable();
}
function renderColumnsProductsTable() {
  const tbody = document.getElementById("tableProductsBody");
  if (!tbody) return;
  tbody.innerHTML = "";
  (state.products || []).forEach((prod, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td><strong style="color:#0f172a;">${prod.name}</strong></td>
      <td><span class="badge-status-online" style="background:#0d9488;">${prod.category}</span></td>
      <td><strong style="color:#1e40af;">${Number(prod.distributorPrice || 40000).toLocaleString("fa-IR")} </strong>
</td>
      <td><strong style="color:#0d9488;">${Number(prod.pharmacyPrice || 45000).toLocaleString("fa-IR")} </strong></t
d>
      <td>${prod.stock || 5000} </td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="deleteProductCatalogItem('${prod.id}')"> </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}
function deleteProductCatalogItem(id) {
  if (!confirm("      ")) return;
  state.products = state.products.filter(p => p.id !== id);
  saveState();
  renderColumnsProductsTable();
  setupSalesTargetsTab();
  updateNavBadges();
}
