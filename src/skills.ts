import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';

export interface Skill {
  name: string;
  description: string;
  source: string;
  installed: boolean;
  scope: 'project' | 'global';
  content?: string;
}

const SkillDetectionSchema = z.object({
  task: z.string(),
  confidence: z.number().min(0).max(1),
  recommended_skill: z.string().optional(),
  reason: z.string(),
  should_install: z.boolean()
});

export type SkillDetection = z.infer<typeof SkillDetectionSchema>;

// ============================================
// EXPANDED SKILL PATTERNS (20+ common skills)
// ============================================
const SKILL_PATTERNS: Record<string, { skill: string; triggers: string[]; category: string }> = {
  // Browser & Testing
  'playwright-cli': {
    skill: 'playwright-cli',
    triggers: ['browser', 'playwright', 'screenshot', 'e2e', 'click', 'navigate', 'form fill', 'test form', 'browser test'],
    category: 'testing'
  },
  'puppeteer': {
    skill: 'puppeteer',
    triggers: ['puppeteer', 'headless chrome', 'web scraping', 'automation'],
    category: 'testing'
  },

  // Skills Management
  'find-skills': {
    skill: 'find-skills',
    triggers: ['find skill', 'install skill', 'search skill', 'what skill', 'discover skill', 'add skill', 'need a skill'],
    category: 'meta'
  },
  'managing-skills': {
    skill: 'managing-skills',
    triggers: ['manage skill', 'update skill', 'list skill', 'remove skill', 'skill status'],
    category: 'meta'
  },

  // Documentation
  'api-docs-generator': {
    skill: 'api-docs-generator',
    triggers: ['generate docs', 'document api', 'create documentation', 'api docs', 'swagger', 'openapi'],
    category: 'docs'
  },
  'readme-generator': {
    skill: 'readme-generator',
    triggers: ['write readme', 'generate readme', 'create documentation', 'project docs'],
    category: 'docs'
  },

  // Code Quality
  'typescript-strict': {
    skill: 'typescript-strict',
    triggers: ['strict typescript', 'fix types', 'type safety', 'typescript errors'],
    category: 'quality'
  },
  'eslint-config': {
    skill: 'eslint-config',
    triggers: ['setup eslint', 'linting', 'code style', 'fix lint'],
    category: 'quality'
  },

  // Data & AI
  'sql-analyst': {
    skill: 'sql-analyst',
    triggers: ['write sql', 'query database', 'analyze data', 'sql query'],
    category: 'data'
  },
  'vector-search': {
    skill: 'vector-search',
    triggers: ['embeddings', 'vector db', 'semantic search', 'rag'],
    category: 'ai'
  },

  // Deployment & DevOps
  'vercel-deploy': {
    skill: 'vercel-deploy',
    triggers: ['deploy to vercel', 'vercel deploy', 'production deploy'],
    category: 'devops'
  },
  'docker-expert': {
    skill: 'docker-expert',
    triggers: ['docker', 'containerize', 'docker compose', 'kubernetes', 'container', 'dockerfile'],
    category: 'devops'
  },

  // Frontend
  'tailwind-design': {
    skill: 'tailwind-design',
    triggers: ['tailwind', 'modern ui', 'responsive design', 'component design'],
    category: 'frontend'
  },
  'shadcn-ui': {
    skill: 'shadcn-ui',
    triggers: ['shadcn', 'ui components', 'install shadcn'],
    category: 'frontend'
  },

  // Backend
  'prisma-setup': {
    skill: 'prisma-setup',
    triggers: ['prisma', 'database schema', 'orm setup'],
    category: 'backend'
  },
  'tRPC-setup': {
    skill: 'tRPC-setup',
    triggers: ['trpc', 'type safe api', 'rpc'],
    category: 'backend'
  },

  // Security
  'security-scanner': {
    skill: 'security-scanner',
    triggers: ['security audit', 'vulnerability', 'scan for secrets', 'owasp'],
    category: 'security'
  }
};

