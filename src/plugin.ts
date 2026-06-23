import { handleUserRequest, loadSkillContent } from './skills';

export interface HookPayload {
  type: 'UserPromptSubmit' | 'PreToolUse' | 'PostToolUse' | 'SessionStart';
  data: any;
  session_id?: string;
}

export interface HookResponse {
  inject_context?: string;
  additional_system?: string;
  message?: string;
  skill_activated?: string;
}

/**
 * Native Claude Code Plugin Hook Handler
 * This is the core of Feature #1: Real-time skill injection
 */
export async function handleClaudeCodeHook(payload: HookPayload): Promise<HookResponse> {
  if (payload.type === 'UserPromptSubmit') {
    const userMessage = payload.data?.message || payload.data?.prompt || '';

    if (!userMessage) return { message: 'No message to process' };

    const result = await handleUserRequest(userMessage);

    const skillContent = 'skill_content' in result ? result.skill_content : undefined;
    if (skillContent) {
      return {
        inject_context: skillContent,
        message: `Skill activated: ${result.detection.recommended_skill}`,
        skill_activated: result.detection.recommended_skill
      };
    }

    return {
      message: result.recommendation || 'No skill needed'
    };
  }

  if (payload.type === 'SessionStart') {
    // On new session, we could preload high-value skills
    return {
      message: 'Session started. Skills intelligence ready.'
    };
  }

  return { message: 'Hook processed (no action)' };
}

/**
 * Generates the plugin manifest for Claude Code
 */
export function generatePluginManifest() {
  return {
    name: "harbor",
    version: "0.3.0",
    description: "Intelligent skill detection, installation, and injection for Claude Code",
    author: "Structured Clause Agent",
    hooks: [
      "UserPromptSubmit",
      "SessionStart"
    ],
    capabilities: [
      "skill-detection",
      "automatic-installation",
      "context-injection"
    ],
    endpoints: {
      detect: "/skills/detect",
      hook: "/plugin/hook"
    }
  };
}