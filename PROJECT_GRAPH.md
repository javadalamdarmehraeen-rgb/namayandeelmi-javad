# 🕸️ گراف دانش پروژه «نماینده علمی» (PROJECT_GRAPH.md)

> این فایل **خودکار** ساخته می‌شود — با دستور `python update_project_graph.py`
> و در پایان هر تحویل، قبل از بازسازی chat.arena، تازه می‌شود (قانون ۶۶ AI_RULES).
> **قانون برای هوش مصنوعی: به‌جای خواندن کل سورس، اول این فایل را بخوان؛**
> جزئیات متن کامل فایل‌ها در بخش ۹ chat.arena است.

## الف) زنجیره لود اسکریپت‌ها (ترتیب اجرا در مرورگر)

1. `vendor/leaflet.js`
2. `crm-data.js`
3. `crm-app.js`
4. `crm-features-v9.js`
5. `iran-facilities.js`
6. `crm-features-v10.js`
7. `crm-features-v11.js`
8. `crm-features-v12.js`
9. `crm-features-v13.js`
10. `crm-jalali.js`
11. `crm-features-v14.js`
12. `crm-features-v15.js`
13. `crm-features-v16.js`
14. `crm-features-v17.js`
15. `crm-features-v18.js`
16. `crm-features-v19.js`
17. `crm-features-v20.js`

## ب) کارت فایل‌ها (نقش + توابع + نام‌های window که می‌سازد)

### `server.js` (9666 بایت)
- نقش: سرور سبک Node.js برای Render — ورود جدا، gzip، health، ژئوکد، محدودیت نرخ
- تعداد توابع داخلی: 4
- endpointهای سرور: `/api/backup`, `/api/backup/email`, `/api/state`, `/api/state`

### `scripts/build-sw.mjs` (2656 بایت)
- نقش: #!/usr/bin/env node
- تعداد توابع داخلی: 2

### `scripts/clean-extra-files.mjs` (7278 بایت)
- نقش: #!/usr/bin/env node
- تعداد توابع داخلی: 12

### `scripts/generate-assets.mjs` (11033 بایت)
- نقش: #!/usr/bin/env node
- تعداد توابع داخلی: 6

### `scripts/simplify-geojson.mjs` (2550 بایت)
- نقش: #!/usr/bin/env node
- تعداد توابع داخلی: 3

### `scripts/start.mjs` (1567 بایت)
- نقش: #!/usr/bin/env node
- تعداد توابع داخلی: 2

### `public/cloudflare-worker.js` (8066 بایت)
- نقش: **
- تعداد توابع داخلی: 8

### `public/crm-app.js` (169394 بایت)
- نقش: ============================================================================
- تعداد توابع داخلی: 162
- نام‌های window که تعریف/بازنویسی می‌کند: `_editingProductId`, `_lastSavedProductId`, `_lastSavedProductName`, `_navHamburgerBound`, `activeDateInputForPicker`, `applyAllFormLayouts`, `applyCustomFieldOrderInForm`, `attachInstantAdd`, `attachJalaliPicker`, `buildDesignerWidget`, `cleanupOrphanCustomFields`, `getAllMenuSections`, `rememberPharmacyName`, `renderExtraTabCustomFields`, `validateRequiredFields`

### `public/crm-data.js` (38845 بایت)
- نقش: ============================================================================
- تعداد توابع داخلی: 1

### `public/crm-features-v10.js` (13643 بایت)
- نقش: v10 — ورود جدا، ویجت داشبورد، تارگت، عیب‌یابی تصویری، افزودن لحظه‌ای، پنهان‌سازی دسترسی
- تعداد توابع داخلی: 22
- نام‌های window که تعریف/بازنویسی می‌کند: `__lastHealth`, `switchTab`

### `public/crm-features-v11.js` (107385 بایت)
- نقش: v11 — تغییر رمز، ردیف واقعی، اکسل خط‌کشی، ویزیت زنده، تارگت، ستون‌ها، دسترسی ریز
- تعداد توابع داخلی: 101
- نام‌های window که تعریف/بازنویسی می‌کند: `FA_FIELD_LABELS`, `_actMap`, `_actMarks`, `_activeColTab`, `_colDelPatched`, `_colEditScroll`, `_editingBoxId`, `_editingColField`, `_layoutBusy`, `_visitKeepAlive`, `addWidgetToActiveTab`, `applyAllFormLayouts`, `applyCustomFieldOrderInForm`, `applyFullFormLayout`, `applySelectExtraOptions`, `builtinFieldValue`, `changeUserPassword`, `cleanupOrphanCustomFields`, `deleteCustomField`, `downloadCSVFile`, `extraListColumns`, `getAllMenuSections`, `getMainGrid`, `getUnifiedFieldList`, `groupIsShared`, `isColShownInList`, `paintFieldBox`, `paintRequiredStar`, `refreshColumnsDesigner`, `renderAllSystemSelects`, `renderColBoxInfoTable`, `renderColBoxList`, `renderColBtnInfoTable`, `renderExtraTabCustomFields`, `renderUserCardsList`, `switchTab`, `validateRequiredFields`, `writeFieldSize`

### `public/crm-features-v12.js` (44613 بایت)
- نقش: v12 — نشستن فیلد روی تب اصلی، ویرایش کادر، کلیدهای اصلی در طراح، تب ساز مدیر
- تعداد توابع داخلی: 37
- نام‌های window که تعریف/بازنویسی می‌کند: `WIDGET_PALETTE`, `_activeColTab`, `_activeManualTab`, `_editingBoxId`, `_palDelegate`, `_v12OrderWrap`, `_v12Sw`, `addWidgetToActiveTab`, `applyCustomFieldOrderInForm`, `applyFullFormLayout`, `buildDesignerWidget`, `createUserTab`, `deleteUserTab`, `editUserTab`, `getAllMenuSections`, `iconFromTabLabel`, `placeFieldOnTab`, `refreshColumnsDesigner`, `refreshManualCanvas`, `renderColBoxList`, `switchTab`, `validateRequiredFields`

