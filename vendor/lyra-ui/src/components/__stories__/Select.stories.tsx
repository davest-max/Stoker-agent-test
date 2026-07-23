import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Select, type SelectOption } from "../select";

const meta: Meta<typeof Select> = {
  title: "Atoms/Select",
  component: Select,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    backgrounds: { default: "lyra-shell" },
  },
};

export default meta;
type Story = StoryObj<typeof Select>;

const sampleOptions: SelectOption[] = [
  { value: "opt1", label: "Option 1" },
  { value: "opt2", label: "Option 2" },
  { value: "opt3", label: "Option 3" },
  { value: "opt4", label: "Option 4" },
  { value: "opt5", label: "Option 5" },
  { value: "opt6", label: "Option 6" },
];

const manyOptions: SelectOption[] = Array.from({ length: 20 }, (_, i) => ({
  value: `item-${i + 1}`,
  label: `Item label ${i + 1}`,
}));

export const Default: Story = {
  name: "Default",
  render: () => (
    <div className="max-w-[320px]">
      <Select label="Input Label" options={sampleOptions} />
    </div>
  ),
};

export const WithPlaceholder: Story = {
  name: "With Placeholder",
  render: () => (
    <div className="max-w-[320px]">
      <Select label="Input Label" placeholder="Choose an option..." options={sampleOptions} />
    </div>
  ),
};

export const Disabled: Story = {
  name: "Disabled",
  render: () => (
    <div className="max-w-[320px]">
      <Select label="Input Label" options={sampleOptions} disabled />
    </div>
  ),
};

export const ErrorState: Story = {
  name: "Error",
  render: () => (
    <div className="max-w-[320px]">
      <Select label="Input Label" options={sampleOptions} error="Required" />
    </div>
  ),
};

export const Searchable: Story = {
  name: "Searchable",
  render: () => (
    <div className="max-w-[320px]">
      <Select label="Input Label" options={manyOptions} searchable />
    </div>
  ),
};

export const MultiSelect: Story = {
  name: "Multi-Select",
  render: () => {
    const [vals, setVals] = useState<string[]>(["item-1", "item-2", "item-3"]);
    return (
      <div className="max-w-[320px]">
        <Select
          label="Input Label"
          options={manyOptions}
          multiple
          searchable
          showSelectAll
          values={vals}
          onValuesChange={setVals}
        />
      </div>
    );
  },
};

export const MaxSelectionSelect: Story = {
  name: "Max Selection",
  render: () => {
    const [values, setValues] = useState<string[]>([]);
    const colorOptions: SelectOption[] = [
      { value: "yellow", label: "Yellow" },
      { value: "blue", label: "Blue" },
      { value: "white", label: "White" },
      { value: "selected-white", label: "Selected White" },
      { value: "red", label: "Red" },
      { value: "magenta", label: "Magenta" },
      { value: "cyan", label: "Cyan" },
      { value: "dark-red", label: "Dark Red" },
      { value: "green", label: "Green" },
      { value: "orange", label: "Orange" },
    ];
    return (
      <div className="max-w-[320px]">
        <Select
          label="Color"
          options={colorOptions}
          multiple
          searchable
          maxSelection={4}
          values={values}
          onValuesChange={setValues}
        />
      </div>
    );
  },
};

export const MultiSelectEmpty: Story = {
  name: "Multi-Select (Empty)",
  render: () => (
    <div className="max-w-[320px]">
      <Select
        label="Input Label"
        options={manyOptions}
        multiple
        searchable
        showSelectAll
      />
    </div>
  ),
};

export const Controlled: Story = {
  name: "Controlled",
  render: () => {
    const [val, setVal] = useState("opt2");
    return (
      <div className="max-w-[320px] flex flex-col gap-4">
        <Select
          label="Input Label"
          options={sampleOptions}
          value={val}
          onValueChange={setVal}
        />
        <p className="lyra-body-sm text-lyra-fg-secondary">
          Selected: <span className="text-lyra-fg-default">{val}</span>
        </p>
      </div>
    );
  },
};

export const AllStates: Story = {
  name: "All States",
  render: () => (
    <div className="flex flex-col gap-6 max-w-[320px]">
      <Select label="Input Label" placeholder="Select..." options={sampleOptions} />
      <Select label="Input Label" options={sampleOptions} disabled />
      <Select label="Input Label" options={sampleOptions} error="Required" />
    </div>
  ),
};
