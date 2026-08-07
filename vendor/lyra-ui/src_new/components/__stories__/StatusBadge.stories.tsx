import type { Meta, StoryObj } from "@storybook/react";
import { StatusBadge } from "../status-badge";

const meta: Meta<typeof StatusBadge> = {
  title: "Atoms/StatusBadge",
  component: StatusBadge,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    backgrounds: { default: "lyra-shell" },
  },
  argTypes: {
    variant: { control: "select", options: ["default", "info", "success", "warning", "critical", "neutral"] },
    size:    { control: "select", options: ["sm", "md", "lg"] },
    count:   { control: { type: "number" } },
    max:     { control: { type: "number" } },
    dot:     { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof StatusBadge>;

/* ── Interactive ── */
export const Default: Story = {
  args: { count: 5, variant: "default", size: "md" },
};

/* ── All variants ── */
export const Variants: Story = {
  name: "All Variants",
  render: () => (
    <div className="flex flex-col gap-6">
      {/* Number badges */}
      <div>
        <p className="lyra-label text-lyra-fg-secondary mb-3">Number badges</p>
        <div className="flex items-center gap-3 flex-wrap">
          {(["default", "info", "success", "warning", "critical", "neutral"] as const).map((v) => (
            <div key={v} className="flex flex-col items-center gap-1">
              <StatusBadge variant={v} count={7} />
              <span className="lyra-body-xs text-lyra-fg-secondary capitalize">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Dot badges */}
      <div>
        <p className="lyra-label text-lyra-fg-secondary mb-3">Dot badges</p>
        <div className="flex items-center gap-4 flex-wrap">
          {(["default", "info", "success", "warning", "critical", "neutral"] as const).map((v) => (
            <div key={v} className="flex flex-col items-center gap-1">
              <StatusBadge variant={v} dot size="md" />
              <span className="lyra-body-xs text-lyra-fg-secondary capitalize">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

/* ── Sizes ── */
export const Sizes: Story = {
  name: "Sizes",
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <p className="lyra-label text-lyra-fg-secondary mb-3">Number — sm / md / lg</p>
        <div className="flex items-end gap-4">
          {(["sm", "md", "lg"] as const).map((s) => (
            <div key={s} className="flex flex-col items-center gap-1">
              <StatusBadge size={s} count={12} />
              <span className="lyra-body-xs text-lyra-fg-secondary">{s}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="lyra-label text-lyra-fg-secondary mb-3">Dot — sm / md / lg</p>
        <div className="flex items-end gap-4">
          {(["sm", "md", "lg"] as const).map((s) => (
            <div key={s} className="flex flex-col items-center gap-1">
              <StatusBadge variant="critical" dot size={s} />
              <span className="lyra-body-xs text-lyra-fg-secondary">{s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

/* ── Overflow ── */
export const Overflow: Story = {
  name: "Count overflow (max cap)",
  render: () => (
    <div className="flex items-end gap-4">
      <div className="flex flex-col items-center gap-1">
        <StatusBadge count={5} />
        <span className="lyra-body-xs text-lyra-fg-secondary">5</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <StatusBadge count={99} />
        <span className="lyra-body-xs text-lyra-fg-secondary">99</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <StatusBadge count={100} />
        <span className="lyra-body-xs text-lyra-fg-secondary">100 → 99+</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <StatusBadge count={999} max={999} />
        <span className="lyra-body-xs text-lyra-fg-secondary">custom max 999</span>
      </div>
    </div>
  ),
};

/* ── Positioned on an element ── */
export const PositionedOnIcon: Story = {
  name: "Positioned on element",
  render: () => (
    <div className="flex items-center gap-8">
      {/* Bell with count */}
      <div className="relative inline-flex">
        <div className="w-10 h-10 rounded-lyra-sm bg-lyra-bg-surface-base border border-lyra-border-subtle flex items-center justify-center">
          <svg className="w-5 h-5 text-lyra-fg-default" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
          </svg>
        </div>
        <StatusBadge
          count={3}
          variant="critical"
          size="sm"
          className="absolute -top-1.5 -right-1.5"
        />
      </div>

      {/* Avatar with dot status */}
      <div className="relative inline-flex">
        <div className="w-10 h-10 rounded-full bg-lyra-bg-active-subtle flex items-center justify-center lyra-label text-lyra-fg-active-strong">
          JD
        </div>
        <StatusBadge
          dot
          variant="success"
          size="sm"
          className="absolute bottom-0 right-0 ring-2 ring-lyra-bg-surface-base"
        />
      </div>

      {/* Avatar offline */}
      <div className="relative inline-flex">
        <div className="w-10 h-10 rounded-full bg-lyra-bg-surface-container-subtle flex items-center justify-center lyra-label text-lyra-fg-secondary">
          AB
        </div>
        <StatusBadge
          dot
          variant="neutral"
          size="sm"
          className="absolute bottom-0 right-0 ring-2 ring-lyra-bg-surface-base"
        />
      </div>
    </div>
  ),
};

/* ── Text content ── */
export const TextContent: Story = {
  name: "Text / custom content",
  render: () => (
    <div className="flex items-center gap-3 flex-wrap">
      <StatusBadge variant="success">New</StatusBadge>
      <StatusBadge variant="warning">Beta</StatusBadge>
      <StatusBadge variant="info">Pro</StatusBadge>
      <StatusBadge variant="critical">!</StatusBadge>
      <StatusBadge variant="neutral" size="lg">Draft</StatusBadge>
    </div>
  ),
};
