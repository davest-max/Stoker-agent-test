import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";
import { Tooltip } from "./tooltip";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lyra-sm lyra-label transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        default:
          "bg-lyra-bg-primary text-lyra-fg-on-primary hover:bg-lyra-state-hover-primary active:bg-lyra-state-pressed-primary",
        destructive:
          "bg-lyra-bg-destructive text-lyra-fg-on-primary hover:bg-lyra-state-hover-destructive active:bg-lyra-state-pressed-destructive",
        warning:
          "bg-lyra-status-warning-strong text-lyra-fg-on-primary hover:bg-lyra-status-warning-strong/90 active:bg-lyra-status-warning-strong/80",
        success:
          "bg-lyra-status-success-strong text-lyra-fg-on-primary hover:bg-lyra-status-success-strong/90 active:bg-lyra-status-success-strong/80",
        outline:
          "border border-lyra-border-default bg-lyra-bg-control text-lyra-fg-action hover:bg-lyra-state-hover active:bg-lyra-state-pressed",
        ghost:
          "text-lyra-fg-action hover:bg-lyra-state-hover active:bg-lyra-state-pressed",
        icon: "text-lyra-fg-action hover:bg-lyra-state-hover active:bg-lyra-state-pressed hover:text-lyra-fg-default rounded-lyra-sm",
      },
      size: {
        sm: "h-6 px-2.5",
        default: "h-8 px-3",
        md: "h-8 px-3",
        lg: "h-9 px-4",
        xl: "h-10 px-5",
        "icon-sm": "h-6 w-6",
        icon: "h-8 w-8",
        "icon-md": "h-8 w-8",
        "icon-lg": "h-9 w-9",
        "icon-xl": "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "lg",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, title, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const isIconVariant = variant === "icon" || size === "icon" || size === "icon-sm" || size === "icon-md" || size === "icon-lg" || size === "icon-xl";

    const button = (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        title={isIconVariant ? undefined : title}
        aria-label={isIconVariant ? title : undefined}
        {...props}
      />
    );

    if (isIconVariant && title) {
      return (
        <Tooltip content={title} placement="bottom" asLabel>
          {button}
        </Tooltip>
      );
    }

    return button;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
