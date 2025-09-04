import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as GC from '@mescius/spread-sheets';
import { KEYTIPS } from './registry';
import { ActionContext, Sequence } from './types';
import { buildTrie, normalizeKey, queryTrie } from './trie';
import KeytipOverlay from './KeytipOverlay';

type ProviderProps = {
  children: React.ReactNode;
  spread?: GC.Spread.Sheets.Workbook | null;
};

type KeytipsContextValue = {
  active: boolean;
  start: () => void;
  stop: () => void;
};

const KeytipsContext = createContext<KeytipsContextValue | undefined>(undefined);

export const useKeytips = () => {
  const ctx = useContext(KeytipsContext);
  if (!ctx) throw new Error('useKeytips must be used within KeytipsProvider');
  return ctx;
};

export const KeytipsProvider: React.FC<ProviderProps> = ({ children, spread }) => {
  const [active, setActive] = useState(false);
  const [sequence, setSequence] = useState<Sequence>([]);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number }>(() => {
    try {
      const raw = localStorage.getItem('keytips.position');
      return raw ? JSON.parse(raw) : { top: 12, left: 12 };
    } catch {
      return { top: 12, left: 12 };
    }
  });
  const trie = useMemo(() => buildTrie(KEYTIPS), []);
  const modifierLabel = useMemo(() => (navigator.platform.includes('Mac') ? '⌘' : 'Alt'), []);

  const sheet = useMemo(() => spread?.getActiveSheet(), [spread]);

  const { options, isExact, keytips } = useMemo(() => queryTrie(trie, sequence), [trie, sequence]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const setGridShortcutsEnabled = useCallback((enabled: boolean) => {
    if (!spread || !(spread as any).commandManager) return;
    const cm = (spread as any).commandManager();
    const Key = (GC as any).Spread.Commands.Key;
    if (enabled) {
      cm.setShortcutKey('navigationUp', Key.up, false, false, false, false);
      cm.setShortcutKey('navigationDown', Key.down, false, false, false, false);
      cm.setShortcutKey('navigationLeft', Key.left, false, false, false, false);
      cm.setShortcutKey('navigationRight', Key.right, false, false, false, false);
      cm.setShortcutKey('moveToNextCell', Key.enter, false, false, false, false);
      cm.setShortcutKey('clear', Key.backspace, false, false, false, false);
    } else {
      cm.setShortcutKey(undefined as any, Key.up, false, false, false, false);
      cm.setShortcutKey(undefined as any, Key.down, false, false, false, false);
      cm.setShortcutKey(undefined as any, Key.left, false, false, false, false);
      cm.setShortcutKey(undefined as any, Key.right, false, false, false, false);
      cm.setShortcutKey(undefined as any, Key.enter, false, false, false, false);
      cm.setShortcutKey(undefined as any, Key.backspace, false, false, false, false);
    }
  }, [spread]);

  const setAllowEditInCell = useCallback((enabled: boolean) => {
    try {
      const targetSheet = spread?.getActiveSheet();
      if (!targetSheet) return;
      // Apply to entire sheet
      (targetSheet as any).getRange(-1, -1, -1, -1).allowEditInCell(enabled);
    } catch {}
  }, [spread]);

  const showToast = useCallback((msg: string, variant?: 'info' | 'error' | 'success') => {
    // Ensure a top-right toast container exists for stacking
    let container = document.getElementById('keytips-toast-container') as HTMLDivElement | null;
    if (!container) {
      container = document.createElement('div');
      container.id = 'keytips-toast-container';
      container.style.position = 'fixed';
      container.style.top = '12px';
      container.style.right = '12px';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.gap = '8px';
      container.style.zIndex = '2000';
      container.style.pointerEvents = 'none';
      document.body.appendChild(container);
    }

    const el = document.createElement('div');
    el.textContent = msg;
    el.style.pointerEvents = 'auto';
    el.style.padding = '10px 14px';
    el.style.background = variant === 'error' ? '#fdecea' : variant === 'success' ? '#e6f4ea' : '#111827';
    el.style.color = variant ? '#202124' : '#f9fafb';
    el.style.border = '1px solid rgba(0,0,0,0.12)';
    el.style.borderRadius = '8px';
    el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    el.style.maxWidth = '320px';
    el.style.fontSize = '13px';
    el.style.lineHeight = '18px';

    container.appendChild(el);
    setTimeout(() => { try { container && container.removeChild(el); } catch {} }, 2200);
  }, []);

  const runKeytips = useCallback(async () => {
    if (!isExact || keytips.length === 0 || !spread || !sheet) return;
    const ctx: ActionContext = { spread, sheet, notify: showToast } as any;
    // Run the first matching keytip
    await keytips[0].run(ctx);
    // after action completes, fully restore normal grid behavior
    setGridShortcutsEnabled(true);
    setAllowEditInCell(true);
    setSequence([]);
    setActive(false);
    setVisible(false);
  }, [isExact, keytips, sheet, spread, showToast, setAllowEditInCell, setGridShortcutsEnabled]);

  useEffect(() => { if (isExact) { runKeytips(); } }, [isExact, runKeytips]);

  const start = useCallback(() => { setActive(true); setVisible(true); setSequence([]); setSelectedIndex(0); }, []);
  const stop = useCallback(() => {
    setGridShortcutsEnabled(true);
    setAllowEditInCell(true);
    setActive(false);
    setVisible(false);
    setSequence([]);
    setSelectedIndex(0);
  }, [setAllowEditInCell, setGridShortcutsEnabled]);

  // Global key handling - latched activation on Option+Cmd until Esc is pressed
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Activate when both modifiers are down at the same time
      if (!active && e.altKey && e.metaKey) {
        e.preventDefault();
        setActive(true);
        setVisible(true);
        setSequence([]);
        // remove focus from any editor/input so keystrokes don't type into it
        const el = document.activeElement as HTMLElement | null;
        if (el && typeof el.blur === 'function') { try { el.blur(); } catch {} }
        setGridShortcutsEnabled(false);
        setAllowEditInCell(false);
        return;
      }

      if (!active) return;

      // Handle cancel
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); (e as any).stopImmediatePropagation?.(); (e as any).returnValue = false; setGridShortcutsEnabled(true); setAllowEditInCell(true); stop(); return; }

      // Arrow navigation within options list
      if (e.key === 'ArrowDown') { e.preventDefault(); e.stopPropagation(); setSelectedIndex(i => Math.min((options.length || 1) - 1, i + 1)); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); e.stopPropagation(); setSelectedIndex(i => Math.max(0, i - 1)); return; }

      // Enter selects current item if options exist
      if (e.key === 'Enter' && options.length > 0) {
        e.preventDefault(); e.stopPropagation();
        const opt = options[selectedIndex] ?? options[0];
        setSequence(seq => [...seq, normalizeKey(opt.id)]);
        setSelectedIndex(0);
        return;
      }
      if (e.key === 'Enter' && options.length === 0 && !isExact) {
        e.preventDefault(); e.stopPropagation();
        showToast('Incomplete keytip sequence', 'error');
        return;
      }

      // Handle backspace to pop last key
      if (e.key === 'Backspace') { e.preventDefault(); e.stopPropagation(); (e as any).stopImmediatePropagation?.(); (e as any).returnValue = false; setSequence(seq => seq.slice(0, -1)); return; }

      // Ignore modifier keys and navigation for sequence input
      const ignored = ['Shift', 'Alt', 'Meta', 'Control', 'CapsLock', 'Tab', 'ArrowLeft', 'ArrowRight'];
      if (ignored.includes(e.key)) { e.preventDefault(); e.stopPropagation(); (e as any).stopImmediatePropagation?.(); (e as any).returnValue = false; return; }

      e.preventDefault();
      e.stopPropagation();
      (e as any).stopImmediatePropagation?.();
      (e as any).returnValue = false;
      const nextKey = normalizeKey(e.key);
      setSequence(prev => {
        const proposed = [...prev, nextKey];
        const match = queryTrie(trie, proposed);
        if (!match.isExact && match.options.length === 0 && match.keytips.length === 0) {
          showToast('Invalid key for this sequence', 'error');
          return prev; // don't advance
        }
        setSelectedIndex(0);
        return proposed;
      });
    };

    const swallow = (e: Event) => {
      if (!active) return;
      (e as any).preventDefault?.();
      (e as any).stopPropagation?.();
      (e as any).stopImmediatePropagation?.();
      (e as any).returnValue = false;
    };

    const onClickOutside = (e: MouseEvent) => {
      if (!active || !visible) return;
      
      // Check if click is outside the keytip overlay
      const target = e.target as Element;
      const overlay = document.querySelector('[style*="position: fixed"][style*="z-index: 1000"]');
      
      if (overlay && !overlay.contains(target)) {
        setGridShortcutsEnabled(true);
        setAllowEditInCell(true);
        stop();
      }
    };

    window.addEventListener('keydown', onKeyDown, { capture: true, passive: false });
    document.addEventListener('keydown', onKeyDown, { capture: true, passive: false } as any);
    document.addEventListener('keypress', swallow, { capture: true, passive: false } as any);
    document.addEventListener('keyup', swallow, { capture: true, passive: false } as any);
    document.addEventListener('click', onClickOutside, { capture: true, passive: true } as any);
    return () => {
      window.removeEventListener('keydown', onKeyDown, { capture: true } as any);
      document.removeEventListener('keydown', onKeyDown, { capture: true } as any);
      document.removeEventListener('keypress', swallow, { capture: true } as any);
      document.removeEventListener('keyup', swallow, { capture: true } as any);
      document.removeEventListener('click', onClickOutside, { capture: true } as any);
    };
  }, [active, stop, options, selectedIndex, setGridShortcutsEnabled, setAllowEditInCell, visible, isExact, showToast, trie]);

  const onSelect = (id: string) => {
    // id is the next key to add
    setSequence(seq => [...seq, normalizeKey(id)]);
    setSelectedIndex(0);
  };

  const onDragPosition = (pos: { top: number; left: number }) => {
    setPosition(pos);
    try { localStorage.setItem('keytips.position', JSON.stringify(pos)); } catch {}
  };

  return (
    <KeytipsContext.Provider value={{ active, start, stop }}>
      {children}
      <KeytipOverlay
        visible={visible}
        modifierLabel={modifierLabel}
        sequence={sequence}
        options={options}
        onSelect={onSelect}
        position={position}
        onDragPosition={onDragPosition}
        selectedIndex={selectedIndex}
      />
    </KeytipsContext.Provider>
  );
};

export default KeytipsProvider;


