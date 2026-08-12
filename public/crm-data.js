// Minimal valid CRM seed data. Extracted PDF had corrupted Persian string wrapping.
const IRAN_GEO_DATA = {
  "تهران": {
    "تهران": ["منطقه ۱", "منطقه ۲", "منطقه ۳", "منطقه ۴", "منطقه ۵", "منطقه ۶", "منطقه ۷", "منطقه ۸", "منطقه ۹", "منطقه ۱۰", "منطقه ۱۱", "منطقه ۱۲", "منطقه ۱۳", "منطقه ۱۴", "منطقه ۱۵", "منطقه ۱۶", "منطقه ۱۷", "منطقه ۱۸", "منطقه ۱۹", "منطقه ۲۰", "منطقه ۲۱", "منطقه ۲۲"],
    "اسلامشهر": ["مرکزی", "چهاردانگه"],
    "ورامین": ["مرکزی", "جوادآباد"],
    "ری": ["مرکزی", "کهریزک"]
  },
  "البرز": {
    "کرج": ["مرکزی", "مهرشهر", "عظیمیه", "گوهردشت"],
    "فردیس": ["مرکزی", "شهرک ناز"]
  },
  "اصفهان": {
    "اصفهان": ["مرکزی", "خمینی‌شهر", "نظرآباد"],
    "کاشان": ["مرکزی", "مشهد اردهال"]
  },
  "فارس": {
    "شیراز": ["مرکزی", "معالی‌آباد", "قصرالدشت"],
    "مرودشت": ["مرکزی", "سیدان"]
  },
  "خراسان رضوی": {
    "مشهد": ["مرکزی", "احمدآباد", "سجادشهر"],
    "نیشابور": ["مرکزی", "فضل"]
  },
  "آذربایجان شرقی": {
    "تبریز": ["مرکزی", "ولیعصر", "ابوریحان"],
    "مراغه": ["مرکزی", "سراجو"]
  },
  "خوزستان": {
    "اهواز": ["مرکزی", "کیانپارس", "نادری"],
    "آبادان": ["مرکزی", "بوارده"]
  },
  "قم": {"قم": ["مرکزی", "پردیسان", "بنفشه"]},
  "یزد": {"یزد": ["مرکزی", "صفاییه", "امامشهر"]},
  "گیلان": {"رشت": ["مرکزی", "گلسار", "لاکان"]},
  "مازندران": {"ساری": ["مرکزی", "راهبند"], "بابل": ["مرکزی", "امیرکلا"]}
};

const PERMISSION_GROUPS = {
  "داشبورد و گزارش‌ها": [
    { key: "dashboard", label: "مشاهده داشبورد" },
    { key: "reports", label: "گزارش‌ها و نمودارها" }
  ],
  "ثبت اطلاعات": [
    { key: "pharmacies", label: "داروخانه‌ها" },
    { key: "doctors", label: "پزشکان" },
    { key: "orders", label: "سفارشات" },
    { key: "targets", label: "تارگت فروش" }
  ],
  "نقشه و رصد": [
    { key: "map", label: "نقشه جامع" },
    { key: "live", label: "موقعیت لحظه‌ای" },
    { key: "trips", label: "رصد تردد" },
    { key: "homes", label: "منزل نمایندگان" }
  ],
  "مدیریت سیستم": [
    { key: "users", label: "کاربران و دسترسی‌ها" },
    { key: "columns", label: "ستون‌ها و کالاها" },
    { key: "backup", label: "پشتیبان‌گیری" },
    { key: "settings", label: "تنظیمات" }
  ]
};

function getDefaultPermissionsObject(allowAll = true) {
  const obj = {};
  Object.values(PERMISSION_GROUPS).flat().forEach(item => { obj[item.key] = allowAll; });
  return obj;
}

