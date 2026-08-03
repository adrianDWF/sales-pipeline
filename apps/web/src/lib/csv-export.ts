export type CsvColumn<T> = {
  key: string;
  label: string;
  getValue: (row: T) => string | number | null;
};

export function rowsToCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => escapeCsvCell(c.label)).join(",");
  const body = rows.map((row) =>
    columns
      .map((col) => {
        const value = col.getValue(row);
        if (value == null) return "";
        return escapeCsvCell(String(value));
      })
      .join(","),
  );
  return [header, ...body].join("\n");
}

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
