import type { Meta, StoryObj } from "@storybook/react";
import { within, userEvent } from "@storybook/test";
import { Menu, type MenuEntry } from "../menu";
import { Input } from "../input";
import { Box, FileText, Copy, Scissors, Clipboard, Share2, Download, Trash2, FolderOpen, Users, Link, Mail, Search, X } from "lucide-react";

const meta: Meta<typeof Menu> = {
  title: "Atoms/Menu",
  component: Menu,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    backgrounds: { default: "lyra-shell" },
  },
};

export default meta;
type Story = StoryObj<typeof Menu>;

/* ── Basic (no icons) ── */

const defaultItems: MenuEntry[] = [
  { id: "1", label: "Menu Item" },
  { id: "2", label: "Menu Item" },
  { id: "3", label: "Menu Item" },
  "separator",
  { id: "4", label: "Menu Item" },
  { id: "5", label: "Menu Item", submenu: [
    { id: "5a", label: "Sub Item 1" },
    { id: "5b", label: "Sub Item 2" },
    { id: "5c", label: "Sub Item 3" },
  ]},
  "separator",
  { id: "6", label: "Delete", destructive: true },
];

export const Default: Story = {
  name: "Default",
  render: () => (
    <Menu items={defaultItems} className="w-64" />
  ),
};

/* ── Width Scale (canonical reference — see CONTRIBUTING.md
   "Menu / Popover width scale") ──
   Menu itself only enforces a 200px floor and sizes to content above
   that — this story visualizes the three fixed widths a wrapping
   Popover should pick from instead of an arbitrary value. */

export const WidthScale: Story = {
  name: "Width Scale",
  parameters: { layout: "padded" },
  render: () => (
    <div className="flex flex-wrap items-start gap-8">
      <div className="flex flex-col gap-2">
        <div>
          <p className="lyra-body-sm-emphasis text-lyra-fg-default">sm — 200px</p>
          <p className="lyra-body-xs text-lyra-fg-secondary">Simple item-only menus, no header or search row</p>
        </div>
        <Menu
          items={[
            { id: "1", label: "Cut", icon: <Scissors className="h-4 w-4" strokeWidth={1.5} /> },
            { id: "2", label: "Copy", icon: <Copy className="h-4 w-4" strokeWidth={1.5} /> },
            { id: "3", label: "Paste", icon: <Clipboard className="h-4 w-4" strokeWidth={1.5} /> },
            "separator",
            { id: "4", label: "Delete", icon: <Trash2 className="h-4 w-4" strokeWidth={1.5} />, destructive: true },
          ]}
          className="w-[200px]"
        />
      </div>

      <div className="flex flex-col gap-2">
        <div>
          <p className="lyra-body-sm-emphasis text-lyra-fg-default">md — 256px (w-64)</p>
          <p className="lyra-body-xs text-lyra-fg-secondary">A search/filter row above the list (e.g. agent-profile.tsx)</p>
        </div>
        <div className="w-64 overflow-hidden rounded-lyra-lg border border-lyra-border-subtle bg-lyra-bg-surface-overlay shadow-lg">
          <div className="px-3 py-2.5 border-b border-lyra-border-subtle">
            <Input
              type="text"
              placeholder="Search statuses"
              startIcon={<Search className="h-4 w-4 text-lyra-fg-disabled" strokeWidth={1.4} aria-hidden="true" />}
            />
          </div>
          <Menu
            items={[
              { id: "1", label: "Available" },
              { id: "2", label: "Away" },
              { id: "3", label: "Do not disturb" },
            ]}
            className="rounded-none border-0 bg-transparent p-1 shadow-none"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div>
          <p className="lyra-body-sm-emphasis text-lyra-fg-default">lg — 320px</p>
          <p className="lyra-body-xs text-lyra-fg-secondary">A title header + close button, or icon items (e.g. create-new.tsx)</p>
        </div>
        <div className="w-[320px] overflow-hidden rounded-lyra-lg border border-lyra-border-subtle bg-lyra-bg-surface-overlay shadow-lg">
          <div className="flex items-center justify-between border-b border-lyra-border-subtle px-4 py-3">
            <span className="lyra-body-lg-emphasis text-lyra-fg-default">New Outbound</span>
            <X className="h-4 w-4 text-lyra-fg-secondary" strokeWidth={1.5} aria-hidden="true" />
          </div>
          <Menu
            items={[
              { id: "1", label: "Call", icon: <FileText className="h-4 w-4" strokeWidth={1.5} /> },
              { id: "2", label: "Email", icon: <Mail className="h-4 w-4" strokeWidth={1.5} /> },
              { id: "3", label: "SMS", icon: <Share2 className="h-4 w-4" strokeWidth={1.5} /> },
            ]}
            className="rounded-none border-0 bg-transparent p-2 shadow-none"
          />
        </div>
      </div>
    </div>
  ),
};

