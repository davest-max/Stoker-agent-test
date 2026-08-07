import * as React from "react";
import { cn } from "../lib/utils";

/* ── AppHeader ── */

interface AppHeaderProps extends React.HTMLAttributes<HTMLElement> {
  /** Left side content — typically an AppName component */
  appName: React.ReactNode;
  /** Optional content between `appName` and `actions` — e.g. a consuming
   *  app's own contextual toolbar (call controls, a record's own action
   *  bar, etc.) that needs to live in the always-present header rather than
   *  scrolling away with page content. Rendered as its own flex item
   *  directly after `appName` by default — left-aligned within whatever
   *  space is left before `actions`, not auto-centered.
   *
   *  If a consumer needs `center` to line up with something below the
   *  header at a specific pixel offset (e.g. a left nav rail's content
   *  column), use `position: absolute` + `left` on the content passed in,
   *  not `marginLeft` — `header` below is `relative` for exactly this case.
   *  `marginLeft` in normal flow adds space *after* wherever `center` would
   *  otherwise sit (right after `appName`'s own rendered width), so it
   *  compounds with `appName`'s width instead of measuring from the
   *  header's own left edge — a real bug hit in practice (a call-controls
   *  bar meant to align at a fixed 256px kept landing further right than
   *  that, by however wide the app name happened to render). `position:
   *  absolute; left: Npx` (with the header's own `relative` making that
   *  `left` relative to the header, not the viewport) measures from the
   *  header's left edge regardless of `appName`'s width, which is what
   *  "line up with something below" actually needs. `AppHeader` itself
   *  still has no opinion on what's below it — the offset value is the
   *  consumer's own computation either way.
   *
   *  One more gotcha if a consumer also needs to clear `appName` itself
   *  (not just align with something below): the containing block for that
   *  absolutely-positioned `left` is this `header`'s *padding box* — i.e.
   *  `left: 0` lands at the header's outer/border edge, before `pl-2` is
   *  applied, not at wherever `appName`'s content visibly starts. A
   *  consumer measuring `appName`'s rendered width (e.g. via
   *  `ResizeObserver`) to keep `center` clear of it needs to add this
   *  header's own left padding back on top of that measured width — using
   *  the measured width alone under-shoots by exactly that padding, which
   *  in practice was enough to let `center` sit close enough to overlap
   *  `appName` at narrow/collapsed layouts. */
  center?: React.ReactNode;
  /** Right side content — typically ActionIconButtons + ActionAvatarButton */
  actions?: React.ReactNode;
}

const AppHeader = React.forwardRef<HTMLElement, AppHeaderProps>(
  ({ className, appName, center, actions, ...props }, ref) => (
    <header
      ref={ref}
      className={cn(
        "relative flex h-14 items-center pl-2 pr-4",
        className
      )}
      {...props}
    >
      <div className="flex items-center shrink-0">{appName}</div>
      {center && <div className="flex items-center">{center}</div>}
      {actions && (
        <div className="flex items-center gap-1 ml-auto">{actions}</div>
      )}
    </header>
  )
);
AppHeader.displayName = "AppHeader";

export { AppHeader };
export type { AppHeaderProps };
