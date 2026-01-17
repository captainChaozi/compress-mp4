# UI Design System: Offline MP4 Compressor

## 1. Design Thinking

- **Purpose**: A professional, offline-first video compression tool. It must feel like a precision instrument—reliable, fast, and private.
- **Tone**: **Industrial-Utilitarian (Refined)**.
  - Think: Braun electronics, terminal interfaces, high-end mechanical tools.
  - Keywords: Precision, Monochromatic, Raw, Functional.
- **Constraints**:
  - **Accessibility**: High contrast controls. Visible focus states (`focus-visible:ring`).
  - **Performance**: Lightweight UI. No layout thrashing.
- **Signature**:
  - **Visual**: "Technical Grid". Subtle background grid patterns. Monospaced data displays.
  - **Motion**: "Mechanical" transitions. Immediate response.

## 2. Aesthetic Rules

### Typography

- **Headings**: `Geist Sans` (or system-ui). Bold (700+), tracking-tight. Title Case.
- **Body**: `Geist Sans`. Readability first.
- **Data/Technical**: `Geist Mono` (or ui-monospace). ALL numerical data, status logs, and technical labels.
- **Hierarchy**:
  - `h1`: 2.5rem, Heavy, tracking-tighter.
  - `h2`: 1.75rem, Semibold, tracking-tight.
  - `label`: 0.875rem, Medium, Uppercase tracking-wider.

### Color Palette (Tailwind + CSS Vars)

- **Base**: `Zinc` (Neutral).
  - Background: White / Zinc-950 (Dark).
  - Surface: Zinc-50 / Zinc-900.
  - Border: Zinc-200 / Zinc-800.
- **Accent**: **International Orange** (High visibility).
  - Primary: `orange-600` (Dark: `orange-500`).
  - Focus Ring: `orange-500` (with offset).
- **Status**:
  - Success: `emerald-600`.
  - Error: `red-600`.
  - Warning: `amber-500`.

### Layout & Spacing

- **Container**: Max width `4xl`. Concentrated workspace.
- **Grid**: Subtle dot (`bg-dot`) or grid (`bg-grid`) pattern.
- **Spacing**: `gap-6` or `gap-8`. Loose but structured.

### Components

- **Buttons**: Sharp borders (`rounded-[4px]`). "Pressable" feel. Hover states increase contrast.
- **Inputs**: Heavy borders (`border-2` on focus). `autocomplete="off"` for non-auth.
- **Cards**: Minimal borders. Internal dividers. "Technical specification card" look.
- **Focus**: Never `outline-none`. Use `ring-2 ring-offset-2 ring-orange-500`.

## 3. Web Interface Guidelines Compliance

- **Focus**: All interactive elements must have visible focus.
- **Forms**: Labels must be clickable. Inputs need meaningful `name`.
- **Animation**: `prefers-reduced-motion` respected. Transform/Opacity only.
- **Content**: Handle long filenames with truncation (`truncate`).
- **Mobile**: `touch-action: manipulation`. `min-h-[44px]` touch targets.

## 4. Component Checklist

1.  **Header**: Technical, monospaced logo.
2.  **Hero/Tool**: The main compressor interface.
3.  **Features**: Grid layout, icons, concise copy.
4.  **FAQ**: Accordion style.
5.  **Footer**: Simple, legal/links, monospaced.
