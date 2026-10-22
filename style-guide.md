# Front-end style guide

Design tokens live at the top of `style.css` as custom properties. Change a
value there and it propagates everywhere.

## Layout

* Container: `min(100% - 32px, 1200px)`, centred.
* Breakpoints: `560px`, `600px`, `860px`, `900px`.
* Pack grid: 2 columns on phones, 3 from `600px` up.
* Card radius `22px`, buttons `9–12px`, pills `999px`.
* Spacing scale: 8 / 12 / 16 / 24 / 32 / 48 / 64.

## Colours

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0a0608` | page background |
| `--bg-2` | `#120b0f` | footer / secondary surface |
| `--surface` | `rgba(255,255,255,.045)` | glass panels |
| `--surface-2` | `rgba(255,255,255,.075)` | raised panels, icon chips |
| `--line` | `rgba(255,255,255,.10)` | hairlines |
| `--line-strong` | `rgba(255,255,255,.18)` | emphasis borders |
| `--ink` | `#f6f1f3` | primary text |
| `--ink-2` | `rgba(246,241,243,.72)` | secondary text |
| `--ink-3` | `rgba(246,241,243,.58)` | tertiary text (never below .55 — contrast) |
| `--brand` | `#ff3b4e` | primary CTA, logo accent |
| `--brand-2` | `#ff6b3d` | gradient partner |
| `--gold` | `#f5c451` | highlights, icons, trust marks |
| `--ok` | `#2fbf71` | success, savings, "added" state |
| `--top` | `#ff9f43` | Top Picks vault accent |
| `--premium` | `#a855f7` | Premium Vault vault accent |
| `--series` | `#ff4d6d` | Signature Series vault accent |

## Typography

* Display: **Baloo 2** (600/700/800) — logo, headings, prices.
* Body: **Montserrat** (400/500/600/700/800) — everything else.
* Line height `1.55` body, `1.08` headings.
* Prices use `font-variant-numeric: tabular-nums` via `Intl.NumberFormat`.

## Motion

* `--fast: .18s`, `--slow: .38s`, easing `cubic-bezier(.22, 1, .36, 1)`.
* Everything collapses to `0.01ms` under `prefers-reduced-motion: reduce`.
* Only animate `transform` and `opacity` — never `width`, `height` or `top`.

## Components

* Buttons: `.cta` (primary), `.add` (card), `.bundle` (vault), `.ghost` (text).
* Cards: `.pack` → `.pack__media` + `.pack__body`.
* Dialogs: native `<dialog>` (`showModal()`), so focus trapping, the top layer
  and Escape-to-close come for free.
* Icons: inline SVG sprite at the top of `index.html` (`<use href="#i-name">`).
  No icon font, no third-party CSS.
