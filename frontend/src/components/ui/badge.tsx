import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "success" | "outline" | "danger";
}

function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const variants = {
    default: "bg-coffee-100 text-coffee-800 border-coffee-200",
    secondary: "bg-cream-200 text-coffee-900 border-cream-300",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    outline: "text-coffee-700 border-coffee-300",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
