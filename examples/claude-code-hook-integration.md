# Claude Code Hook Integration (Production Ready)

This document shows exactly how to wire `structured-clause-agent` into Claude Code so that **every user message automatically triggers skill detection and activation**.

## Architecture

```
User Message
     ↓
Claude Code (hook)
     ↓
POST /skills/detect
     ↓
[structured-clause-agent]
     ↓
1. Detect intent
2. Install skill (if needed)
3. Return SKILL.md content
     ↓
Claude Code injects skill into context
     ↓
Claude uses the skill automatically
```

## Implementation Options

### Option 1: Claude Code Plugin (Recommended when available)

Create a plugin that registers a `UserPromptSubmit` hook:

```typescript
// .claude/plugins/structured-skills/index.ts
import { registerHook } from '@anthropic/claude-code-sdk';

registerHook('UserPromptSubmit', async (prompt) => {
  const response = await fetch('http://localhost:37701/skills/detect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task: prompt })
  });

  const result = await response.json();

  if (result.skill_content) {
    // Inject the full skill into the current context
    return {
      additionalContext: result.skill_content,
      message: `Using skill: ${result.detection.recommended_skill}`
    };
  }

  return null;
});
```

### Option 2: Proxy / MCP Server (Current)

Run the daemon and expose tools to Claude Code via MCP.

### Option 3: Manual Pre-processing (Quick Start)

Before sending any user message to Claude, run:

```bash
curl -X POST http://localhost:37701/skills/detect \
  -d '{"task": "the user message here"}'
```

If `skill_content` is returned, prepend it to the system prompt.

## Full Example Flow

**User types:** "Help me write an e2e test for the new checkout flow"

**Hook fires:**

```json
POST /skills/detect
{
  "task": "Help me write an e2e test for the new checkout flow"
}
```

**Response:**

```json
{
  "detection": {
    "recommended_skill": "playwright-cli",
    "confidence": 0.9,
    "should_install": true
  },
  "activation": {
    "success": true,
    "message": "Skill \"playwright-cli\" installed and activated.",
    "content": "---\nname: playwright-cli\n..."
  },
  "skill_content": "---\nname: playwright-cli\n..."
}
```

**Claude Code now has the full `playwright-cli` skill loaded** and can immediately use browser automation.

## Automatic Activation Logic

The agent now does three things automatically:

1. **Detect** — Matches user language against 20+ skill patterns
2. **Ensure** — Runs `npx skills add ...` if the skill is missing
3. **Activate** — Loads the full `SKILL.md` and returns it for injection

This completely removes the need for users to run manual `/commands`.

## Testing the Integration

```bash
# Start daemon
sca start

# In another terminal, simulate a hook call
curl -X POST http://localhost:37701/skills/detect \
  -H "Content-Type: application/json" \
  -d '{"task": "I need to generate API documentation for my routes"}'
```

You should see the `api-docs-generator` skill returned.

## Future Enhancements

- Real-time skill injection into running Claude sessions
- Skill usage analytics
- Quality scoring before recommending skills
- Multi-skill composition (e.g., `playwright-cli` + `typescript-strict`)