import { useState } from "react";
import { DataAnalysis } from "./components/data-analysis/DataAnalysis";
import type { DataIssue } from "./features/analysis/types";
import { CsvExport } from "./components/csv-export/CsvExport";
import { CsvImport } from "./components/csv-import/CsvImport";
import { DataPreview } from "./components/data-preview/DataPreview";
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
  const [selectedIssue, setSelectedIssue] = useState<DataIssue | null>(null);

  function handleImport(importedDataset: Dataset, importedDelimiter: string) {
    setDataset(importedDataset);
    setOriginalDataset(importedDataset);
    setPastDatasets([]);
    setFutureDatasets([]);
    setDelimiter(importedDelimiter);
    setExportError(null);
    setExportSuccess(false);
    setSelectedIssue(null);
  }

  function handleReset() {
    setDataset(null);
    setOriginalDataset(null);
    setPastDatasets([]);
    setFutureDatasets([]);
    setDelimiter(",");
    setExportError(null);
    setExportSuccess(false);
    setSelectedIssue(null);
  }

  function handleApplyTrim(changes: CellChange[]) {
    if (!dataset || changes.length === 0) return;
    const nextDataset = applyTransformation(dataset, {
      id: crypto.randomUUID(),
      type: "trim-whitespace",
      label: "Remover espaços extras",
      changes,
    });
    if (nextDataset === dataset) return;
    setPastDatasets((current) => [...current, dataset]);
    setFutureDatasets([]);
    setDataset(nextDataset);
    setSelectedIssue(null);
    setExportSuccess(false);
  }

  function handleUndo() {
    if (!dataset || pastDatasets.length === 0) return;
    const previousDataset = pastDatasets[pastDatasets.length - 1];
    setPastDatasets((current) => current.slice(0, -1));
    setFutureDatasets((current) => [...current, dataset]);
    setDataset(previousDataset);
    setSelectedIssue(null);
    setExportSuccess(false);
  }

  function handleRedo() {
    if (!dataset || futureDatasets.length === 0) return;
    const nextDataset = futureDatasets[futureDatasets.length - 1];
    setFutureDatasets((current) => current.slice(0, -1));
    setPastDatasets((current) => [...current, dataset]);
    setDataset(nextDataset);
    setSelectedIssue(null);
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
        <div className="app-brand-mark" aria-hidden="true">C</div>
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
                Delimitador: {delimiter === "\t" ? "tabulação" : delimiter === ";" ? "ponto e vírgula" : "vírgula"}
              </p>
            </div>
            <div className="toolbar-actions">
              <div className="history-actions" aria-label="Histórico de alterações">
                <button type="button" className="button button--secondary" onClick={handleUndo} disabled={pastDatasets.length === 0}>
                  Desfazer
                </button>
                <button type="button" className="button button--secondary" onClick={handleRedo} disabled={futureDatasets.length === 0}>
                  Refazer
                </button>
              </div>
              <CsvExport dataset={dataset} delimiter={delimiter} onExport={handleExport} />
              <button type="button" className="button button--secondary" onClick={handleReset}>
                Importar outro arquivo
              </button>
            </div>
          </div>

          {exportError && <p role="alert" className="status-message status-message--error">{exportError}</p>}
          {exportSuccess && <p role="status" className="status-message status-message--success">Download do CSV iniciado.</p>}

          <div className="dataset-version-summary" aria-label="Comparação entre arquivo original e resultado">
            <span>Original: {originalDataset?.rows.length ?? 0} linhas × {originalDataset?.columns.length ?? 0} colunas</span>
            <span>Resultado atual: {dataset.rows.length} linhas × {dataset.columns.length} colunas</span>
            <span>{pastDatasets.length} {pastDatasets.length === 1 ? "alteração aplicada" : "alterações aplicadas"}</span>
          </div>
          <DataAnalysis dataset={dataset} onSelectIssue={setSelectedIssue} onApplyTrim={handleApplyTrim} />
          {selectedIssue && (
            <p className="analysis-selection-note" role="status">
              Prévia destacada: {selectedIssue.title}. Selecione “Limpar destaque” no achado para remover a marcação.
            </p>
          )}
          <DataPreview
            dataset={dataset}
            highlightedRowIds={selectedIssue?.affectedRowIds}
            highlightedColumnIds={selectedIssue?.affectedColumnIds}
          />
          <p className="privacy-note">
            {pastDatasets.length === 0 ? "Nenhuma correção foi aplicada. Esta prévia mantém os valores importados." : "Esta prévia mostra as alterações aprovadas. O arquivo original permanece preservado e você pode desfazer ou refazer as operações."}
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
