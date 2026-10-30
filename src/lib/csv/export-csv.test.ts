import { describe, expect, it } from "vitest";
import type { Dataset } from "../../features/dataset/types";
import { CsvExportError, exportCsv, findCsvInjectionRisks } from "./export-csv";
import { parseCsv } from "./parse-csv";

const datasetFrom = (content: string) => parseCsv(content).dataset;

describe("exportCsv", () => {
  it("exports headers and rows in the correct order", () => {
    expect(exportCsv(datasetFrom("name,city\nLucas,Curitiba\nAna,Londrina"))).toBe(
      "name,city\r\nLucas,Curitiba\r\nAna,Londrina",
    );
  });

  it("preserves commas, quotes and newlines through round-trip", () => {
    const dataset = datasetFrom('name,description\nLucas,"Sales, ""marketing""\nteam"');
    const reparsed = parseCsv(exportCsv(dataset));
    expect(reparsed.dataset.columns.map((column) => column.name)).toEqual(dataset.columns.map((column) => column.name));
    expect(reparsed.dataset.rows.map((row) => row.values)).toEqual(dataset.rows.map((row) => row.values));
  });

  it("preserves header and value whitespace through round-trip", () => {
    const dataset = datasetFrom('" name ",city\n" Lucas "," Curitiba "');
    const reparsed = parseCsv(exportCsv(dataset));
    expect(reparsed.dataset.columns[0].name).toBe(" name ");
    expect(reparsed.dataset.rows[0].values).toEqual({ " name ": " Lucas ", city: " Curitiba " });
  });

  it("supports a custom delimiter", () => {
    expect(exportCsv(datasetFrom("name;city\nLucas;Curitiba"), { delimiter: ";" })).toBe(
      "name;city\r\nLucas;Curitiba",
    );
  });

  it("rejects rows with missing or unexpected keys instead of filling or dropping values", () => {
    const missing: Dataset = {
      columns: [{ id: "c1", name: "name" }, { id: "c2", name: "city" }],
      rows: [{ id: "r1", values: { name: "Lucas" } } as Dataset["rows"][number]],
    };
    expect(() => exportCsv(missing)).toThrow(CsvExportError);

    const extra: Dataset = {
      columns: [{ id: "c1", name: "name" }],
      rows: [{ id: "r1", values: { name: "Lucas", ignored: "data" } }],
    };
    expect(() => exportCsv(extra)).toThrow("campos diferentes");
  });

  it("reports formula-like cells without changing their values", () => {
    const dataset = datasetFrom("name,note\nLucas,=1+1\nAna,@SUM(A1:A2)");
    const risks = findCsvInjectionRisks(dataset);
    expect(risks).toHaveLength(2);
    expect(exportCsv(dataset)).toContain("=1+1");
    expect(exportCsv(dataset)).toContain("@SUM(A1:A2)");
  });

  it("rejects unsupported delimiters", () => {
    expect(() => exportCsv(datasetFrom("name,city\nLucas,Curitiba"), { delimiter: "|" }))
      .toThrow("delimitador de exportação não é suportado");
  });
});
