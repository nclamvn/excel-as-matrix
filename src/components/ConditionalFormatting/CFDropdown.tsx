// ============================================================
// CONDITIONAL FORMATTING DROPDOWN - Main Menu
// ============================================================

import React, { useState, useRef, useEffect } from 'react';
import { useConditionalFormattingStore } from '../../stores/conditionalFormattingStore';
import { useSelectionStore } from '../../stores/selectionStore';
import { DataBarsPreview } from './DataBarsPreview';
import { ColorScalesPreview } from './ColorScalesPreview';
import { IconSetsPreview } from './IconSetsPreview';
import { HighlightRules } from './HighlightRules';
import { TopBottomRules } from './TopBottomRules';
import { CFRuleDialog } from './CFRuleDialog';
import { ManageRulesDialog } from './ManageRulesDialog';
import {
  ChevronDown,
  Circle,
  BarChart3,
  BarChart2,
  Palette,
  Shapes,
  Plus,
  Trash2,
  Settings,
  ChevronRight
} from 'lucide-react';
import './ConditionalFormatting.css';

type SubMenu = 'highlight' | 'topBottom' | 'dataBars' | 'colorScales' | 'iconSets' | 'clear' | null;

export const CFDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [subMenu, setSubMenu] = useState<SubMenu>(null);
  const [showNewRuleDialog, setShowNewRuleDialog] = useState(false);
  const [showManageRules, setShowManageRules] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const { deleteRulesInRange, clearAllRules } = useConditionalFormattingStore();
  const { selectionRange } = useSelectionStore();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSubMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getSelectionRangeString = (): string | null => {
    if (!selectionRange) return null;
    const { start, end } = selectionRange;
    const startCol = String.fromCharCode(65 + start.col);
    const endCol = String.fromCharCode(65 + end.col);
    return `${startCol}${start.row + 1}:${endCol}${end.row + 1}`;
  };

  const handleClearRules = (type: 'selection' | 'sheet') => {
    if (type === 'selection') {
      const range = getSelectionRangeString();
      if (range) deleteRulesInRange(range);
    } else {
      clearAllRules();
    }
    setIsOpen(false);
    setSubMenu(null);
  };

  return (
    <div className="cf-dropdown" ref={dropdownRef}>
      <button
        className="cf-dropdown-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Conditional Formatting"
      >
        <div className="cf-icon">
          <div className="cf-icon-bars">
            <span style={{ background: '#FF6B6B', width: '100%' }} />
            <span style={{ background: '#FFD93D', width: '75%' }} />
            <span style={{ background: '#6BCB77', width: '50%' }} />
          </div>
        </div>
        <span className="btn-text">Conditional Formatting</span>
        <ChevronDown size={12} className="dropdown-caret" />
      </button>

      {isOpen && (
        <div className="cf-menu">
          {/* Highlight Cell Rules */}
          <div
            className="cf-menu-item has-submenu"
            onMouseEnter={() => setSubMenu('highlight')}
          >
            <span className="menu-icon"><Circle size={16} fill="#ef4444" color="#ef4444" /></span>
            <span className="menu-label">Highlight Cell Rules</span>
            <span className="submenu-arrow"><ChevronRight size={12} /></span>

            {subMenu === 'highlight' && (
              <div className="cf-submenu">
                <HighlightRules onSelect={() => { setIsOpen(false); setSubMenu(null); }} />
              </div>
            )}
          </div>

          {/* Top/Bottom Rules */}
          <div
            className="cf-menu-item has-submenu"
            onMouseEnter={() => setSubMenu('topBottom')}
          >
            <span className="menu-icon"><BarChart3 size={16} color="#3b82f6" /></span>
            <span className="menu-label">Top/Bottom Rules</span>
            <span className="submenu-arrow"><ChevronRight size={12} /></span>

            {subMenu === 'topBottom' && (
              <div className="cf-submenu">
                <TopBottomRules onSelect={() => { setIsOpen(false); setSubMenu(null); }} />
              </div>
            )}
          </div>

          <div className="cf-menu-divider" />

          {/* Data Bars */}
          <div
            className="cf-menu-item has-submenu"
            onMouseEnter={() => setSubMenu('dataBars')}
          >
            <span className="menu-icon"><BarChart2 size={16} color="#22c55e" /></span>
            <span className="menu-label">Data Bars</span>
            <span className="submenu-arrow"><ChevronRight size={12} /></span>

            {subMenu === 'dataBars' && (
              <div className="cf-submenu wide">
                <DataBarsPreview onSelect={() => { setIsOpen(false); setSubMenu(null); }} />
              </div>
            )}
          </div>

          {/* Color Scales */}
          <div
            className="cf-menu-item has-submenu"
            onMouseEnter={() => setSubMenu('colorScales')}
          >
            <span className="menu-icon"><Palette size={16} color="#f59e0b" /></span>
            <span className="menu-label">Color Scales</span>
            <span className="submenu-arrow"><ChevronRight size={12} /></span>

            {subMenu === 'colorScales' && (
              <div className="cf-submenu wide">
                <ColorScalesPreview onSelect={() => { setIsOpen(false); setSubMenu(null); }} />
              </div>
            )}
          </div>

          {/* Icon Sets */}
          <div
            className="cf-menu-item has-submenu"
            onMouseEnter={() => setSubMenu('iconSets')}
          >
            <span className="menu-icon"><Shapes size={16} color="#8b5cf6" /></span>
            <span className="menu-label">Icon Sets</span>
            <span className="submenu-arrow"><ChevronRight size={12} /></span>

            {subMenu === 'iconSets' && (
              <div className="cf-submenu wide">
                <IconSetsPreview onSelect={() => { setIsOpen(false); setSubMenu(null); }} />
              </div>
            )}
          </div>

          <div className="cf-menu-divider" />

          {/* New Rule */}
          <button
            className="cf-menu-item"
            onClick={() => { setShowNewRuleDialog(true); setIsOpen(false); }}
          >
            <span className="menu-icon"><Plus size={16} color="#22c55e" /></span>
            <span className="menu-label">New Rule...</span>
          </button>

          {/* Clear Rules */}
          <div
            className="cf-menu-item has-submenu"
            onMouseEnter={() => setSubMenu('clear')}
          >
            <span className="menu-icon"><Trash2 size={16} color="#6b7280" /></span>
            <span className="menu-label">Clear Rules</span>
            <span className="submenu-arrow"><ChevronRight size={12} /></span>

            {subMenu === 'clear' && (
              <div className="cf-submenu">
                <button
                  className="cf-submenu-item"
                  onClick={() => handleClearRules('selection')}
                >
                  Clear Rules from Selected Cells
                </button>
                <button
                  className="cf-submenu-item"
                  onClick={() => handleClearRules('sheet')}
                >
                  Clear Rules from Entire Sheet
                </button>
              </div>
            )}
          </div>

          {/* Manage Rules */}
          <button
            className="cf-menu-item"
            onClick={() => { setShowManageRules(true); setIsOpen(false); }}
          >
            <span className="menu-icon"><Settings size={16} color="#6b7280" /></span>
            <span className="menu-label">Manage Rules...</span>
          </button>
        </div>
      )}

      {/* Dialogs */}
      {showNewRuleDialog && (
        <CFRuleDialog
          onClose={() => setShowNewRuleDialog(false)}
          onSave={() => setShowNewRuleDialog(false)}
        />
      )}

      {showManageRules && (
        <ManageRulesDialog
          isOpen={showManageRules}
          onClose={() => setShowManageRules(false)}
          onAddRule={() => {
            setShowManageRules(false);
            setShowNewRuleDialog(true);
          }}
        />
      )}
    </div>
  );
};

export default CFDropdown;
