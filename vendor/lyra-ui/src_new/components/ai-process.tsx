import * as React from "react";
import { ChevronDown, Check, Clock, AlertCircle, Loader } from "lucide-react";
import { cn } from "../lib/utils";

/* ── Types ── */

export type AIProcessStepStatus = "pending" | "active" | "done" | "error";

export interface AIProcessStep {
  id: string;
  label: string;
  description?: string;
  status?: AIProcessStepStatus;
}

export interface AIProcessProps {
  /** Steps in the thought process */
  steps: AIProcessStep[];
  /** Header label (default: "Thought process") */
  label?: string;
  /** Default expanded state */
  defaultExpanded?: boolean;
  className?: string;
}

/* ── Step icon ── */

function StepIcon({ status }: { status: AIProcessStepStatus }) {
  const base = "flex h-6 w-6 items-center justify-center rounded-full shrink-0";

  switch (status) {
    case "done":
      return (
        <span className={cn(base, "bg-lyra-status-success-subtle")}>
          <Check className="h-3.5 w-3.5 text-lyra-status-success-strong" strokeWidth={2.5} />
        </span>
      );
    case "active":
      return (
        <span className={cn(base, "bg-lyra-bg-active-subtle")}>
          <Loader className="h-3.5 w-3.5 text-lyra-fg-active-strong animate-spin" strokeWidth={2} />
        </span>
      );
    case "error":
      return (
        <span className={cn(base, "bg-lyra-status-critical-subtle")}>
          <AlertCircle className="h-3.5 w-3.5 text-lyra-status-critical-strong" strokeWidth={2} />
        </span>
      );
    case "pending":
    default:
      return (
        <span className={cn(base, "bg-lyra-bg-surface-shell")}>
          <Clock className="h-3.5 w-3.5 text-lyra-fg-secondary" strokeWidth={1.5} />
        </span>
      );
  }
}

/* ── Component ── */

const AIProcess = React.forwardRef<HTMLDivElement, AIProcessProps>(
  ({
    steps,
    label = "Thought process",
    defaultExpanded = false,
    className,
  }, ref) => {
  const [expanded, setExpanded] = React.useState(defaultExpanded);

  return (
    <div ref={ref} className={cn("w-full", className)}>
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1.5 text-lyra-fg-secondary hover:text-lyra-fg-default transition-colors focus-visible:outline-none group"
      >
        <span className="lyra-body-md-emphasis">{label}</span>
        <ChevronDown
          className={cn("h-4 w-4 transition-transform duration-200", expanded && "rotate-180")}
          strokeWidth={1.5}
        />
      </button>

      {/* Steps */}
      {expanded && (
        <div className="mt-3 flex flex-col">
          {steps.map((step, i) => {
            const isLast = i === steps.length - 1;
            const status = step.status ?? "pending";

            return (
              <div key={step.id} className="flex flex-col">
                {/* Icon + label row — center aligned */}
                <div className="flex items-center gap-3">
                  <StepIcon status={status} />
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className={cn(
                      "lyra-body-sm",
                      status === "done"   ? "text-lyra-fg-secondary" :
                      status === "active" ? "text-lyra-fg-active-strong" :
                      status === "error"  ? "text-lyra-status-critical-strong" :
                      "text-lyra-fg-secondary"
                    )}>
                      {step.label}
                    </span>
                    {step.description && (
                      <span className="lyra-body-sm text-lyra-fg-disabled">{step.description}</span>
                    )}
                  </div>
                </div>
                {/* Connector line */}
                {!isLast && (
                  <div className="ml-3 w-px bg-lyra-border-subtle my-1" style={{ height: "12px" }} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

AIProcess.displayName = "AIProcess";

export { AIProcess };
