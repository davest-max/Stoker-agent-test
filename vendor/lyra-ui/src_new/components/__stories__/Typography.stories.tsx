import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta = {
  title: "Foundations/Typography",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj;

/* ── Font Family ── */

export const FontFamily: Story = {
  name: "Font Family",
  render: () => (
    <div className="space-y-12 max-w-[1200px]">
      <div>
        <h2 className="lyra-heading-xl text-lyra-fg-default mb-1">Font Family</h2>
        <p className="lyra-body-lg text-lyra-fg-secondary">
          Lyra uses Inter as the primary typeface across all UI elements.
        </p>
      </div>

      <div>
        <h3 className="lyra-heading-md text-lyra-fg-default mb-1">Inter</h3>
        <p className="lyra-body-md text-lyra-fg-secondary mb-4">
          A variable font optimized for screen readability at small sizes. Available from Google Fonts.
        </p>

        <div className="rounded-lyra-lg border border-lyra-border-subtle" style={{ padding: 32 }}>
          <div style={{ fontSize: 48, fontWeight: 400, lineHeight: 1.2 }} className="text-lyra-fg-default mb-4">
            Aa Bb Cc Dd Ee Ff Gg Hh Ii
          </div>
          <div style={{ fontSize: 48, fontWeight: 500, lineHeight: 1.2 }} className="text-lyra-fg-default mb-4">
            Aa Bb Cc Dd Ee Ff Gg Hh Ii
          </div>
          <div style={{ fontSize: 24, fontWeight: 400, lineHeight: 1.4 }} className="text-lyra-fg-secondary mb-2">
            ABCDEFGHIJKLMNOPQRSTUVWXYZ
          </div>
          <div style={{ fontSize: 24, fontWeight: 400, lineHeight: 1.4 }} className="text-lyra-fg-secondary mb-2">
            abcdefghijklmnopqrstuvwxyz
          </div>
          <div style={{ fontSize: 24, fontWeight: 400, lineHeight: 1.4 }} className="text-lyra-fg-secondary">
            0123456789 !@#$%^&amp;*()
          </div>
        </div>

        <table className="w-full border-collapse mt-6">
          <thead>
            <tr className="border-b border-lyra-border-medium">
              <th className="py-2 pr-4 text-left lyra-body-sm-emphasis text-lyra-fg-secondary">Property</th>
              <th className="py-2 text-left lyra-body-sm-emphasis text-lyra-fg-secondary">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-lyra-border-subtle">
              <td className="py-3 pr-4 lyra-body-md-emphasis text-lyra-fg-default">Font Family</td>
              <td className="py-3 lyra-body-md text-lyra-fg-secondary font-mono">Inter, ui-sans-serif, system-ui, -apple-system, sans-serif</td>
            </tr>
            <tr className="border-b border-lyra-border-subtle">
              <td className="py-3 pr-4 lyra-body-md-emphasis text-lyra-fg-default">Weights Used</td>
              <td className="py-3 lyra-body-md text-lyra-fg-secondary font-mono">400 (Regular), 500 (Medium)</td>
            </tr>
            <tr className="border-b border-lyra-border-subtle">
              <td className="py-3 pr-4 lyra-body-md-emphasis text-lyra-fg-default">Source</td>
              <td className="py-3 lyra-body-md text-lyra-fg-link">Google Fonts — Inter</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  ),
};

/* ── Font Size ── */

const fontSizes = [
  { token: "text-xs", size: "12px", rem: "0.75rem", usage: "Small labels, captions, helper text" },
  { token: "text-sm", size: "14px", rem: "0.875rem", usage: "Body text, form labels, table content" },
  { token: "text-base", size: "16px", rem: "1rem", usage: "Large body text, headings (md)" },
  { token: "text-lg", size: "20px", rem: "1.25rem", usage: "Heading (lg)" },
  { token: "text-xl", size: "24px", rem: "1.5rem", usage: "Heading (xl), page titles" },
];

export const FontSize: Story = {
  name: "Font Size",
  render: () => (
    <div className="space-y-12 max-w-[1200px]">
      <div>
        <h2 className="lyra-heading-xl text-lyra-fg-default mb-1">Font Size</h2>
        <p className="lyra-body-lg text-lyra-fg-secondary">
          The Lyra type scale uses five sizes ranging from 12px to 24px.
        </p>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-lyra-border-medium">
            <th className="py-2 pr-4 text-left lyra-body-sm-emphasis text-lyra-fg-secondary">Size</th>
            <th className="py-2 pr-4 text-left lyra-body-sm-emphasis text-lyra-fg-secondary">Pixels</th>
            <th className="py-2 pr-4 text-left lyra-body-sm-emphasis text-lyra-fg-secondary">Rem</th>
            <th className="py-2 pr-4 text-left lyra-body-sm-emphasis text-lyra-fg-secondary">Usage</th>
            <th className="py-2 text-left lyra-body-sm-emphasis text-lyra-fg-secondary">Preview</th>
          </tr>
        </thead>
        <tbody>
          {fontSizes.map((f) => (
            <tr key={f.token} className="border-b border-lyra-border-subtle">
              <td className="py-4 pr-4 lyra-body-md-emphasis text-lyra-fg-default whitespace-nowrap align-middle">{f.token}</td>
              <td className="py-4 pr-4 lyra-body-md text-lyra-fg-secondary font-mono whitespace-nowrap align-middle">{f.size}</td>
              <td className="py-4 pr-4 lyra-body-md text-lyra-fg-secondary font-mono whitespace-nowrap align-middle">{f.rem}</td>
              <td className="py-4 pr-4 lyra-body-md text-lyra-fg-disabled whitespace-nowrap align-middle">{f.usage}</td>
              <td className="py-4 align-middle">
                <span className="text-lyra-fg-default" style={{ fontSize: f.size }}>The quick brown fox</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
};

/* ── Line Height ── */

const lineHeights = [
  { size: "12px", lineHeight: "16px", ratio: "1.33" },
  { size: "14px", lineHeight: "20px", ratio: "1.43" },
  { size: "16px", lineHeight: "24px", ratio: "1.50" },
  { size: "20px", lineHeight: "24px", ratio: "1.20" },
  { size: "24px", lineHeight: "28px", ratio: "1.17" },
];

export const LineHeight: Story = {
  name: "Line Height",
  render: () => (
    <div className="space-y-12 max-w-[1200px]">
      <div>
        <h2 className="lyra-heading-xl text-lyra-fg-default mb-1">Line Height</h2>
        <p className="lyra-body-lg text-lyra-fg-secondary">
          Each font size has a paired line height for optimal readability.
        </p>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-lyra-border-medium">
            <th className="py-2 pr-4 text-left lyra-body-sm-emphasis text-lyra-fg-secondary">Font Size</th>
            <th className="py-2 pr-4 text-left lyra-body-sm-emphasis text-lyra-fg-secondary">Line Height</th>
            <th className="py-2 pr-4 text-left lyra-body-sm-emphasis text-lyra-fg-secondary">Ratio</th>
            <th className="py-2 text-left lyra-body-sm-emphasis text-lyra-fg-secondary">Preview</th>
          </tr>
        </thead>
        <tbody>
          {lineHeights.map((l) => (
            <tr key={l.size} className="border-b border-lyra-border-subtle">
              <td className="py-4 pr-4 lyra-body-md-emphasis text-lyra-fg-default font-mono whitespace-nowrap align-top">{l.size}</td>
              <td className="py-4 pr-4 lyra-body-md text-lyra-fg-secondary font-mono whitespace-nowrap align-top">{l.lineHeight}</td>
              <td className="py-4 pr-4 lyra-body-md text-lyra-fg-secondary font-mono whitespace-nowrap align-top">{l.ratio}</td>
              <td className="py-4 align-top" style={{ maxWidth: 400 }}>
                <span className="text-lyra-fg-default" style={{ fontSize: l.size, lineHeight: l.lineHeight }}>
                  The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
};

/* ── Presets ── */

const presets = [
  { class: "lyra-heading-2xl", category: "Heading", name: "2XL", size: "28px", lineHeight: "32px", weight: "700", letterSpacing: "-0.02rem" },
  { class: "lyra-heading-xl", category: "Heading", name: "XL", size: "24px", lineHeight: "28px", weight: "500", letterSpacing: "-0.02rem" },
  { class: "lyra-heading-lg", category: "Heading", name: "LG", size: "20px", lineHeight: "24px", weight: "500", letterSpacing: "-0.01rem" },
  { class: "lyra-heading-md", category: "Heading", name: "MD", size: "16px", lineHeight: "24px", weight: "500", letterSpacing: "-0.01rem" },
  { class: "lyra-heading-sm", category: "Heading", name: "SM", size: "14px", lineHeight: "20px", weight: "500", letterSpacing: "0" },
  { class: "lyra-heading-xs", category: "Heading", name: "XS", size: "12px", lineHeight: "16px", weight: "500", letterSpacing: "0.01rem" },
  { class: "lyra-body-lg", category: "Body", name: "LG", size: "16px", lineHeight: "24px", weight: "400", letterSpacing: "-0.01rem" },
  { class: "lyra-body-lg-emphasis", category: "Body", name: "LG Emphasis", size: "16px", lineHeight: "24px", weight: "500", letterSpacing: "-0.01rem" },
  { class: "lyra-body-md", category: "Body", name: "MD", size: "14px", lineHeight: "20px", weight: "400", letterSpacing: "0" },
  { class: "lyra-body-md-emphasis", category: "Body", name: "MD Emphasis", size: "14px", lineHeight: "20px", weight: "500", letterSpacing: "0" },
  { class: "lyra-body-sm", category: "Body", name: "SM", size: "12px", lineHeight: "16px", weight: "400", letterSpacing: "0.01rem" },
  { class: "lyra-body-sm-emphasis", category: "Body", name: "SM Emphasis", size: "12px", lineHeight: "16px", weight: "500", letterSpacing: "0.01rem" },
  { class: "lyra-body-xs", category: "Body", name: "XS", size: "10px", lineHeight: "14px", weight: "400", letterSpacing: "0.01rem" },
  { class: "lyra-body-xs-emphasis", category: "Body", name: "XS Emphasis", size: "10px", lineHeight: "14px", weight: "500", letterSpacing: "0.01rem" },
  { class: "lyra-label", category: "Label", name: "Default", size: "14px", lineHeight: "20px", weight: "500", letterSpacing: "0" },
];

export const Presets: Story = {
  name: "Presets",
  render: () => (
    <div className="space-y-12 max-w-[1200px]">
      <div>
        <h2 className="lyra-heading-xl text-lyra-fg-default mb-1">Typography Presets</h2>
        <p className="lyra-body-lg text-lyra-fg-secondary">
          Pre-defined type styles combining size, weight, line height, and letter spacing. Apply with a single class.
        </p>
      </div>

      {/* Visual preview */}
      <div>
        <h3 className="lyra-heading-md text-lyra-fg-default mb-1">Preview</h3>
        <p className="lyra-body-md text-lyra-fg-secondary mb-4">
          Each preset shown at its actual rendered size and weight.
        </p>
        <div className="rounded-lyra-lg border border-lyra-border-subtle" style={{ padding: 32 }}>
          {presets.map((p) => (
            <div key={p.class} className="flex items-baseline gap-4 mb-4 last:mb-0">
              <div className="lyra-body-sm text-lyra-fg-disabled font-mono" style={{ width: 200, flexShrink: 0 }}>{p.class}</div>
              <div className={`${p.class} text-lyra-fg-default`}>The quick brown fox jumps over the lazy dog</div>
            </div>
          ))}
        </div>
      </div>

      {/* Reference table */}
      <div>
        <h3 className="lyra-heading-md text-lyra-fg-default mb-1">Reference</h3>
        <p className="lyra-body-md text-lyra-fg-secondary mb-4">
          Full specification for each typography preset.
        </p>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-lyra-border-medium">
              <th className="py-2 pr-4 text-left lyra-body-sm-emphasis text-lyra-fg-secondary">Class</th>
              <th className="py-2 pr-4 text-left lyra-body-sm-emphasis text-lyra-fg-secondary">Category</th>
              <th className="py-2 pr-4 text-left lyra-body-sm-emphasis text-lyra-fg-secondary">Size</th>
              <th className="py-2 pr-4 text-left lyra-body-sm-emphasis text-lyra-fg-secondary">Line Height</th>
              <th className="py-2 pr-4 text-left lyra-body-sm-emphasis text-lyra-fg-secondary">Weight</th>
              <th className="py-2 text-left lyra-body-sm-emphasis text-lyra-fg-secondary">Letter Spacing</th>
            </tr>
          </thead>
          <tbody>
            {presets.map((p) => (
              <tr key={p.class} className="border-b border-lyra-border-subtle">
                <td className="py-3 pr-4 lyra-body-md text-lyra-fg-action font-mono whitespace-nowrap align-middle">{p.class}</td>
                <td className="py-3 pr-4 lyra-body-md-emphasis text-lyra-fg-default whitespace-nowrap align-middle">{p.category}</td>
                <td className="py-3 pr-4 lyra-body-md text-lyra-fg-secondary font-mono whitespace-nowrap align-middle">{p.size}</td>
                <td className="py-3 pr-4 lyra-body-md text-lyra-fg-secondary font-mono whitespace-nowrap align-middle">{p.lineHeight}</td>
                <td className="py-3 pr-4 lyra-body-md text-lyra-fg-secondary font-mono whitespace-nowrap align-middle">{p.weight}</td>
                <td className="py-3 lyra-body-md text-lyra-fg-secondary font-mono whitespace-nowrap align-middle">{p.letterSpacing}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  ),
};
