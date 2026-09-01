import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AIRuntime } from '../AIRuntime';
import { useWorkbookStore } from '../../stores/workbookStore';
import { getCellKey } from '../../types/cell';

const auditSpies = vi.hoisted(() => ({
  logToolDecision: vi.fn().mockResolvedValue(undefined),
  logToolExecution: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../audit/AIUsageLogger', () => ({
  aiUsageLogger: auditSpies,
}));

describe('AIRuntime trusted write transaction', () => {
  beforeEach(() => {
    auditSpies.logToolDecision.mockClear();
    auditSpies.logToolExecution.mockClear();
    const workbook = useWorkbookStore.getState();
    workbook.reset();
    workbook.setWorkbook('workbook-1', 'Transaction test');
    workbook.addSheet({
      id: 'sheet-1',
      name: 'Captured sheet',
      index: 0,
      cells: {
        [getCellKey(0, 0)]: { value: 'Before', formula: null, displayValue: 'Before' },
      },
    });
    workbook.addSheet({
      id: 'sheet-2',
      name: 'Later active sheet',
      index: 1,
      cells: {},
    });
    workbook.setActiveSheet('sheet-1');
  });

  afterEach(() => {
    useWorkbookStore.getState().reset();
  });

  it('previews, applies on the captured sheet, audits, and rolls back exactly once', async () => {
    const runtime = new AIRuntime();
    const action = await runtime.proposeWriteAction('A1', [['After']]);

    expect(action.sheetId).toBe('sheet-1');
    expect(action.workbookId).toBe('workbook-1');
    expect(action.preview.before.values).toEqual([['Before']]);
    expect(action.preview.after.values).toEqual([['After']]);
    expect(action.preview.changes).toEqual([
      { cell: 'A1', field: 'value', oldValue: 'Before', newValue: 'After' },
    ]);
    expect(useWorkbookStore.getState().sheets['sheet-1'].cells[getCellKey(0, 0)].value).toBe(
      'Before'
    );

    useWorkbookStore.getState().setActiveSheet('sheet-2');
    await expect(runtime.approveAction(action.id)).resolves.toBe(true);
    expect(useWorkbookStore.getState().sheets['sheet-1'].cells[getCellKey(0, 0)].value).toBe(
      'After'
    );
    expect(useWorkbookStore.getState().sheets['sheet-2'].cells[getCellKey(0, 0)]).toBeUndefined();

    const [history] = runtime.getHistory();
    expect(history.outcome).toBe('success');
    await expect(runtime.rollbackAction(history.id)).resolves.toBe(true);
    expect(useWorkbookStore.getState().sheets['sheet-1'].cells[getCellKey(0, 0)].value).toBe(
      'Before'
    );
    expect(runtime.getHistory()[0].outcome).toBe('reverted');
    await expect(runtime.rollbackAction(history.id)).resolves.toBe(false);

    expect(auditSpies.logToolDecision).toHaveBeenCalledWith(
      expect.objectContaining({ actionId: action.id, approved: true, workbookId: 'workbook-1' })
    );
    expect(auditSpies.logToolExecution).toHaveBeenCalledTimes(3);
  });

  it('rejects a shape mismatch before creating an action or mutating cells', async () => {
    const runtime = new AIRuntime();
    await expect(runtime.proposeWriteAction('A1:B2', [['Only one cell']])).rejects.toThrow(
      'must exactly match'
    );
    expect(runtime.getPendingActions()).toEqual([]);
    expect(useWorkbookStore.getState().sheets['sheet-1'].cells[getCellKey(0, 0)].value).toBe(
      'Before'
    );
    expect(auditSpies.logToolExecution).not.toHaveBeenCalled();
  });

  it('rejects oversized and non-finite payloads before audit or mutation', async () => {
    const runtime = new AIRuntime();
    await expect(runtime.proposeWriteAction('A1:A10001', [])).rejects.toThrow(
      'limited to 10000 cells'
    );
    await expect(runtime.proposeWriteAction('A1', [[Number.POSITIVE_INFINITY]])).rejects.toThrow(
      'must exactly match'
    );
    expect(runtime.getPendingActions()).toEqual([]);
    expect(auditSpies.logToolExecution).not.toHaveBeenCalled();
  });
});
