import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-[2px] px-1.5 py-0.5 text-xs font-semibold whitespace-nowrap", {
  variants: {
    tone: {
      success: "bg-success text-success-foreground",
      failure: "bg-failure text-failure-foreground",
      neutral: "bg-neutral text-secondary",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export function Badge({
  className,
  tone,
  ...props
}: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