### `public/crm-features-v13.js` (32088 بایت)
- نقش: v13 — یک‌بار شدن امکانات آماده + تب طراحی دستی تب‌ها (درگ، اندازه، کپی چیدمان)
- تعداد توابع داخلی: 44
- نام‌های window که تعریف/بازنویسی می‌کند: `_activeManualTab`, `_v13LayoutWrap`, `_v13OrderId`, `_v13RenderWrap`, `_v13Sw`, `addWidgetToActiveTab`, `applyCustomFieldOrderInForm`, `applyFullFormLayout`, `copyPageToTab`, `dedupeTabWidgets`, `getAllMenuSections`, `getUnifiedFieldList`, `lockManualDesigner`, `placeFieldOnTab`, `refreshManualCanvas`, `renderCustomFieldsInForm`, `switchTab`

### `public/crm-features-v14.js` (34125 بایت)
- نقش: v14 — تب افزودن‌ها مثل ستون‌ها، گزینه کشویی با ویرایش/حذف، انتخاب داروخانه هم‌نام، فیلد کالا، ویرایش تب
- تعداد توابع داخلی: 42
- نام‌های window که تعریف/بازنویسی می‌کند: `_activeAddTab`, `_v14SavePatch`, `_v14Sw`, `applyFullFormLayout`, `applySelectExtraOptions`, `editUserTab`, `getAllMenuSections`, `iconFromTabLabel`, `refreshColumnsDesigner`, `setupAllFormSubmitHandlers`, `switchTab`

### `public/crm-features-v15.js` (23717 بایت)
- نقش: v15 — سایز واقعی فیلد، فریز سرستون+اسکرول افقی زیر آن، ذخیره افزودن، حفظ تنظیمات، طراح دستی بدون خراب کردن فرم/لیست
- تعداد توابع داخلی: 29
- نام‌های window که تعریف/بازنویسی می‌کند: `_manSelected`, `_v15Paint`, `_v15Sw`, `applyFullFormLayout`, `fieldKeyForTab`, `renderAddTabGrid`, `renderAddTabPanel`, `switchTab`, `writeFieldSize`

### `public/crm-features-v16.js` (32795 بایت)
- نقش: v16 — کشویی قابل تایپ/جستجو، افزودن شهر بعد از استان، نام داروخانه سراسری، فریز سرستون، قفل طراح دستی
- تعداد توابع داخلی: 48
- نام‌های window که تعریف/بازنویسی می‌کند: `_manPick`, `_manSelected`, `_v16Sw`, `_v16fly`, `_v16geoWrap`, `applyFieldPixelSize`, `attachInstantAdd`, `isKnownPharmacy`, `lockManualDesigner`, `populateCities`, `populateDistricts`, `populateProvinces`, `refreshFrozenTable`, `rememberPharmacyName`, `switchTab`

### `public/crm-features-v17.js` (19662 بایت)
- نقش: v17 — زیرهم، عرض در فرم ویرایش، اسکرول ویرایش، حذف بدون پنهان‌سازی بعدی،
- تعداد توابع داخلی: 31
- نام‌های window که تعریف/بازنویسی می‌کند: `_v17Sw`, `_v17delPh`, `_v17fly`, `attachInstantAdd`, `builtinFieldValue`, `deletePharmacy`, `lockManualDesigner`, `rememberPharmacyName`, `switchTab`

### `public/crm-features-v18.js` (33040 بایت)
- نقش: v18 — ستاره چسبیده، فونت نه عرض، ترتیب فرم/لیست جدا، ارتفاع واقعی،
- تعداد توابع داخلی: 35
- نام‌های window که تعریف/بازنویسی می‌کند: `_editingBoxId`, `_editingColField`, `_v18Confirm`, `_v18DefaultReq`, `_v18Sw`, `_v18Widget`, `applyAllFormLayouts`, `applyFullFormLayout`, `buildDesignerWidget`, `copyPageToTab`, `getUnifiedFieldList`, `lockManualDesigner`, `renderColBoxInfoTable`, `renderColBtnInfoTable`, `switchTab`, `validateRequiredFields`

### `public/crm-features-v19.js` (60932 بایت)
- نقش: v19 (11.15.0) — ستاره فقط تیک مدیر، کشویی‌های کنارهم + افزودن با تایپ،
- تعداد توابع داخلی: 65
- نام‌های window که تعریف/بازنویسی می‌کند: `_v18DefaultReq`, `_v19BackupLayoutGuard`, `_v19ComboHook`, `_v19Hist`, `_v19IcObs`, `_v19ProdTableWrap`, `_v19Sw`, `applyFullFormLayout`, `applySelectExtraOptions`, `extraListColumns`, `performAutoBackup`, `renderAllCustomFieldsInFormsAndTables`, `renderColumnsProductsTable`, `renderPharmaciesList`, `switchTab`, `testServerConnectivity`

### `public/crm-features-v20.js` (116453 بایت)
- نقش: ============================================================
- تعداد توابع داخلی: 133
- نام‌های window که تعریف/بازنویسی می‌کند: `_v20AutoSaveSig`, `_v20AutoSaveT`, `_v20Rendering`, `_v20TopupRows`, `applyFullFormLayout`, `builtinFieldValue`, `deleteCustomField`, `extraListColumns`, `getUnifiedFieldList`, `openRowDetailsModal`, `performAutoBackup`, `renderExtraTabCustomFields`, `renderLiveLocationTab`, `reverseGeocodeCoordinates`, `saveState`, `switchTab`, `v20ApplyGreyChains`, `v20ApplyOrderLock`, `v20DupGate`, `v20RenderComboManager`, `v20RenderProductExtras`

