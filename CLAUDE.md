# CLAUDE.md — structured-clause-agent

This document helps AI coding assistants (Claude, Cursor, etc.) understand the architecture, conventions, and development patterns of this project.

---

## Project Overview

`structured-clause-agent` is a **unified Claude Code companion** that combines:

- Token-efficient compression (Headroom + Caveman)
- Persistent layered memory (Claude-Mem style)
- Structured workflows (`plan` → `act`)
- **Skills Intelligence OS** — automatic detection, installation, and injection of Claude Skills

**Core Goal**: Make Claude Code autonomously powerful by managing the open skills ecosystem without manual commands.

---

## Architecture

### Core Layers

1. **Compression Engine** (`src/compression.ts`)
   - ContentRouter + type-specific compressors
   - Caveman tool budgets + sanitization
   - CCR (Content-Compressed Retrieval) for reversible compression

2. **Memory System** (`src/db.ts`)
   - SQLite + FTS5
   - Progressive retrieval: `search` → `timeline` → `get_observation`

3. **Skills Intelligence** (Main innovation in v0.3.0)
   - `src/skills.ts` — Detection, activation, `SKILL.md` loading
   - `src/plugin.ts` — Native Claude Code hook integration
   - `src/subagents.ts` — Specialized subagent spawning
   - `src/skill-intelligence.ts` — Scoring, auto-update, skill creation

4. **Worker Daemon** (`src/worker-service.ts`)
   - Express server on port 37701
   - All API endpoints (compression, memory, skills, subagents, plugin hooks)

5. **CLI & TUI** (`src/cli.ts`, `src/tui.ts`)
   - `sca start`, `sca init`, `sca skills --tui`

---

## Key Files

| File                        | Purpose                                      |
|----------------------------|----------------------------------------------|
| `src/skills.ts`            | Core skill detection + activation logic      |
| `src/plugin.ts`            | Claude Code hook handler                     |
| `src/subagents.ts`         | Subagent spawning and orchestration          |
| `src/skill-intelligence.ts`| Quality scoring + skill creation             |
| `src/worker-service.ts`    | All HTTP endpoints                           |
| `src/compression.ts`       | Token compression stack                      |
| `src/db.ts`                | SQLite + FTS5 persistence                    |
| `src/tui.ts`               | Interactive terminal UI                      |

---

## Development Commands

```bash
npm run build          # Compile TypeScript
npm run dev            # Run in development
npm start              # Run compiled daemon
sca skills --tui       # Launch interactive TUI
```

---

## API Patterns

### Skills Detection Flow (Most Important)

```ts
const result = await handleUserRequest(userMessage);
// Returns detection + activation + optional skill_content
```

When a skill is activated, always return the full `SKILL.md` content so it can be injected into Claude's context.

### Hook Integration

The `/plugin/hook` endpoint is designed to be called from Claude Code's `UserPromptSubmit` hook. It should return `inject_context` containing the skill content.

---

## Coding Conventions

- Use **Zod** for all request validation
- Keep functions small and focused
- All new endpoints should be documented in `worker-service.ts`
- Skill patterns live in `SKILL_PATTERNS` object in `skills.ts`
- Always handle the case where a skill is not installed yet

---

## Important Patterns

### Adding a New Skill Pattern

Edit `src/skills.ts`:

```ts
'my-new-skill': {
  skill: 'my-new-skill',
  triggers: ['do something', 'handle X'],
  category: 'category-name'
}
```

### Creating a New Endpoint

1. Add handler in `worker-service.ts`
2. Use Zod schema for input validation
3. Return consistent JSON shape
4. Update this `CLAUDE.md` if the endpoint is significant

### Subagent Best Practices

- Each subagent should be tied to **one primary skill**
- Use `activateSkill()` before spawning
- Store subagent state in the `activeSubagents` Map

---

## Testing Philosophy

Currently there are no automated tests. When adding new features:

1. Test manually via the TUI (`sca skills --tui`)
2. Test via curl against the running daemon
3. Verify skill activation returns full `SKILL.md` content

---

## Release Process

1. Update `CHANGELOG.md`
2. Bump version in `package.json`
3. Update `RELEASE-vX.Y.Z.md`
4. Run `npm run build`
5. Test Docker build
6. Create git tag

---

## Common Tasks

**"How do I make the agent detect a new type of task?"**
→ Add patterns to `SKILL_PATTERNS` in `skills.ts`

**"How do I add a new subagent capability?"**
→ Extend `src/subagents.ts` and add corresponding endpoints

**"How do I improve skill quality scoring?"**
→ Enhance `scoreSkill()` in `src/skill-intelligence.ts`

**"How do I support a new deployment platform?"**
→ Add instructions to `deploy/README.md`

---

This project evolves quickly. When in doubt, follow the existing patterns in `skills.ts` and `worker-service.ts`. The skills layer is the heart of the project.