import { useRef, useState } from "react";
import { CsvParseError, parseCsv } from "../../lib/csv/parse-csv";
import type { Dataset } from "../../features/dataset/types";
import "./csv-import.css";

type CsvImportProps = { onImport: (dataset: Dataset, delimiter: string) => void };
type PendingFile = { content: string; delimiter: string; fileName: string };

export function CsvImport({ onImport }: CsvImportProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [pendingFile, setPendingFile] = useState<PendingFile | null>(null);
  const [hasHeader, setHasHeader] = useState(true);

  async function handleFile(file?: File) {
    setError(null);
    setPendingFile(null);
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Selecione um arquivo com extensão .csv.");
      return;
    }
    setIsReading(true);
    try {
      const content = await file.text();
      const result = parseCsv(content, { hasHeader: false });
      setPendingFile({ content, delimiter: result.delimiter, fileName: file.name });
      setHasHeader(true);
    } catch (cause) {
      setError(cause instanceof CsvParseError ? cause.message : "Não foi possível ler o arquivo. Verifique se ele é um CSV válido e tente novamente.");
    } finally {
      setIsReading(false);
    }
  }

  function confirmImport() {
    if (!pendingFile) return;
    try {
      const result = parseCsv(pendingFile.content, { hasHeader });
      onImport(result.dataset, result.delimiter);
      setPendingFile(null);
    } catch (cause) {
      setError(cause instanceof CsvParseError ? cause.message : "Não foi possível interpretar o arquivo.");
    }
  }

  return (
    <section className="csv-import" aria-label="Importação de CSV">
      <input ref={inputRef} type="file" accept=".csv,text/csv" hidden aria-label="Selecionar arquivo CSV"
        onChange={(event) => { void handleFile(event.currentTarget.files?.[0]); event.currentTarget.value = ""; }} />
      {!pendingFile && <div
        className={`csv-import__dropzone${isDragging ? " csv-import__dropzone--dragging" : ""}`}
        onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
        onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
        onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDragging(false); }}
        onDrop={(event) => { event.preventDefault(); setIsDragging(false); void handleFile(event.dataTransfer.files[0]); }}
        onKeyDown={(event) => { if (!isReading && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); inputRef.current?.click(); } }}
        role="button" tabIndex={0} aria-label="Área para importar CSV" aria-disabled={isReading}
        onClick={() => !isReading && inputRef.current?.click()}>
        <span className="csv-import__icon" aria-hidden="true">↑</span>
        <strong>{isReading ? "Lendo arquivo…" : "Arraste seu arquivo CSV para cá"}</strong>
        <span>ou clique para selecionar um arquivo do computador</span>
        <span>Formato aceito: .csv · Processamento local</span>
      </div>}

      {pendingFile && <div className="csv-import__header-choice" aria-label="Configurações do arquivo">
        <strong>{pendingFile.fileName}</strong>
        <p>Confirme como a primeira linha deve ser interpretada antes de importar.</p>
        <label>
          <input type="checkbox" checked={hasHeader} onChange={(event) => setHasHeader(event.target.checked)} />
          A primeira linha contém os nomes das colunas
        </label>
        <p className="csv-import__hint">{hasHeader ? "A primeira linha será usada como cabeçalho." : "A primeira linha será preservada como dado e nomes genéricos serão criados (Coluna 1, Coluna 2…)."}</p>
        <div className="csv-import__actions">
          <button type="button" className="button button--primary" onClick={confirmImport}>Importar arquivo</button>
          <button type="button" className="button button--secondary" onClick={() => setPendingFile(null)}>Escolher outro arquivo</button>
        </div>
      </div>}
      {error && <p role="alert" className="csv-import__error">{error}</p>}
    </section>
  );
}
