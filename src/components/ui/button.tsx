import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] disabled:pointer-events-none disabled:opacity-50 shadow-sm hover:shadow-md",
  {
    variants: {
      variant: {
        default:
          "text-white bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] hover:from-[var(--primary)]/90 hover:to-[var(--primary-dark)]/90",
        destructive:
          "text-white bg-gradient-to-br from-[var(--error)] to-[var(--error)]/90 hover:from-[var(--error)]/80 hover:to-[var(--error)]/70",
        outline:
          "border border-[var(--neutral-200)] bg-[var(--foreground)] hover:bg-[var(--neutral-100)] hover:text-[var(--text-primary)]",
        secondary:
          "bg-[var(--neutral-100)] text-[var(--text-primary)] hover:bg-[var(--neutral-200)]",
        ghost:
          "text-[var(--text-secondary)] hover:bg-[var(--neutral-100)] hover:text-[var(--text-primary)] shadow-none hover:shadow-none",
        link: "text-[var(--primary)] underline-offset-4 hover:underline shadow-none hover:shadow-none",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-md px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
