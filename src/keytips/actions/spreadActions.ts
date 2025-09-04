import * as GC from '@mescius/spread-sheets';
import { ActionContext } from '../types';

const getSelections = (sheet: GC.Spread.Sheets.Worksheet) => sheet.getSelections?.() || [];

export const pasteValues = async ({ sheet, notify }: ActionContext) => {
  // Strategy:
  // 1) Try navigator.clipboard.readText() first to detect "empty" clipboard reliably
  // 2) If text present, parse TSV and write values manually
  // 3) If clipboard read is blocked, fall back to SpreadJS paste command (values-only)

  const startSel = sheet.getSelections?.()?.[0];
  if (!startSel) {
    (sheet as any).parent?.parent?.notify?.('Select a target cell before pasting', 'error');
    // Use context.notify if available via bound closure in provider
  }
  const startRow = startSel ? startSel.row : sheet.getActiveRowIndex();
  const startCol = startSel ? startSel.col : sheet.getActiveColumnIndex();

  // Attempt 1: Read plain text clipboard as TSV and paste values
  try {
    const text = await navigator.clipboard.readText();
    if (!text || text.trim().length === 0) {
      notify?.('No copied values to paste', 'error');
      return;
    }
    const rows = text.replace(/\r/g, '').split('\n').filter(r => r.length > 0);
    const grid = rows.map(r => r.split('\t'));

    // Determine if grid has any non-empty cell
    const hasAny = grid.some(row => row.some(cell => String(cell).trim().length > 0));
    if (!hasAny) {
      notify?.('No copied values to paste', 'error');
      return;
    }

    for (let r = 0; r < grid.length; r++) {
      const rowVals = grid[r];
      for (let c = 0; c < rowVals.length; c++) {
        const raw = rowVals[c];
        const num = raw !== '' && !isNaN(Number(raw)) ? Number(raw) : raw;
        sheet.setValue(startRow + r, startCol + c, num);
      }
    }
    return;
  } catch (err) {
    // If reading clipboard is not permitted, fall back to SpreadJS paste command
    try {
      const wb = (sheet as any).parent || (sheet as any)._parent || undefined;
      if (wb && (wb as any).commandManager) {
        (wb as any).commandManager().execute({
          cmd: 'paste',
          sheetName: sheet.name(),
          pasteOption: GC.Spread.Sheets.ClipboardPasteOptions.values,
        });
        return;
      }
    } catch {}
    notify?.('Clipboard read not permitted', 'error');
  }
};

export const borderBottom = ({ sheet }: ActionContext) => {
  const selections = getSelections(sheet);
  const border = new GC.Spread.Sheets.LineBorder('#000000', GC.Spread.Sheets.LineStyle.thin);
  selections.forEach((sel: any) => {
    const { row, col, rowCount, colCount } = sel;
    sheet.getRange(row, col, rowCount, colCount).setBorder(border, { bottom: true });
  });
};

export const borderTop = ({ sheet }: ActionContext) => {
  const selections = getSelections(sheet);
  const border = new GC.Spread.Sheets.LineBorder('#000000', GC.Spread.Sheets.LineStyle.thin);
  selections.forEach((sel: any) => {
    const { row, col, rowCount, colCount } = sel;
    sheet.getRange(row, col, rowCount, colCount).setBorder(border, { top: true });
  });
};

export const autoFitColumn = ({ sheet }: ActionContext) => {
  const selections = getSelections(sheet);
  selections.forEach((sel: any) => {
    const { col, colCount } = sel;
    for (let c = col; c < col + colCount; c++) {
      sheet.autoFitColumn(c);
    }
  });
};

export const sortDescending = ({ sheet }: ActionContext) => {
  const sel = getSelections(sheet)[0];
  if (!sel) return;
  const { row, col, rowCount, colCount } = sel;
  const sortInfo = [{ index: col, ascending: false }];
  (sheet as any).sortRange?.(row, col, rowCount, colCount, true, sortInfo);
};