### `public/crm-features-v9.js` (69121 بایت)
- نقش: ===========================================================================
- تعداد توابع داخلی: 98
- نام‌های window که تعریف/بازنویسی می‌کند: `builtinFieldValue`, `downloadCSVFile`, `getOrderItemsFromUI`, `isColShownInList`, `renderDoctorsList`, `renderLiveLocationTab`, `renderOrdersList`, `renderPharmaciesList`, `setupLiveLocationTab`, `setupRepsTab`, `switchTab`, `validateRequiredFields`

### `public/crm-jalali.js` (25683 بایت)
- نقش: تقویم شمسی واقعی + نشانگر میلادی JAN..DEC + تقویم کنار فیلد تاریخ + افزودن لحظه‌ای
- تعداد توابع داخلی: 38
- نام‌های window که تعریف/بازنویسی می‌کند: `CRMJalali`, `_jalaliBuildPatched`, `_jalaliLayoutPatched`, `_jalaliRenderPatched`, `_jalaliSw`, `activeDateInputForPicker`, `applyFullFormLayout`, `attachInstantAdd`, `attachJalaliPicker`, `buildDesignerWidget`, `refreshAllDateBadges`, `renderCustomFieldsInForm`, `renderJalaliCalendarDays`, `setupInstantAddAll`, `setupJalaliCalendarPicker`, `setupJalaliDateAutoSlash`, `switchTab`

### `public/iran-facilities.js` (11799 بایت)
- نقش: پایگاه مرجع مراکز درمان ایران — مراکز شاخص هر استان (نه تک‌تک داروخانه‌های کشور)
- تعداد توابع داخلی: 0
- نام‌های window که تعریف/بازنویسی می‌کند: `IRAN_FACILITIES`

### `public/sw-template.js` (12798 بایت)
- نقش: * ============================================================
- تعداد توابع داخلی: 10

### `public/sw.js` (1145 بایت)
- نقش: const CACHE = "ttt-v11.20.0";
- تعداد توابع داخلی: 0

### `public/vendor/leaflet.js` (147552 بایت)
- نقش: * @preserve
- تعداد توابع داخلی: 0
- نام‌های window که تعریف/بازنویسی می‌کند: `L`

## ج) گراف بازنویسی نام‌های window (چه فایلی روی چه فایلی سوار می‌شود)

