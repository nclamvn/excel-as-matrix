// =============================================================================
// CRDT ENGINE — Conflict-free data types (Blueprint §6.2)
// =============================================================================

import type { CRDTOperation, CRDTState, VectorClock } from './types';

// -----------------------------------------------------------------------------
// CRDT Engine Class
// -----------------------------------------------------------------------------

/**
 * Conflict-free Replicated Data Types for concurrent editing
 * Uses Last-Writer-Wins with vector clocks for ordering
 */
export class CRDTEngine {
  private state: CRDTState;
  private userId: string;
  private pendingOperations: CRDTOperation[] = [];

  constructor(userId: string) {
    this.userId = userId;
    this.state = {
      version: 0,
      vectorClock: { [userId]: 0 },
      operations: [],
      lastSyncedAt: new Date(),
    };
  }

  /**
   * Create a new operation
   */
  createOperation(
    type: CRDTOperation['type'],
    path: string[],
    value?: unknown
  ): CRDTOperation {
    this.state.vectorClock[this.userId] =
      (this.state.vectorClock[this.userId] || 0) + 1;

    const op: CRDTOperation = {
      id: crypto.randomUUID(),
      type,
      path,
      value,
      timestamp: Date.now(),
      userId: this.userId,
      vectorClock: { ...this.state.vectorClock },
    };

    this.state.operations.push(op);
    this.state.version++;

    return op;
  }

  /**
   * Apply remote operation
   */
  applyOperation(op: CRDTOperation): boolean {
    // Check if we've already applied this
    if (this.state.operations.some((o) => o.id === op.id)) {
      return false;
    }

    // Check causality - can we apply this?
    if (!this.canApply(op)) {
      // Queue for later
      this.pendingOperations.push(op);
      return false;
    }

    // Apply and update vector clock
    this.state.operations.push(op);
    this.mergeVectorClock(op.vectorClock);
    this.state.version++;

    // Try to apply pending operations
    this.processPendingOperations();

    return true;
  }

  /**
   * Check if operation can be applied (causality check)
   */
  private canApply(op: CRDTOperation): boolean {
    for (const [userId, time] of Object.entries(op.vectorClock)) {
      if (userId === op.userId) {
        // For the author, their clock should be exactly 1 more than ours
        const ourTime = this.state.vectorClock[userId] || 0;
        if (time > ourTime + 1) {
          return false; // We're missing operations
        }
      } else {
        // For others, their clock should be <= ours
        const ourTime = this.state.vectorClock[userId] || 0;
        if (time > ourTime) {
          return false; // We're missing operations
        }
      }
    }
    return true;
  }

  /**
   * Process pending operations that might now be applicable
   */
  private processPendingOperations(): void {
    let applied = true;
    while (applied && this.pendingOperations.length > 0) {
      applied = false;
      for (let i = this.pendingOperations.length - 1; i >= 0; i--) {
        const op = this.pendingOperations[i];
        if (this.canApply(op)) {
          this.pendingOperations.splice(i, 1);
          this.state.operations.push(op);
          this.mergeVectorClock(op.vectorClock);
          this.state.version++;
          applied = true;
        }
      }
    }
  }

  /**
   * Merge vector clocks
   */
  private mergeVectorClock(remote: VectorClock): void {
    for (const [userId, time] of Object.entries(remote)) {
      this.state.vectorClock[userId] = Math.max(
        this.state.vectorClock[userId] || 0,
        time
      );
    }
  }

  /**
   * Resolve conflicts between concurrent operations
   * Last-Writer-Wins based on timestamp + user ID for tie-breaking
   */
  resolveConflict(op1: CRDTOperation, op2: CRDTOperation): CRDTOperation {
    // Same path = conflict
    if (this.pathsEqual(op1.path, op2.path)) {
      // Last writer wins
      if (op1.timestamp !== op2.timestamp) {
        return op1.timestamp > op2.timestamp ? op1 : op2;
      }
      // Tie-break by user ID (deterministic)
      return op1.userId > op2.userId ? op1 : op2;
    }

    // No conflict - return first (both should apply)
    return op1;
  }

  /**
   * Check if operations conflict
   */
  hasConflict(op1: CRDTOperation, op2: CRDTOperation): boolean {
    // Operations on same path are conflicts
    if (this.pathsEqual(op1.path, op2.path)) {
      // Check if concurrent (neither happened-before the other)
      return this.areConcurrent(op1, op2);
    }
    return false;
  }

  /**
   * Check if two operations are concurrent
   */
  private areConcurrent(op1: CRDTOperation, op2: CRDTOperation): boolean {
    const op1BeforeOp2 = this.happenedBefore(op1.vectorClock, op2.vectorClock);
    const op2BeforeOp1 = this.happenedBefore(op2.vectorClock, op1.vectorClock);
    return !op1BeforeOp2 && !op2BeforeOp1;
  }

  /**
   * Check if clock1 happened before clock2
   */
  private happenedBefore(clock1: VectorClock, clock2: VectorClock): boolean {
    let atLeastOneLess = false;

    const allUserIds = new Set([...Object.keys(clock1), ...Object.keys(clock2)]);

    for (const userId of allUserIds) {
      const time1 = clock1[userId] || 0;
      const time2 = clock2[userId] || 0;

      if (time1 > time2) {
        return false;
      }
      if (time1 < time2) {
        atLeastOneLess = true;
      }
    }

    return atLeastOneLess;
  }

  /**
   * Check if two paths are equal
   */
  private pathsEqual(path1: string[], path2: string[]): boolean {
    if (path1.length !== path2.length) return false;
    return path1.every((p, i) => p === path2[i]);
  }

  /**
   * Get operations since a vector clock
   */
  getOperationsSince(clock: VectorClock): CRDTOperation[] {
    return this.state.operations.filter((op) => {
      const theirTime = clock[op.userId] || 0;
      const opTime = op.vectorClock[op.userId] || 0;
      return opTime > theirTime;
    });
  }

  /**
   * Get current state
   */
  getState(): CRDTState {
    return { ...this.state };
  }

  /**
   * Get current vector clock
   */
  getVectorClock(): VectorClock {
    return { ...this.state.vectorClock };
  }

  /**
   * Get pending operations count
   */
  getPendingCount(): number {
    return this.pendingOperations.length;
  }

  /**
   * Reset state (for testing)
   */
  reset(): void {
    this.state = {
      version: 0,
      vectorClock: { [this.userId]: 0 },
      operations: [],
      lastSyncedAt: new Date(),
    };
    this.pendingOperations = [];
  }
}

// Export singleton factory
export function createCRDTEngine(userId: string): CRDTEngine {
  return new CRDTEngine(userId);
}
