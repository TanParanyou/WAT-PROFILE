export function exportToCsv<T extends Record<string, unknown>>(
  filename: string,
  data: T[],
  headers: { label: string; key: keyof T }[],
) {
  if (!data || !data.length) return;

  const csvRows = [];

  // Generate Header Row
  csvRows.push(headers.map((h) => `"${h.label}"`).join(","));

  // Generate Data Rows
  for (const row of data) {
    const values = headers.map((h) => {
      const val = row[h.key];
      // Escape quotes and wrap in quotes to handle commas within text
      const escaped = String(val ?? "").replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(","));
  }

  const csvContent = "\uFEFF" + csvRows.join("\n"); // Add BOM for Excel UTF-8 support
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `${filename}_${new Date().toISOString().split("T")[0]}.csv`,
  );
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
