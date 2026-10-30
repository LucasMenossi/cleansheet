import { useState } from "react";
import type { Dataset } from "../../features/dataset/types";
import { CsvExportError, exportCsv, findCsvInjectionRisks } from "../../lib/csv/export-csv";
import "./csv-export.css";

type CsvExportProps = {
  dataset: Dataset;
  delimiter: string;
  onExport: (content: string) => void;
};

export function CsvExport({ dataset, delimiter, onExport }: CsvExportProps) {
  const [showInjectionWarning, setShowInjectionWarning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const risks = findCsvInjectionRisks(dataset);

  function performExport() {
    try {
      onExport(exportCsv(dataset, { delimiter }));
      setError(null);
      setShowInjectionWarning(false);
    } catch (cause) {
      setError(
        cause instanceof CsvExportError
          ? cause.message
          : "Não foi possível preparar o CSV para exportação. Nenhum arquivo foi baixado.",
      );
    }
  }

  function requestExport() {
    setError(null);
    if (risks.length > 0) {
      setShowInjectionWarning(true);
      return;
    }
    performExport();
  }

  return (
    <div className="csv-export">
      <button type="button" className="button button--primary" onClick={requestExport}>
        Exportar CSV
      </button>

      {error && <p className="csv-export__error" role="alert">{error}</p>}

      {showInjectionWarning && (
        <div className="csv-export__warning" role="alert">
          <p>
            Encontramos {risks.length} {risks.length === 1 ? "célula" : "células"} com valores que podem ser interpretados como fórmulas por alguns programas de planilha.
            O CleanSheet preservará os valores originais; exportá-los pode ser arriscado se o arquivo vier de uma fonte não confiável.
          </p>
          <div className="csv-export__actions">
            <button type="button" className="button button--danger" onClick={performExport}>
              Baixar mesmo assim
            </button>
            <button type="button" className="button button--secondary" onClick={() => setShowInjectionWarning(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