const DEFAULT_INITIAL_DATA = {
  reps: [
    { id: "rep-1", name: "جواد طاهری", region: "تهران", status: "online", lat: 35.73, lng: 51.42 },
    { id: "rep-2", name: "نیلا احمدی", region: "البرز", status: "offline", lat: 35.84, lng: 50.99 }
  ],
  visits: [
    { id: "visit-1", repName: "جواد طاهری", date: "1405/05/19", pharmacy: "داروخانه مرکزی", status: "ویزیت شد" }
  ],
  pharmacies: [
    { id: "ph-1", dateAdded: "1405/05/19", name: "داروخانه مرکزی", phone: "02188776655", manager: "مدیر آزمایشی", province: "تهران", city: "تهران", district: "منطقه ۶", address: "تهران، خیابان آزمایشی", lat: 35.721, lng: 51.42, isPercentage: true, repName: "جواد طاهری", customFields: {} }
  ],
  doctors: [
    { id: "doc-1", dateAdded: "1405/05/19", name: "دکتر علی محمدی", specialty: "قلب", phone: "02112345678", province: "تهران", city: "تهران", district: "منطقه ۳", address: "مطب نمونه", lat: 35.75, lng: 51.44, isPercentage: false, repName: "نیلا احمدی", customFields: {} }
  ],
  orders: [
    { id: "ord-1", pharmacyName: "داروخانه مرکزی", province: "تهران", city: "تهران", district: "منطقه ۶", address: "تهران", repName: "جواد طاهری", orderDate: "1405/05/19", status: "تحویل شده", notes: "", items: [{ name: "کپسول نمونه", count: 50, giftCount: 5, price: 250000 }], totalAmount: 12500000, customFields: {} }
  ],
  users: [
    { id: "u-1", fullName: "مدیر سیستم", username: "admin", password: "123", phone: "09120000000", role: "مدیر", simControl: "غیرفعال", phoneLock: "بدون محدودیت", lastLogin: "1405/05/19 - 12:55", permissions: getDefaultPermissionsObject(true) },
    { id: "u-2", fullName: "جواد طاهری", username: "Taheri", password: "456", phone: "09120852097", role: "نماینده", simControl: "فعال", phoneLock: "Chrome Windows", lastLogin: "1405/05/18 - 15:41", permissions: getDefaultPermissionsObject(false) }
  ],
  activityLog: [
    { id: "act-1", time: "14:35", repName: "جواد طاهری", action: "ثبت داروخانه جدید" },
    { id: "act-2", time: "13:10", repName: "نیلا احمدی", action: "ثبت ویزیت پزشک" }
  ],
  repHomes: [
    { id: "home-1", repName: "جواد طاهری", address: "تهران، منزل نمونه", lat: 35.755, lng: 51.435 }
  ],
  repRoutes: [
    { id: "rt-1", repName: "جواد طاهری", date: "1405/05/19", checkpoint: "شروع مسیر - داروخانه مرکزی", status: "انجام شد", points: [[35.72,51.42],[35.73,51.43],[35.74,51.425]] }
  ],
  leaves: [
    { id: "lv-1", repName: "نیلا احمدی", fromDate: "1405/05/22", toDate: "1405/05/24", reason: "مرخصی استحقاقی", supervisorStatus: "تأیید نشده", adminStatus: "تأیید نشده", status: "در انتظار" }
  ],
  notifications: [
    { id: "not-1", date: "1405/05/19", title: "خوش آمدید", message: "سامانه آماده است.", sender: "مدیر", recipient: "همه", isRead: false }
  ],
  salesTargets: [],
  messengers: { smsEnabled: true, autoSend: false, manualSend: true, telegramToken: "", whatsappNumber: "", eitaaChannel: "" },
  products: [
    { id: "prod-1", name: "کپسول نمونه", category: "دارو", distributorPrice: 40000, pharmacyPrice: 45000, stock: 5000 }
  ],
  customFields: { pharmacy: [], doctor: [], order: [] },
  settings: {
    companyName: "سامانه مدیریت نمایندگان علمی",
    apiEndpointUrl: "/api/state",
    defaultMapLat: 35.72,
    defaultMapLng: 51.42,
    currencyUnit: "ریال",
    autoBackupEnabled: true,
    autoBackupIntervalMinutes: 5,
    lastBackupTime: null,
    dashboardWidgets: ["stats", "charts", "map"]
  }
};
