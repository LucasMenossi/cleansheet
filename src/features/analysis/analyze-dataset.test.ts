import { describe, expect, it } from "vitest";
import { analyzeDataset } from "./analyze-dataset";

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

  it("returns an empty result for a dataset without rows or columns", () => {
    expect(analyzeDataset({ columns: [], rows: [] })).toEqual({
      issues: [],
      analyzedRowCount: 0,
      analyzedColumnCount: 0,
    });
  });
});
