import { useEffect, useMemo, useRef } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import type { Dataset } from "../../features/dataset/types";
import { DATA_PREVIEW_PAGE_SIZE } from "./constants";
import "./data-preview.css";

type DataPreviewProps = {
  dataset: Dataset;
  highlightedRowIds?: string[];
  highlightedColumnIds?: string[];
  pageIndex: number;
  onPageChange: (pageIndex: number) => void;
};

export function DataPreview({
  dataset,
  highlightedRowIds = [],
  highlightedColumnIds = [],
  pageIndex,
  onPageChange,
}: DataPreviewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const highlightedRows = useMemo(() => new Set(highlightedRowIds), [highlightedRowIds]);
  const highlightedColumns = useMemo(() => new Set(highlightedColumnIds), [highlightedColumnIds]);
  const pageCount = Math.max(1, Math.ceil(dataset.rows.length / DATA_PREVIEW_PAGE_SIZE));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);
  const pageRows = useMemo(
    () => dataset.rows.slice(safePageIndex * DATA_PREVIEW_PAGE_SIZE, (safePageIndex + 1) * DATA_PREVIEW_PAGE_SIZE),
    [dataset.rows, safePageIndex],
  );
  const columns: ColumnDef<Dataset["rows"][number]>[] = useMemo(
    () => dataset.columns.map((column) => ({
      id: column.id,
      header: column.name,
      accessorFn: (row) => row.values[column.id] ?? row.values[column.name] ?? "",
    })),
    [dataset.columns],
  );

  const table = useReactTable({
    data: pageRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  useEffect(() => {
    if (highlightedRows.size === 0) return;
    const target = Array.from(
      scrollContainerRef.current?.querySelectorAll<HTMLElement>("[data-row-id]") ?? [],
    ).find((row) => highlightedRows.has(row.dataset.rowId ?? ""));
    target?.scrollIntoView?.({ block: "nearest" });
  }, [pageRows, highlightedRows]);

  const firstVisibleRow = dataset.rows.length === 0 ? 0 : safePageIndex * DATA_PREVIEW_PAGE_SIZE + 1;
  const lastVisibleRow = Math.min((safePageIndex + 1) * DATA_PREVIEW_PAGE_SIZE, dataset.rows.length);

  return (
    <div className="data-preview">
      <div className="data-preview__summary">
        <span>{dataset.rows.length} linhas</span>
        <span>{dataset.columns.length} colunas</span>
        {dataset.rows.length > DATA_PREVIEW_PAGE_SIZE && (
          <span>Exibindo {firstVisibleRow}–{lastVisibleRow} de {dataset.rows.length}</span>
        )}
      </div>

      <div className="data-preview__scroll" ref={scrollContainerRef}>
        <table>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} scope="col">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.original.id}
                data-row-id={row.original.id}
                className={highlightedRows.has(row.original.id) ? "data-preview__row--highlighted" : undefined}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={highlightedRows.has(row.original.id) && highlightedColumns.has(cell.column.id) ? "data-preview__cell--highlighted" : undefined}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext()) || "\u00A0"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <nav className="data-preview__pagination" aria-label="Paginação da prévia">
          <button
            type="button"
            className="button button--secondary"
            onClick={() => onPageChange(Math.max(0, safePageIndex - 1))}
            disabled={safePageIndex === 0}
          >
            Anterior
          </button>
          <span>Página {safePageIndex + 1} de {pageCount}</span>
          <button
            type="button"
            className="button button--secondary"
            onClick={() => onPageChange(Math.min(pageCount - 1, safePageIndex + 1))}
            disabled={safePageIndex >= pageCount - 1}
          >
            Próxima
          </button>
        </nav>
      )}
    </div>
  );
}
