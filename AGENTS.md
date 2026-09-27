# Agent guide — Brain Command Center

Read this first. It exists so you can make a quick change without reading the whole codebase.

## Making a small edit? Do EXACTLY this (nothing more)
The single biggest waste of effort here is re-reading the codebase to make a one-line change. Don't. Follow this and stop:
1. **Reuse the clone.** If `/tmp/brain-command-center` already exists, `cd` in and `git pull`. Only clone if it's missing.
2. **One grep, right file.** Use the "Find it with one grep" table below to pick the file, then grep for the function/string IN THAT FILE. Do not grep the whole repo. Do not open files you aren't editing.
3. **Read a tiny window.** Read only ±20–40 lines around the match. Never read a whole file, never read all of a big file to "get context."
4. **Edit in place**, commit the touched files, `git push origin main`. Done.
5. **Bump the cache** (one command, see below) only if a JS/CSS change must reach already-open browsers.

Anti-patterns that burn the rate limit (never do these): reading whole files "to be safe", re-reading files to verify after a successful Edit, re-cloning when a clone exists, or grepping the entire repo when this guide already says which file it's in. Trust this map over exploring.

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
Changes go live in 1–2 minutes. To force already-open browsers (and the `sw.js` service worker) to pull new JS/CSS, bump BOTH the `?v=` query strings in `index.html` and the `CACHE=` version in `sw.js`. Don't hand-track the current number — this one command does it all (run from the repo root):
```
V=$(date +%Y%m%d%H%M); \
sed -i '' -E "s/\?v=[0-9a-z]+/?v=$V/g" index.html; \
sed -i '' -E "s/bcc-v[0-9]+/bcc-v$V/" sw.js
```
Then commit `index.html` + `sw.js` with the rest. A hard refresh (twice) may still be needed on an open tab.

## File map (what lives where)
| File | Lines | Holds |
|------|-------|-------|
| `index.html` | — | Page shell. Topbar menu (export/import/ICS/PDF buttons ~L66–73), tabs, all tab panels (`#p-cal`, `#p-mcat`, etc.), sidebar. Script load order at bottom. |
| `data.js` | ~520 | **Core data layer.** `load()`, `save()`, `renderAll()`, `defaults()`, plus helpers: `parseMin`, `minToTime`, `todayStr`, `dateStr`, `dateObj`, `getTimeline`, `setTimeline`. One-time data migrations live in `load()` (guarded by `d._flagName` booleans). |
| `core.js` | ~517 | App lifecycle: `init()`, `switchTab()`, theme, sidebar toggles, `renderCalendar()`. `init()` calls the per-tab render functions. |
| `calendar.js` | ~2795 | Calendar views: `renderDayView()`, `renderWeekView()`, `renderWeekBlocks()`, quick-add parsing (`parseQuickAdd`), drag/drop, popovers. |
| `tasks.js` | ~2037 | Tasks tab + sidebar tasks: `renderAllTasks()`, `quickAdd()`, reminders, buckets, swimlanes. |
| `features.js` | ~4000 | Everything else: weekly goal, **MCAT Study Steps tab** (`renderMcat`, `renderVocab`, `VOCAB_BANK`), meeting notes/transcripts, global search, photo import, **import/export** (`exportData`, `importData`, `importIcs`+`parseIcs`, `importOutlookPdf`+`parseOutlookPdfRows`). |
| `studyplan.js` | ~147 | **Study Plan block inside the MCAT tab**: `renderStudyPlan()` + its sub-tabs `spDaily`, `spWeekly`, `spSessions`, `spResources`, `spScores`, `spJournal`. Content data is in `studyplan-data.js`. |
| `sync.js` | ~420 | Optional GitHub Gist sync. |
| `styles.css` | — | All styling. CSS vars: `--text --dim --bg --border --blue --green --amber --purple --indigo --rose --teal`. |
| `sw.js`, `manifest.json` | — | PWA bits. |

## Find it with one grep (feature → file → grep this)
Pick the file, grep the term IN THAT FILE ONLY, read ±30 lines, edit. Don't repo-wide grep.
| I want to touch… | File | grep for |
|------|------|----------|
| A nav tab / which render runs on tab switch | `core.js` | `function switchTab` |
| App startup / which renders run on load | `core.js` | `function init` |
| Theme, sidebar, collapse toggles | `core.js` | `toggleTheme` / `toggleSidebar` |
| Data load / save / one-time migrations | `data.js` | `function load` (migrations are `if(!d.x)` lines inside it) |
| Default new-user data shape | `data.js` | `function defaults` |
| Time/date helpers | `data.js` | `parseMin` / `minToTime` / `todayStr` |
| Day / Week calendar rendering | `calendar.js` | `renderDayView` / `renderWeekView` |
| Quick-add typed-event parsing | `calendar.js` | `parseQuickAdd` |
| Block popovers / edit / drag-drop | `calendar.js` | `openWkBlockMenu` / `dropTaskOnDayCell` |
| Tasks tab, buckets, reminders | `tasks.js` | `renderAllTasks` / `quickAdd` |
| MCAT Study Steps ring + steps | `features.js` | `function renderMcat` |
| Vocab tracker / word bank | `features.js` | `renderVocab` / `VOCAB_BANK` |
| Meeting notes / transcript tools | `features.js` | `parseTranscript` / `summarizeTranscript` |
| Global search | `features.js` | `runGlobalSearch` |
| Import/export (JSON, ICS, Outlook PDF, photo) | `features.js` | `exportData` / `importIcs` / `importOutlookPdf` / `addPhotoEvents` |
| Study Plan (Daily/Weekly/Scores/Journal) | `studyplan.js` | `renderStudyPlan` / `spDaily` / `spScores` |
| A tab's HTML panel / nav button | `index.html` | `id="p-<tab>"` (e.g. `p-mcat`) or `switchTab('<tab>'` |
| Colors / spacing / any styling | `styles.css` | the CSS class name from the element |

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
