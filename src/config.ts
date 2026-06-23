import fs from 'fs';
import path from 'path';
import { z } from 'zod';

const ConfigSchema = z.object({
  compression: z.object({
    enabled: z.boolean().default(true),
    mode: z.enum(['aggressive', 'balanced', 'conservative']).default('balanced'),
    budgets: z.object({
      read: z.number().default(280),
      grep: z.number().default(160),
      bash: z.number().default(90),
      default: z.number().default(200)
    }).default({})
  }).default({}),
  memory: z.object({
    enabled: z.boolean().default(true),
    max_context: z.number().default(12),
    retrieval_mode: z.enum(['progressive', 'full']).default('progressive')
  }).default({}),
  workflow: z.object({
    require_plan: z.boolean().default(true),
    architect_model: z.string().default('claude-3-5-sonnet-20241022'),
    editor_model: z.string().default('claude-3-5-haiku-20241022')
  }).default({})
});

export type AgentConfig = z.infer<typeof ConfigSchema>;

const DEFAULT_CONFIG: AgentConfig = {
  compression: {
    enabled: true,
    mode: 'balanced',
    budgets: { read: 280, grep: 160, bash: 90, default: 200 }
  },
  memory: {
    enabled: true,
    max_context: 12,
    retrieval_mode: 'progressive'
  },
  workflow: {
    require_plan: true,
    architect_model: 'claude-3-5-sonnet-20241022',
    editor_model: 'claude-3-5-haiku-20241022'
  }
};

export function loadConfig(projectDir = process.cwd()): AgentConfig {
  const configPath = path.join(projectDir, '.harbor.json');

  if (fs.existsSync(configPath)) {
    try {
      const raw = fs.readFileSync(configPath, 'utf8');
      const parsed = JSON.parse(raw);
      return ConfigSchema.parse({ ...DEFAULT_CONFIG, ...parsed });
    } catch (err) {
      console.warn('⚠️  Invalid config file, using defaults');
    }
  }
  return DEFAULT_CONFIG;
}

export function saveDefaultConfig(projectDir = process.cwd()) {
  const configPath = path.join(projectDir, '.harbor.json');
  fs.writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2));
  return configPath;
}