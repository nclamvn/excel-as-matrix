// =============================================================================
// UNIT CONVERTER UI — Convert between units
// =============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { ArrowRight, RefreshCw, Copy, Check } from 'lucide-react';
import { unitConverter, type ConversionResult } from '../../types/units/UnitConverter';
import { getUnitsForDimension, getDimensions } from '../../types/units/UnitSystem';

// -----------------------------------------------------------------------------
// Unit Converter UI Props
// -----------------------------------------------------------------------------

interface UnitConverterUIProps {
  initialValue?: number;
  initialFromUnit?: string;
  initialToUnit?: string;
  dimension?: string;
  onConvert?: (result: ConversionResult) => void;
  className?: string;
}

// -----------------------------------------------------------------------------
// Unit Converter UI Component
// -----------------------------------------------------------------------------

export const UnitConverterUI: React.FC<UnitConverterUIProps> = ({
  initialValue = 0,
  initialFromUnit = '',
  initialToUnit = '',
  dimension: initialDimension,
  onConvert,
  className = '',
}) => {
  const [value, setValue] = useState(initialValue);
  const [fromUnit, setFromUnit] = useState(initialFromUnit);
  const [toUnit, setToUnit] = useState(initialToUnit);
  const [dimension, setDimension] = useState(initialDimension || '');
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [copied, setCopied] = useState(false);

  const dimensions = useMemo(() => getDimensions(), []);
  const units = useMemo(
    () => (dimension ? getUnitsForDimension(dimension) : []),
    [dimension]
  );

  // Update conversion when inputs change
  useEffect(() => {
    if (fromUnit && toUnit && !isNaN(value)) {
      const convResult = unitConverter.convert(value, fromUnit, toUnit);
      setResult(convResult);
      onConvert?.(convResult);
    } else {
      setResult(null);
    }
  }, [value, fromUnit, toUnit, onConvert]);

  // Handle dimension change
  const handleDimensionChange = (newDimension: string) => {
    setDimension(newDimension);
    setFromUnit('');
    setToUnit('');
    setResult(null);
  };

  // Swap units
  const handleSwap = () => {
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
  };

  // Copy result
  const handleCopy = () => {
    if (result?.success) {
      navigator.clipboard.writeText(result.value.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`unit-converter-ui ${className}`}>
      {/* Dimension selector */}
      {!initialDimension && (
        <div className="unit-converter-dimension">
          <label>Dimension</label>
          <select
            value={dimension}
            onChange={(e) => handleDimensionChange(e.target.value)}
            className="unit-converter-select"
          >
            <option value="">Select dimension...</option>
            {dimensions.map((dim) => (
              <option key={dim} value={dim}>
                {dim.charAt(0).toUpperCase() + dim.slice(1)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Conversion inputs */}
      <div className="unit-converter-inputs">
        {/* From */}
        <div className="unit-converter-from">
          <label>From</label>
          <div className="unit-converter-input-group">
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
              className="unit-converter-value-input"
              placeholder="Enter value"
            />
            <select
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              className="unit-converter-unit-select"
              disabled={!dimension}
            >
              <option value="">Unit</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.symbol} ({unit.name})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Swap button */}
        <button
          className="unit-converter-swap"
          onClick={handleSwap}
          disabled={!fromUnit || !toUnit}
          title="Swap units"
        >
          <RefreshCw size={16} />
        </button>

        {/* To */}
        <div className="unit-converter-to">
          <label>To</label>
          <div className="unit-converter-input-group">
            <input
              type="text"
              value={result?.success ? result.value.toFixed(6) : ''}
              readOnly
              className="unit-converter-result-input"
              placeholder="Result"
            />
            <select
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value)}
              className="unit-converter-unit-select"
              disabled={!dimension}
            >
              <option value="">Unit</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.symbol} ({unit.name})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className={`unit-converter-result ${result.success ? 'success' : 'error'}`}>
          {result.success ? (
            <>
              <span className="unit-converter-formula">{result.formula}</span>
              <button className="unit-converter-copy" onClick={handleCopy}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </>
          ) : (
            <span className="unit-converter-error">{result.error}</span>
          )}
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// Quick Convert Component (inline)
// -----------------------------------------------------------------------------

interface QuickConvertProps {
  value: number;
  fromUnit: string;
  toUnit: string;
  className?: string;
}

export const QuickConvert: React.FC<QuickConvertProps> = ({
  value,
  fromUnit,
  toUnit,
  className = '',
}) => {
  const result = useMemo(
    () => unitConverter.convert(value, fromUnit, toUnit),
    [value, fromUnit, toUnit]
  );

  if (!result.success) {
    return <span className={`quick-convert error ${className}`}>{result.error}</span>;
  }

  return (
    <span className={`quick-convert ${className}`}>
      <span className="quick-convert-from">
        {value} {fromUnit}
      </span>
      <ArrowRight size={12} />
      <span className="quick-convert-to">
        {result.value.toFixed(2)} {toUnit}
      </span>
    </span>
  );
};

// -----------------------------------------------------------------------------
// Conversion Table Component
// -----------------------------------------------------------------------------

interface ConversionTableProps {
  value: number;
  fromUnit: string;
  dimension: string;
  className?: string;
}

export const ConversionTable: React.FC<ConversionTableProps> = ({
  value,
  fromUnit,
  dimension,
  className = '',
}) => {
  const units = useMemo(() => getUnitsForDimension(dimension), [dimension]);

  const conversions = useMemo(() => {
    return units
      .filter((u) => u.id !== fromUnit)
      .map((u) => ({
        unit: u,
        result: unitConverter.convert(value, fromUnit, u.id),
      }))
      .filter((c) => c.result.success);
  }, [value, fromUnit, units]);

  return (
    <div className={`conversion-table ${className}`}>
      <div className="conversion-table-header">
        <span>
          {value} {fromUnit} equals:
        </span>
      </div>
      <div className="conversion-table-body">
        {conversions.map(({ unit, result }) => (
          <div key={unit.id} className="conversion-table-row">
            <span className="conversion-table-value">{result.value.toFixed(4)}</span>
            <span className="conversion-table-unit">{unit.symbol}</span>
            <span className="conversion-table-name">{unit.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
