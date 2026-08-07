import type { Meta, StoryObj } from "@storybook/react";
import { Chip } from "../chip";
import type { ChipColor, ChipVariant } from "../chip";

const meta: Meta<typeof Chip> = {
  title: "Atoms/Chip",
  component: Chip,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    backgrounds: { default: "lyra-shell" },
  },
  argTypes: {
    color: {
      control: "select",
      options: [
        "slate", "red", "orange", "yellow", "lime",
        "green", "teal", "blue", "purple", "pink",
      ],
    },
    variant: {
      control: "select",
      options: ["subtle", "solid"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Chip>;

/* ── Single chip ── */

export const Default: Story = {
  args: {
    color: "blue",
    variant: "subtle",
    children: "Blue",
  },
};

/* ── All colors × all variants ── */

const COLORS: ChipColor[] = [
  "slate", "red", "orange", "yellow", "lime",
  "green", "teal", "blue", "purple", "pink",
];

const VARIANTS: ChipVariant[] = ["subtle", "solid"];

export const AllVariants: Story = {
  name: "All Variants",
  render: () => (
    <div className="flex gap-12">
      {VARIANTS.map((variant) => (
        <div key={variant} className="flex flex-col gap-2 items-start">
          <p className="lyra-body-sm text-lyra-fg-secondary mb-1 capitalize">{variant}</p>
          {COLORS.map((color) => (
            <Chip key={color} color={color} variant={variant}>
              {color.charAt(0).toUpperCase() + color.slice(1)}
            </Chip>
          ))}
        </div>
      ))}
    </div>
  ),
};