- `_activeColTab`: تعریف/بازنویسی به ترتیب لود → `public/crm-features-v11.js` ← `public/crm-features-v12.js`
- `_activeManualTab`: تعریف/بازنویسی به ترتیب لود → `public/crm-features-v12.js` ← `public/crm-features-v13.js`
- `_editingBoxId`: تعریف/بازنویسی به ترتیب لود → `public/crm-features-v11.js` ← `public/crm-features-v12.js` ← `public/crm-features-v18.js`
- `_editingColField`: تعریف/بازنویسی به ترتیب لود → `public/crm-features-v11.js` ← `public/crm-features-v18.js`
- `_manSelected`: تعریف/بازنویسی به ترتیب لود → `public/crm-features-v15.js` ← `public/crm-features-v16.js`
- `_v18DefaultReq`: تعریف/بازنویسی به ترتیب لود → `public/crm-features-v18.js` ← `public/crm-features-v19.js`
- `activeDateInputForPicker`: تعریف/بازنویسی به ترتیب لود → `public/crm-app.js` ← `public/crm-jalali.js`
- `addWidgetToActiveTab`: تعریف/بازنویسی به ترتیب لود → `public/crm-features-v11.js` ← `public/crm-features-v12.js` ← `public/crm-features-v13.js`
- `applyAllFormLayouts`: تعریف/بازنویسی به ترتیب لود → `public/crm-app.js` ← `public/crm-features-v11.js` ← `public/crm-features-v18.js`
- `applyCustomFieldOrderInForm`: تعریف/بازنویسی به ترتیب لود → `public/crm-app.js` ← `public/crm-features-v11.js` ← `public/crm-features-v12.js` ← `public/crm-features-v13.js`
- `applyFullFormLayout`: تعریف/بازنویسی به ترتیب لود → `public/crm-features-v11.js` ← `public/crm-features-v12.js` ← `public/crm-features-v13.js` ← `public/crm-jalali.js` ← `public/crm-features-v14.js` ← `public/crm-features-v15.js` ← `public/crm-features-v18.js` ← `public/crm-features-v19.js` ← `public/crm-features-v20.js`
- `applySelectExtraOptions`: تعریف/بازنویسی به ترتیب لود → `public/crm-features-v11.js` ← `public/crm-features-v14.js` ← `public/crm-features-v19.js`
- `attachInstantAdd`: تعریف/بازنویسی به ترتیب لود → `public/crm-app.js` ← `public/crm-jalali.js` ← `public/crm-features-v16.js` ← `public/crm-features-v17.js`
- `attachJalaliPicker`: تعریف/بازنویسی به ترتیب لود → `public/crm-app.js` ← `public/crm-jalali.js`
- `buildDesignerWidget`: تعریف/بازنویسی به ترتیب لود → `public/crm-app.js` ← `public/crm-features-v12.js` ← `public/crm-jalali.js` ← `public/crm-features-v18.js`
- `builtinFieldValue`: تعریف/بازنویسی به ترتیب لود → `public/crm-features-v9.js` ← `public/crm-features-v11.js` ← `public/crm-features-v17.js` ← `public/crm-features-v20.js`
- `cleanupOrphanCustomFields`: تعریف/بازنویسی به ترتیب لود → `public/crm-app.js` ← `public/crm-features-v11.js`
- `copyPageToTab`: تعریف/بازنویسی به ترتیب لود → `public/crm-features-v13.js` ← `public/crm-features-v18.js`
- `deleteCustomField`: تعریف/بازنویسی به ترتیب لود → `public/crm-features-v11.js` ← `public/crm-features-v20.js`
- `downloadCSVFile`: تعریف/بازنویسی به ترتیب لود → `public/crm-features-v9.js` ← `public/crm-features-v11.js`
- `editUserTab`: تعریف/بازنویسی به ترتیب لود → `public/crm-features-v12.js` ← `public/crm-features-v14.js`
- `extraListColumns`: تعریف/بازنویسی به ترتیب لود → `public/crm-features-v11.js` ← `public/crm-features-v19.js` ← `public/crm-features-v20.js`
- `getAllMenuSections`: تعریف/بازنویسی به ترتیب لود → `public/crm-app.js` ← `public/crm-features-v11.js` ← `public/crm-features-v12.js` ← `public/crm-features-v13.js` ← `public/crm-features-v14.js`
- `getUnifiedFieldList`: تعریف/بازنویسی به ترتیب لود → `public/crm-features-v11.js` ← `public/crm-features-v13.js` ← `public/crm-features-v18.js` ← `public/crm-features-v20.js`
- `iconFromTabLabel`: تعریف/بازنویسی به ترتیب لود → `public/crm-features-v12.js` ← `public/crm-features-v14.js`
- `isColShownInList`: تعریف/بازنویسی به ترتیب لود → `public/crm-features-v9.js` ← `public/crm-features-v11.js`
- `lockManualDesigner`: تعریف/بازنویسی به ترتیب لود → `public/crm-features-v13.js` ← `public/crm-features-v16.js` ← `public/crm-features-v17.js` ← `public/crm-features-v18.js`
- `performAutoBackup`: تعریف/بازنویسی به ترتیب لود → `public/crm-features-v19.js` ← `public/crm-features-v20.js`
- `placeFieldOnTab`: تعریف/بازنویسی به ترتیب لود → `public/crm-features-v12.js` ← `public/crm-features-v13.js`
- `refreshColumnsDesigner`: تعریف/بازنویسی به ترتیب لود → `public/crm-features-v11.js` ← `public/crm-features-v12.js` ← `public/crm-features-v14.js`
- `refreshManualCanvas`: تعریف/بازنویسی به ترتیب لود → `public/crm-features-v12.js` ← `public/crm-features-v13.js`
- `rememberPharmacyName`: تعریف/بازنویسی به ترتیب لود → `public/crm-app.js` ← `public/crm-features-v16.js` ← `public/crm-features-v17.js`
- `renderColBoxInfoTable`: تعریف/بازنویسی به ترتیب لود → `public/crm-features-v11.js` ← `public/crm-features-v18.js`
- `renderColBoxList`: تعریف/بازنویسی به ترتیب لود → `public/crm-features-v11.js` ← `public/crm-features-v12.js`
- `renderColBtnInfoTable`: تعریف/بازنویسی به ترتیب لود → `public/crm-features-v11.js` ← `public/crm-features-v18.js`
- `renderCustomFieldsInForm`: تعریف/بازنویسی به ترتیب لود → `public/crm-features-v13.js` ← `public/crm-jalali.js`
- `renderExtraTabCustomFields`: تعریف/بازنویسی به ترتیب لود → `public/crm-app.js` ← `public/crm-features-v11.js` ← `public/crm-features-v20.js`
- `renderLiveLocationTab`: تعریف/بازنویسی به ترتیب لود → `public/crm-features-v9.js` ← `public/crm-features-v20.js`
- `renderPharmaciesList`: تعریف/بازنویسی به ترتیب لود → `public/crm-features-v9.js` ← `public/crm-features-v19.js`
- `switchTab`: تعریف/بازنویسی به ترتیب لود → `public/crm-features-v9.js` ← `public/crm-features-v10.js` ← `public/crm-features-v11.js` ← `public/crm-features-v12.js` ← `public/crm-features-v13.js` ← `public/crm-jalali.js` ← `public/crm-features-v14.js` ← `public/crm-features-v15.js` ← `public/crm-features-v16.js` ← `public/crm-features-v17.js` ← `public/crm-features-v18.js` ← `public/crm-features-v19.js` ← `public/crm-features-v20.js`
- `validateRequiredFields`: تعریف/بازنویسی به ترتیب لود → `public/crm-app.js` ← `public/crm-features-v9.js` ← `public/crm-features-v11.js` ← `public/crm-features-v12.js` ← `public/crm-features-v18.js`
- `writeFieldSize`: تعریف/بازنویسی به ترتیب لود → `public/crm-features-v11.js` ← `public/crm-features-v15.js`

## د) گراف API (سرویس api ↔ مصرف‌کننده‌ها)

- `/api/backup` [GET] — مصرف‌کننده: —
- `/api/backup/email` [POST] — مصرف‌کننده: `public/crm-features-v20.js`
- `/api/geocode?q=` [؟] — مصرف‌کننده: `public/crm-app.js`
- `/api/health` [؟] — مصرف‌کننده: `public/crm-features-v10.js`, `public/crm-features-v19.js`
- `/api/reverse?lat=` [؟] — مصرف‌کننده: `public/crm-app.js`, `public/crm-features-v20.js`
- `/api/state` [GET] — مصرف‌کننده: `public/crm-features-v19.js`

## هـ) گراف حافظه مرورگر (کلید ↔ فایل‌های دست‌زننده)

