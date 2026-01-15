import React, { useEffect, useRef, useState } from 'react';

interface CellEditorProps {
  row: number;
  col: number;
  initialValue: string;
  cellWidth: number;
  cellHeight: number;
  headerWidth: number;
  headerHeight: number;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

export const CellEditor: React.FC<CellEditorProps> = ({
  row,
  col,
  initialValue,
  cellWidth,
  cellHeight,
  headerWidth,
  headerHeight,
  onSubmit,
  onCancel,
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

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      className="absolute z-20 px-1 font-mono text-sm border-2 border-blue-500 outline-none"
      style={{
        left: headerWidth + col * cellWidth,
        top: headerHeight + row * cellHeight,
        width: Math.max(cellWidth, 200),
        height: cellHeight,
        boxSizing: 'border-box',
      }}
    />
  );
};
