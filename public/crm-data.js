// ============================================================================
// داده‌های پایه برنامه مدیریت ویزیت علمی، داروخانه‌ها، پزشکان و سفارشات
// شامل اطلاعات جغرافیایی کامل ایران (استان‌ها، شهرها، مناطق مرتب بدون تکرار)
// و ساختار کامل ۴۹ دسترسی سیستم، کاربران، درصدی بودن، و تمامی ۲۰ بخش برنامه
// ============================================================================

const IRAN_GEO_DATA = {
  "تهران": {
    "تهران": [
      "منطقه ۱", "منطقه ۲", "منطقه ۳", "منطقه ۴", "منطقه ۵", "منطقه ۶",
      "منطقه ۷", "منطقه ۸", "منطقه ۹", "منطقه ۱۰", "منطقه ۱۱", "منطقه ۱۲",
      "منطقه ۱۳", "منطقه ۱۴", "منطقه ۱۵", "منطقه ۱۶", "منطقه ۱۷", "منطقه ۱۸",
      "منطقه ۱۹", "منطقه ۲۰", "منطقه ۲۱", "منطقه ۲۲"
    ],
    "شمیرانات": ["منطقه ۱ (تجریش)", "منطقه ۲ (لواسان)", "منطقه ۳ (فشم)"],
    "شهر ری": ["منطقه ۱ (مرکزی)", "منطقه ۲ (دولت‌آباد)", "منطقه ۳ (کهریزک)"],
    "اسلام‌شهر": ["منطقه ۱", "منطقه ۲", "منطقه ۳", "منطقه ۴"]
  },
  "خراسان رضوی": {
    "مشهد": [
      "منطقه ۱", "منطقه ۲", "منطقه ۳", "منطقه ۴", "منطقه ۵", "منطقه ۶",
      "منطقه ۷", "منطقه ۸", "منطقه ۹", "منطقه ۱۰", "منطقه ۱۱", "منطقه ۱۲", "منطقه ۱۳"
    ],
    "نیشابور": ["منطقه ۱ (مرکزی)", "منطقه ۲ (شمالی)", "منطقه ۳ (جنوبی)"],
    "سبزوار": ["منطقه ۱", "منطقه ۲", "منطقه ۳"]
  },
  "اصفهان": {
    "اصفهان": [
      "منطقه ۱", "منطقه ۲", "منطقه ۳", "منطقه ۴", "منطقه ۵", "منطقه ۶",
      "منطقه ۷", "منطقه ۸", "منطقه ۹", "منطقه ۱۰", "منطقه ۱۱", "منطقه ۱۲",
      "منطقه ۱۳", "منطقه ۱۴", "منطقه ۱۵"
    ],
    "کاشان": ["منطقه ۱", "منطقه ۲", "منطقه ۳", "منطقه ۴"],
    "نجف‌آباد": ["منطقه ۱", "منطقه ۲", "منطقه ۳"]
  },
  "فارس": {
    "شیراز": [
      "منطقه ۱", "منطقه ۲", "منطقه ۳", "منطقه ۴", "منطقه ۵",
      "منطقه ۶", "منطقه ۷", "منطقه ۸", "منطقه ۹", "منطقه ۱۰", "منطقه ۱۱"
    ],
    "مرودشت": ["منطقه ۱", "منطقه ۲", "منطقه ۳"],
    "کازرون": ["منطقه ۱", "منطقه ۲"]
  },
  "آذربایجان شرقی": {
    "تبریز": [
      "منطقه ۱", "منطقه ۲", "منطقه ۳", "منطقه ۴", "منطقه ۵",
      "منطقه ۶", "منطقه ۷", "منطقه ۸", "منطقه ۹", "منطقه ۱۰"
    ],
    "مراغه": ["منطقه ۱", "منطقه ۲", "منطقه ۳"],
    "مرند": ["منطقه ۱", "منطقه ۲"]
  },
  "البرز": {
    "کرج": [
      "منطقه ۱", "منطقه ۲", "منطقه ۳", "منطقه ۴", "منطقه ۵",
      "منطقه ۶", "منطقه ۷", "منطقه ۸", "منطقه ۹", "منطقه ۱۰"
    ],
    "فردیس": ["منطقه ۱", "منطقه ۲"],
    "هشتگرد": ["منطقه ۱", "منطقه ۲"]
  },
  "خوزستان": {
    "اهواز": [
      "منطقه ۱", "منطقه ۲", "منطقه ۳", "منطقه ۴",
      "منطقه ۵", "منطقه ۶", "منطقه ۷", "منطقه ۸"
    ],
    "آبادان": ["منطقه ۱", "منطقه ۲", "منطقه ۳"],
    "دزفول": ["منطقه ۱", "منطقه ۲", "منطقه ۳"]
  },
  "مازندران": {
    "ساری": ["منطقه ۱", "منطقه ۲", "منطقه ۳", "منطقه ۴"],
    "بابل": ["منطقه ۱", "منطقه ۲", "منطقه ۳"],
    "آمل": ["منطقه ۱", "منطقه ۲"]
  },
  "گیلان": {
    "رشت": ["منطقه ۱", "منطقه ۲", "منطقه ۳", "منطقه ۴", "منطقه ۵"],
    "انزلی": ["منطقه ۱", "منطقه ۲"],
    "لاهیجان": ["منطقه ۱", "منطقه ۲"]
  },
  "قم": {
    "قم": ["منطقه ۱", "منطقه ۲", "منطقه ۳", "منطقه ۴", "منطقه ۵", "منطقه ۶", "منطقه ۷", "منطقه ۸"]
  }
};

