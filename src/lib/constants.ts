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
  { key: "pharmacy", label: "ثبت اطلاعات داروخانه" },
  { key: "doctor", label: "ثبت اطلاعات پزشک" },
  { key: "order", label: "ثبت سفارشات داروخانه" },
  { key: "trip", label: "ثبت تردد و ویزیت" },
];

export const OPTION_CATEGORIES: { key: string; label: string }[] = [
  { key: "specialty", label: "تخصص پزشک" },
  { key: "distributor", label: "نام پخش" },
  { key: "visitor", label: "نام ویزیتور" },
];

export const PLATFORMS: { key: string; label: string }[] = [
  { key: "bale", label: "بله" },
  { key: "eitaa", label: "ایتا" },
  { key: "whatsapp", label: "واتساپ" },
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
