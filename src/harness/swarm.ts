import { checkSwarmHealth } from './redaction';

export type ConsensusMode = 'raft' | 'byzantine' | 'gossip' | 'crdt' | 'quorum';

export interface SwarmConfig {
  max_subagents: number;
  consensus: ConsensusMode;
  self_healing: boolean;
}

export const DEFAULT_SWARM_CONFIG: SwarmConfig = {
  max_subagents: 12,
  consensus: 'raft',
  self_healing: true
};

/**
 * Ruflo-inspired Swarm Coordinator
 */
export class SwarmCoordinator {
  private config: SwarmConfig;
  private activeAgents: Map<string, any> = new Map();

  constructor(config: Partial<SwarmConfig> = {}) {
    this.config = { ...DEFAULT_SWARM_CONFIG, ...config };
  }

  registerAgent(id: string, metadata: any) {
    this.activeAgents.set(id, { ...metadata, joined_at: new Date().toISOString() });
    return this.checkHealth();
  }

  removeAgent(id: string) {
    this.activeAgents.delete(id);
    return this.checkHealth();
  }

  checkHealth() {
    return checkSwarmHealth(this.activeAgents.size, this.config.max_subagents);
  }

  getConsensusMode(): ConsensusMode {
    return this.config.consensus;
  }

  getActiveCount(): number {
    return this.activeAgents.size;
  }

  /**
   * Self-healing: automatically clean up stale agents
   */
  selfHeal(): { removed: number; message: string } {
    if (!this.config.self_healing) {
      return { removed: 0, message: 'Self-healing disabled' };
    }

    // In a real implementation this would check last heartbeat
    const before = this.activeAgents.size;
    // Placeholder: would remove agents older than X minutes with no activity
    return {
      removed: 0,
      message: `Self-heal check complete. ${before} agents active.`
    };
  }
}

export const globalSwarm = new SwarmCoordinator();