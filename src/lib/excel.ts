/**
 * Lightweight XLS (SpreadsheetML/HTML table) writer.
 *     .xls      Excel  WPS  
 * (        ).

 */
function esc(v: unknown) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
export function buildXls(sheetName: string, rows: (string | number)[][]) {
  const head = rows[0] ?? [];
  const body = rows.slice(1);
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"
>
<head><meta charset="UTF-8" />
<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
<x:Name>${esc(sheetName)}</x:Name><x:WorksheetOptions><x:DisplayRightToLeft/></x:WorksheetOptions>
</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
<style>
table{border-collapse:collapse;font-family:Tahoma,sans-serif;font-size:11pt}
th{background:#0f766e;color:#fff;border:1px solid #0b5c55;padding:6px;white-space:nowrap}
td{border:1px solid #cbd5e1;padding:5px;mso-number-format:"\\@"}
</style></head>
<body dir="rtl"><table><thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>
<tbody>${body
    .map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`)
    .join("")}</tbody></table></body></html>`;
  return "\uFEFF" + html;
}
export function xlsResponse(fileName: string, sheetName: string, rows: (string | number)[][]) {
  return new Response(buildXls(sheetName, rows), {
    headers: {
      "Content-Type": "application/vnd.ms-excel; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}.xls"`,
      "Cache-Control": "no-store",
    },
  });
}
