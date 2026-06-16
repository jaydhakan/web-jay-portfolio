"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheck, LoaderCircle } from "lucide-react";
import { contact, siteConfig } from "@/data/content";
import { contactSchema, type ContactInput } from "@/lib/contact-schema";
import { sendContactMessage } from "@/app/actions/contact";
import { cn } from "@/lib/utils";

const fieldClasses =
  "w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink " +
  "placeholder:text-ink-dim transition-[color,border-color,box-shadow] duration-200 " +
  "hover:border-accent/30 focus:border-accent focus:outline-none " +
  "focus:ring-2 focus:ring-accent/50 focus:shadow-glow";

const labelClasses = "block text-sm font-medium text-ink";
const errorClasses = "mt-2 text-sm text-err";

/** /contact?plan=growth pre-selects the matching budget (read client-side so the
    page stays static). */
const planToBudget: Record<string, string> = {
  starter: "$1k-$5k",
  growth: "$5k-$15k",
  custom: "Let's discuss",
};

export function ContactForm() {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { budget: "", projectType: "", website: "" },
  });

  // Pre-select the budget from ?plan= (client-side; keeps the page static).
  useEffect(() => {
    const plan = new URLSearchParams(window.location.search).get("plan");
    const budget = plan ? planToBudget[plan] : undefined;
    if (budget) setValue("budget", budget);
  }, [setValue]);

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
            className="anim-rise relative flex min-h-96 flex-col items-center justify-center overflow-hidden rounded-2xl border border-ok/25 bg-surface p-10 text-center"
            role="status"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,oklch(72%_0.17_152/0.12),transparent_70%)]"
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
            className="flex flex-col gap-6"
          >
            <div>
              <label htmlFor="contact-name" className={labelClasses}>
                Name
              </label>
              <input
                id="contact-name"
                type="text"
                autoComplete="name"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "contact-name-error" : undefined}
                className={cn(fieldClasses, "mt-2")}
                {...register("name")}
              />
              {errors.name && (
                <p id="contact-name-error" className={errorClasses}>
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="contact-email" className={labelClasses}>
                Email
              </label>
              <input
                id="contact-email"
                type="email"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "contact-email-error" : undefined}
                className={cn(fieldClasses, "mt-2")}
                {...register("email")}
              />
              {errors.email && (
                <p id="contact-email-error" className={errorClasses}>
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="contact-budget" className={labelClasses}>
                  Budget range
                </label>
                <select
                  id="contact-budget"
                  aria-invalid={Boolean(errors.budget)}
                  aria-describedby={errors.budget ? "contact-budget-error" : undefined}
                  className={cn(fieldClasses, "mt-2 appearance-none")}
                  {...register("budget")}
                >
                  <option value="" disabled>
                    Select a range
                  </option>
                  {contact.budgetOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {errors.budget && (
                  <p id="contact-budget-error" className={errorClasses}>
                    {errors.budget.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="contact-type" className={labelClasses}>
                  Project type
                </label>
                <select
                  id="contact-type"
                  aria-invalid={Boolean(errors.projectType)}
                  aria-describedby={errors.projectType ? "contact-type-error" : undefined}
                  className={cn(fieldClasses, "mt-2 appearance-none")}
                  {...register("projectType")}
                >
                  <option value="" disabled>
                    Select a type
                  </option>
                  {contact.projectTypes.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {errors.projectType && (
                  <p id="contact-type-error" className={errorClasses}>
                    {errors.projectType.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="contact-message" className={labelClasses}>
                Message
              </label>
              <textarea
                id="contact-message"
                rows={5}
                placeholder="Tell me about your project: what you're building, the problem it solves, and any timeline constraints."
                aria-invalid={Boolean(errors.message)}
                aria-describedby={errors.message ? "contact-message-error" : undefined}
                className={cn(fieldClasses, "mt-2 resize-y")}
                {...register("message")}
              />
              {errors.message && (
                <p id="contact-message-error" className={errorClasses}>
                  {errors.message.message}
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
              <p role="alert" className="text-sm text-err">
                {serverError}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className={cn(
                "focus-pill inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent-solid",
                "text-base font-semibold text-white transition duration-200 ease-out",
                "hover:shadow-glow hover:brightness-110 active:scale-[0.98]",
                "focus-visible:outline-none",
                "disabled:pointer-events-none disabled:opacity-60",
              )}
            >
              {isPending ? (
                <>
                  <LoaderCircle aria-hidden className="size-4 animate-spin" />
                  Sending
                </>
              ) : (
                "Send Message"
              )}
            </button>
          </form>
        )}
    </div>
  );
}
