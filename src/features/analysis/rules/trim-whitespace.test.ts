import { describe, expect, it } from "vitest";
import type { Dataset } from "../../dataset/types";
import { detectTrimWhitespace } from "./trim-whitespace";

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

describe("detectTrimWhitespace", () => {
  it("returns no issues when values have no leading or trailing whitespace", () => {
    expect(detectTrimWhitespace(createDataset())).toEqual([]);
  });

  it("detects leading and trailing whitespace and identifies affected rows and columns", () => {
    const dataset = createDataset({
      rows: [
        { id: "row-1", values: { name: " Maria", email: "maria@example.com " } },
        { id: "row-2", values: { name: "João ", email: "joao@example.com" } },
      ],
    });

    expect(detectTrimWhitespace(dataset)).toEqual([
      expect.objectContaining({
        id: "trim-whitespace:name",
        ruleId: "trim-whitespace",
        affectedRowIds: ["row-1", "row-2"],
        affectedColumnIds: ["name"],
        affectedCellCount: 2,
      }),
      expect.objectContaining({
        id: "trim-whitespace:email",
        affectedRowIds: ["row-1"],
        affectedColumnIds: ["email"],
        affectedCellCount: 1,
      }),
    ]);
  });

  it("does not flag whitespace inside a value", () => {
    const dataset = createDataset({
      rows: [{ id: "row-1", values: { name: "Mary Jane", email: "mary jane@example.com" } }],
    });

    expect(detectTrimWhitespace(dataset)).toEqual([]);
  });

  it("does not flag empty strings, but detects whitespace-only values", () => {
    const dataset = createDataset({
      rows: [
        { id: "row-1", values: { name: "", email: "   " } },
        { id: "row-2", values: { name: "   ", email: "" } },
      ],
    });

    const issues = detectTrimWhitespace(dataset);

    expect(issues).toHaveLength(2);
    expect(issues[0]).toEqual(expect.objectContaining({
      affectedRowIds: ["row-2"],
      affectedCellCount: 1,
    }));
    expect(issues[1]).toEqual(expect.objectContaining({
      affectedRowIds: ["row-1"],
      affectedCellCount: 1,
    }));
  });

  it("handles an empty dataset", () => {
    expect(detectTrimWhitespace({ columns: [], rows: [] })).toEqual([]);
  });

  it("does not modify the original dataset", () => {
    const dataset = createDataset({
      rows: [{ id: "row-1", values: { name: " Maria ", email: "maria@example.com" } }],
    });
    const original = structuredClone(dataset);

    detectTrimWhitespace(dataset);

    expect(dataset).toEqual(original);
  });
});
