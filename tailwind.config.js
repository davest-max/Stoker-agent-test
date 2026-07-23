/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
    // Dev scans the live sibling checkout; build scans the vendored
    // snapshot instead (see vite.config.ts's own comment on the same
    // split — vendor/lyra-ui doesn't exist until a build has run, and
    // ../lyra-ui doesn't exist in a hosted build's checkout, but an
    // unmatched glob here is harmless either way).
    "../lyra-ui/src/**/*.{ts,tsx}",
    "./vendor/lyra-ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* ── Background ── */
        "lyra-bg-surface-base":             "var(--lyra-color-bg-surface-base)",
        "lyra-bg-surface-canvas":           "var(--lyra-color-bg-surface-canvas)",
        "lyra-bg-surface-container":        "var(--lyra-color-bg-surface-container)",
        "lyra-bg-surface-container-subtle": "var(--lyra-color-bg-surface-container-subtle)",
        "lyra-bg-surface-shell":            "var(--lyra-color-bg-surface-shell)",
        "lyra-bg-surface-backdrop":         "var(--lyra-color-bg-surface-backdrop)",
        "lyra-bg-surface-overlay":          "var(--lyra-color-bg-surface-overlay)",
        "lyra-bg-surface-inverse":          "var(--lyra-color-bg-surface-inverse)",
        "lyra-bg-primary":                  "var(--lyra-color-bg-primary)",
        "lyra-bg-secondary":                "var(--lyra-color-bg-secondary)",
        "lyra-bg-destructive":              "var(--lyra-color-bg-destructive)",
        "lyra-bg-control":                  "var(--lyra-color-bg-control)",
        "lyra-bg-control-subtle":           "var(--lyra-color-bg-control-subtle)",
        "lyra-bg-field":                    "var(--lyra-color-bg-field)",
        "lyra-bg-disabled":                 "var(--lyra-color-bg-disabled)",
        "lyra-bg-active-strong":            "var(--lyra-color-bg-active-strong)",
        "lyra-bg-active-moderate":          "var(--lyra-color-bg-active-moderate)",
        "lyra-bg-active-subtle":            "var(--lyra-color-bg-active-subtle)",

        /* ── Foreground / Text ── */
        "lyra-fg-default":       "var(--lyra-color-fg-default)",
        "lyra-fg-secondary":     "var(--lyra-color-fg-secondary)",
        "lyra-fg-action":        "var(--lyra-color-fg-action)",
        "lyra-fg-disabled":      "var(--lyra-color-fg-disabled)",
        "lyra-fg-link":          "var(--lyra-color-fg-link)",
        "lyra-fg-inverse":       "var(--lyra-color-fg-inverse)",
        "lyra-fg-on-primary":    "var(--lyra-color-fg-on-primary)",
        "lyra-fg-active-subtle": "var(--lyra-color-fg-active-subtle)",
        "lyra-fg-active-strong": "var(--lyra-color-fg-active-strong)",

        /* ── Border ── */
        "lyra-border-subtle":   "var(--lyra-color-border-subtle)",
        "lyra-border-default":  "var(--lyra-color-border-default)",
        "lyra-border-medium":   "var(--lyra-color-border-medium)",
        "lyra-border-strong":   "var(--lyra-color-border-strong)",
        "lyra-border-disabled": "var(--lyra-color-border-disabled)",
        "lyra-border-active":   "var(--lyra-color-border-active)",
        "lyra-border-inverse":  "var(--lyra-color-border-inverse)",
        "lyra-border-focus":    "var(--lyra-color-border-focus-default)",

        /* ── Status ── */
        "lyra-status-success-strong":   "var(--lyra-color-status-success-strong)",
        "lyra-status-success-medium":   "var(--lyra-color-status-success-medium)",
        "lyra-status-success-subtle":   "var(--lyra-color-status-success-subtle)",
        "lyra-status-info-strong":      "var(--lyra-color-status-info-strong)",
        "lyra-status-info-medium":      "var(--lyra-color-status-info-medium)",
        "lyra-status-info-subtle":      "var(--lyra-color-status-info-subtle)",
        "lyra-status-critical-strong":  "var(--lyra-color-status-critical-strong)",
        "lyra-status-critical-medium":  "var(--lyra-color-status-critical-medium)",
        "lyra-status-critical-subtle":  "var(--lyra-color-status-critical-subtle)",
        "lyra-status-warning-strong":   "var(--lyra-color-status-warning-strong)",
        "lyra-status-warning-subtle":   "var(--lyra-color-status-warning-subtle)",

        /* ── Accent (channel-type colors) ── */
        "lyra-accent-purple-strong": "var(--lyra-color-accent-purple-strong)",
        "lyra-accent-purple-soft":   "var(--lyra-color-accent-purple-soft)",
        "lyra-accent-pink-strong":   "var(--lyra-color-accent-pink-strong)",
        "lyra-accent-pink-soft":     "var(--lyra-color-accent-pink-soft)",
        "lyra-accent-green-strong":  "var(--lyra-color-accent-green-strong)",
        "lyra-accent-green-soft":    "var(--lyra-color-accent-green-soft)",
        "lyra-accent-lime-strong":   "var(--lyra-color-accent-lime-strong)",
        "lyra-accent-lime-soft":     "var(--lyra-color-accent-lime-soft)",
        "lyra-accent-teal-strong":   "var(--lyra-color-accent-teal-strong)",
        "lyra-accent-teal-soft":     "var(--lyra-color-accent-teal-soft)",

        /* ── State border ── */
        "lyra-state-border-hover-neutral": "var(--lyra-color-state-border-hover-neutral)",

        /* ── State ── */
        "lyra-state-hover":                     "var(--lyra-color-state-bg-hover-opacity)",
        "lyra-state-pressed":                   "var(--lyra-color-state-bg-pressed-opacity)",
        "lyra-state-hover-primary":             "var(--lyra-color-state-bg-hover-primary)",
        "lyra-state-pressed-primary":           "var(--lyra-color-state-bg-pressed-primary)",
        "lyra-state-hover-active-subtle":       "var(--lyra-color-state-bg-hover-active-subtle)",
        "lyra-state-pressed-active-subtle":     "var(--lyra-color-state-bg-pressed-active-subtle)",
        "lyra-state-hover-critical-subtle":     "var(--lyra-color-state-bg-hover-critical-subtle)",
        "lyra-state-pressed-critical-subtle":   "var(--lyra-color-state-bg-pressed-critical-subtle)",
        "lyra-state-hover-destructive":         "var(--lyra-color-state-bg-hover-destructive)",
        "lyra-state-pressed-destructive":       "var(--lyra-color-state-bg-pressed-destructive)",

        /* ── Lyra Avatar ── */
        "lyra-avatar-default-bg": "var(--lyra-color-avatar-default-bg)",

        /* ── Lyra Accent ── */
        "lyra-accent-slate-strong": "var(--lyra-color-accent-slate-strong)",
        "lyra-accent-slate-soft":   "var(--lyra-color-accent-slate-soft)",

        "cxone-navy": "#2a2d32",
      },
      borderRadius: {
        "lyra-none":  "var(--lyra-radius-none)",
        "lyra-xs":    "var(--lyra-radius-xs)",
        "lyra-sm":    "var(--lyra-radius-sm)",
        "lyra-md":    "var(--lyra-radius-md)",
        "lyra-lg":    "var(--lyra-radius-lg)",
        "lyra-xl":    "var(--lyra-radius-xl)",
        "lyra-round": "var(--lyra-radius-round)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
