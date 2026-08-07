import type { Meta, StoryObj } from "@storybook/react";

/**
 * DEPRECATED — this file could not actually be deleted (Cowork's mount on
 * this folder doesn't permit file deletion) — please delete
 * `src/components/__stories__/Panel.stories.tsx` by hand next time you're
 * in a normal terminal.
 *
 * The old unified `Panel` component/story (`variant="side" | "interior"`)
 * was split into two separate components, each with its own story file:
 *
 *   - `SidePanel.stories.tsx`     → "Atoms/SidePanel"     ("Side Panel — Left" / "— Right")
 *   - `InteriorPanel.stories.tsx` → "Atoms/InteriorPanel" ("Interior Panel — Left" / "— Right")
 *
 * Storybook's CSF indexer requires every `*.stories.tsx` file to have a
 * default export (a file with none fails the whole build, not just this
 * story), so this can't just be emptied out — it renders a small
 * redirect notice instead of a real component.
 */

function MovedNotice() {
  return (
    <div style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 480 }}>
      <p style={{ fontWeight: 600, marginBottom: 8 }}>
        This story has moved.
      </p>
      <p>
        The old unified <code>Panel</code> was split into <code>SidePanel</code> and{" "}
        <code>InteriorPanel</code> — see <strong>Atoms/SidePanel</strong> and{" "}
        <strong>Atoms/InteriorPanel</strong> in the sidebar.
      </p>
    </div>
  );
}

const meta: Meta<typeof MovedNotice> = {
  title: "Atoms/Panel (Moved)",
  component: MovedNotice,
};

export default meta;
type Story = StoryObj<typeof MovedNotice>;

export const Moved: Story = {
  name: "See SidePanel / InteriorPanel",
};