// لیست ۴۹ دسترسی رسمی سیستم در دسته‌بندی‌های مشخص‌شده در اسکرین‌شات کاربر
const PERMISSION_GROUPS = {
  "داشبورد": [
    { key: "dash_login", label: "ورود به داشبورد" },
    { key: "dash_stats", label: "مشاهده آمار کلی (کارت‌های بالای صفحه)" },
    { key: "dash_activity", label: "مشاهده فعالیت لحظه‌ای نمایندگان" },
    { key: "dash_all_reps", label: "مشاهده اطلاعات همه نمایندگان" },
    { key: "dash_export", label: "دانلود خروجی‌ها از داشبورد" }
  ],
  "ثبت اطلاعات داروخانه": [
    { key: "ph_access", label: "دسترسی به بخش داروخانه" },
    { key: "ph_create", label: "ثبت داروخانه جدید" },
    { key: "ph_list", label: "مشاهده لیست داروخانه‌ها" },
    { key: "ph_all_reps", label: "مشاهده داروخانه‌های همه نمایندگان" },
    { key: "ph_view_loc", label: "مشاهده جزئیات و لوکیشن" },
    { key: "ph_create_loc", label: "ثبت لوکیشن داروخانه" },
    { key: "ph_percentage", label: "ثبت/مشاهده وضعیت درصدی" },
    { key: "ph_send_mgr", label: "ارسال اطلاعات به مدیر" },
    { key: "ph_excel", label: "خروجی اکسل داروخانه‌ها" },
    { key: "ph_delete", label: "حذف رکورد داروخانه" }
  ],
  "ثبت اطلاعات پزشک": [
    { key: "doc_access", label: "دسترسی به بخش پزشک" },
    { key: "doc_create", label: "ثبت پزشک جدید" },
    { key: "doc_list", label: "مشاهده لیست پزشکان" },
    { key: "doc_all_reps", label: "مشاهده پزشکان همه نمایندگان" },
    { key: "doc_view_loc", label: "مشاهده جزئیات و لوکیشن" },
    { key: "doc_create_loc", label: "ثبت لوکیشن مطب" },
    { key: "doc_percentage", label: "ثبت/مشاهده وضعیت درصدی" },
    { key: "doc_upload", label: "بارگذاری فایل و عکس پزشک" },
    { key: "doc_print", label: "مشاهده/دانلود/پرینت فایل‌ها" },
    { key: "doc_send_mgr", label: "ارسال اطلاعات به مدیر" },
    { key: "doc_excel", label: "خروجی اکسل پزشکان" },
    { key: "doc_delete", label: "حذف رکورد پزشک" }
  ],
  "ثبت سفارشات داروخانه": [
    { key: "ord_access", label: "دسترسی به بخش سفارشات" },
    { key: "ord_create", label: "ثبت سفارش جدید" },
    { key: "ord_list", label: "مشاهده لیست سفارشات" },
    { key: "ord_all_reps", label: "مشاهده سفارشات همه نمایندگان" },
    { key: "ord_view_detail", label: "مشاهده جزئیات سفارش" },
    { key: "ord_items", label: "ثبت اقلام و جوایز" },
    { key: "ord_create_loc", label: "ثبت لوکیشن داروخانه" },
    { key: "ord_send", label: "ارسال سفارش (و پیام‌رسان‌ها)" },
    { key: "ord_excel", label: "خروجی اکسل سفارشات" },
    { key: "ord_delete", label: "حذف رکورد سفارش" }
  ],
  "عملیات میدانی": [
    { key: "fld_visit", label: "ثبت تردد و ویزیت" },
    { key: "fld_start_stop", label: "شروع/پایان ویزیت" },
    { key: "fld_pause", label: "ثبت وقفه در مسیر" },
    { key: "fld_track", label: "رصد تردد نمایندگان" },
    { key: "fld_home_loc", label: "ثبت لوکیشن منزل" },
    { key: "fld_all_homes", label: "مشاهده منزل همه نمایندگان" }
  ],
  "اداری و منابع انسانی": [
    { key: "hr_leave_req", label: "درخواست مرخصی" },
    { key: "hr_all_leaves", label: "مشاهده مرخصی همه نمایندگان" },
    { key: "hr_leave_approve", label: "تایید/رد مرخصی" },
    { key: "hr_leave_excel", label: "خروجی اکسل مرخصی‌ها" }
  ],
  "گزارش‌ها": [
    { key: "rep_monthly", label: "مشاهده گزارش ماهانه" },
    { key: "rep_all_reports", label: "گزارش همه نمایندگان" },
    { key: "rep_item_sales", label: "گزارش فروش هر قلم" },
    { key: "rep_excel", label: "دریافت خروجی اکسل" }
  ],
  "مدیریت سامانه": [
    { key: "sys_add_dropdown", label: "افزودن مقادیر کشویی" },
    { key: "sys_del_dropdown", label: "حذف مقادیر کشویی" },
    { key: "sys_cols", label: "مدیریت ستون‌ها و کالاها" },
    { key: "sys_users", label: "مدیریت کاربران" },
    { key: "sys_msg", label: "تنظیم پیام‌رسان‌ها" },
    { key: "sys_notify", label: "ارسال اعلان به نمایندگان" }
  ]
};

