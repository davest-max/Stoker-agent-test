import * as React from "react";
import { Container } from "./container";
import { Divider } from "./divider";
import { Button } from "./button";
import { cn } from "../lib/utils";
import defaultAppIconSrc from "../assets/app-icon.svg";

/* ── AgentWelcomeMessage ──
   The "welcome back" card an agent sees once per session (e.g. on page
   load) — icon + greeting + optional last-login line, a highlighted info
   box for anything the app wants to surface (open items, teammates online,
   current skills, etc.), and a two-button footer for choosing how to start
   the shift. Extracted from `agent-next-gen-v1`'s hand-rolled welcome-modal
   markup (icon/title/lastLogin block + `bg-lyra-bg-surface-container-subtle`
   info box + `Divider` + two `Button`s inside a `Container variant="modal"`)
   since that whole composition is exactly the kind of reusable "modal card"
   `LoginCard` already models — same `Container variant="modal"` shell, same
   `appIcon`-defaults-to-the-shared-mark convention (`defaultAppIconSrc`,
   this repo's own copy of `assets/app-icon.svg`).

   Deliberately just the card, not the surrounding backdrop — same split as
   `LoginCard` (also backdrop-less). `agent-next-gen-v1` wraps this in its
   own `Overlay` for the actual dialog behavior (open/close, backdrop
   dismissal, and a theme-aware `color-mix()` backdrop tint that's specific
   to that app's dark-mode handling) — none of that belongs baked into a
   shared component that other consumers might want to open differently
   (e.g. inline, or via a different overlay/backdrop treatment). */

export interface AgentWelcomeMessageProps {
  /** Icon shown beside the greeting. Default: the shared app-icon.svg mark. */
  icon?: React.ReactNode;
  /** Full greeting line, e.g. "Good morning, John Smith". */
  title: string;
  /** Rendered as "Last login: {lastLogin}". Omit to hide the line entirely. */
  lastLogin?: string;
  /** Content for the highlighted info box below the greeting (e.g. current skills, teammates online). Omit to hide the box. */
  children?: React.ReactNode;
  /** Primary (filled) button label. Default: "Go Available". */
  primaryLabel?: string;
  /** Called when the primary button is clicked. */
  onPrimaryClick?: () => void;
  /** Secondary (outline) button label. Default: "Start Offline". */
  secondaryLabel?: string;
  /** Called when the secondary button is clicked. */
  onSecondaryClick?: () => void;
  className?: string;
}

const AgentWelcomeMessage = React.forwardRef<HTMLDivElement, AgentWelcomeMessageProps>(
  (
    {
      icon,
      title,
      lastLogin,
      children,
      primaryLabel = "Go Available",
      onPrimaryClick,
      secondaryLabel = "Start Offline",
      onSecondaryClick,
      className,
    },
    ref
  ) => (
    <Container ref={ref} variant="modal" className={cn("w-[420px] p-6", className)}>
      <div className="flex items-start gap-3">
        {icon ?? <img src={defaultAppIconSrc} alt="" className="h-8 w-8 shrink-0" />}
        <div className="flex flex-col gap-1">
          <h2 className="lyra-heading-lg text-lyra-fg-default">{title}</h2>
          {lastLogin && (
            <p className="lyra-body-sm text-lyra-fg-secondary">Last login: {lastLogin}</p>
          )}
        </div>
      </div>

      {children && (
        <div className="mt-5 rounded-lyra-md bg-lyra-bg-surface-container-subtle p-4">
          {children}
        </div>
      )}

      <Divider className="my-5" />

      <div className="flex gap-3">
        <Button className="flex-1" onClick={onPrimaryClick}>{primaryLabel}</Button>
        <Button variant="outline" className="flex-1" onClick={onSecondaryClick}>{secondaryLabel}</Button>
      </div>
    </Container>
  )
);
AgentWelcomeMessage.displayName = "AgentWelcomeMessage";

export { AgentWelcomeMessage };
