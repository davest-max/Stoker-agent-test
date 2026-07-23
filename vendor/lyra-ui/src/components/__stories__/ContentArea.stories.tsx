import type { Meta, StoryObj } from "@storybook/react";
import { ContentArea } from "../content-area";
import { Container } from "../container";

const meta: Meta<typeof ContentArea> = {
  title: "UI/ContentArea",
  component: ContentArea,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "lyra-shell" },
  },
};

export default meta;
type Story = StoryObj<typeof ContentArea>;

export const Default: Story = {
  name: "Default",
  render: () => (
    <div className="flex h-[400px] bg-lyra-bg-surface-shell">
      {/* Simulated sidebar */}
      <div className="w-[256px] flex-shrink-0 bg-lyra-bg-surface-shell" />
      <ContentArea>
        <Container className="flex flex-1 items-center justify-center">
          <p className="lyra-body-md text-lyra-fg-secondary">
            ContentArea provides the inset padding (right &amp; bottom) between the shell and the Container.
          </p>
        </Container>
      </ContentArea>
    </div>
  ),
};

export const CustomPadding: Story = {
  name: "Custom Padding",
  render: () => (
    <div className="flex h-[400px] bg-lyra-bg-surface-shell">
      <div className="w-[256px] flex-shrink-0 bg-lyra-bg-surface-shell" />
      <ContentArea padding="p-6">
        <Container className="flex flex-1 items-center justify-center">
          <p className="lyra-body-md text-lyra-fg-secondary">
            Custom padding override (p-6 = 24px all around).
          </p>
        </Container>
      </ContentArea>
    </div>
  ),
};