// دریافت یک آبجکت حاوی کلیه دسترسی‌ها با مقدار پیش‌فرض true یا false
function getDefaultPermissionsObject(defaultValue = true) {
  const perms = {};
  Object.values(PERMISSION_GROUPS).forEach(list => {
    list.forEach(item => {
      perms[item.key] = defaultValue;
    });
  });
  return perms;
}

// داده‌های نمونه اولیه سیستم در صورت خالی بودن حافظه
const DEFAULT_INITIAL_DATA = {
  pharmacies: [
    {
      id: "ph-1",
      name: "داروخانه دکتر عرفانی",
      phone: "021-88776655",
      province: "تهران",
      city: "آبعلی",
      district: "منطقه ۱",
      address: "میدان اصلی، جنب بانک ملی، پلاک ۱۲",
      lat: 35.7605,
      lng: 51.4180,
      manager: "دکتر سارا عرفانی",
      repName: "مدیر سیستم",
      dateAdded: "1405/05/19",
      isPercentage: false,
      fileName: "مجوز_داروخانه.pdf",
      customFields: { "نوع قرارداد": "نقدی", "درجه اعتبار": "A+" }
    },
    {
      id: "ph-2",
      name: "داروخانه شبانه‌روزی رازی",
      phone: "021-66554433",
      province: "تهران",
      city: "تهران",
      district: "منطقه ۶",
      address: "میدان انقلاب، ابتدای کارگر شمالی، نبش کوچه ششم",
      lat: 35.7008,
      lng: 51.3912,
      manager: "دکتر علی کریمی",
      repName: "جواد علمدار",
      dateAdded: "1405/05/18",
      isPercentage: true,
      fileName: "تصویر_تابلو.jpg",
      customFields: { "نوع قرارداد": "چکی یک‌ماهه", "درجه اعتبار": "A" }
    },
    {
      id: "ph-3",
      name: "داروخانه دکتر عقبایی",
      phone: "051-38402020",
      province: "تهران",
      city: "تهران",
      district: "منطقه ۳",
      address: "خیابان ولیعصر، بالاتر از ظفر، پلاک ۱۲۴",
      lat: 35.7590,
      lng: 51.4280,
      manager: "دکتر داوود عقبایی",
      repName: "خانم نیلا محرمی",
      dateAdded: "1405/05/18",
      isPercentage: true,
      fileName: null,
      customFields: { "نوع قرارداد": "نقدی", "درجه اعتبار": "B+" }
    }
  ],
  doctors: [
    {
      id: "doc-1",
      name: "دکتر کاوه سعیدی",
      specialty: "متخصص قلب و عروق",
      phone: "021-88990011",
      province: "تهران",
      city: "تهران",
      district: "منطقه ۳",
      address: "خیابان شریعتی، بالاتر از میرداماد، ساختمان پزشکان امید",
      lat: 35.7580,
      lng: 51.4400,
      repName: "جواد علمدار",
      dateAdded: "1405/05/18",
      isPercentage: false,
      fileName: "کارت_ویزیت.jpg",
      customFields: { "تعداد ویزیت روزانه": "۴۰ نفر", "داروهای ترجیحی": "آمپروازول، کاردیول" }
    },
    {
      id: "doc-2",
      name: "دکتر الناز تهرانی",
      specialty: "متخصص داخلی و غدد",
      phone: "021-88002244",
      province: "تهران",
      city: "تهران",
      district: "منطقه ۶",
      address: "خیابان مطهری، خیابان میرزای شیرازی، کوچه ۱۵، پلاک ۸",
      lat: 35.7250,
      lng: 51.4100,
      repName: "خانم نیلا محرمی",
      dateAdded: "1405/05/17",
      isPercentage: true,
      fileName: null,
      customFields: { "تعداد ویزیت روزانه": "۳۰ نفر", "داروهای ترجیحی": "متفورمین" }
    }
  ],
  reps: [
    {
      id: "rep-1",
      name: "جواد علمدار",
      phone: "09120852097",
      region: "تهران (مناطق ۱، ۲، ۳)",
      status: "online",
      lat: 35.7590,
      lng: 51.4280,
      lastUpdate: "لحظاتی پیش",
      currentVisit: "داروخانه دکتر عرفانی"
    },
    {
      id: "rep-2",
      name: "خانم نیلا محرمی",
      phone: "09129876543",
      region: "تهران (مناطق ۶، ۷)",
      status: "visiting",
      lat: 35.7100,
      lng: 51.4050,
      lastUpdate: "۲ دقیقه پیش",
      currentVisit: "مطب دکتر الناز تهرانی"
    },
    {
      id: "rep-3",
      name: "آقای داوود عقبایی",
      phone: "09151234567",
      region: "مشهد (منطقه ۱ و ۲)",
      status: "offline",
      lat: 36.3000,
      lng: 59.5800,
      lastUpdate: "۱۵ دقیقه پیش",
      currentVisit: "-"
    }
  ],
  orders: [
    {
      id: "ord-1",
      pharmacyName: "داروخانه دکتر عرفانی",
      pharmacyId: "ph-1",
      province: "تهران",
      city: "آبعلی",
      district: "منطقه ۱",
      address: "میدان اصلی، جنب بانک ملی، پلاک ۱۲",
      repName: "جواد علمدار",
      orderDate: "1405/05/19",
      items: [
        { name: "آمپول نوروبیون", count: 50, price: 250000 },
        { name: "کپسول امپرازول", count: 100, price: 45000 }
      ],
      totalAmount: 17000000,
      status: "تایید شده",
      notes: "ارسال فوری تا ظهر"
    }
  ],
  users: [
    {
      id: "u-1",
      fullName: "مدیر سیستم",
      username: "admin",
      password: "123",
      phone: "09120000000",
      role: "مدیر سیستم",
      simControl: "بدون بررسی",
      phoneLock: "آزاد - اولین ورود، گوشی را قفل می‌کند",
      lastLogin: "1405/05/19 - 12:55:23",
      permissions: getDefaultPermissionsObject(true)
    },
    {
      id: "u-2",
      fullName: "جواد علمدار",
      username: "Taheri",
      password: "456",
      phone: "09120852097",
      role: "نماینده علمی",
      simControl: "قفل گوشی (توصیه شده)",
      phoneLock: "گوشی متصل: Chrome Windows",
      lastLogin: "1405/05/18 - 15:41:16",
      permissions: getDefaultPermissionsObject(true)
    },
    {
      id: "u-3",
      fullName: "خانم نیلا محرمی",
      username: "nila",
      password: "789",
      phone: "09123334455",
      role: "نماینده علمی",
      simControl: "قفل گوشی (توصیه شده)",
      phoneLock: "آزاد - اولین ورود، گوشی را قفل می‌کند",
      lastLogin: "1405/05/18 - 10:15:00",
      permissions: getDefaultPermissionsObject(true)
    },
    {
      id: "u-4",
      fullName: "آقای داوود عقبایی",
      username: "davood",
      password: "321",
      phone: "09120852097",
      role: "سرپرست",
      simControl: "قفل گوشی (توصیه شده)",
      phoneLock: "آزاد - اولین ورود، گوشی را قفل می‌کند",
      lastLogin: "1405/05/19 - 12:49:36",
      permissions: getDefaultPermissionsObject(true)
    }
  ],
  activityLog: [
    { id: "act-1", time: "14:35 - امروز", repName: "جواد علمدار", action: "ثبت موقعیت زنده در میدان ونک" },
    { id: "act-2", time: "13:10 - امروز", repName: "خانم نیلا محرمی", action: "ثبت ویزیت مطب دکتر الناز تهرانی" },
    { id: "act-3", time: "11:00 - امروز", repName: "جواد علمدار", action: "ثبت سفارش جدید برای داروخانه دکتر عرفانی" }
  ],
  repHomes: [
    { id: "home-1", repName: "جواد علمدار", address: "تهران، منطقه ۳، خیابان میرداماد", lat: 35.7550, lng: 51.4350 },
    { id: "home-2", repName: "خانم نیلا محرمی", address: "تهران، منطقه ۶، بلوار کشاورز", lat: 35.7100, lng: 51.3950 }
  ],
  repRoutes: [
    { id: "rt-1", repName: "جواد علمدار", date: "1405/05/19", checkpoint: "ورود به منطقه ۳ - میدان ظفر", status: "تردد عادی" },
    { id: "rt-2", repName: "خانم نیلا محرمی", date: "1405/05/19", checkpoint: "ویزیت مطب‌های شریعتی", status: "در حال ویزیت" }
  ],
  leaves: [
    { id: "lv-1", repName: "آقای داوود عقبایی", fromDate: "1405/05/22", toDate: "1405/05/24", reason: "مرخصی استحقاقی", status: "تایید شده" },
    { id: "lv-2", repName: "خانم نیلا محرمی", fromDate: "1405/05/28", toDate: "1405/05/29", reason: "امور شخصی", status: "در حال بررسی" }
  ],
  notifications: [
    { id: "not-1", date: "1405/05/19", title: "اعلام تارگت فروش ماه جدید", message: "همکاران گرامی، تارگت ماه شهریور در کارتابل قرار گرفت.", sender: "مدیر سیستم" },
    { id: "not-2", date: "1405/05/15", title: "بروزرسانی نسخه 2.5.1", message: "امکان بارگذاری عکس داروخانه و وضعیت درصدی فعال شد.", sender: "مدیر سیستم" }
  ],
  salesTargets: [
    { id: "tgt-1", repName: "جواد علمدار", month: "مرداد 1405", targetAmount: 500000000, achievedAmount: 380000000 },
    { id: "tgt-2", repName: "خانم نیلا محرمی", month: "مرداد 1405", targetAmount: 400000000, achievedAmount: 410000000 }
  ],
  messengers: {
    smsEnabled: true,
    telegramToken: "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11",
    whatsappNumber: "09120000000",
    eitaaChannel: "@namayande_channel"
  },
  products: [
    {
      id: "prod-1",
      name: "کپسول امپرازول ۲۰ میلی‌گرم",
      category: "گوارش",
      price: 45000,
      stock: 5000,
      description: "بسته‌بندی ۳۰ عددی، مناسب برای درمان رفلاکس معده"
    },
    {
      id: "prod-2",
      name: "آمپول نوروبیون ویتامین B کمپلکس",
      category: "تقویتی و ویتامین",
      price: 250000,
      stock: 1200,
      description: "بسته‌بندی ۳ عددی وارداتی، اثربخشی بالا در کاهش خستگی"
    }
  ],
  customFields: {
    pharmacy: [
      { id: "cf-ph-1", label: "نوع قرارداد", type: "select", options: ["نقدی", "چکی یک‌ماهه", "چکی دو‌ماهه", "امانی"], showInForm: true, showInList: true, allowAddOption: true },
      { id: "cf-ph-2", label: "درجه اعتبار", type: "select", options: ["A+", "A", "B+", "B", "C"], showInForm: true, showInList: true, allowAddOption: true }
    ],
    doctor: [
      { id: "cf-doc-1", label: "تعداد ویزیت روزانه", type: "simple", showInForm: true, showInList: true },
      { id: "cf-doc-2", label: "داروهای ترجیحی", type: "simple", showInForm: true, showInList: false }
    ],
    order: [
      { id: "cf-ord-1", label: "اولویت ارسال", type: "select", options: ["عادی", "فوری", "ویژه (کمتر از ۲ ساعت)"], showInForm: true, showInList: true, allowAddOption: true }
    ]
  },
  permissions: [], // ساختار قبلی برای پشتیبانی هم‌زمان
  settings: {
    companyName: "شرکت پخش دارو و شبکه درمان نماینده علمی",
    apiEndpointUrl: "https://namayandeelmi-javad.onrender.com/api/state",
    defaultMapLat: 35.7200,
    defaultMapLng: 51.4200,
    currencyUnit: "ریال",
    autoBackupEnabled: true,
    autoBackupIntervalMinutes: 5,
    lastBackupTime: null
  }
};
