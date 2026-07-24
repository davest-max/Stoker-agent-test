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
  Switch,
  AiSparkleIcon,
  CHANNEL_ACCENT,
  type ChannelType,
} from "@nicecxone/lyra-ui";
import { CircleCheckBig, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Outcome popup ──
 * Wires up `InteractionActionsBar`'s previously-inert "Outcome" icon
 * button (see its own comment — Consult/Transfer/Outcome, same trio as the
 * reference site's action row) to an actual wrap-up form: an AI-prefilled
 * Resolution/Tags/Disposition Code/Summary the agent reviews and edits
 * before saving. Modeled on a reference build's own "Outcome" popup
 * (Resolution select → Tags multi-select → Disposition Code select →
 * Summary textarea → Cancel/"Approve & Save"), rebuilt here entirely from
 * this app's own lyra-ui components rather than copying any markup —
 * `Draggable` (float-only, no dock — this is a one-off wrap-up
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

/** A channel identity — type + display label — as used throughout this
 *  file's "Applies to"/"Outcome All" plumbing. */
interface OutcomeChannelRef {
  type: ChannelType;
  label: string;
}

/** Read-only "Applies to" row — which channel(s) one Approve & Save is
 *  about to disposition. Renders nothing for an empty list so callers can
 *  pass it unconditionally. Colored per `CHANNEL_ACCENT` (the same map
 *  `ChannelRow`'s own chips use) rather than a flat neutral tag, so a
 *  channel reads the same identity color here as it does everywhere else
 *  in the app. */
function AppliesToRow({ channels }: { channels: OutcomeChannelRef[] }) {
  if (channels.length === 0) return null;
  return (
    <div>
      <Label label="Applies to" className="mb-1.5 block" />
      <div className="flex flex-wrap gap-1.5">
        {channels.map((ch, i) => {
          const accent = CHANNEL_ACCENT[ch.type];
          return (
            <Tag
              key={`${ch.type}-${i}`}
              label={ch.label}
              shape="pill"
              className={cn(accent.bg, accent.text, accent.border)}
            />
          );
        })}
      </div>
    </div>
  );
}

/** Context passed into `OutcomeForm` whenever the card it belongs to is
 *  elevated (2+ open channels) — drives the "Outcome All" toggle and the
 *  "Applies to" row underneath it. Both `OutcomeButton` (opened for one
 *  specific channel) and `OutcomeAllPanel` (opened from the Elevation
 *  card's own kebab menu) supply this the same way, just with a different
 *  `defaultToAll` — this is what makes "include a toggle to choose Outcome
 *  All" apply to *any* elevated Outcome popup rather than just one of the
 *  two entry points. */
interface ElevatedOutcomeContext {
  /** The channel this popup was opened for/against — what the toggle
   *  narrows back down to when switched off. */
  currentChannel: OutcomeChannelRef;
  /** Every open channel on the card — what the toggle expands out to when
   *  switched on. */
  allChannels: OutcomeChannelRef[];
  /** Toggle's starting position: false from the single-channel `OutcomeButton`
   *  (starts scoped to just `currentChannel`), true from `OutcomeAllPanel`
   *  (starts scoped to every channel) — the agent can still flip it either
   *  way from there, this only seeds where it starts. */
  defaultToAll: boolean;
}

/* ── Form body ── */

function OutcomeForm({
  customerName,
  onCancel,
  onApprove,
  elevated,
}: {
  customerName: string;
  onCancel: () => void;
  /** `appliedChannels` reflects the toggle's current position at the
   *  moment of approval — `elevated.allChannels` if "Outcome All" is on,
   *  otherwise just `[elevated.currentChannel]`. Empty on a non-elevated
   *  card (no `elevated` context at all). */
  onApprove: (outcome: OutcomeResult, appliedChannels: OutcomeChannelRef[]) => void;
  /** Present whenever this card has more than one open channel — see
   *  `ElevatedOutcomeContext`'s own doc comment. Omitted entirely on a
   *  single-channel card, where there's nothing to toggle. */
  elevated?: ElevatedOutcomeContext;
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
  const [applyToAll, setApplyToAll] = useState(elevated?.defaultToAll ?? false);

  const appliedChannels = elevated ? (applyToAll ? elevated.allChannels : [elevated.currentChannel]) : [];

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        <div className="flex items-center gap-2 rounded-lyra-sm bg-lyra-bg-active-subtle px-3 py-2">
          <AiSparkleIcon className="h-4 w-4 shrink-0 text-lyra-fg-active-strong" />
          <p className="lyra-body-sm text-lyra-fg-active-strong">
            <span className="lyra-body-sm-emphasis">AI Suggested</span> — review and edit before saving
          </p>
        </div>

        {elevated && (
          <>
            <div className="flex items-center justify-between rounded-lyra-sm border border-lyra-border-subtle bg-lyra-bg-surface-canvas px-3 py-2">
              <div>
                <p className="lyra-body-sm-emphasis text-lyra-fg-default">Outcome All</p>
                <p className="lyra-body-xs text-lyra-fg-secondary">Apply this outcome to every open channel</p>
              </div>
              <Switch checked={applyToAll} onCheckedChange={setApplyToAll} size="sm" />
            </div>
            <AppliesToRow channels={appliedChannels} />
          </>
        )}

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
          rows={8}
        />
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2 border-t border-lyra-border-subtle p-3">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="default"
          onClick={() => onApprove({ resolution, tags, dispositionCode, summary }, appliedChannels)}
        >
          Approve &amp; Save
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
  /** Pass the interaction's currently-active channel plus every open
   *  channel on the card whenever it's elevated (2+ open channels) — turns
   *  on the "Outcome All" toggle (see `ElevatedOutcomeContext`), starting
   *  scoped to just `currentChannel` (the agent can flip it to cover every
   *  channel from there). Omit on a single-channel card, where there's
   *  nothing to toggle. */
  elevated?: { currentChannel: OutcomeChannelRef; allChannels: OutcomeChannelRef[] };
  /** Controlled, not internal — lifted up so the consuming app can close
   *  this popup the moment `OutcomeAllPanel` opens (and vice versa), per
   *  the "only one Outcome popup visible at a time" rule. The trigger
   *  button below still owns its own click handling/position capture, it
   *  just reports the open request upward instead of flipping local state. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `appliedChannels` reflects whether the agent left "Outcome All" off
   *  (just `elevated.currentChannel`) or switched it on (every channel in
   *  `elevated.allChannels`) — empty on a non-elevated card. */
  onApprove?: (outcome: OutcomeResult, appliedChannels: OutcomeChannelRef[]) => void;
}

const PANEL_WIDTH = 360;
// Tall enough that Resolution/Tags/Disposition/Summary (now 8 rows, doubled
// from the original 4) are all visible without scrolling the form's own
// internal overflow area on a typical laptop screen.
const PANEL_DEFAULT_HEIGHT = 720;

export function OutcomeButton({ customerName, elevated, open, onOpenChange, onApprove }: OutcomeButtonProps) {
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
    onOpenChange(true);
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
        <CircleCheckBig className="h-4 w-4 text-lyra-status-info-strong" strokeWidth={2} />
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
              defaultHeight={PANEL_DEFAULT_HEIGHT}
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
                  onClose={() => onOpenChange(false)}
                />
              )}
            >
              <OutcomeForm
                customerName={customerName}
                onCancel={() => onOpenChange(false)}
                onApprove={(outcome, appliedChannels) => {
                  onApprove?.(outcome, appliedChannels);
                  onOpenChange(false);
                }}
                elevated={elevated ? { ...elevated, defaultToAll: false } : undefined}
              />
            </Draggable>
          </div>,
          document.body
        )}
    </>
  );
}

