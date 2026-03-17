// ═══════════════════════════════════════════════════════════════════════════
// VBA IMPORT DIALOG — Paste VBA → Preview → Import as Macro
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback } from 'react';
import { X, Code2, AlertTriangle, CheckCircle, Play, FileCode } from 'lucide-react';
import { convertVBALocally, ConvertedMacro } from '../../ai/tools/vbaConverterTool';

interface VBAImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (macro: ConvertedMacro) => void;
}

export const VBAImportDialog: React.FC<VBAImportDialogProps> = ({ isOpen, onClose, onImport }) => {
  const [vbaCode, setVbaCode] = useState('');
  const [result, setResult] = useState<ConvertedMacro | null>(null);
  const [step, setStep] = useState<'input' | 'preview'>('input');

  const handleConvert = useCallback(() => {
    if (!vbaCode.trim()) return;
    const converted = convertVBALocally(vbaCode);
    setResult(converted);
    setStep('preview');
  }, [vbaCode]);

  const handleImport = useCallback(() => {
    if (result) {
      onImport(result);
      onClose();
      setVbaCode('');
      setResult(null);
      setStep('input');
    }
  }, [result, onImport, onClose]);

  const handleBack = useCallback(() => {
    setStep('input');
    setResult(null);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-[600px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <FileCode size={18} className="text-purple-600" />
            <h2 className="text-base font-semibold">Import VBA Macro</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded">
            <X size={16} />
          </button>
        </div>

        {step === 'input' ? (
          <>
            {/* Input step */}
            <div className="px-4 py-3 flex-1 overflow-y-auto">
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                Paste your VBA macro code below. ExcelAI will convert it to native macro actions.
              </p>
              <textarea
                value={vbaCode}
                onChange={(e) => setVbaCode(e.target.value)}
                placeholder={`Sub Example()\n    Range("A1").Value = "Hello"\n    Range("A1").Font.Bold = True\n    Range("B1").Formula = "=SUM(C1:C10)"\nEnd Sub`}
                className="w-full h-64 px-3 py-2 text-sm font-mono border border-neutral-300 dark:border-neutral-600 rounded-lg bg-neutral-50 dark:bg-neutral-900 resize-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                spellCheck={false}
              />
            </div>
            <div className="flex justify-end gap-2 px-4 py-3 border-t border-neutral-200 dark:border-neutral-700">
              <button onClick={onClose} className="px-3 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded hover:bg-neutral-50 dark:hover:bg-neutral-700">
                Cancel
              </button>
              <button
                onClick={handleConvert}
                disabled={!vbaCode.trim()}
                className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1.5"
              >
                <Code2 size={14} />
                Convert
              </button>
            </div>
          </>
        ) : result ? (
          <>
            {/* Preview step */}
            <div className="px-4 py-3 flex-1 overflow-y-auto space-y-3">
              {/* Macro name */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Macro:</span>
                <span className="text-sm font-mono text-purple-600 dark:text-purple-400">{result.name}</span>
              </div>

              {/* Actions */}
              <div>
                <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  Converted Actions ({result.actions.length})
                </h3>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {result.actions.map((action, i) => (
                    <div key={i} className="flex items-center gap-2 px-2 py-1 rounded bg-green-50 dark:bg-green-900/20 text-sm">
                      <CheckCircle size={14} className="text-green-600 shrink-0" />
                      <span className="font-mono text-xs text-green-800 dark:text-green-300">{action.type}</span>
                      <span className="text-neutral-500 dark:text-neutral-400 truncate">{action.description}</span>
                    </div>
                  ))}
                  {result.actions.length === 0 && (
                    <div className="text-sm text-neutral-400 italic">No actions could be converted locally</div>
                  )}
                </div>
              </div>

              {/* Warnings */}
              {result.warnings.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-2">
                    Warnings ({result.warnings.length})
                  </h3>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {result.warnings.map((w, i) => (
                      <div key={i} className="flex items-start gap-2 px-2 py-1 rounded bg-amber-50 dark:bg-amber-900/20 text-sm">
                        <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                        <span className="text-amber-800 dark:text-amber-300 text-xs">{w}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Unsupported */}
              {result.unsupportedFeatures.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-red-700 dark:text-red-300 mb-2">
                    Unsupported ({result.unsupportedFeatures.length})
                  </h3>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {result.unsupportedFeatures.map((u, i) => (
                      <div key={i} className="px-2 py-1 rounded bg-red-50 dark:bg-red-900/20 text-xs font-mono text-red-700 dark:text-red-300">
                        {u}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between gap-2 px-4 py-3 border-t border-neutral-200 dark:border-neutral-700">
              <button onClick={handleBack} className="px-3 py-1.5 text-sm border border-neutral-300 dark:border-neutral-600 rounded hover:bg-neutral-50 dark:hover:bg-neutral-700">
                Back
              </button>
              <button
                onClick={handleImport}
                disabled={result.actions.length === 0}
                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-1.5"
              >
                <Play size={14} />
                Import Macro ({result.actions.length} actions)
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};
