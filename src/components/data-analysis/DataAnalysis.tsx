import { useMemo, useState } from "react";
import { analyzeDataset } from "../../features/analysis/analyze-dataset";
import type { DataIssue } from "../../features/analysis/types";
import type { Dataset } from "../../features/dataset/types";
import type { CellChange } from "../../features/transformations/types";
import { TrimWhitespaceReview } from "./TrimWhitespaceReview";
import { DuplicateRowsReview } from "./DuplicateRowsReview";
import "./data-analysis.css";

type DataAnalysisProps = {
  dataset: Dataset;
  onSelectIssue: (issue: DataIssue | null) => void;
  onApplyTrim: (changes: CellChange[]) => void;
  onRemoveDuplicateRows: (rowIds: string[]) => void;
};

const RULE_LABELS: Record<string, string> = {
  "trim-whitespace": "Espaços extras",
  "duplicate-rows": "Linhas duplicadas",
  "missing-values": "Valores ausentes",
  "duplicate-values": "Valores repetidos",
};

function getIssueTitle(issue: DataIssue, columnNames: string[]): string {
  const columnName = columnNames[0] ?? "coluna";
  switch (issue.ruleId) {
    case "trim-whitespace": return `Espaços extras em ${columnName}`;
    case "duplicate-rows": return `Linhas duplicadas (${issue.affectedRowIds.length})`;
    case "missing-values": return `Valores ausentes em ${columnName}`;
    case "duplicate-values": return `Valores repetidos em ${columnName}`;
    default: return issue.title;
  }
}

function getIssueDescription(issue: DataIssue, columnNames: string[], columnCount: number): string {
  const columnName = columnNames[0] ?? "coluna";
  switch (issue.ruleId) {
    case "trim-whitespace":
      return `${issue.affectedCellCount} valor(es) na coluna “${columnName}” têm espaços no início ou no fim. Revise antes de aplicar uma correção.`;
    case "duplicate-rows":
      return `${issue.affectedRowIds.length} linhas têm valores idênticos em todas as ${columnCount} colunas. Revise o grupo e decida quais registros manter.`;
    case "missing-values":
      return `${issue.affectedCellCount} célula(s) estão vazias na coluna “${columnName}”. Valores compostos apenas por espaços são sinalizados separadamente.`;
    case "duplicate-values":
      return `O mesmo valor aparece em ${issue.affectedRowIds.length} linhas na coluna “${columnName}”. Revise os registros para decidir se representam duplicatas.`;
    default: return issue.description;
  }
}

