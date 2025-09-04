import { Keytip } from './types';
import { pasteValues, borderBottom, borderTop, autoFitColumn, sortDescending } from './actions/spreadActions';


export const KEYTIPS: Keytip[] = [
  { id: 'paste-values', sequence: ['H', 'V', 'V'], title: 'Paste Values', group: 'Home', run: pasteValues },
  { id: 'border-bottom', sequence: ['H', 'B', 'B'], title: 'Border Bottom', group: 'Home', run: borderBottom },
  { id: 'border-top', sequence: ['H', 'B', 'T'], title: 'Border Top', group: 'Home', run: borderTop },
  { id: 'autofit-column', sequence: ['H', 'O', 'I'], title: 'AutoFit Column', group: 'Home', run: autoFitColumn },
  { id: 'sort-desc', sequence: ['A', 'S'], title: 'Sort Descending', group: 'Data', run: sortDescending },
];
