import { describe, expect, it } from "vitest";
import type { Dataset } from "../../dataset/types";
import { detectDuplicateValues } from "./duplicate-values";

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

describe("detectDuplicateValues", () => {
  it("returns no issues when selected-column values are unique", () => {
    expect(detectDuplicateValues(createDataset(), "email")).toEqual([]);
  });

  it("detects repeated values in the selected column", () => {
    const dataset = createDataset({
      rows: [
        { id: "row-1", values: { name: "Maria", email: "shared@example.com" } },
        { id: "row-2", values: { name: "João", email: "joao@example.com" } },
        { id: "row-3", values: { name: "Ana", email: "shared@example.com" } },
      ],
    });

    expect(detectDuplicateValues(dataset, "email")).toEqual([
      expect.objectContaining({
        id: "duplicate-values:email:shared%40example.com",
        ruleId: "duplicate-values",
        severity: "warning",
        title: "Repeated value in Email",
        affectedRowIds: ["row-1", "row-3"],
        affectedColumnIds: ["email"],
        affectedCellCount: 2,
      }),
    ]);
  });

  it("groups three or more occurrences together", () => {
    const dataset = createDataset({
      rows: [
        { id: "row-1", values: { name: "A", email: "same@example.com" } },
        { id: "row-2", values: { name: "B", email: "same@example.com" } },
        { id: "row-3", values: { name: "C", email: "same@example.com" } },
      ],
    });

    expect(detectDuplicateValues(dataset, "email")[0]).toEqual(
      expect.objectContaining({
        affectedRowIds: ["row-1", "row-2", "row-3"],
        affectedCellCount: 3,
      }),
    );
  });

  it("does not consider values in other columns", () => {
    const dataset = createDataset({
      rows: [
        { id: "row-1", values: { name: "Maria", email: "maria@example.com" } },
        { id: "row-2", values: { name: "Maria", email: "joao@example.com" } },
      ],
    });

    expect(detectDuplicateValues(dataset, "email")).toEqual([]);
    expect(detectDuplicateValues(dataset, "name")).toHaveLength(1);
  });

  it("compares values exactly without trimming or changing case", () => {
    const dataset = createDataset({
      rows: [
        { id: "row-1", values: { name: "Maria", email: "same@example.com" } },
        { id: "row-2", values: { name: "Maria", email: " same@example.com" } },
        { id: "row-3", values: { name: "Maria", email: "SAME@example.com" } },
      ],
    });

    expect(detectDuplicateValues(dataset, "email")).toEqual([]);
  });

  it("ignores empty and whitespace-only values", () => {
    const dataset = createDataset({
      rows: [
        { id: "row-1", values: { name: "A", email: "" } },
        { id: "row-2", values: { name: "B", email: "" } },
        { id: "row-3", values: { name: "C", email: "   " } },
        { id: "row-4", values: { name: "D", email: "   " } },
      ],
    });

    expect(detectDuplicateValues(dataset, "email")).toEqual([]);
  });

  it("returns no issues for an unknown column", () => {
    expect(detectDuplicateValues(createDataset(), "unknown")).toEqual([]);
  });

  it("detects separate groups of repeated values", () => {
    const dataset = createDataset({
      rows: [
        { id: "row-1", values: { name: "A", email: "a@example.com" } },
        { id: "row-2", values: { name: "B", email: "b@example.com" } },
        { id: "row-3", values: { name: "C", email: "a@example.com" } },
        { id: "row-4", values: { name: "D", email: "b@example.com" } },
      ],
    });

    expect(detectDuplicateValues(dataset, "email").map((issue) => issue.affectedRowIds)).toEqual([
      ["row-1", "row-3"],
      ["row-2", "row-4"],
    ]);
  });

  it("does not modify the original dataset", () => {
    const dataset = createDataset({
      rows: [
        { id: "row-1", values: { name: "Maria", email: "same@example.com" } },
        { id: "row-2", values: { name: "Ana", email: "same@example.com" } },
      ],
    });
    const original = structuredClone(dataset);

    detectDuplicateValues(dataset, "email");

    expect(dataset).toEqual(original);
  });
});
