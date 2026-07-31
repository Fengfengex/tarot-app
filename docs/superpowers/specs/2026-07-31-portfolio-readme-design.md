# Portfolio README Design

## Goal

Turn the repository README into a concise, English-language project showcase for recruiters and GitHub visitors. The page should communicate the product experience within seconds, then provide enough technical detail to demonstrate frontend, 3D graphics, and computer-vision integration skills.

## Audience

- Recruiters and hiring managers scanning portfolio links
- Frontend engineers evaluating implementation depth
- Developers who want to run the project locally

## Content Strategy

Use a portfolio-first narrative:

1. Open with the project name, a one-sentence value proposition, and compact technology badges.
2. Show the three supplied screenshots as a chronological experience: initial deck, gesture-driven draw, and revealed result.
3. Summarize the strongest product capabilities in a short feature list.
4. Explain the gesture interaction flow using the exact controls implemented by the application: open hand to hover, pinch to grab, and fist to confirm.
5. Highlight engineering decisions: Three.js rendering and raycasting, MediaPipe landmark-based gesture classification, mouse fallback, card state management, upright/reversed outcomes, particles, and draw history.
6. Provide an accurate stack, setup instructions, usage notes, and repository structure.

## Visual Design

- Use `docs/main.png` as the wide hero image.
- Place `docs/mid-card.png` and `docs/result.png` side by side in an HTML table so the interaction and outcome can be compared without excessive scrolling.
- Use only lightweight GitHub-compatible HTML and Markdown.
- Keep badges limited to technologies that are verifiably present in the repository.

## Repository Links

The canonical repository is:

`https://github.com/Fengfengex/tarot-app`

The clone command must use:

`git clone https://github.com/Fengfengex/tarot-app.git`

No live-demo link will be shown because the repository does not currently provide a verified deployment URL.

## Accuracy Boundaries

- Describe the application as a browser-based interactive tarot experience, not as a production service.
- Do not claim trained custom models, backend services, automated tests, mobile support, or deployment infrastructure.
- Do not claim a license file exists unless one is present in the repository.
- Mention that camera access generally requires localhost or HTTPS and that mouse mode is available as a fallback.

## Success Criteria

- All copy is in polished English.
- All three screenshots render from relative repository paths.
- The clone URL points to `Fengfengex/tarot-app`.
- Features and controls match the current implementation.
- Setup instructions can be followed from a fresh clone.
- The README is easy to scan and suitable for linking from a résumé.
