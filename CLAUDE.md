# CLAUDE.md

This app consumes the shared `lyra-ui` design system via a live source alias (`@nicecxone/lyra-ui`), not a local component library. Before writing or editing any UI code here:

- Import UI atoms from `@nicecxone/lyra-ui` — never build or reach for a local `src/components/ui/*` reimplementation of something that already exists there.
- Check `lyra-ui/src/index.ts` and that component's `__stories__` file *before* building anything — reuse the existing component, and match the exact markup shape shown in its story, not just the prop types (e.g. a plain labeled `Checkbox` is a manual `<label>` wrapper around it in most stories, not the `label` prop).
- Never modify a `lyra-ui` core component from here. If something this app needs doesn't exist yet in `lyra-ui`, that's a signal to add it there — not approximate it locally.
- Every modal's outer card uses `Container variant="modal"`, never a hand-rolled div.
- Use the shared `assets/app-icon.svg` mark for the app logo/smiley — never `CXoneSmiley` or a one-off hand-rolled SVG.
- Before reaching for a raw Tailwind utility value (spacing, sizing, radius, etc.), check other lyra-ui components/stories first for the established token.

Full rationale, worked examples, and the "why" behind each of these live in `../lyra-ui/PROJECT_SUMMARY.md` (see Important Patterns, Scope Rules, and the Post-layout QA checklist) — read that file before making non-trivial UI changes here.

## Sync check (do this first, every session)

This app depends on a live sibling checkout of `lyra-ui` (see the `@nicecxone/lyra-ui` alias path in `vite.config.ts` — currently `../lyra-ui`), not a versioned package. `.lyra-ui-sync` in this repo's root records the `lyra-ui` commit hash this app was last checked against.

1. Confirm the sibling path from `vite.config.ts`'s alias and check it's a real git repo (`git -C ../lyra-ui rev-parse HEAD`). If it's missing entirely (this project was moved without lyra-ui alongside it, or lyra-ui hasn't been cloned yet), skip this check silently — don't block on it.
2. Otherwise, diff since last sync: `git -C ../lyra-ui log --oneline "$(cat .lyra-ui-sync)"..HEAD`. Nothing printed means nothing changed — move on.
3. If there are new commits, read `../lyra-ui/PROJECT_SUMMARY.md` for a human-readable description of what those changes actually are (its "Key Components" entries and changelog-style bullets exist for exactly this). Summarize for the user what's new and whether anything in this app looks like it should be migrated to use it (same categories as the rules above — a hand-rolled pattern that a new/changed component now replaces).
4. Ask before migrating anything — don't silently rewrite pages.
5. Whether or not the user chooses to migrate, once they've seen and responded to the new changes, update `.lyra-ui-sync` to `lyra-ui`'s current HEAD hash (`git -C ../lyra-ui rev-parse HEAD`) so the same commits aren't re-flagged next session.

This same file/procedure is what a freshly duplicated copy of this template repo should keep doing — duplicating this repo carries `.lyra-ui-sync` and this `CLAUDE.md` along with it, so a new project built from this template inherits the sync check automatically as long as it keeps `lyra-ui` as a sibling checkout (or its `vite.config.ts` alias is updated to point at wherever `lyra-ui` actually lives).
