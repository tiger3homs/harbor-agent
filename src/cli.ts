#!/usr/bin/env node
import { Command } from 'commander';
import { startWorker } from './worker-service';
import { loadConfig, saveDefaultConfig } from './config';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import os from 'os';
import http from 'http';

dotenv.config();

const program = new Command();

program
  .name('harbor')
  .alias('sca')
  .description('Harbor — The Skills Operating System for Claude Code. Automatic skill detection, subagent swarms, and meta-harness security.')
  .version('0.3.0');

program
  .command('start')
  .description('Start the worker daemon')
  .option('-p, --port <port>', 'Port to run on', '37701')
  .option('--db <path>', 'Path to SQLite database')
  .action((options) => {
    if (options.port) process.env.PORT = options.port;
    if (options.db) process.env.DB_PATH = options.db;

    console.log('🚀 Starting Structured Clause Agent daemon...');
    startWorker();
  });

program
  .command('init')
  .description('Initialize a new project configuration')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .action((options) => {
    const dir = path.resolve(options.dir);
    const configPath = saveDefaultConfig(dir);
    console.log(`✅ Created configuration at ${configPath}`);
    console.log('Edit the file to customize compression, memory, and workflow settings.');
  });

program
  .command('status')
  .description('Check daemon status and stats')
  .action(() => {
    const config = loadConfig();
    console.log('📊 Structured Clause Agent Status');
    console.log('  Version: 0.2.0');
    console.log('  Daemon: Use `sca start` to run');
    console.log('  DB: ~/.harbor/agent.db');
    console.log('  Config loaded:', config.compression.mode);
    console.log('');
    console.log('Ready for Claude Code integration.');
  });

program
  .command('compress')
  .description('Compress a file or string (demo)')
  .argument('<input>', 'File path or raw text')
  .option('-t, --type <type>', 'Content type (code|json|text)', 'text')
  .action((input, options) => {
    console.log(`🗜️  Compressing ${input} as ${options.type}...`);
    console.log('Demo mode — full CLI compression coming in v0.3.0');
  });

program
  .command('skills')
  .description('Manage Claude Skills intelligence')
  .option('-d, --detect <task>', 'Detect which skill should be used for a task')
  .option('-e, --ensure <skill>', 'Ensure a skill is installed')
  .option('-l, --list', 'List installed skills')
  .option('-t, --tui', 'Launch interactive TUI')
  .action(async (options) => {
    if (options.tui) {
      const { startTUI } = await import('./tui');
      startTUI();
    } else if (options.detect) {
      const { handleUserRequest } = await import('./skills');
      const result = await handleUserRequest(options.detect);
      console.log(JSON.stringify(result, null, 2));
    } else if (options.ensure) {
      const { ensureSkill } = await import('./skills');
      const result = await ensureSkill(options.ensure);
      console.log(result);
    } else if (options.list) {
      const { listInstalledSkills } = await import('./skills');
      console.log(listInstalledSkills());
    } else {
      console.log('Usage: sca skills --detect "create browser test"  |  sca skills --tui');
    }
  });

// ------------------------------------------------------------------
// harbor hook  — called by Claude Code UserPromptSubmit hook
// reads JSON from stdin, posts to daemon, outputs additionalContext
// ------------------------------------------------------------------
program
  .command('hook')
  .description('Claude Code UserPromptSubmit hook handler (reads stdin JSON)')
  .action(async () => {
    let raw = '';
    process.stdin.setEncoding('utf8');
    for await (const chunk of process.stdin) raw += chunk;

    let message = '';
    try {
      const d = JSON.parse(raw);
      message = d.message || d.prompt || d.userMessage || '';
    } catch { message = raw.trim(); }

    if (!message) process.exit(0);

    try {
      const payload = JSON.stringify({ type: 'UserPromptSubmit', data: { message } });
      const result = await new Promise<string>((resolve, reject) => {
        const req = http.request(
          { hostname: '127.0.0.1', port: 37701, path: '/plugin/hook', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } },
          (res) => { let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(d)); }
        );
        req.on('error', reject);
        req.write(payload);
        req.end();
      });
      const r = JSON.parse(result);
      if (r.inject_context) {
        process.stdout.write(JSON.stringify({ additionalContext: r.inject_context, continue: true }));
      }
    } catch { /* daemon not running — silent fail */ }
    process.exit(0);
  });

