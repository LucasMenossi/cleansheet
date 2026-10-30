import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cwd } from "node:process";
import { describe, expect, it } from "vitest";
import { CsvParseError, parseCsv } from "./parse-csv";

const fixture = (name: string) =>
  readFileSync(resolve(cwd(), "test-csv", name), "utf8");

describe("parseCsv", () => {
  it("parses a CSV with comma delimiter", () => {
    const result = parseCsv("name,email\nLucas,lucas@example.com\nAna,ana@example.com");
    expect(result.delimiter).toBe(",");
    expect(result.dataset.columns.map((column) => column.name)).toEqual(["name", "email"]);
    expect(result.dataset.rows).toHaveLength(2);
    expect(result.dataset.rows[0].values).toEqual({ name: "Lucas", email: "lucas@example.com" });
  });

  it("detects semicolon and tab delimiters", () => {
    const semicolon = parseCsv("name;city\nLucas;Curitiba");
    expect(semicolon.delimiter).toBe(";");
    expect(semicolon.dataset.rows[0].values).toEqual({ name: "Lucas", city: "Curitiba" });

    const tab = parseCsv("name\tcity\nLucas\tCuritiba");
    expect(tab.delimiter).toBe("\t");
    expect(tab.dataset.rows[0].values).toEqual({ name: "Lucas", city: "Curitiba" });
  });

  it("preserves commas, escaped quotes, newlines, spaces and accents in values", () => {
    const result = parseCsv('name,description\n" Lucas ","Sales, ""marketing""\nSão Paulo"');
    expect(result.dataset.rows[0].values).toEqual({
      name: " Lucas ",
      description: 'Sales, "marketing"\nSão Paulo',
    });
  });

  it("preserves header whitespace instead of silently normalizing it", () => {
    const result = parseCsv('" customer ",city\nLucas,Curitiba');
    expect(result.dataset.columns[0].name).toBe(" customer ");
    expect(result.dataset.rows[0].values[" customer "]).toBe("Lucas");
  });

  it("removes a UTF-8 BOM without changing the first header", () => {
    const result = parseCsv("\uFEFForder_id,customer_zip\nORD-1042,02139");
    expect(result.dataset.columns[0].name).toBe("order_id");
    expect(result.dataset.rows[0].values.customer_zip).toBe("02139");
  });

  it("rejects an empty file and blank header names", () => {
    expect(() => parseCsv("\uFEFF  \n")).toThrow("O arquivo está vazio");
    expect(() => parseCsv("name,\nLucas,Ana")).toThrow("colunas sem nome");
  });

  it("rejects duplicate column names", () => {
    expect(() => parseCsv("name,name\nLucas,Ana")).toThrow("nomes de colunas duplicados");
  });

  it("generates distinct row and column IDs", () => {
    const { dataset } = parseCsv("name,email\nLucas,lucas@example.com\nAna,ana@example.com");
    const ids = [...dataset.columns.map((column) => column.id), ...dataset.rows.map((row) => row.id)];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("ignores blank lines while preserving empty fields in valid records", () => {
    const result = parseCsv("name,city\nLucas,\n\nAna,Londrina");
    expect(result.dataset.rows).toHaveLength(2);
    expect(result.dataset.rows[0].values).toEqual({ name: "Lucas", city: "" });
  });

  it("rejects rows with a different number of fields", () => {
    expect(() => parseCsv("name,city\nLucas,Curitiba,PR")).toThrow("quantidade de campos");
  });

  it("accepts the corrected quoting fixture", () => {
    const result = parseCsv(fixture("products-with-quoting.csv"));
    expect(result.dataset.rows).toHaveLength(14);
    expect(result.dataset.rows.find((row) => row.values.sku === "MUG-002")?.values.description)
      .toBe("Hand-painted, dishwasher safe.");
    expect(result.dataset.rows.find((row) => row.values.sku === "STIK-001")?.values.description)
      .toBe("Vinyl, 5 stickers per pack.");
  });

  it("rejects the malformed CSV fixture", () => {
    expect(() => parseCsv(fixture("broken-csv-10.csv"))).toThrow(CsvParseError);
  });

  it("parses the UTF-8 BOM fixture and preserves leading zeroes", () => {
    const result = parseCsv(fixture("sales-with-bom-and-mixed-types.csv"));
    expect(result.dataset.columns[0].name).toBe("order_id");
    expect(result.dataset.rows[0].values.customer_zip).toBe("02139");
  });

  it("parses a larger semicolon-delimited fixture", () => {
    const result = parseCsv(fixture("wine-quality-red-1599.csv"));
    expect(result.delimiter).toBe(";");
    expect(result.dataset.rows).toHaveLength(1599);
  });

  it("parses a simple real-world fixture", () => {
    const result = parseCsv(fixture("iris.csv"));
    expect(result.dataset.rows).toHaveLength(30);
    expect(result.dataset.columns.map((column) => column.name)).toContain("species");
  });
});
