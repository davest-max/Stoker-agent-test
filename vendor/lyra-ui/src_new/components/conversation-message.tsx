import * as React from "react";
import { RotateCcw, Copy, AlertTriangle } from "lucide-react";
import { cn } from "../lib/utils";
import { Tooltip } from "./tooltip";
import { AIProcess, type AIProcessStep } from "./ai-process";

/* ── Types ── */

export type ConversationVariant = "user" | "ai" | "agent" | "dark";

export interface ConversationAlertProps {
  /** Alert message text */
  message: string;
  /** Optional icon override — defaults to AlertTriangle */
  icon?: React.ReactNode;
}

export interface ConversationMessageProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Visual variant */
  variant?: ConversationVariant;
  /** Sender name above the bubble */
  senderName?: string;
  /** Time string below the bubble (e.g. "10:42 AM") */
  timestamp?: string;
  /** Full date label — renders as a centered date separator row */
  dateStamp?: string;
  /** Alert message shown inline below the bubble */
  alert?: ConversationAlertProps | string;
  /** Avatar element shown beside the bubble */
  avatar?: React.ReactNode;
  /** Called when restart action is clicked */
  onRestart?: () => void;
  /** Called when copy action is clicked */
  onCopy?: () => void;
  /** Show hover action icons (default: true) */
  showActions?: boolean;
  /** AI thought process steps — renders an AIProcess component above the message */
  process?: AIProcessStep[];
  /** Label for the thought process toggle (default: "Thought process") */
  processLabel?: string;
  /** Default expanded state for the process (default: false) */
  processExpanded?: boolean;
  /** @deprecated use process prop instead */
  collapsible?: boolean;
  /** @deprecated use processLabel instead */
  collapsibleLabel?: string;
  /** @deprecated use processExpanded instead */
  defaultExpanded?: boolean;
}

/* ── Variant config ── */

const variantConfig: Record<ConversationVariant, {
  align: string;
  avatarSide: "left" | "right";
  bubble: boolean;
  bg?: string;
  text: string;
}> = {
  user:  {
    align: "items-end",
    avatarSide: "right",
    bubble: true,
    bg: "var(--lyra-color-bg-conversation-user)",
    text: "text-lyra-fg-default",
  },
  ai:    {
    align: "items-start",
    avatarSide: "left",
    bubble: false,
    bg: undefined,
    text: "text-lyra-fg-default",
  },
  agent: {
    align: "items-start",
    avatarSide: "left",
    bubble: true,
    bg: "var(--lyra-color-bg-surface-shell)",
    text: "text-lyra-fg-default",
  },
  dark: {
    align: "items-end",
    avatarSide: "right",
    bubble: true,
    bg: "var(--lyra-color-bg-primary)",
    text: "text-lyra-fg-on-primary",
  },
};

/* ── Date separator ── */

function DateStamp({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-2 w-full">
      <div className="flex-1 h-px bg-lyra-border-subtle" />
      <span className="lyra-body-sm text-lyra-fg-secondary bg-lyra-bg-surface-shell rounded-full px-3 py-1 select-none shrink-0">
        {label}
      </span>
      <div className="flex-1 h-px bg-lyra-border-subtle" />
    </div>
  );
}

/* ── Alert helper ── */

function AlertRow({ alert }: { alert: ConversationAlertProps | string }) {
  const message = typeof alert === "string" ? alert : alert.message;
  const icon    = typeof alert === "string" ? undefined : alert.icon;
  return (
    <div className="flex items-center gap-1.5 mt-1 px-1">
      {icon ?? <AlertTriangle className="h-3.5 w-3.5 text-lyra-status-warning-strong shrink-0" strokeWidth={1.5} />}
      <span className="lyra-body-sm text-lyra-status-warning-strong">{message}</span>
    </div>
  );
}

/* ── Component ── */

