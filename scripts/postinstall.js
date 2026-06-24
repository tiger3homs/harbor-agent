#!/usr/bin/env node
/**
 * harbor-agent postinstall — auto-wires Claude Code hooks on npm install
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

const HOOK_EVENT = 'UserPromptSubmit';
const SESSION_EVENT = 'SessionStart';

function getClaudeConfigDir() {
  return process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
}

function getSettingsPath() {
  return path.join(getClaudeConfigDir(), 'settings.json');
}

function loadSettings(settingsPath) {
  try {
    if (fs.existsSync(settingsPath)) {
      return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    }
  } catch {}
  return {};
}

function saveSettings(settingsPath, settings) {
  const dir = path.dirname(settingsPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
}

// Find harbor-agent CLI path
function getHarborPath() {
  // Try to find the installed binary
  const candidates = [
    path.join(__dirname, '..', 'dist', 'cli.js'),
    path.join(__dirname, '..', '..', '.bin', 'harbor-agent'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

function wireHooks(settings) {
  if (!settings.hooks) settings.hooks = {};

  const harborPath = getHarborPath();
  const nodeCmd = process.execPath;

  // Session start — start daemon
  const sessionCmd = harborPath
    ? `${nodeCmd} ${harborPath} daemon --ensure`
    : `harbor daemon --ensure`;

  const sessionHook = {
    type: 'command',
    command: sessionCmd,
    timeout: 15,
  };

  // UserPromptSubmit — inject skills
  const promptCmd = harborPath
    ? `${nodeCmd} ${harborPath} hook`
    : `harbor hook`;

  const promptHook = {
    type: 'command',
    command: promptCmd,
    timeout: 5,
  };

  // Add SessionStart hook
  if (!settings.hooks[SESSION_EVENT]) settings.hooks[SESSION_EVENT] = [];
  const sessionHooks = settings.hooks[SESSION_EVENT];
  const hasSession = sessionHooks.some(
    (h) => h.hooks && h.hooks.some((hh) => hh.command && hh.command.includes('harbor'))
  );
  if (!hasSession) {
    sessionHooks.push({ matcher: 'startup|resume|clear|compact', hooks: [sessionHook] });
  }

  // Add UserPromptSubmit hook
  if (!settings.hooks[HOOK_EVENT]) settings.hooks[HOOK_EVENT] = [];
  const promptHooks = settings.hooks[HOOK_EVENT];
  const hasPrompt = promptHooks.some(
    (h) => h.hooks && h.hooks.some((hh) => hh.command && hh.command.includes('harbor'))
  );
  if (!hasPrompt) {
    promptHooks.push({ hooks: [promptHook] });
  }

  return settings;
}

function main() {
  // Skip in CI or if user opted out
  if (process.env.CI || process.env.HARBOR_NO_HOOK) {
    console.log('[harbor-agent] Skipping hook wiring (CI/HARBOR_NO_HOOK set)');
    return;
  }

  const settingsPath = getSettingsPath();
  const settings = loadSettings(settingsPath);

  // Check if already wired
  const alreadyWired =
    settings.hooks &&
    settings.hooks[HOOK_EVENT] &&
    settings.hooks[HOOK_EVENT].some(
      (h) => h.hooks && h.hooks.some((hh) => hh.command && hh.command.includes('harbor'))
    );

  if (alreadyWired) {
    console.log('[harbor-agent] ✅ Hooks already wired in Claude Code settings');
    return;
  }

  try {
    const updated = wireHooks(settings);
    saveSettings(settingsPath, updated);
    console.log('[harbor-agent] ✅ Wired into Claude Code — skills will auto-inject on every prompt');
    console.log('[harbor-agent] Start daemon: harbor start');
    console.log('[harbor-agent] To remove hooks: harbor uninstall');
  } catch (err) {
    console.warn('[harbor-agent] ⚠️  Could not auto-wire hooks:', err.message);
    console.warn('[harbor-agent] Run manually: harbor install');
  }
}

main();
