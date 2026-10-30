import type { Dataset } from "../../dataset/types";
import { getCellValue } from "../../dataset/get-cell-value";
import type { DataIssue } from "../types";

export const TRIM_WHITESPACE_RULE_ID = "trim-whitespace";

/**
 * Finds values with leading or trailing whitespace.
 * This rule is read-only: it never changes the supplied dataset.
 * One issue is returned per affected column.
 */
export function detectTrimWhitespace(dataset: Dataset): DataIssue[] {
  return dataset.columns.flatMap((column) => {
    const affectedRowIds = dataset.rows
      .filter((row) => {
        const value = getCellValue(row, column);
        return typeof value === "string" && value !== value.trim();
      })
      .map((row) => row.id);

    if (affectedRowIds.length === 0) {
      return [];
    }

    return [
      {
        id: `${TRIM_WHITESPACE_RULE_ID}:${column.id}`,
        ruleId: TRIM_WHITESPACE_RULE_ID,
        severity: "warning",
        title: `Extra spaces in ${column.name}`,
        description: `${affectedRowIds.length} value(s) in the “${column.name}” column have leading or trailing whitespace. Review them before applying a correction.`,
        affectedRowIds,
        affectedColumnIds: [column.id],
        affectedCellCount: affectedRowIds.length,
      },
    ];
  });
}
