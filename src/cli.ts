#!/usr/bin/env node
import { Command } from 'commander';
import { startWorker } from './worker-service';
import { loadConfig, saveDefaultConfig } from './config';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

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

program.parse(process.argv);