import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { SearchInput } from "../search-input";

const meta: Meta<typeof SearchInput> = {
  title: "Atoms/SearchInput",
  component: SearchInput,
  tags: ["autodocs"],
  parameters: { layout: "padded", backgrounds: { default: "lyra-shell" } },
  argTypes: {
    disabled: { control: "boolean" },
    placeholder: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof SearchInput>;

/* ── Default ── */

export const Default: Story = {
  args: {
    placeholder: "Search",
  },
  render: (args) => {
    const [value, setValue] = useState("");
    return (
      <SearchInput
        {...args}
        value={value}
        onValueChange={setValue}
        className="w-[260px]"
      />
    );
  },
};

/* ── With Value (shows clear button) ── */

export const WithValue: Story = {
  name: "With Value",
  render: () => {
    const [value, setValue] = useState("Agent Desktop");
    return (
      <SearchInput
        placeholder="Search"
        value={value}
        onValueChange={setValue}
        className="w-[260px]"
      />
    );
  },
};

/* ── States ── */

export const States: Story = {
  name: "States",
  render: () => {
    const [val1, setVal1] = useState("");
    const [val2, setVal2] = useState("");
    const [val3, setVal3] = useState("");
    const [val4, setVal4] = useState("Agent Desktop");

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 items-start max-w-[600px]">
          <div>
            <span className="lyra-body-sm text-lyra-fg-secondary mb-2 block">
              Default
            </span>
            <SearchInput
              placeholder="Search"
              value={val1}
              onValueChange={setVal1}
              aria-label="Search default"
            />
          </div>
          <div>
            <span className="lyra-body-sm text-lyra-fg-secondary mb-2 block">
              Hover (hover to see)
            </span>
            <SearchInput
              placeholder="Search"
              value={val2}
              onValueChange={setVal2}
              aria-label="Search hover"
            />
          </div>
          <div>
            <span className="lyra-body-sm text-lyra-fg-secondary mb-2 block">
              Focused (click to see)
            </span>
            <SearchInput
              placeholder="Search"
              value={val3}
              onValueChange={setVal3}
              aria-label="Search focused"
            />
          </div>
          <div>
            <span className="lyra-body-sm text-lyra-fg-secondary mb-2 block">
              With value + clear
            </span>
            <SearchInput
              placeholder="Search"
              value={val4}
              onValueChange={setVal4}
              aria-label="Search with value"
            />
          </div>
          <div>
            <span className="lyra-body-sm text-lyra-fg-secondary mb-2 block">
              Disabled
            </span>
            <SearchInput placeholder="Search" value="" disabled aria-label="Search disabled" />
          </div>
        </div>
      </div>
    );
  },
};

/* ── Full Width ── */

export const FullWidth: Story = {
  name: "Full Width",
  render: () => {
    const [value, setValue] = useState("");
    return (
      <SearchInput
        placeholder="Search"
        value={value}
        onValueChange={setValue}
      />
    );
  },
};
