# .harness — Meta-Harness Configuration

This directory contains security, governance, and swarm coordination configuration for **structured-clause-agent**.

## Files

- `manifest.json` — Security fingerprint manifest
- `mcp-policy.json` — MCP governance and redaction rules

## Concepts Borrowed from Ruflo

- **Meta-harness**: A higher-level coordination layer over agents and skills
- **Manifest fingerprinting**: Cryptographic integrity checking of critical files
- **MCP Policy**: Governance rules for tool usage and data handling
- **Swarm coordination**: Limits and consensus modes for subagents

## Usage

The harness is automatically loaded when the daemon starts. It enforces:

- Redaction of sensitive data
- Subagent limits
- Skill source verification

## Extending

To add new governance rules, edit `mcp-policy.json` and restart the daemon.