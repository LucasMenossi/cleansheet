import type { Dataset } from "../../dataset/types";
import type { DataIssue } from "../types";

export const MISSING_VALUES_RULE_ID = "missing-values";

/**
 * Finds empty-string cells and reports their distribution by column.
 * Whitespace-only values are intentionally left to the trim-whitespace rule.
 * This rule is read-only and never fills or changes dataset values.
 */
export function detectMissingValues(dataset: Dataset): DataIssue[] {
  return dataset.columns.flatMap((column) => {
    const affectedRowIds = dataset.rows
      .filter((row) => row.values[column.id] === "")
      .map((row) => row.id);

    if (affectedRowIds.length === 0) {
      return [];
    }

    const count = affectedRowIds.length;
    const noun = count === 1 ? "cell is" : "cells are";

    return [
      {
        id: `${MISSING_VALUES_RULE_ID}:${column.id}`,
        ruleId: MISSING_VALUES_RULE_ID,
        severity: "info",
        title: `Missing values in ${column.name}`,
        description: `${count} ${noun} empty in the “${column.name}” column. Empty cells are reported as information; whitespace-only values are reported separately by the whitespace rule.`,
        affectedRowIds,
        affectedColumnIds: [column.id],
        affectedCellCount: count,
      },
    ];
  });
}
