import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AICopilotDock } from '../AICopilotDock';
import type { AICopilotTab } from '../../../ai/types';

// Mock store state
const createMockAIStore = (overrides = {}) => ({
  isOpen: true,
  activeTab: 'chat' as AICopilotTab,
  pendingActions: [],
  config: {
    mockMode: false,
    model: 'claude-3-sonnet',
  },
  closePanel: vi.fn(),
  setActiveTab: vi.fn(),
  ...overrides,
});

let mockStore = createMockAIStore();

vi.mock('../../../stores/aiStore', () => ({
  useAIStore: vi.fn((selector) => {
    if (selector) {
      return selector(mockStore);
    }
    return mockStore;
  }),
}));

// Mock panel components
vi.mock('../ChatPanel', () => ({
  ChatPanel: () => <div data-testid="chat-panel">Chat Panel Content</div>,
}));

vi.mock('../ActionsPanel', () => ({
  ActionsPanel: () => <div data-testid="actions-panel">Actions Panel Content</div>,
}));

vi.mock('../ContextPanel', () => ({
  ContextPanel: () => <div data-testid="context-panel">Context Panel Content</div>,
}));

vi.mock('../HistoryPanel', () => ({
  HistoryPanel: () => <div data-testid="history-panel">History Panel Content</div>,
}));

describe('AICopilotDock', () => {
  beforeEach(() => {
    mockStore = createMockAIStore();
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when closed', () => {
      mockStore = createMockAIStore({ isOpen: false });
      const { container } = render(<AICopilotDock />);
      expect(container.firstChild).toBeNull();
    });

    it('should render when open', () => {
      render(<AICopilotDock />);
      expect(screen.getByText('AI Copilot')).toBeInTheDocument();
    });

    it('should render header with title', () => {
      render(<AICopilotDock />);
      expect(screen.getByText('AI Copilot')).toBeInTheDocument();
    });

    it('should render close button', () => {
      render(<AICopilotDock />);
      expect(screen.getByTitle('Close')).toBeInTheDocument();
    });

    it('should show Demo badge when in mock mode', () => {
      mockStore = createMockAIStore({
        config: { mockMode: true, model: 'claude-3-sonnet' },
      });
      render(<AICopilotDock />);
      expect(screen.getByText('Demo')).toBeInTheDocument();
    });

    it('should not show Demo badge when not in mock mode', () => {
      mockStore = createMockAIStore({
        config: { mockMode: false, model: 'claude-3-sonnet' },
      });
      render(<AICopilotDock />);
      expect(screen.queryByText('Demo')).not.toBeInTheDocument();
    });
  });

  describe('Tabs', () => {
    it('should render all four tabs', () => {
      render(<AICopilotDock />);

      expect(screen.getByText('Chat')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
      expect(screen.getByText('Context')).toBeInTheDocument();
      expect(screen.getByText('History')).toBeInTheDocument();
    });

    it('should highlight active tab', () => {
      mockStore = createMockAIStore({ activeTab: 'chat' });
      render(<AICopilotDock />);

      const chatTab = screen.getByText('Chat').closest('button');
      expect(chatTab).toHaveClass('ai-copilot-tab--active');
    });

    it('should call setActiveTab when tab is clicked', async () => {
      const user = userEvent.setup();
      render(<AICopilotDock />);

      await user.click(screen.getByText('Actions'));
      expect(mockStore.setActiveTab).toHaveBeenCalledWith('actions');
    });

    it('should show pending actions count badge', () => {
      mockStore = createMockAIStore({
        pendingActions: [
          { id: '1', type: 'edit' },
          { id: '2', type: 'insert' },
          { id: '3', type: 'delete' },
        ],
      });
      render(<AICopilotDock />);

      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should not show badge when no pending actions', () => {
      mockStore = createMockAIStore({ pendingActions: [] });
      const { container } = render(<AICopilotDock />);

      const badge = container.querySelector('.ai-copilot-badge--count');
      expect(badge).not.toBeInTheDocument();
    });
  });

  describe('Tab Content', () => {
    it('should render ChatPanel when chat tab is active', () => {
      mockStore = createMockAIStore({ activeTab: 'chat' });
      render(<AICopilotDock />);

      expect(screen.getByTestId('chat-panel')).toBeInTheDocument();
    });

    it('should render ActionsPanel when actions tab is active', () => {
      mockStore = createMockAIStore({ activeTab: 'actions' });
      render(<AICopilotDock />);

      expect(screen.getByTestId('actions-panel')).toBeInTheDocument();
    });

    it('should render ContextPanel when context tab is active', () => {
      mockStore = createMockAIStore({ activeTab: 'context' });
      render(<AICopilotDock />);

      expect(screen.getByTestId('context-panel')).toBeInTheDocument();
    });

    it('should render HistoryPanel when history tab is active', () => {
      mockStore = createMockAIStore({ activeTab: 'history' });
      render(<AICopilotDock />);

      expect(screen.getByTestId('history-panel')).toBeInTheDocument();
    });

    it('should only render one panel at a time', () => {
      mockStore = createMockAIStore({ activeTab: 'chat' });
      render(<AICopilotDock />);

      expect(screen.getByTestId('chat-panel')).toBeInTheDocument();
      expect(screen.queryByTestId('actions-panel')).not.toBeInTheDocument();
      expect(screen.queryByTestId('context-panel')).not.toBeInTheDocument();
      expect(screen.queryByTestId('history-panel')).not.toBeInTheDocument();
    });
  });

  describe('Close Functionality', () => {
    it('should call closePanel when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<AICopilotDock />);

      await user.click(screen.getByTitle('Close'));
      expect(mockStore.closePanel).toHaveBeenCalled();
    });
  });

  describe('Tab Switching', () => {
    it('should switch to actions tab', async () => {
      const user = userEvent.setup();
      mockStore = createMockAIStore({ activeTab: 'chat' });
      render(<AICopilotDock />);

      await user.click(screen.getByText('Actions'));
      expect(mockStore.setActiveTab).toHaveBeenCalledWith('actions');
    });

    it('should switch to context tab', async () => {
      const user = userEvent.setup();
      mockStore = createMockAIStore({ activeTab: 'chat' });
      render(<AICopilotDock />);

      await user.click(screen.getByText('Context'));
      expect(mockStore.setActiveTab).toHaveBeenCalledWith('context');
    });

    it('should switch to history tab', async () => {
      const user = userEvent.setup();
      mockStore = createMockAIStore({ activeTab: 'chat' });
      render(<AICopilotDock />);

      await user.click(screen.getByText('History'));
      expect(mockStore.setActiveTab).toHaveBeenCalledWith('history');
    });

    it('should switch back to chat tab', async () => {
      const user = userEvent.setup();
      mockStore = createMockAIStore({ activeTab: 'actions' });
      render(<AICopilotDock />);

      await user.click(screen.getByText('Chat'));
      expect(mockStore.setActiveTab).toHaveBeenCalledWith('chat');
    });
  });

  describe('Styling', () => {
    it('should have ai-copilot-dock class', () => {
      const { container } = render(<AICopilotDock />);
      expect(container.querySelector('.ai-copilot-dock')).toBeInTheDocument();
    });

    it('should have ai-copilot-header class', () => {
      const { container } = render(<AICopilotDock />);
      expect(container.querySelector('.ai-copilot-header')).toBeInTheDocument();
    });

    it('should have ai-copilot-tabs class', () => {
      const { container } = render(<AICopilotDock />);
      expect(container.querySelector('.ai-copilot-tabs')).toBeInTheDocument();
    });

    it('should have ai-copilot-content class', () => {
      const { container } = render(<AICopilotDock />);
      expect(container.querySelector('.ai-copilot-content')).toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    it('should render sparkles icon in header', () => {
      const { container } = render(<AICopilotDock />);
      expect(container.querySelector('.ai-copilot-icon')).toBeInTheDocument();
    });

    it('should render icons for each tab', () => {
      const { container } = render(<AICopilotDock />);

      // Each tab should have an icon (lucide icons render as SVGs)
      const tabs = container.querySelectorAll('.ai-copilot-tab');
      tabs.forEach((tab) => {
        const svg = tab.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });
    });
  });

  describe('Pending Actions Badge', () => {
    it('should show badge only on Actions tab', () => {
      mockStore = createMockAIStore({
        pendingActions: [{ id: '1', type: 'edit' }],
      });
      const { container } = render(<AICopilotDock />);

      // Find the Actions tab
      const actionsTab = screen.getByText('Actions').closest('button');
      const badge = actionsTab?.querySelector('.ai-copilot-badge--count');

      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('1');
    });

    it('should update badge count when pending actions change', () => {
      mockStore = createMockAIStore({
        pendingActions: [
          { id: '1', type: 'edit' },
          { id: '2', type: 'insert' },
        ],
      });
      render(<AICopilotDock />);

      const actionsTab = screen.getByText('Actions').closest('button');
      const badge = actionsTab?.querySelector('.ai-copilot-badge--count');

      expect(badge).toHaveTextContent('2');
    });

    it('should handle large pending action counts', () => {
      const manyActions = Array.from({ length: 99 }, (_, i) => ({
        id: String(i),
        type: 'edit',
      }));
      mockStore = createMockAIStore({ pendingActions: manyActions });
      render(<AICopilotDock />);

      expect(screen.getByText('99')).toBeInTheDocument();
    });
  });
});

