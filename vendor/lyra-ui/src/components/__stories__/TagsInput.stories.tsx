import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { TagsInput } from "../tags-input";

const meta: Meta<typeof TagsInput> = {
  title: "Atoms/Tags Input",
  component: TagsInput,
  tags: ["autodocs"],
  parameters: { layout: "padded", backgrounds: { default: "lyra-shell" } },
};

export default meta;
type Story = StoryObj<typeof TagsInput>;

export const Default: Story = {
  render: () => {
    const [tags, setTags] = useState<string[]>([]);
    return (
      <div className="w-96">
        <TagsInput label="Tags" value={tags} onChange={setTags} placeholder="Add a tag…" />
      </div>
    );
  },
};

export const WithValues: Story = {
  name: "With Values",
  render: () => {
    const [tags, setTags] = useState(["React", "TypeScript", "Tailwind"]);
    return (
      <div className="w-96">
        <TagsInput
          label="Technologies"
          labelHelpText="Press Enter or Tab to add."
          value={tags}
          onChange={setTags}
        />
      </div>
    );
  },
};

export const MaxTags: Story = {
  name: "Max Tags",
  render: () => {
    const [tags, setTags] = useState(["Tag 1", "Tag 2"]);
    return (
      <div className="w-96">
        <TagsInput
          label="Labels (max 3)"
          value={tags}
          onChange={setTags}
          maxTags={3}
        />
      </div>
    );
  },
};

export const WithError: Story = {
  name: "With Error",
  render: () => {
    const [tags, setTags] = useState<string[]>([]);
    return (
      <div className="w-96">
        <TagsInput
          label="Tags"
          required
          value={tags}
          onChange={setTags}
          error="At least one tag is required"
        />
      </div>
    );
  },
};

export const Readonly: Story = {
  render: () => (
    <div className="w-96">
      <TagsInput
        label="Tags"
        value={["React", "TypeScript", "Tailwind"]}
        readonly
      />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="w-96">
      <TagsInput
        label="Tags"
        value={["React", "TypeScript"]}
        disabled
      />
    </div>
  ),
};

export const AllStates: Story = {
  name: "All States",
  render: () => {
    const [tags, setTags] = useState(["React", "TypeScript"]);
    return (
      <div className="flex flex-col gap-6 max-w-sm">
        <TagsInput label="Default" value={[]} onChange={() => {}} />
        <TagsInput label="With values" value={tags} onChange={setTags} />
        <TagsInput label="Max 3 tags" value={["Tag 1", "Tag 2"]} onChange={() => {}} maxTags={3} />
        <TagsInput label="Readonly" value={["React", "TypeScript"]} readonly />
        <TagsInput label="Disabled" value={["React"]} disabled />
        <TagsInput label="Error" value={[]} onChange={() => {}} error="At least one tag is required" required />
      </div>
    );
  },
};
