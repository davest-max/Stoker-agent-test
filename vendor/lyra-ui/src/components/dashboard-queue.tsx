import * as React from "react";
import { Clock, type LucideIcon } from "lucide-react";
import { Accordion } from "./accordion";
import { Container } from "./container";
import { DashboardCard, Metric } from "./dashboard-card";
import { Icon } from "./icon";
import { cn } from "../lib/utils";

/* ── DashboardQueue ──
   A row of queue-type summary widgets — e.g. "Digital" / "Inbound Voice" /
   "Voicemail" / "Work Item" on a contact center home screen, each showing
   how many Contacts and Agents (cards) or Skills and Contacts (accordion —
   see below) are queued. Two interchangeable layouts, same `items` data,
   picked with `variant`:

   1. "cards" (default) — each queue renders as its own standalone
      `DashboardCard` (a "hero" `Icon` for the queue's own type — Digital,
      Inbound Voice, Voicemail, Work Item, etc. — + name + "Wait Time:
      {wait}" header, Contacts/Agents as "contained" metrics) — no shared
      enclosing backdrop; each card carries its own `neutral-subtle`
      surface. Laid
      out via `.lyra-container-grid-wrap`/`.lyra-container-grid` (see
      lyra-tokens.css) — the same CSS container-query pattern the home
      tab's Activity/Performance/Productivity row uses — so this row
      collapses to a stacked column once its own available width gets
      tight, same as that one, rather than staying a fixed N-column grid
      that squeezes its cards (and their metric numbers/labels) into an
      unreadably narrow space. Clicking a card selects it
      (`selectedId`/`onSelect`, controlled/uncontrolled like `FilterChip`'s
      own selection prop) — the selected card gets the `info-strong` (blue)
      `Container` treatment instead. Built for a click-to-drill-down
      pattern (e.g. opening a side panel with that queue's own
      sub-queues), but `DashboardQueue` itself only reports the selection;
      anything opened as a result of it is the consumer's concern, not
      this component's.
   2. "accordion" — the same queue list as expandable `Accordion` rows
      instead of a card grid: icon + name + "{contactsCount} contacts in
      queue" / "Wait: {wait}" subhead, with the Skills/Contacts metrics
      moved into the row's `endSlot` (same `Container` + `Metric`
      composition as the "cards" variant uses, just smaller and inline).
      Each item's optional `content` becomes what's shown when its row
      expands — e.g. a table of that queue's individual interactions.

   Both variants compose existing atoms (`DashboardCard`/`Metric`,
   `Accordion`, `Container`) rather than re-deriving card/row markup, per
   "composition over reimplementation." See the "QueueCards" and
   "QueueAccordion" stories, each modeled on a specific reference
   screenshot. */

export interface DashboardQueueItem {
  /** Unique identifier — used for `selectedId`/`onSelect` (cards) and as the Accordion item id (accordion). */
  id: string;
  /** Queue name, e.g. "Digital". */
  name: string;
  /** The queue's own type icon (e.g. `MessageSquare` for Digital, `PhoneIncoming` for Inbound Voice) — rendered as a "hero" `Icon` (`background="active"`, matching the home tab's Activity widget) in the "cards" header, and as the plain row icon in "accordion". */
  icon: LucideIcon;
  /** Wait time string, e.g. "1m" or "00:02:34" — pass whatever format the consumer wants displayed; `DashboardQueue` renders it as-is. Shown as "Wait Time: {wait}" (cards) or "Wait: {wait}" (accordion). */
  wait: string;
  /** "Skills" metric value — "accordion" variant only (see "cards" below). */
  skillsCount: number;
  /** "Contacts" metric value — the "cards" variant's first metric, and also drives "accordion"'s "{n} contacts in queue" subhead line. */
  contactsCount: number;
  /** "Agents" metric value — "cards" variant's second metric (replaces "accordion"'s "Skills" metric, which stays keyed off `skillsCount`). */
  agentsCount: number;
  /** "accordion" variant only — rendered when the row is expanded. Omit for a row with nothing to expand into. */
  content?: React.ReactNode;
}

export type DashboardQueueVariant = "cards" | "accordion";

