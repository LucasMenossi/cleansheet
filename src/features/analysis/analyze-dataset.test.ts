import { describe, expect, it } from "vitest";
import { analyzeDataset } from "./analyze-dataset";
import type { Dataset } from "../dataset/types";

describe("analyzeDataset", () => {
  it("returns issues and dataset dimensions", () => {
    const result = analyzeDataset({
      columns: [{ id: "name", name: "Name" }],
      rows: [
        { id: "row-1", values: { name: " Maria " } },
        { id: "row-2", values: { name: "João" } },
      ],
    });

    expect(result).toEqual({
      issues: [
        expect.objectContaining({
          ruleId: "trim-whitespace",
          affectedRowIds: ["row-1"],
          affectedColumnIds: ["name"],
          affectedCellCount: 1,
        }),
      ],
      analyzedRowCount: 2,
      analyzedColumnCount: 1,
    });
  });

  it("includes exact duplicate-row findings", () => {
    const result = analyzeDataset({
      columns: [{ id: "name", name: "Name" }],
      rows: [
        { id: "row-1", values: { name: "Maria" } },
        { id: "row-2", values: { name: "Maria" } },
      ],
    });

    expect(result.issues).toEqual([
      expect.objectContaining({
        ruleId: "duplicate-rows",
        affectedRowIds: ["row-1", "row-2"],
        affectedColumnIds: ["name"],
        affectedCellCount: 1,
      }),
    ]);
  });

  it("includes missing-value findings", () => {
    const result = analyzeDataset({
      columns: [{ id: "name", name: "Name" }],
      rows: [
        { id: "row-1", values: { name: "Maria" } },
        { id: "row-2", values: { name: "" } },
      ],
    });

    expect(result.issues).toEqual([
      expect.objectContaining({
        ruleId: "missing-values",
        severity: "info",
        affectedRowIds: ["row-2"],
        affectedColumnIds: ["name"],
        affectedCellCount: 1,
      }),
    ]);
  });

  it("includes duplicate-value findings only when a column is selected", () => {
    const dataset = {
      columns: [
        { id: "name", name: "Name" },
        { id: "email", name: "Email" },
      ],
      rows: [
        { id: "row-1", values: { name: "Maria", email: "shared@example.com" } },
        { id: "row-2", values: { name: "João", email: "shared@example.com" } },
      ],
    };

    expect(analyzeDataset(dataset).issues).toEqual([]);
    expect(analyzeDataset(dataset, { duplicateColumnId: "email" }).issues).toEqual([
      expect.objectContaining({
        ruleId: "duplicate-values",
        affectedRowIds: ["row-1", "row-2"],
        affectedColumnIds: ["email"],
        affectedCellCount: 2,
      }),
    ]);
  });

  it("returns an empty result for a dataset without rows or columns", () => {
    expect(analyzeDataset({ columns: [], rows: [] })).toEqual({
      issues: [],
      analyzedRowCount: 0,
      analyzedColumnCount: 0,
    });
  });
});

describe("analyzeDataset with imported CSV-shaped values", () => {
  it("analyzes cells when values are keyed by header names and columns have generated ids", () => {
    const dataset: Dataset = {
      columns: [
        { id: "generated-name-id", name: "Name" },
        { id: "generated-email-id", name: "Email" },
      ],
      rows: [
        { id: "row-1", values: { Name: " Maria ", Email: "shared@example.com" } },
        { id: "row-2", values: { Name: "João", Email: "shared@example.com" } },
        { id: "row-3", values: { Name: "Ana", Email: "" } },
      ],
    };

    const result = analyzeDataset(dataset, { duplicateColumnId: "generated-email-id" });

    expect(result.issues.map((issue) => issue.ruleId)).toEqual([
      "trim-whitespace",
      "missing-values",
      "duplicate-values",
    ]);
    expect(result.issues[0].affectedRowIds).toEqual(["row-1"]);
    expect(result.issues[1].affectedRowIds).toEqual(["row-3"]);
    expect(result.issues[2].affectedRowIds).toEqual(["row-1", "row-2"]);
  });
});

describe("analyzeDataset format consistency", () => {
  it("includes format outliers as warnings without creating a transformation", () => {
    const dataset: Dataset = {
      columns: [{ id: "email", name: "Email" }],
      rows: [
        { id: "row-1", values: { Email: "one@example.com" } },
        { id: "row-2", values: { Email: "two@example.com" } },
        { id: "row-3", values: { Email: "invalid-email" } },
      ],
    };
    const result = analyzeDataset(dataset);
    expect(result.issues).toEqual([
      expect.objectContaining({ ruleId: "inconsistent-formats", severity: "warning", affectedRowIds: ["row-3"] }),
    ]);
    expect(dataset.rows[2].values.Email).toBe("invalid-email");
  });
});
