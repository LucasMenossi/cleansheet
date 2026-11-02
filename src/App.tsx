import { useState } from "react";
import { DataAnalysis } from "./components/data-analysis/DataAnalysis";
import type { DataIssue } from "./features/analysis/types";
import { CsvExport } from "./components/csv-export/CsvExport";
import { CsvImport } from "./components/csv-import/CsvImport";
import { DataPreview } from "./components/data-preview/DataPreview";
import { DATA_PREVIEW_PAGE_SIZE } from "./components/data-preview/constants";
import type { Dataset } from "./features/dataset/types";
import { applyTransformation } from "./features/transformations/apply-transformation";
import type { CellChange } from "./features/transformations/types";

export default function App() {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [originalDataset, setOriginalDataset] = useState<Dataset | null>(null);
  const [pastDatasets, setPastDatasets] = useState<Dataset[]>([]);
  const [futureDatasets, setFutureDatasets] = useState<Dataset[]>([]);
  const [delimiter, setDelimiter] = useState(",");
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [operationNotice, setOperationNotice] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<DataIssue | null>(null);
  const [datasetRevision, setDatasetRevision] = useState(0);
  const [previewPageIndex, setPreviewPageIndex] = useState(0);
  const [appliedOperations, setAppliedOperations] = useState<
    { id: string; label: string; description: string }[]
  >([]);
  const [undoneOperations, setUndoneOperations] = useState<
    { id: string; label: string; description: string }[]
  >([]);

  const HISTORY_LIMIT = 50;

  function handleSelectIssue(issue: DataIssue | null) {
    setSelectedIssue(issue);
    if (!issue || !dataset) return;
    const firstAffectedIndex = dataset.rows.findIndex(
      (row) => row.id === issue.affectedRowIds[0],
    );
    if (firstAffectedIndex >= 0)
      setPreviewPageIndex(
        Math.floor(firstAffectedIndex / DATA_PREVIEW_PAGE_SIZE),
      );
  }

  function handleImport(importedDataset: Dataset, importedDelimiter: string) {
    setDataset(importedDataset);
    setDatasetRevision((current) => current + 1);
    setPreviewPageIndex(0);
    setOriginalDataset(importedDataset);
    setPastDatasets([]);
    setFutureDatasets([]);
    setAppliedOperations([]);
    setUndoneOperations([]);
    setDelimiter(importedDelimiter);
    setExportError(null);
    setExportSuccess(false);
    setOperationNotice(null);
    setSelectedIssue(null);
  }

  function handleReset() {
    setDataset(null);
    setDatasetRevision((current) => current + 1);
    setPreviewPageIndex(0);
    setOriginalDataset(null);
    setPastDatasets([]);
    setFutureDatasets([]);
    setAppliedOperations([]);
    setUndoneOperations([]);
    setDelimiter(",");
    setExportError(null);
    setExportSuccess(false);
    setOperationNotice(null);
    setSelectedIssue(null);
  }

  function handleRemoveDuplicateRows(
    rowIds: string[],
    expectedRows: { rowId: string; values: Record<string, string> }[],
  ) {
    if (!dataset || rowIds.length === 0) return;
    const nextDataset = applyTransformation(dataset, {
      id: crypto.randomUUID(),
      type: "remove-duplicate-rows",
      label: "Remover registros duplicados",
      rowIds,
      expectedRows,
    });
    if (nextDataset === dataset) {
      setOperationNotice(
        "Os registros mudaram desde a revisão. A remoção foi cancelada; analise os achados atualizados.",
      );
      return;
    }
    setPastDatasets((current) => [...current, dataset].slice(-HISTORY_LIMIT));
    setFutureDatasets([]);
    setAppliedOperations((current) =>
      [
        ...current,
        {
          id: crypto.randomUUID(),
          label: "Remover registros duplicados",
          description: ` ${rowIds.length} registro(s) removido(s)`,
        },
      ].slice(-HISTORY_LIMIT),
    );
    setUndoneOperations([]);
    setDataset(nextDataset);
    setDatasetRevision((current) => current + 1);
    setPreviewPageIndex(0);
    setSelectedIssue(null);
    setOperationNotice(null);
    setExportSuccess(false);
  }

  function handleApplyTrim(changes: CellChange[]) {
    if (!dataset || changes.length === 0) return;
    const nextDataset = applyTransformation(dataset, {
      id: crypto.randomUUID(),
      type: "trim-whitespace",
      label: "Remover espaços extras",
      changes,
    });
    if (nextDataset === dataset) {
      setOperationNotice(
        "Os valores mudaram desde a revisão. Nenhuma correção foi aplicada; revise a sugestão atualizada.",
      );
      return;
    }
    setPastDatasets((current) => [...current, dataset].slice(-HISTORY_LIMIT));
    setFutureDatasets([]);
    setAppliedOperations((current) =>
      [
        ...current,
        {
          id: crypto.randomUUID(),
          label: "Remover espaços extras",
          description: `${changes.length} valor(es) ajustado(s)`,
        },
      ].slice(-HISTORY_LIMIT),
    );
    setUndoneOperations([]);
    setDataset(nextDataset);
    setDatasetRevision((current) => current + 1);
    setPreviewPageIndex(0);
    setSelectedIssue(null);
    setOperationNotice(null);
    setExportSuccess(false);
  }

  function handleUndo() {
    if (!dataset || pastDatasets.length === 0) return;
    const previousDataset = pastDatasets[pastDatasets.length - 1];
    const operation = appliedOperations[appliedOperations.length - 1];
    if (!operation) return;
    setPastDatasets((current) => current.slice(0, -1));
    setFutureDatasets((current) => [...current, dataset].slice(-HISTORY_LIMIT));
    setUndoneOperations((current) =>
      [...current, operation].slice(-HISTORY_LIMIT),
    );
    setAppliedOperations((current) => current.slice(0, -1));
    setDataset(previousDataset);
    setDatasetRevision((current) => current + 1);
    setPreviewPageIndex(0);
    setSelectedIssue(null);
    setOperationNotice(null);
    setExportSuccess(false);
  }

  function handleRedo() {
    if (!dataset || futureDatasets.length === 0) return;
    const nextDataset = futureDatasets[futureDatasets.length - 1];
    const operation = undoneOperations[undoneOperations.length - 1];
    if (!operation) return;
    setFutureDatasets((current) => current.slice(0, -1));
    setPastDatasets((current) => [...current, dataset].slice(-HISTORY_LIMIT));
    setAppliedOperations((current) =>
      [...current, operation].slice(-HISTORY_LIMIT),
    );
    setUndoneOperations((current) => current.slice(0, -1));
    setDataset(nextDataset);
    setDatasetRevision((current) => current + 1);
    setPreviewPageIndex(0);
    setSelectedIssue(null);
    setOperationNotice(null);
    setExportSuccess(false);
  }

  function handleExport(content: string) {
    try {
      const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "cleansheet.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      setExportError(null);
      setExportSuccess(true);
    } catch {
      setExportError("Não foi possível gerar o download. Tente novamente.");
      setExportSuccess(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="app-brand-mark" aria-hidden="true">
          C
        </div>
        <div>
          <p className="eyebrow">CSV WORKSPACE</p>
          <h1>CleanSheet</h1>
          <p className="app-subtitle">
            Prepare seus arquivos CSV com mais clareza e segurança.
          </p>
        </div>
      </header>

      {!dataset ? (
        <section className="workspace-card" aria-labelledby="import-heading">
          <div className="section-heading">
            <p className="eyebrow">COMECE POR AQUI</p>
            <h2 id="import-heading">Importe sua planilha</h2>
            <p>Seus dados são processados localmente neste navegador.</p>
          </div>
          <CsvImport onImport={handleImport} />
        </section>
      ) : (
        <section className="workspace-card" aria-labelledby="preview-heading">
          <div className="preview-toolbar">
            <div className="section-heading">
              <p className="eyebrow">SEU ARQUIVO</p>
              <h2 id="preview-heading">Prévia dos dados</h2>
              <p>
                Delimitador:{" "}
                {delimiter === "\t"
                  ? "tabulação"
                  : delimiter === ";"
                    ? "ponto e vírgula"
                    : "vírgula"}
              </p>
            </div>
            <div className="toolbar-actions">
              <div
                className="history-actions"
                aria-label="Histórico de alterações"
              >
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={handleUndo}
                  disabled={pastDatasets.length === 0}
                >
                  Desfazer
                </button>
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={handleRedo}
                  disabled={futureDatasets.length === 0}
                >
                  Refazer
                </button>
              </div>
              <CsvExport
                dataset={dataset}
                delimiter={delimiter}
                onExport={handleExport}
              />
              <button
                type="button"
                className="button button--secondary"
                onClick={handleReset}
              >
                Importar outro arquivo
              </button>
            </div>
          </div>

          {operationNotice && (
            <p role="status" className="status-message status-message--warning">
              {operationNotice}
            </p>
          )}
          {exportError && (
            <p role="alert" className="status-message status-message--error">
              {exportError}
            </p>
          )}
          {exportSuccess && (
            <p role="status" className="status-message status-message--success">
              Download do CSV iniciado.
            </p>
          )}

          <div
            className="dataset-version-summary"
            aria-label="Comparação entre arquivo original e resultado"
          >
            <span>
              Original: {originalDataset?.rows.length ?? 0} linhas ×{" "}
              {originalDataset?.columns.length ?? 0} colunas
            </span>
            <span>
              Resultado atual: {dataset.rows.length} linhas ×{" "}
              {dataset.columns.length} colunas
            </span>
            <span>
              {appliedOperations.length}{" "}
              {appliedOperations.length === 1
                ? "alteração aplicada"
                : "alterações aplicadas"}
            </span>
          </div>
          <p className="history-retention-note">
            O histórico de desfazer e refazer mantém as últimas 50 etapas.
          </p>
          <section
            className="operation-log"
            aria-labelledby="operation-log-heading"
          >
            <h3 id="operation-log-heading">Alterações aplicadas</h3>
            {appliedOperations.length === 0 ? (
              <p>Nenhuma operação aplicada até o momento.</p>
            ) : (
              <ol>
                {appliedOperations.map((operation) => (
                  <li key={operation.id}>
                    <strong>{operation.label}</strong>
                    <span>{operation.description}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
          <DataAnalysis
            dataset={dataset}
            datasetRevision={datasetRevision}
            onSelectIssue={handleSelectIssue}
            onApplyTrim={handleApplyTrim}
            onRemoveDuplicateRows={handleRemoveDuplicateRows}
          />
          {selectedIssue && (
            <p className="analysis-selection-note" role="status">
              Prévia destacada: {selectedIssue.title}. Selecione “Limpar
              destaque” no achado para remover a marcação.
            </p>
          )}
          <DataPreview
            key={datasetRevision}
            dataset={dataset}
            highlightedRowIds={selectedIssue?.affectedRowIds}
            highlightedColumnIds={selectedIssue?.affectedColumnIds}
            pageIndex={previewPageIndex}
            onPageChange={setPreviewPageIndex}
          />
          <p className="privacy-note">
            {appliedOperations.length === 0
              ? "Nenhuma correção foi aplicada. Esta prévia mantém os valores importados."
              : "Esta prévia mostra as alterações aprovadas. O arquivo original permanece preservado e você pode desfazer ou refazer as operações."}
          </p>
        </section>
      )}

      <footer className="app-footer">
        <span>CleanSheet</span>
        <span>Seus dados permanecem no navegador.</span>
      </footer>
    </main>
  );
}