const ConversationMessage = React.forwardRef<HTMLDivElement, ConversationMessageProps>(
  ({
    children,
    variant = "user",
    senderName,
    timestamp,
    dateStamp,
    alert,
    avatar,
    onRestart,
    onCopy,
    showActions = true,
    process,
    processLabel = "Thought process",
    processExpanded = false,
    collapsible,
    collapsibleLabel,
    defaultExpanded,
    className,
    ...props
  }, ref) => {
    const { align, avatarSide, bubble, bg, text } = variantConfig[variant];
    const isFullWidth = variant === "ai";
    // Support legacy collapsible prop
    const hasProcess = !!process || collapsible;

    return (
      <div ref={ref} className={cn("flex flex-col gap-1 w-full", className)} {...props}>

        {/* Date separator — full width, centred */}
        {dateStamp && <DateStamp label={dateStamp} />}

        {/* Message row: avatar + bubble column */}
        <div className={cn("flex items-start gap-2", align === "items-end" ? "flex-row-reverse" : "flex-row")}>

          {/* Avatar */}
          {avatar && (
            <div className="shrink-0">{avatar}</div>
          )}

          {/* Bubble column */}
          <div className={cn("flex flex-col gap-1", align, isFullWidth ? "w-full" : "max-w-[75%]")}>
            {senderName && (
              <span className={cn(
                "lyra-body-sm px-1",
                variant === "dark" ? "text-lyra-fg-on-primary/70" : "text-lyra-fg-secondary"
              )}>{senderName}</span>
            )}

            {/* Bubble + hover actions */}
            <div className="relative group/msg w-full">
              {/* AI thought process */}
              {hasProcess ? (
                <div className="w-full">
                  <AIProcess
                    steps={process ?? []}
                    label={processLabel ?? collapsibleLabel ?? "Thought process"}
                    defaultExpanded={processExpanded ?? defaultExpanded ?? false}
                  />
                  {children && (
                    <div className="mt-2 lyra-body-md text-lyra-fg-default">{children}</div>
                  )}
                </div>
              ) : (
              <div
                className={cn(
                  "lyra-body-md",
                  text,
                  bubble ? "px-3 py-2 rounded-lyra-lg" : ""
                )}
                style={bubble && bg ? { background: bg } : undefined}
              >
                {children}
              </div>
              )}

              {/* Hover actions — float above, pinned to right (hidden for collapsible thought process) */}
              {showActions && !collapsible && (
                <div className={cn(
                  "absolute right-0 flex items-center gap-1",
                  bubble ? "-top-9" : "-top-7",
                  "bg-lyra-bg-surface-overlay border border-lyra-border-subtle shadow-md rounded-lyra-md px-1 py-1",
                  "opacity-0 group-hover/msg:opacity-100 transition-opacity duration-150 z-10"
                )}>
                  <Tooltip content="Restart conversation from here" placement="top">
                    <button
                      type="button"
                      onClick={onRestart}
                      aria-label="Restart conversation from here"
                      className="flex h-7 w-7 items-center justify-center rounded-lyra-sm text-lyra-fg-secondary hover:text-lyra-fg-default hover:bg-lyra-state-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus"
                    >
                      <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </button>
                  </Tooltip>
                  <Tooltip content="Copy" placement="top">
                    <button
                      type="button"
                      onClick={onCopy}
                      aria-label="Copy message"
                      className="flex h-7 w-7 items-center justify-center rounded-lyra-sm text-lyra-fg-secondary hover:text-lyra-fg-default hover:bg-lyra-state-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus"
                    >
                      <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </button>
                  </Tooltip>
                </div>
              )}
            </div>

            {/* Alert helper — inline below bubble */}
            {alert && <AlertRow alert={alert} />}

            {/* Timestamp */}
            {timestamp && (
              <span className="lyra-body-sm text-lyra-fg-disabled px-1">{timestamp}</span>
            )}
          </div>
        </div>
      </div>
    );
  }
);
ConversationMessage.displayName = "ConversationMessage";

export { ConversationMessage, DateStamp as ConversationDateStamp };
