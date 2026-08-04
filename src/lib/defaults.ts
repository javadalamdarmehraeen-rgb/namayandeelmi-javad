import { PRODUCTS } from "./constants";

export type ProductConfig = { key: string; label: string; bonusLabel: string; enabled: boolean };
export type ColumnConfig = { key: string; label: string; visible: boolean };

export const DEFAULT_PRODUCTS: ProductConfig[] = PRODUCTS.map((p) => ({
  key: p.key,
  label: p.label,
  bonusLabel: p.bonusLabel,
  enabled: true,
}));

/** کلید فیلد جایزه هر کالا */
export const bonusKeyOf = (key: string) => `${key}_bonus`;

export const DEFAULT_COLUMNS: Record<string, ColumnConfig[]> = {
  pharmacies: [
    { key: "row", label: "ردیف", visible: true },
    { key: "repName", label: "نام نماینده", visible: true },
    { key: "dateShamsi", label: "تاریخ ثبت", visible: true },
    { key: "province", label: "استان", visible: true },
    { key: "city", label: "شهر", visible: true },
    { key: "region", label: "منطقه", visible: false },
    { key: "name", label: "نام داروخانه", visible: true },
    { key: "landline", label: "شماره ثابت", visible: false },
    { key: "managerName", label: "مسئول سفارش", visible: true },
    { key: "managerPhone", label: "شماره همراه", visible: true },
    { key: "address", label: "آدرس", visible: false },
    { key: "location", label: "لوکیشن", visible: true },
    { key: "sent", label: "وضعیت ارسال", visible: true },
  ],
  doctors: [
    { key: "row", label: "ردیف", visible: true },
    { key: "repName", label: "نام نماینده", visible: true },
    { key: "dateShamsi", label: "تاریخ ثبت", visible: true },
    { key: "province", label: "استان", visible: false },
    { key: "city", label: "شهر", visible: true },
    { key: "region", label: "منطقه", visible: false },
    { key: "name", label: "نام پزشک", visible: true },
    { key: "specialty", label: "تخصص", visible: true },
    { key: "phone", label: "شماره همراه پزشک", visible: true },
    { key: "secretaryName", label: "نام منشی", visible: false },
    { key: "secretaryPhone", label: "شماره منشی", visible: false },
    { key: "address", label: "آدرس مطب", visible: false },
    { key: "location", label: "لوکیشن", visible: true },
    { key: "sent", label: "وضعیت ارسال", visible: true },
  ],
  orders: [
    { key: "row", label: "ردیف", visible: true },
    { key: "repName", label: "نام نماینده", visible: true },
    { key: "dateShamsi", label: "تاریخ سفارش", visible: true },
    { key: "pharmacyName", label: "نام داروخانه", visible: true },
    { key: "managerName", label: "مسئول سفارش", visible: true },
    { key: "managerPhone", label: "شماره همراه", visible: true },
    { key: "address", label: "آدرس", visible: false },
    { key: "products", label: "اقلام سفارش", visible: true },
    { key: "distributor", label: "نام پخش", visible: true },
    { key: "visitor", label: "نام ویزیتور", visible: true },
    { key: "notes", label: "توضیحات", visible: false },
    { key: "location", label: "لوکیشن", visible: true },
    { key: "sent", label: "وضعیت ارسال", visible: true },
  ],
};

export const PERMISSION_GROUPS: {
  key: string;
  label: string;
  icon: string;
  items: { key: string; label: string }[];
}[] = [
  {
    key: "core",
    label: "ثبت اطلاعات پایه",
    icon: "🗂️",
    items: [
      { key: "pharmacy", label: "ثبت اطلاعات داروخانه" },
      { key: "doctor", label: "ثبت اطلاعات پزشک" },
      { key: "order", label: "ثبت سفارشات داروخانه" },
    ],
  },
  {
    key: "field",
    label: "عملیات میدانی",
    icon: "🗺️",
    items: [
      { key: "trip", label: "ثبت تردد و ویزیت" },
      { key: "home", label: "ثبت لوکیشن منزل" },
    ],
  },
  {
    key: "hr",
    label: "اداری و منابع انسانی",
    icon: "📝",
    items: [
      { key: "leave", label: "درخواست مرخصی" },
      { key: "leaveApprove", label: "تایید مرخصی (سرپرست/مدیر)" },
    ],
  },
  {
    key: "reports",
    label: "گزارش و داشبورد",
    icon: "📊",
    items: [
      { key: "dashboard", label: "مشاهده داشبورد" },
      { key: "reports", label: "گزارش ماهانه" },
      { key: "export", label: "خروجی اکسل" },
    ],
  },
  {
    key: "admin",
    label: "مدیریت سامانه",
    icon: "⚙️",
    items: [
      { key: "options", label: "افزودن مقادیر کشویی" },
      { key: "optionsDelete", label: "حذف مقادیر کشویی" },
      { key: "columns", label: "مدیریت ستون‌ها و کالاها" },
      { key: "users", label: "مدیریت کاربران و دسترسی" },
      { key: "messengers", label: "تنظیم پیام‌رسان‌ها" },
      { key: "monitor", label: "رصد تردد نمایندگان" },
    ],
  },
];

export const ALL_PERMISSION_KEYS = PERMISSION_GROUPS.flatMap((g) => g.items.map((i) => i.key));

export const REP_DEFAULT_PERMISSIONS = [
  "pharmacy",
  "doctor",
  "order",
  "trip",
  "home",
  "leave",
  "dashboard",
  "reports",
  "options",
];

export const SUPERVISOR_DEFAULT_PERMISSIONS = [
  ...REP_DEFAULT_PERMISSIONS,
  "leaveApprove",
  "monitor",
  "export",
];