export interface DashboardQueueProps {
  items: DashboardQueueItem[];
  /** "cards" (default) or "accordion" — see the class doc comment above. */
  variant?: DashboardQueueVariant;
  /**
   * "cards" variant only. Which item is selected — uncontrolled (manages
   * its own selection) by default; pass this alongside `onSelect` to
   * control it from outside (e.g. to keep a side panel's open queue in
   * sync). `null` means nothing selected.
   */
  selectedId?: string | null;
  /**
   * "cards" variant only. Called with the *resolved* next selection
   * (clicking the already-selected card resolves to `null`, toggling it
   * off) — mirrors `FilterChip`'s own controlled-value pattern, so a
   * consumer can pass this straight to a `useState` setter.
   */
  onSelect?: (id: string | null) => void;
  className?: string;
}

const DashboardQueue = React.forwardRef<HTMLDivElement, DashboardQueueProps>(
  ({ items, variant = "cards", selectedId, onSelect, className }, ref) => {
    const [internalSelectedId, setInternalSelectedId] = React.useState<string | null>(null);
    const currentSelectedId = selectedId !== undefined ? selectedId : internalSelectedId;

    const handleItemClick = (id: string) => {
      const next = currentSelectedId === id ? null : id;
      if (selectedId === undefined) setInternalSelectedId(next);
      onSelect?.(next);
    };

    if (variant === "accordion") {
      return (
        <Accordion
          ref={ref}
          type="multiple"
          className={cn(
            "rounded-lyra-lg border border-lyra-border-subtle bg-lyra-bg-surface-base overflow-hidden",
            className
          )}
          items={items.map((item) => ({
            id: item.id,
            icon: <item.icon className="h-5 w-5" strokeWidth={1.5} />,
            // lyra-heading-md — same title typography a DashboardCard's own
            // header uses, so a queue row's name reads at the same weight/
            // size as a card header title.
            title: <span className="lyra-heading-md">{item.name}</span>,
            subhead: (
              <span className="flex flex-col gap-0.5">
                <span className="lyra-body-md text-lyra-fg-default">{item.contactsCount} contacts in queue</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" strokeWidth={1.5} />
                  Wait: {item.wait}
                </span>
              </span>
            ),
            endSlot: (
              <>
                {/* "Contained" metric look — same composition the "cards"
                    variant uses (Container wrapping a Metric), just
                    smaller and inline instead of filling a card body.
                    "neutral-subtle" reads as a quieter, secondary surface
                    against the row's own white background. */}
                <Container variant="neutral-subtle" className="flex min-w-[150px] p-4">
                  <Metric metric={{ value: item.skillsCount, label: "Skills" }} />
                </Container>
                <Container variant="neutral-subtle" className="flex min-w-[150px] p-4">
                  <Metric metric={{ value: item.contactsCount, label: "Contacts" }} />
                </Container>
              </>
            ),
            content: item.content ?? null,
          }))}
        />
      );
    }

    return (
      // Reuses the same `.lyra-container-grid-wrap`/`.lyra-container-grid`
      // pattern the home tab's Activity/Performance/Productivity row uses
      // (see lyra-tokens.css) rather than a bespoke dynamic-column grid —
      // it already does exactly what this row needs (any number of equal-
      // width flex children, collapsing to a stacked column via a CSS
      // container query once the row's own available width gets tight,
      // not the browser viewport's), and reusing it means both rows
      // collapse the same way instead of one having its own one-off
      // responsive behavior the other lacks.
      <div ref={ref} className={cn("lyra-container-grid-wrap", className)}>
        <div className="lyra-container-grid">
          {items.map((item) => (
            <DashboardCard
              key={item.id}
              // "neutral-subtle" (a quiet gray surface) unselected,
              // "info-strong" (blue) selected — no shared wrapper carries a
              // background of its own here, so each card owns its own
              // surface instead.
              variant={currentSelectedId === item.id ? "info-strong" : "neutral-subtle"}
              // "Hero" Icon for the queue's own type (Digital, Inbound
              // Voice, etc.) — same `background="active"` treatment the
              // home tab's Activity widget uses for its own header icon,
              // rather than a plain unstyled glyph.
              headerIcon={<Icon icon={item.icon} size="md" background="active" shape="rounded" decorative />}
              headerTitle={item.name}
              headerSubhead={`Wait Time: ${item.wait}`}
              metrics={[
                { value: item.contactsCount, label: "Contacts" },
                { value: item.agentsCount, label: "Agents" },
              ]}
              metricVariant="contained"
              role="button"
              tabIndex={0}
              aria-pressed={currentSelectedId === item.id}
              onClick={() => handleItemClick(item.id)}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleItemClick(item.id);
                }
              }}
              className="cursor-pointer text-left"
            />
          ))}
        </div>
      </div>
    );
  }
);
DashboardQueue.displayName = "DashboardQueue";

export { DashboardQueue };
