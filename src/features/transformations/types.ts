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

export type RemoveDuplicateRowsTransformation = {
  id: string;
  type: "remove-duplicate-rows";
  label: string;
  rowIds: string[];
};

export type Transformation = TrimWhitespaceTransformation | RemoveDuplicateRowsTransformation;
