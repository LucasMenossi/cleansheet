import type { Dataset } from "../dataset/types";
import type { AnalysisResult } from "./types";
import { detectTrimWhitespace } from "./rules/trim-whitespace";
import { detectDuplicateRows } from "./rules/duplicate-rows";
import { detectMissingValues } from "./rules/missing-values";
import { detectDuplicateValues } from "./rules/duplicate-values";

export type AnalyzeDatasetOptions = {
  /** Run duplicate-value detection only for this explicitly selected column. */
  duplicateColumnId?: string;
};

/** Runs the available read-only analysis rules. */
export function analyzeDataset(
  dataset: Dataset,
  options: AnalyzeDatasetOptions = {},
): AnalysisResult {
  const duplicateValueIssues = options.duplicateColumnId
    ? detectDuplicateValues(dataset, options.duplicateColumnId)
    : [];

  return {
    issues: [
      ...detectTrimWhitespace(dataset),
      ...detectDuplicateRows(dataset),
      ...detectMissingValues(dataset),
      ...duplicateValueIssues,
    ],
    analyzedRowCount: dataset.rows.length,
    analyzedColumnCount: dataset.columns.length,
  };
}
