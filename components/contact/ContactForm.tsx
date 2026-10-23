"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, CircleAlert, CircleCheck, LoaderCircle } from "lucide-react";
import { contact, siteConfig } from "@/data/content";
import { contactSchema, type ContactInput } from "@/lib/contact-schema";
import { sendContactMessage } from "@/app/actions/contact";
import { cn } from "@/lib/utils";

/* Fields are 16px on touch (anything smaller makes iOS Safari zoom the page on
   focus) and step down to 14px from sm. The invalid state is driven by
   aria-invalid, so the visual and the accessible state can never disagree. */
const fieldClasses =
  "w-full rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink sm:text-sm " +
  "placeholder:text-ink-dim/80 transition-[color,border-color,box-shadow] duration-200 " +
  "hover:border-white/[0.16] focus:border-accent focus:outline-none " +
  "focus:ring-2 focus:ring-accent/50 focus:shadow-glow " +
  "aria-[invalid=true]:border-err/70 aria-[invalid=true]:focus:ring-err/40 aria-[invalid=true]:focus:shadow-none";

const labelClasses = "block text-sm font-medium text-ink";
const hintClasses = "mt-2 text-xs text-ink-dim";

/** /contact?plan=growth pre-selects the matching budget (read client-side so the
    page stays static). */
const planToBudget: Record<string, string> = {
  starter: "$1k-$5k",
  growth: "$5k-$15k",
  custom: "Let's discuss",
};

/** Inline field error: icon + message, linked via aria-describedby. */
function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="anim-fade mt-2 flex items-start gap-1.5 text-sm text-err">
      <CircleAlert aria-hidden className="mt-0.5 size-3.5 shrink-0" />
      {message}
    </p>
  );
}

