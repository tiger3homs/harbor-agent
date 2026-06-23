# Harbor Brand Guidelines

**Harbor** — The Skills Operating System for Claude Code

---

## Brand Essence

- **Core Idea**: A safe harbor for agents — a secure, intelligent home where skills and subagents coordinate.
- **Personality**: Professional • Trustworthy • Intelligent • Modern
- **Visual Metaphor**: Anchor (stability + harbor) + Swarm nodes (intelligence + coordination)

---

## Primary Logo Concepts (SVG Recommended)

### 1. Primary Logo (with text)

```svg
<!-- Recommended SVG version -->
<svg width="240" height="80" viewBox="0 0 240 80" xmlns="http://www.w3.org/2000/svg">
  <!-- Anchor + Swarm -->
  <g fill="none" stroke="#00D4FF" stroke-width="3">
    <!-- Anchor ring -->
    <circle cx="32" cy="32" r="14"/>
    <!-- Anchor shaft -->
    <line x1="32" y1="18" x2="32" y2="52"/>
    <!-- Anchor arms -->
    <path d="M20 46 Q32 56 44 46"/>
    <!-- Swarm nodes -->
    <circle cx="52" cy="22" r="3" fill="#00D4FF"/>
    <circle cx="58" cy="38" r="3" fill="#00D4FF"/>
    <circle cx="48" cy="48" r="3" fill="#00D4FF"/>
    <!-- Connection lines -->
    <line x1="46" y1="28" x2="52" y2="22" stroke-opacity="0.6"/>
    <line x1="46" y1="38" x2="58" y2="38" stroke-opacity="0.6"/>
    <line x1="46" y1="46" x2="48" y2="48" stroke-opacity="0.6"/>
  </g>
  
  <!-- Text -->
  <text x="78" y="42" font-family="system-ui, -apple-system, sans-serif" 
        font-size="32" font-weight="700" fill="#0A2540">Harbor</text>
</svg>
```

### 2. Icon Only (Favicon / Small sizes)

```svg
<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <circle cx="32" cy="32" r="18" fill="none" stroke="#00D4FF" stroke-width="4"/>
  <line x1="32" y1="14" x2="32" y2="50" stroke="#00D4FF" stroke-width="4"/>
  <path d="M18 44 Q32 56 46 44" fill="none" stroke="#00D4FF" stroke-width="4"/>
  <!-- Swarm dots -->
  <circle cx="48" cy="20" r="4" fill="#00D4FF"/>
  <circle cx="55" cy="36" r="4" fill="#00D4FF"/>
  <circle cx="46" cy="48" r="4" fill="#00D4FF"/>
</svg>
```

---

## Color Palette

| Usage              | Color Name       | Hex       | RGB                  |
|--------------------|------------------|-----------|----------------------|
| Primary Navy       | Deep Harbor      | `#0A2540` | rgb(10, 37, 64)      |
| Accent Teal        | Electric Swarm   | `#00D4FF` | rgb(0, 212, 255)     |
| Text (Light)       | White            | `#FFFFFF` | rgb(255, 255, 255)   |
| Background Dark    | GitHub Dark      | `#0D1117` | rgb(13, 17, 23)      |
| Muted Gray         | Subtle           | `#8B949E` | rgb(139, 148, 158)   |

---

## Typography

- **Primary**: System UI / Inter / SF Pro (sans-serif)
- **Weights**: 700 (Bold) for logo, 600 for headings, 400 for body
- **Logo Text**: Use system bold or Inter Bold

---

## Usage Recommendations

### Do's
- Always use the **anchor + swarm** combination
- Maintain good contrast
- Use the teal accent on dark backgrounds
- Keep the swarm nodes visible (they represent the core value)

### Don'ts
- Don't stretch or distort the anchor
- Don't use low-contrast colors
- Don't remove the swarm nodes
- Don't use the old "structured-clause-agent" name

---

## Asset Files (Recommended)

Create these manually or with a designer:

1. `harbor-logo-primary.svg` (main logo)
2. `harbor-icon.svg` (icon only)
3. `harbor-logo-dark.svg` (dark mode)
4. `harbor-social-cover.png` (1280×640 for GitHub/Twitter)
5. `harbor-favicon.ico` (multiple sizes)

---

## GitHub & npm Presentation

- **Repository description** (already set):
  > Harbor — The Skills Operating System for Claude Code. Automatic skill detection, subagent swarms, meta-harness security, and 90%+ token reduction.

- **Topics** (add these on GitHub):
  ```
  claude-code, ai-agent, skills, subagents, meta-harness, token-efficiency, claude, swarm-intelligence, ruflo
  ```

---

## Suggested Next Steps

1. Create the SVG logos above (copy into `.svg` files)
2. Generate PNG versions at 2x and 3x resolution
3. Add the logo to `README.md` at the top
4. Upload assets to a `branding/` folder in the repo
5. Use the dark version in terminal/TUI screenshots

---

**Harbor** now has a strong, professional, and memorable brand identity.