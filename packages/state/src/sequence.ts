/**
 * Sparkplug B Sequence Number Manager
 * ISO/IEC 20237:2023 Section 6.4.4 - Message Sequencing
 *
 * Sequence numbers (seq):
 * - Reset to 0 at NBIRTH
 * - Incremented for every publish (NBIRTH, DBIRTH, NDATA, DDATA)
 * - Range: 0-255 (wraps around)
 * - Explicitly set via has_seq=true and payload.seq in protobuf
 * - Exposed in NDATA as Node/CurrentSeq metric
 */

export interface SequenceState {
  seq: bigint; // Current sequence number (0-255)
  bdSeq: bigint; // Birth/Death sequence (for correlation)
  lastPublishTime: number;
}

export class SequenceManager {
  private nodeSequences: Map<string, SequenceState> = new Map();
  private readonly MAX_SEQ = 256n; // Wrap at 256 (0-255)

  /**
   * Get the key for a node
   */
  private getNodeKey(groupId: string, edgeNodeId: string): string {
    return `${groupId}/${edgeNodeId}`;
  }

  /**
   * Reset sequence to 0 for NBIRTH
   * Called when a node sends its birth certificate
   *
   * @param groupId - Sparkplug Group ID
   * @param edgeNodeId - Edge Node ID
   * @param bdSeq - Birth/Death sequence number
   * @returns The initial sequence number (0)
   */
  resetAtBirth(groupId: string, edgeNodeId: string, bdSeq: bigint): bigint {
    const key = this.getNodeKey(groupId, edgeNodeId);

    this.nodeSequences.set(key, {
      seq: 0n,
      bdSeq,
      lastPublishTime: Date.now(),
    });

    console.log(`[SequenceManager] Reset seq=0 for ${key} (bdSeq=${bdSeq})`);
    return 0n;
  }

  /**
   * Get next sequence number for a publish
   * Increments and returns the new sequence number
   *
   * @param groupId - Sparkplug Group ID
   * @param edgeNodeId - Edge Node ID
   * @returns The next sequence number to use
   */
  getNextSeq(groupId: string, edgeNodeId: string): bigint {
    const key = this.getNodeKey(groupId, edgeNodeId);
    const state = this.nodeSequences.get(key);

    if (!state) {
      // If no state exists, this is an error condition
      // The node should have called resetAtBirth first
      console.warn(
        `[SequenceManager] No state for ${key}, initializing with seq=0`
      );
      this.nodeSequences.set(key, {
        seq: 0n,
        bdSeq: 0n,
        lastPublishTime: Date.now(),
      });
      return 0n;
    }

    // Increment sequence number (wraps at 256)
    const nextSeq = (state.seq + 1n) % this.MAX_SEQ;
    state.seq = nextSeq;
    state.lastPublishTime = Date.now();

    return nextSeq;
  }

  /**
   * Get current sequence number without incrementing
   *
   * @param groupId - Sparkplug Group ID
   * @param edgeNodeId - Edge Node ID
   * @returns The current sequence number or null if not initialized
   */
  getCurrentSeq(groupId: string, edgeNodeId: string): bigint | null {
    const key = this.getNodeKey(groupId, edgeNodeId);
    const state = this.nodeSequences.get(key);
    return state?.seq ?? null;
  }

  /**
   * Get the bdSeq for a node
   *
   * @param groupId - Sparkplug Group ID
   * @param edgeNodeId - Edge Node ID
   * @returns The birth/death sequence number or null
   */
  getBdSeq(groupId: string, edgeNodeId: string): bigint | null {
    const key = this.getNodeKey(groupId, edgeNodeId);
    const state = this.nodeSequences.get(key);
    return state?.bdSeq ?? null;
  }

  /**
   * Validate incoming sequence number
   * Returns true if the sequence is valid (matches expected)
   *
   * @param groupId - Sparkplug Group ID
   * @param edgeNodeId - Edge Node ID
   * @param receivedSeq - The sequence number received in the message
   * @returns Validation result with expected sequence
   */
  validateSeq(
    groupId: string,
    edgeNodeId: string,
    receivedSeq: bigint
  ): { valid: boolean; expected: bigint | null; received: bigint } {
    const key = this.getNodeKey(groupId, edgeNodeId);
    const state = this.nodeSequences.get(key);

    if (!state) {
      // No state means first message, accept it
      return { valid: true, expected: null, received: receivedSeq };
    }

    const expectedSeq = (state.seq + 1n) % this.MAX_SEQ;
    const valid = receivedSeq === expectedSeq;

    if (valid) {
      // Update the stored sequence
      state.seq = receivedSeq;
      state.lastPublishTime = Date.now();
    }

    return { valid, expected: expectedSeq, received: receivedSeq };
  }

  /**
   * Get full state for a node (for debugging/inspection)
   */
  getState(groupId: string, edgeNodeId: string): SequenceState | null {
    const key = this.getNodeKey(groupId, edgeNodeId);
    return this.nodeSequences.get(key) ?? null;
  }

  /**
   * Remove state for a node (on NDEATH or cleanup)
   */
  removeState(groupId: string, edgeNodeId: string): void {
    const key = this.getNodeKey(groupId, edgeNodeId);
    this.nodeSequences.delete(key);
    console.log(`[SequenceManager] Removed state for ${key}`);
  }

  /**
   * Get all node states (for diagnostics)
   */
  getAllStates(): Map<string, SequenceState> {
    return new Map(this.nodeSequences);
  }

  /**
   * Clear all state
   */
  clear(): void {
    this.nodeSequences.clear();
  }
}

// Export singleton instance
export const sequenceManager = new SequenceManager();
