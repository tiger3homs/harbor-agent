#!/usr/bin/env node
import dotenv from 'dotenv';
import { startWorker } from './worker-service';

dotenv.config();

console.log(`
  ⚓  Harbor v0.3.0
  ──────────────────────────────
     Anchor • Swarm • Skills OS
`);
console.log('   Automatic skill intelligence • Subagent swarms • Meta-harness security');
console.log('');

startWorker();