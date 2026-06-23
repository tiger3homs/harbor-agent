import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import { 
  getDb, createSession, saveObservation, searchObservations, 
  saveCCRBlob, getCCRBlob, getRecentObservations 
} from './db';
import { 
  compressContent, detectContentType, retrieveOriginal, 
  CompressedResult, setToolBudgets 
} from './compression';
import { loadConfig } from './config';
import { Observation } from './models';
import { orchestrateSkill, detectSkillIntent, ensureSkill, listInstalledSkills } from './skills';
import { handleClaudeCodeHook, generatePluginManifest } from './plugin';
import { spawnSubagent, listSubagents, getSubagent, runSubagentTask, orchestrateWithSubagents } from './subagents';
import { scoreSkill, autoUpdateSkills, createSkillTemplate, saveNewSkill } from './skill-intelligence';
import { initializeHarness, globalSwarm } from './harness';

const app = express();
const PORT = process.env.PORT || 37701; // Similar to claude-mem port scheme

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- Health & Status ---
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '0.1.0', timestamp: new Date().toISOString() });
});

// --- Session Management ---
const SessionStartSchema = z.object({
  project_path: z.string()
});

app.post('/session/start', (req, res) => {
  const { project_path } = SessionStartSchema.parse(req.body);
  const session = createSession(project_path);
  res.json({ session });
});

