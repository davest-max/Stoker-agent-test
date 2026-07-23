import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ActionIconButton,
  Draggable,
  ContainerHeader,
  Select,
  Textarea,
  Tag,
  Label,
  Button,
  AiSparkleIcon,
} from "@nicecxone/lyra-ui";
import { CircleCheck, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Outcome popup ──
 * Wires up `InteractionActionsBar`'s previously-inert "Outcome" icon
 * button (see its own comment — Consult/Transfer/Outcome, same trio as the
 * reference site's action row) to an actual wrap-up form: an AI-prefilled
 * Resolution/Tags/Disposition Code/Summary the agent reviews and edits
 * before saving. Modeled on a reference build's own "Outcome" popup
 * (Resolution select → Tags multi-select → Disposition Code select →
 * Summary textarea → Cancel/"Approve & Save · {Resolution}"), rebuilt here
 * entirely from this app's own lyra-ui components rather than copying any
 * markup — `Draggable` (float-only, no dock — this is a one-off wrap-up
 * form, not a persistent panel like Notifications/Chat/AI, so the dock
 * button those get doesn't apply here) + `ContainerHeader` for the
 * grip/title/close row, `Select`/`Textarea`/`Tag`/`Label` for the fields,
 * `AiSparkleIcon` for the "AI Suggested" banner (lyra-ui's own shared icon
 * — not a local duplicate).
 *
 * One deliberate deviation from the reference: `Select`'s multi-select
 * trigger always shows "N selected" once any tags are chosen (no prop to
 * force it back to the placeholder), so unlike the reference — where the
 * trigger keeps saying "Add tags…" even with tags already picked, relying
 * solely on the chip row above it — this trigger shows both. Slightly
 * redundant, still legible; not worth a lyra-ui change for. */

interface OutcomeOption {
  value: string;
  label: string;
}

const RESOLUTION_OPTIONS: OutcomeOption[] = [
  { value: "resolved", label: "Resolved" },
  { value: "follow-up-needed", label: "Follow-up needed" },
  { value: "transferred", label: "Transferred" },
  { value: "duplicate-case", label: "Duplicate case" },
  { value: "escalated", label: "Escalated" },
];

const DISPOSITION_CODE_OPTIONS: OutcomeOption[] = [
  { value: "issue-resolved", label: "Issue Resolved" },
  { value: "partial-resolution", label: "Partial Resolution" },
  { value: "pending-follow-up", label: "Pending Follow-up" },
  { value: "transferred-tier-2", label: "Transferred to Tier 2" },
  { value: "transferred-billing", label: "Transferred to Billing" },
  { value: "supervisor-override", label: "Supervisor Override" },
  { value: "refund-issued", label: "Refund Issued" },
  { value: "credit-applied", label: "Credit Applied" },
  { value: "information-provided", label: "Information Provided" },
  { value: "no-action-required", label: "No Action Required" },
  { value: "customer-declined", label: "Customer Declined" },
  { value: "callback-scheduled", label: "Callback Scheduled" },
];

const TAG_OPTIONS: OutcomeOption[] = [
  { value: "billing", label: "Billing" },
  { value: "refund", label: "Refund" },
  { value: "subscription", label: "Subscription" },
  { value: "technical", label: "Technical" },
  { value: "account", label: "Account" },
  { value: "fraud", label: "Fraud" },
  { value: "escalated", label: "Escalated" },
];

export interface OutcomeResult {
  resolution: string;
  tags: string[];
  dispositionCode: string;
  summary: string;
}

/* ── Form body ── */

function OutcomeForm({
  customerName,
  onCancel,
  onApprove,
}: {
  customerName: string;
  onCancel: () => void;
  onApprove: (outcome: OutcomeResult) => void;
}) {
  // Seeded as if AI-suggested, same as the reference — the whole point of
  // the banner below is "review and edit before saving", not "trust and
  // submit blindly".
  const [resolution, setResolution] = useState("resolved");
  const [tags, setTags] = useState<string[]>(["technical", "account"]);
  const [dispositionCode, setDispositionCode] = useState("issue-resolved");
  const [summary, setSummary] = useState(
    `Interaction with ${customerName} — customer concern reviewed and resolved. Agent provided clear guidance and confirmed next steps. Follow-up actions logged where applicable.`
  );

  const resolutionLabel = RESOLUTION_OPTIONS.find((o) => o.value === resolution)?.label ?? "Interaction";

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        <div className="flex items-center gap-2 rounded-lyra-sm bg-lyra-bg-active-subtle px-3 py-2">
          <AiSparkleIcon className="h-4 w-4 shrink-0 text-lyra-fg-active-strong" />
          <p className="lyra-body-sm text-lyra-fg-active-strong">
            <span className="lyra-body-sm-emphasis">AI Suggested</span> — review and edit before saving
          </p>
        </div>

        <Select
          label="Resolution"
          value={resolution}
          onValueChange={setResolution}
          options={RESOLUTION_OPTIONS}
          portalDropdown
        />

        <div>
          <Label label="Tags" className="mb-1.5 block" />
          {tags.length > 0 && (
            <div className="mb-1.5 flex flex-wrap gap-1.5">
              {tags.map((value) => (
                <Tag
                  key={value}
                  label={TAG_OPTIONS.find((o) => o.value === value)?.label ?? value}
                  onRemove={() => setTags((prev) => prev.filter((v) => v !== value))}
                />
              ))}
            </div>
          )}
          <Select
            multiple
            values={tags}
            onValuesChange={setTags}
            options={TAG_OPTIONS}
            placeholder="Add tags…"
            portalDropdown
          />
        </div>

        <Select
          label="Disposition code"
          value={dispositionCode}
          onValueChange={setDispositionCode}
          options={DISPOSITION_CODE_OPTIONS}
          portalDropdown
        />

        <Textarea
          label="Summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={4}
        />
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2 border-t border-lyra-border-subtle p-3">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="default"
          onClick={() => onApprove({ resolution, tags, dispositionCode, summary })}
        >
          Approve &amp; Save · {resolutionLabel}
        </Button>
      </div>
    </div>
  );
}

/* ── Trigger + floating panel ── */

export interface OutcomeButtonProps {
  /** Shown in the panel's title ("Outcome · {customerName}") and seeded
   *  into the AI-suggested summary. */
  customerName: string;
  onApprove?: (outcome: OutcomeResult) => void;
}

const PANEL_WIDTH = 360;

export function OutcomeButton({ customerName, onApprove }: OutcomeButtonProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  // Captured once per open, like the app-level AI/Notifications float
  // panels do (xFloatLeft/xFloatTop refs in AgentNextGenPage.tsx) — anchors
  // the panel near the button it was opened from without re-deriving the
  // position on every render (which would fight the user dragging it).
  const floatPos = useRef<{ top: number; left: number } | null>(null);

  const handleOpen = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      floatPos.current = {
        top: Math.min(rect.bottom + 8, window.innerHeight - 240),
        left: Math.min(rect.left, window.innerWidth - PANEL_WIDTH - 16),
      };
    }
    setOpen(true);
  };

  return (
    <>
      <ActionIconButton
        ref={triggerRef}
        size="sm"
        title="Outcome"
        aria-expanded={open}
        onClick={handleOpen}
        className={cn(open && "bg-lyra-state-hover")}
      >
        <CircleCheck className="h-4 w-4 text-lyra-status-info-strong" strokeWidth={2} />
      </ActionIconButton>

      {open &&
        floatPos.current &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: floatPos.current.top,
              left: floatPos.current.left,
              zIndex: 9999,
            }}
          >
            <Draggable
              variant="float"
              lockVariant
              defaultWidth={PANEL_WIDTH}
              defaultHeight={560}
              minWidth={320}
              minHeight={420}
              className="rounded-lyra-lg border border-lyra-border-subtle bg-lyra-bg-surface-overlay shadow-lg"
              renderHeaderControls={({ gripProps }) => (
                <ContainerHeader
                  title={`Outcome · ${customerName}`}
                  icon={
                    <div {...gripProps}>
                      <GripVertical className="h-4 w-4" strokeWidth={1.5} />
                    </div>
                  }
                  onClose={() => setOpen(false)}
                />
              )}
            >
              <OutcomeForm
                customerName={customerName}
                onCancel={() => setOpen(false)}
                onApprove={(outcome) => {
                  onApprove?.(outcome);
                  setOpen(false);
                }}
              />
            </Draggable>
          </div>,
          document.body
        )}
    </>
  );
}
