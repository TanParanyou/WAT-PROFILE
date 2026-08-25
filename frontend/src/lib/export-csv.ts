export interface CsvColumn<T> {
  header: string;
  accessor: (item: T) => string | number | boolean | null | undefined;
}

export interface CsvExportOptions<T> {
  filename: string;
  columns: readonly CsvColumn<T>[];
  data: readonly T[];
}

export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  let str = String(value);
  // Protect against CSV Formula Injection in spreadsheet software
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  if (str.includes('"') || str.includes(",") || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generateCsvContent<T>(
  columns: readonly CsvColumn<T>[],
  data: readonly T[],
): string {
  const headerRow = columns.map((col) => escapeCsvCell(col.header)).join(",");
  const dataRows = data.map((item) =>
    columns.map((col) => escapeCsvCell(col.accessor(item))).join(","),
  );
  return [headerRow, ...dataRows].join("\r\n");
}

export function exportToCsv<T>({ filename, columns, data }: CsvExportOptions<T>): void {
  const csvContent = generateCsvContent(columns, data);
  // Prepend UTF-8 BOM (\uFEFF) for Microsoft Excel compatibility across Windows and macOS
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
