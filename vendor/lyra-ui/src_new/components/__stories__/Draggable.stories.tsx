import type { Meta, StoryObj } from "@storybook/react";
import React, { useState, useRef, useEffect } from "react";
import { Draggable, type DraggableVariant } from "../draggable";
import { ContainerHeader } from "../container-header";
import { PageHeader } from "../page-header";
import { Button } from "../button";

const meta: Meta<typeof Draggable> = {
  title: "Atoms/Draggable",
  component: Draggable,
  tags: ["autodocs"],
  parameters: { layout: "padded", backgrounds: { default: "lyra-shell" } },
};
export default meta;
type Story = StoryObj<typeof Draggable>;

export const Float: Story = {
  name: "Float (default)",
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="relative w-full h-screen">
    <div className="absolute top-4 left-4">
    <Draggable
      defaultWidth={300}
      defaultHeight={200}
      className="rounded-lyra-lg border border-lyra-border-subtle bg-lyra-bg-surface-overlay shadow-lg"
    >
      <ContainerHeader title="Drag me by the header" bordered={false} />
      <div className="flex-1 flex items-center justify-center">
        <p className="lyra-body-sm text-lyra-fg-secondary">Resize from the bottom-right corner</p>
      </div>
    </Draggable>
    </div>
    </div>
  ),
};

export const Docked: Story = {
  name: "Docked (right side)",
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="flex h-screen overflow-hidden bg-lyra-bg-surface-shell">
      <div className="flex-1 flex items-center justify-center">
        <p className="lyra-body-md text-lyra-fg-secondary">Main content — drag the left edge of the panel to resize</p>
      </div>
      <div className="h-full pr-3 pb-3">
        <Draggable
          variant="docked"
          defaultWidth={320}
          minWidth={280}
          lockVariant
          className="rounded-lyra-lg border border-lyra-border-subtle bg-lyra-bg-surface-overlay"
        >
          <ContainerHeader title="Docked Panel" bordered={false} />
          <div className="flex-1 flex items-center justify-center">
            <p className="lyra-body-sm text-lyra-fg-secondary">Drag left edge to resize</p>
          </div>
        </Draggable>
      </div>
    </div>
  ),
};

