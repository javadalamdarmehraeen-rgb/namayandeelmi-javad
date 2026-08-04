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
  { key: "distributor", label: "نام پخش" },
  { key: "visitor", label: "نام ویزیتور" },
];

export const PLATFORMS: { key: string; label: string; hint: string }[] = [
  {
    key: "bale",
    label: "بله",
    hint: "توکن ربات بله (از @BotFather بله). مقصد: chat_id عددی کاربر یا گروه (گروه با منفی)",
  },
  {
    key: "eitaa",
    label: "ایتا",
    hint: "توکن سرویس eitaayar.ir. مقصد: نام کانال با @ یا chat_id",
  },
  {
    key: "whatsapp",
    label: "واتساپ",
    hint: "توکن به صورت phoneNumberId:accessToken (WhatsApp Cloud API). مقصد: شماره با کد کشور مثل 989120000000",
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
