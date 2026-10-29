import Papa from "papaparse";
import type { Dataset } from "../../features/dataset/types";

export type ParseCsvResult = {
  dataset: Dataset;
  delimiter: string;
};

export class CsvParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CsvParseError";
  }
}

export function parseCsv(content: string): ParseCsvResult {
  if (content.trim() === "") {
    throw new CsvParseError("O arquivo está vazio.");
  }

  const result = Papa.parse<string[]>(content, {
    delimiter: "",
    skipEmptyLines: "greedy",
  });

  if (result.errors.length > 0) {
    throw new CsvParseError(
      `Não foi possível interpretar o CSV: ${result.errors[0].message}`,
    );
  }

  const records = result.data;

  if (records.length === 0) {
    throw new CsvParseError("Nenhum registro encontrado.");
  }

  const header = records[0];

  if (!header || header.length === 0) {
    throw new CsvParseError("Cabeçalho inválido.");
  }

  const columnNames = header.map((name) => name.trim());

  if (columnNames.some((name) => name === "")) {
    throw new CsvParseError("Existem colunas sem nome no cabeçalho.");
  }

  if (new Set(columnNames).size !== columnNames.length) {
    throw new CsvParseError("Existem nomes de colunas duplicados.");
  }

  const dataRecords = records.slice(1);

  const invalidRowIndex = dataRecords.findIndex(
    (record) => record.length !== header.length,
  );

  if (invalidRowIndex !== -1) {
    throw new CsvParseError(
      `A linha ${invalidRowIndex + 2} possui uma quantidade de campos diferente do cabeçalho.`,
    );
  }

  const dataset: Dataset = {
    columns: columnNames.map((name) => ({
      id: crypto.randomUUID(),
      name,
    })),
    rows: dataRecords.map((record) => ({
      id: crypto.randomUUID(),
      values: Object.fromEntries(
        columnNames.map((name, index) => [name, record[index]]),
      ),
    })),
  };

  return {
    dataset,
    delimiter: result.meta.delimiter,
  };
}