describe('AICopilotDock Integration', () => {
  beforeEach(() => {
    mockStore = createMockAIStore();
    vi.clearAllMocks();
  });

  it('should support rapid tab switching', async () => {
    const user = userEvent.setup();
    render(<AICopilotDock />);

    await user.click(screen.getByText('Actions'));
    await user.click(screen.getByText('Context'));
    await user.click(screen.getByText('History'));
    await user.click(screen.getByText('Chat'));

    expect(mockStore.setActiveTab).toHaveBeenCalledTimes(4);
    expect(mockStore.setActiveTab).toHaveBeenNthCalledWith(1, 'actions');
    expect(mockStore.setActiveTab).toHaveBeenNthCalledWith(2, 'context');
    expect(mockStore.setActiveTab).toHaveBeenNthCalledWith(3, 'history');
    expect(mockStore.setActiveTab).toHaveBeenNthCalledWith(4, 'chat');
  });

  it('should maintain dock structure when switching tabs', () => {
    mockStore = createMockAIStore({ activeTab: 'actions' });
    const { container, rerender } = render(<AICopilotDock />);

    expect(container.querySelector('.ai-copilot-dock')).toBeInTheDocument();
    expect(container.querySelector('.ai-copilot-header')).toBeInTheDocument();
    expect(container.querySelector('.ai-copilot-tabs')).toBeInTheDocument();
    expect(container.querySelector('.ai-copilot-content')).toBeInTheDocument();

    // Switch tab
    mockStore = createMockAIStore({ activeTab: 'history' });
    rerender(<AICopilotDock />);

    expect(container.querySelector('.ai-copilot-dock')).toBeInTheDocument();
    expect(container.querySelector('.ai-copilot-header')).toBeInTheDocument();
    expect(container.querySelector('.ai-copilot-tabs')).toBeInTheDocument();
    expect(container.querySelector('.ai-copilot-content')).toBeInTheDocument();
  });
});
