import type { Dataset } from "../../dataset/types";
import type { DataIssue } from "../types";

export const DUPLICATE_ROWS_RULE_ID = "duplicate-rows";

/**
 * Finds groups of rows whose values match exactly across every dataset column.
 * The rule is read-only and does not decide which record should be kept.
 */
export function detectDuplicateRows(dataset: Dataset): DataIssue[] {
  if (dataset.columns.length === 0 || dataset.rows.length < 2) {
    return [];
  }

  const rowsByValues = new Map<string, string[]>();

  for (const row of dataset.rows) {
    const values = dataset.columns.map((column) => row.values[column.id]);
    const key = JSON.stringify(values);
    const matchingRowIds = rowsByValues.get(key);

    if (matchingRowIds) {
      matchingRowIds.push(row.id);
    } else {
      rowsByValues.set(key, [row.id]);
    }
  }

  return Array.from(rowsByValues.values())
    .filter((rowIds) => rowIds.length > 1)
    .map((rowIds) => {
      const stableRowIds = [...rowIds].sort();
      const duplicateCopyCount = rowIds.length - 1;

      return {
        id: `${DUPLICATE_ROWS_RULE_ID}:${stableRowIds.map(encodeURIComponent).join(",")}`,
        ruleId: DUPLICATE_ROWS_RULE_ID,
        severity: "warning",
        title: `Duplicate rows (${rowIds.length})`,
        description: `These ${rowIds.length} rows contain identical values across all ${dataset.columns.length} columns. Review the group and decide which record(s) to keep.`,
        affectedRowIds: rowIds,
        affectedColumnIds: dataset.columns.map((column) => column.id),
        affectedCellCount: duplicateCopyCount * dataset.columns.length,
      };
    });
}
