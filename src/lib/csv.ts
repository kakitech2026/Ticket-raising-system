export function csvCell(value: unknown) {
  let text = value == null ? "" : String(value);
  if (/^\s*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}
export function csvRow(values: unknown[]) { return values.map(csvCell).join(",") + "\r\n"; }