export const WithMainContainer: Story = {
  name: "With main container",
  parameters: { layout: "fullscreen" },
  render: () => {
    type PanelState = "closed" | "open" | "closing";

    const [panelOpen,  setPanelOpen]  = useState(true);
    const [mounted,    setMounted]    = useState(true);
    const [panelState, setPanelState] = useState<PanelState>("open");
    const [variant,    setVariant]    = useState<DraggableVariant>("docked");
    const [width,      setWidth]      = useState(320);
    const [isResizing, setIsResizing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const floatLeft    = useRef<number | null>(null);
    const animTimer    = useRef<ReturnType<typeof setTimeout>>();

    // Open/close state machine (matches AgentNextGen pattern)
    useEffect(() => {
      clearTimeout(animTimer.current);
      if (panelOpen) {
        if (containerRef.current && floatLeft.current === null) {
          const r = containerRef.current.getBoundingClientRect();
          floatLeft.current = r.left + containerRef.current.offsetWidth - width - 16;
        }
        setMounted(true);
        setPanelState("open");
      } else {
        setPanelState("closing");
        animTimer.current = setTimeout(() => setPanelState("closed"), 150);
      }
      return () => clearTimeout(animTimer.current);
    }, [panelOpen]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleVariantChange = (v: DraggableVariant) => {
      if (v === "float" && containerRef.current) {
        const r = containerRef.current.getBoundingClientRect();
        floatLeft.current = r.left + containerRef.current.offsetWidth - width - 16;
      } else {
        floatLeft.current = null;
      }
      setVariant(v);
    };

    // Float position — absolute viewport coordinates so panel doesn't shift when layout changes
    const getFloatStyle = (): React.CSSProperties => {
      const rect = containerRef.current?.getBoundingClientRect();
      const left = floatLeft.current !== null
        ? floatLeft.current
        : containerRef.current
          ? (rect?.left ?? 0) + containerRef.current.offsetWidth - width - 16
          : 0;
      return { position: "fixed", top: rect?.top ?? 0, left, zIndex: 40 };
    };

    const panel = mounted ? (
      <Draggable
        variant={variant}
        defaultWidth={width}
        defaultHeight={500}
        minWidth={280}
        minHeight={200}
        onVariantChange={handleVariantChange}
        onWidthChange={setWidth}
        onResizeStateChange={setIsResizing}
        className={[
          "rounded-lyra-lg border border-lyra-border-subtle bg-lyra-bg-surface-overlay",
          variant === "float" ? "shadow-lg" : "h-full",
        ].join(" ")}
      >
        <ContainerHeader title="Panel" bordered={false} />
        <div className="flex-1" />
      </Draggable>
    ) : null;

    return (
      <div className="flex h-screen overflow-hidden bg-lyra-bg-surface-shell p-4">

        {/* Content area — ref used to position float panel */}
        <div ref={containerRef} className="relative flex flex-1 min-w-0 overflow-hidden">
          <div className="flex flex-col flex-1 rounded-lyra-lg border border-lyra-border-subtle bg-lyra-bg-surface-base overflow-hidden">
            <PageHeader
              title="Page Title"
              actions={
                <Button variant="outline" onClick={() => setPanelOpen((v) => !v)}>
                  Toggle right panel
                </Button>
              }
            />
          </div>

          {/* Float: position:fixed viewport coords, visibility+opacity transition */}
          {variant === "float" && mounted && (
            <div style={{
              ...getFloatStyle(),
              pointerEvents: panelState === "closed" ? "none" : "auto",
              visibility: panelState === "closed" ? "hidden" : "visible",
              opacity: panelState === "open" ? 1 : 0,
              transform: panelState === "open" ? "translateY(0)" : "translateY(-8px)",
              transition: panelState === "open"
                ? "opacity 150ms ease, transform 150ms ease"
                : "opacity 100ms ease, transform 100ms ease",
            }}>
              {panel}
            </div>
          )}
        </div>

        {/* Docked: sibling of containerRef — gap (pl-4) is baked into the animating width
             so it collapses to zero with the panel. No extra padding on the content area. */}
        {variant === "docked" && (
          <div style={{
            width: panelState === "open" ? width + 16 : 0,
            overflow: "hidden",
            flexShrink: 0,
            transition: isResizing ? "none" : "width 250ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}>
            <div
              className="h-full pl-4"
              style={{ width: width + 16, display: panelState === "open" ? "block" : "none" }}
            >
              {panel}
            </div>
          </div>
        )}

      </div>
    );
  },
};

export const Interactive: Story = {
  name: "Interactive (toggle float ↔ docked)",
  parameters: { layout: "fullscreen" },
  render: () => {
    const [variant, setVariant] = useState<DraggableVariant>("float");

    const panel = (
      <Draggable
        variant={variant}
        defaultWidth={320}
        defaultHeight={420}
        minWidth={280}
        minHeight={200}
        onVariantChange={setVariant}
        className={[
          "rounded-lyra-lg border border-lyra-border-subtle bg-lyra-bg-surface-overlay",
          variant === "float" ? "shadow-lg" : "",
        ].join(" ")}
      >
        <ContainerHeader title="Panel" bordered={false} />
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="lyra-body-sm text-lyra-fg-secondary text-center">
            Currently <strong>{variant}</strong>.<br />
            Use the icon in the top-right to toggle.
          </p>
        </div>
      </Draggable>
    );

    return (
      <div className="flex h-screen overflow-hidden bg-lyra-bg-surface-shell">
        <div className="flex-1 flex items-center justify-center">
          <p className="lyra-body-md text-lyra-fg-secondary">Main content area</p>
        </div>
        {variant === "docked" ? (
          <div className="h-full pr-3 pb-3">{panel}</div>
        ) : (
          <div className="absolute top-16 left-16">{panel}</div>
        )}
      </div>
    );
  },
};
