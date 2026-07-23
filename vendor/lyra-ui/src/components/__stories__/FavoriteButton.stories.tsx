import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { FavoriteButton } from "../favorite-button";

const meta: Meta<typeof FavoriteButton> = {
  title: "Atoms/FavoriteButton",
  component: FavoriteButton,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    backgrounds: { default: "lyra-shell" },
  },
  argTypes: {
    placement: {
      control: "select",
      options: ["top", "bottom", "left", "right"],
    },
    favorited: { control: "boolean" },
    onClick: { table: { disable: true } },
  },
};

export default meta;
type Story = StoryObj<typeof FavoriteButton>;

/* A minimal stand-in for a list row (see ContactRow in create-new.tsx for
   the real usage) — `group/row` is what FavoriteButton hooks into to only
   reveal itself on hover/focus of the row it lives in. */
// `w-full` — DemoRow fills whatever container it's placed in (a bare
// `w-72` wrapper for the standalone stories below, or the `InList` list's
// own flex column). A fixed width here previously fought the parent's
// width in `InList` and overflowed it, producing overlapping/nested
// borders instead of a clean stacked list.
function DemoRow({ name, initiallyFavorited }: { name: string; initiallyFavorited?: boolean }) {
  const [favorited, setFavorited] = useState(!!initiallyFavorited);
  return (
    <div className="group/row flex w-full items-center justify-between rounded-lyra-sm border border-lyra-border-subtle px-3 py-2.5">
      <span className="lyra-body-md text-lyra-fg-default">{name}</span>
      <FavoriteButton favorited={favorited} onClick={() => setFavorited((v) => !v)} label={name} placement="left" />
    </div>
  );
}

export const Default: Story = {
  name: "Default",
  render: () => (
    <div className="w-72">
      <DemoRow name="Jamie Torres" />
    </div>
  ),
};

export const AllVariants: Story = {
  name: "All Variants",
  render: () => (
    <div className="flex w-72 flex-col gap-3">
      <div>
        <p className="lyra-body-sm text-lyra-fg-secondary mb-1.5">Not favorited — hover the row to reveal the star</p>
        <DemoRow name="Jamie Torres" />
      </div>
      <div>
        <p className="lyra-body-sm text-lyra-fg-secondary mb-1.5">Favorited — star stays visible without hovering</p>
        <DemoRow name="Priya Nair" initiallyFavorited />
      </div>
    </div>
  ),
};

export const InList: Story = {
  name: "Inside a list",
  render: () => (
    <div className="flex w-72 flex-col gap-1 rounded-lyra-lg border border-lyra-border-subtle p-2">
      <DemoRow name="Jamie Torres" initiallyFavorited />
      <DemoRow name="Priya Nair" />
      <DemoRow name="Wei Chen" />
    </div>
  ),
};