/* ── Simple ── */

export const Simple: Story = {
  name: "Simple",
  render: () => (
    <Menu
      items={[
        { id: "1", label: "Cut", icon: <Scissors className="h-4 w-4" strokeWidth={1.5} />, shortcut: "⌘X" },
        { id: "2", label: "Copy", icon: <Copy className="h-4 w-4" strokeWidth={1.5} />, shortcut: "⌘C" },
        { id: "3", label: "Paste", icon: <Clipboard className="h-4 w-4" strokeWidth={1.5} />, shortcut: "⌘V" },
      ]}
      className="w-64"
    />
  ),
};

/* ── With Icons & Shortcuts ── */

export const WithIconsAndShortcuts: Story = {
  name: "With Icons & Shortcuts",
  render: () => (
    <Menu
      items={[
        { id: "1", label: "New File", icon: <FileText className="h-4 w-4" strokeWidth={1.5} />, shortcut: "⌘N" },
        { id: "2", label: "Open Recent", icon: <FolderOpen className="h-4 w-4" strokeWidth={1.5} />, submenu: [
          { id: "2a", label: "project-alpha.ts" },
          { id: "2b", label: "dashboard.tsx" },
          { id: "2c", label: "settings.json" },
        ]},
        "separator",
        { id: "3", label: "Share", icon: <Share2 className="h-4 w-4" strokeWidth={1.5} />, submenu: [
          { id: "3a", label: "Copy Link", icon: <Link className="h-4 w-4" strokeWidth={1.5} /> },
          { id: "3b", label: "Email", icon: <Mail className="h-4 w-4" strokeWidth={1.5} /> },
          { id: "3c", label: "Invite People", icon: <Users className="h-4 w-4" strokeWidth={1.5} /> },
        ]},
        { id: "4", label: "Export", icon: <Download className="h-4 w-4" strokeWidth={1.5} />, submenu: [
          { id: "4a", label: "PDF" },
          { id: "4b", label: "CSV" },
          { id: "4c", label: "JSON" },
        ]},
        "separator",
        { id: "5", label: "Delete", icon: <Trash2 className="h-4 w-4" strokeWidth={1.5} />, destructive: true, shortcut: "⌫" },
      ]}
      className="w-64"
    />
  ),
};

/* ── With Submenus (interactive flyout) ── */

export const WithSubmenus: Story = {
  name: "With Submenus",
  render: () => (
    <div className="pl-4 pt-4" style={{ minHeight: 400 }}>
      <Menu
        items={[
          { id: "1", label: "New File", icon: <FileText className="h-4 w-4" strokeWidth={1.5} /> },
          { id: "2", label: "Open Recent", icon: <FolderOpen className="h-4 w-4" strokeWidth={1.5} />, submenu: [
            { id: "2a", label: "project-alpha.ts" },
            { id: "2b", label: "dashboard.tsx" },
            { id: "2c", label: "settings.json" },
          ]},
          "separator",
          { id: "3", label: "Share", icon: <Share2 className="h-4 w-4" strokeWidth={1.5} />, submenu: [
            { id: "3a", label: "Copy Link", icon: <Link className="h-4 w-4" strokeWidth={1.5} /> },
            { id: "3b", label: "Email", icon: <Mail className="h-4 w-4" strokeWidth={1.5} /> },
            { id: "3c", label: "Invite People", icon: <Users className="h-4 w-4" strokeWidth={1.5} />, submenu: [
              { id: "3c1", label: "From contacts" },
              { id: "3c2", label: "By email" },
            ]},
          ]},
          { id: "4", label: "Export", icon: <Download className="h-4 w-4" strokeWidth={1.5} />, submenu: [
            { id: "4a", label: "PDF" },
            { id: "4b", label: "CSV" },
            { id: "4c", label: "JSON" },
          ]},
          "separator",
          { id: "5", label: "Delete", icon: <Trash2 className="h-4 w-4" strokeWidth={1.5} />, destructive: true },
        ]}
        className="w-64"
      />
    </div>
  ),
};

