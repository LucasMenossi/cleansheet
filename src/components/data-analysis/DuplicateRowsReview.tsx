import { useMemo, useState } from "react";
import type { Dataset } from "../../features/dataset/types";
import { getCellValue } from "../../features/dataset/get-cell-value";
import type { DataIssue } from "../../features/analysis/types";

type DuplicateRowsReviewProps = {
  issue: DataIssue;
  dataset: Dataset;
  onRemove: (rowIds: string[]) => void;
};

export function DuplicateRowsReview({ issue, dataset, onRemove }: DuplicateRowsReviewProps) {
  const candidates = useMemo(() => dataset.rows
    .filter((row) => issue.affectedRowIds.includes(row.id))
    .map((row) => ({
      rowId: row.id,
      rowNumber: dataset.rows.findIndex((item) => item.id === row.id) + 2,
      values: dataset.columns.map((column) => ({ columnName: column.name, value: getCellValue(row, column) })),
    })), [dataset, issue.affectedRowIds]);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const remainingCount = candidates.length - selectedRowIds.length;

  function toggleRow(rowId: string, checked: boolean) {
    setSelectedRowIds((current) => checked
      ? [...current, rowId]
      : current.filter((id) => id !== rowId));
  }

  if (candidates.length < 2) return null;

  return (
    <div className="duplicate-review" aria-label="Revisão de registros duplicados">
      <div className="duplicate-review__header">
        <div>
          <strong>Revisar registros do grupo</strong>
          <p>Marque somente os registros que deseja remover. Pelo menos um registro deve ser mantido.</p>
        </div>
        <span>{remainingCount} de {candidates.length} serão mantidos</span>
      </div>
      <div className="duplicate-review__list">
        {candidates.map((candidate) => (
          <label className="duplicate-review__item" key={candidate.rowId}>
            <input
              type="checkbox"
              checked={selectedRowIds.includes(candidate.rowId)}
              disabled={selectedRowIds.length === candidates.length - 1 && !selectedRowIds.includes(candidate.rowId)}
              onChange={(event) => toggleRow(candidate.rowId, event.target.checked)}
            />
            <span className="duplicate-review__row">Linha {candidate.rowNumber}</span>
            <span className="duplicate-review__values">
              {candidate.values.map((cell) => (
                <span key={cell.columnName}>
                  <small>{cell.columnName}</small>
                  <code>{JSON.stringify(cell.value)}</code>
                </span>
              ))}
            </span>
            <span className={`duplicate-review__decision${selectedRowIds.includes(candidate.rowId) ? " duplicate-review__decision--remove" : ""}`}>
              {selectedRowIds.includes(candidate.rowId) ? "Remover" : "Manter"}
            </span>
          </label>
        ))}
      </div>
      <div className="duplicate-review__impact" role="status">
        Impacto: {selectedRowIds.length} {selectedRowIds.length === 1 ? "registro será removido" : "registros serão removidos"} e {remainingCount} {remainingCount === 1 ? "será mantido" : "serão mantidos"}.
      </div>
      <div className="trim-review__actions">
        <button
          type="button"
          className="button button--primary"
          disabled={selectedRowIds.length === 0 || remainingCount < 1}
          onClick={() => onRemove(selectedRowIds)}
        >
          Remover {selectedRowIds.length} {selectedRowIds.length === 1 ? "registro selecionado" : "registros selecionados"}
        </button>
        <button type="button" className="button button--secondary" onClick={() => setSelectedRowIds([])}>
          Limpar seleção
        </button>
      </div>
    </div>
  );
}
