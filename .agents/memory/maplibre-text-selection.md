---
name: text selection "bug" in the Tajikistan map app
description: Reports that text can't be selected/copied are almost always a testing-surface artifact, not an app bug — selection actually works
---

# Text selection in this app actually works — verify before "fixing"

## Conclusion (verified with a real headless browser + real mouse drags)
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
