import { describe, expect, it } from "vitest";
import { exportCsv } from "./export-csv";
import { parseCsv } from "./parse-csv";

describe("exportCsv", () => {
  it("exports headers and rows in the correct order", () => {
    const { dataset } = parseCsv("name,city\nLucas,Curitiba\nAna,Londrina");

    expect(exportCsv(dataset)).toBe(
      "name,city\r\nLucas,Curitiba\r\nAna,Londrina",
    );
  });

  it("preserves commas, quotes and newlines through round-trip", () => {
    const original = 'name,description\nLucas,"Sales, ""marketing""\nteam"';

    const { dataset } = parseCsv(original);
    const exported = exportCsv(dataset);
    const reparsed = parseCsv(exported);

    expect(reparsed.dataset.columns.map((column) => column.name)).toEqual(
      dataset.columns.map((column) => column.name),
    );

    expect(reparsed.dataset.rows.map((row) => row.values)).toEqual(
      dataset.rows.map((row) => row.values),
    );
  });

  it("preserves leading and trailing spaces through round-trip", () => {
    const { dataset } = parseCsv('name,city\n" Lucas "," Curitiba "');

    const reparsed = parseCsv(exportCsv(dataset));

    expect(reparsed.dataset.rows[0].values).toEqual({
      name: " Lucas ",
      city: " Curitiba ",
    });
  });

  it("supports a custom delimiter", () => {
    const { dataset } = parseCsv("name;city\nLucas;Curitiba");

    expect(exportCsv(dataset, { delimiter: ";" })).toBe(
      "name;city\r\nLucas;Curitiba",
    );
  });
});