/* ── Submenu Open (interactive) ──
   Clicks the real "Open Recent" item on mount so the submenu flyout is
   visible without a manual hover/click — this drives the actual component
   through @storybook/test rather than mocking up the flyout separately, so
   it can never fall out of sync with the real implementation. Also serves
   as a regression check for two fixes: (1) the flyout top-aligns with the
   row that opened it, not the top of the whole menu, and (2) clicking an
   already-hover-opened submenu keeps it open instead of toggling it closed. */

export const SubmenuOpen: Story = {
  name: "Submenu Open",
  render: () => (
    <div className="pl-4 pt-4" style={{ minHeight: 320 }}>
      <Menu
        items={[
          { id: "1", label: "New File", icon: <FileText className="h-4 w-4" strokeWidth={1.5} /> },
          { id: "2", label: "Open Recent", icon: <FolderOpen className="h-4 w-4" strokeWidth={1.5} />, submenu: [
            { id: "2a", label: "project-alpha.ts" },
            { id: "2b", label: "dashboard.tsx" },
            { id: "2c", label: "settings.json" },
          ]},
          "separator",
          { id: "3", label: "Share", icon: <Share2 className="h-4 w-4" strokeWidth={1.5} />, submenu: [
            { id: "3a", label: "Copy Link", icon: <Link className="h-4 w-4" strokeWidth={1.5} /> },
            { id: "3b", label: "Email", icon: <Mail className="h-4 w-4" strokeWidth={1.5} /> },
          ]},
          "separator",
          { id: "4", label: "Delete", icon: <Trash2 className="h-4 w-4" strokeWidth={1.5} />, destructive: true },
        ]}
        className="w-64"
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = await canvas.findByText("Open Recent");
    await userEvent.click(trigger);
  },
};

/* ── With Disabled Items ── */

export const WithDisabled: Story = {
  name: "With Disabled Items",
  render: () => (
    <Menu
      items={[
        { id: "1", label: "Edit", icon: <FileText className="h-4 w-4" strokeWidth={1.5} /> },
        { id: "2", label: "Duplicate", icon: <Copy className="h-4 w-4" strokeWidth={1.5} /> },
        "separator",
        { id: "3", label: "Archive", disabled: true },
        { id: "4", label: "Move", submenu: [
          { id: "4a", label: "Folder A" },
          { id: "4b", label: "Folder B" },
        ]},
        "separator",
        { id: "5", label: "Delete", destructive: true, icon: <Trash2 className="h-4 w-4" strokeWidth={1.5} /> },
      ]}
      className="w-[200px]"
    />
  ),
};

/* ── With Descriptions ── */

export const WithDescriptions: Story = {
  name: "With Descriptions",
  render: () => (
    <Menu
      items={[
        { id: "1", label: "Item label" },
        { id: "2", label: "Item label", icon: <Box className="h-4 w-4" strokeWidth={1.5} />, description: "Secondary Text" },
        "separator",
        { id: "3", label: "Import from file", icon: <FileText className="h-4 w-4" strokeWidth={1.5} />, description: "Upload a CSV or JSON file" },
        { id: "4", label: "Connect service", icon: <Share2 className="h-4 w-4" strokeWidth={1.5} />, description: "Link an external data source" },
      ]}
      className="w-64"
    />
  ),
};

/* ── All Variants ── */

