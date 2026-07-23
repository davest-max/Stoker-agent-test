import * as React from "react";
import { cn } from "../../lib/utils";

interface SuccessIconProps extends React.SVGAttributes<SVGSVGElement> {}

const SuccessIcon = React.forwardRef<SVGSVGElement, SuccessIconProps>(
  ({ className, ...props }, ref) => (
    <svg
      ref={ref}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-5 w-5", className)}
      {...props}
    >
      <circle cx="8" cy="8" r="8" fill="#1B6B2A" />
      <path
        d="M4.5 8.5L6.5 10.5L11.5 5.5"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
);
SuccessIcon.displayName = "SuccessIcon";

export { SuccessIcon };
