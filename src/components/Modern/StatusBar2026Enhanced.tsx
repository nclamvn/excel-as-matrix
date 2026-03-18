// ============================================================
// ENHANCED STATUS BAR 2026 - Full Feature Status Bar
// ============================================================

import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  Minus,
  Plus,
  Grid,
  LayoutGrid,
  FileText,
  Calculator,
  ChevronUp,
  Wifi,
  WifiOff,
  Check,
  Sigma,
} from 'lucide-react';
import { useSelectionStore } from '../../stores/selectionStore';
import { useWorkbookStore } from '../../stores/workbookStore';
import { getCellKey } from '../../types/cell';
import { getCollaborationManager } from '../../collaboration/CollaborationManager';

type ViewMode = 'normal' | 'pageBreak' | 'pageLayout';
type CalcType = 'average' | 'count' | 'numerical_count' | 'min' | 'max' | 'sum';

interface CalcOption {
  id: CalcType;
  label: string;
  enabled: boolean;
}

const DEFAULT_CALCS: CalcOption[] = [
  { id: 'average', label: 'Average', enabled: true },
  { id: 'count', label: 'Count', enabled: true },
  { id: 'numerical_count', label: 'Numerical Count', enabled: false },
  { id: 'min', label: 'Min', enabled: true },
  { id: 'max', label: 'Max', enabled: true },
  { id: 'sum', label: 'Sum', enabled: true },
];

