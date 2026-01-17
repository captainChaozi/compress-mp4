·# UI Design System: Offline MP4 Compressor

## 1. Design Thinking

- **Purpose**: A professional, offline-first video compression tool. It must feel like a precision instrument—reliable, fast, and private.
- **Tone**: **Industrial-Utilitarian (Refined)**.
  - Think: Braun electronics, terminal interfaces, high-end mechanical tools.
  - Keywords: Precision, Monochromatic, Raw, Functional.
- **Constraints**:
  - **Accessibility**: High contrast controls.
  - **Performance**: Lightweight UI to leave main thread for FFmpeg messages.
- **Differentiation (Signature)**:
  - **Visual**: "Technical Grid". Subtle background grid patterns and monospaced data displays.
  - **Motion**: "Mechanical" transitions. Staggered reveal of data cards. Progress bars that look like hardware status indicators.

## 2. Aesthetic Rules

### Typography

- **Headings**: `Geist Sans` (or system-ui if not avail). Bold, tracking-tight.
- **Body**: `Geist Sans`. Readability first.
- **Data/Numbers**: `Geist Mono` (or ui-monospace). ALL numerical data (sizes, ratio, time) must be monospaced.
- **Hierarchy**:
  - `h1`: 2.25rem, Heavy (700+), tracking-tighter.
  - `h2`: 1.5rem, Semibold (600), tracking-tight.
  - `label`: 0.875rem, Medium (500), Uppercase tracking-wider (Technical feel).

### Color Palette (Tailwind + CSS Vars)

- **Base**: `Zinc` (Neutral).
  - Background: White / Zinc-950 (Dark).
  - Surface: Zinc-50 / Zinc-900.
  - Border: Zinc-200 / Zinc-800.
- **Accent**: **International Orange** (High visibility, functional).
  - Primary: `orange-600` (Dark mode: `orange-500`).
  - Used for: Primary actions (Compress), Active states, Progress bars.
- **Status**:
  - Success: `emerald-600`.
  - Error: `red-600`.

### Layout & Spacing

- **Container**: Max width `3xl` (concentrated workspace).
- **Grid**: Use a subtle dot or line pattern background to reinforce the "Tool" vibe.
- **Spacing**: Loose density (relaxed) to prevent clutter. `gap-6` or `gap-8` for major sections.

### Components

- **Buttons**: Sharp or small radius (`rounded-md`). No pill shapes (too friendly).
- **Inputs**: Heavy borders (`border-2` on focus).
- **Cards**: Minimal borders, internal division lines.

## 3. Global CSS Variables (Proposed Updates)

- Adjust `radius` to `0.3rem` (somewhat sharp).
- Inject `Geist` fonts if possible, or stack: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto`.

## 4. Component Checklist

1.  **Hero/Upload**: Dashed border area, "Drop Zone" technical look.
2.  **Dashboard**: Stats row (Input | Ratio | Output) using Mono font.
3.  **Controls**: Slider (custom thick track), Preset Buttons (segmented control style).
4.  **Preview**: Side-by-side or Toggle with clear labels.
