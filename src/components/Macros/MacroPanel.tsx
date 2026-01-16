// =============================================================================
// MACRO PANEL — Main panel for AI Macros
// =============================================================================

import React, { useState, useEffect } from 'react';
import { macroEngine } from '../../macros/MacroEngine';
import type { Macro, MacroExecution, RecordingSession } from '../../macros/types';
import { MacroLibrary } from './MacroLibrary';
import { WorkflowBuilder } from './WorkflowBuilder';
import { NLMacroInput } from './NLMacroInput';
import { RecordingIndicator } from './RecordingIndicator';
import { ExecutionLog } from './ExecutionLog';

interface MacroPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MacroPanel: React.FC<MacroPanelProps> = ({ isOpen, onClose }) => {
  const [macros, setMacros] = useState<Macro[]>([]);
  const [recording, setRecording] = useState<RecordingSession | null>(null);
  const [executions, setExecutions] = useState<MacroExecution[]>([]);
  const [activeTab, setActiveTab] = useState<'library' | 'create' | 'nl' | 'history'>('library');
  const [selectedMacro, setSelectedMacro] = useState<Macro | null>(null);

  useEffect(() => {
    setMacros(macroEngine.getAllMacros());
    setExecutions(macroEngine.getExecutions());

    const unsubExec = macroEngine.onExecution((exec) => {
      setExecutions(prev => {
        const idx = prev.findIndex(e => e.id === exec.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = exec;
          return updated;
        }
        return [...prev, exec];
      });
    });

    const unsubRec = macroEngine.onRecording((session) => {
      setRecording(session.status === 'stopped' ? null : session);
    });

    return () => { unsubExec(); unsubRec(); };
  }, []);

  const handleStartRecording = () => {
    macroEngine.startRecording();
  };

  const handleStopRecording = () => {
    const macro = macroEngine.stopRecording();
    if (macro) {
      setMacros(macroEngine.getAllMacros());
    }
  };

  const handleRunMacro = async (macroId: string) => {
    await macroEngine.runMacro(macroId);
  };

  const handleCreateFromNL = async (description: string) => {
    const macro = await macroEngine.createFromNL(description);
    if (macro) {
      setMacros(macroEngine.getAllMacros());
      setSelectedMacro(macro);
    }
  };

  const handleDeleteMacro = (macroId: string) => {
    macroEngine.deleteMacro(macroId);
    setMacros(macroEngine.getAllMacros());
  };

  if (!isOpen) return null;

  return (
    <div className="macro-panel">
      {/* Header */}
      <div className="macro-header">
        <div className="header-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
          <span>AI Macros</span>
        </div>
        <div className="header-actions">
          {recording ? (
            <button className="stop-btn" onClick={handleStopRecording}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="4" y="4" width="16" height="16" rx="2"/>
              </svg>
              Stop
            </button>
          ) : (
            <button className="record-btn" onClick={handleStartRecording}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10"/>
              </svg>
              Record
            </button>
          )}
          <button className="close-btn" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Recording indicator */}
      {recording && <RecordingIndicator session={recording} />}

      {/* Tabs */}
      <div className="macro-tabs">
        <button
          className={`tab ${activeTab === 'library' ? 'active' : ''}`}
          onClick={() => setActiveTab('library')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          Library
        </button>
        <button
          className={`tab ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Create
        </button>
        <button
          className={`tab ${activeTab === 'nl' ? 'active' : ''}`}
          onClick={() => setActiveTab('nl')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          AI Create
        </button>
        <button
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          History
        </button>
      </div>

      {/* Content */}
      <div className="macro-content">
        {activeTab === 'library' && (
          <MacroLibrary
            macros={macros}
            onRun={handleRunMacro}
            onEdit={setSelectedMacro}
            onDelete={handleDeleteMacro}
          />
        )}

        {activeTab === 'create' && (
          <WorkflowBuilder
            macro={selectedMacro}
            onSave={() => {
              setMacros(macroEngine.getAllMacros());
              setSelectedMacro(null);
              setActiveTab('library');
            }}
            onCancel={() => {
              setSelectedMacro(null);
              setActiveTab('library');
            }}
          />
        )}

        {activeTab === 'nl' && (
          <NLMacroInput onCreate={handleCreateFromNL} />
        )}

        {activeTab === 'history' && (
          <ExecutionLog executions={executions} />
        )}
      </div>
    </div>
  );
};

export default MacroPanel;
