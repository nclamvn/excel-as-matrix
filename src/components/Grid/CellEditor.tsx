import React, { useEffect, useRef, useState } from 'react';
import { InputMessage } from '../../types/cell';

interface CellEditorProps {
  row: number;
  col: number;
  initialValue: string;
  cellWidth: number;
  cellHeight: number;
  headerWidth: number;
  headerHeight: number;
  colOffset?: number; // x-offset for variable column widths
  onSubmit: (value: string) => void;
  onCancel: () => void;
  validationError?: string | null;
  inputMessage?: InputMessage;
}

export const CellEditor: React.FC<CellEditorProps> = ({
  row,
  col,
  initialValue,
  cellWidth,
  cellHeight,
  headerWidth,
  headerHeight,
  colOffset,
  onSubmit,
  onCancel,
  validationError,
  inputMessage,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        onSubmit(value);
        break;
      case 'Escape':
        e.preventDefault();
        onCancel();
        break;
      case 'Tab':
        e.preventDefault();
        onSubmit(value);
        break;
    }
  };

  const handleBlur = () => {
    onSubmit(value);
  };

  const left = colOffset !== undefined ? headerWidth + colOffset : headerWidth + col * cellWidth;
  const top = headerHeight + row * cellHeight;

  return (
    <>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className={`absolute z-20 px-1 font-mono text-sm border-2 outline-none bg-white dark:bg-neutral-800 dark:text-white ${
          validationError
            ? 'border-red-500 dark:border-red-400'
            : 'border-blue-500 dark:border-blue-400'
        }`}
        style={{
          left,
          top,
          width: cellWidth,
          height: cellHeight,
          boxSizing: 'border-box',
        }}
      />
      {/* Validation error tooltip */}
      {validationError && (
        <div
          className="absolute z-30 px-2 py-1 text-xs text-white bg-red-600 rounded shadow-lg max-w-[250px]"
          style={{
            left,
            top: top + cellHeight + 2,
          }}
        >
          {validationError}
        </div>
      )}
      {/* Input message hint (shown when no error) */}
      {!validationError && inputMessage && (
        <div
          className="absolute z-30 px-2 py-1 text-xs bg-yellow-50 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-700 rounded shadow-lg max-w-[250px]"
          style={{
            left,
            top: top + cellHeight + 2,
          }}
        >
          {inputMessage.title && (
            <div className="font-semibold">{inputMessage.title}</div>
          )}
          {inputMessage.message && <div>{inputMessage.message}</div>}
        </div>
      )}
    </>
  );
};
