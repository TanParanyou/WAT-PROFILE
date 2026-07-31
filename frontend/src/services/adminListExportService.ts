export interface ExportColumn<T> {
  header: string;
  accessor: (item: T) => string | number | boolean | null | undefined;
}

export function exportToCsv<T>(
  items: T[],
  columns: ExportColumn<T>[],
  filename: string
): void {
  const headers = columns.map((col) => `"${col.header.replace(/"/g, '""')}"`).join(',');

  const rows = items.map((item) =>
    columns
      .map((col) => {
        const val = col.accessor(item);
        if (val === null || val === undefined) {
          return '""';
        }
        const strVal = String(val).replace(/"/g, '""');
        return `"${strVal}"`;
      })
      .join(',')
  );

  const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
