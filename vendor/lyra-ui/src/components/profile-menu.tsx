import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, LogOut, Sun, Moon } from "lucide-react";
import { cn } from "../lib/utils";
import { Tooltip } from "./tooltip";
import { Menu } from "./menu";
import type { MenuEntry } from "./menu";

/* ── Types ── */

export interface ProfileMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

export interface ProfileMenuGroup {
  items: ProfileMenuItem[];
}

interface ProfileMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  initials: string;
  avatarColor?: string;
  groups: ProfileMenuGroup[];
  showThemeToggle?: boolean;
}

/* ── ProfileMenu ── */

const ProfileMenu = React.forwardRef<HTMLDivElement, ProfileMenuProps>(
  ({ className, initials, avatarColor = "#5d6a79", groups, showThemeToggle = false, ...props }, ref) => {
    const [open, setOpen] = useState(false);
    const [isDark, setIsDark] = useState(() =>
      typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark"
    );

    const menuRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    const close = () => setOpen(false);

    const toggleTheme = () => {
      const next = !isDark;
      setIsDark(next);
      document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    };

    /* Close on outside click */
    useEffect(() => {
      if (!open) return;
      const handler = (e: MouseEvent) => {
        if (
          menuRef.current && !menuRef.current.contains(e.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(e.target as Node)
        ) close();
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    /* Close on Escape */
    useEffect(() => {
      if (!open) return;
      const handler = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
      document.addEventListener("keydown", handler);
      return () => document.removeEventListener("keydown", handler);
    }, [open]);

    /* Build MenuEntry[] from groups + optional theme toggle */
    const entries: MenuEntry[] = [];
    groups.forEach((group, gi) => {
      if (gi > 0) entries.push("separator");
      group.items.forEach((item, ii) => {
        entries.push({
          id: `g${gi}-i${ii}`,
          label: item.label,
          icon: item.icon,
          onClick: () => { item.onClick?.(); close(); },
        });
      });
    });
    if (showThemeToggle) {
      entries.push("separator");
      entries.push({
        id: "theme-toggle",
        label: isDark ? "Light Mode" : "Dark Mode",
        icon: isDark
          ? <Sun className="h-4 w-4" strokeWidth={1.5} />
          : <Moon className="h-4 w-4" strokeWidth={1.5} />,
        onClick: toggleTheme,
      });
    }

    return (
      <div ref={ref} className={cn("relative", className)} {...props}>
        <Tooltip content="Profile" placement="bottom" delayMs={open ? 999999 : 200}>
          <button
            ref={triggerRef}
            onClick={() => setOpen((v) => !v)}
            aria-label="User menu"
            aria-haspopup="true"
            aria-expanded={open}
            className={cn(
              "inline-flex h-11 items-center gap-2 rounded-lyra-sm pl-2 pr-1.5 transition-colors",
              "hover:bg-lyra-state-hover active:bg-lyra-state-pressed",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2"
            )}
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full lyra-body-md-emphasis text-white"
              style={{ backgroundColor: avatarColor }}
              aria-hidden="true"
            >
              {initials}
            </div>
            <ChevronDown
              className="h-3.5 w-3.5 text-lyra-fg-secondary"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </button>
        </Tooltip>

        {open && (
          <div
            ref={menuRef}
            className="absolute right-0 top-full z-50 mt-1"
          >
            <Menu
              items={entries}
              aria-label="User menu"
              className="min-w-[220px]"
            />
          </div>
        )}
      </div>
    );
  }
);
ProfileMenu.displayName = "ProfileMenu";

/* ── Default menu groups ── */

const defaultProfileMenuGroups: ProfileMenuGroup[] = [
  {
    items: [{ label: "My Profile" }],
  },
  {
    items: [
      { label: "Support & Downloads" },
      { label: "Contact Us" },
    ],
  },
  {
    items: [
      {
        label: "Sign Out",
        icon: <LogOut className="h-4 w-4" strokeWidth={1.5} />,
      },
    ],
  },
];

export { ProfileMenu, defaultProfileMenuGroups };
export type { ProfileMenuProps };
