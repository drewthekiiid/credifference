import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors",
  {
    variants: {
      variant: {
        default: "border-[color:var(--border-strong)] bg-[color:var(--accent-muted)] text-[color:var(--text)]",
        secondary: "border-[color:var(--border)] bg-[color:var(--panel-strong)] text-[color:var(--text)]",
        destructive: "border-[color:var(--danger)] bg-transparent text-[color:var(--danger)]",
        outline: "border-[color:var(--border-strong)] bg-transparent text-[color:var(--text)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