- `CRM_APP_STATE_BACKUP_BEFORE_11_11_0` ← localStorage: `public/crm-app.js`
- `CRM_APP_STATE_BACKUP_LATEST` ← localStorage: `public/crm-features-v15.js`
- `CRM_APP_STATE_V2` ← localStorage: `public/crm-features-v10.js`, `public/crm-features-v15.js`, `public/crm-features-v19.js`
- `CRM_DIAG_LOG` ← localStorage: `public/crm-features-v11.js`
- `CRM_LAST_GPS` ← localStorage: `public/crm-features-v11.js`
- `CRM_SOFTEN_ABS_11_11_0` ← localStorage: `public/crm-features-v15.js`
- `CRM_USERS_AUTH` ← localStorage: `public/crm-features-v11.js`, `public/crm-features-v20.js`
- `crmLoggedIn` ← sessionStorage: `public/crm-app.js`, `public/crm-features-v10.js`, `public/crm-features-v19.js`, `public/crm-features-v20.js`, `public/crm-features-v9.js`
- `crmUserId` ← sessionStorage: `public/crm-features-v9.js`
- `crmUserName` ← sessionStorage: `public/crm-features-v10.js`, `public/crm-features-v11.js`, `public/crm-features-v19.js`, `public/crm-features-v20.js`
- `crmUserRole` ← sessionStorage: `public/crm-features-v10.js`, `public/crm-features-v11.js`, `public/crm-features-v19.js`, `public/crm-features-v20.js`
- `crmUsername` ← sessionStorage: `public/crm-features-v19.js`, `public/crm-features-v20.js`

## و) گراف تب‌ها (تب ↔ فایل‌هایی که با المان‌هایش کار می‌کنند)

### tab-activity-log «⏱️ فعالیت لحظه‌ای»
- `public/crm-app.js` → 2 شناسه (مثل: `btnRefreshActivity`, `tableActivityLogBody`)
- `public/crm-features-v11.js` → 2 شناسه (مثل: `activityChartBox`, `map-activity-log`)
- `public/crm-features-v9.js` → 1 شناسه (مثل: `activityChartBox`)

### tab-backup «💾 پشتیبان‌گیری»
- `public/crm-app.js` → 14 شناسه (مثل: `autoBackupHandleStatus`, `btnCancelRestore`, `btnConfirmRestore`, `btnManualBackupNow`, `btnSelectAutoBackupFolder`, `chkAutoBackupEnabled`, `dropzoneRestore`, `fileInputRestore`)
- `public/crm-features-v19.js` → 1 شناسه (مثل: `autoBackupHandleStatus`)
- `public/crm-features-v20.js` → 1 شناسه (مثل: `autoBackupHandleStatus`)
- `public/crm-features-v9.js` → 2 شناسه (مثل: `backupEmailInput`, `backupIntervalSelect`)

### tab-columns-products «🧱 ستون‌ها و کالاها»
- `public/crm-app.js` → 8 شناسه (مثل: `btnSaveProduct`, `formProduct`, `productDistPrice`, `productName`, `productPrice`, `productSavedBanner`, `productStock`, `tableProductsBody`)
- `public/crm-features-v11.js` → 1 شناسه (مثل: `columnsDesignerHost`)
- `public/crm-features-v12.js` → 1 شناسه (مثل: `columnsDesignerHost`)
- `public/crm-features-v14.js` → 2 شناسه (مثل: `btnSaveProduct`, `formProduct`)
- `public/crm-features-v16.js` → 1 شناسه (مثل: `columnsDesignerHost`)
- `public/crm-features-v18.js` → 1 شناسه (مثل: `columnsDesignerHost`)
- `public/crm-features-v19.js` → 3 شناسه (مثل: `columnsDesignerHost`, `formProduct`, `tableProductsBody`)
- `public/crm-features-v20.js` → 1 شناسه (مثل: `productName`)

### tab-custom-fields «➕ افزودن‌ها»
- `public/crm-app.js` → 9 شناسه (مثل: `cfAllowAddOption`, `cfLabel`, `cfOptions`, `cfOptionsWrapper`, `cfShowInForm`, `cfShowInList`, `cfTargetEntity`, `cfType`)
- `public/crm-features-v14.js` → 12 شناسه (مثل: `addTabGrid`, `addTabPanel`, `btnSaveCustomField`, `cfAllowAddOption`, `cfLabel`, `cfOptions`, `cfSaveStatus`, `cfShowInForm`)
- `public/crm-features-v15.js` → 10 شناسه (مثل: `btnSaveCustomField`, `cfAllowAddOption`, `cfLabel`, `cfOptions`, `cfSaveStatus`, `cfShowInForm`, `cfShowInList`, `cfTargetEntity`)
- `public/crm-features-v16.js` → 1 شناسه (مثل: `addTabPanel`)
- `public/crm-features-v20.js` → 2 شناسه (مثل: `addTabPanel`, `cfTargetEntity`)

### tab-dashboard «📊 داشبورد»
- `public/crm-app.js` → 2 شناسه (مثل: `dashboardLaunchpadGrid`, `map-dashboard-overview`)
- `public/crm-features-v10.js` → 4 شناسه (مثل: `btnAddDashWidget`, `dashboardChartsWidget`, `dashboardWidgetPicker`, `dashboardWidgetsHost`)
- `public/crm-features-v9.js` → 1 شناسه (مثل: `dashboardChartsWidget`)

### tab-doctors «👨‍⚕️ پزشکان»
- `public/crm-app.js` → 27 شناسه (مثل: `btnDocMapSearch`, `btnDocPercentageNo`, `btnDocPercentageYes`, `btnDoctorCurrentLocation`, `btnDoctorGetAddressFromPoint`, `btnExportDoctorsCSV`, `btnSaveDoctor`, `docFileDisplay`)
- `public/crm-features-v14.js` → 4 شناسه (مثل: `btnSaveDoctor`, `doctorEditId`, `doctorName`, `formDoctor`)
- `public/crm-features-v9.js` → 9 شناسه (مثل: `btnDocMapSearch`, `btnDoctorCurrentLocation`, `btnDoctorGetAddressFromPoint`, `cardDocList`, `docFileInput`, `formDoctor`, `searchDoctorInput`, `tableDoctorsBody`)

### tab-install-app «📲 نصب اپ»
- `public/crm-features-v9.js` → 3 شناسه (مثل: `btnInstallAndroid`, `btnInstallIos`, `btnInstallWindows`)

