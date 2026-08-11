/**   :       */
const collator = new Intl.Collator("fa", {
  numeric: true,
  sensitivity: "base",
  ignorePunctuation: true,
});

export function faCompare(a: string, b: string) {
  return collator.compare(String(a ?? ""), String(b ?? ""));
}
export function faSort(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort(faCompare);
}
/**      */
export function toEnglishDigits(value: string) {
  return String(value)
    .replace(/[\u06F0-\u06F9]/g, (c) => String(c.charCodeAt(0) - 0x06f0))
    .replace(/[\u0660-\u0669]/g, (c) => String(c.charCodeAt(0) - 0x0660));
}
