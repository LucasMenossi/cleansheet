import type { Dataset } from "../dataset/types";
import { getCellValue } from "../dataset/get-cell-value";
import type { Transformation } from "./types";

/** Applies only explicitly approved, still-current transformations immutably. */
export function applyTransformation(dataset: Dataset, transformation: Transformation): Dataset {
  if (transformation.type === "remove-duplicate-rows") {
    const rowsById = new Map(dataset.rows.map((row) => [row.id, row]));
    const rowIdsToRemove = new Set(transformation.rowIds);

    // Reject the whole operation if the reviewed records changed or disappeared.
    if (transformation.expectedRows) {
      const snapshotsAreCurrent = transformation.expectedRows.every((snapshot) => {
        const currentRow = rowsById.get(snapshot.rowId);
        if (!currentRow) return false;
        const currentEntries = Object.entries(currentRow.values);
        const expectedEntries = Object.entries(snapshot.values);
        return currentEntries.length === expectedEntries.length &&
          expectedEntries.every(([key, value]) => currentRow.values[key] === value);
      });
      if (!snapshotsAreCurrent) return dataset;
    }

    const allRowsExist = [...rowIdsToRemove].every((rowId) => rowsById.has(rowId));
    const removesWholeReviewGroup = transformation.expectedRows?.every((snapshot) => rowIdsToRemove.has(snapshot.rowId)) ?? false;
    // A removal must never leave the dataset empty or remove every row in a review group.
    if (!allRowsExist || removesWholeReviewGroup || rowIdsToRemove.size === 0 || rowIdsToRemove.size >= dataset.rows.length) return dataset;

    return {
      columns: dataset.columns,
      rows: dataset.rows.filter((row) => !rowIdsToRemove.has(row.id)),
    };
  }

  if (transformation.changes.length === 0) return dataset;

  const rowsById = new Map(dataset.rows.map((row) => [row.id, row]));
  const columnsById = new Map(dataset.columns.map((column) => [column.id, column]));
  const validChanges = transformation.changes.filter((change) => {
    const row = rowsById.get(change.rowId);
    const column = columnsById.get(change.columnId);
    return row !== undefined && column !== undefined && getCellValue(row, column) === change.originalValue;
  });
  // Applying a review is atomic: never silently apply only part of a stale suggestion.
  if (validChanges.length === 0 || validChanges.length !== transformation.changes.length) return dataset;

  const changesByRow = new Map<string, Map<string, { columnName: string; proposedValue: string }>>();
  for (const change of validChanges) {
    const column = columnsById.get(change.columnId);
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
