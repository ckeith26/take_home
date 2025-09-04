import React from 'react';
import { createPortal } from 'react-dom';

type Option = { id: string; key: string; title: string };

export type KeytipOverlayProps = {
  visible: boolean;
  modifierLabel: string; // e.g., 'Alt' or '⌘'
  sequence: string[]; // already normalized
  options: Option[];
  onSelect: (id: string) => void;
  onBack?: () => void;
  onCancel?: () => void;
  position?: { top: number; left: number };
  onDragPosition?: (pos: { top: number; left: number }) => void;
  selectedIndex?: number;
};

const badgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 22,
  height: 22,
  padding: '0 6px',
  borderRadius: 4,
  background: '#e8f0fe',
  color: '#1a73e8',
  fontWeight: 600,
  marginRight: 6,
  border: '1px solid #c6dafc',
};

const footerHint: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  marginRight: 16,
  color: '#5f6368',
  fontSize: 12,
};

export const KeytipOverlay: React.FC<KeytipOverlayProps> = ({
  visible,
  modifierLabel,
  sequence,
  options,
  onSelect,
  position,
  onDragPosition,
  selectedIndex = 0,
}) => {
  // simple drag from header (hook must be declared before any early returns)
  const startRef = React.useRef<{ x: number; y: number; top: number; left: number } | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const supportsBackdrop = React.useMemo(() => {
    try {
      const css: any = (window as any).CSS;
      return !!(css && (css.supports?.('backdrop-filter: blur(1px)') || css.supports?.('-webkit-backdrop-filter: blur(1px)')));
    } catch {
      return false;
    }
  }, []);
  const onMouseDown = (e: React.MouseEvent) => {
    const overlayEl = e.currentTarget.parentElement as HTMLElement; // overlay container
    const containerEl = (overlayEl.offsetParent as HTMLElement) || document.body; // positioned ancestor
    const overlayRect = overlayEl.getBoundingClientRect();
    const containerRect = containerEl.getBoundingClientRect();
    // store starting position relative to container, not viewport
    startRef.current = { x: e.clientX, y: e.clientY, top: overlayRect.top - containerRect.top, left: overlayRect.left - containerRect.left };
    e.preventDefault();
    window.addEventListener('mousemove', onMouseMove as any, { passive: true } as any);
    window.addEventListener('mouseup', onMouseUp as any, { passive: true } as any);
  };
  const onMouseMove = (e: MouseEvent) => {
    if (!startRef.current || !onDragPosition) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    // Clamp within viewport
    const overlayWidth = containerRef.current?.offsetWidth ?? 420;
    const overlayHeight = containerRef.current?.offsetHeight ?? 240;
    const margin = 8;
    const maxLeft = Math.max(0, window.innerWidth - overlayWidth - margin);
    const maxTop = Math.max(0, window.innerHeight - overlayHeight - margin);
    const nextTop = Math.min(Math.max(margin, startRef.current.top + dy), maxTop);
    const nextLeft = Math.min(Math.max(margin, startRef.current.left + dx), maxLeft);
    onDragPosition({ top: nextTop, left: nextLeft });
  };
  const onMouseUp = () => {
    startRef.current = null;
    window.removeEventListener('mousemove', onMouseMove as any);
    window.removeEventListener('mouseup', onMouseUp as any);
  };

  // Clamp on resize so the overlay remains visible if viewport shrinks
  React.useEffect(() => {
    const onResize = () => {
      if (!onDragPosition) return;
      const overlayWidth = containerRef.current?.offsetWidth ?? 420;
      const overlayHeight = containerRef.current?.offsetHeight ?? 240;
      const margin = 8;
      const maxLeft = Math.max(0, window.innerWidth - overlayWidth - margin);
      const maxTop = Math.max(0, window.innerHeight - overlayHeight - margin);
      const clampedTop = Math.min(Math.max(margin, (position?.top ?? 12)), maxTop);
      const clampedLeft = Math.min(Math.max(margin, (position?.left ?? 12)), maxLeft);
      if (clampedTop !== position?.top || clampedLeft !== position?.left) {
        onDragPosition({ top: clampedTop, left: clampedLeft });
      }
    };
    window.addEventListener('resize', onResize, { passive: true });
    // run once on mount/visibility
    onResize();
    return () => window.removeEventListener('resize', onResize as any);
  }, [position?.top, position?.left, onDragPosition]);

  if (!visible) return null;

  const posStyle: React.CSSProperties = position ? { top: position.top, left: position.left } : { top: 12, left: 12 };

  return createPortal(
    <div ref={containerRef} tabIndex={-1} onKeyDown={(e) => { e.preventDefault(); e.stopPropagation(); (e as any).stopImmediatePropagation?.(); }} onKeyUp={(e) => { e.preventDefault(); e.stopPropagation(); (e as any).stopImmediatePropagation?.(); }} onKeyPress={(e) => { e.preventDefault(); e.stopPropagation(); (e as any).stopImmediatePropagation?.(); }} style={{
      position: 'fixed',
      ...posStyle,
      maxWidth: 500,

      background: supportsBackdrop ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.92)',
      backdropFilter: supportsBackdrop ? 'blur(18px) saturate(160%)' : 'none',
      WebkitBackdropFilter: supportsBackdrop ? 'blur(18px) saturate(160%)' : 'none',
      backgroundImage: supportsBackdrop ? 'radial-gradient(1200px 400px at 0% 0%, rgba(255,255,255,0.25), rgba(255,255,255,0))' : 'linear-gradient(to bottom, rgba(255,255,255,0.2), rgba(255,255,255,0.2))',
      borderRadius: 12,
      boxShadow: '0 12px 28px rgba(0,0,0,0.2), inset 0 0 0 1px rgba(255,255,255,0.18)',
      border: supportsBackdrop ? '1px solid rgba(255,255,255,0.35)' : '1px solid #e0e3e7',
      overflow: 'hidden',
      zIndex: 1000,
      pointerEvents: 'auto',
    }}>
      <div onMouseDown={onMouseDown} style={{ padding: '10px 12px', borderBottom: supportsBackdrop ? '1px solid rgba(255,255,255,0.28)' : '1px solid #eef1f4', display: 'flex', alignItems: 'center', gap: 8, cursor: 'move', userSelect: 'none', background: supportsBackdrop ? 'rgba(255,255,255,0.06)' : undefined }}>
        <span style={{ color: '#5f6368', marginRight: 8 }}>Current:</span>
        <span style={badgeStyle}>{modifierLabel}</span>
        {sequence.map((k, idx) => (
          <span key={`${k}-${idx}`} style={badgeStyle}>{k}</span>
        ))}
      </div>

      <div style={{ maxHeight: 240, overflowY: 'auto' }}>
        {options.map((opt, idx) => (
          <button
            key={opt.id}
            onClick={() => onSelect(opt.id)}
            style={{
              all: 'unset',
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              padding: '10px 12px',
              cursor: 'pointer',
              background: idx === selectedIndex ? 'rgba(26,115,232,0.08)' : 'transparent'
            }}
          >
            <span style={badgeStyle}>{opt.key}</span>
            <span style={{ color: '#1f1f1f' }}>{opt.title}</span>
          </button>
        ))}
        {options.length === 0 && (
          <div style={{ padding: '12px', color: '#5f6368' }}>No options available</div>
        )}
      </div>

      <div style={{ padding: '8px 12px', borderTop: supportsBackdrop ? '1px solid rgba(255,255,255,0.28)' : '1px solid #eef1f4', display: 'flex', alignItems: 'center', background: supportsBackdrop ? 'rgba(255,255,255,0.06)' : undefined }}>
        <div style={footerHint}><span style={badgeStyle as React.CSSProperties}>BACKSPACE</span> <span>to go back</span></div>
        <div style={footerHint}><span style={badgeStyle as React.CSSProperties}>↑↓</span> <span>to navigate</span></div>
        <div style={footerHint}><span style={badgeStyle as React.CSSProperties}>ENTER</span> <span>to select</span></div>
        <div style={{ marginLeft: 'auto', ...footerHint }}><span style={badgeStyle as React.CSSProperties}>ESC</span> <span>to close</span></div>
      </div>
    </div>,
    document.body
  );
};

export default KeytipOverlay;


