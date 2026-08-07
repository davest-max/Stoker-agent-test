/**
 * DEPRECATED — removed from the public API (see index.ts). This file could
 * not actually be deleted (Cowork's mount on this folder doesn't permit file
 * deletion) — please delete `src/components/panel.tsx` by hand next time
 * you're in a normal terminal.
 *
 * The old unified `Panel` (`variant="side" | "interior"`) was replaced by
 * two separate, dedicated components — that split was the whole point of
 * this change: a single component silently switching behavior on a
 * `variant` prop was the root of the "side vs. interior" confusion in the
 * first place. Use:
 *
 *   - `SidePanel`     (./side-panel.tsx)     — over the page header, hover/pin, left or right.
 *   - `InteriorPanel` (./interior-panel.tsx) — below the page header, inline, click-triggered, left or right.
 *
 * No `Panel` export remains — every internal consumer has been migrated to
 * one of the two components above. If you're reading this because an old
 * branch/import still references `Panel` from here, switch it to whichever
 * of the two matches the behavior you actually want.
 */
export {};
