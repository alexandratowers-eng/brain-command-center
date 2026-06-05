# Agent guide — Brain Command Center

Read this first. It exists so you can make a quick change without reading the whole codebase.

## What this is
A static, single-page dashboard hosted on **GitHub Pages**. No build step, no framework, no npm. Plain HTML + CSS + vanilla JS. All state lives in the browser's `localStorage` under the key `SK` (see `data.js`).

## CRITICAL: avoid the "tool call could not be parsed" failure
`features.js`, `calendar.js`, `tasks.js`, and `styles.css` are each 120KB+. Reading
one whole, or emitting a full-file rewrite, produces a tool payload large enough to
fail parsing — the edit silently dies and the commit message can end up claiming work
that never landed. So:
- **Never read these four files in full.** Use grep to find the line, then read only a
  small window (20–40 lines) around it.
- **Make small, targeted edits in place.** Never rewrite a whole large file.
- After committing, **grep the repo to confirm the new code is actually present** before
  reporting success — don't trust the commit message alone.

## Workflow for any change
```
git clone https://github.com/alexandratowers-eng/brain-command-center.git /tmp/brain-command-center
# (or: cd /tmp/brain-command-center && git pull origin main)
# edit files
git add <files> && git commit -m "..." && git push origin main
```
Changes go live in 1–2 minutes. To force browsers to pull new JS/CSS, bump the `?v=YYYYMMDD` query string on the `<script>`/`<link>` tags in `index.html` (currently `?v=20260521d`). There is a service worker (`sw.js`) so a hard refresh (twice) may be needed.

## File map (what lives where)
| File | Lines | Holds |
|------|-------|-------|
| `index.html` | — | Page shell. Topbar menu (export/import/ICS/PDF buttons ~L66–73), tabs, all tab panels (`#p-cal`, `#p-mcat`, etc.), sidebar. Script load order at bottom. |
| `data.js` | ~520 | **Core data layer.** `load()`, `save()`, `renderAll()`, `defaults()`, plus helpers: `parseMin`, `minToTime`, `todayStr`, `dateStr`, `dateObj`, `getTimeline`, `setTimeline`. One-time data migrations live in `load()` (guarded by `d._flagName` booleans). |
| `core.js` | ~517 | App lifecycle: `init()`, `switchTab()`, theme, sidebar toggles, `renderCalendar()`. `init()` calls the per-tab render functions. |
| `calendar.js` | ~2795 | Calendar views: `renderDayView()`, `renderWeekView()`, `renderWeekBlocks()`, quick-add parsing (`parseQuickAdd`), drag/drop, popovers. |
| `tasks.js` | ~2037 | Tasks tab + sidebar tasks: `renderAllTasks()`, `quickAdd()`, reminders, buckets, swimlanes. |
| `features.js` | ~3814 | Everything else: weekly goal, **MCAT tab** (`renderMcat`, `renderVocab`, `VOCAB_BANK`), meeting notes, **import/export** (`exportData`, `importData`, `importIcs`+`parseIcs`, `importOutlookPdf`+`parseOutlookPdfRows`). |
| `sync.js` | ~374 | Optional GitHub Gist sync. |
| `styles.css` | — | All styling. CSS vars: `--text --dim --bg --border --blue --green --amber --purple --indigo --rose --teal`. |
| `sw.js`, `manifest.json` | — | PWA bits. |

## Data model (the important part)
Calendar events ("blocks") live in:
```
D.days["YYYY-MM-DD"] = [ {t, end, text, cls, sm, loc, ...flags}, ... ]
```
- `t` / `end` — time strings like `"9:00 AM"` (use `parseMin`/`minToTime` to convert).
- `cls` — color/category class: `errands`, `work`, `mcat`, etc.
- `sm` — small subtitle text. `loc` — location.
- Flags like `_ics`, `_pdf`, `_mcatDaily` tag where a block came from.

Tasks live in `D.tasks` (array). Other tab state hangs off other `D.*` keys.

## The golden rule for edits
After mutating the `D` object in code, **always call `save()` then the relevant `render*()`** (or `renderAll()`), or the UI won't update and the change won't persist.

## Common "quick change" recipes
- **Add a calendar block programmatically:** push onto `D.days[date]`, then `save(); renderCalendar();`.
- **Add an importer:** mirror `importIcs` in `features.js` — file input → parse → push into `D.days` → `save(); renderAll();`. Dedupe with a `D._somethingImported` map.
- **Add content to the MCAT tab:** the panel is `#p-mcat` in `index.html`; render logic is `renderMcat()` in `features.js` (it calls `renderVocab()`). The vocab word bank is the `VOCAB_BANK` array.
- **Change colors/spacing:** edit `styles.css`; reuse the CSS vars above.
- **Don't forget** to bump `?v=` in `index.html` if a JS/CSS change must reach already-open browsers.
