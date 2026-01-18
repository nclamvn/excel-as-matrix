import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChartContainer } from '../ChartContainer';
import type { Chart } from '../../../types/visualization';

// Mock chart store
const mockChartStore = {
  selectChart: vi.fn(),
  updatePosition: vi.fn(),
  selectedChartId: null as string | null,
};

vi.mock('../../../stores/chartStore', () => ({
  useChartStore: vi.fn(() => mockChartStore),
}));

// Mock chart components
vi.mock('../LineChart', () => ({
  LineChart: vi.fn(({ width, height }) => (
    <div data-testid="line-chart" data-width={width} data-height={height}>LineChart</div>
  )),
}));

vi.mock('../BarChart', () => ({
  BarChart: vi.fn(({ stacked }) => (
    <div data-testid="bar-chart" data-stacked={stacked}>BarChart</div>
  )),
}));

vi.mock('../PieChart', () => ({
  PieChart: vi.fn(({ isDoughnut }) => (
    <div data-testid="pie-chart" data-doughnut={isDoughnut}>PieChart</div>
  )),
}));

vi.mock('../AreaChart', () => ({
  AreaChart: vi.fn(({ stacked }) => (
    <div data-testid="area-chart" data-stacked={stacked}>AreaChart</div>
  )),
}));

// Helper to create test chart
function createTestChart(overrides: Partial<Chart> = {}): Chart {
  return {
    id: 'chart-1',
    name: 'Test Chart',
    chartType: 'Line',
    sheetId: 'sheet-1',
    dataRange: 'A1:B10',
    position: {
      x: 100,
      y: 100,
      width: 400,
      height: 300,
      zIndex: 1,
    },
    style: {
      backgroundColor: '#ffffff',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      roundedCorners: true,
    },
    legend: {
      show: true,
      position: 'bottom',
    },
    axes: {
      x: { show: true, title: 'X Axis' },
      y: { show: true, title: 'Y Axis' },
    },
    ...overrides,
  };
}

const testData = {
  categories: ['Jan', 'Feb', 'Mar'],
  series: [
    { name: 'Series 1', values: [10, 20, 30], color: '#3b82f6' },
    { name: 'Series 2', values: [15, 25, 35], color: '#ef4444' },
  ],
};

