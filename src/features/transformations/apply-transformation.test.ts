import { describe, expect, it } from "vitest";
import { applyTransformation } from "./apply-transformation";
import type { Dataset } from "../dataset/types";
import type { Transformation } from "./types";

const dataset: Dataset = {
  columns: [{ id: "name-id", name: "name" }, { id: "city-id", name: "city" }],
  rows: [
    { id: "row-1", values: { name: "  Ana  ", city: " Curitiba " } },
    { id: "row-2", values: { name: "Bruno", city: "Londrina" } },
  ],
};

const transformation: Transformation = {
  id: "trim-1",
  type: "trim-whitespace",
  label: "Remover espaços extras",
  changes: [
    { rowId: "row-1", columnId: "name-id", originalValue: "  Ana  ", proposedValue: "Ana" },
    { rowId: "row-1", columnId: "city-id", originalValue: " Curitiba ", proposedValue: "Curitiba" },
  ],
};

describe("applyTransformation", () => {
  it("applies approved changes immutably", () => {
    const result = applyTransformation(dataset, transformation);
    expect(result.rows[0].values.name).toBe("Ana");
    expect(result.rows[0].values.city).toBe("Curitiba");
    expect(dataset.rows[0].values.name).toBe("  Ana  ");
    expect(result.rows[1]).toBe(dataset.rows[1]);
    expect(result).not.toBe(dataset);
  });

  it("returns the same dataset when there are no approved changes", () => {
    expect(applyTransformation(dataset, { ...transformation, changes: [] })).toBe(dataset);
  });

  it("removes only explicitly selected duplicate rows immutably", () => {
    const result = applyTransformation(dataset, {
      id: "remove-1",
      type: "remove-duplicate-rows",
      label: "Remover registros duplicados",
      rowIds: ["row-1"],
    });

    expect(result.rows.map((row) => row.id)).toEqual(["row-2"]);
    expect(dataset.rows).toHaveLength(2);
    expect(result.columns).toBe(dataset.columns);
  });

  it("does not remove every row from the dataset", () => {
    expect(applyTransformation(dataset, {
      id: "remove-all",
      type: "remove-duplicate-rows",
      label: "Remover registros duplicados",
      rowIds: ["row-1", "row-2"],
    })).toBe(dataset);
  });

  it("ignores changes that refer to an unknown row or column", () => {
    const result = applyTransformation(dataset, {
      ...transformation,
      changes: [{ rowId: "missing", columnId: "missing", originalValue: "x", proposedValue: "y" }],
    });
    expect(result.rows).toBe(dataset.rows);
  });
});
