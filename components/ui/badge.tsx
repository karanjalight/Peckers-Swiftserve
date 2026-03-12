import * as React from "react";

import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "destructive";

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default:
    "bg-slate-900 text-slate-50 dark:bg-slate-100 dark:text-slate-900",
  secondary:
    "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100",
  outline:
    "border border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-200",
  destructive:
    "bg-red-600 text-red-50 dark:bg-red-500 dark:text-red-50",
};

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="badge"
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
          variantClasses[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";

export { Badge };

