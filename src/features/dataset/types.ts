export type Column = {
  id: string;
  name: string;
};

export type Row = {
  id: string;
  values: Record<string, string>;
};

export type Dataset = {
  columns: Column[];
  rows: Row[];
};
