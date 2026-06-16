import { cn } from "@/lib/utils";

/**
 * Text-slide hover (new_plan 6.2). Two stacked copies of the label inside an
 * overflow-clip box: on hover of an ancestor `.group`, the visible copy slides
 * up and out while an identical copy rises into its place — the classic premium
 * nav-link "refresh". Transform-only (compositor-cheap). Reduced motion shows a
 * single static copy with no movement (the duplicate is hidden). Single-line
 * labels only; the enclosing element must carry the `group` class.
 */
export function SlideText({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <span className={cn("relative inline-block overflow-hidden align-bottom", className)}>
      <span className="block transition-transform duration-[450ms] ease-[cubic-bezier(0.76,0,0.24,1)] motion-safe:group-hover:-translate-y-full">
        {children}
      </span>
      <span
        aria-hidden
        className="absolute inset-0 block translate-y-full transition-transform duration-[450ms] ease-[cubic-bezier(0.76,0,0.24,1)] motion-reduce:hidden motion-safe:group-hover:translate-y-0"
      >
        {children}
      </span>
    </span>
  );
}
