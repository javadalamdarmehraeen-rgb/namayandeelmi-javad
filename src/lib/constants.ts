export type ProductDef = { key: string; label: string; bonusKey: string; bonusLabel: string };
export const PRODUCTS: ProductDef[] = [
  { key: "omega3", label: " ", bonusKey: "omega3_bonus", bonusLabel: "   " },

  { key: "omega5", label: " ", bonusKey: "omega5_bonus", bonusLabel: "   " },
  { key: "omega35", label: " .", bonusKey: "omega35_bonus", bonusLabel: "   ." },
  { key: "omegaMulti", label: " ", bonusKey: "omegaMulti_bonus", bonusLabel: "   " },
  { key: "omegaWomen", label: " ", bonusKey: "omegaWomen_bonus", bonusLabel: "   " },
  { key: "omegaMen", label: " ", bonusKey: "omegaMen_bonus", bonusLabel: "   " },
  { key: "melatonin", label: "", bonusKey: "melatonin_bonus", bonusLabel: "  " },
];
export const PERMISSIONS: { key: string; label: string }[] = [
  { key: "dashboard", label: "  " },
  { key: "pharmacy", label: "  " },
  { key: "doctor", label: "  " },
  { key: "order", label: "  " },
  { key: "trip", label: "   " },
  { key: "home", label: "  " },
  { key: "leave", label: " " },
  { key: "options", label: "  " },
  { key: "reports", label: " " },
];
export const ALL_PERMISSIONS = PERMISSIONS.map((p) => p.key);
export const OPTION_CATEGORIES: { key: string; label: string }[] = [
  { key: "province", label: "" },
  { key: "city", label: "" },
  { key: "region", label: "" },
  { key: "specialty", label: " " },
  { key: "pharmacy", label: " " },
  { key: "manager", label: "  " },
  { key: "doctor", label: " " },
  { key: "secretary", label: " " },
  { key: "leaveKind", label: " " },
  { key: "year", label: " " },
  { key: "distributor", label: " " },
  { key: "visitor", label: " " },
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
    label: "",
    icon: "",
    needsToken: true,
    tokenHint: "   @BotFather ( 123456:ABC-DEF...)",
    targetHint: "chat_id        -1001234567890",
    guide: [
      "   @BotFather     /newbot  .",
      "            .",
      "         .",
      " «  chat_id»     api.telegram.org/bot<TOKEN>/getUpdates   .",
    ],
  },
  {
    key: "bale",
    label: "",
    icon: "",
    needsToken: true,
    tokenHint: "    @BotFather  ",
    targetHint: "chat_id    ",
    guide: [
      "    @BotFather    /newbot  .",
      "     .",
      "         .",
      " «  chat_id»  .",
    ],
  },
  {
    key: "eitaa",
    label: "",
    icon: "",
    needsToken: true,
    tokenHint: "    eitaayar.ir",
    targetHint: "   @  chat_id",
    guide: [
      "  eitaayar.ir  .",
      "     « »  .",
      "    /   .",

      "    @     .",
    ],
  },
  {
    key: "whatsapp",
    label: "",
    icon: "",
    needsToken: true,
    tokenHint: " API   (whatsiplus / UltraMsg / Cloud API)",
    targetHint: "   whatsiplus         ",
    guide: [
      " whatsiplus.ir         .",
      " API         .",
      "      «»  .",
      "      « » .",
    ],
  },
];
export const DEFAULT_SPECIALTIES = [
  "",
  "",
  "  ",
  "  ",
  "",
  "",
  "  ",
  "  ",
  "",
  "",
  "",
  "",
  " ",
  "    ",
  "",
];
export const DEFAULT_PROVINCES = [
  "",
  "",
  "",
  "",
  " ",
  " ",
  " ",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
];