### tab-leaves «📝 مرخصی‌ها»
- `public/crm-app.js` → 9 شناسه (مثل: `btnExportLeavesCSV`, `leaveFromDate`, `leaveHoursGroup`, `leaveHoursInput`, `leaveReasonInput`, `leaveRepSelect`, `leaveToDate`, `leaveTypeSelect`)

### tab-live-location «📍 موقعیت زنده»
- `public/crm-app.js` → 1 شناسه (مثل: `map-live-reps`)
- `public/crm-features-v20.js` → 4 شناسه (مثل: `btnFindLiveRep`, `liveRepSearchSelect`, `tableLiveReps`, `tableLiveRepsBody`)
- `public/crm-features-v9.js` → 5 شناسه (مثل: `btnFindLiveRep`, `btnRefreshLiveMap`, `btnSimulateLiveMovement`, `liveRepSearchSelect`, `tableLiveRepsBody`)

### tab-manual-design «🎨 طراحی دستی تب‌ها»
- `public/crm-features-v12.js` → 1 شناسه (مثل: `manAddStatus`)
- `public/crm-features-v13.js` → 12 شناسه (مثل: `btnManCopy`, `btnManOpenTab`, `btnManReset`, `btnManSave`, `manAddStatus`, `manBoxMaker`, `manCopyFrom`, `manCopyTo`)
- `public/crm-features-v14.js` → 2 شناسه (مثل: `manCopyFrom`, `manCopyTo`)
- `public/crm-features-v15.js` → 1 شناسه (مثل: `manualDesignCanvas`)
- `public/crm-features-v16.js` → 1 شناسه (مثل: `manualDesignCanvas`)
- `public/crm-features-v17.js` → 1 شناسه (مثل: `manualDesignCanvas`)
- `public/crm-features-v18.js` → 6 شناسه (مثل: `manCopyFrom`, `manCopyModeAll`, `manCopyModePart`, `manCopyPickList`, `manCopyTo`, `manualDesignCanvas`)

### tab-messengers «💬 پیام‌رسان‌ها»
- `public/crm-features-v20.js` → 1 شناسه (مثل: `messengerTogglesBox`)
- `public/crm-features-v9.js` → 1 شناسه (مثل: `messengerTogglesBox`)

### tab-monthly-reports «📈 گزارش ماهانه»
- `public/crm-app.js` → 2 شناسه (مثل: `btnExportMonthlyCSV`, `tableMonthlyReportsBody`)

### tab-my-visit «▶️ شروع/پایان ویزیت»
- `public/crm-features-v11.js` → 4 شناسه (مثل: `btnEndVisit`, `btnStartVisit`, `map-my-visit`, `visitStatusBox`)
- `public/crm-features-v20.js` → 3 شناسه (مثل: `btnEndVisit`, `btnStartVisit`, `visitStatusBox`)

### tab-notifications «🔔 اعلان‌ها»
- `public/crm-app.js` → 5 شناسه (مثل: `formSendMessage`, `msgBodyInput`, `msgRecipientSelect`, `msgTitleInput`, `tableNotificationsBody`)

### tab-orders «📦 سفارشات»
- `public/crm-app.js` → 30 شناسه (مثل: `btnAddOrderItemRow`, `btnExportOrdersCSV`, `btnResetOrderForm`, `btnSaveOrder`, `btnTopAutoFillPharmacy`, `existingPharmacyAlertText`, `existingPharmacyTopAlert`, `formOrder`)
- `public/crm-features-v11.js` → 1 شناسه (مثل: `orderItemsContainer`)
- `public/crm-features-v14.js` → 12 شناسه (مثل: `btnSaveOrder`, `existingPharmacyAlertText`, `existingPharmacyTopAlert`, `formOrder`, `orderAddress`, `orderCity`, `orderDistrict`, `orderEditId`)
- `public/crm-features-v15.js` → 3 شناسه (مثل: `orderPharmacyName`, `orderPharmacyPickBox`, `orderTotalAmountDisplay`)
- `public/crm-features-v17.js` → 9 شناسه (مثل: `existingPharmacyAlertText`, `existingPharmacyTopAlert`, `orderAddress`, `orderCity`, `orderDistrict`, `orderPharmacyMatchedId`, `orderPharmacyName`, `orderPharmacyPickBox`)
- `public/crm-features-v19.js` → 2 شناسه (مثل: `orderEditId`, `orderItemsContainer`)
- `public/crm-features-v20.js` → 10 شناسه (مثل: `btnSaveOrder`, `btnTopAutoFillPharmacy`, `existingPharmacyTopAlert`, `formOrder`, `orderCity`, `orderDistrict`, `orderEditId`, `orderPharmacyMatchedId`)
- `public/crm-features-v9.js` → 7 شناسه (مثل: `cardOrdList`, `formOrder`, `ordListCountBadge`, `orderItemsContainer`, `searchOrderInput`, `tableOrdersBody`, `tableOrdersHeader`)

### tab-overview-map «🗺️ نقشه جامع»
- `public/crm-app.js` → 4 شناسه (مثل: `btnFocusMapRegion`, `map-full-overview`, `mapFilterCity`, `mapFilterProvince`)
- `public/crm-features-v11.js` → 5 شناسه (مثل: `btnFocusMapRegion`, `mapFilterCity`, `mapFilterDistrict`, `mapFilterProvince`, `overviewResultsTableWrap`)
- `public/crm-features-v9.js` → 8 شناسه (مثل: `btnExportOverviewMapCSV`, `btnFocusMapRegion`, `cntOverviewDoctors`, `cntOverviewHospitals`, `cntOverviewPharmacies`, `mapFilterCity`, `mapFilterDistrict`, `mapFilterProvince`)

