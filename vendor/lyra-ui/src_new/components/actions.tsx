import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";
import { Tooltip } from "./tooltip";

/* ── Action Icon Button (icon with optional badge) ── */

interface ActionIconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Badge count — hidden when 0 or undefined */
  badge?: number;
  /** Size: sm=32, default=36, lg=40, xl=44 */
  size?: "sm" | "default" | "lg" | "xl";
}

const actionIconButtonVariants = cva(
  "relative flex items-center justify-center rounded-lyra-sm text-lyra-fg-action transition-colors hover:bg-lyra-state-hover active:bg-lyra-state-pressed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2",
  {
    variants: {
      size: {
        sm:      "h-8 w-8",
        default: "h-9 w-9",
        lg:      "h-10 w-10",
        xl:      "h-11 w-11",
      },
    },
    defaultVariants: { size: "default" },
  }
);

const ActionIconButton = React.forwardRef<
  HTMLButtonElement,
  ActionIconButtonProps
>(({ className, badge, size = "default", title, children, ...props }, ref) => {
  const button = (
    <button
      ref={ref}
      aria-label={title}
      className={cn(actionIconButtonVariants({ size }), className)}
      {...props}
    >
      <span className="relative inline-flex">
        <span aria-hidden="true">{children}</span>
        {badge != null && badge > 0 && (
          <span
            className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-lyra-bg-destructive px-1 text-[10px] font-bold text-lyra-fg-on-primary"
            aria-label={`${badge} notifications`}
          >
            <span aria-hidden="true">{badge}</span>
          </span>
        )}
      </span>
    </button>
  );

  if (title) {
    return (
      <Tooltip content={title} placement="bottom" asLabel>
        {button}
      </Tooltip>
    );
  }

  return button;
});
ActionIconButton.displayName = "ActionIconButton";

/* ── Action Avatar Button (avatar circle + chevron) ── */

interface ActionAvatarButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** User initials (1-2 characters) */
  initials: string;
  /** Background color for the avatar circle */
  avatarColor?: string;
}

const ActionAvatarButton = React.forwardRef<
  HTMLButtonElement,
  ActionAvatarButtonProps
>(({ className, initials, avatarColor = "#5d6a79", ...props }, ref) => (
  <Tooltip content="Profile" placement="bottom" asLabel={false}>
    <button
      ref={ref}
      aria-label="User menu"
      aria-haspopup="true"
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-lyra-sm pl-2 pr-1.5 transition-colors",
        "hover:bg-lyra-state-hover active:bg-lyra-state-pressed",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2",
        className
      )}
      {...props}
    >
      <div
        className="flex h-8 w-8 items-center justify-center rounded-full lyra-body-md-emphasis text-white"
        style={{ backgroundColor: avatarColor }}
        aria-hidden="true"
      >
        {initials}
      </div>
      <ChevronDown
        className="h-3.5 w-3.5 text-lyra-fg-secondary"
        strokeWidth={1.5}
        aria-hidden="true"
      />
    </button>
  </Tooltip>
));
ActionAvatarButton.displayName = "ActionAvatarButton";

/* ── Re-export old names for backward compat ── */
const ShellIconButton = ActionIconButton;
const ShellAvatarButton = ActionAvatarButton;

export {
  ActionIconButton,
  ActionAvatarButton,
  ShellIconButton,
  ShellAvatarButton,
  actionIconButtonVariants,
};
export type { ActionIconButtonProps, ActionAvatarButtonProps };
