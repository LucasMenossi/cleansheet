import type { Dataset } from "../../dataset/types";
import type { DataIssue } from "../types";

export const INCONSISTENT_FORMATS_RULE_ID = "inconsistent-formats";
type FormatKind = "email" | "date" | "number";

const detectors: Record<FormatKind, (value: string) => boolean> = {
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  date: (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) || /^\d{2}\/\d{2}\/\d{4}$/.test(value),
  number: (value) => /^-?\d+(?:[.,]\d+)?$/.test(value),
};

/** Flags mixed values only when a column has a clear majority format; never proposes a correction. */
export function detectInconsistentFormats(dataset: Dataset): DataIssue[] {
  return dataset.columns.flatMap((column) => {
    const values = dataset.rows.map((row) => row.values[column.name] ?? "").filter((value) => value.trim() !== "");
    if (values.length < 3) return [];

    const candidates = (Object.entries(detectors) as [FormatKind, (value: string) => boolean][])
      .map(([kind, detector]) => ({ kind, matching: values.filter(detector) }))
      .filter(({ matching }) => matching.length >= 2 && matching.length / values.length >= 0.6)
      .sort((a, b) => b.matching.length - a.matching.length);

    const candidate = candidates[0];
    if (!candidate || candidate.matching.length === values.length) return [];
    const detector = detectors[candidate.kind];
    const affectedRowIds = dataset.rows
      .filter((row) => {
        const value = row.values[column.name] ?? "";
        return value.trim() !== "" && !detector(value);
      })
      .map((row) => row.id);
    if (affectedRowIds.length === 0) return [];

    const labels: Record<FormatKind, string> = { email: "e-mail", date: "data", number: "número" };
    return [{
      id: `${INCONSISTENT_FORMATS_RULE_ID}:${column.id}`,
      ruleId: INCONSISTENT_FORMATS_RULE_ID,
      severity: "warning" as const,
      title: `Possível formato inconsistente em ${column.name}`,
      description: `${candidate.matching.length} de ${values.length} valores parecem seguir um formato de ${labels[candidate.kind]}. ${affectedRowIds.length} registro(s) não seguem esse padrão. Verifique manualmente; nenhum valor será corrigido automaticamente.`,
      affectedRowIds,
      affectedColumnIds: [column.id],
      affectedCellCount: affectedRowIds.length,
    }];
  });
}
