import { z } from "zod";

/** Shared by the client form and the server action so rules never drift. */
export const contactSchema = z.object({
  name: z.string().min(2, "Please tell me your name."),
  email: z.email("Enter a valid email address."),
  budget: z.string().min(1, "Pick a budget range."),
  projectType: z.string().min(1, "Pick a project type."),
  message: z
    .string()
    .min(20, "Give me at least a couple of sentences about the project."),
  /** Honeypot: humans never see or fill this. */
  website: z.string().optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;
