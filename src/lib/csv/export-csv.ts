import Papa from "papaparse";
import type { Dataset } from "../../features/dataset/types";

type ExportCsvOptions = {
  delimiter?: string;
};

export function exportCsv(
  dataset: Dataset,
  options: ExportCsvOptions = {},
): string {
  const delimiter = options.delimiter ?? ",";

  const fields = dataset.columns.map((column) => column.name);

  const data = dataset.rows.map((row) =>
    dataset.columns.map((column) => row.values[column.name] ?? ""),
  );

  return Papa.unparse(
    {
      fields,
      data,
    },
    {
      delimiter,
      newline: "\r\n",
      quotes: false,
    },
  );
}