### tab-pharmacies «🏥 داروخانه‌ها»
- `public/crm-app.js` → 29 شناسه (مثل: `btnExportPharmaciesCSV`, `btnPhMapSearch`, `btnPhPercentageNo`, `btnPhPercentageYes`, `btnPharmacyCurrentLocation`, `btnPharmacyGetAddressFromPoint`, `btnSavePharmacy`, `formPharmacy`)
- `public/crm-features-v11.js` → 1 شناسه (مثل: `phMapSearchInput`)
- `public/crm-features-v14.js` → 4 شناسه (مثل: `btnSavePharmacy`, `formPharmacy`, `pharmacyEditId`, `pharmacyName`)
- `public/crm-features-v16.js` → 8 شناسه (مثل: `formPharmacy`, `pharmacyAddress`, `pharmacyCity`, `pharmacyDistrict`, `pharmacyEditId`, `pharmacyName`, `pharmacyPhone`, `pharmacyProvince`)
- `public/crm-features-v17.js` → 8 شناسه (مثل: `btnSavePharmacy`, `formPharmacy`, `pharmacyAddress`, `pharmacyCity`, `pharmacyDistrict`, `pharmacyName`, `pharmacyPhone`, `pharmacyProvince`)
- `public/crm-features-v9.js` → 11 شناسه (مثل: `btnPhMapSearch`, `btnPharmacyCurrentLocation`, `btnPharmacyGetAddressFromPoint`, `cardPhList`, `formPharmacy`, `phFileInput`, `phListCountBadge`, `phTableCountBadge`)

### tab-rep-homes «🏠 منزل نمایندگان»
- `public/crm-app.js` → 1 شناسه (مثل: `tableRepHomesBody`)
- `public/crm-features-v9.js` → 2 شناسه (مثل: `btnRepHomeCurrentLocation`, `repHomeSelect`)

### tab-rep-routes «🛣️ رصد تردد»
- `public/crm-app.js` → 1 شناسه (مثل: `tableRepRoutesBody`)
- `public/crm-features-v20.js` → 3 شناسه (مثل: `btnRefreshRepRoutesMap`, `routeRepFilterSelect`, `tableRepRoutesBody`)
- `public/crm-features-v9.js` → 3 شناسه (مثل: `btnRefreshRepRoutesMap`, `routeRepFilterSelect`, `tableRepRoutesBody`)

### tab-sales-targets «🎯 تارگت فروش»
- `public/crm-app.js` → 9 شناسه (مثل: `formSalesTarget`, `tableSalesTargetsBody`, `tgtCalcDistPrice`, `tgtCalcPhPrice`, `tgtCountInput`, `tgtMonthSelect`, `tgtProductSelect`, `tgtRepSelect`)
- `public/crm-features-v10.js` → 6 شناسه (مثل: `tgtCalcDistPrice`, `tgtCalcPhPrice`, `tgtCountInput`, `tgtProductSelect`, `tgtSummaryBox`, `tgtYearInput`)
- `public/crm-features-v20.js` → 3 شناسه (مثل: `formSalesTarget`, `tableSalesTargetsBody`, `tgtSummaryBox`)

### tab-search-info «🔍 جستجوی اطلاعات»
- `public/crm-app.js` → 38 شناسه (مثل: `btnExportSearchInfoCSV`, `btnNavBalad`, `btnNavGoogle`, `btnNavNeshan`, `btnNavWaze`, `btnRowCopyText`, `btnRowDelete`, `btnRowEdit`)
- `public/crm-features-v20.js` → 2 شناسه (مثل: `btnRowCopyText`, `rowDetailsContentBox`)
- `public/crm-features-v9.js` → 3 شناسه (مثل: `formLoginModal`, `jalaliCalendarPopup`, `jalaliTodayBtn`)
- `public/crm-jalali.js` → 7 شناسه (مثل: `jalaliCalendarPopup`, `jalaliDaysGrid`, `jalaliMonthSelect`, `jalaliNextMonth`, `jalaliPrevMonth`, `jalaliTodayBtn`, `jalaliYearSelect`)

### tab-snapp-corporate «🚕 اسنپ سازمانی»
- `public/crm-features-v20.js` → 24 شناسه (مثل: `btnBuildSnappReport`, `btnBuildSnappTopupReport`, `btnExportSnappTopups`, `btnExportSnappView`, `btnOpenSnappCorporate`, `snappDailyStatus`, `snappFilterFrom`, `snappFilterMonth`)

### tab-troubleshooting «🛠️ عیب‌یابی»
- `public/crm-app.js` → 1 شناسه (مثل: `diagnosticsStatusBox`)
- `public/crm-features-v10.js` → 2 شناسه (مثل: `diagnosticsStatusBox`, `diagnosticsVisual`)
- `public/crm-features-v11.js` → 1 شناسه (مثل: `diagnosticsOpsLog`)
- `public/crm-features-v19.js` → 2 شناسه (مثل: `diagnosticsStatusBox`, `diagnosticsVisual`)

### tab-users-permissions «👤 کاربران و دسترسی»
- `public/crm-app.js` → 14 شناسه (مثل: `btnExportUsersCSV`, `btnPermSelectAll`, `btnPermSelectNone`, `btnToggleShowAllPasswords`, `formCreateUser`, `newFullName`, `newPassword`, `newPhone`)

## ز) نام‌های تابع تکراری در چند فایل (نقاط حساس بازنویسی)

