export type CellChange = {
  rowId: string;
  columnId: string;
  originalValue: string;
  proposedValue: string;
};

export type TrimWhitespaceTransformation = {
  id: string;
  type: "trim-whitespace";
  label: string;
  changes: CellChange[];
};

export type ExpectedRowSnapshot = {
  rowId: string;
  values: Record<string, string>;
};

export type RemoveDuplicateRowsTransformation = {
  id: string;
  type: "remove-duplicate-rows";
  label: string;
  rowIds: string[];
  /** Snapshot of every row shown during review, used to reject stale decisions. */
  expectedRows?: ExpectedRowSnapshot[];
};

export type Transformation = TrimWhitespaceTransformation | RemoveDuplicateRowsTransformation;
