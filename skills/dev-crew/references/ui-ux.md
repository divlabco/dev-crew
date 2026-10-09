# UI/UX defaults

Use these when the user hasn't specified a design. Aim for friendly, modern and engaging. Ask the user only if a specific brand matters.

## Order of work
1. **One Builder task creates the design system** before any page is styled:
   - **Tokens:** color, radius, shadow, spacing, type scale, light and dark modes.
   - **Components:** button, card, badge, input, empty state, page header, stat.
   - **Documentation:** `docs/ui-components.md`, listing each component's name and props, so later agents reuse them.
2. **Pages are styled after that,** in parallel by disjoint page sets, reusing the components.

## Look and feel
- One confident primary color, one accent, calm neutrals.
- Rounded corners, soft shadows, generous whitespace.
- A readable font that supports the user's language and script.
- Clear hierarchy, with one primary action per screen.

## Responsive
- Start mobile-first and grow at breakpoints.
- Make tap targets at least 44px.
- A view meant for one device (projector, desktop) must still work at phone width. Collapse columns and scale the type.
- Wrap long text and non-Latin scripts at word boundaries. Never use `break-all`. Step the font size down as labels get longer.
- Give fixed-width side columns (counts, icons) `shrink-0` so they never squeeze the main text.

## States
- Every screen has loading, empty (with a call to action), error (with a recovery path), success and disabled states.
- Give feedback within about 100ms of every action.

## Motion
- Use short transitions, about 150–300ms.
- Add a few moments of delight: count-ups, reorders, celebrations.
- Always respect `prefers-reduced-motion`.
- Protect animated or timed regions from framework re-renders, for example with `wire:ignore` or keyed components.

## Accessibility
- WCAG AA contrast, visible focus, and proper labels.
- `aria-live` on status changes.
- Never rely on color alone. Pair it with an icon, shape or text.

## Identity
- Never copy another product's UI, colors, sounds or illustrations.
- Generate sounds procedurally or use properly licensed assets.

## Verify by eye
- Open each page at about 375px, 768px and 1280px.
- Check overflow, wrapping, dark mode and every state.
- Screenshot anything doubtful.
- If you can't view it, say so in the report.
