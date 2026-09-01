import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CellEditor } from '../CellEditor';

const defaultProps = {
  row: 0,
  col: 0,
  initialValue: 'Initial',
  cellWidth: 100,
  cellHeight: 24,
  headerWidth: 40,
  headerHeight: 24,
  onSubmit: vi.fn(),
  onCancel: vi.fn(),
};

describe('CellEditor keyboard event boundary', () => {
  it.each(['Enter', 'Tab'])('submits on %s without reopening the grid editor', (key) => {
    const onSubmit = vi.fn();
    const parentKeyDown = vi.fn();

    render(
      <div onKeyDown={parentKeyDown}>
        <CellEditor {...defaultProps} onSubmit={onSubmit} />
      </div>
    );

    const editor = screen.getByRole('textbox');
    fireEvent.change(editor, { target: { value: 'Durable' } });
    fireEvent.keyDown(editor, { key });

    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit).toHaveBeenCalledWith('Durable');
    expect(parentKeyDown).not.toHaveBeenCalled();
  });

  it('cancels on Escape without leaking the keystroke to the grid', () => {
    const onCancel = vi.fn();
    const parentKeyDown = vi.fn();

    render(
      <div onKeyDown={parentKeyDown}>
        <CellEditor {...defaultProps} onCancel={onCancel} />
      </div>
    );

    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' });

    expect(onCancel).toHaveBeenCalledOnce();
    expect(parentKeyDown).not.toHaveBeenCalled();
  });
});
