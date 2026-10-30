export type DataIssue = {
  id: string;
  ruleId: string;
  severity: "info" | "warning";
  title: string;
  description: string;
  affectedRowIds: string[];
  affectedColumnIds: string[];
  affectedCellCount: number;
};

export type AnalysisResult = {
  issues: DataIssue[];
  analyzedRowCount: number;
  analyzedColumnCount: number;
};
