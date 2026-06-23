import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export interface SkillScore {
  name: string;
  install_count: number;
  github_stars: number;
  quality_score: number; // 0-100
  recommendation: string;
}

export interface SkillCreationRequest {
  name: string;
  description: string;
  triggers: string[];
  category: string;
}

/**
 * Feature #3: Skill Intelligence 2.0
 * - Quality scoring
 * - Auto-update
 * - Skill creation assistant
 */

const LEADERBOARD_URL = 'https://skills.sh'; // placeholder

/**
 * Scores a skill based on popularity and quality signals
 */
export async function scoreSkill(skillName: string): Promise<SkillScore> {
  // In production this would call the real skills.sh API
  // For now we simulate realistic data
  const mockData: Record<string, Partial<SkillScore>> = {
    'playwright-cli': { install_count: 185000, github_stars: 12400 },
    'find-skills': { install_count: 92000, github_stars: 8900 },
    'api-docs-generator': { install_count: 34000, github_stars: 2100 },
    'security-scanner': { install_count: 18700, github_stars: 980 },
  };

  const data = mockData[skillName] || { install_count: 1200, github_stars: 45 };

  const quality = Math.min(
    100,
    Math.floor(
      (Math.log10(data.install_count || 1) * 18) +
      (Math.log10(data.github_stars || 1) * 12)
    )
  );

  let recommendation = 'Good skill';
  if (quality > 85) recommendation = 'Excellent — highly recommended';
  else if (quality > 70) recommendation = 'Very good';
  else if (quality < 50) recommendation = 'Consider alternatives';

  return {
    name: skillName,
    install_count: data.install_count || 0,
    github_stars: data.github_stars || 0,
    quality_score: quality,
    recommendation
  };
}

/**
 * Auto-updates installed skills
 */
export async function autoUpdateSkills(scope: 'project' | 'global' = 'project'): Promise<{
  updated: string[];
  message: string;
}> {
  try {
    const cmd = `npx skills update --${scope === 'project' ? 'p' : 'g'} --yes`;
    execSync(cmd, { stdio: 'pipe' });
    return {
      updated: ['playwright-cli', 'find-skills'], // simulated
      message: 'Skills updated successfully'
    };
  } catch (err) {
    return {
      updated: [],
      message: `Update failed: ${(err as Error).message}`
    };
  }
}

/**
 * Generates a new SKILL.md template (Skill Creation Assistant)
 */
export function createSkillTemplate(req: SkillCreationRequest): string {
  const frontmatter = `---
name: ${req.name}
description: "${req.description}"
triggers: [${req.triggers.map(t => `"${t}"`).join(', ')}]
category: ${req.category}
---`;

  const body = `
<objective>
${req.description}
</objective>

<quick_start>
When the user mentions any of these phrases, activate this skill:
${req.triggers.map(t => `- "${t}"`).join('\n')}
</quick_start>

<context>
This skill provides specialized knowledge for ${req.category} tasks.
</context>

<instructions>
1. Analyze the user's request
2. Apply domain-specific best practices for ${req.name}
3. Return clear, actionable output
</instructions>

<examples>
User: "${req.triggers[0]}"
Assistant: [Uses this skill to deliver high-quality ${req.category} output]
</examples>
`;

  return frontmatter + '\n' + body;
}

/**
 * Saves a newly created skill locally
 */
export function saveNewSkill(name: string, content: string, scope: 'project' | 'global' = 'project'): string {
  const baseDir = scope === 'project'
    ? path.join(process.cwd(), '.claude', 'skills', name)
    : path.join(process.env.HOME || '', '.claude', 'skills', name);

  fs.mkdirSync(baseDir, { recursive: true });
  const skillPath = path.join(baseDir, 'SKILL.md');
  fs.writeFileSync(skillPath, content);

  return skillPath;
}