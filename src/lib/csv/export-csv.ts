import Papa from "papaparse";
import type { Dataset } from "../../features/dataset/types";

export type ExportCsvOptions = {
  delimiter?: string;
};

export class CsvExportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CsvExportError";
  }
}

export type CsvInjectionRisk = {
  rowNumber: number;
  columnName: string;
  value: string;
};

const ALLOWED_DELIMITERS = new Set([",", ";", "\t"]);
const FORMULA_PREFIXES = new Set(["=", "+", "-", "@"]);

function isFormulaLikeValue(value: string): boolean {
  let index = 0;

  // Skip leading whitespace/control characters without a control-character regex.
  while (index < value.length && value.charCodeAt(index) <= 0x20) {
    index += 1;
  }

  return FORMULA_PREFIXES.has(value[index] ?? "");
}

/** Returns cells that spreadsheet applications may interpret as formulas. */
export function findCsvInjectionRisks(dataset: Dataset): CsvInjectionRisk[] {
  const risks: CsvInjectionRisk[] = [];

  dataset.columns.forEach((column, columnIndex) => {
    if (isFormulaLikeValue(column.name)) {
      risks.push({ rowNumber: 1, columnName: column.name, value: column.name });
    }

    dataset.rows.forEach((row, rowIndex) => {
      const value = row.values[column.name];
      if (typeof value === "string" && isFormulaLikeValue(value)) {
        risks.push({
          rowNumber: rowIndex + 2,
          columnName: column.name || `Coluna ${columnIndex + 1}`,
          value,
        });
      }
    });
  });

  return risks;
}

function validateDataset(dataset: Dataset): void {
  const columnNames = dataset.columns.map((column) => column.name);

  if (new Set(columnNames).size !== columnNames.length) {
    throw new CsvExportError("Não é possível exportar colunas com nomes duplicados.");
  }

  if (columnNames.some((name) => name.trim() === "")) {
    throw new CsvExportError("Não é possível exportar uma coluna sem nome.");
  }

  const expectedKeys = new Set(columnNames);
  const columnIds = dataset.columns.map((column) => column.id);
  if (new Set(columnIds).size !== columnIds.length) {
    throw new CsvExportError("O dataset contém identificadores de coluna duplicados.");
  }

  const rowIds = new Set<string>();

  for (const row of dataset.rows) {
    if (rowIds.has(row.id)) {
      throw new CsvExportError("O dataset contém identificadores de linha duplicados.");
    }
    rowIds.add(row.id);

    const actualKeys = Object.keys(row.values);
    if (
      actualKeys.length !== expectedKeys.size ||
      actualKeys.some((key) => !expectedKeys.has(key))
    ) {
      throw new CsvExportError(
        "Uma linha contém campos diferentes das colunas definidas. Nenhum dado foi exportado.",
      );
    }

    if (columnNames.some((name) => typeof row.values[name] !== "string")) {
      throw new CsvExportError(
        "Todos os valores das células precisam ser strings antes da exportação.",
      );
    }
  }
}

export function exportCsv(
  dataset: Dataset,
  options: ExportCsvOptions = {},
): string {
  const delimiter = options.delimiter ?? ",";

  if (!ALLOWED_DELIMITERS.has(delimiter)) {
    throw new CsvExportError("O delimitador de exportação não é suportado.");
  }

  validateDataset(dataset);

  const fields = dataset.columns.map((column) => column.name);
  const data = dataset.rows.map((row) =>
    dataset.columns.map((column) => row.values[column.name]),
  );

  return Papa.unparse(
    { fields, data },
    {
      delimiter,
      newline: "\r\n",
      // Papa Parse still quotes values when required for valid CSV escaping.
      quotes: false,
    },
  );
}
