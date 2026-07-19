# Open-book landing and page-turn transition

## Product decision

The selected landing is the second Product Design variation: a single open-book spread. The left page introduces Nabi Markdown and its learning loop. The right page is a five-row chapter index. There is no separate Start button: choosing a level starts that level.

## Landing contract

- Preserve Nabi Markdown's butterfly wordmark, Source Serif typography, monochrome ink, and off-white paper surface.
- Keep the landing within one viewport at 1440 x 1024 and allow the level index to scroll on compact-height screens.
- Present the learning loop as `Brief -> Write source -> Inspect render -> Prove again`.
- Render all five existing curriculum labels from `entryChoices`; do not duplicate curriculum data in presentation code.
- Make each entire chapter row a native button with visible hover, focus, and pressed states.
- Support keyboard-only entry. The native level rows follow normal document tab order, and Enter or Space triggers the same transition as pointer input.

## Transition contract

1. A selected row receives immediate pressed feedback.
2. A dedicated page-turn sound starts from the same trusted user gesture.
3. The right-hand landing page rotates from right to left around the center fold.
4. The practice screen is already mounted underneath and receives the turning page with a short reveal and settle.
5. The editor receives focus through the existing session behavior after the transition completes.

The full transition lasts 720 ms. Route state starts immediately so practice content can render below the page, but an inert transition layer prevents accidental interaction until the page clears.

## Motion and accessibility

- Use transform and opacity only during the page transition to avoid layout thrashing.
- Use perspective and `transform-origin: left center` for the turning leaf.
- Hide mirrored back-face text and retain a light paper shadow around the turning leaf.
- Under `prefers-reduced-motion: reduce`, remove the 3D turn and use a 120 ms crossfade.
- Mark the visual transition layer `aria-hidden`, and keep the newly mounted
  practice page `inert` until it becomes the accessible destination.
- Disable all copied level rows once transition begins to prevent duplicate starts.

## Sound contract

- Use the short real paper-turn recording supplied by the product owner at
  `src/sound/nabi-page-turn.mp3`, not a synthesized tone or substitute asset.
- Play it through its own audio element so it cannot interrupt verdict or summary sounds.
- Share the existing `nabimd.sound-muted` preference. A muted user hears no page turn.
- Playback rejection remains non-fatal.

## Responsive behavior

- At desktop widths the surface reads as two equal pages with a center fold.
- Below 760 px the pages stack vertically and the physical page-turn effect becomes a restrained crossfade/slide, avoiding illegible 3D perspective.
- The practice screen remains unchanged after the handoff.

## Acceptance criteria

- Every level starts directly from its row with no second CTA.
- The page-turn sound and animation begin from the same click or key activation.
- The new practice screen is visible beneath the turning page and becomes interactive after the transition.
- Rapid repeated activation cannot start multiple sessions.
- Reduced-motion users get a non-3D transition.
- Existing learning, scoring, sound, and completion tests remain green.
