import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { PhoneInput, type PhoneValue } from "../phone-input";

const meta: Meta<typeof PhoneInput> = {
  title: "Atoms/PhoneInput",
  component: PhoneInput,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    backgrounds: { default: "lyra-shell" },
  },
};

export default meta;
type Story = StoryObj<typeof PhoneInput>;

export const Default: Story = {
  name: "Default",
  render: () => {
    const [value, setValue] = useState<PhoneValue>({ countryCode: "us", number: "" });
    return (
      <div className="w-80">
        <PhoneInput
          label="Phone number"
          value={value}
          onChange={setValue}
        />
        {value.number && (
          <p className="lyra-body-sm text-lyra-fg-secondary mt-2">
            Full number: {value.number ? `+${value.number}` : "—"}
          </p>
        )}
      </div>
    );
  },
};

export const WithValue: Story = {
  name: "With value",
  render: () => (
    <div className="w-80">
      <PhoneInput
        label="Phone number"
        value={{ countryCode: "gb", number: "7911 123456" }}
        onChange={() => {}}
      />
    </div>
  ),
};

export const States: Story = {
  name: "States",
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <PhoneInput label="Default"   defaultCountry="us" />
      <PhoneInput label="Required"  defaultCountry="us" required />
      <PhoneInput label="Disabled"  defaultCountry="us" disabled value={{ countryCode: "us", number: "555 0100" }} />
      <PhoneInput label="Read Only" defaultCountry="gb" readonly value={{ countryCode: "gb", number: "7911 123456" }} />
    </div>
  ),
};

export const DefaultCountries: Story = {
  name: "Different default countries",
  render: () => (
    <div className="flex flex-col gap-4 w-80">
      <PhoneInput label="United States" defaultCountry="us" />
      <PhoneInput label="United Kingdom" defaultCountry="gb" />
      <PhoneInput label="Japan" defaultCountry="jp" />
      <PhoneInput label="UAE" defaultCountry="ae" />
    </div>
  ),
};

export const WithoutCountrySelector: Story = {
  name: "Without country selector",
  render: () => {
    const [value, setValue] = useState<PhoneValue>({ countryCode: "us", number: "" });
    return (
      <div className="w-80">
        <PhoneInput
          label="Phone number"
          hideCountrySelector
          value={value}
          onChange={setValue}
        />
        <p className="lyra-body-sm text-lyra-fg-secondary mt-2">
          No flag or dial-code picker — use when the app only ever needs a single, known
          country's numbers (the mask/format still comes from `defaultCountry`).
        </p>
      </div>
    );
  },
};
