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
