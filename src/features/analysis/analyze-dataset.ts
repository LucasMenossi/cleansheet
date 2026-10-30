import type { Dataset } from "../dataset/types";
import type { AnalysisResult } from "./types";
import { detectTrimWhitespace } from "./rules/trim-whitespace";
import { detectDuplicateRows } from "./rules/duplicate-rows";

/** Runs the currently available read-only analysis rules. */
export function analyzeDataset(dataset: Dataset): AnalysisResult {
  return {
    issues: [
      ...detectTrimWhitespace(dataset),
      ...detectDuplicateRows(dataset),
    ],
    analyzedRowCount: dataset.rows.length,
    analyzedColumnCount: dataset.columns.length,
  };
}
