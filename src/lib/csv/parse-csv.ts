import Papa from "papaparse";
import type { Dataset } from "../../features/dataset/types";

const SUPPORTED_DELIMITERS = [",", ";", "\t"] as const;

type SupportedDelimiter = (typeof SUPPORTED_DELIMITERS)[number];

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

/** Detects the delimiter from the first non-empty CSV record, ignoring quoted text. */
function detectDelimiter(content: string): SupportedDelimiter {
  const firstRecord = content.split(/\r\n|\n|\r/).find((line) => line.trim() !== "") ?? "";
  const counts: Record<SupportedDelimiter, number> = {
    ",": 0,
    ";": 0,
    "\t": 0,
  };
  let insideQuotes = false;

  for (let index = 0; index < firstRecord.length; index += 1) {
    const character = firstRecord[index];

    if (character === '"') {
      if (insideQuotes && firstRecord[index + 1] === '"') {
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (!insideQuotes && SUPPORTED_DELIMITERS.includes(character as SupportedDelimiter)) {
      counts[character as SupportedDelimiter] += 1;
    }
  }

  let best: SupportedDelimiter = ",";
  for (const candidate of SUPPORTED_DELIMITERS) {
    if (counts[candidate] > counts[best]) best = candidate;
  }
  return best;
}


/** Rejects quotes that appear inside unquoted fields or after a closing quote. */
function validateQuoteSyntax(content: string, delimiter: SupportedDelimiter): void {
  let insideQuotes = false;
  let fieldStart = true;
  let line = 1;

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];

    if (insideQuotes) {
      if (character === '"') {
        if (content[index + 1] === '"') {
          index += 1;
        } else {
          insideQuotes = false;
          fieldStart = false;
        }
      } else if (character === "\n") {
        line += 1;
      } else if (character === "\r") {
        if (content[index + 1] === "\n") index += 1;
        line += 1;
      }
      continue;
    }

    if (character === '"') {
      if (!fieldStart) {
        throw new CsvParseError(
          `Aspas não escapadas na linha ${line}. Coloque o campo entre aspas ou escape as aspas internas.`,
        );
      }
      insideQuotes = true;
      fieldStart = false;
      continue;
    }

    if (character === delimiter) {
      fieldStart = true;
      continue;
    }

    if (character === "\n" || character === "\r") {
      if (character === "\r" && content[index + 1] === "\n") index += 1;
      line += 1;
      fieldStart = true;
      continue;
    }

    if (character !== " " && character !== "\t") {
      fieldStart = false;
    }
  }

  if (insideQuotes) {
    throw new CsvParseError("O CSV contém um campo entre aspas que não foi fechado.");
  }
}

export function parseCsv(content: string): ParseCsvResult {
  // A UTF-8 BOM is an encoding marker, not part of the first column name.
  const normalizedContent = content.replace(/^\uFEFF/, "");

  if (normalizedContent.trim() === "") {
    throw new CsvParseError("O arquivo está vazio.");
  }

  const delimiter = detectDelimiter(normalizedContent);
  validateQuoteSyntax(normalizedContent, delimiter);

  const result = Papa.parse<string[]>(normalizedContent, {
    delimiter,
    dynamicTyping: false,
    skipEmptyLines: "greedy",
  });

  if (result.errors.length > 0) {
    const firstError = result.errors[0];
    throw new CsvParseError(
      `Não foi possível interpretar o CSV: ${firstError.message}`,
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

  // Preserve header text exactly; trim is used only to detect blank names.
  const columnNames = header.map((name) => name.replace(/^\uFEFF/, ""));

  if (columnNames.some((name) => name.trim() === "")) {
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

  return { dataset, delimiter };
}
