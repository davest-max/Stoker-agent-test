import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { Container } from "../container";
import { InteriorPanel } from "../interior-panel";
import {
  AgentDashboard,
  AgentDashboardQueueDrilldown,
  AGENT_DASHBOARD_QUEUE_ITEMS,
  AGENT_DASHBOARD_QUEUE_SUB_ITEMS,
  type AgentDashboardContactHistoryEntry,
} from "../agent-dashboard";

/* ── Dashboards template ──
   The Agent Next Gen "Home" tab, promoted out of agent-next-gen-v1's own
   hand-built page into a real shared component (`AgentDashboard`, see
   agent-dashboard.tsx) — this story is just that component dropped into a
   minimal page shell (a `Container` plus a right-side `InteriorPanel` for
   the queue drill-down; no `PageHeader`/tabs — those are the consuming page's own
   chrome, not part of this template). Every other "Agent Next Gen" consumer
   (agent-next-gen-v1, `lyra-ux-templates`, and this library's own
   `Templates/Agent Next Gen` story) can render the identical
   `<AgentDashboard>` for their own Home tab instead of hand-copying this
   page's content — see `AgentDashboard`'s own doc comment for the full
   rationale.

   Placed directly below `Templates/Data Management` in the sidebar via
   `.storybook/preview.ts`'s explicit `storySort` order (alphabetically
   "Dashboards" would sort *before* "Data Management" — "Das" < "Dat" — so
   without that explicit order this would land in the wrong spot). */

function DashboardsTemplate() {
  const [selectedQueueId, setSelectedQueueId] = useState<string | null>(null);

  return (
    <div className="flex h-screen bg-lyra-bg-surface-shell overflow-hidden p-3">
      <Container className="flex flex-1 overflow-hidden relative">
        <div className="flex flex-1 flex-col min-w-0 overflow-y-auto px-6 py-6">
          <AgentDashboard
            agentFirstName="John"
            onRedial={(entry: AgentDashboardContactHistoryEntry) => {
              // eslint-disable-next-line no-console
              console.log("Redial:", entry.name);
            }}
            selectedQueueId={selectedQueueId}
            onSelectQueueId={setSelectedQueueId}
          />
        </div>
        <InteriorPanel
          side="right"
          open={Boolean(selectedQueueId)}
          headerTitle={
            selectedQueueId
              ? AGENT_DASHBOARD_QUEUE_ITEMS.find((item) => item.id === selectedQueueId)?.name ?? "Queue"
              : "Queue"
          }
          headerSubhead={
            selectedQueueId
              ? `${(AGENT_DASHBOARD_QUEUE_SUB_ITEMS[selectedQueueId] ?? []).length} Skills`
              : undefined
          }
          onClose={() => setSelectedQueueId(null)}
        >
          {selectedQueueId && <AgentDashboardQueueDrilldown queueId={selectedQueueId} />}
        </InteriorPanel>
      </Container>
    </div>
  );
}

/* ── Storybook Meta ── */

const meta: Meta<typeof DashboardsTemplate> = {
  title: "Templates/Dashboards",
  component: DashboardsTemplate,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "lyra-shell" },
  },
};

export default meta;
type Story = StoryObj<typeof DashboardsTemplate>;

export const Default: Story = {
  name: "Dashboards",
  render: () => <DashboardsTemplate />,
};
