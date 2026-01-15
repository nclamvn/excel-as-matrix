import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell as PieCell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type ChartType = 'bar' | 'line' | 'pie' | 'area' | 'column';

export interface ChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface ChartConfig {
  id: string;
  type: ChartType;
  title: string;
  data: ChartData[];
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
}

interface ChartRendererProps {
  config: ChartConfig;
  width?: number;
  height?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_COLORS = [
  '#059669', // Green (brand)
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#84cc16', // Lime
];

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const ChartRenderer: React.FC<ChartRendererProps> = ({
  config,
  width = 400,
  height = 300,
}) => {
  const {
    type,
    title,
    data,
    colors = DEFAULT_COLORS,
    showLegend = true,
    showGrid = true,
  } = config;

  const renderChart = () => {
    switch (type) {
      case 'bar':
      case 'column':
        return (
          <BarChart data={data} layout={type === 'bar' ? 'vertical' : 'horizontal'}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />}
            <XAxis
              dataKey={type === 'bar' ? 'value' : 'name'}
              type={type === 'bar' ? 'number' : 'category'}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              dataKey={type === 'bar' ? 'name' : 'value'}
              type={type === 'bar' ? 'category' : 'number'}
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                background: '#fff',
                border: '1px solid #e5e5e5',
                borderRadius: '6px',
                fontSize: '13px',
              }}
            />
            {showLegend && <Legend wrapperStyle={{ fontSize: '12px' }} />}
            <Bar dataKey="value" fill={colors[0]} radius={[4, 4, 0, 0]} />
          </BarChart>
        );

      case 'line':
        return (
          <LineChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />}
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                background: '#fff',
                border: '1px solid #e5e5e5',
                borderRadius: '6px',
                fontSize: '13px',
              }}
            />
            {showLegend && <Legend wrapperStyle={{ fontSize: '12px' }} />}
            <Line
              type="monotone"
              dataKey="value"
              stroke={colors[0]}
              strokeWidth={2}
              dot={{ fill: colors[0], strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />}
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                background: '#fff',
                border: '1px solid #e5e5e5',
                borderRadius: '6px',
                fontSize: '13px',
              }}
            />
            {showLegend && <Legend wrapperStyle={{ fontSize: '12px' }} />}
            <Area
              type="monotone"
              dataKey="value"
              stroke={colors[0]}
              fill={`${colors[0]}33`}
              strokeWidth={2}
            />
          </AreaChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={Math.min(width, height) / 3}
              label={({ name, percent }) =>
                `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
              }
              labelLine={{ stroke: '#737373' }}
            >
              {data.map((_, index) => (
                <PieCell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: '#fff',
                border: '1px solid #e5e5e5',
                borderRadius: '6px',
                fontSize: '13px',
              }}
            />
            {showLegend && <Legend wrapperStyle={{ fontSize: '12px' }} />}
          </PieChart>
        );

      default:
        return null;
    }
  };

  return (
    <div className="chart-container" style={{ width, height }}>
      {title && <h4 className="chart-title">{title}</h4>}
      <ResponsiveContainer width="100%" height={title ? '85%' : '100%'}>
        {renderChart() || <div>Unsupported chart type</div>}
      </ResponsiveContainer>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Create chart data from spreadsheet selection
// ═══════════════════════════════════════════════════════════════════════════

export const createChartDataFromRange = (
  getCellValue: (row: number, col: number) => unknown,
  startRow: number,
  endRow: number,
  labelCol: number,
  valueCol: number
): ChartData[] => {
  const data: ChartData[] = [];

  for (let row = startRow; row <= endRow; row++) {
    const name = String(getCellValue(row, labelCol) || `Row ${row + 1}`);
    const value = Number(getCellValue(row, valueCol)) || 0;

    data.push({ name, value });
  }

  return data;
};
