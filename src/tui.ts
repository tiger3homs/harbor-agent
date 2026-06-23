import blessed from 'blessed';
import contrib from 'blessed-contrib';
import { handleUserRequest, listInstalledSkills } from './skills';

export function startTUI() {
  const screen = blessed.screen({
    smartCSR: true,
    title: 'Structured Clause Agent - Skills TUI',
    fullUnicode: true
  });

  // Grid layout
  const grid = new contrib.grid({ rows: 12, cols: 12, screen });

  // Header
  const header = grid.set(0, 0, 1, 12, blessed.box, {
    content: '{bold}⚓ Harbor — The Skills Operating System{/bold}',
    tags: true,
    style: { fg: 'cyan' }
  });

  // Task Input
  const inputBox = grid.set(1, 0, 2, 8, blessed.textbox, {
    label: ' User Request ',
    inputOnFocus: true,
    border: { type: 'line' },
    style: { border: { fg: 'green' } }
  });

  // Action Buttons
  const detectBtn = grid.set(1, 8, 1, 4, blessed.button, {
    content: 'Detect Skill',
    style: { bg: 'blue', fg: 'white' }
  });

  const activateBtn = grid.set(2, 8, 1, 4, blessed.button, {
    content: 'Auto-Activate',
    style: { bg: 'magenta', fg: 'white' }
  });

  // Detection Result
  const detectionBox = grid.set(3, 0, 4, 6, blessed.box, {
    label: ' Detection Result ',
    content: 'Waiting for input...',
    border: { type: 'line' },
    scrollable: true,
    tags: true
  });

  // Installed Skills
  const skillsBox = grid.set(3, 6, 4, 6, blessed.box, {
    label: ' Installed Skills ',
    border: { type: 'line' },
    scrollable: true,
    content: ''
  });

  // Log / Status
  const logBox = grid.set(7, 0, 4, 12, blessed.log, {
    label: ' Activity Log ',
    border: { type: 'line' },
    scrollable: true,
    style: { fg: 'gray' }
  });

  // Footer
  const footer = grid.set(11, 0, 1, 12, blessed.box, {
    content: ' [q] Quit  |  [d] Detect  |  [a] Auto-Activate  |  [r] Refresh Skills ',
    style: { fg: 'yellow' }
  });

  // Initial skills list
  function refreshSkills() {
    const skills = listInstalledSkills();
    let content = skills.length === 0 ? 'No skills installed yet.\n' : '';
    skills.forEach(s => {
      content += `{green}• ${s.name}{/} (${s.scope})\n  ${s.description}\n\n`;
    });
    skillsBox.setContent(content);
    screen.render();
  }

  refreshSkills();

  // Detect handler
  async function runDetection(task: string) {
    logBox.log(`{cyan}Detecting skill for:{/} ${task}`);
    const result = await handleUserRequest(task);

    let output = '';
    output += `{bold}Task:{/} ${result.detection.task}\n`;
    output += `{bold}Confidence:{/} ${(result.detection.confidence * 100).toFixed(0)}%\n`;
    output += `{bold}Reason:{/} ${result.detection.reason}\n\n`;

    if (result.detection.recommended_skill) {
      output += `{green}✓ Recommended Skill: ${result.detection.recommended_skill}{/}\n`;
      if (result.detection.should_install) {
        output += `{yellow}→ Will install automatically{/}\n`;
      }
    } else {
      output += `{red}No matching skill found{/}\n`;
    }

    if ('activation' in result && result.activation) {
      output += `\n{green}Activation: ${result.activation.message}{/}\n`;
    }

    detectionBox.setContent(output);
    logBox.log(`{green}Detection complete{/}`);
    screen.render();
  }

  // Button actions
  detectBtn.on('press', () => {
    const task = inputBox.getValue();
    if (task) runDetection(task);
  });

  activateBtn.on('press', async () => {
    const task = inputBox.getValue();
    if (!task) return;

    logBox.log(`{magenta}Auto-activating skill for task...{/}`);
    const result = await handleUserRequest(task);

    const activation = 'activation' in result ? result.activation : null;
    if (activation?.success && activation.content) {
      detectionBox.setContent(
        `{green}Skill activated!{/}\n\n` +
        `{bold}Content preview:{/}\n` +
        activation.content.slice(0, 800) + '...'
      );
      logBox.log(`{green}Skill ready for Claude Code{/}`);
    } else {
      logBox.log(`{red}Activation failed or no skill needed{/}`);
    }
    screen.render();
  });

  // Keyboard shortcuts
  screen.key(['q', 'C-c'], () => process.exit(0));
  screen.key(['d'], () => {
    const task = inputBox.getValue();
    if (task) runDetection(task);
  });
  screen.key(['a'], async () => {
    const task = inputBox.getValue();
    if (task) {
      const result = await handleUserRequest(task);
      const activation = 'activation' in result ? result.activation : null;
      if (activation?.content) {
        detectionBox.setContent(activation.content);
      }
    }
  });
  screen.key(['r'], refreshSkills);

  // Focus input on start
  inputBox.focus();
  screen.render();

  logBox.log('{green}TUI started. Type a task and press Detect or Auto-Activate.{/}');
}