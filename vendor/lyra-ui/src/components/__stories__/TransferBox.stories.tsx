import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { TransferBox } from "../transfer-box";

const SKILLS = [
  "10DMT Service","10DMTClosure","10DMT_CT_AUTO","10DMT_CallEvents",
  "ACD_API_Manual_Service","API_CC2_Quick_Connect","ATG Outbound Test",
  "ATG_Contacts_Regression","ATG_Inbound","AccountNotRequired",
  "BasicSkill","BillingSupport","CallbackQueue","CustomerRetention",
  "DataEntry","EscalationTeam","FraudPrevention","GeneralInquiries",
  "HighPrioritySupport","InboundSales","JuniorAgents","KnowledgeBase",
  "Level1Support","Level2Support","Level3Support","MobileSupport",
  "NightShift","OutboundCampaign","PremiumCustomers","QualityAssurance",
].map((label) => ({ value: label.toLowerCase().replace(/\s+/g, "_"), label }));

const PRESELECTED = ["api_cc2_quick_connect", "basicskill", "billingqueue"];

const meta: Meta<typeof TransferBox> = {
  title: "Atoms/TransferBox",
  component: TransferBox,
  tags: ["autodocs"],
  parameters: { layout: "padded", backgrounds: { default: "lyra-shell" } },
};

export default meta;
type Story = StoryObj<typeof TransferBox>;

export const Interactive: Story = {
  name: "Interactive",
  render: () => {
    const [value, setValue] = useState<string[]>(["atg_inbound"]);
    const opts = [{ value: "api_hcl", label: "API_HCI" }, ...SKILLS];
    return (
      <TransferBox
        options={opts} value={value} onChange={setValue}
        availableLabel="Available" selectedLabel="Selected"
        availableLabelTooltip="Select one or more skills for this Screen Pop"
      />
    );
  },
};

const TOOLTIP = "Select one or more skills for this Screen Pop";

export const WithError: Story = {
  name: "Error",
  render: () => {
    const [value, setValue] = useState<string[]>([]);
    return (
      <TransferBox
        options={SKILLS} value={value} onChange={setValue}
        availableLabel="Available" selectedLabel="Selected"
        availableLabelTooltip={TOOLTIP}
        error="At least one skill must be selected."
      />
    );
  },
};

export const WithMaxLimit: Story = {
  name: "Max selection limit",
  render: () => {
    const [value, setValue] = useState<string[]>(PRESELECTED);
    return (
      <TransferBox
        options={SKILLS} value={value} onChange={setValue}
        availableLabel="Available" selectedLabel="Selected"
        availableLabelTooltip={TOOLTIP}
        max={5}
      />
    );
  },
};

export const Disabled: Story = {
  name: "Disabled",
  render: () => (
    <TransferBox
      options={SKILLS}
      value={["atg_inbound", "basicskill"]}
      disabled
      availableLabel="Available" selectedLabel="Selected"
      availableLabelTooltip={TOOLTIP}
    />
  ),
};

export const Readonly: Story = {
  name: "Read Only",
  render: () => (
    <TransferBox
      options={SKILLS}
      value={["atg_inbound", "basicskill", "billingqueue"]}
      readonly
      availableLabel="Available" selectedLabel="Selected"
      availableLabelTooltip={TOOLTIP}
    />
  ),
};

function AllVariantsDemo() {
  const [emptyValue, setEmptyValue] = useState<string[]>([]);
  const [withItemsValue, setWithItemsValue] = useState<string[]>(["atg_inbound", "basicskill"]);
  const [withSelectionsValue, setWithSelectionsValue] = useState<string[]>(PRESELECTED);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <p className="lyra-body-sm-emphasis text-lyra-fg-secondary mb-3">Empty (no selections)</p>
        <TransferBox
          options={SKILLS}
          value={emptyValue}
          onChange={setEmptyValue}
          availableLabel="Available"
          selectedLabel="Selected"
          availableLabelTooltip={TOOLTIP}
        />
      </div>

      <div>
        <p className="lyra-body-sm-emphasis text-lyra-fg-secondary mb-3">With items selected</p>
        <TransferBox
          options={SKILLS}
          value={withItemsValue}
          onChange={setWithItemsValue}
          availableLabel="Available"
          selectedLabel="Selected"
          availableLabelTooltip={TOOLTIP}
        />
      </div>

      <div>
        <p className="lyra-body-sm-emphasis text-lyra-fg-secondary mb-3">With max selection limit (max 5)</p>
        <TransferBox
          options={SKILLS}
          value={withSelectionsValue}
          onChange={setWithSelectionsValue}
          availableLabel="Available"
          selectedLabel="Selected"
          availableLabelTooltip={TOOLTIP}
          max={5}
        />
      </div>

      <div>
        <p className="lyra-body-sm-emphasis text-lyra-fg-secondary mb-3">Error state</p>
        <TransferBox
          options={SKILLS}
          value={[]}
          onChange={() => {}}
          availableLabel="Available"
          selectedLabel="Selected"
          availableLabelTooltip={TOOLTIP}
          error="At least one skill must be selected."
        />
      </div>

      <div>
        <p className="lyra-body-sm-emphasis text-lyra-fg-secondary mb-3">Disabled</p>
        <TransferBox
          options={SKILLS}
          value={["atg_inbound", "basicskill"]}
          disabled
          availableLabel="Available"
          selectedLabel="Selected"
          availableLabelTooltip={TOOLTIP}
        />
      </div>

      <div>
        <p className="lyra-body-sm-emphasis text-lyra-fg-secondary mb-3">Read only</p>
        <TransferBox
          options={SKILLS}
          value={["atg_inbound", "basicskill", "billingqueue"]}
          readonly
          availableLabel="Available"
          selectedLabel="Selected"
          availableLabelTooltip={TOOLTIP}
        />
      </div>
    </div>
  );
}

export const AllVariants: Story = {
  name: "All Variants",
  render: () => <AllVariantsDemo />,
};
