import { useState } from "react";
import { DataAnalysis } from "./components/data-analysis/DataAnalysis";
import type { DataIssue } from "./features/analysis/types";
import { CsvExport } from "./components/csv-export/CsvExport";
import { CsvImport } from "./components/csv-import/CsvImport";
import { DataPreview } from "./components/data-preview/DataPreview";
import type { Dataset } from "./features/dataset/types";

export default function App() {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [delimiter, setDelimiter] = useState(",");
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<DataIssue | null>(null);

  function handleImport(importedDataset: Dataset, importedDelimiter: string) {
    setDataset(importedDataset);
    setDelimiter(importedDelimiter);
    setExportError(null);
    setExportSuccess(false);
    setSelectedIssue(null);
  }

  function handleReset() {
    setDataset(null);
    setDelimiter(",");
    setExportError(null);
    setExportSuccess(false);
    setSelectedIssue(null);
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
              <CsvExport dataset={dataset} delimiter={delimiter} onExport={handleExport} />
              <button type="button" className="button button--secondary" onClick={handleReset}>
                Importar outro arquivo
              </button>
            </div>
          </div>

          {exportError && <p role="alert" className="status-message status-message--error">{exportError}</p>}
          {exportSuccess && <p role="status" className="status-message status-message--success">Download do CSV iniciado.</p>}

          <DataAnalysis dataset={dataset} onSelectIssue={setSelectedIssue} />
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
            Nenhuma correção foi aplicada. Esta prévia mantém os valores importados.
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