export function ContactForm() {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const successRef = useRef<HTMLDivElement>(null);

  // onTouched: a field validates the first time the visitor leaves it, then
  // re-validates live as they fix it, so feedback is inline, not a wall of
  // errors on submit.
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    mode: "onTouched",
    defaultValues: { budget: "", projectType: "", website: "" },
  });

  // Pre-select from ?plan= (budget) and ?type= (project type, from the service
  // tiles). Client-side, so the page stays static.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const plan = params.get("plan");
    const budget = plan ? planToBudget[plan] : undefined;
    if (budget) setValue("budget", budget);
    const type = params.get("type");
    if (type && (contact.projectTypes as readonly string[]).includes(type)) {
      setValue("projectType", type);
    }
  }, [setValue]);

  // Move focus to the confirmation so keyboard / screen-reader users land on it.
  useEffect(() => {
    if (sent) successRef.current?.focus();
  }, [sent]);

  const [budget, projectType, message = ""] = useWatch({
    control,
    name: ["budget", "projectType", "message"],
  });

  const onSubmit = (data: ContactInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await sendContactMessage(data);
      if (result.ok) {
        setSent(true);
      } else {
        setServerError(result.error);
      }
    });
  };

  return (
    <div className="relative">
      {sent ? (
          <div
            ref={successRef}
            tabIndex={-1}
            className="anim-rise relative flex min-h-96 flex-col items-center justify-center overflow-hidden rounded-2xl border border-ok/25 bg-surface p-10 text-center focus:outline-none"
            role="status"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,oklch(85.5%_0.125_181/0.12),transparent_70%)]"
            />
            <CircleCheck
              aria-hidden
              className="relative size-14 text-ok motion-safe:animate-[success-pop_0.5s_var(--ease-out-expo)_both]"
            />
            <h2 className="relative mt-5 font-display text-2xl font-semibold text-ink">
              Message sent!
            </h2>
            <p className="relative mt-2 max-w-sm text-sm leading-relaxed text-ink-dim">
              {contact.responseTime}. If it&apos;s urgent, reach me at{" "}
              <a
                href={`mailto:${siteConfig.email}`}
                className="font-medium text-accent hover:text-ink"
              >
                {siteConfig.email}
              </a>
              .
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            aria-busy={isPending}
            className="flex flex-col gap-6"
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="contact-name" className={labelClasses}>
                  Name
                </label>
                <input
                  id="contact-name"
                  type="text"
                  autoComplete="name"
                  required
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "contact-name-error" : undefined}
                  className={cn(fieldClasses, "mt-2")}
                  {...register("name")}
                />
                <FieldError id="contact-name-error" message={errors.name?.message} />
              </div>

              <div>
                <label htmlFor="contact-email" className={labelClasses}>
                  Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="off"
                  spellCheck={false}
                  required
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "contact-email-error" : undefined}
                  className={cn(fieldClasses, "mt-2")}
                  {...register("email")}
                />
                <FieldError id="contact-email-error" message={errors.email?.message} />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="contact-budget" className={labelClasses}>
                  Budget range
                </label>
                {/* appearance-none strips the native arrow, so draw our own —
                    without it the select doesn't read as a select at all. */}
                <div className="relative mt-2">
                  <select
                    id="contact-budget"
                    required
                    aria-invalid={Boolean(errors.budget)}
                    aria-describedby={errors.budget ? "contact-budget-error" : undefined}
                    className={cn(fieldClasses, "cursor-pointer appearance-none pr-10", !budget && "text-ink-dim")}
                    {...register("budget")}
                  >
                    <option value="" disabled>
                      Select a range
                    </option>
                    {contact.budgetOptions.map((option) => (
                      <option key={option} value={option} className="text-ink">
                        {option}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    aria-hidden
                    className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-dim"
                  />
                </div>
                <FieldError id="contact-budget-error" message={errors.budget?.message} />
              </div>

              <div>
                <label htmlFor="contact-type" className={labelClasses}>
                  Project type
                </label>
                <div className="relative mt-2">
                  <select
                    id="contact-type"
                    required
                    aria-invalid={Boolean(errors.projectType)}
                    aria-describedby={errors.projectType ? "contact-type-error" : undefined}
                    className={cn(fieldClasses, "cursor-pointer appearance-none pr-10", !projectType && "text-ink-dim")}
                    {...register("projectType")}
                  >
                    <option value="" disabled>
                      Select a type
                    </option>
                    {contact.projectTypes.map((option) => (
                      <option key={option} value={option} className="text-ink">
                        {option}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    aria-hidden
                    className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-dim"
                  />
                </div>
                <FieldError id="contact-type-error" message={errors.projectType?.message} />
              </div>
            </div>

            <div>
              <label htmlFor="contact-message" className={labelClasses}>
                Message
              </label>
              <textarea
                id="contact-message"
                rows={5}
                required
                placeholder="Tell me about your project: what you're building, the problem it solves, and any timeline constraints."
                aria-invalid={Boolean(errors.message)}
                aria-describedby={errors.message ? "contact-message-error" : "contact-message-hint"}
                className={cn(fieldClasses, "mt-2 min-h-32 resize-y leading-relaxed")}
                {...register("message")}
              />
              {errors.message ? (
                <FieldError id="contact-message-error" message={errors.message.message} />
              ) : (
                // State the requirement up front instead of only erroring on it.
                <p id="contact-message-hint" className={cn(hintClasses, "flex justify-between gap-4")}>
                  <span>A couple of sentences is plenty.</span>
                  <span aria-hidden className={cn("tabular-nums", message.length >= 20 && "text-ok")}>
                    {message.length < 20 ? `${20 - message.length} more` : "✓"}
                  </span>
                </p>
              )}
            </div>

            {/* Honeypot: visually hidden, tab-skipped; bots fill it. */}
            <div aria-hidden className="absolute -left-[9999px] size-px overflow-hidden">
              <label htmlFor="contact-website">Website</label>
              <input
                id="contact-website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                {...register("website")}
              />
            </div>

            {serverError && (
              <p role="alert" className="anim-fade flex items-start gap-2 rounded-xl border border-err/30 bg-err/[0.06] px-4 py-3 text-sm text-err">
                <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
                {serverError}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className={cn(
                "focus-pill inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent-solid",
                "text-base font-semibold text-white",
                "transition-[scale,filter,box-shadow,opacity] duration-[520ms] ease-spring",
                "hover:shadow-glow hover:brightness-110 active:scale-[0.97] active:duration-100 active:ease-out",
                "focus-visible:outline-none",
                "disabled:pointer-events-none disabled:opacity-60",
              )}
            >
              {isPending ? (
                <>
                  <LoaderCircle aria-hidden className="size-4 animate-spin" />
                  Sending…
                </>
              ) : (
                "Send Message"
              )}
            </button>
            <p className="-mt-2 text-center text-xs text-ink-dim">
              {contact.responseTime}.
            </p>
          </form>
        )}
    </div>
  );
}