export const AllVariants: Story = {
  name: "All Variants",
  render: () => (
    <div className="flex flex-wrap gap-8 items-start">
      {/* No icons */}
      <div className="flex flex-col gap-2">
        <p className="lyra-body-sm-emphasis text-lyra-fg-secondary">Without icons</p>
        <Menu
          items={[
            { id: "1", label: "Menu Item" },
            { id: "2", label: "Menu Item" },
            { id: "3", label: "Menu Item" },
          ]}
          className="w-[200px]"
        />
      </div>

      {/* With icons */}
      <div className="flex flex-col gap-2">
        <p className="lyra-body-sm-emphasis text-lyra-fg-secondary">With icons</p>
        <Menu
          items={[
            { id: "1", label: "Copy", icon: <Copy className="h-4 w-4" strokeWidth={1.5} /> },
            { id: "2", label: "Share", icon: <Share2 className="h-4 w-4" strokeWidth={1.5} /> },
            { id: "3", label: "Download", icon: <Download className="h-4 w-4" strokeWidth={1.5} /> },
          ]}
          className="w-[200px]"
        />
      </div>

      {/* With shortcuts */}
      <div className="flex flex-col gap-2">
        <p className="lyra-body-sm-emphasis text-lyra-fg-secondary">With shortcuts</p>
        <Menu
          items={[
            { id: "1", label: "Cut", icon: <Scissors className="h-4 w-4" strokeWidth={1.5} />, shortcut: "⌘X" },
            { id: "2", label: "Copy", icon: <Copy className="h-4 w-4" strokeWidth={1.5} />, shortcut: "⌘C" },
            { id: "3", label: "Paste", icon: <Clipboard className="h-4 w-4" strokeWidth={1.5} />, shortcut: "⌘V" },
          ]}
          className="w-[200px]"
        />
      </div>

      {/* With dividers */}
      <div className="flex flex-col gap-2">
        <p className="lyra-body-sm-emphasis text-lyra-fg-secondary">With dividers</p>
        <Menu
          items={[
            { id: "1", label: "Edit", icon: <FileText className="h-4 w-4" strokeWidth={1.5} /> },
            { id: "2", label: "Duplicate", icon: <Copy className="h-4 w-4" strokeWidth={1.5} /> },
            "separator",
            { id: "3", label: "Download", icon: <Download className="h-4 w-4" strokeWidth={1.5} /> },
            "separator",
            { id: "4", label: "Delete", icon: <Trash2 className="h-4 w-4" strokeWidth={1.5} />, destructive: true },
          ]}
          className="w-[200px]"
        />
      </div>

      {/* With disabled items */}
      <div className="flex flex-col gap-2">
        <p className="lyra-body-sm-emphasis text-lyra-fg-secondary">With disabled items</p>
        <Menu
          items={[
            { id: "1", label: "Edit", icon: <FileText className="h-4 w-4" strokeWidth={1.5} /> },
            { id: "2", label: "Archive", disabled: true },
            "separator",
            { id: "3", label: "Delete", destructive: true, icon: <Trash2 className="h-4 w-4" strokeWidth={1.5} /> },
          ]}
          className="w-[200px]"
        />
      </div>

      {/* With descriptions */}
      <div className="flex flex-col gap-2">
        <p className="lyra-body-sm-emphasis text-lyra-fg-secondary">With descriptions</p>
        <Menu
          items={[
            { id: "1", label: "Import from file", icon: <FileText className="h-4 w-4" strokeWidth={1.5} />, description: "Upload a CSV or JSON file" },
            { id: "2", label: "Connect service", icon: <Share2 className="h-4 w-4" strokeWidth={1.5} />, description: "Link an external data source" },
          ]}
          className="w-64"
        />
      </div>
    </div>
  ),
};

/* ── All Item States (matches Figma) ── */

export const AllStates: Story = {
  name: "All Item States",
  render: () => (
    <div className="flex flex-col gap-1 w-[320px]">
      <p className="lyra-body-sm text-lyra-fg-secondary mb-2">
        Hover and click items to see all interactive states — accent bar, hover bg, pressed bg, destructive variants.
      </p>
      <Menu
        items={[
          { id: "1", label: "Menu Item", icon: <Box className="h-4 w-4" strokeWidth={1.5} />, shortcut: "⌘⌥S", submenu: [
            { id: "1a", label: "Sub Item" },
          ]},
          { id: "2", label: "Menu Item (no icon)", shortcut: "⌘⌥S", submenu: [
            { id: "2a", label: "Sub Item" },
          ]},
          "separator",
          { id: "3", label: "Menu Item", icon: <Box className="h-4 w-4" strokeWidth={1.5} />, shortcut: "⌘⌥S" },
          { id: "4", label: "Disabled Item", icon: <Box className="h-4 w-4" strokeWidth={1.5} />, shortcut: "⌘⌥S", disabled: true },
          "separator",
          { id: "5", label: "Destructive Item", icon: <Box className="h-4 w-4" strokeWidth={1.5} />, destructive: true, shortcut: "⌘⌥S" },
        ]}
        className="w-[320px]"
      />
    </div>
  ),
};
