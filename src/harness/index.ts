/**
 * Ruflo-inspired Meta-Harness for structured-clause-agent
 * 
 * This module brings together:
 * - Security manifest & fingerprinting
 * - MCP policy enforcement
 * - Redaction hooks
 * - Swarm coordination with self-healing
 */

export { SwarmCoordinator, globalSwarm, type SwarmConfig, type ConsensusMode } from './swarm';
export { redactSensitiveData, createRedactionHook, checkSwarmHealth } from './redaction';

import { globalSwarm } from './swarm';
import { createRedactionHook } from './redaction';

export function initializeHarness() {
  console.log('[harness] Ruflo-style meta-harness initialized');
  
  // Register redaction hook globally
  const redactionHook = createRedactionHook();
  
  return {
    swarm: globalSwarm,
    redaction: redactionHook,
    version: '0.3.0-ruflo'
  };
}