export const StatusBar2026Enhanced: React.FC = () => {
  const { selectedCell, selectionRange } = useSelectionStore();
  const { activeSheetId, sheets, zoom, setZoom } = useWorkbookStore();

  const [viewMode, setViewMode] = useState<ViewMode>('normal');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showCalcMenu, setShowCalcMenu] = useState(false);
  const [calcOptions, setCalcOptions] = useState<CalcOption[]>(DEFAULT_CALCS);
  const [copiedStat, setCopiedStat] = useState<string | null>(null);
  const [showZoomSlider, setShowZoomSlider] = useState(false);

  const calcMenuRef = useRef<HTMLDivElement>(null);
  const zoomSliderRef = useRef<HTMLDivElement>(null);

  // Online/Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (calcMenuRef.current && !calcMenuRef.current.contains(e.target as Node)) {
        setShowCalcMenu(false);
      }
      if (zoomSliderRef.current && !zoomSliderRef.current.contains(e.target as Node)) {
        setShowZoomSlider(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const stats = useMemo(() => {
    if (!activeSheetId || !sheets[activeSheetId]) return null;

    const sheet = sheets[activeSheetId];
    const values: number[] = [];
    let totalCount = 0;

    if (selectionRange) {
      const { start, end } = selectionRange;
      for (let row = start.row; row <= end.row; row++) {
        for (let col = start.col; col <= end.col; col++) {
          const cellKey = getCellKey(row, col);
          const cell = sheet.cells[cellKey];
          if (cell?.value !== null && cell?.value !== undefined && cell?.value !== '') {
            totalCount++;
            const num = parseFloat(String(cell.value));
            if (!isNaN(num)) values.push(num);
          }
        }
      }
    }

    if (values.length === 0 && totalCount === 0) return null;

    const sum = values.reduce((a, b) => a + b, 0);
    const avg = values.length > 0 ? sum / values.length : 0;
    const min = values.length > 0 ? Math.min(...values) : 0;
    const max = values.length > 0 ? Math.max(...values) : 0;

    return {
      average: avg,
      count: totalCount,
      numerical_count: values.length,
      min,
      max,
      sum,
    };
  }, [selectionRange, activeSheetId, sheets]);

  const cellInfo = useMemo(() => {
    if (!selectedCell) return null;

    const colLetter = String.fromCharCode(65 + selectedCell.col);
    const rowNum = selectedCell.row + 1;

    if (!selectionRange) {
      return `${colLetter}${rowNum}`;
    }

    const { start, end } = selectionRange;
    const rows = Math.abs(end.row - start.row) + 1;
    const cols = Math.abs(end.col - start.col) + 1;
    const totalCells = rows * cols;

    if (totalCells === 1) {
      return `${colLetter}${rowNum}`;
    }

    const startCol = String.fromCharCode(65 + start.col);
    const endCol = String.fromCharCode(65 + end.col);
    return `${startCol}${start.row + 1}:${endCol}${end.row + 1} (${rows}R × ${cols}C)`;
  }, [selectedCell, selectionRange]);

  const toggleCalcOption = (id: CalcType) => {
    setCalcOptions((prev) =>
      prev.map((opt) => (opt.id === id ? { ...opt, enabled: !opt.enabled } : opt))
    );
  };

  const copyStatValue = (label: string, value: number) => {
    navigator.clipboard.writeText(value.toString());
    setCopiedStat(label);
    setTimeout(() => setCopiedStat(null), 1500);
  };

  const formatStatValue = (value: number): string => {
    if (Math.abs(value) >= 1000000) {
      return (value / 1000000).toFixed(2) + 'M';
    }
    if (Math.abs(value) >= 1000) {
      return (value / 1000).toFixed(2) + 'K';
    }
    return value.toFixed(2);
  };

  const zoomPresets = [50, 75, 100, 125, 150, 200];

  return (
    <div className="status-bar-enhanced">
      {/* Left Section - Mode & Cell Info */}
      <div className="status-bar-enhanced__left">
        <div className="status-bar-enhanced__mode-indicator">
          <span
            className={`status-bar-enhanced__connection ${isOnline ? 'online' : 'offline'}`}
            title={isOnline ? 'Connected' : 'Offline'}
          >
            {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
          </span>
          <span className="status-bar-enhanced__mode-text">Ready</span>
        </div>

        {/* Collaboration indicator */}
        {(() => {
          const mgr = getCollaborationManager();
          if (!mgr || !mgr.isConnected()) return null;
          const count = mgr.getUserCount();
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 8px', fontSize: 11, color: '#059669' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
              <span>{count} online</span>
            </div>
          );
        })()}

        {cellInfo && (
          <div className="status-bar-enhanced__cell-info">
            <span className="status-bar-enhanced__cell-address">{cellInfo}</span>
          </div>
        )}

        {/* Quick Stats */}
        {stats && (
          <div className="status-bar-enhanced__stats">
            {calcOptions
              .filter((opt) => opt.enabled)
              .map((opt) => {
                const value = stats[opt.id];
                if (
                  (opt.id === 'count' || opt.id === 'numerical_count') &&
                  value === 0
                )
                  return null;
                if (opt.id !== 'count' && opt.id !== 'numerical_count' && stats.numerical_count === 0)
                  return null;

                return (
                  <button
                    key={opt.id}
                    className="status-bar-enhanced__stat"
                    onClick={() => copyStatValue(opt.label, value)}
                    title={`Click to copy. ${opt.label}: ${value}`}
                  >
                    <span className="status-bar-enhanced__stat-label">{opt.label}:</span>
                    <span className="status-bar-enhanced__stat-value">
                      {copiedStat === opt.label ? (
                        <Check size={12} className="copied-icon" />
                      ) : (
                        formatStatValue(value)
                      )}
                    </span>
                  </button>
                );
              })}

            {/* Customize Calculations */}
            <div className="status-bar-enhanced__calc-customize" ref={calcMenuRef}>
              <button
                className="status-bar-enhanced__calc-btn"
                onClick={() => setShowCalcMenu(!showCalcMenu)}
                title="Customize status bar calculations"
              >
                <Calculator size={14} />
                <ChevronUp
                  size={10}
                  className={`chevron ${showCalcMenu ? 'open' : ''}`}
                />
              </button>

              {showCalcMenu && (
                <div className="status-bar-enhanced__calc-menu">
                  <div className="calc-menu-header">
                    <Sigma size={14} />
                    <span>Status Bar Calculations</span>
                  </div>
                  <div className="calc-menu-options">
                    {calcOptions.map((opt) => (
                      <label key={opt.id} className="calc-menu-option">
                        <input
                          type="checkbox"
                          checked={opt.enabled}
                          onChange={() => toggleCalcOption(opt.id)}
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Section - View Mode & Zoom */}
      <div className="status-bar-enhanced__right">
        {/* View Mode Buttons */}
        <div className="status-bar-enhanced__view-modes">
          <button
            className={`view-mode-btn ${viewMode === 'normal' ? 'active' : ''}`}
            onClick={() => setViewMode('normal')}
            title="Normal View"
          >
            <Grid size={14} />
          </button>
          <button
            className={`view-mode-btn ${viewMode === 'pageBreak' ? 'active' : ''}`}
            onClick={() => setViewMode('pageBreak')}
            title="Page Break Preview"
          >
            <LayoutGrid size={14} />
          </button>
          <button
            className={`view-mode-btn ${viewMode === 'pageLayout' ? 'active' : ''}`}
            onClick={() => setViewMode('pageLayout')}
            title="Page Layout View"
          >
            <FileText size={14} />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="status-bar-enhanced__zoom" ref={zoomSliderRef}>
          <button
            className="zoom-btn"
            onClick={() => setZoom(Math.max(25, zoom - 10))}
            title="Zoom Out"
          >
            <Minus size={14} />
          </button>

          <div className="zoom-slider-container">
            <button
              className="zoom-value-btn"
              onClick={() => setShowZoomSlider(!showZoomSlider)}
              title="Click to see zoom presets"
            >
              {zoom}%
            </button>

            {showZoomSlider && (
              <div className="zoom-presets-popup">
                <input
                  type="range"
                  min="25"
                  max="400"
                  step="5"
                  value={zoom}
                  onChange={(e) => setZoom(parseInt(e.target.value))}
                  className="zoom-slider"
                />
                <div className="zoom-preset-buttons">
                  {zoomPresets.map((preset) => (
                    <button
                      key={preset}
                      className={`zoom-preset ${zoom === preset ? 'active' : ''}`}
                      onClick={() => {
                        setZoom(preset);
                        setShowZoomSlider(false);
                      }}
                    >
                      {preset}%
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            className="zoom-btn"
            onClick={() => setZoom(Math.min(400, zoom + 10))}
            title="Zoom In"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatusBar2026Enhanced;
