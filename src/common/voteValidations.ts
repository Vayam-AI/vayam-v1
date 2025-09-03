import { z } from "zod";

export const voteSchema = z.object({
  zid: z
    .number()
    .int({ message: "Conversation ID must be an integer" })
    .positive({ message: "Conversation ID must be a positive number" }),
  tid: z
    .number()
    .int({ message: "Comment ID must be an integer" })
    .positive({ message: "Comment ID must be a positive number" }),
  vote: z
    .number()
    .int({ message: "Vote must be an integer" })
    .min(-1, { message: "Vote must be between -1 and 1" })
    .max(1, { message: "Vote must be between -1 and 1" }),
});

export type VoteSchema = z.infer<typeof voteSchema>;
