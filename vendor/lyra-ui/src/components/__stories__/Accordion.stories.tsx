import type { Meta, StoryObj } from "@storybook/react";
import { Box, Clock } from "lucide-react";
import { Accordion } from "../accordion";
import { Tag } from "../tag";
import { Metric } from "../dashboard-card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../table";

const meta: Meta<typeof Accordion> = {
  title: "Atoms/Accordion",
  component: Accordion,
  tags: ["autodocs"],
  parameters: { layout: "padded", backgrounds: { default: "lyra-shell" } },
};

export default meta;
type Story = StoryObj<typeof Accordion>;

const icon = <Box className="h-5 w-5" strokeWidth={1.5} />;

const sampleItems = [
  {
    id: "1",
    title: "Section Title",
    icon,
    content: (
      <p className="lyra-body-md text-lyra-fg-secondary">
        Content for section 1. This area expands when the item is opened.
      </p>
    ),
  },
  {
    id: "2",
    title: "Section Title",
    icon,
    content: (
      <p className="lyra-body-md text-lyra-fg-secondary">
        Content for section 2. Any React node can go here.
      </p>
    ),
  },
  {
    id: "3",
    title: "Section Title",
    icon,
    content: (
      <p className="lyra-body-md text-lyra-fg-secondary">
        Content for section 3.
      </p>
    ),
  },
];

/* ── Screenshot 1 — all closed ── */

export const Default: Story = {
  render: () => <Accordion items={sampleItems} />,
};

/* ── Screenshot 2 states ── */

export const AllStates: Story = {
  name: "All States",
  render: () => (
    <Accordion
      type="multiple"
      defaultValues={["2"]}
      items={[
        { ...sampleItems[0] },
        { ...sampleItems[1] },
        {
          id: "disabled",
          title: "Section Title",
          icon,
          disabled: true,
          content: null,
        },
      ]}
    />
  ),
};

export const SingleOpen: Story = {
  name: "Single — One Open",
  render: () => (
    <Accordion items={sampleItems} defaultValue="1" />
  ),
};

export const MultipleOpen: Story = {
  name: "Multiple — Many Open",
  render: () => (
    <Accordion
      type="multiple"
      defaultValues={["1", "3"]}
      items={sampleItems}
    />
  ),
};

export const WithDisabledItem: Story = {
  name: "With Disabled Item",
  render: () => (
    <Accordion
      items={[
        sampleItems[0],
        { ...sampleItems[1], disabled: true },
        sampleItems[2],
      ]}
      defaultValue="1"
    />
  ),
};

export const NoIcons: Story = {
  name: "No Icons",
  render: () => (
    <Accordion
      items={sampleItems.map(({ icon: _icon, ...item }) => item)}
      defaultValue="2"
    />
  ),
};


export const WithSubhead: Story = {
  name: "With Subhead",
  render: () => (
    <Accordion
      items={[
        {
          id: "1",
          title: "Section Title",
          subhead: "Supporting description text",
          icon,
          content: <p className="lyra-body-md text-lyra-fg-secondary">Content for section 1.</p>,
        },
        {
          id: "2",
          title: "Section Title",
          subhead: "Supporting description text",
          icon,
          content: <p className="lyra-body-md text-lyra-fg-secondary">Content for section 2.</p>,
        },
        {
          id: "3",
          title: "Section Title",
          subhead: "Supporting description text",
          icon,
          disabled: true,
          content: null,
        },
      ]}
    />
  ),
};

/* ── Rich content: title/subhead accept ReactNode (e.g. name + Tag, multi-line
   summary), and content can be any component — here a Default-style Table ── */

const richInteractions = [
  { id: "1", when: "09/05/25 7:53 PM", agent: "Kevin Jensen",  status: "Closed", queue: "CXi SME Email", skill: "Email_General" },
  { id: "2", when: "09/05/25 8:11 PM", agent: "Andres Arenas", status: "Closed", queue: "Chat_General",  skill: "Chat_General"  },
  { id: "3", when: "09/07/25 12:56 PM", agent: "KrishnaCharan Mohanrao", status: "Closed", queue: "CXi SME Email", skill: "Email_General" },
];

export const WithRichHeaderAndTable: Story = {
  name: "Rich Header + Table Content",
  render: () => (
    <Accordion
      defaultValue="1"
      items={[
        {
          id: "1",
          title: (
            <span className="inline-flex items-center gap-2">
              Lily Chen
              <Tag label="open" variant="success" shape="pill" />
            </span>
          ),
          subhead: (
            <span className="flex flex-col gap-0.5">
              <span className="lyra-body-md text-lyra-fg-default">
                Unaccompanied minor (age 11) stuck at ORD — connecting flight canceled
              </span>
              <span className="inline-flex items-center gap-1">
                Atlas
                <span aria-hidden="true">•</span>
                <Clock className="h-3 w-3" strokeWidth={1.5} />
                Wait: 1m
                <span aria-hidden="true">•</span>
                CST-21009
              </span>
            </span>
          ),
          content: (
            <div className="rounded-lyra-lg border border-lyra-border-subtle overflow-hidden" style={{ height: 160 }}>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="flex-1">Date/Time</TableHead>
                    <TableHead className="flex-[1.3]">Name</TableHead>
                    <TableHead className="flex-1">Status</TableHead>
                    <TableHead className="flex-[1.3]">Queue</TableHead>
                    <TableHead className="flex-[1.3]">Skill</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {richInteractions.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="flex-1">{row.when}</TableCell>
                      <TableCell className="flex-[1.3]">{row.agent}</TableCell>
                      <TableCell className="flex-1">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-lyra-status-critical-strong shrink-0" aria-hidden="true" />
                          {row.status}
                        </span>
                      </TableCell>
                      <TableCell className="flex-[1.3]">{row.queue}</TableCell>
                      <TableCell className="flex-[1.3]">{row.skill}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ),
        },
      ]}
    />
  ),
};

/* ── endSlot — e.g. a couple of `Metric`s (`DashboardCard`'s own value+label
   block, exported standalone) inline with a queue row, between the
   title/subhead and the chevron. Rendered inside the same trigger button as
   the rest of the row; see the doc comment on `endSlot` in accordion.tsx
   for why it should stay display-only. `className="flex-none"` drops
   `Metric`'s default `flex-1` — correct inside `DashboardCard`'s own equal-
   width columns, not here where it should size to its own content. ── */

export const WithEndSlot: Story = {
  name: "With End Slot (Metrics)",
  render: () => (
    <Accordion
      items={[
        {
          id: "1",
          title: "Digital",
          subhead: "12 contacts in queue",
          endSlot: (
            <>
              <Metric className="flex-none" metric={{ value: 4, label: "Skills" }} />
              <Metric className="flex-none" metric={{ value: 8, label: "Contacts" }} />
            </>
          ),
          content: <p className="lyra-body-md text-lyra-fg-secondary">Content for section 1.</p>,
        },
        {
          id: "2",
          title: "Inbound Voice",
          subhead: "5 contacts in queue",
          endSlot: (
            <>
              <Metric className="flex-none" metric={{ value: 2, label: "Skills" }} />
              <Metric className="flex-none" metric={{ value: 5, label: "Contacts" }} />
            </>
          ),
          content: <p className="lyra-body-md text-lyra-fg-secondary">Content for section 2.</p>,
        },
      ]}
    />
  ),
};
