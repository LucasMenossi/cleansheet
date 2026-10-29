import { describe, expect, it } from "vitest";
import { CsvParseError, parseCsv } from "./parse-csv";

describe("parseCsv", () => {
  it("parses a CSV with comma delimiter", () => {
    const result = parseCsv(
      "name,email\nLucas,lucas@example.com\nAna,ana@example.com",
    );

    expect(result.delimiter).toBe(",");
    expect(result.dataset.columns.map((column) => column.name)).toEqual([
      "name",
      "email",
    ]);

    expect(result.dataset.rows).toHaveLength(2);
    expect(result.dataset.rows[0].values).toEqual({
      name: "Lucas",
      email: "lucas@example.com",
    });
  });

  it("detects semicolon delimiter", () => {
    const result = parseCsv("name;city\nLucas;Curitiba");

    expect(result.delimiter).toBe(";");
    expect(result.dataset.columns.map((column) => column.name)).toEqual([
      "name",
      "city",
    ]);
    expect(result.dataset.rows[0].values).toEqual({
      name: "Lucas",
      city: "Curitiba",
    });
  });

  it("preserves commas inside quoted values", () => {
    const result = parseCsv('name,description\nLucas,"Sales, marketing"');

    expect(result.dataset.rows[0].values.description).toBe("Sales, marketing");
  });

  it("preserves accented characters", () => {
    const result = parseCsv("nome,cidade\nJoão,São Paulo");

    expect(result.dataset.rows[0].values).toEqual({
      nome: "João",
      cidade: "São Paulo",
    });
  });

  it("rejects an empty file", () => {
    expect(() => parseCsv("")).toThrow(CsvParseError);
  });

  it("rejects duplicate column names", () => {
    expect(() => parseCsv("name,name\nLucas,Ana")).toThrow(
      "nomes de colunas duplicados",
    );
  });

  it("generates distinct row and column IDs", () => {
    const { dataset } = parseCsv(
      "name,email\nLucas,lucas@example.com\nAna,ana@example.com",
    );

    const ids = [
      ...dataset.columns.map((column) => column.id),
      ...dataset.rows.map((row) => row.id),
    ];

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("preserves leading and trailing spaces in values", () => {
    const result = parseCsv('name,city\n" Lucas "," Curitiba "');

    expect(result.dataset.rows[0].values).toEqual({
      name: " Lucas ",
      city: " Curitiba ",
    });
  });

  it("detects tab delimiter", () => {
    const result = parseCsv("name\tcity\nLucas\tCuritiba");

    expect(result.delimiter).toBe("\t");
    expect(result.dataset.columns.map((column) => column.name)).toEqual([
      "name",
      "city",
    ]);
    expect(result.dataset.rows[0].values).toEqual({
      name: "Lucas",
      city: "Curitiba",
    });
  });

  it("preserves newlines inside quoted fields", () => {
    const result = parseCsv(
      'name,description\nLucas,"First line\nSecond line"',
    );

    expect(result.dataset.rows).toHaveLength(1);
    expect(result.dataset.rows[0].values.description).toBe(
      "First line\nSecond line",
    );
  });

  it("preserves escaped quotes inside fields", () => {
    const result = parseCsv('name,description\nLucas,"He said ""hello"""');

    expect(result.dataset.rows[0].values.description).toBe('He said "hello"');
  });

  it("rejects rows with a different number of fields", () => {
    expect(() => parseCsv("name,city\nLucas,Curitiba,PR")).toThrow(
      "quantidade de campos",
    );
  });

  it("ignores blank lines between records", () => {
    const result = parseCsv("name,city\nLucas,Curitiba\n\nAna,Londrina");

    expect(result.dataset.rows).toHaveLength(2);
  });

  it("preserves empty fields in valid records", () => {
    const result = parseCsv("name,city\nLucas,\nAna,Londrina");

    expect(result.dataset.rows).toHaveLength(2);
    expect(result.dataset.rows[0].values).toEqual({
      name: "Lucas",
      city: "",
    });
  });
});
