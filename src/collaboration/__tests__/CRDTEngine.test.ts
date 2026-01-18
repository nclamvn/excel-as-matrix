import { describe, it, expect, beforeEach } from 'vitest';
import { CRDTEngine, createCRDTEngine } from '../CRDTEngine';
import type { CRDTOperation } from '../types';

describe('CRDTEngine', () => {
  let engine: CRDTEngine;

  beforeEach(() => {
    engine = new CRDTEngine('user-1');
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Constructor Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('constructor', () => {
    it('should create engine with initial state', () => {
      const state = engine.getState();

      expect(state.version).toBe(0);
      expect(state.vectorClock['user-1']).toBe(0);
      expect(state.operations).toEqual([]);
    });

    it('should use provided user ID', () => {
      const customEngine = new CRDTEngine('custom-user');
      const state = customEngine.getState();

      expect(state.vectorClock['custom-user']).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // createOperation Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('createOperation', () => {
    it('should create operation with correct type', () => {
      const op = engine.createOperation('update', ['cells', 'A1'], 'Hello');

      expect(op.type).toBe('update');
    });

    it('should create operation with correct path', () => {
      const op = engine.createOperation('update', ['cells', 'A1'], 'Hello');

      expect(op.path).toEqual(['cells', 'A1']);
    });

    it('should create operation with value', () => {
      const op = engine.createOperation('update', ['cells', 'A1'], 'Hello');

      expect(op.value).toBe('Hello');
    });

    it('should increment vector clock', () => {
      engine.createOperation('update', ['cells', 'A1'], 'v1');
      engine.createOperation('update', ['cells', 'A2'], 'v2');

      const state = engine.getState();
      expect(state.vectorClock['user-1']).toBe(2);
    });

    it('should increment version', () => {
      engine.createOperation('update', ['cells', 'A1'], 'v1');
      engine.createOperation('update', ['cells', 'A2'], 'v2');

      const state = engine.getState();
      expect(state.version).toBe(2);
    });

    it('should add operation to state', () => {
      engine.createOperation('update', ['cells', 'A1'], 'Hello');

      const state = engine.getState();
      expect(state.operations.length).toBe(1);
    });

    it('should include user ID in operation', () => {
      const op = engine.createOperation('update', ['cells', 'A1'], 'Hello');

      expect(op.userId).toBe('user-1');
    });

    it('should include timestamp', () => {
      const before = Date.now();
      const op = engine.createOperation('update', ['cells', 'A1'], 'Hello');
      const after = Date.now();

      expect(op.timestamp).toBeGreaterThanOrEqual(before);
      expect(op.timestamp).toBeLessThanOrEqual(after);
    });

    it('should include vector clock snapshot', () => {
      engine.createOperation('update', ['cells', 'A1'], 'v1');
      const op = engine.createOperation('update', ['cells', 'A2'], 'v2');

      expect(op.vectorClock['user-1']).toBe(2);
    });

    it('should generate unique IDs', () => {
      const op1 = engine.createOperation('update', ['cells', 'A1'], 'v1');
      const op2 = engine.createOperation('update', ['cells', 'A2'], 'v2');

      expect(op1.id).not.toBe(op2.id);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // applyOperation Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('applyOperation', () => {
    it('should apply valid remote operation', () => {
      const remoteOp: CRDTOperation = {
        id: 'remote-1',
        type: 'update',
        path: ['cells', 'A1'],
        value: 'Remote Value',
        timestamp: Date.now(),
        userId: 'user-2',
        vectorClock: { 'user-2': 1 },
      };

      const result = engine.applyOperation(remoteOp);

      expect(result).toBe(true);
      expect(engine.getState().operations.length).toBe(1);
    });

    it('should reject duplicate operation', () => {
      const op = engine.createOperation('update', ['cells', 'A1'], 'Local');
      const result = engine.applyOperation(op);

      expect(result).toBe(false);
    });

    it('should update vector clock', () => {
      const remoteOp: CRDTOperation = {
        id: 'remote-1',
        type: 'update',
        path: ['cells', 'A1'],
        value: 'Remote',
        timestamp: Date.now(),
        userId: 'user-2',
        vectorClock: { 'user-2': 1 },
      };

      engine.applyOperation(remoteOp);

      const clock = engine.getVectorClock();
      expect(clock['user-2']).toBe(1);
    });

    it('should queue operation if causality not met', () => {
      // Create operation that requires previous operation
      const remoteOp: CRDTOperation = {
        id: 'remote-2',
        type: 'update',
        path: ['cells', 'A1'],
        value: 'Remote',
        timestamp: Date.now(),
        userId: 'user-2',
        vectorClock: { 'user-2': 5 }, // We're missing ops 1-4
      };

      const result = engine.applyOperation(remoteOp);

      expect(result).toBe(false);
      expect(engine.getPendingCount()).toBe(1);
    });

    it('should process pending operations when causality is met', () => {
      // Queue an operation
      const op2: CRDTOperation = {
        id: 'remote-2',
        type: 'update',
        path: ['cells', 'A2'],
        value: 'Second',
        timestamp: Date.now(),
        userId: 'user-2',
        vectorClock: { 'user-2': 2 },
      };
      engine.applyOperation(op2);
      expect(engine.getPendingCount()).toBe(1);

      // Apply the missing operation
      const op1: CRDTOperation = {
        id: 'remote-1',
        type: 'update',
        path: ['cells', 'A1'],
        value: 'First',
        timestamp: Date.now() - 100,
        userId: 'user-2',
        vectorClock: { 'user-2': 1 },
      };
      engine.applyOperation(op1);

      expect(engine.getPendingCount()).toBe(0);
      expect(engine.getState().operations.length).toBe(2);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Conflict Resolution Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('resolveConflict', () => {
    it('should resolve by timestamp (later wins)', () => {
      const op1: CRDTOperation = {
        id: '1',
        type: 'update',
        path: ['cells', 'A1'],
        value: 'First',
        timestamp: 1000,
        userId: 'user-1',
        vectorClock: { 'user-1': 1 },
      };

      const op2: CRDTOperation = {
        id: '2',
        type: 'update',
        path: ['cells', 'A1'],
        value: 'Second',
        timestamp: 2000,
        userId: 'user-2',
        vectorClock: { 'user-2': 1 },
      };

      const winner = engine.resolveConflict(op1, op2);
      expect(winner.value).toBe('Second');
    });

    it('should tie-break by user ID', () => {
      const op1: CRDTOperation = {
        id: '1',
        type: 'update',
        path: ['cells', 'A1'],
        value: 'User1',
        timestamp: 1000,
        userId: 'user-1',
        vectorClock: { 'user-1': 1 },
      };

      const op2: CRDTOperation = {
        id: '2',
        type: 'update',
        path: ['cells', 'A1'],
        value: 'User2',
        timestamp: 1000, // Same timestamp
        userId: 'user-2',
        vectorClock: { 'user-2': 1 },
      };

      const winner = engine.resolveConflict(op1, op2);
      expect(winner.userId).toBe('user-2'); // user-2 > user-1 alphabetically
    });

    it('should return first for non-conflicting operations', () => {
      const op1: CRDTOperation = {
        id: '1',
        type: 'update',
        path: ['cells', 'A1'],
        value: 'Cell A1',
        timestamp: 1000,
        userId: 'user-1',
        vectorClock: { 'user-1': 1 },
      };

      const op2: CRDTOperation = {
        id: '2',
        type: 'update',
        path: ['cells', 'B1'], // Different path
        value: 'Cell B1',
        timestamp: 2000,
        userId: 'user-2',
        vectorClock: { 'user-2': 1 },
      };

      const result = engine.resolveConflict(op1, op2);
      expect(result).toBe(op1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // hasConflict Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('hasConflict', () => {
    it('should detect conflict on same path', () => {
      const op1: CRDTOperation = {
        id: '1',
        type: 'update',
        path: ['cells', 'A1'],
        value: 'v1',
        timestamp: 1000,
        userId: 'user-1',
        vectorClock: { 'user-1': 1 },
      };

      const op2: CRDTOperation = {
        id: '2',
        type: 'update',
        path: ['cells', 'A1'],
        value: 'v2',
        timestamp: 1000,
        userId: 'user-2',
        vectorClock: { 'user-2': 1 },
      };

      expect(engine.hasConflict(op1, op2)).toBe(true);
    });

    it('should not detect conflict on different paths', () => {
      const op1: CRDTOperation = {
        id: '1',
        type: 'update',
        path: ['cells', 'A1'],
        value: 'v1',
        timestamp: 1000,
        userId: 'user-1',
        vectorClock: { 'user-1': 1 },
      };

      const op2: CRDTOperation = {
        id: '2',
        type: 'update',
        path: ['cells', 'B1'],
        value: 'v2',
        timestamp: 1000,
        userId: 'user-2',
        vectorClock: { 'user-2': 1 },
      };

      expect(engine.hasConflict(op1, op2)).toBe(false);
    });

    it('should not detect conflict if one happened before another', () => {
      const op1: CRDTOperation = {
        id: '1',
        type: 'update',
        path: ['cells', 'A1'],
        value: 'v1',
        timestamp: 1000,
        userId: 'user-1',
        vectorClock: { 'user-1': 1 },
      };

      const op2: CRDTOperation = {
        id: '2',
        type: 'update',
        path: ['cells', 'A1'],
        value: 'v2',
        timestamp: 2000,
        userId: 'user-2',
        vectorClock: { 'user-1': 1, 'user-2': 1 }, // Knows about op1
      };

      expect(engine.hasConflict(op1, op2)).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // getOperationsSince Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('getOperationsSince', () => {
    it('should return operations after clock', () => {
      engine.createOperation('update', ['cells', 'A1'], 'v1');
      engine.createOperation('update', ['cells', 'A2'], 'v2');
      engine.createOperation('update', ['cells', 'A3'], 'v3');

      const ops = engine.getOperationsSince({ 'user-1': 1 });

      expect(ops.length).toBe(2);
    });

    it('should return empty array if clock is current', () => {
      engine.createOperation('update', ['cells', 'A1'], 'v1');

      const ops = engine.getOperationsSince({ 'user-1': 1 });

      expect(ops.length).toBe(0);
    });

    it('should return all operations for empty clock', () => {
      engine.createOperation('update', ['cells', 'A1'], 'v1');
      engine.createOperation('update', ['cells', 'A2'], 'v2');

      const ops = engine.getOperationsSince({});

      expect(ops.length).toBe(2);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // State Management Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('getState', () => {
    it('should return copy of state', () => {
      engine.createOperation('update', ['cells', 'A1'], 'v1');

      const state1 = engine.getState();
      const state2 = engine.getState();

      expect(state1).not.toBe(state2);
    });
  });

  describe('getVectorClock', () => {
    it('should return copy of vector clock', () => {
      engine.createOperation('update', ['cells', 'A1'], 'v1');

      const clock1 = engine.getVectorClock();
      const clock2 = engine.getVectorClock();

      expect(clock1).not.toBe(clock2);
    });
  });

  describe('getPendingCount', () => {
    it('should return pending operation count', () => {
      expect(engine.getPendingCount()).toBe(0);

      // Add pending operation
      const remoteOp: CRDTOperation = {
        id: 'remote-5',
        type: 'update',
        path: ['cells', 'A1'],
        value: 'Remote',
        timestamp: Date.now(),
        userId: 'user-2',
        vectorClock: { 'user-2': 5 },
      };
      engine.applyOperation(remoteOp);

      expect(engine.getPendingCount()).toBe(1);
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      engine.createOperation('update', ['cells', 'A1'], 'v1');
      engine.createOperation('update', ['cells', 'A2'], 'v2');

      engine.reset();

      const state = engine.getState();
      expect(state.version).toBe(0);
      expect(state.operations).toEqual([]);
      expect(state.vectorClock['user-1']).toBe(0);
    });

    it('should clear pending operations', () => {
      const remoteOp: CRDTOperation = {
        id: 'remote-5',
        type: 'update',
        path: ['cells', 'A1'],
        value: 'Remote',
        timestamp: Date.now(),
        userId: 'user-2',
        vectorClock: { 'user-2': 5 },
      };
      engine.applyOperation(remoteOp);

      engine.reset();

      expect(engine.getPendingCount()).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Factory Function Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('createCRDTEngine', () => {
    it('should create new engine instance', () => {
      const engine1 = createCRDTEngine('user-a');
      const engine2 = createCRDTEngine('user-b');

      expect(engine1).not.toBe(engine2);
    });

    it('should create engine with provided user ID', () => {
      const customEngine = createCRDTEngine('my-user');
      const state = customEngine.getState();

      expect(state.vectorClock['my-user']).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Multi-User Scenario Tests
  // ═══════════════════════════════════════════════════════════════════════════

  describe('multi-user scenarios', () => {
    let engine1: CRDTEngine;
    let engine2: CRDTEngine;

    beforeEach(() => {
      engine1 = new CRDTEngine('user-1');
      engine2 = new CRDTEngine('user-2');
    });

    it('should sync operations between engines', () => {
      // User 1 creates operation
      const op1 = engine1.createOperation('update', ['cells', 'A1'], 'from user 1');

      // User 2 applies it
      engine2.applyOperation(op1);

      expect(engine2.getState().operations.length).toBe(1);
      expect(engine2.getVectorClock()['user-1']).toBe(1);
    });

    it('should handle concurrent edits to different cells', () => {
      // User 1 edits A1
      const op1 = engine1.createOperation('update', ['cells', 'A1'], 'user1 value');

      // User 2 edits B1 concurrently
      const op2 = engine2.createOperation('update', ['cells', 'B1'], 'user2 value');

      // Both apply each other's operations
      engine1.applyOperation(op2);
      engine2.applyOperation(op1);

      // Both should have 2 operations
      expect(engine1.getState().operations.length).toBe(2);
      expect(engine2.getState().operations.length).toBe(2);
    });

    it('should resolve conflicts for same cell edits', () => {
      // Both edit A1 concurrently
      const op1 = engine1.createOperation('update', ['cells', 'A1'], 'user1 value');
      const op2 = engine2.createOperation('update', ['cells', 'A1'], 'user2 value');

      // Detect conflict
      expect(engine1.hasConflict(op1, op2)).toBe(true);

      // Resolve - both should get same winner
      const winner1 = engine1.resolveConflict(op1, op2);
      const winner2 = engine2.resolveConflict(op1, op2);

      expect(winner1.id).toBe(winner2.id);
    });
  });
});
