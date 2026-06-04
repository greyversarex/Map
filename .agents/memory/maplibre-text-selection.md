---
name: text selection "bug" in the Tajikistan map app
description: "Can't select text" was an invisible selection-highlight color, not blocked selection. Root cause + how it was confirmed.
---

# ROOT CAUSE: the selection highlight was invisible (not blocked selection)

`client/src/index.css` had `body { @apply ... selection:bg-primary/20 }`, which
emits a global `::selection { background-color: hsl(var(--primary)/.2) }`. But
`--primary: 210 40% 98%` is **near-white**, so at 20% opacity the highlight was
invisible on the light dialogs/forms (and barely visible elsewhere). Text WAS
being selected the whole time — users just saw no highlight and reported "can't
select / copy / delete." Same CSS shipped to production, so it failed there too.

**Fix:** removed `selection:bg-primary/20` from `body` and added an explicit
visible rule in `@layer base`:
`::selection { background-color: hsl(212 95% 55% / 0.55) !important; color: inherit !important }`
(plus `::-moz-selection`). Then rebuild and sync into `production-build/`.

**Lesson:** for "can't select text" reports, check the `::selection` highlight
COLOR/opacity first (esp. Tailwind `selection:bg-*` variants tied to theme vars
like --primary), not just `user-select`. Verify whether `getSelection()`
actually returns text — if it does, the problem is visibility, not selection.

## Earlier conclusion (still valid context, verified with headless browser + real mouse drags)
Text IS selectable everywhere in the running dev app: the map detail popup
(`<p>` description) and admin form fields like "Описание" (textarea).
Verified via Chromium + puppeteer hitting the real dev URL: diagonal drag selects
full text, double-click selects a word, triple-click selects the paragraph,
textarea drag/dbl-click select text. `user-select` computes to `auto`/`text`
on every element and its whole ancestor chain. Nothing in JS prevents it:
no `preventDefault` on any event during the drag, no `selectstart` prevention,
no `removeAllRanges`/`collapse`/`setPosition`, no pointer capture, no DOM
mutation/re-render of the text node.

## Why users still report it as broken — two real causes (NOT the code)
1. **Stale production build on Timeweb.** The repo commits a prebuilt client in
   `production-build/` (git-tracked, 4 files). The live site serves that until
   you rebuild + push to GitHub + redeploy. Source/dev fixes never show up live
   until then. (`npm run build` outputs to `dist/public`; sync that into
   `production-build/` before pushing.)
2. **Testing inside the Canvas iframe embed.** When the app is embedded as a
   tldraw canvas shape, the canvas intercepts mouse drags (pan/select), so text
   selection inside the embedded iframe feels broken. That's the canvas tool,
   not the site. Test in a real separate browser tab instead.

## Trap that wasted a lot of time (test-methodology artifact)
A purely **horizontal** drag through the **vertical middle** of a *multi-line
wrapping* `<p>` lands in the gap between lines and produces an EMPTY selection,
which looks exactly like "selection is blocked." It is not. Use a diagonal drag
(top-left → bottom-right) or per-line horizontal drag, or double/triple-click,
to test wrapped text. Short single-line elements never show this artifact.

**How to apply:** Before changing CSS/JS for a "can't select text" report,
reproduce with a real browser drag (diagonal/word/paragraph), and confirm WHERE
the user tested (live Timeweb vs canvas embed vs real browser tab).

## Note on the earlier `user-select: ... !important` CSS
`client/src/index.css` @layer base has `html,body{user-select:auto!important}` and
`input,textarea,select,[contenteditable]{user-select:text!important}`. It is
harmless/defensive (guards against maplibre's `disableDrag` leaving inline
`user-select:none` on `<html>` if a drag is interrupted), but it was NOT the
actual fix for the user's complaint — selection already worked without relying on it.

## Tooling note
A headless browser is available for this kind of verification: nix `chromium`
(installed; binary under `/nix/store/*-chromium-*/bin/chromium`) + puppeteer.
Launch with `--no-sandbox`. This is the fastest way to settle "is selection
really blocked" questions instead of reasoning in circles.
