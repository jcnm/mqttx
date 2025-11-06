// Rebirth Logic for Sparkplug Nodes
// Handles rebirth requests and bdSeq management

import type { StateManager } from './manager.js';

export interface RebirthOptions {
  groupId: string;
  edgeNodeId: string;
  reason?: string;
}

export class RebirthManager {
  constructor(private stateManager: StateManager) {}

  /**
   * Request a node to rebirth by sending NCMD with Rebirth metric
   * The actual rebirth logic is handled by the node itself
   */
  requestRebirth(options: RebirthOptions): void {
    const node = this.stateManager.getNode(options.groupId, options.edgeNodeId);

    if (!node) {
      throw new Error(
        `Node ${options.groupId}/${options.edgeNodeId} not found`
      );
    }

    console.log(
      `Rebirth requested for ${options.groupId}/${options.edgeNodeId}`,
      options.reason ? `Reason: ${options.reason}` : ''
    );

    // The broker/SCADA will send an NCMD message with:
    // Metric: name="Node Control/Rebirth", datatype=Boolean, value=true
  }

  /**
   * Handle node rebirth (NBIRTH after NDEATH)
   * This increments the bdSeq
   */
  handleRebirth(groupId: string, edgeNodeId: string, oldBdSeq: bigint): bigint {
    // Increment bdSeq (0-255 wrapping)
    const newBdSeq = (oldBdSeq + 1n) % 256n;

    // Update state
    this.stateManager.setNodeOnline(groupId, edgeNodeId, newBdSeq);

    console.log(
      `Node ${groupId}/${edgeNodeId} reborn with bdSeq ${newBdSeq} (was ${oldBdSeq})`
    );

    return newBdSeq;
  }

  /**
   * Generate next bdSeq for a node
   */
  getNextBdSeq(groupId: string, edgeNodeId: string): bigint {
    const node = this.stateManager.getNode(groupId, edgeNodeId);
    if (!node) {
      return 0n; // First birth
    }
    return (node.bdSeq + 1n) % 256n;
  }

  /**
   * Validate rebirth sequence
   * Ensures the bdSeq in NBIRTH matches the bdSeq in the LWT (NDEATH)
   */
  validateRebirthSequence(
    groupId: string,
    edgeNodeId: string,
    nbirthBdSeq: bigint,
    lwtBdSeq: bigint
  ): boolean {
    if (nbirthBdSeq !== lwtBdSeq) {
      console.error(
        `bdSeq mismatch for ${groupId}/${edgeNodeId}: NBIRTH has ${nbirthBdSeq}, LWT has ${lwtBdSeq}`
      );
      return false;
    }
    return true;
  }
}
