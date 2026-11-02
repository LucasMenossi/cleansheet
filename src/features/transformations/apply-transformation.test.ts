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

  it("rejects the whole trim operation when any reviewed value is stale", () => {
    const result = applyTransformation(dataset, {
      ...transformation,
      changes: [
        transformation.changes[0],
        { rowId: "missing", columnId: "missing", originalValue: "x", proposedValue: "y" },
      ],
    });
    expect(result).toBe(dataset);
  });

  it("never removes every row from a reviewed duplicate group", () => {
    const duplicateDataset: Dataset = {
      columns: [{ id: "name-id", name: "name" }],
      rows: [
        { id: "row-a", values: { name: "Ana" } },
        { id: "row-b", values: { name: "Ana" } },
        { id: "row-c", values: { name: "Bruno" } },
      ],
    };
    expect(applyTransformation(duplicateDataset, {
      id: "remove-group",
      type: "remove-duplicate-rows",
      label: "Remover duplicatas",
      rowIds: ["row-a", "row-b"],
      expectedRows: [
        { rowId: "row-a", values: { name: "Ana" } },
        { rowId: "row-b", values: { name: "Ana" } },
      ],
    })).toBe(duplicateDataset);
  });

  it("rejects duplicate removal when a reviewed row changed after review", () => {
    const duplicateDataset: Dataset = {
      columns: [{ id: "name-id", name: "name" }],
      rows: [
        { id: "row-a", values: { name: "Ana" } },
        { id: "row-b", values: { name: "Ana" } },
        { id: "row-c", values: { name: "Bruno" } },
      ],
    };
    const result = applyTransformation(duplicateDataset, {
      id: "remove-stale",
      type: "remove-duplicate-rows",
      label: "Remover duplicata",
      rowIds: ["row-a"],
      expectedRows: [
        { rowId: "row-a", values: { name: "Ana" } },
        { rowId: "row-b", values: { name: "Ana" } },
      ],
    });
    expect(result).not.toBe(duplicateDataset);
    expect(result.rows.map((row) => row.id)).toEqual(["row-b", "row-c"]);

    const changedDataset: Dataset = {
      ...duplicateDataset,
      rows: duplicateDataset.rows.map((row) => row.id === "row-b"
        ? { ...row, values: { name: "Beatriz" } }
        : row),
    };
    expect(applyTransformation(changedDataset, {
      id: "remove-stale-2",
      type: "remove-duplicate-rows",
      label: "Remover duplicata",
      rowIds: ["row-a"],
      expectedRows: [
        { rowId: "row-a", values: { name: "Ana" } },
        { rowId: "row-b", values: { name: "Ana" } },
      ],
    })).toBe(changedDataset);
  });
});