export function DataAnalysis({ dataset, onSelectIssue, onApplyTrim, onRemoveDuplicateRows }: DataAnalysisProps) {
  const [duplicateColumnId, setDuplicateColumnId] = useState("");
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [reviewingIssueId, setReviewingIssueId] = useState<string | null>(null);
  const [dismissedSuggestionIds, setDismissedSuggestionIds] = useState<string[]>([]);
  const result = useMemo(
    () => analyzeDataset(dataset, { duplicateColumnId: duplicateColumnId || undefined }),
    [dataset, duplicateColumnId],
  );

  function selectIssue(issue: DataIssue) {
    const nextIssueId = selectedIssueId === issue.id ? null : issue.id;
    setSelectedIssueId(nextIssueId);
    onSelectIssue(nextIssueId ? issue : null);
  }

  function handleColumnChange(columnId: string) {
    setDuplicateColumnId(columnId);
    setSelectedIssueId(null);
    onSelectIssue(null);
  }

  const warningCount = result.issues.filter((issue) => issue.severity === "warning").length;
  const affectedRowCount = new Set(result.issues.flatMap((issue) => issue.affectedRowIds)).size;

  return (
    <section className="analysis-panel" aria-labelledby="analysis-heading">
      <div className="analysis-panel__header">
        <div>
          <p className="eyebrow">ANÁLISE AUTOMÁTICA</p>
          <h2 id="analysis-heading">Achados na sua planilha</h2>
          <p className="analysis-panel__intro">
            Identificamos possíveis problemas sem alterar nenhum valor do arquivo.
          </p>
        </div>
        <div className="analysis-panel__stats" aria-label="Resumo da análise">
          <div><strong>{result.issues.length}</strong><span>{result.issues.length === 1 ? "achado" : "achados"}</span></div>
          <div><strong>{affectedRowCount}</strong><span>{affectedRowCount === 1 ? "linha envolvida" : "linhas envolvidas"}</span></div>
        </div>
      </div>

      <div className="analysis-panel__duplicate-filter">
        <label htmlFor="duplicate-column">Verificar valores repetidos em uma coluna</label>
        <select
          id="duplicate-column"
          value={duplicateColumnId}
          onChange={(event) => handleColumnChange(event.target.value)}
        >
          <option value="">Selecione uma coluna (opcional)</option>
          {dataset.columns.map((column) => (
            <option key={column.id} value={column.id}>{column.name}</option>
          ))}
        </select>
        <p>Essa verificação compara valores exatamente como aparecem, sem ignorar diferenças de espaços ou maiúsculas.</p>
      </div>

      {result.issues.length === 0 ? (
        <div className="analysis-panel__empty" role="status">
          <span className="analysis-panel__empty-icon" aria-hidden="true">✓</span>
          <div>
            <strong>Nenhum achado encontrado</strong>
            <p>As verificações disponíveis não identificaram problemas{duplicateColumnId ? " adicionais" : ""} neste arquivo.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="analysis-panel__list" aria-label="Lista de achados">
            {result.issues.map((issue) => {
              const isSelected = selectedIssueId === issue.id;
              const rowNumbers = issue.affectedRowIds
                .map((rowId) => dataset.rows.findIndex((row) => row.id === rowId) + 2)
                .filter((rowNumber) => rowNumber > 1);
              const columnNames = issue.affectedColumnIds
                .map((columnId) => dataset.columns.find((column) => column.id === columnId)?.name)
                .filter((name): name is string => Boolean(name));
              const issueTitle = getIssueTitle(issue, columnNames);
              const issueDescription = getIssueDescription(issue, columnNames, dataset.columns.length);

              return (
                <article className={`analysis-issue${isSelected ? " analysis-issue--selected" : ""}`} key={issue.id}>
                  <div className="analysis-issue__main">
                    <div className="analysis-issue__title-row">
                      <span className={`analysis-issue__severity analysis-issue__severity--${issue.severity}`}>
                        {issue.severity === "warning" ? "Revisar" : "Informativo"}
                      </span>
                      <span className="analysis-issue__rule">{RULE_LABELS[issue.ruleId] ?? issue.ruleId}</span>
                    </div>
                    <h3>{issueTitle}</h3>
                    <p>{issueDescription}</p>
                    <div className="analysis-issue__meta">
                      <span>{issue.affectedCellCount} {issue.affectedCellCount === 1 ? "célula" : "células"}</span>
                      <span>{issue.affectedRowIds.length} {issue.affectedRowIds.length === 1 ? "linha" : "linhas"}</span>
                      {columnNames.length > 0 && <span>{columnNames.join(", ")}</span>}
                    </div>
                    <p className="analysis-issue__rows">
                      Linhas do arquivo: {rowNumbers.join(", ")}
                    </p>
                  </div>
                  {(issue.ruleId === "trim-whitespace" || issue.ruleId === "duplicate-rows" || issue.ruleId === "duplicate-values") && (
                    <div className="analysis-issue__suggestion-actions">
                      {dismissedSuggestionIds.includes(issue.id) ? (
                        <button
                          type="button"
                          className="button button--secondary"
                          onClick={() => setDismissedSuggestionIds((current) => current.filter((id) => id !== issue.id))}
                        >
                          Reabrir sugestão
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="button button--primary"
                            onClick={() => setReviewingIssueId(reviewingIssueId === issue.id ? null : issue.id)}
                          >
                            {reviewingIssueId === issue.id
                              ? "Fechar revisão"
                              : issue.ruleId === "trim-whitespace" ? "Revisar correção" : "Revisar registros"}
                          </button>
                          <button
                            type="button"
                            className="button button--secondary"
                            onClick={() => {
                              setDismissedSuggestionIds((current) => [...current, issue.id]);
                              setReviewingIssueId(null);
                            }}
                          >
                            Descartar sugestão
                          </button>
                        </>
                      )}
                    </div>
                  )}
                  <button
                    type="button"
                    className="button button--secondary analysis-issue__action"
                    aria-pressed={isSelected}
                    onClick={() => selectIssue(issue)}
                  >
                    {isSelected ? "Limpar destaque" : "Ver na prévia"}
                  </button>
                  {issue.ruleId === "trim-whitespace" && reviewingIssueId === issue.id && !dismissedSuggestionIds.includes(issue.id) && (
                    <TrimWhitespaceReview
                      issue={issue}
                      dataset={dataset}
                      onApply={(changes) => {
                        onApplyTrim(changes);
                        setReviewingIssueId(null);
                        setSelectedIssueId(null);
                        onSelectIssue(null);
                      }}
                    />
                  )}
                  {(issue.ruleId === "duplicate-rows" || issue.ruleId === "duplicate-values") && reviewingIssueId === issue.id && !dismissedSuggestionIds.includes(issue.id) && (
                    <DuplicateRowsReview
                      issue={issue}
                      dataset={dataset}
                      onRemove={(rowIds) => {
                        onRemoveDuplicateRows(rowIds);
                        setReviewingIssueId(null);
                        setSelectedIssueId(null);
                        onSelectIssue(null);
                      }}
                    />
                  )}
                  {dismissedSuggestionIds.includes(issue.id) && (
                    <p className="analysis-issue__dismissed">Sugestão descartada. Nenhum dado foi alterado.</p>
                  )}
                </article>
              );
            })}
          </div>
          {warningCount > 0 && (
            <p className="analysis-panel__note">
              {warningCount} achado(s) precisam de revisão. O CleanSheet não decide automaticamente quais dados devem ser mantidos ou corrigidos.
            </p>
          )}
        </>
      )}
    </section>
  );
}
