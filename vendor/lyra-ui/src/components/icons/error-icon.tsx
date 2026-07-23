import * as React from "react";
import { cn } from "../../lib/utils";

interface ErrorIconProps extends React.SVGAttributes<SVGSVGElement> {}

const ErrorIcon = React.forwardRef<SVGSVGElement, ErrorIconProps>(
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
      <circle cx="8" cy="8" r="8" fill="#B42318" />
      <path
        d="M8 4.5V9"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="8" cy="11.25" r="0.75" fill="white" />
    </svg>
  )
);
ErrorIcon.displayName = "ErrorIcon";

export { ErrorIcon };
