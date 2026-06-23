import { execSync } from 'child_process';
import { handleUserRequest, activateSkill } from './skills';

export interface Subagent {
  id: string;
  name: string;
  skill: string;
  task: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string;
  created_at: string;
}

const activeSubagents: Map<string, Subagent> = new Map();

/**
 * Spawns a new subagent focused on a specific skill + task
 * This is the core of Feature #2
 */
export async function spawnSubagent(
  skill: string,
  task: string,
  agentType: string = 'claude-code'
): Promise<Subagent> {
  const id = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const subagent: Subagent = {
    id,
    name: `${skill}-agent`,
    skill,
    task,
    status: 'pending',
    created_at: new Date().toISOString()
  };

  activeSubagents.set(id, subagent);

  // Activate the required skill for this subagent
  const activation = await activateSkill(skill, agentType);
  
  if (!activation.success) {
    subagent.status = 'failed';
    subagent.result = `Failed to activate skill: ${activation.message}`;
    return subagent;
  }

  subagent.status = 'running';

  // In a real implementation, this would spawn an isolated context/worktree
  // For now we simulate execution and store the skill content
  subagent.result = `Subagent ready with skill "${skill}". Task: ${task}\n\nSkill content loaded.`;

  return subagent;
}

export function getSubagent(id: string): Subagent | undefined {
  return activeSubagents.get(id);
}

export function listSubagents(): Subagent[] {
  return Array.from(activeSubagents.values());
}

export async function runSubagentTask(id: string): Promise<Subagent> {
  const subagent = activeSubagents.get(id);
  if (!subagent) throw new Error('Subagent not found');

  subagent.status = 'running';

  // Simulate specialized execution (in reality this would call a model with the skill loaded)
  await new Promise(resolve => setTimeout(resolve, 800));

  subagent.status = 'completed';
  subagent.result = `Completed task "${subagent.task}" using skill "${subagent.skill}".`;

  return subagent;
}

/**
 * High-level orchestrator that can create multiple subagents for a complex request
 */
export async function orchestrateWithSubagents(mainTask: string, skills: string[]) {
  const subagents: Subagent[] = [];

  for (const skill of skills) {
    const sub = await spawnSubagent(skill, `Handle part of: ${mainTask}`);
    subagents.push(sub);
  }

  // Run them in parallel (simulated)
  await Promise.all(subagents.map(s => runSubagentTask(s.id)));

  return {
    main_task: mainTask,
    subagents,
    summary: `Created ${subagents.length} specialized subagents`
  };
}