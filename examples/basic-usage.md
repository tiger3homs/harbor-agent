# Basic Usage Examples

## Starting the Daemon

```bash
# Global install
npm install -g structured-clause-agent

# Start daemon
sca start --port 37701
```

## Using with Claude Code (Manual Hook)

Until native plugin support lands, you can use the HTTP API directly.

### 1. Start a Session

```bash
curl -X POST http://localhost:37701/session/start \
  -H "Content-Type: application/json" \
  -d '{"project_path": "/Users/you/my-project"}'
```

### 2. Capture a Tool Observation (with compression)

```bash
curl -X POST http://localhost:37701/observation \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "sess_...",
    "type": "tool_use",
    "tool": "read",
    "content": "function hello() { return \"world\"; }",
    "metadata": { "file": "src/index.ts" }
  }'
```

Response includes compression stats and `ccr_key`.

### 3. Memory Search

```bash
curl "http://localhost:37701/memory/search?q=migration&limit=5"
```

### 4. Retrieve Original via CCR

```bash
curl http://localhost:37701/ccr/ccr_abc123
```

## Configuration

Create `.structured-clause-agent.json` in your project root.

See the main README for full config options.