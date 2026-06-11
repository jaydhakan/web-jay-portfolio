import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type CommonProps = {
  variant?: "primary" | "ghost";
  size?: "md" | "lg";
  /** Renders a trailing arrow that nudges right on hover. */
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
  "group inline-flex items-center justify-center gap-2 rounded-full font-semibold " +
  "transition duration-200 ease-out select-none " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-base " +
  "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50";

const variantClasses = {
  primary: "bg-accent-solid text-white hover:shadow-glow hover:brightness-110",
  ghost:
    "border border-token text-primary hover:border-accent-primary/40 hover:bg-elevated/60",
} as const;

const sizeClasses = {
  md: "h-11 px-6 text-sm",
  lg: "h-12 px-7 text-base",
} as const;

export function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    withArrow = false,
    className,
    children,
  } = props;

  const classes = cn(baseClasses, variantClasses[variant], sizeClasses[size], className);

  const content = (
    <>
      {children}
      {withArrow && (
        <ArrowRight
          aria-hidden
          className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
        />
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
