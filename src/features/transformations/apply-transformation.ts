import type { Dataset } from "../dataset/types";
import { getCellValue } from "../dataset/get-cell-value";
import type { Transformation } from "./types";

/** Applies only explicitly approved, still-current transformations immutably. */
export function applyTransformation(dataset: Dataset, transformation: Transformation): Dataset {
  if (transformation.type === "remove-duplicate-rows") {
    const existingRowIds = new Set(dataset.rows.map((row) => row.id));
    const rowIdsToRemove = new Set(transformation.rowIds.filter((rowId) => existingRowIds.has(rowId)));

    // A removal must never leave the dataset empty or remove every row in a review group.
    if (rowIdsToRemove.size === 0 || rowIdsToRemove.size >= dataset.rows.length) return dataset;

    return {
      columns: dataset.columns,
      rows: dataset.rows.filter((row) => !rowIdsToRemove.has(row.id)),
    };
  }

  if (transformation.changes.length === 0) return dataset;

  const validChanges = transformation.changes.filter((change) => {
    const row = dataset.rows.find((item) => item.id === change.rowId);
    const column = dataset.columns.find((item) => item.id === change.columnId);
    return row !== undefined && column !== undefined && getCellValue(row, column) === change.originalValue;
  });
  if (validChanges.length === 0) return dataset;

  const changesByRow = new Map<string, Map<string, { columnName: string; proposedValue: string }>>();
  for (const change of validChanges) {
    const column = dataset.columns.find((item) => item.id === change.columnId);
    if (!column) continue;
    const rowChanges = changesByRow.get(change.rowId) ?? new Map<string, { columnName: string; proposedValue: string }>();
    rowChanges.set(change.columnId, { columnName: column.name, proposedValue: change.proposedValue });
    changesByRow.set(change.rowId, rowChanges);
  }

  return {
    columns: dataset.columns,
    rows: dataset.rows.map((row) => {
      const rowChanges = changesByRow.get(row.id);
      if (!rowChanges) return row;

      const values = { ...row.values };
      for (const [columnId, change] of rowChanges) {
        const key = Object.hasOwn(values, columnId) ? columnId : change.columnName;
        values[key] = change.proposedValue;
      }
      return { ...row, values };
    }),
  };
}