// ------------------------------------------------------------------
// harbor daemon --ensure  — start daemon if not already running
// ------------------------------------------------------------------
program
  .command('daemon')
  .description('Manage the Harbor daemon')
  .option('--ensure', 'Start daemon if not running (used by SessionStart hook)')
  .action((options) => {
    if (options.ensure) {
      // Check if already running
      const req = http.request(
        { hostname: '127.0.0.1', port: 37701, path: '/harness/status', method: 'GET' },
        (res) => {
          if (res.statusCode === 200) {
            process.stdout.write(JSON.stringify({ continue: true, suppressOutput: true, status: 'ready' }));
            process.exit(0);
          } else { spawn(); }
        }
      );
      req.on('error', spawn);
      req.end();

      function spawn() {
        const { spawn: spawnProc } = require('child_process');
        const child = spawnProc(process.execPath, [__filename, 'start'], {
          detached: true, stdio: 'ignore',
        });
        child.unref();
        setTimeout(() => {
          process.stdout.write(JSON.stringify({ continue: true, suppressOutput: true, status: 'started' }));
          process.exit(0);
        }, 1500);
      }
    } else {
      console.log('Usage: harbor daemon --ensure');
    }
  });

// ------------------------------------------------------------------
// harbor install / uninstall  — wire/unwire Claude Code hooks
// ------------------------------------------------------------------
function getClaudeSettings() {
  const dir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
  return path.join(dir, 'settings.json');
}

program
  .command('install')
  .description('Wire Harbor hooks into Claude Code settings.json')
  .action(() => {
    const settingsPath = getClaudeSettings();
    let settings: any = {};
    try { settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8')); } catch {}
    if (!settings.hooks) settings.hooks = {};

    const binPath = `${process.execPath} ${__filename}`;

    for (const [event, matcher, cmd] of [
      ['SessionStart', 'startup|resume|clear|compact', `${binPath} daemon --ensure`],
      ['UserPromptSubmit', null, `${binPath} hook`],
    ] as [string, string|null, string][]) {
      if (!settings.hooks[event]) settings.hooks[event] = [];
      const already = settings.hooks[event].some((h: any) =>
        h.hooks?.some((hh: any) => hh.command?.includes('harbor'))
      );
      if (!already) {
        const entry: any = { hooks: [{ type: 'command', command: cmd, timeout: event === 'SessionStart' ? 15 : 5 }] };
        if (matcher) entry.matcher = matcher;
        settings.hooks[event].push(entry);
      }
    }

    fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
    console.log('✅ Harbor wired into Claude Code!');
    console.log('   Start daemon: harbor start');
    console.log('   Or it auto-starts on next Claude Code session.');
  });

program
  .command('uninstall')
  .description('Remove Harbor hooks from Claude Code settings.json')
  .action(() => {
    const settingsPath = getClaudeSettings();
    let settings: any = {};
    try { settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8')); } catch { return; }
    if (!settings.hooks) { console.log('No hooks found.'); return; }

    for (const event of ['SessionStart', 'UserPromptSubmit']) {
      if (settings.hooks[event]) {
        settings.hooks[event] = settings.hooks[event].filter((h: any) =>
          !h.hooks?.some((hh: any) => hh.command?.includes('harbor'))
        );
        if (settings.hooks[event].length === 0) delete settings.hooks[event];
      }
    }
    if (Object.keys(settings.hooks).length === 0) delete settings.hooks;

    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
    console.log('✅ Harbor hooks removed from Claude Code.');
  });

program.parse(process.argv);