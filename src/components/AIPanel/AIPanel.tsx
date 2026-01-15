import React, { useRef, useEffect } from 'react';
import { useAIStore } from '../../stores/aiStore';
import { useSandboxStore, getChangeTypeColor, getChangeTypeLabel } from '../../stores/sandboxStore';
import { useWorkbookStore } from '../../stores/workbookStore';
import { useSelectionStore } from '../../stores/selectionStore';

// ===== Chat Tab Component =====

const ChatTab: React.FC = () => {
  const {
    messages,
    isProcessing,
    currentInput,
    setCurrentInput,
    sendMessage,
  } = useAIStore();

  const { selectedCell, selectionRange } = useSelectionStore();
  const { activeSheetId } = useWorkbookStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentInput.trim() || isProcessing) return;

    // Build selected range from selection state
    let selectedRange;
    if (activeSheetId && selectionRange) {
      selectedRange = {
        sheetId: activeSheetId,
        startRow: selectionRange.start.row,
        startCol: selectionRange.start.col,
        endRow: selectionRange.end.row,
        endCol: selectionRange.end.col,
      };
    } else if (activeSheetId && selectedCell) {
      selectedRange = {
        sheetId: activeSheetId,
        startRow: selectedCell.row,
        startCol: selectedCell.col,
        endRow: selectedCell.row,
        endCol: selectedCell.col,
      };
    }

    sendMessage(currentInput, selectedRange);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-gray-500 text-sm text-center py-8">
            Ask me to help with your spreadsheet...
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-3 rounded-lg ${
              msg.role === 'user'
                ? 'bg-blue-100 ml-8'
                : 'bg-gray-100 mr-8'
            }`}
          >
            <div className="text-sm">{msg.content}</div>
            {msg.role === 'assistant' && msg.proposedAction && (
              <div className="mt-2 p-2 bg-white rounded border border-blue-200">
                <div className="text-xs font-medium text-blue-700">
                  Proposed Action
                </div>
                <div className="text-sm">{msg.proposedAction.description}</div>
                <div className="flex gap-2 mt-1 text-xs text-gray-500">
                  <span>Confidence: {(msg.proposedAction.confidence * 100).toFixed(0)}%</span>
                  <span>Cells: {msg.proposedAction.affectedCells}</span>
                </div>
              </div>
            )}
            {msg.role === 'assistant' && msg.tokensUsed && (
              <div className="mt-1 text-xs text-gray-400">
                Tokens: {msg.tokensUsed} | Confidence: {((msg.confidence || 0) * 100).toFixed(0)}%
              </div>
            )}
          </div>
        ))}
        {isProcessing && (
          <div className="bg-gray-100 p-3 rounded-lg mr-8">
            <div className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
              <span className="text-sm text-gray-500">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            placeholder="Ask about your data..."
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={!currentInput.trim() || isProcessing}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

// ===== Actions Tab Component =====

const ActionsTab: React.FC = () => {
  const {
    pendingActions,
    selectedAction,
    selectAction,
    approveAction,
    rejectAction,
  } = useAIStore();

  const { loadSandbox } = useSandboxStore();

  const handleApprove = async () => {
    if (!selectedAction) return;
    await approveAction(selectedAction.id);
  };

  const handleReject = async () => {
    if (!selectedAction) return;
    const reason = prompt('Reason for rejection:');
    if (reason) {
      await rejectAction(selectedAction.id, reason);
    }
  };

  const handlePreview = async () => {
    if (!selectedAction) return;
    // Create sandbox and load it
    const response = await fetch(`/api/ai/actions/${selectedAction.id}/sandbox`, {
      method: 'POST',
    });
    if (response.ok) {
      const sandbox = await response.json();
      await loadSandbox(sandbox.id);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Action List */}
      <div className="flex-1 overflow-y-auto">
        {pendingActions.length === 0 ? (
          <div className="text-gray-500 text-sm text-center py-8">
            No pending actions
          </div>
        ) : (
          <div className="divide-y">
            {pendingActions.map((action) => (
              <div
                key={action.id}
                onClick={() => selectAction(action)}
                className={`p-3 cursor-pointer hover:bg-gray-50 ${
                  selectedAction?.id === action.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="font-medium text-sm">{action.description}</div>
                <div className="flex gap-2 mt-1 text-xs text-gray-500">
                  <span className={`px-1.5 py-0.5 rounded ${
                    action.confidence > 0.8 ? 'bg-green-100 text-green-700' :
                    action.confidence > 0.5 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {(action.confidence * 100).toFixed(0)}% confident
                  </span>
                  <span>{action.affectedCells} cells</span>
                  {action.createsFormulas && <span>+ formulas</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Details */}
      {selectedAction && (
        <div className="border-t p-3 bg-gray-50">
          <div className="text-sm font-medium mb-2">Action Details</div>
          <div className="text-xs space-y-1">
            <div><strong>Reasoning:</strong> {selectedAction.reasoning}</div>
            <div><strong>Evidence:</strong> {selectedAction.evidenceCount} items</div>
            <div><strong>Tests:</strong> {selectedAction.testsCount} ({selectedAction.testsPassed ? 'passed' : 'pending'})</div>
            <div><strong>Trust Score:</strong> {(selectedAction.trustScore * 100).toFixed(0)}%</div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handlePreview}
              className="flex-1 px-3 py-1.5 text-sm bg-gray-200 rounded hover:bg-gray-300"
            >
              Preview
            </button>
            <button
              onClick={handleReject}
              className="flex-1 px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              Reject
            </button>
            <button
              onClick={handleApprove}
              className="flex-1 px-3 py-1.5 text-sm bg-green-500 text-white rounded hover:bg-green-600"
            >
              Approve
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ===== Sandbox Preview Component =====

const SandboxPreview: React.FC = () => {
  const {
    currentSandbox,
    currentDiffs,
    isPreviewMode,
    togglePreview,
    mergeSandbox,
    abandonSandbox,
    clearSandbox,
  } = useSandboxStore();

  if (!currentSandbox) return null;

  return (
    <div className="absolute inset-0 bg-white z-10 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between">
        <div>
          <div className="font-medium text-sm">Preview Changes</div>
          <div className="text-xs text-gray-500">{currentDiffs.length} changes</div>
        </div>
        <button onClick={clearSandbox} className="text-gray-500 hover:text-gray-700">
          &times;
        </button>
      </div>

      {/* Diff List */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-2">
          {currentDiffs.map((diff, idx) => (
            <div
              key={idx}
              className={`p-2 rounded border ${getChangeTypeColor(diff.changeType)}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm">{diff.cellRef}</span>
                <span className="text-xs px-1.5 py-0.5 bg-white rounded">
                  {getChangeTypeLabel(diff.changeType)}
                </span>
              </div>
              <div className="mt-1 text-xs">
                {diff.oldValue !== null && (
                  <div className="text-red-600">- {diff.oldFormula || diff.oldValue}</div>
                )}
                {diff.newValue !== null && (
                  <div className="text-green-600">+ {diff.newFormula || diff.newValue}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="p-3 border-t flex gap-2">
        <button
          onClick={togglePreview}
          className={`flex-1 px-3 py-2 text-sm rounded ${
            isPreviewMode
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200'
          }`}
        >
          {isPreviewMode ? 'Hide Preview' : 'Show in Grid'}
        </button>
        <button
          onClick={() => abandonSandbox(currentSandbox.id)}
          className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          Discard
        </button>
        <button
          onClick={() => mergeSandbox(currentSandbox.id)}
          className="px-3 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600"
        >
          Apply
        </button>
      </div>
    </div>
  );
};

// ===== History Tab Component =====

const HistoryTab: React.FC = () => {
  const { actionHistory } = useAIStore();

  return (
    <div className="h-full overflow-y-auto">
      {actionHistory.length === 0 ? (
        <div className="text-gray-500 text-sm text-center py-8">
          No action history
        </div>
      ) : (
        <div className="divide-y">
          {actionHistory.map((action) => (
            <div key={action.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm">{action.description}</div>
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  action.state === 'Completed' ? 'bg-green-100 text-green-700' :
                  action.state === 'Rejected' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {action.state}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(action.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ===== Main AI Panel Component =====

export const AIPanel: React.FC = () => {
  const {
    session,
    isConnecting,
    sessionError,
    isPanelOpen,
    activeTab,
    setActiveTab,
    createSession,
    endSession,
    togglePanel,
  } = useAIStore();

  const { currentSandbox } = useSandboxStore();
  const { workbookId, activeSheetId } = useWorkbookStore();

  // Connect to AI session when panel opens
  useEffect(() => {
    if (isPanelOpen && !session && !isConnecting && workbookId && activeSheetId) {
      createSession(workbookId, activeSheetId);
    }
  }, [isPanelOpen, session, isConnecting, workbookId, activeSheetId, createSession]);

  if (!isPanelOpen) {
    return (
      <button
        onClick={togglePanel}
        className="fixed bottom-4 right-4 w-12 h-12 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 flex items-center justify-center"
        title="Open AI Assistant"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed right-0 top-0 bottom-0 w-96 bg-white shadow-xl border-l flex flex-col z-50">
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between bg-gradient-to-r from-blue-500 to-purple-500 text-white">
        <div>
          <div className="font-semibold">AI Assistant</div>
          {session && (
            <div className="text-xs text-blue-100">
              Session active | {session.budgetLimit}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {session && (
            <button
              onClick={endSession}
              className="text-xs px-2 py-1 bg-white/20 rounded hover:bg-white/30"
            >
              End
            </button>
          )}
          <button onClick={togglePanel} className="hover:bg-white/20 p-1 rounded">
            &times;
          </button>
        </div>
      </div>

      {/* Connection Status */}
      {isConnecting && (
        <div className="p-4 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
          <div className="text-sm text-gray-500 mt-2">Connecting...</div>
        </div>
      )}

      {sessionError && (
        <div className="p-4 text-center">
          <div className="text-red-500 text-sm">{sessionError}</div>
          <button
            onClick={() => workbookId && activeSheetId && createSession(workbookId, activeSheetId)}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      )}

      {/* Tabs */}
      {session && !isConnecting && !sessionError && (
        <>
          <div className="flex border-b">
            {(['chat', 'actions', 'history'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-sm font-medium ${
                  activeTab === tab
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden relative">
            {activeTab === 'chat' && <ChatTab />}
            {activeTab === 'actions' && <ActionsTab />}
            {activeTab === 'history' && <HistoryTab />}
            {currentSandbox && <SandboxPreview />}
          </div>
        </>
      )}
    </div>
  );
};

export default AIPanel;
