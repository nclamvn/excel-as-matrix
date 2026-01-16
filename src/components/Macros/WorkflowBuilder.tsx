// =============================================================================
// WORKFLOW BUILDER — Visual workflow builder
// =============================================================================

import React, { useState, useEffect } from 'react';
import { macroEngine } from '../../macros/MacroEngine';
import type { Macro, WorkflowStep, ActionType } from '../../macros/types';
import { ActionPicker } from './ActionPicker';
import { ActionNode } from './ActionNode';
import { TriggerConfig } from './TriggerConfig';

interface WorkflowBuilderProps {
  macro?: Macro | null;
  onSave: () => void;
  onCancel: () => void;
}

export const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({
  macro,
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState(macro?.name || 'New Macro');
  const [steps, setSteps] = useState<WorkflowStep[]>(macro?.workflow.steps || []);
  const [trigger, setTrigger] = useState(macro?.trigger || {
    type: 'manual' as const,
    config: {},
    enabled: true,
  });
  const [showActionPicker, setShowActionPicker] = useState(false);
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null);

  useEffect(() => {
    if (macro) {
      setName(macro.name);
      setSteps(macro.workflow.steps);
      setTrigger(macro.trigger);
    }
  }, [macro]);

  const handleAddAction = (actionType: ActionType) => {
    const newStep: WorkflowStep = {
      id: crypto.randomUUID(),
      order: steps.length + 1,
      type: 'action',
      action: {
        id: crypto.randomUUID(),
        type: actionType,
        params: {},
      },
      enabled: true,
    };

    if (editingStepIndex !== null) {
      const newSteps = [...steps];
      newSteps.splice(editingStepIndex + 1, 0, newStep);
      setSteps(newSteps.map((s, i) => ({ ...s, order: i + 1 })));
    } else {
      setSteps([...steps, newStep]);
    }

    setShowActionPicker(false);
    setEditingStepIndex(null);
  };

  const handleRemoveStep = (stepId: string) => {
    setSteps(steps.filter(s => s.id !== stepId).map((s, i) => ({ ...s, order: i + 1 })));
  };

  const handleMoveStep = (stepId: string, direction: 'up' | 'down') => {
    const index = steps.findIndex(s => s.id === stepId);
    if (index < 0) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= steps.length) return;

    const newSteps = [...steps];
    [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]];
    setSteps(newSteps.map((s, i) => ({ ...s, order: i + 1 })));
  };

  const handleUpdateStep = (stepId: string, updates: Partial<WorkflowStep>) => {
    setSteps(steps.map(s => s.id === stepId ? { ...s, ...updates } : s));
  };

  const handleSave = () => {
    if (macro) {
      macroEngine.updateMacro(macro.id, {
        name,
        workflow: {
          ...macro.workflow,
          steps,
        },
        trigger,
      });
    } else {
      macroEngine.createMacro(
        name,
        {
          id: crypto.randomUUID(),
          name: 'Workflow',
          steps,
          variables: [],
          onError: 'stop',
        },
        trigger
      );
    }
    onSave();
  };

  return (
    <div className="workflow-builder">
      {/* Header */}
      <div className="builder-header">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="macro-name-input"
          placeholder="Macro name..."
        />
      </div>

      {/* Trigger Configuration */}
      <TriggerConfig
        trigger={trigger}
        onChange={setTrigger}
      />

      {/* Steps */}
      <div className="steps-container">
        <div className="steps-header">
          <span className="steps-title">Steps ({steps.length})</span>
          <button
            className="add-step-btn"
            onClick={() => {
              setEditingStepIndex(null);
              setShowActionPicker(true);
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Add Step
          </button>
        </div>

        <div className="steps-list">
          {steps.length === 0 ? (
            <div className="empty-steps">
              <p>No steps yet. Add actions to build your workflow.</p>
              <button
                className="add-first-step"
                onClick={() => setShowActionPicker(true)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                Add First Step
              </button>
            </div>
          ) : (
            steps.map((step, index) => (
              <ActionNode
                key={step.id}
                step={step}
                index={index}
                isFirst={index === 0}
                isLast={index === steps.length - 1}
                onRemove={() => handleRemoveStep(step.id)}
                onMoveUp={() => handleMoveStep(step.id, 'up')}
                onMoveDown={() => handleMoveStep(step.id, 'down')}
                onUpdate={(updates) => handleUpdateStep(step.id, updates)}
                onAddAfter={() => {
                  setEditingStepIndex(index);
                  setShowActionPicker(true);
                }}
              />
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="builder-footer">
        <button className="cancel-btn" onClick={onCancel}>
          Cancel
        </button>
        <button
          className="save-btn"
          onClick={handleSave}
          disabled={steps.length === 0}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          {macro ? 'Update' : 'Create'} Macro
        </button>
      </div>

      {/* Action Picker Modal */}
      {showActionPicker && (
        <ActionPicker
          onSelect={handleAddAction}
          onClose={() => {
            setShowActionPicker(false);
            setEditingStepIndex(null);
          }}
        />
      )}
    </div>
  );
};

export default WorkflowBuilder;
