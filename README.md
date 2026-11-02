# CleanSheet

CleanSheet is a client-side web app for importing, previewing, and exporting CSV files. Files are processed in the browser; there is no backend upload.

## Requirements

- Node.js LTS compatible with the installed Vite version
- npm

## Run locally

```bash
npm install
npm run dev
```

## Checks

```bash
npm run test:run
npm run build
npm run lint
```

## Current scope

- Import CSV files by file picker or drag and drop.
- Detect comma, semicolon, and tab delimiters.
- Preserve cell values and header text, except for removing a leading UTF-8 BOM marker.
- Preview rows in a scrollable table.
- Export CSV with the detected delimiter.
- Validate the dataset before export instead of silently filling missing fields or dropping unexpected ones.
- Warn and require explicit confirmation when values may be interpreted as formulas by spreadsheet software. The export preserves the original values; users should only confirm for files from sources they trust.

## Test fixtures

`test-csv/` contains CSVs for parser validation:

- `iris.csv`: ordinary comma-separated data.
- `wine-quality-red-1599.csv`: semicolon-separated data with 1,599 rows.
- `products-with-quoting.csv`: valid quoting, escaped quotes, and commas inside fields.
- `sales-with-bom-and-mixed-types.csv`: UTF-8 BOM and values such as postal codes with leading zeroes.
- `broken-csv-10.csv`: intentionally malformed data that should be rejected.

Fixtures are used by automated parser tests. Keep malformed examples separate from valid examples, and do not repair imported data automatically.

## Architecture notes

CSV parsing and export logic live in `src/lib/csv/`. The dataset model lives in `src/features/dataset/`, while React components handle import, preview, and export interactions. Parsing does not normalize values or apply data-cleaning operations.

## Dataset analysis (Phase 2 — initial rules)

The read-only analysis rules are implemented in `src/features/analysis`:

- `analyzeDataset(dataset)` runs the available read-only analysis rules and returns the issues plus the analyzed row/column counts.
- `detectTrimWhitespace(dataset)` reports leading/trailing whitespace, grouped by affected column.
- `detectDuplicateRows(dataset)` groups rows with exactly matching values across all columns. It reports all row IDs in each group and does not select or remove a record.
- `detectMissingValues(dataset)` reports empty-string cells by column, including affected row IDs and counts. These findings are informational and never fill or modify cells.
- `detectDuplicateValues(dataset, columnId)` reports repeated non-blank values in one explicitly selected column. `analyzeDataset(dataset, { duplicateColumnId })` optionally includes this rule; it is not run without a selected column.
- Missing-value detection treats only `""` as empty. Whitespace-only values are handled separately by `detectTrimWhitespace(dataset)`.
- Duplicate comparison is exact: whitespace and letter case are significant. Duplicate-value detection ignores empty and whitespace-only cells, which are handled by the missing-value and whitespace rules.
- Each issue includes stable row/column references and an affected-cell count.
- Analysis never changes dataset values. Applying corrections is intentionally not part of this phase.

Run the tests with `npm run test:run`, then verify the project with `npm run build` and `npm run lint`.

## Findings in the interface

After importing a CSV, the `DataAnalysis` component displays the available findings, severity, affected columns, row numbers, and cell counts. Users can select **Ver na prévia** to highlight the affected rows and cells in the data table, then clear the highlight without changing the imported values. Repeated-value analysis remains opt-in and runs only after the user selects a column.

The analysis rules read values using the stable column ID when present and fall back to the original CSV header key. This keeps analysis compatible with the current dataset import/export representation, where cell values are keyed by header text while columns also have generated IDs.


## Review and transformations (Phase 3 — initial slice)

- Whitespace findings expose a review panel with the original value and the trimmed proposal for each affected row.
- Users can select individual suggestions, apply only the selected changes, or dismiss and reopen the suggestion without changing data.
- `applyTransformation(dataset, transformation)` applies approved cell changes immutably. Changes are checked against their original values to avoid applying stale suggestions.
- The imported dataset is retained separately from the working result. The current result is used for preview and export.
- The application keeps dataset snapshots for undo and redo. Importing another CSV resets the history.
- The preview reports original and current row/column counts.

The predictable whitespace correction is applied only after explicit review. Duplicate-row resolution is also available through a separate record-by-record review flow; no potentially destructive decision is made automatically.

### Duplicate review (Phase 3)

- Exact duplicate-row findings and selected-column repeated-value findings expose a review panel with the complete values of each affected record.
- No row is preselected for deletion. Users explicitly mark the records to remove, while the interface requires at least one record in the duplicate group to remain.
- The panel previews the impact before the user confirms the removal.
- `remove-duplicate-rows` transformations remove only the explicitly selected row IDs and return a new dataset. The original dataset remains unchanged.
- Duplicate resolution participates in the same undo/redo history as whitespace corrections.
- Repeated values in a selected column are only candidates: the user must inspect the other columns before deciding whether a record should be removed.

## Robustness and larger files

- Undo/redo stores up to the latest 50 dataset snapshots. A new approved transformation clears the redo stack; importing another file resets both stacks.
- Trim operations are atomic: if any selected cell no longer matches the value shown during review, none of that batch is applied.
- Duplicate-row removal captures a snapshot of every record shown in the review. If a reviewed record changes or disappears before confirmation, the removal is rejected. The transformation layer also prevents removing every record in a reviewed duplicate group.
- Analysis uses React's deferred rendering so higher-priority interactions can proceed while a changed dataset is re-analyzed. Review and navigation actions are temporarily disabled while the displayed findings are catching up.
- The data preview renders 100 rows per page instead of mounting every row at once. Selecting a finding navigates to the page containing its first affected record and scrolls the row into view.
