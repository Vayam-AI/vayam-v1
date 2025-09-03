import z from "zod";

export const conversationSchema = z.object({
  topic: z
    .string()
    .min(2, { message: "Topic must be at least 2 characters long" }),
  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters long" }),
  isActive: z.boolean(),
  isPublic: z.boolean(),
  seedComment: z
    .string()
    .max(500, { message: "Seed comment cannot exceed 500 characters" })
    .nullable()
    .transform((val) => (val === "" ? null : val)),
  tags: z.array(z.string()),
  allowedEmails: z
    .array(
      z.string().email({ message: "Please provide valid email addresses" })
    )
    .optional(),
  adminEmail: z
    .string()
    .email({ message: "Please provide a valid admin email address" })
    .nullable()
    .transform((val) => (val === "" ? null : val)),
}).refine((data) => {
  // If conversation is private, adminEmail must be provided
  if (!data.isPublic && !data.adminEmail) {
    return false;
  }
  return true;
}, {
  message: "Admin email is required for private conversations",
  path: ["adminEmail"],
});

export type ConversationsSchema = z.infer<typeof conversationSchema>;
