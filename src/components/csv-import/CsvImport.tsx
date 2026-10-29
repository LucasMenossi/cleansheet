import { useRef, useState } from "react";
import { CsvParseError, parseCsv } from "../../lib/csv/parse-csv";
import type { Dataset } from "../../features/dataset/types";

type CsvImportProps = {
  onImport: (dataset: Dataset, delimiter: string) => void;
};

export function CsvImport({ onImport }: CsvImportProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  async function handleFile(file?: File) {
    setError(null);

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Selecione um arquivo CSV.");
      return;
    }

    try {
      const content = await file.text();
      const result = parseCsv(content);

      onImport(result.dataset, result.delimiter);
    } catch (cause) {
      setError(
        cause instanceof CsvParseError
          ? cause.message
          : "Não foi possível ler o arquivo. Tente novamente.",
      );
    }
  }

  return (
    <section>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        hidden
        aria-label="Selecionar arquivo CSV"
        onChange={(event) => {
          void handleFile(event.target.files?.[0]);
          event.currentTarget.value = "";
        }}
      />

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          void handleFile(event.dataTransfer.files[0]);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Área para importar CSV"
        style={{
          padding: "40px 24px",
          border: "2px dashed #aaa",
          borderRadius: 12,
          textAlign: "center",
          background: isDragging ? "#f0f7ff" : "transparent",
          cursor: "pointer",
        }}
        onClick={() => inputRef.current?.click()}
      >
        <p>Arraste um arquivo CSV para cá</p>
        <p>ou clique para selecionar</p>
      </div>

      {error && (
        <p role="alert" style={{ color: "#b42318" }}>
          {error}
        </p>
      )}
    </section>
  );
}
