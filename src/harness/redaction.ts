import { execSync } from 'child_process';

/**
 * Ruflo-inspired Redaction Hook
 * Automatically redacts API keys and secrets from observations and logs
 */

const SENSITIVE_PATTERNS = [
  /sk-[a-zA-Z0-9]{20,}/g,                    // Anthropic keys
  /sk-[a-zA-Z0-9]{32,}/g,                    // OpenAI-style
  /AIza[0-9A-Za-z\-_]{35}/g,                 // Google/Gemini
  /Bearer\s+[A-Za-z0-9\-._~+/]+=*/g,         // Bearer tokens
  /ghp_[A-Za-z0-9]{36}/g,                    // GitHub PAT
  /-----BEGIN (RSA|EC|DSA|OPENSSH) PRIVATE KEY-----[\s\S]*?-----END \1 PRIVATE KEY-----/g
];

export function redactSensitiveData(text: string): string {
  let redacted = text;

  for (const pattern of SENSITIVE_PATTERNS) {
    redacted = redacted.replace(pattern, '[REDACTED]');
  }

  return redacted;
}

export function createRedactionHook() {
  return {
    name: 'redaction-hook',
    description: 'Automatically redacts API keys and secrets before storage',
    execute: (content: string) => {
      return redactSensitiveData(content);
    }
  };
}

/**
 * Self-healing swarm check (inspired by Ruflo)
 */
export function checkSwarmHealth(subagentCount: number, maxAllowed = 12): {
  healthy: boolean;
  message: string;
} {
  if (subagentCount > maxAllowed) {
    return {
      healthy: false,
      message: `Swarm unhealthy: ${subagentCount} subagents exceeds limit of ${maxAllowed}`
    };
  }
  return {
    healthy: true,
    message: `Swarm healthy (${subagentCount}/${maxAllowed} subagents)`
  };
}