export function detectSkillIntent(task: string): SkillDetection {
  const lower = task.toLowerCase();

  let bestMatch: { skill: string; confidence: number; reason: string } | null = null;

  for (const [key, config] of Object.entries(SKILL_PATTERNS)) {
    for (const trigger of config.triggers) {
      if (lower.includes(trigger)) {
        const confidence = trigger.length > 8 ? 0.9 : 0.75;
        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = {
            skill: config.skill,
            confidence,
            reason: `Matched trigger: "${trigger}" (${config.category})`
          };
        }
      }
    }
  }

  if (bestMatch) {
    return {
      task,
      confidence: bestMatch.confidence,
      recommended_skill: bestMatch.skill,
      reason: bestMatch.reason,
      should_install: !isSkillInstalled(bestMatch.skill)
    };
  }

  // Fallback for complex tasks
  if (lower.length > 50 && (lower.includes('implement') || lower.includes('build') || lower.includes('create'))) {
    return {
      task,
      confidence: 0.55,
      recommended_skill: undefined,
      reason: 'Complex implementation task — consider searching for a specialized skill',
      should_install: false
    };
  }

  return {
    task,
    confidence: 0.25,
    recommended_skill: undefined,
    reason: 'No strong skill match found',
    should_install: false
  };
}

export function isSkillInstalled(skillName: string): boolean {
  const projectPath = path.join(process.cwd(), '.claude', 'skills', skillName);
  const globalPath = path.join(process.env.HOME || '', '.claude', 'skills', skillName);
  return fs.existsSync(projectPath) || fs.existsSync(globalPath);
}

/**
 * Reads the full SKILL.md content of an installed skill (for injection)
 */
