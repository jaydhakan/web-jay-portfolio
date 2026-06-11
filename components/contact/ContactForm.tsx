"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CircleCheck, LoaderCircle } from "lucide-react";
import { contact, siteConfig } from "@/data/content";
import { contactSchema, type ContactInput } from "@/lib/contact-schema";
import { sendContactMessage } from "@/app/actions/contact";
import { cn } from "@/lib/utils";

type ContactFormProps = {
  defaultBudget?: string;
};

const fieldClasses =
  "w-full rounded-xl border border-token bg-surface px-4 py-3 text-sm text-primary " +
  "placeholder:text-secondary transition-colors duration-200 " +
  "hover:border-accent-primary/30 focus:border-accent-primary focus:outline-none " +
  "focus:ring-2 focus:ring-accent-primary/40";

const labelClasses = "block text-sm font-medium text-primary";
const errorClasses = "mt-2 text-sm text-error";

export function ContactForm({ defaultBudget }: ContactFormProps) {
  const reduceMotion = useReducedMotion();
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { budget: defaultBudget ?? "", projectType: "", website: "" },
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
      <AnimatePresence mode="wait" initial={false}>
        {sent ? (
          <motion.div
            key="success"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
            className="flex min-h-96 flex-col items-center justify-center rounded-2xl border border-token bg-surface p-10 text-center"
            role="status"
          >
            <CircleCheck aria-hidden className="size-12 text-success" />
            <h2 className="mt-5 font-display text-2xl font-semibold text-primary">
              Message sent!
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-secondary">
              {contact.responseTime}. If it&apos;s urgent, reach me at{" "}
              <a
                href={`mailto:${siteConfig.email}`}
                className="font-medium text-accent-primary hover:text-primary"
              >
                {siteConfig.email}
              </a>
              .
            </p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={false}
            exit={reduceMotion ? undefined : { opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
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
              <p role="alert" className="text-sm text-error">
                {serverError}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className={cn(
                "inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent-solid",
                "text-base font-semibold text-white transition duration-200 ease-out",
                "hover:shadow-glow hover:brightness-110 active:scale-[0.98]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base",
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
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
