export type CellChange = {
  rowId: string;
  columnId: string;
  originalValue: string;
  proposedValue: string;
};

export type Transformation = {
  id: string;
  type: "trim-whitespace";
  label: string;
  changes: CellChange[];
};