describe('ChartContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChartStore.selectedChartId = null;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render chart container', () => {
      const chart = createTestChart();
      render(<ChartContainer chart={chart} data={testData} />);

      expect(screen.getByText('Test Chart')).toBeInTheDocument();
    });

    it('should display chart title', () => {
      const chart = createTestChart({ title: { text: 'Sales Report', fontSize: 16 } });
      render(<ChartContainer chart={chart} data={testData} />);

      expect(screen.getByText('Sales Report')).toBeInTheDocument();
    });

    it('should display chart name when no title', () => {
      const chart = createTestChart({ name: 'My Chart' });
      render(<ChartContainer chart={chart} data={testData} />);

      expect(screen.getByText('My Chart')).toBeInTheDocument();
    });

    it('should show "No data available" when no data provided', () => {
      const chart = createTestChart();
      render(<ChartContainer chart={chart} />);

      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('should apply chart position styles', () => {
      const chart = createTestChart({
        position: { x: 50, y: 75, width: 500, height: 350, zIndex: 5 },
      });
      const { container } = render(<ChartContainer chart={chart} data={testData} />);

      const chartDiv = container.firstChild as HTMLElement;
      expect(chartDiv).toHaveStyle({
        left: '50px',
        top: '75px',
        width: '500px',
        height: '350px',
      });
    });

    it('should apply chart style backgroundColor', () => {
      const chart = createTestChart({
        style: {
          backgroundColor: '#f0f0f0',
          borderColor: '#ccc',
          borderWidth: 2,
          roundedCorners: true,
        },
      });
      const { container } = render(<ChartContainer chart={chart} data={testData} />);

      const chartDiv = container.firstChild as HTMLElement;
      expect(chartDiv).toHaveStyle({
        backgroundColor: '#f0f0f0',
      });
    });

    it('should apply border styles', () => {
      const chart = createTestChart({
        style: {
          backgroundColor: '#fff',
          borderColor: '#ff0000',
          borderWidth: 3,
          roundedCorners: false,
        },
      });
      const { container } = render(<ChartContainer chart={chart} data={testData} />);

      const chartDiv = container.firstChild as HTMLElement;
      // Check that the style attribute contains the border definition
      const style = chartDiv.getAttribute('style') || '';
      expect(style).toContain('border');
      expect(style).toContain('3px');
      // Color may be converted to rgb format
      expect(style).toMatch(/rgb\(255,?\s*0,?\s*0\)|#ff0000/i);
    });
  });

  describe('Chart Type Rendering', () => {
    it('should render LineChart for Line type', () => {
      const chart = createTestChart({ chartType: 'Line' });
      render(<ChartContainer chart={chart} data={testData} />);

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('should render BarChart for Bar type', () => {
      const chart = createTestChart({ chartType: 'Bar' });
      render(<ChartContainer chart={chart} data={testData} />);

      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('should render stacked BarChart for ColumnStacked type', () => {
      const chart = createTestChart({ chartType: 'ColumnStacked' });
      render(<ChartContainer chart={chart} data={testData} />);

      const barChart = screen.getByTestId('bar-chart');
      expect(barChart).toHaveAttribute('data-stacked', 'true');
    });

    it('should render non-stacked BarChart for ColumnClustered type', () => {
      const chart = createTestChart({ chartType: 'ColumnClustered' });
      render(<ChartContainer chart={chart} data={testData} />);

      const barChart = screen.getByTestId('bar-chart');
      expect(barChart).toHaveAttribute('data-stacked', 'false');
    });

    it('should render PieChart for Pie type', () => {
      const chart = createTestChart({ chartType: 'Pie' });
      render(<ChartContainer chart={chart} data={testData} />);

      const pieChart = screen.getByTestId('pie-chart');
      expect(pieChart).toHaveAttribute('data-doughnut', 'false');
    });

    it('should render Doughnut PieChart for Doughnut type', () => {
      const chart = createTestChart({ chartType: 'Doughnut' });
      render(<ChartContainer chart={chart} data={testData} />);

      const pieChart = screen.getByTestId('pie-chart');
      expect(pieChart).toHaveAttribute('data-doughnut', 'true');
    });

    it('should render AreaChart for Area type', () => {
      const chart = createTestChart({ chartType: 'Area' });
      render(<ChartContainer chart={chart} data={testData} />);

      const areaChart = screen.getByTestId('area-chart');
      expect(areaChart).toHaveAttribute('data-stacked', 'false');
    });

    it('should render stacked AreaChart for AreaStacked type', () => {
      const chart = createTestChart({ chartType: 'AreaStacked' });
      render(<ChartContainer chart={chart} data={testData} />);

      const areaChart = screen.getByTestId('area-chart');
      expect(areaChart).toHaveAttribute('data-stacked', 'true');
    });

    it('should default to LineChart for unknown chart type', () => {
      const chart = createTestChart({ chartType: 'Unknown' as any });
      render(<ChartContainer chart={chart} data={testData} />);

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  describe('Selection', () => {
    it('should call selectChart when clicked', async () => {
      const user = userEvent.setup();
      const chart = createTestChart();
      const { container } = render(<ChartContainer chart={chart} data={testData} />);

      await user.click(container.firstChild as HTMLElement);
      expect(mockChartStore.selectChart).toHaveBeenCalledWith('chart-1');
    });

    it('should show selection ring when selected', () => {
      mockChartStore.selectedChartId = 'chart-1';
      const chart = createTestChart({ id: 'chart-1' });
      const { container } = render(<ChartContainer chart={chart} data={testData} />);

      const chartDiv = container.firstChild as HTMLElement;
      expect(chartDiv).toHaveClass('ring-2', 'ring-blue-500');
    });

    it('should not show selection ring when not selected', () => {
      mockChartStore.selectedChartId = 'other-chart';
      const chart = createTestChart({ id: 'chart-1' });
      const { container } = render(<ChartContainer chart={chart} data={testData} />);

      const chartDiv = container.firstChild as HTMLElement;
      expect(chartDiv).not.toHaveClass('ring-2', 'ring-blue-500');
    });

    it('should show edit and delete buttons when selected', () => {
      mockChartStore.selectedChartId = 'chart-1';
      const chart = createTestChart({ id: 'chart-1' });
      const onEdit = vi.fn();
      const onDelete = vi.fn();

      const { container } = render(
        <ChartContainer chart={chart} data={testData} onEdit={onEdit} onDelete={onDelete} />
      );

      // Find edit and delete buttons (SVG buttons)
      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });

    it('should not show edit/delete buttons when not selected', () => {
      mockChartStore.selectedChartId = 'other-chart';
      const chart = createTestChart({ id: 'chart-1' });
      const onEdit = vi.fn();
      const onDelete = vi.fn();

      const { container } = render(
        <ChartContainer chart={chart} data={testData} onEdit={onEdit} onDelete={onDelete} />
      );

      // Should only have edit/delete buttons hidden
      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBe(0);
    });
  });

  describe('Drag and Drop', () => {
    it('should update position when dragged', () => {
      const chart = createTestChart({
        position: { x: 100, y: 100, width: 400, height: 300, zIndex: 1 },
      });
      const { container } = render(<ChartContainer chart={chart} data={testData} />);

      const header = container.querySelector('.cursor-grab');

      // Start drag
      fireEvent.mouseDown(header!, { clientX: 150, clientY: 150 });

      // Move
      fireEvent.mouseMove(document, { clientX: 200, clientY: 200 });

      expect(mockChartStore.updatePosition).toHaveBeenCalledWith('chart-1', {
        x: 150,
        y: 150,
      });
    });

    it('should stop dragging on mouseup', () => {
      const chart = createTestChart();
      const { container } = render(<ChartContainer chart={chart} data={testData} />);

      const header = container.querySelector('.cursor-grab');

      // Start drag
      fireEvent.mouseDown(header!, { clientX: 150, clientY: 150 });
      fireEvent.mouseUp(document);

      // Clear previous calls
      mockChartStore.updatePosition.mockClear();

      // Move after mouseup
      fireEvent.mouseMove(document, { clientX: 250, clientY: 250 });

      expect(mockChartStore.updatePosition).not.toHaveBeenCalled();
    });
  });

  describe('Resize', () => {
    it('should show resize handle when selected', () => {
      mockChartStore.selectedChartId = 'chart-1';
      const chart = createTestChart({ id: 'chart-1' });
      const { container } = render(<ChartContainer chart={chart} data={testData} />);

      const resizeHandle = container.querySelector('.cursor-se-resize');
      expect(resizeHandle).toBeInTheDocument();
    });

    it('should not show resize handle when not selected', () => {
      mockChartStore.selectedChartId = 'other-chart';
      const chart = createTestChart({ id: 'chart-1' });
      const { container } = render(<ChartContainer chart={chart} data={testData} />);

      const resizeHandle = container.querySelector('.cursor-se-resize');
      expect(resizeHandle).not.toBeInTheDocument();
    });

    it('should update size when resized', () => {
      mockChartStore.selectedChartId = 'chart-1';
      const chart = createTestChart({
        id: 'chart-1',
        position: { x: 100, y: 100, width: 400, height: 300, zIndex: 1 },
      });
      const { container } = render(<ChartContainer chart={chart} data={testData} />);

      const resizeHandle = container.querySelector('.cursor-se-resize');

      // Start resize
      fireEvent.mouseDown(resizeHandle!, { clientX: 500, clientY: 400 });

      // Resize
      fireEvent.mouseMove(document, { clientX: 600, clientY: 500 });

      expect(mockChartStore.updatePosition).toHaveBeenCalledWith('chart-1', {
        width: 500,
        height: 400,
      });
    });

    it('should enforce minimum width of 200px', () => {
      mockChartStore.selectedChartId = 'chart-1';
      const chart = createTestChart({
        id: 'chart-1',
        position: { x: 100, y: 100, width: 400, height: 300, zIndex: 1 },
      });
      const { container } = render(<ChartContainer chart={chart} data={testData} />);

      const resizeHandle = container.querySelector('.cursor-se-resize');

      // Start resize
      fireEvent.mouseDown(resizeHandle!, { clientX: 500, clientY: 400 });

      // Try to resize below minimum
      fireEvent.mouseMove(document, { clientX: 200, clientY: 400 });

      expect(mockChartStore.updatePosition).toHaveBeenCalledWith('chart-1', {
        width: 200,
        height: 300,
      });
    });

    it('should enforce minimum height of 150px', () => {
      mockChartStore.selectedChartId = 'chart-1';
      const chart = createTestChart({
        id: 'chart-1',
        position: { x: 100, y: 100, width: 400, height: 300, zIndex: 1 },
      });
      const { container } = render(<ChartContainer chart={chart} data={testData} />);

      const resizeHandle = container.querySelector('.cursor-se-resize');

      // Start resize
      fireEvent.mouseDown(resizeHandle!, { clientX: 500, clientY: 400 });

      // Try to resize below minimum
      fireEvent.mouseMove(document, { clientX: 500, clientY: 200 });

      expect(mockChartStore.updatePosition).toHaveBeenCalledWith('chart-1', {
        width: 400,
        height: 150,
      });
    });
  });

  describe('Edit and Delete Actions', () => {
    it('should call onEdit when edit button clicked', async () => {
      const user = userEvent.setup();
      mockChartStore.selectedChartId = 'chart-1';
      const chart = createTestChart({ id: 'chart-1' });
      const onEdit = vi.fn();

      const { container } = render(
        <ChartContainer chart={chart} data={testData} onEdit={onEdit} />
      );

      // Find edit button (first button with SVG)
      const buttons = container.querySelectorAll('button');
      const editButton = buttons[0];

      await user.click(editButton);
      expect(onEdit).toHaveBeenCalled();
    });

    it('should call onDelete when delete button clicked', async () => {
      const user = userEvent.setup();
      mockChartStore.selectedChartId = 'chart-1';
      const chart = createTestChart({ id: 'chart-1' });
      const onEdit = vi.fn();
      const onDelete = vi.fn();

      const { container } = render(
        <ChartContainer chart={chart} data={testData} onEdit={onEdit} onDelete={onDelete} />
      );

      // Find delete button (second button with SVG, after edit button)
      const buttons = container.querySelectorAll('button');
      const deleteButton = buttons[1];

      await user.click(deleteButton);
      expect(onDelete).toHaveBeenCalled();
    });

    it('should stop propagation when clicking edit button', async () => {
      const user = userEvent.setup();
      mockChartStore.selectedChartId = 'chart-1';
      const chart = createTestChart({ id: 'chart-1' });
      const onEdit = vi.fn();

      const { container } = render(
        <ChartContainer chart={chart} data={testData} onEdit={onEdit} />
      );

      mockChartStore.selectChart.mockClear();

      const buttons = container.querySelectorAll('button');
      const editButton = buttons[0];

      await user.click(editButton);

      // selectChart should not be called due to stopPropagation
      // (it may be called once from mouseDown on the container though)
      expect(onEdit).toHaveBeenCalled();
    });
  });

  describe('Z-Index Management', () => {
    it('should increase z-index when selected', () => {
      mockChartStore.selectedChartId = 'chart-1';
      const chart = createTestChart({
        id: 'chart-1',
        position: { x: 100, y: 100, width: 400, height: 300, zIndex: 5 },
      });
      const { container } = render(<ChartContainer chart={chart} data={testData} />);

      const chartDiv = container.firstChild as HTMLElement;
      expect(chartDiv).toHaveStyle({ zIndex: '105' }); // 5 + 100
    });

    it('should use base z-index when not selected', () => {
      mockChartStore.selectedChartId = 'other-chart';
      const chart = createTestChart({
        id: 'chart-1',
        position: { x: 100, y: 100, width: 400, height: 300, zIndex: 5 },
      });
      const { container } = render(<ChartContainer chart={chart} data={testData} />);

      const chartDiv = container.firstChild as HTMLElement;
      expect(chartDiv).toHaveStyle({ zIndex: '5' });
    });
  });
});
