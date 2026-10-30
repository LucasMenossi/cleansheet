import { useMemo, useState } from "react";
import type { Dataset } from "../../features/dataset/types";
import { getCellValue } from "../../features/dataset/get-cell-value";
import type { DataIssue } from "../../features/analysis/types";
import type { CellChange } from "../../features/transformations/types";

type TrimWhitespaceReviewProps = {
  issue: DataIssue;
  dataset: Dataset;
  onApply: (changes: CellChange[]) => void;
};

export function TrimWhitespaceReview({ issue, dataset, onApply }: TrimWhitespaceReviewProps) {
  const column = dataset.columns.find((item) => item.id === issue.affectedColumnIds[0]);
  const candidates = useMemo(() => {
    if (!column) return [];
    return dataset.rows
      .filter((row) => issue.affectedRowIds.includes(row.id))
      .map((row) => ({
        rowId: row.id,
        rowNumber: dataset.rows.findIndex((item) => item.id === row.id) + 2,
        originalValue: getCellValue(row, column),
        proposedValue: getCellValue(row, column).trim(),
      }));
  }, [column, dataset, issue.affectedRowIds]);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>(() => candidates.map((item) => item.rowId));

  if (!column || candidates.length === 0) return null;

  const selectedChanges: CellChange[] = candidates
    .filter((candidate) => selectedRowIds.includes(candidate.rowId))
    .map((candidate) => ({
      rowId: candidate.rowId,
      columnId: column.id,
      originalValue: candidate.originalValue,
      proposedValue: candidate.proposedValue,
    }));

  function toggleRow(rowId: string, checked: boolean) {
    setSelectedRowIds((current) => checked
      ? [...current, rowId]
      : current.filter((id) => id !== rowId));
  }

  return (
    <div className="trim-review" aria-label={`Revisão de espaços extras em ${column.name}`}>
      <div className="trim-review__header">
        <div>
          <strong>Revisar correção sugerida</strong>
          <p>Compare cada valor antes de decidir. Somente os itens selecionados serão alterados.</p>
        </div>
        <span>{selectedChanges.length} de {candidates.length} selecionados</span>
      </div>
      <div className="trim-review__list">
        {candidates.map((candidate) => (
          <label className="trim-review__item" key={candidate.rowId}>
            <input
              type="checkbox"
              checked={selectedRowIds.includes(candidate.rowId)}
              onChange={(event) => toggleRow(candidate.rowId, event.target.checked)}
            />
            <span className="trim-review__row">Linha {candidate.rowNumber}</span>
            <span className="trim-review__values">
              <span><small>Original</small><code>{JSON.stringify(candidate.originalValue)}</code></span>
              <span aria-hidden="true" className="trim-review__arrow">→</span>
              <span><small>Sugerido</small><code>{JSON.stringify(candidate.proposedValue)}</code></span>
            </span>
          </label>
        ))}
      </div>
      <div className="trim-review__actions">
        <button
          type="button"
          className="button button--primary"
          disabled={selectedChanges.length === 0}
          onClick={() => onApply(selectedChanges)}
        >
          Aplicar {selectedChanges.length === 1 ? "correção selecionada" : `${selectedChanges.length} correções selecionadas`}
        </button>
        <button
          type="button"
          className="button button--secondary"
          onClick={() => setSelectedRowIds([])}
        >
          Desmarcar todos
        </button>
      </div>
    </div>
  );
}
