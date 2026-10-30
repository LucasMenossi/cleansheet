import { describe, expect, it } from "vitest";
import type { Dataset } from "../../dataset/types";
import { detectDuplicateRows } from "./duplicate-rows";

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

describe("detectDuplicateRows", () => {
  it("returns no issues when every row is unique", () => {
    expect(detectDuplicateRows(createDataset())).toEqual([]);
  });

  it("detects exact duplicates across all columns", () => {
    const dataset = createDataset({
      rows: [
        { id: "row-1", values: { name: "Maria", email: "maria@example.com" } },
        { id: "row-2", values: { name: "João", email: "joao@example.com" } },
        { id: "row-3", values: { name: "Maria", email: "maria@example.com" } },
      ],
    });

    expect(detectDuplicateRows(dataset)).toEqual([
      {
        id: "duplicate-rows:row-1,row-3",
        ruleId: "duplicate-rows",
        severity: "warning",
        title: "Duplicate rows (2)",
        description: "These 2 rows contain identical values across all 2 columns. Review the group and decide which record(s) to keep.",
        affectedRowIds: ["row-1", "row-3"],
        affectedColumnIds: ["name", "email"],
        affectedCellCount: 2,
      },
    ]);
  });

  it("groups more than two identical rows together", () => {
    const dataset = createDataset({
      rows: [
        { id: "row-1", values: { name: "Maria", email: "maria@example.com" } },
        { id: "row-2", values: { name: "Maria", email: "maria@example.com" } },
        { id: "row-3", values: { name: "Maria", email: "maria@example.com" } },
      ],
    });

    const issues = detectDuplicateRows(dataset);

    expect(issues).toHaveLength(1);
    expect(issues[0]).toEqual(expect.objectContaining({
      affectedRowIds: ["row-1", "row-2", "row-3"],
      affectedCellCount: 4,
    }));
  });

  it("does not consider rows duplicates when only some columns match", () => {
    const dataset = createDataset({
      rows: [
        { id: "row-1", values: { name: "Maria", email: "maria@example.com" } },
        { id: "row-2", values: { name: "Maria", email: "maria+other@example.com" } },
      ],
    });

    expect(detectDuplicateRows(dataset)).toEqual([]);
  });

  it("compares values exactly without trimming or changing case", () => {
    const dataset = createDataset({
      rows: [
        { id: "row-1", values: { name: "Maria", email: "maria@example.com" } },
        { id: "row-2", values: { name: " Maria", email: "maria@example.com" } },
        { id: "row-3", values: { name: "maria", email: "maria@example.com" } },
      ],
    });

    expect(detectDuplicateRows(dataset)).toEqual([]);
  });

  it("detects separate duplicate groups", () => {
    const dataset = createDataset({
      rows: [
        { id: "row-1", values: { name: "Maria", email: "maria@example.com" } },
        { id: "row-2", values: { name: "João", email: "joao@example.com" } },
        { id: "row-3", values: { name: "Maria", email: "maria@example.com" } },
        { id: "row-4", values: { name: "João", email: "joao@example.com" } },
      ],
    });

    expect(detectDuplicateRows(dataset).map((issue) => issue.affectedRowIds)).toEqual([
      ["row-1", "row-3"],
      ["row-2", "row-4"],
    ]);
  });

  it("handles datasets without columns or with fewer than two rows", () => {
    expect(detectDuplicateRows({ columns: [], rows: [{ id: "row-1", values: {} }] })).toEqual([]);
    expect(detectDuplicateRows({
      columns: [{ id: "name", name: "Name" }],
      rows: [{ id: "row-1", values: { name: "Maria" } }],
    })).toEqual([]);
  });

  it("does not modify the original dataset", () => {
    const dataset = createDataset({
      rows: [
        { id: "row-1", values: { name: "Maria", email: "maria@example.com" } },
        { id: "row-2", values: { name: "Maria", email: "maria@example.com" } },
      ],
    });
    const original = structuredClone(dataset);

    detectDuplicateRows(dataset);

    expect(dataset).toEqual(original);
  });
});
