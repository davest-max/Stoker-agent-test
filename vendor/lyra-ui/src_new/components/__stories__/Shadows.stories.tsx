import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta = {
  title: "Foundations/Shadows",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj;

const shadowScale = [
  { token: "shadow-xs", cssVar: "lyra-shadow-xs", tailwind: "shadow-xs", opacity: "6%", twClass: "shadow" },
  { token: "shadow-sm", cssVar: "lyra-shadow-sm", tailwind: "shadow-sm", opacity: "10%", twClass: "shadow-sm" },
  { token: "shadow-md", cssVar: "lyra-shadow-md", tailwind: "shadow-md", opacity: "12%", twClass: "shadow-md" },
  { token: "shadow-lg", cssVar: "lyra-shadow-lg", tailwind: "shadow-lg", opacity: "14%", twClass: "shadow-lg" },
  { token: "shadow-xl", cssVar: "lyra-shadow-xl", tailwind: "shadow-xl", opacity: "16%", twClass: "shadow-xl" },
  { token: "shadow-2xl", cssVar: "lyra-shadow-2xl", tailwind: "shadow-2xl", opacity: "18%", twClass: "shadow-2xl" },
];

export const Table: Story = {
  name: "Table",
  render: () => (
    <div className="max-w-[1200px]">
      <div className="mb-8">
        <h2 className="lyra-heading-xl text-lyra-fg-default mb-1">Shadows Table</h2>
        <p className="lyra-body-lg text-lyra-fg-secondary">
          Elevation shadows used for cards, dropdowns, modals, and overlays.
        </p>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-lyra-border-medium">
            <th className="py-2 pr-4 text-left lyra-body-sm-emphasis text-lyra-fg-secondary">Token</th>
            <th className="py-2 pr-4 text-left lyra-body-sm-emphasis text-lyra-fg-secondary">CSS Variable</th>
            <th className="py-2 pr-4 text-left lyra-body-sm-emphasis text-lyra-fg-secondary">Class</th>
            <th className="py-2 pr-4 text-left lyra-body-sm-emphasis text-lyra-fg-secondary">Opacity</th>
            <th className="py-2 text-left lyra-body-sm-emphasis text-lyra-fg-secondary">Preview</th>
          </tr>
        </thead>
        <tbody>
          {shadowScale.map((s) => (
            <tr key={s.token} className="border-b border-lyra-border-subtle">
              <td className="py-8 pr-4 lyra-body-md-emphasis text-lyra-fg-default whitespace-nowrap align-middle">{s.token}</td>
              <td className="py-8 pr-4 lyra-body-md text-lyra-fg-disabled font-mono whitespace-nowrap align-middle">{s.cssVar}</td>
              <td className="py-8 pr-4 lyra-body-md text-lyra-fg-action font-mono whitespace-nowrap align-middle">{s.tailwind}</td>
              <td className="py-8 pr-4 lyra-body-md text-lyra-fg-secondary font-mono whitespace-nowrap align-middle">{s.opacity}</td>
              <td className="align-middle">
                <div style={{ paddingTop: 24, paddingBottom: 24 }}>
                  <div
                    className="rounded-lyra-md"
                    style={{
                      width: 56,
                      height: 56,
                      backgroundColor: "#ffffff",
                      boxShadow:
                        s.token === "shadow-xs" ? "0 1px 2px 0 rgba(0,0,0,0.05)" :
                        s.token === "shadow-sm" ? "0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)" :
                        s.token === "shadow-md" ? "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)" :
                        s.token === "shadow-lg" ? "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)" :
                        s.token === "shadow-xl" ? "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)" :
                        "0 25px 50px -12px rgba(0,0,0,0.25)",
                    }}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
};

export const Usage: Story = {
  name: "Usage",
  render: () => {
    const shadows = {
      xs: "0 1px 2px 0 rgba(0,0,0,0.05)",
      sm: "0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)",
      md: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
      lg: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)",
      xl: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
      "2xl": "0 25px 50px -12px rgba(0,0,0,0.25)",
    };

    return (
      <div className="space-y-12 max-w-[1200px]">
        <div>
          <h2 className="lyra-heading-xl text-lyra-fg-default mb-1">Shadow Usage</h2>
          <p className="lyra-body-lg text-lyra-fg-secondary">
            Guidelines for applying elevation shadows across different UI elements.
          </p>
        </div>

        {/* Cards */}
        <div>
          <h3 className="lyra-heading-md text-lyra-fg-default mb-1">Cards</h3>
          <p className="lyra-body-md text-lyra-fg-secondary mb-4">
            Use shadow-sm for flat cards, shadow-md for elevated cards, and shadow-lg for featured or floating cards.
          </p>
          {/* gap-6 = 24px (lyra-spacing-6), p-8 = 32px (lyra-spacing-8) */}
          <div className="flex items-stretch gap-lyra-6 p-lyra-8 bg-lyra-bg-surface-shell rounded-lyra-lg">
            <div className="flex-1 p-lyra-6 bg-lyra-bg-surface-base rounded-lyra-md" style={{ boxShadow: shadows.sm }}>
              <div className="lyra-body-sm-emphasis text-lyra-fg-disabled mb-2">shadow-sm</div>
              <div className="lyra-heading-sm text-lyra-fg-default mb-1">Flat Card</div>
              <div className="lyra-body-md text-lyra-fg-secondary">Used for standard content cards and list items.</div>
            </div>
            <div className="flex-1 p-lyra-6 bg-lyra-bg-surface-base rounded-lyra-md" style={{ boxShadow: shadows.md }}>
              <div className="lyra-body-sm-emphasis text-lyra-fg-disabled mb-2">shadow-md</div>
              <div className="lyra-heading-sm text-lyra-fg-default mb-1">Elevated Card</div>
              <div className="lyra-body-md text-lyra-fg-secondary">Used for cards that need more visual prominence.</div>
            </div>
            <div className="flex-1 p-lyra-6 bg-lyra-bg-surface-base rounded-lyra-md" style={{ boxShadow: shadows.lg }}>
              <div className="lyra-body-sm-emphasis text-lyra-fg-disabled mb-2">shadow-lg</div>
              <div className="lyra-heading-sm text-lyra-fg-default mb-1">Featured Card</div>
              <div className="lyra-body-md text-lyra-fg-secondary">Used for floating or featured content.</div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div>
          <h3 className="lyra-heading-md text-lyra-fg-default mb-1">Buttons</h3>
          <p className="lyra-body-md text-lyra-fg-secondary mb-4">
            Use shadow-xs for subtle button depth and shadow-sm for raised buttons. Avoid heavy shadows on buttons.
          </p>
          {/* gap-4 = 16px (lyra-spacing-4), p-8 = 32px (lyra-spacing-8) */}
          <div className="flex items-center gap-lyra-4 p-lyra-8 bg-lyra-bg-surface-shell rounded-lyra-lg">
            <div className="inline-flex items-center justify-center h-9 px-4 bg-lyra-bg-primary text-lyra-fg-on-primary rounded-lyra-sm lyra-label">
              No Shadow
            </div>
            <div className="inline-flex items-center justify-center h-9 px-4 bg-lyra-bg-primary text-lyra-fg-on-primary rounded-lyra-sm lyra-label" style={{ boxShadow: shadows.xs }}>
              shadow-xs
            </div>
            <div className="inline-flex items-center justify-center h-9 px-4 bg-lyra-bg-primary text-lyra-fg-on-primary rounded-lyra-sm lyra-label" style={{ boxShadow: shadows.sm }}>
              shadow-sm
            </div>
            <div className="inline-flex items-center justify-center h-9 px-4 bg-lyra-bg-control text-lyra-fg-default border border-lyra-border-default rounded-lyra-sm lyra-label" style={{ boxShadow: shadows.xs }}>
              Outline + shadow-xs
            </div>
          </div>
        </div>

        {/* Modals & Overlays */}
        <div>
          <h3 className="lyra-heading-md text-lyra-fg-default mb-1">Modals & Overlays</h3>
          <p className="lyra-body-md text-lyra-fg-secondary mb-4">
            Use shadow-xl or shadow-2xl for modals, dialogs, and popovers to create clear separation from the page.
          </p>
          <div className="relative flex items-center justify-center p-lyra-8 bg-lyra-bg-surface-shell rounded-lyra-lg" style={{ height: 360 }}>
            {/* Fake page content behind */}
            <div className="absolute inset-8 bg-lyra-bg-surface-base rounded-lyra-md opacity-60">
              <div className="p-6">
                <div className="rounded-lyra-xs bg-lyra-bg-disabled mb-3" style={{ width: 200, height: 12 }} />
                <div className="rounded-lyra-xs bg-lyra-bg-disabled mb-2" style={{ width: 300, height: 8, opacity: 0.5 }} />
                <div className="rounded-lyra-xs bg-lyra-bg-disabled mb-2" style={{ width: 260, height: 8, opacity: 0.5 }} />
                <div className="rounded-lyra-xs bg-lyra-bg-disabled" style={{ width: 280, height: 8, opacity: 0.5 }} />
              </div>
            </div>
            {/* Modal — p-8 = 32px (lyra-spacing-8) */}
            <div className="relative z-10 p-lyra-8 bg-lyra-bg-surface-base rounded-lyra-lg text-center" style={{ boxShadow: shadows["2xl"], width: 400 }}>
              <div className="lyra-body-sm-emphasis text-lyra-fg-disabled mb-3">shadow-2xl</div>
              <div className="lyra-heading-md text-lyra-fg-default mb-2">Delete Item?</div>
              <div className="lyra-body-md text-lyra-fg-secondary mb-6">This action cannot be undone. Are you sure you want to continue?</div>
              {/* gap-3 = 12px (lyra-spacing-3) */}
              <div className="flex gap-3 justify-center">
                <div className="inline-flex items-center justify-center h-9 px-4 bg-lyra-bg-control text-lyra-fg-default border border-lyra-border-default rounded-lyra-sm lyra-label">
                  Cancel
                </div>
                <div className="inline-flex items-center justify-center h-9 px-4 bg-lyra-bg-destructive text-lyra-fg-on-primary rounded-lyra-sm lyra-label">
                  Delete
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hover Transitions */}
        <div>
          <h3 className="lyra-heading-md text-lyra-fg-default mb-1">Hover Transitions</h3>
          <p className="lyra-body-md text-lyra-fg-secondary mb-4">
            Use CSS transitions to animate between shadow levels on hover. This creates a lifting effect that signals interactivity.
          </p>
          {/* gap-6 = 24px (lyra-spacing-6), p-8 = 32px (lyra-spacing-8) */}
          <div className="flex items-stretch gap-lyra-6 p-lyra-8 bg-lyra-bg-surface-shell rounded-lyra-lg">
            <style>{`
              .shadow-hover-demo-1 { box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1); transition: box-shadow 0.2s ease; }
              .shadow-hover-demo-1:hover { box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1); }
              .shadow-hover-demo-2 { box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1); transition: box-shadow 0.2s ease; }
              .shadow-hover-demo-2:hover { box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1); }
              .shadow-hover-demo-3 { box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05); transition: box-shadow 0.2s ease, transform 0.2s ease; }
              .shadow-hover-demo-3:hover { box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1); transform: translateY(-2px); }
            `}</style>
            {/* p-6 = 24px (lyra-spacing-6) */}
            <div className="shadow-hover-demo-1 flex-1 p-lyra-6 bg-lyra-bg-surface-base rounded-lyra-md cursor-pointer">
              <div className="lyra-body-sm-emphasis text-lyra-fg-disabled mb-2">sm → md</div>
              <div className="lyra-heading-sm text-lyra-fg-default mb-1">Subtle Lift</div>
              <div className="lyra-body-md text-lyra-fg-secondary">Hover me to see a gentle shadow increase.</div>
            </div>
            <div className="shadow-hover-demo-2 flex-1 p-lyra-6 bg-lyra-bg-surface-base rounded-lyra-md cursor-pointer">
              <div className="lyra-body-sm-emphasis text-lyra-fg-disabled mb-2">md → lg</div>
              <div className="lyra-heading-sm text-lyra-fg-default mb-1">Medium Lift</div>
              <div className="lyra-body-md text-lyra-fg-secondary">Hover me for a more pronounced elevation change.</div>
            </div>
            <div className="shadow-hover-demo-3 flex-1 p-lyra-6 bg-lyra-bg-surface-base rounded-lyra-md cursor-pointer">
              <div className="lyra-body-sm-emphasis text-lyra-fg-disabled mb-2">xs → xl + lift</div>
              <div className="lyra-heading-sm text-lyra-fg-default mb-1">Dramatic Lift</div>
              <div className="lyra-body-md text-lyra-fg-secondary">Hover me for a full lift effect with translate.</div>
            </div>
          </div>
        </div>
      </div>
    );
  },
};