/* ── OutcomeAllPanel ──
 * The Elevation card's "Outcome All" kebab item (see `InteractionNavItem`'s
 * `onOutcomeAll` prop / lyra-ui's `buildElevatedMenuItems`) — same wrap-up
 * form as `OutcomeButton` above (including its "Outcome All" toggle — see
 * `ElevatedOutcomeContext`), just starting with that toggle already on
 * (every channel) instead of off (one channel), since that's what this
 * particular entry point is for. The agent can still flip it back off from
 * here to narrow down to just `currentChannel`, the same as opening the
 * single-channel `OutcomeButton` would have shown to begin with — the two
 * entry points converge on the same form once open, they just start from
 * opposite ends of the same toggle. Controlled (`open`/`onOpenChange`), not
 * a self-contained trigger+panel like `OutcomeButton` — its trigger is a
 * menu item buried inside `InteractionNavItem`'s collapsed summary row, not
 * a button this component owns a ref to. The consumer instead measures the
 * Elevation card itself (see `anchorRect`) and passes that rect down, so
 * this panel opens right next to the card that triggered it, the same way
 * `OutcomeButton` opens right under its own trigger button; falls back to
 * centering in the viewport if no rect is available. */

export interface OutcomeAllPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Shown in the panel's title and seeded into the AI-suggested summary,
   *  same as `OutcomeButtonProps.customerName`. */
  customerName: string;
  /** Every channel currently open on this card. */
  channels: OutcomeChannelRef[];
  /** Which of `channels` the toggle narrows back down to if the agent
   *  switches "Outcome All" off. Falls back to `channels[0]` if omitted —
   *  there's always *some* channel to narrow to as long as `channels` is
   *  non-empty. */
  currentChannel?: OutcomeChannelRef;
  /** The Elevation card's own bounding rect (from the left-rail
   *  `InteractionNavItem`), captured by the consumer at the moment "Outcome
   *  All" is chosen — positions this panel just to the right of that card.
   *  Omit (e.g. the card scrolled out of view/unmounted) to fall back to
   *  centering in the viewport instead. */
  anchorRect?: { top: number; right: number } | null;
  /** `appliedChannels` reflects whether the agent left "Outcome All" on
   *  (every channel in `channels`) or switched it off (just the narrowed-to
   *  channel). */
  onApprove?: (outcome: OutcomeResult, appliedChannels: OutcomeChannelRef[]) => void;
}

