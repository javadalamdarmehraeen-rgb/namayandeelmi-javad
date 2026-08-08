export type ProductDef = { key: string; label: string; bonusKey: string; bonusLabel: string };

export const PRODUCTS: ProductDef[] = [
  { key: "omega3", label: "امگا ۳", bonusKey: "omega3_bonus", bonusLabel: "تعداد جایزه امگا ۳" },
  { key: "omega5", label: "امگا ۵", bonusKey: "omega5_bonus", bonusLabel: "تعداد جایزه امگا ۵" },
  { key: "omega35", label: "امگا ۳.۵", bonusKey: "omega35_bonus", bonusLabel: "تعداد جایزه امگا ۳.۵" },
  { key: "omegaMulti", label: "امگا مولتی", bonusKey: "omegaMulti_bonus", bonusLabel: "تعداد جایزه امگا مولتی" },
  { key: "omegaWomen", label: "امگا وومن", bonusKey: "omegaWomen_bonus", bonusLabel: "تعداد جایزه امگا وومن" },
  { key: "omegaMen", label: "امگا من", bonusKey: "omegaMen_bonus", bonusLabel: "تعداد جایزه امگا من" },
  { key: "melatonin", label: "ملاتونین", bonusKey: "melatonin_bonus", bonusLabel: "تعداد جایزه ملاتونین" },
];

export const PERMISSIONS: { key: string; label: string }[] = [
  { key: "dashboard", label: "داشبورد و گزارش" },
  { key: "pharmacy", label: "ثبت اطلاعات داروخانه" },
  { key: "doctor", label: "ثبت اطلاعات پزشک" },
  { key: "order", label: "ثبت سفارشات داروخانه" },
  { key: "trip", label: "ثبت تردد و ویزیت" },
  { key: "home", label: "ثبت لوکیشن منزل" },
  { key: "leave", label: "درخواست مرخصی" },
  { key: "options", label: "افزودن مقادیر کشویی" },
  { key: "reports", label: "گزارش ماهانه" },
];

export const ALL_PERMISSIONS = PERMISSIONS.map((p) => p.key);

export const OPTION_CATEGORIES: { key: string; label: string }[] = [
  { key: "province", label: "استان" },
  { key: "city", label: "شهر" },
  { key: "region", label: "منطقه" },
  { key: "specialty", label: "تخصص پزشک" },
  { key: "pharmacy", label: "نام داروخانه" },
  { key: "manager", label: "نام مسئول سفارش" },
  { key: "doctor", label: "نام پزشک" },
  { key: "secretary", label: "نام منشی" },
  { key: "leaveKind", label: "نوع مرخصی" },
  { key: "year", label: "سال مالی" },
  { key: "distributor", label: "نام پخش" },
  { key: "visitor", label: "نام ویزیتور" },
];

export const PLATFORMS: {
  key: string;
  label: string;
  icon: string;
  needsToken: boolean;
  tokenHint: string;
  targetHint: string;
  guide: string[];
}[] = [
  {
    key: "telegram",
    label: "تلگرام",
    icon: "🔵",
    needsToken: true,
    tokenHint: "توکن ربات از @BotFather (مثل 123456:ABC-DEF...)",
    targetHint: "chat_id عددی؛ گروه‌ها با منفی شروع می‌شوند مثل -1001234567890",
    guide: [
      "در تلگرام به @BotFather پیام دهید و دستور /newbot را بزنید.",
      "نام و آیدی ربات را وارد کنید تا توکن به شما داده شود.",
      "ربات را در گروه عضو کنید و یک پیام بفرستید.",
      "دکمه «دریافت خودکار chat_id» را بزنید یا آدرس api.telegram.org/bot<TOKEN>/getUpdates را باز کنید.",
    ],
  },
  {
    key: "bale",
    label: "بله",
    icon: "🟣",
    needsToken: true,
    tokenHint: "توکن ربات بله از @BotFather داخل بله",
    targetHint: "chat_id عددی کاربر یا گروه",
    guide: [
      "در پیام‌رسان بله به @BotFather پیام دهید و /newbot را بزنید.",
      "توکن دریافتی را اینجا وارد کنید.",
      "ربات را در گروه عضو کرده و یک پیام بفرستید.",
      "دکمه «دریافت خودکار chat_id» را بزنید.",
    ],
  },
  {
    key: "eitaa",
    label: "ایتا",
    icon: "🟠",
    needsToken: true,
    tokenHint: "توکن سرویس ایتایار از eitaayar.ir",
    targetHint: "نام کانال با @ یا chat_id",
    guide: [
      "در سایت eitaayar.ir ثبت‌نام کنید.",
      "توکن رایگان را از بخش «توکن من» کپی کنید.",
      "ربات ایتایار را در کانال/گروه خود ادمین کنید.",
      "آیدی کانال را با @ در فیلد مقصد وارد کنید.",
    ],
  },
  {
    key: "whatsapp",
    label: "واتساپ",
    icon: "🟢",
    needsToken: true,
    tokenHint: "کلید API سرویس واسط (whatsiplus / UltraMsg / Cloud API)",
    targetHint: "شماره مقصد؛ برای whatsiplus با ۰ و برای بقیه با کد کشور ۹۸",
    guide: [
      "در whatsiplus.ir ثبت‌نام کرده و شماره واتساپ خود را متصل کنید.",
      "کلید API را از پنل کپی کرده و اینجا وارد کنید.",
      "نوع سرویس واسط را از فهرست «ارائه‌دهنده» انتخاب کنید.",
      "شماره مقصد را وارد کرده و «تست ارسال» بزنید.",
    ],
  },
];

export const DEFAULT_SPECIALTIES = [
  "عمومی",
  "داخلی",
  "قلب و عروق",
  "زنان و زایمان",
  "اطفال",
  "ارتوپدی",
  "پوست و مو",
  "مغز و اعصاب",
  "گوارش",
  "غدد",
  "روانپزشکی",
  "ارولوژی",
  "چشم پزشکی",
  "گوش و حلق و بینی",
  "تغذیه",
];

export const DEFAULT_PROVINCES = [
  "تهران",
  "البرز",
  "اصفهان",
  "فارس",
  "خراسان رضوی",
  "آذربایجان شرقی",
  "آذربایجان غربی",
  "خوزستان",
  "گیلان",
  "مازندران",
  "کرمان",
  "قم",
  "یزد",
  "همدان",
  "کرمانشاه",
];
