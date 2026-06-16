import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type CommonProps = {
  variant?: "primary" | "ghost";
  size?: "md" | "lg";
  /** Renders a trailing arrow inside its own circular wrapper. */
  withArrow?: boolean;
  className?: string;
  children: React.ReactNode;
};

type AsLink = CommonProps & {
  href: string;
  external?: boolean;
  onClick?: never;
  type?: never;
  disabled?: never;
};

type AsButton = CommonProps & {
  href?: never;
  external?: never;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: "button" | "submit";
  disabled?: boolean;
};

export type ButtonProps = AsLink | AsButton;

const baseClasses =
  "group relative inline-flex items-center justify-center gap-2 rounded-full font-semibold " +
  "transition-[color,background-color,border-color] duration-200 ease-out select-none " +
  "focus-pill focus-visible:outline-none " +
  "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

const variantClasses = {
  /* Controlled-neon glow: a pre-rendered blurred accent layer behind the pill,
     animated by opacity + scale only (compositor-friendly, never a box-shadow
     tween). isolate keeps the -z-10 layer contained to the button. */
  primary:
    "bg-accent-solid text-white isolate hover:brightness-110 " +
    "before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:rounded-full " +
    "before:bg-accent before:opacity-40 before:blur-lg before:transition before:duration-300 before:ease-out " +
    "hover:before:opacity-90 hover:before:scale-110 " +
    "focus-visible:before:opacity-90 focus-visible:before:scale-110 motion-reduce:before:transition-none",
  /* Fill-wipe: scaleX from origin-left, transform-only (never a color fade). */
  ghost:
    "border border-line text-ink overflow-hidden isolate " +
    "before:absolute before:inset-0 before:-z-10 before:origin-left before:scale-x-0 " +
    "before:bg-elevated before:transition-transform before:duration-300 before:ease-out " +
    "hover:before:scale-x-100 hover:border-accent/40",
} as const;

const sizeClasses = {
  md: "h-11 text-sm",
  lg: "h-12 text-base",
} as const;

/* Pill CTA (button-in-button, spec §4.4): label gets pl-6, arrow lives in its
   own circle flush right with pr-1.5. Buttons without an arrow get symmetric
   padding instead. */
const paddingClasses = {
  withArrow: { md: "pl-6 pr-1.5", lg: "pl-7 pr-1.5" },
  plain: { md: "px-6", lg: "px-7" },
} as const;

const arrowCircleClasses = {
  md: "size-8",
  lg: "size-9",
} as const;

export function Button(props: ButtonProps) {
  const { variant = "primary", size = "md", withArrow = false, className, children } = props;

  const classes = cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    withArrow ? paddingClasses.withArrow[size] : paddingClasses.plain[size],
    className,
  );

  const content = (
    <>
      <span className="relative z-10">{children}</span>
      {withArrow && (
        <span
          aria-hidden
          className={cn(
            "relative z-10 ml-1 inline-flex items-center justify-center overflow-hidden rounded-full",
            variant === "primary" ? "bg-white/15" : "bg-accent/15",
            arrowCircleClasses[size],
          )}
        >
          {/* Diagonal dual-swap: current arrow exits up-right, next enters from down-left. */}
          <ArrowRight className="absolute size-4 transition-transform duration-300 ease-out group-hover:translate-x-4 group-hover:-translate-y-4" />
          <ArrowUpRight className="absolute size-4 -translate-x-4 translate-y-4 transition-transform duration-300 ease-out group-hover:translate-x-0 group-hover:translate-y-0" />
        </span>
      )}
    </>
  );

  if (props.href !== undefined) {
    const externalProps = props.external
      ? { target: "_blank", rel: "noopener noreferrer" }
      : {};
    return (
      <Link href={props.href} className={classes} {...externalProps}>
        {content}
      </Link>
    );
  }

  return (
    <button type={props.type ?? "button"} onClick={props.onClick} disabled={props.disabled} className={classes}>
      {content}
    </button>
  );
}
