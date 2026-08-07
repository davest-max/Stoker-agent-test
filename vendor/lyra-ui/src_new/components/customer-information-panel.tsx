import * as React from "react";
import { SidePanel, type SidePanelProps } from "./side-panel";

/* ── Types ── */

export interface CustomerInformationPerson {
  /** Full display name, e.g. "Sarah Miller" — customer or agent. */
  name: string;
  /** Record identifier, e.g. "CST-10591" or "AGT-2003". */
  id: string;
}

export interface CustomerInformationPanelProps
  extends Omit<SidePanelProps, "headerTitle" | "headerSubhead"> {
  /**
   * The customer (or agent, on an agent-to-agent interaction) this panel's
   * header subhead describes — rendered as "{name} · {id}" below the
   * "Customer Information" title.
   */
  person: CustomerInformationPerson;
}

/* ── Component ── */

/**
 * The record-header "Designer" side panel, specialized for showing
 * customer (or agent) information — same `SidePanel` pin/hover/resize
 * behavior and animation (see `SidePanel.stories.tsx`), just with a fixed
 * "Customer Information" header title and a "{name} · {id}" subhead
 * computed from `person`. Use this instead of a bare
 * `<SidePanel headerTitle="Designer" .../>` wherever the panel's purpose is
 * showing who the current interaction is with.
 */
const CustomerInformationPanel = React.forwardRef<HTMLDivElement, CustomerInformationPanelProps>(
  ({ person, side = "left", ...props }, ref) => (
    <SidePanel
      ref={ref}
      side={side}
      headerTitle="Customer Information"
      headerSubhead={`${person.name} · ${person.id}`}
      {...props}
    />
  )
);
CustomerInformationPanel.displayName = "CustomerInformationPanel";

export { CustomerInformationPanel };
