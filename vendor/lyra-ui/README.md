# vendor/lyra-ui

A committed snapshot of `lyra-ui/src`, used **only** for production builds
(`npm run build`) — including the GitHub Actions deploy workflow. Local
development (`npm run dev`) still aliases `@nicecxone/lyra-ui` to the live
sibling checkout at `../lyra-ui`, per this repo's `CLAUDE.md`, so day-to-day
editing is unaffected.

## Why this exists

`../lyra-ui` is a local sibling folder, not a git repo — it isn't pushed
anywhere. A hosted build (GitHub Actions, Vercel, Netlify, etc.) only has
this repo checked out, so it has no way to resolve `@nicecxone/lyra-ui`
without a copy of it living inside this repo. `vite.config.ts` switches the
alias based on Vite's `command` — `serve` (dev) → `../lyra-ui`, `build` →
`./vendor/lyra-ui/src` — so this folder only ever matters for builds.

## Keeping it in sync

This is a snapshot, not a live link — it does **not** automatically pick up
changes made to the real `lyra-ui` checkout. Re-sync it whenever you've
pulled in `lyra-ui` changes you actually want deployed (e.g. as part of
this repo's own `.lyra-ui-sync` check-in step):

```
rm -rf vendor/lyra-ui/src
cp -R ../lyra-ui/src vendor/lyra-ui/src
git add vendor/lyra-ui
git commit -m "Sync vendored lyra-ui snapshot"
```

Forgetting to re-sync isn't dangerous — the deployed app will just keep
using an older `lyra-ui` than what's in local dev until the next sync, the
same way any vendored dependency would.
