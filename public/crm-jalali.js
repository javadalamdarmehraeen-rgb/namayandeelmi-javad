// تقویم شمسی واقعی + نشانگر میلادی JAN..DEC + تقویم کنار فیلد تاریخ + افزودن لحظه‌ای
(function () {
  "use strict";

  function div(a, b) { return ~~(a / b); }

  function g2d(gy, gm, gd) {
    var d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4)
      + div(153 * ((gm + 9) % 12) + 2, 5)
      + gd - 34840408;
    d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
    return d;
  }

  function d2g(jdn) {
    var j = 4 * jdn + 139361631;
    j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
    var i = div((j % 1461), 4) * 5 + 308;
    var gd = div((i % 153), 5) + 1;
    var gm = (div(i, 153) % 12) + 1;
    var gy = div(j, 1461) - 100100 + div(8 - gm, 6);
    return { gy: gy, gm: gm, gd: gd };
  }

  function jalCal(jy) {
    var breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210,
      1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
    var bl = breaks.length;
    var gy = jy + 621;
    var leapJ = -14;
    var jp = breaks[0];
    var jump = 0;
    var leap, n, i;
    if (jy < jp || jy >= breaks[bl - 1]) {
      throw new Error("سال شمسی خارج از محدوده");
    }
    for (i = 1; i < bl; i += 1) {
      var jm = breaks[i];
      jump = jm - jp;
      if (jy < jm) break;
      leapJ = leapJ + div(jump, 33) * 8 + div((jump % 33), 4);
      jp = jm;
    }
    n = jy - jp;
    leapJ = leapJ + div(n, 33) * 8 + div((n % 33) + 3, 4);
    if ((jump % 33) === 4 && jump - n === 4) leapJ += 1;
    var leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
    var march = 20 + leapJ - leapG;
    if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
    leap = ((((n + 1) % 33) - 1) % 4);
    if (leap === -1) leap = 4;
    return { leap: leap, gy: gy, march: march };
  }

  function j2d(jy, jm, jd) {
    var r = jalCal(jy);
    return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
  }

  function d2j(jdn) {
    var gy = d2g(jdn).gy;
    var jy = gy - 621;
    var r = jalCal(jy);
    var jdn1f = g2d(gy, 3, r.march);
    var k = jdn - jdn1f;
    var jm, jd;
    if (k >= 0) {
      if (k <= 185) {
        jm = 1 + div(k, 31);
        jd = (k % 31) + 1;
        return { jy: jy, jm: jm, jd: jd };
      }
      k -= 186;
    } else {
      jy -= 1;
      k += 179;
      if (r.leap === 1) k += 1;
    }
    jm = 7 + div(k, 30);
    jd = (k % 30) + 1;
    return { jy: jy, jm: jm, jd: jd };
  }

  function toJalaali(gy, gm, gd) { return d2j(g2d(gy, gm, gd)); }
  function toGregorian(jy, jm, jd) { return d2g(j2d(jy, jm, jd)); }

  function isLeap(jy) {
    return jalCal(jy).leap === 0;
  }

  function monthLength(jy, jm) {
    if (jm <= 6) return 31;
    if (jm <= 11) return 30;
    return isLeap(jy) ? 30 : 29;
  }

  var G_MON = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  var J_MON = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
  var FA_NUM = "۰۱۲۳۴۵۶۷۸۹";
  var AR_NUM = "٠١٢٣٤٥٦٧٨٩";

  function toFaNum(n) {
    return String(n).replace(/\d/g, function (d) { return FA_NUM[d]; });
  }

  function toEnDigits(s) {
    return String(s == null ? "" : s)
      .replace(/[۰-۹]/g, function (d) { return String(FA_NUM.indexOf(d)); })
      .replace(/[٠-٩]/g, function (d) { return String(AR_NUM.indexOf(d)); });
  }

  function pad2(n) {
    n = Number(n);
    if (!isFinite(n)) n = 0;
    return (n < 10 ? "0" : "") + n;
  }

  function tehranParts() {
    var fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Tehran",
      year: "numeric",
      month: "numeric",
      day: "numeric"
    });
    var p = fmt.formatToParts(new Date());
    var o = { y: 2026, m: 8, d: 13 };
    p.forEach(function (x) {
      if (x.type === "year") o.y = parseInt(x.value, 10);
      if (x.type === "month") o.m = parseInt(x.value, 10);
      if (x.type === "day") o.d = parseInt(x.value, 10);
    });
    return o;
  }

  function todayJ() {
    var g = tehranParts();
    var j = toJalaali(g.y, g.m, g.d);
    return { gy: g.y, gm: g.m, gd: g.d, jy: j.jy, jm: j.jm, jd: j.jd };
  }

  // شنبه=۰ … جمعه=۶  — هفته ایران
  function weekdayIran(jy, jm, jd) {
    var g = toGregorian(jy, jm, jd);
    var dt = new Date(Date.UTC(g.gy, g.gm - 1, g.gd));
    var sun0 = dt.getUTCDay();
    return (sun0 + 1) % 7;
  }

  function gregorianBadgeFromG(gm, gd) {
    return { mon: G_MON[(gm - 1)] || "AUG", day: String(parseInt(gd, 10)) };
  }

  function gregorianBadge() {
    var t = todayJ();
    return gregorianBadgeFromG(t.gm, t.gd);
  }

  function jalaliTodayStr() {
    var t = todayJ();
    return t.jy + "/" + pad2(t.jm) + "/" + pad2(t.jd);
  }

  function parseJalali(str) {
    var s = toEnDigits(str).replace(/[-.]/g, "/").replace(/\s/g, "");
    var m = s.match(/^(\d{4})\/(\d{1,2})(?:\/(\d{1,2}))?$/);
    if (!m) return null;
    var jy = parseInt(m[1], 10);
    var jm = parseInt(m[2], 10);
    var jd = m[3] ? parseInt(m[3], 10) : 0;
    if (jy < 1200 || jy > 1600 || jm < 1 || jm > 12) return null;
    if (jd && (jd < 1 || jd > 31)) return null;
    return { jy: jy, jm: jm, jd: jd };
  }

  function formatJalali(jy, jm, jd) {
    return jy + "/" + pad2(jm) + "/" + pad2(jd);
  }

  function badgeForInput(inp) {
    var parsed = parseJalali(inp && inp.value);
    if (parsed && parsed.jd) {
      try {
        var g = toGregorian(parsed.jy, parsed.jm, parsed.jd);
        return gregorianBadgeFromG(g.gm, g.gd);
      } catch (e) {}
    }
    return gregorianBadge();
  }

  window.CRMJalali = {
    toJalaali: toJalaali,
    toGregorian: toGregorian,
    monthLength: monthLength,
    todayJ: todayJ,
    weekdayIran: weekdayIran,
    gregorianBadge: gregorianBadge,
    jalaliTodayStr: jalaliTodayStr,
    parseJalali: parseJalali,
    formatJalali: formatJalali,
    toEnDigits: toEnDigits,
    J_MON: J_MON,
    G_MON: G_MON
  };

  function $(id) { return document.getElementById(id); }

  function fillYearMonthSelects() {
    var yearSel = $("jalaliYearSelect");
    var monthSel = $("jalaliMonthSelect");
    var t = todayJ();
    if (yearSel) {
      yearSel.innerHTML = "";
      for (var y = t.jy - 8; y <= t.jy + 4; y++) {
        var o = document.createElement("option");
        o.value = String(y);
        o.textContent = toFaNum(y);
        if (y === t.jy) o.selected = true;
        yearSel.appendChild(o);
      }
    }
    if (monthSel) {
      monthSel.innerHTML = "";
      for (var m = 1; m <= 12; m++) {
        var om = document.createElement("option");
        om.value = pad2(m);
        om.textContent = J_MON[m - 1];
        if (m === t.jm) om.selected = true;
        monthSel.appendChild(om);
      }
    }
  }

  function paintBadge(badge, inp) {
    if (!badge) return;
    var g = badgeForInput(inp);
    var h = badge.querySelector(".jalali-badge-header");
    var d = badge.querySelector(".jalali-badge-day");
    if (h) h.textContent = g.mon;
    if (d) d.textContent = g.day;
    var parsed = parseJalali(inp && inp.value);
    var title = "میلادی: " + g.mon + " " + g.day;
    if (parsed && parsed.jd) title += " — شمسی: " + formatJalali(parsed.jy, parsed.jm, parsed.jd);
    else title += " — امروز شمسی: " + jalaliTodayStr();
    badge.title = title;
  }

  window.refreshAllDateBadges = function () {
    document.querySelectorAll(".jalali-input-wrapper").forEach(function (w) {
      var badge = w.querySelector(".jalali-badge");
      var inp = w.querySelector("input");
      paintBadge(badge, inp);
    });
    document.querySelectorAll(".jalali-badge").forEach(function (badge) {
      if (badge.closest(".jalali-input-wrapper")) return;
      paintBadge(badge, null);
    });
    var btn = $("jalaliTodayBtn");
    if (btn) btn.textContent = "امروز: " + toFaNum(jalaliTodayStr());
  };

  window.renderJalaliCalendarDays = function () {
    var grid = $("jalaliDaysGrid");
    var monthSel = $("jalaliMonthSelect");
    var yearSel = $("jalaliYearSelect");
    if (!grid) return;
    var t = todayJ();
    var jy = yearSel ? parseInt(toEnDigits(yearSel.value), 10) : t.jy;
    var jm = monthSel ? parseInt(toEnDigits(monthSel.value), 10) : t.jm;
    if (!jy) jy = t.jy;
    if (!jm) jm = t.jm;
    var dim = monthLength(jy, jm);
    var start = weekdayIran(jy, jm, 1);
    var selected = parseJalali(window.activeDateInputForPicker && window.activeDateInputForPicker.value);
    grid.innerHTML = "";
    var i;
    for (i = 0; i < start; i++) {
      var empty = document.createElement("div");
      empty.className = "jalali-day-cell empty";
      grid.appendChild(empty);
    }
    for (var d = 1; d <= dim; d++) {
      var btn = document.createElement("button");
      btn.type = "button";
      var isToday = (jy === t.jy && jm === t.jm && d === t.jd);
      var isSel = selected && selected.jy === jy && selected.jm === jm && selected.jd === d;
      btn.className = "jalali-day-cell" + (isToday ? " today" : "") + (isSel || (isToday && !selected) ? " active" : "");
      btn.textContent = toFaNum(d);
      btn.setAttribute("data-jday", String(d));
      btn.setAttribute("title", formatJalali(jy, jm, d) + " — " + ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"][weekdayIran(jy, jm, d)]);
      btn.onclick = (function (day) {
        return function (e) {
          e.stopPropagation();
          var inp = window.activeDateInputForPicker;
          if (inp) {
            inp.value = formatJalali(jy, jm, day);
            var wrap = inp.closest(".jalali-input-wrapper");
            if (wrap) paintBadge(wrap.querySelector(".jalali-badge"), inp);
            try { inp.dispatchEvent(new Event("change", { bubbles: true })); } catch (err) {}
          }
          var popup = $("jalaliCalendarPopup");
          if (popup) popup.classList.remove("active");
        };
      })(d);
      grid.appendChild(btn);
    }
  };

  function openPickerFor(inp, e) {
    if (e) e.stopPropagation();
    var popup = $("jalaliCalendarPopup");
    if (!popup || !inp) return;
    window.activeDateInputForPicker = inp;
    var t = todayJ();
    var yearSel = $("jalaliYearSelect");
    var monthSel = $("jalaliMonthSelect");
    var cur = parseJalali(inp.value);
    if (yearSel) {
      var yv = String(cur ? cur.jy : t.jy);
      if (!Array.prototype.some.call(yearSel.options, function (o) { return o.value === yv; })) {
        var extra = document.createElement("option");
        extra.value = yv;
        extra.textContent = toFaNum(yv);
        yearSel.appendChild(extra);
      }
      yearSel.value = yv;
    }
    if (monthSel) monthSel.value = pad2(cur ? cur.jm : t.jm);
    window.renderJalaliCalendarDays();
    var rect = inp.getBoundingClientRect();
    popup.style.position = "fixed";
    var top = rect.bottom + 6;
    if (top + 360 > window.innerHeight) top = Math.max(8, rect.top - 360);
    var left = rect.left;
    if (left + 320 > window.innerWidth) left = Math.max(8, window.innerWidth - 328);
    if (left < 8) left = 8;
    popup.style.top = top + "px";
    popup.style.left = left + "px";
    popup.style.right = "auto";
    popup.classList.add("active");
  }

  window.attachJalaliPicker = function (inp) {
    if (!inp) return;
    inp.classList.add("jalali-date-input");
    inp.setAttribute("inputmode", "numeric");
    inp.placeholder = inp.placeholder || "1405/05/22";
    var parsed0 = parseJalali(inp.value);
    if (parsed0 && parsed0.jd) inp.value = formatJalali(parsed0.jy, parsed0.jm, parsed0.jd);

    var parent = inp.parentNode;
    if (!parent) return;
    var wrapper = parent.classList && parent.classList.contains("jalali-input-wrapper")
      ? parent
      : (inp.closest && inp.closest(".jalali-input-wrapper"));
    if (!wrapper) {
      wrapper = document.createElement("div");
      wrapper.className = "jalali-input-wrapper";
      parent.insertBefore(wrapper, inp);
      wrapper.appendChild(inp);
    }
    var badge = wrapper.querySelector(".jalali-badge");
    if (!badge) {
      badge = document.createElement("div");
      badge.className = "jalali-badge";
      badge.innerHTML = '<span class="jalali-badge-header">AUG</span><span class="jalali-badge-day">13</span>';
      wrapper.insertBefore(badge, inp);
    }
    paintBadge(badge, inp);

    if (inp.dataset.pickerBound !== "true") {
      inp.dataset.pickerBound = "true";
      badge.addEventListener("click", function (ev) { openPickerFor(inp, ev); });
      inp.addEventListener("click", function (ev) { openPickerFor(inp, ev); });
    } else if (inp.dataset.pickerUpgraded !== "1") {
      inp.dataset.pickerUpgraded = "1";
      badge.addEventListener("click", function (ev) { openPickerFor(inp, ev); });
      inp.addEventListener("click", function (ev) { openPickerFor(inp, ev); });
    }

    if (inp.dataset.slashBound !== "true") {
      inp.dataset.slashBound = "true";
      inp.addEventListener("input", function () {
        var val = toEnDigits(this.value).replace(/[^0-9]/g, "");
        if (val.length > 4 && val.length <= 6) this.value = val.slice(0, 4) + "/" + val.slice(4);
        else if (val.length > 6) this.value = val.slice(0, 4) + "/" + val.slice(4, 6) + "/" + val.slice(6, 8);
        else this.value = val;
        paintBadge(badge, this);
      });
    }
  };

  function fieldKindOf(el) {
    if (!el) return "";
    if (el.getAttribute("data-kind")) return el.getAttribute("data-kind");
    if (el.classList.contains("jalali-date-input")) return "date";
    var id = el.getAttribute("data-custom-field-id");
    if (!id || !window.state || !state.customFields) return "";
    var kind = "";
    Object.keys(state.customFields).forEach(function (k) {
      (state.customFields[k] || []).forEach(function (f) {
        if (f.id === id) kind = f.inputKind || f.type || "";
      });
    });
    return kind;
  }

  function skipInstant(inp) {
    if (!inp) return true;
    if (inp.type === "number" || inp.type === "password" || inp.type === "file" || inp.type === "hidden" || inp.type === "email" || inp.type === "tel") return true;
    if (inp.readOnly || inp.disabled) return true;
    if (inp.classList.contains("jalali-date-input") || fieldKindOf(inp) === "date") return true;
    if (inp.closest("#jalaliCalendarPopup") || inp.closest("#columnsDesignerHost") || inp.closest("#colDesignerPanel") || inp.closest(".modal-overlay") || inp.closest("#manualDesignCanvas") || inp.closest(".man-toolbar") || inp.closest("#formCustomField") || inp.closest("#prodFieldBar") || inp.closest("#addTabPanel")) return true;
    if (inp.closest(".order-item-row") || inp.classList.contains("order-item-name")) return true;
    var id = inp.id || "";
    if (/Date|Lat|Lng|password|Password|username|Username|Search|search|Notes|notes|tgtYear|tgtCount|productPrice|productStock|productDist|cfLabel|cfOptions|colField|colNewTab|colBox|manBox|prodNewField/.test(id)) return true;
    if (inp.closest(".geo-suggest-wrap")) return true;
    return false;
  }

  window.attachInstantAdd = function (inp) {
    if (!inp || inp.dataset.flyBtn === "1") return;
    if (skipInstant(inp)) return;
    inp.dataset.flyBtn = "1";
    var parent = inp.parentNode;
    if (!parent) return;
    var row = parent.classList && parent.classList.contains("instant-add-row")
      ? parent
      : null;
    if (!row) {
      row = document.createElement("div");
      row.className = "instant-add-row";
      parent.insertBefore(row, inp);
      row.appendChild(inp);
    }
    var btn = row.querySelector(".btn-instant-add");
    if (!btn) {
      btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn-instant-add";
      btn.hidden = true;
      btn.textContent = "➕ افزودن";
      row.appendChild(btn);
    }
    var key = inp.getAttribute("data-custom-field-id") || inp.id || ("misc-" + Math.random().toString(36).slice(2, 7));
    function knownList() {
      if (!window.state) return [];
      if (!state.typedOptions) state.typedOptions = {};
      if (!state.typedOptions[key]) state.typedOptions[key] = [];
      var extra = [];
      if (inp.getAttribute("data-custom-field-id") && state.customFields) {
        Object.keys(state.customFields).forEach(function (k) {
          (state.customFields[k] || []).forEach(function (f) {
            if (f.id === inp.getAttribute("data-custom-field-id") && f.options) extra = f.options;
          });
        });
      }
      return state.typedOptions[key].concat(extra);
    }
    function refresh() {
      var v = (inp.value || "").trim();
      var known = knownList();
      if (v && known.indexOf(v) === -1) {
        btn.hidden = false;
        btn.textContent = "➕ افزودن «" + v + "»";
      } else {
        btn.hidden = true;
      }
    }
    inp.addEventListener("input", refresh);
    inp.addEventListener("focus", refresh);
    btn.addEventListener("click", function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      var v = (inp.value || "").trim();
      if (!v || !window.state) return;
      if (!state.typedOptions) state.typedOptions = {};
      if (!state.typedOptions[key]) state.typedOptions[key] = [];
      if (state.typedOptions[key].indexOf(v) === -1) state.typedOptions[key].push(v);
      var cfId = inp.getAttribute("data-custom-field-id");
      if (cfId && state.customFields) {
        Object.keys(state.customFields).forEach(function (k) {
          (state.customFields[k] || []).forEach(function (f) {
            if (f.id === cfId) {
              if (!f.options) f.options = [];
              if (f.options.indexOf(v) === -1) f.options.push(v);
            }
          });
        });
      }
      var listId = inp.getAttribute("list");
      if (!listId) {
        listId = String(key).replace(/\W/g, "_") + "FlyList";
        var dl = document.getElementById(listId);
        if (!dl) {
          dl = document.createElement("datalist");
          dl.id = listId;
          document.body.appendChild(dl);
        }
        inp.setAttribute("list", listId);
      }
      var dl2 = document.getElementById(listId);
      if (dl2) {
        var exists = false;
        Array.prototype.forEach.call(dl2.options, function (o) { if (o.value === v) exists = true; });
        if (!exists) {
          var o = document.createElement("option");
          o.value = v;
          dl2.appendChild(o);
        }
      }
      try { saveState(false); } catch (e) {}
      btn.hidden = true;
      var old = btn.textContent;
      btn.hidden = false;
      btn.textContent = "ثبت شد";
      setTimeout(function () { btn.textContent = "➕ افزودن"; btn.hidden = true; }, 900);
    });
  };

  function bindAllDateAndSimple() {
    var dateSel = [
      "#pharmacyDate", "#doctorDate", "#orderDate", "#visitDate",
      "#leaveFromDate", "#leaveToDate"
    ].join(",");
    document.querySelectorAll(dateSel + ", input.jalali-date-input, input[data-kind='date']").forEach(function (el) {
      window.attachJalaliPicker(el);
    });
    document.querySelectorAll("input.form-input[data-custom-field-id]").forEach(function (el) {
      var kind = fieldKindOf(el);
      if (kind === "date") {
        el.classList.add("jalali-date-input");
        window.attachJalaliPicker(el);
      } else if (kind === "simple" || kind === "" || kind === "text") {
        window.attachInstantAdd(el);
      }
    });
    document.querySelectorAll("input.form-input[type='text'], input.form-input:not([type])").forEach(function (el) {
      if (el.classList.contains("jalali-date-input") || el.getAttribute("data-kind") === "date") return;
      window.attachInstantAdd(el);
    });
    window.refreshAllDateBadges();
  }

  function wirePopupChrome() {
    var popup = $("jalaliCalendarPopup");
    if (!popup) return;
    if (popup.dataset.v1191 !== "1") {
      popup.dataset.v1191 = "1";
      fillYearMonthSelects();
    }
    var btnPrev = $("jalaliPrevMonth");
    var btnNext = $("jalaliNextMonth");
    var monthSel = $("jalaliMonthSelect");
    var yearSel = $("jalaliYearSelect");
    var btnToday = $("jalaliTodayBtn");
    if (monthSel) monthSel.onchange = function () { window.renderJalaliCalendarDays(); };
    if (yearSel) yearSel.onchange = function () { window.renderJalaliCalendarDays(); };
    if (btnPrev && monthSel) {
      btnPrev.onclick = function () {
        var m = parseInt(toEnDigits(monthSel.value), 10) || 1;
        var y = yearSel ? parseInt(toEnDigits(yearSel.value), 10) : todayJ().jy;
        m -= 1;
        if (m < 1) { m = 12; y -= 1; }
        if (yearSel) {
          yearSel.value = String(y);
          if (yearSel.value !== String(y)) {
            var o = document.createElement("option");
            o.value = String(y);
            o.textContent = toFaNum(y);
            yearSel.insertBefore(o, yearSel.firstChild);
            yearSel.value = String(y);
          }
        }
        monthSel.value = pad2(m);
        window.renderJalaliCalendarDays();
      };
    }
    if (btnNext && monthSel) {
      btnNext.onclick = function () {
        var m = parseInt(toEnDigits(monthSel.value), 10) || 1;
        var y = yearSel ? parseInt(toEnDigits(yearSel.value), 10) : todayJ().jy;
        m += 1;
        if (m > 12) { m = 1; y += 1; }
        if (yearSel) {
          yearSel.value = String(y);
          if (yearSel.value !== String(y)) {
            var o = document.createElement("option");
            o.value = String(y);
            o.textContent = toFaNum(y);
            yearSel.appendChild(o);
            yearSel.value = String(y);
          }
        }
        monthSel.value = pad2(m);
        window.renderJalaliCalendarDays();
      };
    }
    if (btnToday) {
      btnToday.textContent = "امروز: " + toFaNum(jalaliTodayStr());
      btnToday.onclick = function () {
        if (window.activeDateInputForPicker) {
          window.activeDateInputForPicker.value = jalaliTodayStr();
          var wrap = window.activeDateInputForPicker.closest(".jalali-input-wrapper");
          if (wrap) paintBadge(wrap.querySelector(".jalali-badge"), window.activeDateInputForPicker);
        }
        popup.classList.remove("active");
      };
    }
    if (!popup.dataset.closeBound) {
      popup.dataset.closeBound = "1";
      document.addEventListener("click", function (e) {
        if (!popup.classList.contains("active")) return;
        if (popup.contains(e.target)) return;
        if (e.target.closest && e.target.closest(".jalali-badge")) return;
        if (e.target === window.activeDateInputForPicker) return;
        if (e.target.classList && e.target.classList.contains("jalali-date-input")) return;
        popup.classList.remove("active");
      });
    }
  }

  function patchRenderCustom() {
    if (typeof window.renderCustomFieldsInForm === "function" && !window._jalaliRenderPatched) {
      window._jalaliRenderPatched = true;
      var orig = window.renderCustomFieldsInForm;
      window.renderCustomFieldsInForm = function (entityType, containerId, currentValues) {
        var out = orig(entityType, containerId, currentValues || {});
        setTimeout(bindAllDateAndSimple, 30);
        return out;
      };
    }
    if (typeof window.applyFullFormLayout === "function" && !window._jalaliLayoutPatched) {
      window._jalaliLayoutPatched = true;
      var origL = window.applyFullFormLayout;
      window.applyFullFormLayout = function (tabId) {
        var r = origL(tabId);
        setTimeout(bindAllDateAndSimple, 50);
        return r;
      };
    }
    if (typeof window.buildDesignerWidget === "function" && !window._jalaliBuildPatched) {
      window._jalaliBuildPatched = true;
      var origB = window.buildDesignerWidget;
      window.buildDesignerWidget = function (field, tabId) {
        var el = origB(field, tabId);
        setTimeout(function () {
          if (!el) return;
          var kind = (field && (field.inputKind || field.type)) || "";
          var inp = el.querySelector("input.form-input, input[data-custom-field-id]");
          if (!inp) return;
          if (kind === "date") {
            inp.classList.add("jalali-date-input");
            inp.setAttribute("data-kind", "date");
            window.attachJalaliPicker(inp);
          } else if (kind === "simple" || kind === "text" || kind === "") {
            window.attachInstantAdd(inp);
          }
        }, 20);
        return el;
      };
    }
  }

  function boot() {
    try { wirePopupChrome(); } catch (e) { console.error("jalali chrome", e); }
    try { patchRenderCustom(); } catch (e) {}
    try { bindAllDateAndSimple(); } catch (e) { console.error("jalali bind", e); }
    window.setupJalaliCalendarPicker = function () { bindAllDateAndSimple(); };
    window.setupJalaliDateAutoSlash = function () { bindAllDateAndSimple(); };
    if (typeof window.setupInstantAddAll === "function") {
      var prev = window.setupInstantAddAll;
      window.setupInstantAddAll = function () {
        try { prev(); } catch (e) {}
        bindAllDateAndSimple();
      };
    }
    if (typeof window.switchTab === "function" && !window._jalaliSw) {
      window._jalaliSw = true;
      var prevSw = window.switchTab;
      window.switchTab = function (id) {
        prevSw(id);
        setTimeout(bindAllDateAndSimple, 170);
      };
    }
    var t = todayJ();
    console.log("jalali ready", jalaliTodayStr(), gregorianBadge(), "1mordad-wd", weekdayIran(t.jy, 5, 1));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
