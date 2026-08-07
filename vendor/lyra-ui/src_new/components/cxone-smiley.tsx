import * as React from "react";
import { cn } from "../lib/utils";

interface CXoneSmileyProps extends React.SVGAttributes<SVGSVGElement> {
  /**
   * Whether the smiley is blinking.
   * - `true`  → always blinks
   * - `"on-hover"` → blinks when the nearest Tailwind `group` ancestor is hovered
   * - `false` / omitted → static
   */
  blinking?: boolean | "on-hover";
  /**
   * Render the eyes and smile in a single color instead of the default
   * multicolor (blue/green/orange/magenta) scheme — e.g. for a small
   * single-tone welcome-modal mark. Pass `true` for the brand blue
   * (`#2196F3`, matching the left eye/first smile segment), or any CSS
   * color string.
   */
  monochrome?: boolean | string;
}

/**
 * CXone smiley icon — a colorful face with dots for eyes and a
 * multicolored curved smile (blue → green → orange → magenta).
 *
 * When `blinking="on-hover"`, the eyes blink while the nearest
 * Tailwind `.group` ancestor is hovered (e.g. the AppName button).
 */
const CXoneSmiley = React.forwardRef<SVGSVGElement, CXoneSmileyProps>(
  ({ className, blinking, monochrome, ...props }, ref) => {
    const eyeClass =
      blinking === true
        ? "smiley-eye-blink"
        : blinking === "on-hover"
          ? "smiley-eye-hover-blink"
          : undefined;

    const soloColor = monochrome ? (monochrome === true ? "#2196F3" : monochrome) : undefined;

    return (
      <svg
        ref={ref}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("h-6 w-6", className)}
        {...props}
      >
        <style>{`
          @keyframes smiley-blink {
            0%, 90%, 100% { transform: scaleY(1); }
            95% { transform: scaleY(0.1); }
          }
          .smiley-eye-blink {
            animation: smiley-blink 3s ease-in-out infinite;
            transform-origin: center;
          }
          .group:hover .smiley-eye-hover-blink {
            animation: smiley-blink 3s ease-in-out infinite;
            transform-origin: center;
          }
        `}</style>
        {/* Left eye — blue (or solo color when monochrome) */}
        <circle
          cx="11"
          cy="11"
          r="2.5"
          fill={soloColor ?? "#2196F3"}
          className={eyeClass}
        />
        {/* Right eye — green (or solo color when monochrome) */}
        <circle
          cx="21"
          cy="11"
          r="2.5"
          fill={soloColor ?? "#4CAF50"}
          className={eyeClass}
          style={blinking ? { animationDelay: "0.1s" } : undefined}
        />
        {/* Smile arc — multicolored segments (or solo color when monochrome) */}
        {/* Blue segment (left) */}
        <path
          d="M8 19c0.8 2.4 2.4 4 4.5 5"
          stroke={soloColor ?? "#2196F3"}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Green segment */}
        <path
          d="M12.5 24c1.2 0.5 2.3 0.7 3.5 0.7"
          stroke={soloColor ?? "#4CAF50"}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Orange segment */}
        <path
          d="M16 24.7c1.2 0 2.3-0.2 3.5-0.7"
          stroke={soloColor ?? "#FF9800"}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Magenta segment (right) */}
        <path
          d="M19.5 24c2.1-1 3.7-2.6 4.5-5"
          stroke={soloColor ?? "#E91E63"}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    );
  }
);
CXoneSmiley.displayName = "CXoneSmiley";

export { CXoneSmiley };
export type { CXoneSmileyProps };
