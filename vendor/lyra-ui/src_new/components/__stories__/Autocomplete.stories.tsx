import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Autocomplete } from "../autocomplete";

// Convert ISO 3166-1 alpha-2 code to flag emoji (no library needed)
function flag(code: string): string {
  return code.toUpperCase().replace(/./g, (c) =>
    String.fromCodePoint(c.charCodeAt(0) + 127397)
  );
}

const COUNTRIES = [
  { value: "us", label: "United States",  icon: flag("us") },
  { value: "ca", label: "Canada",          icon: flag("ca") },
  { value: "gb", label: "United Kingdom",  icon: flag("gb") },
  { value: "au", label: "Australia",       icon: flag("au") },
  { value: "de", label: "Germany",         icon: flag("de") },
  { value: "fr", label: "France",          icon: flag("fr") },
  { value: "jp", label: "Japan",           icon: flag("jp") },
  { value: "br", label: "Brazil",          icon: flag("br") },
  { value: "in", label: "India",           icon: flag("in") },
  { value: "mx", label: "Mexico",          icon: flag("mx") },
  { value: "es", label: "Spain",           icon: flag("es") },
  { value: "it", label: "Italy",           icon: flag("it") },
];

const AGENTS = [
  { value: "a1", label: "Alice Johnson" },
  { value: "a2", label: "Bob Martinez" },
  { value: "a3", label: "Carol White" },
  { value: "a4", label: "David Lee" },
  { value: "a5", label: "Eve Thompson" },
  { value: "a6", label: "Frank Garcia" },
  { value: "a7", label: "Grace Kim — (Unavailable)", disabled: true },
];

const meta: Meta<typeof Autocomplete> = {
  title: "Atoms/Autocomplete",
  component: Autocomplete,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    backgrounds: { default: "lyra-shell" },
  },
};

export default meta;
type Story = StoryObj<typeof Autocomplete>;

export const Default: Story = {
  name: "Default",
  render: () => {
    const [value, setValue] = useState<string | undefined>();
    return (
      <div className="w-72">
        <Autocomplete
          label="Country"
          options={COUNTRIES}
          value={value}
          onChange={setValue}
          placeholder="Search countries…"
        />
        {value && (
          <p className="lyra-body-sm text-lyra-fg-secondary mt-2">
            Selected: {COUNTRIES.find((c) => c.value === value)?.label}
          </p>
        )}
      </div>
    );
  },
};

export const WithDisabledOption: Story = {
  name: "With disabled option",
  render: () => {
    const [value, setValue] = useState<string | undefined>();
    return (
      <div className="w-72">
        <Autocomplete
          label="Assign agent"
          options={AGENTS}
          value={value}
          onChange={setValue}
          placeholder="Search agents…"
        />
      </div>
    );
  },
};

export const SearchOnly: Story = {
  name: "Search only (no show-all)",
  render: () => {
    const [value, setValue] = useState<string | undefined>();
    return (
      <div className="w-72">
        <Autocomplete
          label="Country"
          options={COUNTRIES}
          value={value}
          onChange={setValue}
          placeholder="Type to search…"
          showAllOnEmpty={false}
        />
      </div>
    );
  },
};

export const States: Story = {
  name: "States",
  render: () => (
    <div className="flex flex-col gap-4 w-72">
      <Autocomplete label="Default" options={COUNTRIES} placeholder="Search…" />
      <Autocomplete label="With value" options={COUNTRIES} value="gb" placeholder="Search…" />
      <Autocomplete label="Required" options={COUNTRIES} required placeholder="Search…" />
      <Autocomplete label="Disabled" options={COUNTRIES} disabled placeholder="Search…" />
      <Autocomplete label="Read Only" options={COUNTRIES} readonly value="au" placeholder="Search…" />
    </div>
  ),
};
