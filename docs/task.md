---
status: todo
---

# UI Redesign Plan: Industrial-Utilitarian x Vercel Guidelines

Goal: Redesign the application to match the "Industrial-Utilitarian" aesthetic defined in `docs/ui.md` while adhering to the Vercel Web Interface Guidelines.

## 1. Global Styles (`app/globals.css`)

- [ ] **Radius**: Update `--radius` to `0.3rem` for a sharper, more technical look.
- [ ] **Background**: Add a CSS utility for a subtle "Technical Grid" background pattern (dots or graph lines).
- [ ] **Typography**: Ensure `text-wrap: balance` utility is available (standard in Tailwind now, but good to check layout).

## 2. Component Redesign (`components/video-compressor.tsx`)

- [ ] **Header**:
  - Use `text-balance` for headings.
  - Stronger tracking (`tracking-tighter`).
  - Monospaced subtitles.
- [ ] **Upload Area (Idle State)**:
  - Replace rounded dashed border with a more technical "Drop Zone".
  - Use "slashed" backgrounds or technical markers (corners).
- [ ] **Dashboard (Ready/Success State)**:
  - layout data in a grid.
  - Use `Geist Mono` for all numbers (Size, Duration, Ratio).
  - Status indicators (dots/badges) should look like LEDs or hardware lights.
- [ ] **Controls**:
  - **Slider**: Make the track thicker/industrial.
  - **Buttons**: conform to new radius. High contrast hover states. Use `orange-600` for primary.
  - **Inputs**: Heavy borders on focus (`ring-2 ring-orange-600/20`).
- [ ] **Progress State**:
  - Replace circular loader with a "Loading Bar" or a data-stream readout style.
  - Show detailed metrics (Bitrate, Time Remaining) in Mono font.
- [ ] **Vercel Guidelines Compliance**:
  - **Focus**: Ensure standard `ring` classes are present for all interactables.
  - **Animation**: `animate-in fade-in zoom-in-95` for smooth entry.
  - **Loading**: Ensure buttons have loading states (spinner or opacity) when processing.
  - **Images/Video**: Ensure aspect ratios are handled to prevent CLS.
- [ ] **Feedback**: Use "Toast" or clear inline alerts for errors/success.

## 3. Polish

- [ ] Verify Dark Mode contrast.
- [ ] Ensure "International Orange" is used effectively as the accent.
