---
name: maplibre breaks text selection app-wide
description: Why inputs/text become unselectable after interacting with the map, and the only fix that works
---

# maplibre-gl leaks `user-select: none` onto `<html>`

## Symptom
After clicking a marker or interacting with the MapLibre map, text in form
fields (admin edit dialog inputs/textarea) and elsewhere can no longer be
selected/copied/deleted. Typing still works; only selection is blocked.

## Root cause
maplibre-gl's `DOM.disableDrag()` sets `document.documentElement.style[selectProp] = "none"`
(i.e. inline `user-select: none` on `<html>`) at drag start and restores it in
`enableDrag()` on mouseup. When a drag is interrupted — e.g. clicking a marker
opens a Radix Dialog so the mouseup never reaches the map — `enableDrag()` never
fires and `<html>` stays stuck with inline `user-select: none`. That value is
inherited everywhere.

## Why the obvious fix fails
A plain stylesheet rule like `input { user-select: text }` does NOT fix it for
the root element, because an **inline** style beats a normal (non-important)
stylesheet rule. The fix MUST use `!important` to win against the inline style.

**The rule lives in `client/src/index.css` @layer base:** `html, body { user-select: auto !important }`
plus `input,textarea,select,[contenteditable] { user-select: text !important }`.

## Why this is safe
maplibre's body-level disableDrag is redundant with its own scoped
`.maplibregl-canvas-container.maplibregl-interactive { user-select: none }` on the
`<canvas>` (which has no selectable text), so forcing html/body selectable does
not cause text to be selected while panning the map in practice.
