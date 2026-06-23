# Changelog

All notable changes to this project will be documented in this file.

## [0.3.0] - 2026-06-23

### Added — "Skills OS" Release
- **Native Claude Code Plugin** (`/plugin/hook`, `/plugin/manifest`)
  - Real-time skill detection and context injection via `UserPromptSubmit`
  - Example plugin in `plugin-example/`
- **Subagent Orchestration Engine**
  - `POST /subagents/spawn`, `/subagents/orchestrate`
  - Parallel specialized agents with dedicated skills
- **Skill Intelligence 2.0**
  - Quality scoring (`/skills/score/:name`)
  - Auto-update system (`/skills/update`)
  - Skill creation assistant (`/skills/create`)
- **Docker Support**
  - Official `Dockerfile` + `docker-compose.yml`
  - Deployment guide for Railway, Render, Fly.io, K8s, PM2
- **Interactive TUI** (`sca skills --tui`)
- Expanded skill detector (20+ patterns)
- Full `SKILL.md` content loading and injection

### Changed
- Version bumped to 0.3.0
- Major architectural expansion around skills intelligence
- Updated README with new capabilities

## [0.2.0] - 2026-06-23

### Added
- Full CLI with `sca start`, `sca init`, `sca status`, `sca compress`
- Worker daemon with Express + SQLite + FTS5
- Headroom-style compression (JSON, Code, Text)
- Caveman-style tool budgets and sanitization
- CCR (Content-Compressed Retrieval) reversible compression
- Layered memory retrieval (`search` → `timeline` → `get`)
- Session and observation persistence
- `.structured-clause-agent.json` configuration support
- Professional GitHub-ready structure (LICENSE, CONTRIBUTING, .gitignore, etc.)

### Changed
- Upgraded to v0.2.0 with improved package metadata
- Better separation of concerns between CLI and daemon

## [0.1.0] - Initial Release

- Core daemon and compression engine
- Basic observation capture and memory endpoints
- MVP implementation of the unified agent concept