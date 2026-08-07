import type { Meta, StoryObj } from "@storybook/react";

/* ── Color swatch chip ── */

function Swatch({
  name,
  token,
  value,
  description,
}: {
  name: string;
  token: string;
  value: string;
  description?: string;
  light?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-lyra-lg border border-lyra-border-default">
      <div
        className="h-24 w-full border-b border-lyra-border-subtle"
        style={{ backgroundColor: value }}
      />
      <div className="px-3 py-2.5 bg-lyra-bg-surface-base">
        <div className="lyra-body-sm-emphasis text-lyra-fg-default">{name}</div>
        <div className="lyra-body-sm text-lyra-fg-secondary font-mono uppercase">{value}</div>
        <div className="lyra-body-sm text-lyra-fg-disabled font-mono mt-0.5">
          {token}
        </div>
        {description && (
          <div className="lyra-body-sm text-lyra-fg-secondary mt-1">
            {description}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Alias table row ── */

function AliasRow({
  name,
  value,
  darkValue,
  token,
}: {
  name: string;
  value: string;
  darkValue?: string;
  token: string;
}) {
  return (
    <div className="flex items-center border-b border-lyra-border-subtle py-3 gap-4">
      <div className="w-[140px] flex-shrink-0 lyra-body-md text-lyra-fg-default">{name}</div>
      <div
        className="h-8 w-8 flex-shrink-0 rounded-lyra-sm border border-lyra-border-default"
        style={{ backgroundColor: value }}
        title={`Light: ${value}`}
      />
      <div className="w-[180px] flex-shrink-0 lyra-body-sm text-lyra-fg-secondary font-mono">{value}</div>
      {darkValue !== undefined && (
        <>
          <div
            className="h-8 w-8 flex-shrink-0 rounded-lyra-sm border border-lyra-border-default"
            style={{ backgroundColor: darkValue }}
            title={`Dark: ${darkValue}`}
          />
          <div className="w-[180px] flex-shrink-0 lyra-body-sm text-lyra-fg-secondary font-mono">{darkValue}</div>
        </>
      )}
      <div className="flex-shrink-0 lyra-body-sm text-lyra-fg-disabled font-mono">{token}</div>
    </div>
  );
}

function AliasTableHeader({ hasDark = false }: { hasDark?: boolean }) {
  return (
    <div className="flex items-center border-b border-lyra-border-medium py-2 gap-4 mb-1">
      <div className="w-[140px] flex-shrink-0 lyra-body-sm-emphasis text-lyra-fg-secondary">Name</div>
      <div className="w-8 flex-shrink-0 lyra-body-sm-emphasis text-lyra-fg-secondary">Light</div>
      <div className="w-[180px] flex-shrink-0 lyra-body-sm-emphasis text-lyra-fg-secondary">Value</div>
      {hasDark && (
        <>
          <div className="w-8 flex-shrink-0 lyra-body-sm-emphasis text-lyra-fg-secondary">Dark</div>
          <div className="w-[180px] flex-shrink-0 lyra-body-sm-emphasis text-lyra-fg-secondary">Value</div>
        </>
      )}
      <div className="flex-shrink-0 lyra-body-sm-emphasis text-lyra-fg-secondary">Token</div>
    </div>
  );
}

/* ── Color group with title + description ── */

function ColorGroup({
  title,
  description,
  colors,
}: {
  title: string;
  description?: string;
  colors: { name: string; token: string; value: string; description?: string; light?: boolean }[];
}) {
  return (
    <div>
      <h3 className="lyra-heading-md text-lyra-fg-default mb-1">{title}</h3>
      {description && (
        <p className="lyra-body-md text-lyra-fg-secondary mb-4">{description}</p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {colors.map((c) => (
          <Swatch key={c.cssVar} {...c} />
        ))}
      </div>
    </div>
  );
}

/* ── Story ── */

const meta: Meta = {
  title: "Foundations/Colors",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj;

export const AllColors: Story = {
  name: "All Colors",
  render: () => (
    <div className="space-y-12">
      <div>
        <h2 className="lyra-heading-xl text-lyra-fg-default mb-1">Colors</h2>
        <p className="lyra-body-lg text-lyra-fg-secondary">
          Lyra Foundations design system color palette based on Figma design tokens.
        </p>
      </div>

      <ColorGroup
        title="Background — Surfaces"
        description="Use for page backgrounds, containers, overlays, and shells."
        colors={[
          { name: "Base", token: "lyra-bg-surface-base", value: "#ffffff", description: "Default background for pages, panels, and non-primary components." },
          { name: "Canvas", token: "lyra-bg-surface-canvas", value: "#fcfcfd", description: "Second-level backgrounds like sidebars." },
          { name: "Container", token: "lyra-bg-surface-container", value: "#ffffff", description: "Grouped content areas within a page." },
          { name: "Container Subtle", token: "lyra-bg-surface-container-subtle", value: "#fbfcfe", description: "Lighter container variant for subtle differentiation." },
          { name: "Shell", token: "lyra-bg-surface-shell", value: "#f3f5f6", description: "Adaptive background slightly darker than parent." },
          { name: "Backdrop", token: "lyra-bg-surface-backdrop", value: "rgba(0,0,0,0.24)", description: "Overlay behind modals and dialogs." },
          { name: "Overlay", token: "lyra-bg-surface-overlay", value: "#ffffff", description: "Popovers, dropdowns, tooltips, and modals." },
          { name: "Inverse", token: "lyra-bg-surface-inverse", value: "#2a2d32", description: "Inverted color panels and dark surfaces." },
        ]}
      />

      <ColorGroup
        title="Background — Controls"
        description="Use for buttons, inputs, and interactive controls."
        colors={[
          { name: "Primary", token: "lyra-bg-primary", value: "#166cca", description: "Main brand background for primary actions." },
          { name: "Secondary", token: "lyra-bg-secondary", value: "#ffffff", description: "Secondary buttons and controls." },
          { name: "Destructive", token: "lyra-bg-destructive", value: "#bc2626", description: "Delete, remove, and destructive actions." },
          { name: "Control", token: "lyra-bg-control", value: "#ffffff", description: "Default background for form controls." },
          { name: "Control Subtle", token: "lyra-bg-control-subtle", value: "rgba(0,0,0,0.02)", description: "Subtle control background variant." },
          { name: "Field", token: "lyra-bg-field", value: "#ffffff", description: "Input fields and text areas." },
          { name: "Disabled", token: "lyra-bg-disabled", value: "rgba(0,0,0,0.06)", description: "Disabled controls and inactive elements." },
        ]}
      />

      <ColorGroup
        title="Background — Active"
        description="Use for selected or active states on rows, items, and controls."
        colors={[
          { name: "Active Strong", token: "lyra-bg-active-strong", value: "#166cca", description: "Strong active/selected state." },
          { name: "Active Moderate", token: "lyra-bg-active-moderate", value: "#D3E6FD", description: "Medium active/selected state." },
          { name: "Active Subtle", token: "lyra-bg-active-subtle", value: "#ecf5fe", description: "Subtle active/selected state for rows and items." },
        ]}
      />

      <ColorGroup
        title="Foreground / Text"
        description="Use for text, icons, and foreground elements."
        colors={[
          { name: "Default", token: "lyra-fg-default", value: "rgba(0,0,0,0.80)", description: "Primary text and icons." },
          { name: "Secondary", token: "lyra-fg-secondary", value: "rgba(0,0,0,0.56)", description: "Supporting text, labels, and secondary icons." },
          { name: "Action", token: "lyra-fg-action", value: "#49515a", description: "Active tab text and actionable items." },
          { name: "Disabled", token: "lyra-fg-disabled", value: "rgba(0,0,0,0.30)", description: "Disabled text and placeholder content." },
          { name: "Link", token: "lyra-fg-link", value: "#185ba4", description: "Hyperlinks and clickable text." },
          { name: "Inverse", token: "lyra-fg-inverse", value: "#ffffff", description: "Text on dark/inverse backgrounds." },
          { name: "On Primary", token: "lyra-fg-on-primary", value: "#ffffff", description: "Text on primary-colored backgrounds." },
          { name: "Active Subtle", token: "lyra-fg-active-subtle", value: "#f5faff", description: "Text on active subtle backgrounds." },
          { name: "Active Strong", token: "lyra-fg-active-strong", value: "#185ba4", description: "Text for active/selected items." },
        ]}
      />

      <ColorGroup
        title="Border"
        description="Use for borders, dividers, and outlines."
        colors={[
          { name: "Subtle", token: "lyra-border-subtle", value: "rgba(0,0,0,0.10)", description: "Lightest dividers and card borders." },
          { name: "Default", token: "lyra-border-default", value: "rgba(0,0,0,0.16)", description: "Standard input and control borders." },
          { name: "Medium", token: "lyra-border-medium", value: "rgba(0,0,0,0.32)", description: "Medium emphasis borders." },
          { name: "Strong", token: "lyra-border-strong", value: "rgba(0,0,0,0.46)", description: "High emphasis borders and hover states." },
          { name: "Disabled", token: "lyra-border-disabled", value: "rgba(0,0,0,0.10)", description: "Borders on disabled controls." },
          { name: "Active", token: "lyra-border-active", value: "#166cca", description: "Active/focused input borders." },
          { name: "Focus", token: "lyra-border-focus", value: "#185ba4", description: "Focus ring for keyboard navigation." },
          { name: "Inverse", token: "lyra-border-inverse", value: "rgba(255,255,255,0.80)", description: "Borders on dark/inverse backgrounds." },
        ]}
      />

      <ColorGroup
        title="Status"
        description="Use for success, info, critical, and warning feedback."
        colors={[
          { name: "Success Strong", token: "lyra-status-success-strong", value: "#21742c", description: "Success icons and text." },
          { name: "Success Medium", token: "lyra-status-success-medium", value: "#5ac368", description: "Success badges and indicators." },
          { name: "Success Subtle", token: "lyra-status-success-subtle", value: "#ebfaed", description: "Success banner backgrounds." },
          { name: "Info Strong", token: "lyra-status-info-strong", value: "#2558c1", description: "Info icons and text." },
          { name: "Info Medium", token: "lyra-status-info-medium", value: "#709cf5", description: "Info badges and indicators." },
          { name: "Info Subtle", token: "lyra-status-info-subtle", value: "#f0f5ff", description: "Info banner backgrounds." },
          { name: "Critical Strong", token: "lyra-status-critical-strong", value: "#bc2626", description: "Error icons and text." },
          { name: "Critical Medium", token: "lyra-status-critical-medium", value: "#fa7f7f", description: "Error badges and indicators." },
          { name: "Critical Subtle", token: "lyra-status-critical-subtle", value: "#fff0f0", description: "Error banner backgrounds." },
          { name: "Warning Strong", token: "lyra-status-warning-strong", value: "#8e6800", description: "Warning icons and text." },
          { name: "Warning Medium", token: "lyra-status-warning-medium", value: "#fcce36", description: "Warning badges and indicators." },
          { name: "Warning Subtle", token: "lyra-status-warning-subtle", value: "#fffae0", description: "Warning banner backgrounds." },
        ]}
      />

      <ColorGroup
        title="State"
        description="Use for hover, pressed, and interactive state overlays."
        colors={[
          { name: "Hover", token: "lyra-state-hover", value: "rgba(0,0,0,0.04)", description: "Default hover overlay on neutral elements." },
          { name: "Pressed", token: "lyra-state-pressed", value: "rgba(0,0,0,0.10)", description: "Default pressed/active overlay." },
          { name: "Hover Primary", token: "lyra-state-hover-primary", value: "#185ba4", description: "Hover state for primary buttons." },
          { name: "Pressed Primary", token: "lyra-state-pressed-primary", value: "#164479", description: "Pressed state for primary buttons." },
          { name: "Hover Active Subtle", token: "lyra-state-hover-active-subtle", value: "#e8f1fc", description: "Hover on selected/active rows." },
          { name: "Pressed Active Subtle", token: "lyra-state-pressed-active-subtle", value: "#c8e1fe", description: "Pressed on selected/active rows." },
          { name: "Hover Destructive", token: "lyra-state-hover-destructive", value: "#902222", description: "Hover state for destructive buttons." },
          { name: "Pressed Destructive", token: "lyra-state-pressed-destructive", value: "#6d2222", description: "Pressed state for destructive buttons." },
        ]}
      />

      <ColorGroup
        title="Accent"
        description="Use for tags, badges, avatars, and decorative elements."
        colors={[
          { name: "Slate Soft", token: "lyra-accent-slate-soft", value: "#e8ebed", description: "Soft slate for neutral tags and badges." },
          { name: "Slate Strong", token: "lyra-accent-slate-strong", value: "#5d6a79", description: "Strong slate for avatars and icons." },
          { name: "Red Soft", token: "lyra-accent-red-soft", value: "#ffdbdb", description: "Soft red background." },
          { name: "Red Strong", token: "lyra-accent-red-strong", value: "#bc2626", description: "Strong red for text and icons." },
          { name: "Orange Soft", token: "lyra-accent-orange-soft", value: "#ffe2c7", description: "Soft orange background." },
          { name: "Orange Strong", token: "lyra-accent-orange-strong", value: "#a64f00", description: "Strong orange for text and icons." },
          { name: "Yellow Soft", token: "lyra-accent-yellow-soft", value: "#fff3ad", description: "Soft yellow background." },
          { name: "Yellow Strong", token: "lyra-accent-yellow-strong", value: "#8e6800", description: "Strong yellow for text and icons." },
          { name: "Lime Soft", token: "lyra-accent-lime-soft", value: "#def6a7", description: "Soft lime background." },
          { name: "Lime Strong", token: "lyra-accent-lime-strong", value: "#4e760c", description: "Strong lime for text and icons." },
          { name: "Green Soft", token: "lyra-accent-green-soft", value: "#d2f4d5", description: "Soft green background." },
          { name: "Green Strong", token: "lyra-accent-green-strong", value: "#21742c", description: "Strong green for text and icons." },
          { name: "Teal Soft", token: "lyra-accent-teal-soft", value: "#c4f0f3", description: "Soft teal background." },
          { name: "Teal Strong", token: "lyra-accent-teal-strong", value: "#11737c", description: "Strong teal for text and icons." },
          { name: "Blue Soft", token: "lyra-accent-blue-soft", value: "#d6e4ff", description: "Soft blue background." },
          { name: "Blue Strong", token: "lyra-accent-blue-strong", value: "#2558c1", description: "Strong blue for text and icons." },
          { name: "Purple Soft", token: "lyra-accent-purple-soft", value: "#e6e0ff", description: "Soft purple background." },
          { name: "Purple Strong", token: "lyra-accent-purple-strong", value: "#6149c1", description: "Strong purple for text and icons." },
          { name: "Pink Soft", token: "lyra-accent-pink-soft", value: "#ffe0f5", description: "Soft pink background." },
          { name: "Pink Strong", token: "lyra-accent-pink-strong", value: "#b53389", description: "Strong pink for text and icons." },
        ]}
      />
    </div>
  ),
};

export const PrimaryColors: Story = {
  name: "Primary Colors",
  render: () => (
    <div className="max-w-[1200px]">
      <div className="mb-8">
        <h2 className="lyra-heading-xl text-lyra-fg-default mb-1">Primary Colors</h2>
        <p className="lyra-body-lg text-lyra-fg-secondary">
          Primary brand colors used for actions, links, active states, and focus indicators.
        </p>
      </div>

      {/* Color chips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-12">
        <Swatch name="On Primary" token="lyra-fg-on-primary" value="#ffffff" />
        <Swatch name="Active Subtle (fg)" token="lyra-fg-active-subtle" value="#f5faff" />
        <Swatch name="Active Subtle" token="lyra-bg-active-subtle" value="#ecf5fe" />
        <Swatch name="Active Moderate" token="lyra-bg-active-moderate" value="#D3E6FD" />
        <Swatch name="Primary" token="lyra-bg-primary" value="#166cca" />
        <Swatch name="Hover / Link" token="lyra-state-hover-primary" value="#185ba4" />
        <Swatch name="Pressed" token="lyra-state-pressed-primary" value="#164479" />
      </div>

      {/* Semantic aliases table */}
      <h3 className="lyra-heading-md text-lyra-fg-default mb-4">Semantic Aliases</h3>
      <AliasTableHeader hasDark />
      <AliasRow name="default" value="#166cca" darkValue="#166cca" token="lyra-bg-primary" />
      <AliasRow name="hover" value="#185ba4" darkValue="#185ba4" token="lyra-state-hover-primary" />
      <AliasRow name="pressed" value="#164479" darkValue="#164479" token="lyra-state-pressed-primary" />
      <AliasRow name="active-strong" value="#166cca" darkValue="#4896ec" token="lyra-bg-active-strong" />
      <AliasRow name="active-moderate" value="#D3E6FD" darkValue="rgba(72,150,236,0.20)" token="lyra-bg-active-moderate" />
      <AliasRow name="active-subtle" value="#ecf5fe" darkValue="rgba(72,150,236,0.12)" token="lyra-bg-active-subtle" />
      <AliasRow name="border-active" value="#166cca" darkValue="#4896ec" token="lyra-border-active" />
      <AliasRow name="border-focus" value="#185ba4" darkValue="#facb33" token="lyra-border-focus" />
      <AliasRow name="fg-on-primary" value="#ffffff" darkValue="#ffffff" token="lyra-fg-on-primary" />
      <AliasRow name="fg-link" value="#185ba4" darkValue="#a7d0fe" token="lyra-fg-link" />
      <AliasRow name="fg-active-strong" value="#185ba4" darkValue="#a7d0fe" token="lyra-fg-active-strong" />
      <AliasRow name="fg-active-subtle" value="#f5faff" darkValue="#0c2845" token="lyra-fg-active-subtle" />
    </div>
  ),
};

export const DestructiveColors: Story = {
  name: "Destructive Colors",
  render: () => (
    <div className="max-w-[1200px]">
      <div className="mb-8">
        <h2 className="lyra-heading-xl text-lyra-fg-default mb-1">Destructive Colors</h2>
        <p className="lyra-body-lg text-lyra-fg-secondary">
          Error and destructive colors used for delete actions, validation errors, and critical alerts.
        </p>
      </div>

      {/* Color chips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-12">
        <Swatch name="On Destructive" token="lyra-fg-on-primary" value="#ffffff" />
        <Swatch name="Critical Subtle" token="lyra-status-critical-subtle" value="#fff0f0" />
        <Swatch name="Critical Medium" token="lyra-status-critical-medium" value="#fa7f7f" />
        <Swatch name="Destructive" token="lyra-bg-destructive" value="#bc2626" />
        <Swatch name="Hover" token="lyra-state-hover-destructive" value="#902222" />
        <Swatch name="Pressed" token="lyra-state-pressed-destructive" value="#6d2222" />
        <Swatch name="Hover Critical Subtle" token="lyra-state-hover-critical-subtle" value="#ffebeb" />
        <Swatch name="Pressed Critical Subtle" token="lyra-state-pressed-critical-subtle" value="#ffe0e0" />
      </div>

      {/* Semantic aliases table */}
      <h3 className="lyra-heading-md text-lyra-fg-default mb-4">Semantic Aliases</h3>
      <AliasTableHeader hasDark />
      <AliasRow name="default" value="#bc2626" darkValue="#bd2a2a" token="lyra-bg-destructive" />
      <AliasRow name="hover" value="#902222" darkValue="#a32424" token="lyra-state-hover-destructive" />
      <AliasRow name="pressed" value="#6d2222" darkValue="#8a1f1f" token="lyra-state-pressed-destructive" />
      <AliasRow name="critical-strong" value="#bc2626" darkValue="#fa7f7f" token="lyra-status-critical-strong" />
      <AliasRow name="critical-medium" value="#fa7f7f" darkValue="#bd2a2a" token="lyra-status-critical-medium" />
      <AliasRow name="critical-subtle" value="#fff0f0" darkValue="rgba(227,69,69,0.12)" token="lyra-status-critical-subtle" />
      <AliasRow name="hover-critical-subtle" value="#ffebeb" darkValue="rgba(227,69,69,0.18)" token="lyra-state-hover-critical-subtle" />
      <AliasRow name="pressed-critical-subtle" value="#ffe0e0" darkValue="rgba(227,69,69,0.24)" token="lyra-state-pressed-critical-subtle" />
      <AliasRow name="fg-on-destructive" value="#ffffff" darkValue="#ffffff" token="lyra-fg-on-destructive" />
    </div>
  ),
};

export const SuccessColors: Story = {
  name: "Success Colors",
  render: () => (
    <div className="max-w-[1200px]">
      <div className="mb-8">
        <h2 className="lyra-heading-xl text-lyra-fg-default mb-1">Success Colors</h2>
        <p className="lyra-body-lg text-lyra-fg-secondary">
          Success colors used for confirmations, positive feedback, and completed states.
        </p>
      </div>

      {/* Color chips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-12">
        <Swatch name="Success Subtle" token="lyra-status-success-subtle" value="#ebfaed" />
        <Swatch name="Success Medium" token="lyra-status-success-medium" value="#5ac368" />
        <Swatch name="Success Strong" token="lyra-status-success-strong" value="#21742c" />
      </div>

      {/* Semantic aliases table */}
      <h3 className="lyra-heading-md text-lyra-fg-default mb-4">Semantic Aliases</h3>
      <AliasTableHeader hasDark />
      <AliasRow name="success-strong" value="#21742c" darkValue="#64b96f" token="lyra-status-success-strong" />
      <AliasRow name="success-medium" value="#5ac368" darkValue="#23722d" token="lyra-status-success-medium" />
      <AliasRow name="success-subtle" value="#ebfaed" darkValue="rgba(33,116,44,0.20)" token="lyra-status-success-subtle" />
    </div>
  ),
};

export const WarningColors: Story = {
  name: "Warning Colors",
  render: () => (
    <div className="max-w-[1200px]">
      <div className="mb-8">
        <h2 className="lyra-heading-xl text-lyra-fg-default mb-1">Warning Colors</h2>
        <p className="lyra-body-lg text-lyra-fg-secondary">
          Warning colors used for caution states, alerts, and attention-needed indicators.
        </p>
      </div>

      {/* Color chips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-12">
        <Swatch name="Warning Subtle" token="lyra-status-warning-subtle" value="#fffae0" />
        <Swatch name="Warning Medium" token="lyra-status-warning-medium" value="#fcce36" />
        <Swatch name="Warning Strong" token="lyra-status-warning-strong" value="#8e6800" />
      </div>

      {/* Semantic aliases table */}
      <h3 className="lyra-heading-md text-lyra-fg-default mb-4">Semantic Aliases</h3>
      <AliasTableHeader hasDark />
      <AliasRow name="warning-strong" value="#8e6800" darkValue="#facb33" token="lyra-status-warning-strong" />
      <AliasRow name="warning-medium" value="#fcce36" darkValue="#8e6800" token="lyra-status-warning-medium" />
      <AliasRow name="warning-subtle" value="#fffae0" darkValue="rgba(142,104,0,0.20)" token="lyra-status-warning-subtle" />
    </div>
  ),
};

export const NeutralColors: Story = {
  name: "Neutral Colors",
  render: () => (
    <div className="max-w-[1200px]">
      <div className="mb-8">
        <h2 className="lyra-heading-xl text-lyra-fg-default mb-1">Neutral Colors</h2>
        <p className="lyra-body-lg text-lyra-fg-secondary">
          Neutral colors used for text, backgrounds, borders, and UI structure.
        </p>
      </div>

      {/* Color chips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-12">
        <Swatch name="Surface Base" token="lyra-bg-surface-base" value="#ffffff" />
        <Swatch name="Surface Canvas" token="lyra-bg-surface-canvas" value="#fcfcfd" />
        <Swatch name="Surface Shell" token="lyra-bg-surface-shell" value="#f3f5f6" />
        <Swatch name="Disabled" token="lyra-bg-disabled" value="rgba(0,0,0,0.06)" />
        <Swatch name="Hover" token="lyra-state-hover" value="rgba(0,0,0,0.04)" />
        <Swatch name="Pressed" token="lyra-state-pressed" value="rgba(0,0,0,0.10)" />
        <Swatch name="Border Subtle" token="lyra-border-subtle" value="rgba(0,0,0,0.10)" />
        <Swatch name="Border Default" token="lyra-border-default" value="rgba(0,0,0,0.16)" />
        <Swatch name="Border Medium" token="lyra-border-medium" value="rgba(0,0,0,0.32)" />
        <Swatch name="Border Strong" token="lyra-border-strong" value="rgba(0,0,0,0.46)" />
        <Swatch name="Fg Secondary" token="lyra-fg-secondary" value="rgba(0,0,0,0.56)" />
        <Swatch name="Fg Default" token="lyra-fg-default" value="rgba(0,0,0,0.80)" />
        <Swatch name="Surface Inverse" token="lyra-bg-surface-inverse" value="#2a2d32" />
      </div>

      {/* Semantic aliases table */}
      <h3 className="lyra-heading-md text-lyra-fg-default mb-4">Semantic Aliases</h3>
      <AliasTableHeader hasDark />
      <AliasRow name="surface-base" value="#ffffff" darkValue="#1f1f1e" token="lyra-bg-surface-base" />
      <AliasRow name="surface-canvas" value="#fcfcfd" darkValue="#141414" token="lyra-bg-surface-canvas" />
      <AliasRow name="surface-container" value="#ffffff" darkValue="#1f1f1e" token="lyra-bg-surface-container" />
      <AliasRow name="surface-container-subtle" value="#fbfcfe" darkValue="#262626" token="lyra-bg-surface-container-subtle" />
      <AliasRow name="surface-shell" value="#f3f5f6" darkValue="#2e2e2e" token="lyra-bg-surface-shell" />
      <AliasRow name="surface-backdrop" value="rgba(0,0,0,0.24)" darkValue="rgba(0,0,0,0.24)" token="lyra-bg-surface-backdrop" />
      <AliasRow name="surface-overlay" value="#ffffff" darkValue="#2e2e2e" token="lyra-bg-surface-overlay" />
      <AliasRow name="surface-inverse" value="#2a2d32" darkValue="#eceff3" token="lyra-bg-surface-inverse" />
      <AliasRow name="control" value="#ffffff" darkValue="#1f1f1e" token="lyra-bg-control" />
      <AliasRow name="control-subtle" value="rgba(0,0,0,0.02)" darkValue="rgba(255,255,255,0.04)" token="lyra-bg-control-subtle" />
      <AliasRow name="field" value="#ffffff" darkValue="rgba(255,255,255,0.04)" token="lyra-bg-field" />
      <AliasRow name="disabled" value="rgba(0,0,0,0.06)" darkValue="rgba(255,255,255,0.04)" token="lyra-bg-disabled" />
      <AliasRow name="hover" value="rgba(0,0,0,0.04)" darkValue="rgba(255,255,255,0.06)" token="lyra-state-hover" />
      <AliasRow name="pressed" value="rgba(0,0,0,0.10)" darkValue="rgba(255,255,255,0.12)" token="lyra-state-pressed" />
      <AliasRow name="border-subtle" value="rgba(0,0,0,0.10)" darkValue="rgba(255,255,255,0.10)" token="lyra-border-subtle" />
      <AliasRow name="border-default" value="rgba(0,0,0,0.16)" darkValue="rgba(255,255,255,0.16)" token="lyra-border-default" />
      <AliasRow name="border-medium" value="rgba(0,0,0,0.32)" darkValue="rgba(255,255,255,0.32)" token="lyra-border-medium" />
      <AliasRow name="border-strong" value="rgba(0,0,0,0.46)" darkValue="rgba(255,255,255,0.46)" token="lyra-border-strong" />
      <AliasRow name="border-disabled" value="rgba(0,0,0,0.10)" darkValue="rgba(255,255,255,0.10)" token="lyra-border-disabled" />
      <AliasRow name="border-inverse" value="rgba(255,255,255,0.80)" darkValue="rgba(0,0,0,0.80)" token="lyra-border-inverse" />
      <AliasRow name="fg-default" value="rgba(0,0,0,0.80)" darkValue="rgba(255,255,255,0.80)" token="lyra-fg-default" />
      <AliasRow name="fg-secondary" value="rgba(0,0,0,0.56)" darkValue="rgba(255,255,255,0.60)" token="lyra-fg-secondary" />
      <AliasRow name="fg-disabled" value="rgba(0,0,0,0.30)" darkValue="rgba(255,255,255,0.20)" token="lyra-fg-disabled" />
      <AliasRow name="fg-inverse" value="#ffffff" darkValue="#1f1f1e" token="lyra-fg-inverse" />
      <AliasRow name="fg-action" value="#5D6A79" darkValue="#acb7c3" token="lyra-fg-action" />
    </div>
  ),
};
