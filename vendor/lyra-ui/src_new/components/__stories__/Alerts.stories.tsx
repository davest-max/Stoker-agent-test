import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Container } from "../container";
import { Button } from "../button";
import { Checkbox } from "../checkbox";
import { InlineNotification } from "../inline-notification";
import { Toast, ToastContainer, useToast } from "../toast";
import type { ToastVariant } from "../toast";
import { WarningIcon } from "../icons/warning-icon";
import { ErrorIcon } from "../icons/error-icon";
import { InfoIcon } from "../icons/info-icon";
import { SuccessIcon } from "../icons/success-icon";

const meta: Meta = {
  title: "Atoms/Alerts",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj;

/* ══════════════════════════════════════════
   Modal Alerts
   ══════════════════════════════════════════ */

// Modal stories moved to Atoms/Modal

/* ══════════════════════════════════════════
   Inline Notifications
   ══════════════════════════════════════════ */

export const Default: Story = {
  name: "Default",
  render: () => (
    <div className="w-full">
      <InlineNotification variant="info" onDismiss={() => {}}>
        Important background information, upcoming changes, or neutral system status updates.
      </InlineNotification>
    </div>
  ),
};

export const InlineAll: Story = {
  name: "Inline — All Variants",
  render: () => (
    <div className="flex flex-col gap-4 w-full">
      <InlineNotification variant="warning" onDismiss={() => {}}>
        Advise users of conditions that need attention or could cause future problems if ignored.
      </InlineNotification>
      <InlineNotification variant="error" onDismiss={() => {}}>
        Highlight critical issues or failed requirements that prevent the user from completing a workflow.
      </InlineNotification>
      <InlineNotification variant="info" onDismiss={() => {}}>
        Important background information, upcoming changes, or neutral system status updates.
      </InlineNotification>
      <InlineNotification variant="success" onDismiss={() => {}}>
        Confirm completion of a major page-level process
      </InlineNotification>
    </div>
  ),
};

export const InlineWarning: Story = {
  name: "Inline — Warning",
  render: () => (
    <div className="w-full">
      <InlineNotification variant="warning" onDismiss={() => {}}>
        Advise users of conditions that need attention or could cause future problems if ignored.
      </InlineNotification>
    </div>
  ),
};

export const InlineError: Story = {
  name: "Inline — Error",
  render: () => (
    <div className="w-full">
      <InlineNotification variant="error" onDismiss={() => {}}>
        Highlight critical issues or failed requirements that prevent the user from completing a workflow.
      </InlineNotification>
    </div>
  ),
};

export const InlineInfo: Story = {
  name: "Inline — Info",
  render: () => (
    <div className="w-full">
      <InlineNotification variant="info" onDismiss={() => {}}>
        Important background information, upcoming changes, or neutral system status updates.
      </InlineNotification>
    </div>
  ),
};

export const InlineSuccess: Story = {
  name: "Inline — Success",
  render: () => (
    <div className="w-full">
      <InlineNotification variant="success" onDismiss={() => {}}>
        Confirm completion of a major page-level process
      </InlineNotification>
    </div>
  ),
};

/* ══════════════════════════════════════════
   Toasts
   ══════════════════════════════════════════ */

export const ToastAll: Story = {
  name: "Toast — All Variants",
  render: () => (
    <div className="flex flex-col gap-3 w-[380px]">
      <Toast variant="warning" title="Warning" onDismiss={() => {}}>
        Advise users of conditions that might cause issues.
      </Toast>
      <Toast variant="error" title="Error" onDismiss={() => {}}>
        A critical action has failed and needs attention.
      </Toast>
      <Toast variant="info" title="Info" onDismiss={() => {}}>
        Important background information or system updates.
      </Toast>
      <Toast variant="success" title="Success" onDismiss={() => {}}>
        Action completed successfully.
      </Toast>
    </div>
  ),
};

export const ToastWarning: Story = {
  name: "Toast — Warning",
  render: () => (
    <div className="w-[380px]">
      <Toast variant="warning" title="Warning" onDismiss={() => {}}>
        Advise users of conditions that might cause issues.
      </Toast>
    </div>
  ),
};

export const ToastError: Story = {
  name: "Toast — Error",
  render: () => (
    <div className="w-[380px]">
      <Toast variant="error" title="Error" onDismiss={() => {}}>
        A critical action has failed and needs attention.
      </Toast>
    </div>
  ),
};

export const ToastInfo: Story = {
  name: "Toast — Info",
  render: () => (
    <div className="w-[380px]">
      <Toast variant="info" title="Info" onDismiss={() => {}}>
        Important background information or system updates.
      </Toast>
    </div>
  ),
};

export const ToastSuccess: Story = {
  name: "Toast — Success",
  render: () => (
    <div className="w-[380px]">
      <Toast variant="success" title="Success" onDismiss={() => {}}>
        Action completed successfully.
      </Toast>
    </div>
  ),
};

const ToastPlayground = () => {
  const { toasts, addToast, dismissToast } = useToast();

  const fire = (variant: ToastVariant) => {
    const messages: Record<ToastVariant, { title: string; message: string }> = {
      warning: { title: "Warning", message: "This action may have unintended consequences." },
      error: { title: "Error", message: "Something went wrong. Please try again." },
      info: { title: "Info", message: "A new version is available for download." },
      success: { title: "Success", message: "Your changes have been saved." },
    };
    addToast({ variant, ...messages[variant], duration: 5000 });
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => fire("warning")}>
        Warning Toast
      </Button>
      <Button variant="outline" size="sm" onClick={() => fire("error")}>
        Error Toast
      </Button>
      <Button variant="outline" size="sm" onClick={() => fire("info")}>
        Info Toast
      </Button>
      <Button variant="outline" size="sm" onClick={() => fire("success")}>
        Success Toast
      </Button>

      <ToastContainer>
        {toasts.map((t) => (
          <Toast
            key={t.id}
            variant={t.variant}
            title={t.title}
            duration={t.duration}
            onDismiss={() => dismissToast(t.id)}
          >
            {t.message}
          </Toast>
        ))}
      </ToastContainer>
    </div>
  );
};

export const ToastInteractive: Story = {
  name: "Toast — Interactive Demo",
  parameters: {
    layout: "fullscreen",
  },
  render: () => <ToastPlayground />,
};
