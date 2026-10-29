import { useState } from "react";
import { CsvImport } from "./components/csv-import/CsvImport";
import { DataPreview } from "./components/data-preview/DataPreview";
import type { Dataset } from "./features/dataset/types";

export default function App() {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [delimiter, setDelimiter] = useState(",");

  function handleImport(importedDataset: Dataset, importedDelimiter: string) {
    setDataset(importedDataset);
    setDelimiter(importedDelimiter);
  }

  function handleReset() {
    setDataset(null);
    setDelimiter(",");
  }

  return (
    <main
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: 32,
      }}
    >
      <header style={{ marginBottom: 32 }}>
        <h1>CleanSheet</h1>
        <p>Prepare seus arquivos CSV para uso, com mais clareza e segurança.</p>
      </header>

      {!dataset ? (
        <CsvImport onImport={handleImport} />
      ) : (
        <section>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              marginBottom: 24,
            }}
          >
            <div>
              <h2>Prévia dos dados</h2>
              <p>Delimitador: {delimiter === "\t" ? "tabulação" : delimiter}</p>
            </div>

            <button type="button" onClick={handleReset}>
              Importar outro arquivo
            </button>
          </div>

          <DataPreview dataset={dataset} />
        </section>
      )}
    </main>
  );
}
