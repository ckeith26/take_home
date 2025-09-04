import * as GC from '@mescius/spread-sheets';

export type Key = string; // normalized uppercase single character or symbol label
export type Sequence = Key[];

export type ActionContext = {
  spread: GC.Spread.Sheets.Workbook;
  sheet: GC.Spread.Sheets.Worksheet;
  notify?: (message: string, variant?: 'info' | 'error' | 'success') => void;
};

export type Keytip = {
  id: string;
  sequence: Sequence; // e.g., ['H', 'V', 'V']
  title: string; // e.g., "Paste Values"
  group?: string; // e.g., "Home"
  run: (ctx: ActionContext) => void | Promise<void>;
};

export type KeytipOption = {
  id: string;
  key: Key;
  title: string;
};


