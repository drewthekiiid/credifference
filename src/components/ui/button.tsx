"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full text-[13px] font-medium tracking-widest uppercase transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--text)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[color:var(--text)] text-[color:var(--bg)] shadow-[0_8px_20px_rgba(0,0,0,0.12)] hover:opacity-90",
        outline:
          "border border-[color:var(--border-strong)] bg-transparent text-[color:var(--text)] hover:bg-[color:var(--text)] hover:text-[color:var(--bg)]",
        secondary:
          "bg-[color:var(--panel-muted)] text-[color:var(--text)] hover:bg-[color:var(--border-strong)]",
        ghost: "text-[color:var(--text)] hover:bg-[color:var(--accent-muted)]",
        destructive: "bg-[color:var(--danger)] text-white hover:opacity-90",
        link: "text-[color:var(--text)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-6",
        sm: "h-10 px-4 text-[11px]",
        lg: "h-14 px-8 text-[14px]",
        icon: "h-12 w-12",
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
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
