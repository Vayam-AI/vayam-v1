import { z } from "zod";

export const commentSchema = z.object({
  zid: z
    .number()
    .int({ message: "Conversation ID must be an integer" })
    .positive({ message: "Conversation ID must be a positive number" }),

  txt: z
    .string()
    .min(1, { message: "Comment cannot be empty" })
    .max(10000, { message: "Comment cannot exceed 1000 characters" })
    .refine((text) => {
      const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
      return wordCount >= 1 && wordCount <= 80;
    }, { message: "Comment must be between 1 and 80 words" }),

  isSeed: z.boolean().default(false),
});

export type CommentSchema = z.infer<typeof commentSchema>;
