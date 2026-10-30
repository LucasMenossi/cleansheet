import type { Column, Row } from "./types";

/**
 * Reads a cell while supporting both the stable column-id key and the original
 * CSV-header key used by the current import/export model.
 */
export function getCellValue(row: Row, column: Column): string {
  return row.values[column.id] ?? row.values[column.name] ?? "";
}
