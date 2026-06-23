# structured-clause-agent v0.3.0 — "Skills OS" Release

**Release Date:** June 23, 2026

This is a **major milestone release** that transforms `structured-clause-agent` from a helpful tool into a **full operating system for Claude Skills**.

---

## 🚀 Major New Features

### 1. Native Claude Code Plugin + Real-Time Skill Injection

- New `/plugin/hook` endpoint for `UserPromptSubmit` integration
- Automatic skill detection and **instant context injection**
- Plugin manifest at `/plugin/manifest`
- Example plugin code included in `plugin-example/`

**Result:** Skills now activate **silently and automatically** inside Claude Code sessions.

### 2. Subagent Orchestration Engine

- Spawn specialized subagents with dedicated skills
- Parallel execution support
- High-level orchestration endpoint
- Full subagent lifecycle management

**New Endpoints:**
- `POST /subagents/spawn`
- `POST /subagents/orchestrate`
- `GET /subagents`

### 3. Skill Intelligence 2.0

- **Quality scoring** with install counts and GitHub stars
- **Auto-update** system for installed skills
- **Skill creation assistant** — generate and save new `SKILL.md` files

**New Endpoints:**
- `GET /skills/score/:name`
- `POST /skills/update`
- `POST /skills/create`

---

## ✨ Improvements

- Expanded skill pattern detector (20+ skills)
- Full `SKILL.md` content loading and injection
- Interactive TUI (`sca skills --tui`)
- Docker + docker-compose support
- Professional deployment documentation

---

## 📦 Installation

```bash
npm install -g structured-clause-agent@0.3.0
```

Or run with Docker:

```bash
docker-compose up -d
```

---

## 🔧 New CLI Commands

```bash
sca skills --tui                    # Launch interactive TUI
sca skills --detect "your task"     # Detect + activate skill
```

---

## 🐳 Docker Support

- Official `Dockerfile`
- `docker-compose.yml` with health checks
- Deployment guide for Railway, Render, Fly.io, Kubernetes, and PM2

---

## 📁 New Files

```
Dockerfile
docker-compose.yml
deploy/README.md
plugin-example/
  ├── claude-code-plugin.ts
  └── .claude-plugin.json
RELEASE-v0.3.0.md
```

---

## 🔌 Plugin Integration (Claude Code)

Add the example plugin to your Claude Code plugins folder. Every user message is now automatically analyzed and the best skill is injected in real time.

---

## 🌟 Why This Release Matters

Before v0.3.0:
- Users had to manually run `npx skills add ...`

After v0.3.0:
- The agent **detects intent**, **installs skills**, **activates them**, and **injects them** — all automatically.

This is the closest thing to giving Claude Code its own **intelligent skills operating system**.

---

## Roadmap (v0.4.0)

- Real-time skill injection into running sessions
- Vector memory + semantic search
- Full YAML recipe engine
- Multi-agent collaboration dashboard

---

**structured-clause-agent v0.3.0** — Making Claude Code *autonomously powerful*.