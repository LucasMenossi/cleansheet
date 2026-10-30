import { describe, expect, it } from "vitest";
import type { Dataset } from "../../dataset/types";
import { detectMissingValues } from "./missing-values";

function createDataset(overrides: Partial<Dataset> = {}): Dataset {
  return {
    columns: [
      { id: "name", name: "Name" },
      { id: "email", name: "Email" },
    ],
    rows: [
      { id: "row-1", values: { name: "Maria", email: "maria@example.com" } },
      { id: "row-2", values: { name: "João", email: "joao@example.com" } },
    ],
    ...overrides,
  };
}

describe("detectMissingValues", () => {
  it("returns no issues when every cell has a value", () => {
    expect(detectMissingValues(createDataset())).toEqual([]);
  });

  it("detects empty cells and identifies affected rows and columns", () => {
    const dataset = createDataset({
      rows: [
        { id: "row-1", values: { name: "Maria", email: "" } },
        { id: "row-2", values: { name: "", email: "joao@example.com" } },
        { id: "row-3", values: { name: "Ana", email: "" } },
      ],
    });

    expect(detectMissingValues(dataset)).toEqual([
      expect.objectContaining({
        id: "missing-values:name",
        ruleId: "missing-values",
        severity: "info",
        affectedRowIds: ["row-2"],
        affectedColumnIds: ["name"],
        affectedCellCount: 1,
      }),
      expect.objectContaining({
        id: "missing-values:email",
        affectedRowIds: ["row-1", "row-3"],
        affectedColumnIds: ["email"],
        affectedCellCount: 2,
      }),
    ]);
  });

  it("reports an empty string but does not classify whitespace-only values as missing", () => {
    const dataset = createDataset({
      rows: [
        { id: "row-1", values: { name: "", email: "   " } },
      ],
    });

    expect(detectMissingValues(dataset)).toEqual([
      expect.objectContaining({
        affectedRowIds: ["row-1"],
        affectedColumnIds: ["name"],
        affectedCellCount: 1,
      }),
    ]);
  });

  it("creates one finding per affected column", () => {
    const dataset = createDataset({
      rows: [
        { id: "row-1", values: { name: "", email: "" } },
      ],
    });

    expect(detectMissingValues(dataset).map((issue) => issue.affectedColumnIds)).toEqual([
      ["name"],
      ["email"],
    ]);
  });

  it("handles an empty dataset", () => {
    expect(detectMissingValues({ columns: [], rows: [] })).toEqual([]);
  });

  it("does not create findings when there are no rows", () => {
    expect(detectMissingValues({
      columns: [{ id: "name", name: "Name" }],
      rows: [],
    })).toEqual([]);
  });

  it("does not modify the original dataset", () => {
    const dataset = createDataset({
      rows: [
        { id: "row-1", values: { name: "", email: "maria@example.com" } },
      ],
    });
    const original = structuredClone(dataset);

    detectMissingValues(dataset);

    expect(dataset).toEqual(original);
  });
});