// --- Observation Capture (PostToolUse style) ---
const ObservationInputSchema = z.object({
  session_id: z.string(),
  type: z.enum(['tool_use', 'prompt', 'response', 'plan', 'summary']),
  tool: z.string().optional(),
  content: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

app.post('/observation', (req, res) => {
  try {
    const input = ObservationInputSchema.parse(req.body);
    
    // Detect content type and compress
    const contentType = detectContentType(input.content, input.tool);
    const compressionResult: CompressedResult = compressContent(
      input.content, 
      contentType, 
      input.tool
    );

    const obs: Omit<Observation, 'id' | 'timestamp'> = {
      session_id: input.session_id,
      type: input.type,
      tool: input.tool,
      content: input.content,
      compressed_content: compressionResult.compressed,
      ccr_key: compressionResult.ccrKey,
      metadata: {
        ...input.metadata,
        compression: {
          type: contentType,
          savings: compressionResult.savingsPercent,
          original_len: compressionResult.originalLength,
          compressed_len: compressionResult.compressedLength
        }
      }
    };

    const saved = saveObservation(obs);

    // Store CCR blob if needed
    if (compressionResult.ccrKey) {
      saveCCRBlob({
        key: compressionResult.ccrKey,
        original_content: input.content,
        type: contentType,
        created_at: new Date().toISOString()
      });
    }

    res.json({ 
      success: true, 
      observation_id: saved.id,
      compression: {
        savings_percent: compressionResult.savingsPercent,
        ccr_key: compressionResult.ccrKey
      }
    });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// --- Layered Memory Retrieval (Claude-Mem style) ---

// Step 1: Compact search index
app.get('/memory/search', (req, res) => {
  const query = req.query.q as string;
  const limit = parseInt(req.query.limit as string) || 8;

  if (!query) {
    return res.status(400).json({ error: 'Missing query parameter q' });
  }

  const results = searchObservations(query, limit).map(r => ({
    id: r.id,
    summary: r.content.slice(0, 180) + (r.content.length > 180 ? '...' : ''),
    relevance: 0.85, // placeholder
    timestamp: r.timestamp,
    type: r.type,
    tool: r.tool
  }));

  res.json({ results, count: results.length });
});

// Step 2: Timeline view
app.get('/memory/timeline', (req, res) => {
  const sessionId = req.query.session_id as string;
  const limit = parseInt(req.query.limit as string) || 15;

  if (!sessionId) {
    return res.status(400).json({ error: 'Missing session_id' });
  }

  const observations = getRecentObservations(sessionId, limit);
  const timeline = observations.map(o => ({
    id: o.id,
    type: o.type,
    tool: o.tool,
    timestamp: o.timestamp,
    short: o.compressed_content ? o.compressed_content.slice(0, 90) : o.content.slice(0, 90)
  }));

  res.json({ timeline });
});

// Step 3: Full observation retrieval (with CCR support)
app.get('/memory/observation/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM observations WHERE id = ?');
  const obs = stmt.get(id) as any;

  if (!obs) {
    return res.status(404).json({ error: 'Observation not found' });
  }

  let fullContent = obs.content;

  // If CCR key exists, we can optionally expand
  if (obs.ccr_key && req.query.expand === 'true') {
    const original = retrieveOriginal(obs.ccr_key);
    if (original) fullContent = original;
  }

  res.json({
    ...obs,
    full_content: fullContent,
    compressed_content: obs.compressed_content
  });
});

// --- CCR Retrieval Tool (Headroom style) ---
app.get('/ccr/:key', (req, res) => {
  const original = retrieveOriginal(req.params.key);
  if (!original) {
    return res.status(404).json({ error: 'CCR key not found' });
  }
  res.json({ key: req.params.key, original_content: original });
});

// --- Plan & Recipe stubs (to be expanded) ---
app.post('/plan', (req, res) => {
  const { task } = req.body;
  res.json({
    plan: {
      id: `plan_${Date.now()}`,
      task,
      steps: [
        "Analyze current state",
        "Identify changes needed",
        "Write implementation plan",
        "Review risks"
      ],
      status: "ready_for_act"
    }
  });
});

app.post('/act', (req, res) => {
  res.json({ message: "Act mode activated. Editor model would execute here." });
});

// ============================================
// Claude Skills Intelligence Layer
// ============================================

app.post('/skills/detect', async (req, res) => {
  try {
    const { task } = req.body;
    if (!task) return res.status(400).json({ error: 'task is required' });

    const result = await orchestrateSkill(task);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/skills/ensure', async (req, res) => {
  try {
    const { skill, agent = 'claude-code' } = req.body;
    if (!skill) return res.status(400).json({ error: 'skill name is required' });

    const result = await ensureSkill(skill, agent);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get('/skills/list', (req, res) => {
  const skills = listInstalledSkills();
  res.json({ skills, count: skills.length });
});

app.post('/skills/find', async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'query is required' });

  // This would call npx skills find in a real implementation
  res.json({
    message: `To find skills for "${query}", run:`,
    command: `npx skills find ${query}`,
    tip: 'Or use the find-skills skill inside Claude Code'
  });
});

// ============================================
// Feature 1: Native Claude Code Plugin Hooks
// ============================================
app.post('/plugin/hook', async (req, res) => {
  try {
    const result = await handleClaudeCodeHook(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get('/plugin/manifest', (req, res) => {
  res.json(generatePluginManifest());
});

// ============================================
// Feature 2: Subagent Orchestration
// ============================================
app.post('/subagents/spawn', async (req, res) => {
  const { skill, task, agent = 'claude-code' } = req.body;
  if (!skill || !task) return res.status(400).json({ error: 'skill and task required' });

  const subagent = await spawnSubagent(skill, task, agent);
  res.json(subagent);
});

app.get('/subagents', (req, res) => {
  res.json({ subagents: listSubagents() });
});

app.post('/subagents/:id/run', async (req, res) => {
  const subagent = await runSubagentTask(req.params.id);
  res.json(subagent);
});

app.post('/subagents/orchestrate', async (req, res) => {
  const { task, skills } = req.body;
  if (!task || !skills) return res.status(400).json({ error: 'task and skills required' });

  const result = await orchestrateWithSubagents(task, skills);
  res.json(result);
});

// ============================================
// Feature 3: Skill Intelligence 2.0
// ============================================
app.get('/skills/score/:name', async (req, res) => {
  const score = await scoreSkill(req.params.name);
  res.json(score);
});

app.post('/skills/update', async (req, res) => {
  const { scope = 'project' } = req.body;
  const result = await autoUpdateSkills(scope);
  res.json(result);
});

app.post('/skills/create', (req, res) => {
  const { name, description, triggers, category } = req.body;
  if (!name || !description) return res.status(400).json({ error: 'name and description required' });

  const content = createSkillTemplate({ name, description, triggers: triggers || [], category: category || 'general' });
  const savedPath = saveNewSkill(name, content);

  res.json({
    success: true,
    path: savedPath,
    content_preview: content.slice(0, 400) + '...'
  });
});

// ============================================
// Ruflo-style Meta-Harness Endpoints
// ============================================
app.get('/harness/status', (req, res) => {
  const health = globalSwarm.checkHealth();
  res.json({
    version: '0.3.0-ruflo',
    swarm: {
      active: globalSwarm.getActiveCount(),
      max: 12,
      consensus: globalSwarm.getConsensusMode(),
      healthy: health.healthy,
      message: health.message
    },
    redaction: 'enabled',
    manifest: '.harness/manifest.json'
  });
});

app.post('/harness/redact', (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'text required' });

  const { redactSensitiveData } = require('./harness/redaction');
  res.json({ redacted: redactSensitiveData(text) });
});

// Start server
export function startWorker() {
  // Load and apply project config
  const config = loadConfig();
  
  if (config.compression.enabled) {
    setToolBudgets(config.compression.budgets);
    console.log(`[config] Applied compression budgets (${config.compression.mode} mode)`);
  }

  // Initialize Ruflo-style meta-harness
  const harness = initializeHarness();
  console.log(`[harness] ${harness.version} active`);

  app.listen(PORT, () => {
    console.log(`[harbor] Worker daemon running on http://localhost:${PORT}`);
    console.log(`Database: ${process.env.DB_PATH || '~/.harbor/agent.db'}`);
    console.log(`Memory: ${config.memory.enabled ? 'enabled' : 'disabled'} (${config.memory.retrieval_mode})`);
    console.log(`Swarm: ${harness.swarm.getActiveCount()} agents | Consensus: ${harness.swarm.getConsensusMode()}`);
  });
}