export function OutcomeAllPanel({ open, onOpenChange, customerName, channels, currentChannel, anchorRect, onApprove }: OutcomeAllPanelProps) {
  const floatPos = useRef<{ top: number; left: number } | null>(null);
  if (open && !floatPos.current) {
    floatPos.current = anchorRect
      ? {
          top: Math.min(Math.max(24, anchorRect.top), window.innerHeight - 240),
          left: Math.min(anchorRect.right + 8, window.innerWidth - PANEL_WIDTH - 16),
        }
      : {
          top: Math.max(24, (window.innerHeight - PANEL_DEFAULT_HEIGHT) / 2),
          left: Math.max(24, (window.innerWidth - PANEL_WIDTH) / 2),
        };
  }
  if (!open && floatPos.current) {
    floatPos.current = null;
  }

  if (!open || !floatPos.current) return null;

  return createPortal(
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
        defaultHeight={PANEL_DEFAULT_HEIGHT}
        minWidth={320}
        minHeight={420}
        className="rounded-lyra-lg border border-lyra-border-subtle bg-lyra-bg-surface-overlay shadow-lg"
        renderHeaderControls={({ gripProps }) => (
          <ContainerHeader
            title={`Outcome All · ${customerName}`}
            icon={
              <div {...gripProps}>
                <GripVertical className="h-4 w-4" strokeWidth={1.5} />
              </div>
            }
            onClose={() => onOpenChange(false)}
          />
        )}
      >
        <OutcomeForm
          customerName={customerName}
          onCancel={() => onOpenChange(false)}
          onApprove={(outcome, appliedChannels) => {
            onApprove?.(outcome, appliedChannels);
            onOpenChange(false);
          }}
          elevated={
            channels.length > 0
              ? { currentChannel: currentChannel ?? channels[0], allChannels: channels, defaultToAll: true }
              : undefined
          }
        />
      </Draggable>
    </div>,
    document.body
  );
}
