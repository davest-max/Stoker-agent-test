import type { Meta, StoryObj } from "@storybook/react";
import { Textarea } from "../textarea";

const meta: Meta<typeof Textarea> = {
  title: "Atoms/Textarea",
  component: Textarea,
  tags: ["autodocs"],
  parameters: { layout: "padded", backgrounds: { default: "lyra-shell" } },
};

export default meta;
type Story = StoryObj<typeof Textarea>;

/* ── SOL-matched stories ── */

export const Default: Story = {
  name: "Default",
  render: () => (
    <Textarea
      label="Input Label"
      placeholder="Placeholder"
      maxLength={100}
      rows={4}
    />
  ),
};

export const WithValue: Story = {
  name: "With Value",
  render: () => (
    <Textarea
      label="Input Label"
      maxLength={100}
      defaultValue="Text"
      rows={4}
    />
  ),
};

export const WithErrorMessage: Story = {
  name: "With Error Message",
  render: () => (
    <Textarea
      label="Input Label"
      maxLength={100}
      error="Required"
      rows={4}
    />
  ),
};

/* ── All states (matching screenshot order) ── */

export const AllStates: Story = {
  name: "All States",
  render: () => (
    <div className="flex flex-col gap-6 max-w-sm">
      {/* Default */}
      <Textarea
        label="Input Label"
        placeholder="Placeholder"
        maxLength={100}
        rows={4}
      />

      {/* Hover — shown via CSS on hover; static preview uses same styling */}
      <Textarea
        label="Input Label"
        placeholder="Placeholder"
        maxLength={100}
        rows={4}
        className="[&_textarea]:border-lyra-state-border-hover-neutral"
      />

      {/* Active / Focus */}
      <Textarea
        label="Input Label"
        placeholder="Placeholder"
        maxLength={100}
        rows={4}
        className="[&_textarea]:border-lyra-border-active [&_textarea]:ring-2 [&_textarea]:ring-lyra-border-active/20"
      />

      {/* ReadOnly */}
      <Textarea
        label="Input Label"
        placeholder="Placeholder"
        maxLength={100}
        rows={4}
        readonly
      />

      {/* Disabled */}
      <Textarea
        label="Input Label"
        placeholder="Placeholder"
        maxLength={100}
        rows={4}
        disabled
      />

      {/* Error */}
      <Textarea
        label="Input Label"
        placeholder="Placeholder"
        maxLength={100}
        rows={4}
        error="Required"
      />
    </div>
  ),
};

export const Required: Story = {
  render: () => (
    <Textarea
      label="Description"
      labelHelpText="Provide a detailed description of the issue."
      required
      placeholder="Enter description..."
      maxLength={500}
      rows={5}
    />
  ),
};
