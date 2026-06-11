"use server";

import { Resend } from "resend";
import { contactSchema, type ContactInput } from "@/lib/contact-schema";
import { ContactEmail } from "@/emails/ContactEmail";
import { siteConfig } from "@/data/content";

export type ContactResult =
  | { ok: true }
  | { ok: false; error: string };

const FALLBACK_ERROR = `Something went wrong sending your message. Email me directly at ${siteConfig.email}.`;

export async function sendContactMessage(input: ContactInput): Promise<ContactResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check the highlighted fields and try again." };
  }

  // Honeypot filled: a bot. Pretend success, send nothing.
  if (parsed.data.website) {
    return { ok: true };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, error: FALLBACK_ERROR };
  }

  const { name, email, budget, projectType, message } = parsed.data;

  try {
    const resend = new Resend(apiKey);
    // TODO(JAY): switch `from` to your verified domain sender once
    // jaydhakan.com is verified in Resend (onboarding@resend.dev works for testing).
    const { error } = await resend.emails.send({
      from: "Portfolio <onboarding@resend.dev>",
      to: siteConfig.email,
      replyTo: email,
      subject: `New inquiry from ${name}: ${projectType}`,
      react: ContactEmail({ name, email, budget, projectType, message }),
    });
    if (error) {
      return { ok: false, error: FALLBACK_ERROR };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: FALLBACK_ERROR };
  }
}
