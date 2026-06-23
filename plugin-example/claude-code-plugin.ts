/**
 * Example Claude Code Plugin
 * structured-clause-agent v0.3.0
 * 
 * Place this in your Claude Code plugins directory
 */

import { registerHook } from '@anthropic/claude-code-sdk';
import fetch from 'node-fetch';

const AGENT_URL = process.env.STRUCTURED_AGENT_URL || 'http://localhost:37701';

registerHook('UserPromptSubmit', async (context) => {
  const userMessage = context.message || context.prompt;

  if (!userMessage) return null;

  try {
    const response = await fetch(`${AGENT_URL}/plugin/hook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'UserPromptSubmit',
        data: { message: userMessage },
        session_id: context.sessionId
      })
    });

    const result = await response.json();

    if (result.inject_context) {
      return {
        additionalContext: result.inject_context,
        message: result.message || 'Skill activated'
      };
    }

    return null;
  } catch (err) {
    console.warn('[structured-clause-agent] Hook failed:', err);
    return null;
  }
});

registerHook('SessionStart', async () => {
  console.log('[structured-clause-agent] Skills intelligence connected');
  return null;
});

export const manifest = {
  name: "structured-clause-agent",
  version: "0.3.0",
  description: "Automatic skill detection and injection",
  hooks: ["UserPromptSubmit", "SessionStart"]
};