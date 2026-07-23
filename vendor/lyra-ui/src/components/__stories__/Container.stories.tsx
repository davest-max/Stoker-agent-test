import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Container } from "../container";
import { Button } from "../button";
import { Input } from "../input";

const ALL_VARIANTS = [
  "default",
  "info-none",     "info-subtle",    "info-strong",    "info-dotted",
  "success-none",  "success-subtle", "success-strong", "success-dotted",
  "warning-none",  "warning-subtle", "warning-solid",  "warning-dotted",
  "error-none",    "error-subtle",   "error-strong",   "error-dotted",
  "neutral-none",  "neutral-subtle", "neutral-strong", "neutral-dotted",
  "popover", "modal",
] as const;

const meta: Meta<typeof Container> = {
  title: "Atoms/Container",
  component: Container,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    backgrounds: { default: "lyra-shell" },
  },
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Container>;

/* ── Interactive (controlled via Storybook controls) ── */
export const Default: Story = {
  name: "Default",
  args: {
    variant: "default",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ALL_VARIANTS,
      description: "Color and border style. Format: {color}-{border-style}",
    },
  },
  render: (args) => (
    <Container {...args} headerTitle="Container" className="pb-5">
      <p className="lyra-body-md text-lyra-fg-secondary px-5">
        Use the Controls panel below to switch variant, background and border combinations.
      </p>
    </Container>
  ),
};

// Modal stories moved to Atoms/Modal

// Popover story moved to Atoms/Popover

// Panel stories moved to UI/Panel

export const Nested: Story = {
  name: "Nested Layout",
  render: () => (
    <div className="flex flex-col gap-4">
      <Container headerTitle="Header Section" className="pb-5">
        <p className="lyra-body-md text-lyra-fg-secondary px-5">Top-level container.</p>
      </Container>
      <div className="flex gap-4">
        <Container headerTitle="Left Panel" className="flex-1 pb-5">
          <p className="lyra-body-md text-lyra-fg-secondary px-5">Side content area.</p>
        </Container>
        <Container headerTitle="Main Content" className="flex-[2] pb-5">
          <p className="lyra-body-md text-lyra-fg-secondary px-5">Primary content area.</p>
        </Container>
      </div>
    </div>
  ),
};

/* ── Semantic colour variants ── */

export const InfoVariant: Story = {
  name: "Info (blue)",
  render: () => (
    <Container variant="info" className="p-5 max-w-sm">
      <p className="lyra-body-md text-lyra-fg-active-strong">
        AI Confidence: 78% — Based on 3 similar resolved cases and firmware documentation match.
      </p>
    </Container>
  ),
};

export const SuccessVariant: Story = {
  name: "Success (green)",
  render: () => (
    <Container variant="success" className="p-5 max-w-sm">
      <p className="lyra-body-md text-lyra-status-success-strong">
        Jordan's case has been successfully resolved. Configuration backed up.
      </p>
    </Container>
  ),
};

export const WarningVariant: Story = {
  name: "Warning (dotted amber)",
  render: () => (
    <Container variant="warning" className="p-5 max-w-sm">
      <p className="lyra-body-sm-emphasis text-lyra-status-warning-strong uppercase tracking-wide mb-1">
        Internal Note
      </p>
      <p className="lyra-body-md text-lyra-status-warning-strong">
        Awaiting Human Agent intervention — click to review AI recommendation.
      </p>
    </Container>
  ),
};

export const CriticalVariant: Story = {
  name: "Critical (red)",
  render: () => (
    <Container variant="critical" className="p-5 max-w-sm">
      <p className="lyra-body-md text-lyra-status-critical-strong">
        Action failed. Please review and try again.
      </p>
    </Container>
  ),
};

export const NeutralFlat: Story = {
  name: "Neutral flat (no border)",
  render: () => (
    <Container variant="neutral-flat" className="p-5 max-w-sm">
      <p className="lyra-heading-md text-lyra-fg-default mb-1">Welcome Back, Sarah Jones</p>
      <p className="lyra-body-sm text-lyra-fg-secondary">Last login Wed, Jun 3, 4:50 PM</p>
    </Container>
  ),
};

export const NeutralCard: Story = {
  name: "Neutral card (with border)",
  render: () => (
    <Container variant="neutral-card" className="p-5 max-w-sm">
      <p className="lyra-heading-md text-lyra-fg-default mb-1">Total Scenarios</p>
      <p className="text-[40px] font-bold text-lyra-fg-default leading-none">519</p>
      <p className="lyra-body-sm text-lyra-fg-secondary mt-2">Completed simulation runs</p>
    </Container>
  ),
};

export const AllColorVariants: Story = {
  name: "All Colour Variants",
  render: () => {
    const groups = [
      { label: "Info",    variants: ["info-none", "info-subtle", "info-strong", "info-dotted"] },
      { label: "Success", variants: ["success-none", "success-subtle", "success-strong", "success-dotted"] },
      { label: "Warning", variants: ["warning-none", "warning-subtle", "warning-solid", "warning-dotted"] },
      { label: "Error",   variants: ["error-none", "error-subtle", "error-strong", "error-dotted"] },
      { label: "Neutral", variants: ["neutral-none", "neutral-subtle", "neutral-strong", "neutral-dotted"] },
    ] as const;
    return (
      <div className="flex flex-col gap-6 w-full max-w-3xl">
        {groups.map(({ label, variants }) => (
          <div key={label}>
            <p className="lyra-label text-lyra-fg-secondary mb-2">{label}</p>
            <div className="grid grid-cols-4 gap-3">
              {variants.map(v => (
                <Container key={v} variant={v} className="px-3 py-3">
                  <p className="lyra-body-sm text-lyra-fg-default">{v}</p>
                </Container>
              ))}
            </div>
          </div>
        ))}
        <div>
          <p className="lyra-label text-lyra-fg-secondary mb-2">Base surfaces</p>
          <div className="grid grid-cols-3 gap-3">
            {(["default", "popover", "modal"] as const).map(v => (
              <Container key={v} variant={v} className="px-3 py-3">
                <p className="lyra-body-sm text-lyra-fg-default">{v}</p>
              </Container>
            ))}
          </div>
        </div>
      </div>
    );
  },
};