- `$` ← `public/crm-features-v10.js`, `public/crm-features-v11.js`, `public/crm-features-v12.js`, `public/crm-features-v13.js`, `public/crm-features-v14.js`, `public/crm-features-v15.js`, `public/crm-features-v16.js`, `public/crm-features-v17.js`, `public/crm-features-v18.js`, `public/crm-features-v19.js`, `public/crm-features-v20.js`, `public/crm-features-v9.js`, `public/crm-jalali.js`
- `apply` ← `public/crm-app.js`, `public/crm-features-v12.js`
- `arr` ← `public/crm-features-v18.js`, `public/crm-features-v20.js`
- `attach` ← `public/crm-features-v14.js`, `public/crm-features-v9.js`
- `boot` ← `public/crm-features-v10.js`, `public/crm-features-v11.js`, `public/crm-features-v12.js`, `public/crm-features-v13.js`, `public/crm-features-v14.js`, `public/crm-features-v15.js`, `public/crm-features-v16.js`, `public/crm-features-v17.js`, `public/crm-features-v18.js`, `public/crm-features-v19.js`, `public/crm-features-v9.js`, `public/crm-jalali.js`
- `c` ← `public/crm-features-v11.js`, `public/crm-features-v16.js`
- `custom` ← `public/crm-features-v15.js`, `public/crm-features-v20.js`
- `customs` ← `public/crm-features-v11.js`, `public/crm-features-v19.js`
- `doc` ← `public/crm-app.js`, `public/crm-features-v10.js`
- `esc` ← `public/crm-features-v11.js`, `public/crm-features-v12.js`, `public/crm-features-v13.js`, `public/crm-features-v14.js`, `public/crm-features-v16.js`, `public/crm-features-v17.js`, `public/crm-features-v18.js`, `public/crm-features-v19.js`, `public/crm-features-v20.js`
- `fieldKeyForTab` ← `public/crm-features-v11.js`, `public/crm-features-v13.js`, `public/crm-features-v14.js`, `public/crm-features-v18.js`, `public/crm-features-v19.js`
- `fields` ← `public/crm-app.js`, `public/crm-features-v11.js`, `public/crm-features-v12.js`, `public/crm-features-v20.js`
- `fill` ← `public/crm-features-v10.js`, `public/crm-features-v13.js`
- `hits` ← `public/crm-features-v14.js`, `public/crm-features-v16.js`, `public/crm-features-v17.js`
- `lab` ← `public/crm-features-v11.js`, `public/crm-features-v18.js`, `public/crm-features-v19.js`, `public/crm-features-v20.js`
- `label` ← `public/crm-features-v11.js`, `public/crm-features-v14.js`, `public/crm-features-v15.js`
- `last` ← `public/crm-features-v18.js`, `public/crm-features-v19.js`
- `lay` ← `public/crm-features-v13.js`, `public/crm-features-v18.js`
- `main` ← `scripts/build-sw.mjs`, `scripts/clean-extra-files.mjs`, `scripts/generate-assets.mjs`, `scripts/start.mjs`
- `meta` ← `public/crm-features-v11.js`, `public/crm-features-v15.js`, `public/crm-features-v17.js`, `public/crm-features-v18.js`, `public/crm-features-v19.js`
- `name` ← `public/crm-app.js`, `public/crm-features-v11.js`, `public/crm-features-v12.js`, `public/crm-features-v13.js`, `public/crm-features-v15.js`, `public/crm-features-v16.js`, `public/crm-features-v17.js`
- `norm` ← `scripts/clean-extra-files.mjs`, `public/crm-features-v16.js`, `public/crm-features-v20.js`
- `optionsStr` ← `public/crm-features-v14.js`, `public/crm-features-v15.js`
- `opts` ← `public/crm-features-v11.js`, `public/crm-features-v14.js`
- `p` ← `public/cloudflare-worker.js`, `public/crm-features-v10.js`, `public/crm-features-v11.js`, `public/crm-features-v16.js`
- `ph` ← `public/crm-app.js`, `public/crm-features-v10.js`, `public/crm-features-v20.js`, `public/crm-features-v9.js`
- `prod` ← `public/crm-app.js`, `public/crm-features-v9.js`
- `push` ← `public/crm-features-v14.js`, `public/crm-features-v19.js`
- `q` ← `public/crm-features-v17.js`, `public/crm-features-v9.js`
- `rec` ← `scripts/clean-extra-files.mjs`, `public/crm-features-v12.js`, `public/crm-features-v14.js`, `public/crm-features-v16.js`, `public/crm-features-v17.js`, `public/crm-features-v20.js`
- `tab` ← `public/crm-features-v12.js`, `public/crm-features-v14.js`
- `take` ← `public/crm-features-v13.js`, `public/crm-features-v18.js`
- `tgt` ← `public/crm-app.js`, `public/crm-features-v9.js`
- `type` ← `public/crm-features-v14.js`, `public/crm-features-v15.js`
- `u` ← `public/crm-features-v11.js`, `public/crm-features-v20.js`
- `users` ← `public/crm-app.js`, `public/crm-features-v20.js`, `public/crm-features-v9.js`
- `ut` ← `public/crm-features-v11.js`, `public/crm-features-v12.js`, `public/crm-features-v13.js`, `public/crm-features-v14.js`, `public/crm-features-v18.js`, `public/crm-features-v19.js`
- `v` ← `public/crm-features-v12.js`, `public/crm-features-v16.js`, `public/crm-features-v17.js`, `public/crm-jalali.js`
- `val` ← `public/crm-app.js`, `public/crm-features-v9.js`
- `w` ← `public/crm-features-v18.js`, `public/crm-features-v20.js`
- `wrapListRenderers` ← `public/crm-features-v19.js`, `public/crm-features-v20.js`

## ح) هشدارهای دائمی معماری

- `public/crm-app.js` دو نسل کد فرم دارد؛ هر تغییر رفتاری فرم باید در هر دو نسل + مسیر فعال v9 جفت شود.
- آخرین لایه (crm-features-v20.js) برنده نهایی بازنویسی‌هاست؛ اسکریپت‌های بعد از آن نباید بیایند مگر با افزودن به انتهای زنجیره.
- اسکلت Next.js در `src/` خفته است؛ ورودی اصلی `server.js` + `public/` است.
