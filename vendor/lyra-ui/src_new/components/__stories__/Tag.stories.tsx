import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Tag } from "../tag";
import type { TagVariant } from "../tag";

const meta: Meta<typeof Tag> = {
  title: "Atoms/Tag",
  component: Tag,
  tags: ["autodocs"],
  parameters: { layout: "centered", backgrounds: { default: "lyra-shell" } },
  argTypes: {
    variant: { control: "select", options: ["default","success","warning","critical","info","neutral"] },
  },
};

export default meta;
type Story = StoryObj<typeof Tag>;

export const Default: Story = {
  args: { label: "Tag label" },
};

export const Removable: Story = {
  render: () => {
    const [tags, setTags] = useState(["React", "TypeScript", "Tailwind", "Lyra"]);
    return (
      <div className="flex flex-wrap gap-2">
        {tags.map(t => (
          <Tag key={t} label={t} onRemove={() => setTags(tags.filter(x => x !== t))} />
        ))}
      </div>
    );
  },
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {(["default","success","warning","critical","info","neutral"] as TagVariant[]).map(v => (
        <Tag key={v} label={v.charAt(0).toUpperCase() + v.slice(1)} variant={v} />
      ))}
    </div>
  ),
};

export const RemovableVariants: Story = {
  name: "Removable Variants",
  render: () => (
    <div className="flex flex-wrap gap-2">
      {(["default","success","warning","critical","info","neutral"] as TagVariant[]).map(v => (
        <Tag key={v} label={v.charAt(0).toUpperCase() + v.slice(1)} variant={v} onRemove={() => {}} />
      ))}
    </div>
  ),
};


export const Disabled: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Tag label="Disabled"          disabled />
      <Tag label="Disabled removable" disabled onRemove={() => {}} />
    </div>
  ),
};

export const PillShape: Story = {
  name: "Pill Shape",
  render: () => (
    <div className="flex flex-wrap gap-2">
      {(["default","success","warning","critical","info","neutral"] as TagVariant[]).map(v => (
        <Tag key={v} label={v.charAt(0).toUpperCase() + v.slice(1)} variant={v} shape="pill" />
      ))}
    </div>
  ),
};

export const PillRemovable: Story = {
  name: "Pill — Removable",
  render: () => (
    <div className="flex flex-wrap gap-2">
      {(["default","success","warning","critical","info","neutral"] as TagVariant[]).map(v => (
        <Tag key={v} label={v.charAt(0).toUpperCase() + v.slice(1)} variant={v} shape="pill" onRemove={() => {}} />
      ))}
    </div>
  ),
};

export const BothShapes: Story = {
  name: "Default vs Pill",
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {["React", "TypeScript", "Tailwind"].map(t => <Tag key={t} label={t} />)}
      </div>
      <div className="flex flex-wrap gap-2">
        {["React", "TypeScript", "Tailwind"].map(t => <Tag key={t} label={t} shape="pill" />)}
      </div>
    </div>
  ),
};
