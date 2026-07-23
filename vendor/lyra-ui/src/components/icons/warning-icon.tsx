import * as React from "react";
import { cn } from "../../lib/utils";

interface WarningIconProps extends React.SVGAttributes<SVGSVGElement> {}

const WarningIcon = React.forwardRef<SVGSVGElement, WarningIconProps>(
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
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.62572 2.00001C7.23631 0.814808 8.76277 0.814808 9.37336 2.00001L15.7852 13.3328C16.3957 14.518 15.6321 16 14.4109 16H1.58834C0.367362 15.9997 -0.395627 14.5179 0.214906 13.3328L6.62572 2.00001ZM8.00003 11.8015C7.33729 11.8015 6.80004 12.3388 6.80004 13.0015C6.80028 13.6641 7.33744 14.2015 8.00003 14.2015C8.66235 14.2012 9.19979 13.6639 9.20003 13.0015C9.20003 12.339 8.6625 11.8018 8.00003 11.8015ZM8.00003 4.99988C7.44775 4.99988 7.00004 5.4476 7.00004 5.99989V8.99993C7.00013 9.55214 7.44781 9.99994 8.00003 9.99994C8.55206 9.9997 8.99993 9.55199 9.00003 8.99993V5.99989C9.00003 5.44775 8.55211 5.00012 8.00003 4.99988Z"
        fill="#8E6800"
      />
    </svg>
  )
);
WarningIcon.displayName = "WarningIcon";

export { WarningIcon };
