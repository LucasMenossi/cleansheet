import { useRef, useState } from "react";
import { CsvParseError, parseCsv } from "../../lib/csv/parse-csv";
import type { Dataset } from "../../features/dataset/types";
import "./csv-import.css";

type CsvImportProps = {
  onImport: (dataset: Dataset, delimiter: string) => void;
};

export function CsvImport({ onImport }: CsvImportProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isReading, setIsReading] = useState(false);

  async function handleFile(file?: File) {
    setError(null);
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Selecione um arquivo com extensão .csv.");
      return;
    }

    setIsReading(true);
    try {
      const content = await file.text();
      const result = parseCsv(content);
      onImport(result.dataset, result.delimiter);
    } catch (cause) {
      setError(
        cause instanceof CsvParseError
          ? cause.message
          : "Não foi possível ler o arquivo. Verifique se ele é um CSV válido e tente novamente.",
      );
    } finally {
      setIsReading(false);
    }
  }

  return (
    <section className="csv-import" aria-label="Importação de CSV">
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        hidden
        aria-label="Selecionar arquivo CSV"
        onChange={(event) => {
          void handleFile(event.currentTarget.files?.[0]);
          event.currentTarget.value = "";
        }}
      />

      <div
        className={`csv-import__dropzone${isDragging ? " csv-import__dropzone--dragging" : ""}`}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setIsDragging(false);
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          void handleFile(event.dataTransfer.files[0]);
        }}
        onKeyDown={(event) => {
          if (!isReading && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Área para importar CSV"
        aria-disabled={isReading}
        onClick={() => !isReading && inputRef.current?.click()}
      >
        <span className="csv-import__icon" aria-hidden="true">↑</span>
        <strong>{isReading ? "Lendo arquivo…" : "Arraste seu arquivo CSV para cá"}</strong>
        <span>ou clique para selecionar um arquivo do computador</span>
        <span>Formato aceito: .csv · Processamento local</span>
      </div>

      {error && <p role="alert" className="csv-import__error">{error}</p>}
    </section>
  );
}