export function loadSkillContent(skillName: string): string | null {
  const home = process.env.HOME || '';
  const cwd = process.cwd();

  // Direct lookup first
  const candidates = [
    path.join(cwd, '.claude', 'skills', skillName, 'SKILL.md'),
    path.join(home, '.claude', 'skills', skillName, 'SKILL.md'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8');
  }

  // Fuzzy match against installed skills
  const installed = listInstalledSkillNames(home, cwd);
  // Extract keywords from skillName and find best installed skill match
  const lower = skillName.toLowerCase().replace(/[-_]/g, '');
  const keywords = skillName.toLowerCase().split(/[-_\s]+/).filter(w => w.length > 2);
  const match = installed.find(n => {
    const nLower = n.toLowerCase().replace(/[-_]/g, '');
    if (nLower.includes(lower) || lower.includes(nLower)) return true;
    const nKeywords = n.toLowerCase().split(/[-_\s]+/).filter(w => w.length > 2);
    return keywords.some(k => nKeywords.some(nk => nk.includes(k) || k.includes(nk)));
  });
  if (match) {
    for (const base of [cwd, home]) {
      const p = path.join(base, '.claude', 'skills', match, 'SKILL.md');
      if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8');
    }
  }

  return null;
}

function listInstalledSkillNames(home: string, cwd: string): string[] {
  const names: string[] = [];
  for (const base of [home, cwd]) {
    const dir = path.join(base, '.claude', 'skills');
    try {
      if (fs.existsSync(dir)) names.push(...fs.readdirSync(dir));
    } catch {}
  }
  return [...new Set(names)];
}

/**
 * AUTOMATIC SKILL ACTIVATION
 * Installs the skill if missing and returns the full SKILL.md content ready for Claude
 */
export async function activateSkill(skillName: string, agent = 'claude-code'): Promise<{
  success: boolean;
  skill?: Skill;
  content?: string;
  message: string;
  installed: boolean;
}> {
  const wasInstalled = isSkillInstalled(skillName);

  if (!wasInstalled) {
    const ensure = await ensureSkill(skillName, agent);
    if (!ensure.success) {
      return { success: false, message: ensure.message, installed: false };
    }
  }

  const content = loadSkillContent(skillName);
  const description = content?.match(/description:\s*["']?(.+?)["']?\n/)?.[1] || 'No description';

  return {
    success: true,
    skill: {
      name: skillName,
      description,
      source: 'vercel-labs/skills',
      installed: true,
      scope: 'project'
    },
    content: content || undefined,
    message: wasInstalled 
      ? `Skill "${skillName}" was already active.` 
      : `Skill "${skillName}" installed and activated.`,
    installed: true
  };
}

export async function ensureSkill(skillName: string, agent = 'claude-code'): Promise<{
  success: boolean;
  message: string;
  action?: string;
}> {
  if (isSkillInstalled(skillName)) {
    return { success: true, message: `Skill "${skillName}" is already installed.` };
  }

  if (skillName === 'find-skills') {
    try {
      console.log('[skills] Bootstrapping find-skills...');
      execSync(
        `npx -y skills add https://github.com/vercel-labs/skills --skill find-skills --agent ${agent} --yes`,
        { stdio: 'inherit' }
      );
      return { success: true, message: 'Successfully installed find-skills.' };
    } catch (err) {
      return { success: false, message: `Failed to install find-skills: ${(err as Error).message}` };
    }
  }

  const findResult = await ensureSkill('find-skills', agent);
  if (!findResult.success) return findResult;

  return {
    success: true,
    message: `find-skills ready. Recommended command: npx skills add vercel-labs/skills --skill ${skillName} --agent ${agent}`,
    action: `npx skills add vercel-labs/skills --skill ${skillName} --agent ${agent} --yes`
  };
}

export function listInstalledSkills(): Skill[] {
  const skills: Skill[] = [];
  const baseDirs = [
    path.join(process.cwd(), '.claude', 'skills'),
    path.join(process.env.HOME || '', '.claude', 'skills')
  ];

  for (const base of baseDirs) {
    if (!fs.existsSync(base)) continue;
    const scope = base.includes(process.cwd()) ? 'project' : 'global';

    try {
      const entries = fs.readdirSync(base, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const skillPath = path.join(base, entry.name);
          const skillMd = path.join(skillPath, 'SKILL.md');
          let description = 'No description';
          if (fs.existsSync(skillMd)) {
            const content = fs.readFileSync(skillMd, 'utf8');
            const match = content.match(/description:\s*["']?(.+?)["']?\n/);
            if (match) description = match[1];
          }
          skills.push({
            name: entry.name,
            description,
            source: 'local',
            installed: true,
            scope
          });
        }
      }
    } catch {}
  }
  return skills;
}

export async function orchestrateSkill(task: string, agent = 'claude-code') {
  const detection = detectSkillIntent(task);

  if (detection.recommended_skill) {
    const ensureResult = await ensureSkill(detection.recommended_skill, agent);
    return {
      detection,
      ensure: ensureResult,
      instruction: `Use the "${detection.recommended_skill}" skill for this task.`,
      next_action: detection.should_install 
        ? `npx skills add vercel-labs/skills --skill ${detection.recommended_skill} --agent ${agent} --yes`
        : undefined
    };
  }

  return {
    detection,
    ensure: { success: true, message: 'No skill needed' },
    instruction: 'No specialized skill detected. Proceed normally.'
  };
}

/**
 * ONE-SHOT SMART HANDLER (recommended for Claude Code integration)
 */
export async function handleUserRequest(userMessage: string, agent = 'claude-code') {
  const result = await orchestrateSkill(userMessage, agent);

  if (result.detection.recommended_skill && result.detection.should_install) {
    const activation = await activateSkill(result.detection.recommended_skill, agent);
    return {
      ...result,
      activation,
      recommendation: `Activated skill: ${result.detection.recommended_skill}`,
      skill_content: activation.content
    };
  }

  if (result.detection.recommended_skill) {
    const content = loadSkillContent(result.detection.recommended_skill);
    return {
      ...result,
      recommendation: `Using existing skill: ${result.detection.recommended_skill}`,
      skill_content: content || undefined
    };
  }

  return {
    ...result,
    recommendation: 'No matching skill found. Proceeding with standard capabilities.'
  };
}