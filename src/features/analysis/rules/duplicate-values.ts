import type { Dataset } from "../../dataset/types";
import type { DataIssue } from "../types";

export const DUPLICATE_VALUES_RULE_ID = "duplicate-values";

/**
 * Finds repeated, non-blank values in one selected column.
 * Comparison is exact: whitespace and letter case remain significant.
 * Blank and whitespace-only values are ignored because they are handled by
 * the missing-values and trim-whitespace rules. This rule is read-only.
 */
export function detectDuplicateValues(
  dataset: Dataset,
  columnId: string,
): DataIssue[] {
  const column = dataset.columns.find((item) => item.id === columnId);

  if (!column) {
    return [];
  }

  const rowsByValue = new Map<string, string[]>();

  for (const row of dataset.rows) {
    const value = row.values[columnId];

    if (typeof value !== "string" || value.trim() === "") {
      continue;
    }

    const matchingRowIds = rowsByValue.get(value);

    if (matchingRowIds) {
      matchingRowIds.push(row.id);
    } else {
      rowsByValue.set(value, [row.id]);
    }
  }

  return Array.from(rowsByValue.entries())
    .filter(([, rowIds]) => rowIds.length > 1)
    .map(([value, rowIds]) => ({
      id: `${DUPLICATE_VALUES_RULE_ID}:${encodeURIComponent(columnId)}:${encodeURIComponent(value)}`,
      ruleId: DUPLICATE_VALUES_RULE_ID,
      severity: "warning",
      title: `Repeated value in ${column.name}`,
      description: `The value “${value}” appears in ${rowIds.length} rows in the “${column.name}” column. Review these records to decide whether they represent duplicates.`,
      affectedRowIds: rowIds,
      affectedColumnIds: [columnId],
      affectedCellCount: rowIds.length,
    }));
}
