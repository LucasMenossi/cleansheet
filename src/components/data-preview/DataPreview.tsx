import "./data-preview.css";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import type { Dataset } from "../../features/dataset/types";

type DataPreviewProps = {
  dataset: Dataset;
};

export function DataPreview({ dataset }: DataPreviewProps) {
  const columns: ColumnDef<Dataset["rows"][number]>[] = dataset.columns.map(
    (column) => ({
      id: column.id,
      header: column.name,
      accessorFn: (row) => row.values[column.name] ?? "",
    }),
  );

  const table = useReactTable({
    data: dataset.rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="data-preview">
      <div className="data-preview__summary">
        <span>{dataset.rows.length} linhas</span>
        <span>{dataset.columns.length} colunas</span>
      </div>

      <div className="data-preview__scroll">
        <table>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} scope="col">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.original.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext(),
                    ) || "\u00A0"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
