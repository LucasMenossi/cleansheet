# CleanSheet

CleanSheet is a browser-based tool for inspecting and cleaning CSV files. It helps people spot common data-quality issues, review proposed changes, and export a cleaned file without handing control of their data to an automated process.

The guiding principle is simple: **detect problems, explain them clearly, and never change data without approval.**

## What it does

- **Import CSV files** by selecting a file or dragging it into the app.
- **Handle common CSV formats**, including comma, semicolon, and tab delimiters, quoted fields, escaped quotes, line breaks inside quoted values, and UTF-8 BOM.
- **Choose whether the first record is a header**. When it is not, the app keeps that record as data and generates column names.
- **Preview large datasets** in a paginated table.
- **Inspect data-quality findings** without modifying the imported data:
  - leading and trailing whitespace;
  - exact duplicate rows;
  - repeated values in a user-selected column;
  - empty cells;
  - possible inconsistencies in email, date, and numeric formats.
- **Review proposed changes** before applying them. Whitespace corrections can be selected individually; duplicate records are reviewed explicitly.
- **Undo and redo** approved operations.
- **Export the result** as CSV using the detected delimiter.

Format checks are heuristic. They identify values worth reviewing; they do not prove that a value is invalid or attempt to correct it automatically. Repeated values in a column are candidates for review, not necessarily duplicate records.

## Privacy and data handling

CSV parsing, analysis, transformations, and export run in the browser. The application does not require an account or upload CSV contents to an application backend.

The original imported dataset is kept separate from the working result during the session. Changes are applied only after explicit user action.

When a CSV contains values that spreadsheet software may interpret as formulas, CleanSheet warns before export. The export preserves the original cell values; only confirm the warning when you trust the file's source and understand how the destination spreadsheet application handles such values.

## Run locally

### Requirements

- Node.js version supported by the installed Vite release
- npm

### Install and start

```bash
npm install
npm run dev
```

Vite prints the local development URL in the terminal.

## Quality checks

```bash
npm run test:run
npm run build
npm run lint
```

## Project structure

```text
src/
├── components/
│   ├── csv-import/       # File selection and import flow
│   ├── csv-export/       # Export confirmation and download
│   ├── data-analysis/    # Findings and review interfaces
│   └── data-preview/     # Paginated dataset preview
├── features/
│   ├── analysis/         # Read-only data-quality rules
│   ├── dataset/          # Dataset types and access helpers
│   └── transformations/  # Explicit, reversible changes
├── lib/
│   └── csv/              # CSV parsing and serialization
└── test/                 # Shared test setup
```

The analysis rules are independent of the React interface. Detection produces findings; the review interface lets the user decide what to do; the transformation layer applies only approved operations.

## Technology

- React and TypeScript
- Vite
- Papa Parse
- TanStack Table
- Vitest
- React Testing Library
- ESLint

## Current limitations

- CSV is the only supported file format. Excel workbooks, PDFs, and direct Google Sheets connections are not supported.
- Data is kept in browser memory for the current session; there is no cloud storage or cross-device synchronization.
- Format detection currently covers a limited set of email, date, and numeric patterns.
- Very large files can be constrained by browser memory and processing capacity. The preview is paginated, but parsing and analysis still operate on the in-memory dataset.
- CleanSheet is a data-preparation aid, not a full spreadsheet editor or a guarantee that a dataset is error-free.

## Sample data

The `test-csv/` directory contains fixtures used by the parser tests, including ordinary CSV data, semicolon-separated data, quoted fields, a UTF-8 BOM example, and an intentionally malformed file.

Use synthetic or public, non-sensitive data when evaluating the application. Do not upload confidential business or personal information to a public demo.
