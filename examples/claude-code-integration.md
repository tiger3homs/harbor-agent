# Claude Code Integration Guide (Preview)

This document describes how `structured-clause-agent` will integrate natively with Claude Code once the plugin system matures.

## Planned Hook Points

- `Setup`
- `SessionStart`
- `UserPromptSubmit`
- `PreToolUse`
- `PostToolUse`
- `Stop`

Each hook will automatically:
1. Send data to the worker daemon
2. Apply compression
3. Store in memory
4. Return compressed context when needed

## Current Workaround (via MCP / Proxy)

Until native support, you can:

1. Run the daemon
2. Use the exposed MCP tools (`memory_search`, `compress_context`, `retrieve_original`)
3. Call them from Claude Code via the MCP server mode (future)

## Slash Commands (Roadmap)

Once integrated, these will be available inside Claude Code:

- `/plan "task description"`
- `/act`
- `/caveman [off|lite|full|ultra]`
- `/recipe run add-tests`
- `/memory search "previous migration"`

## Stay Tuned

Follow the repo for the official Claude Code plugin release.