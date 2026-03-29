import { z } from "zod";

export const commentSchema = z.object({
  title: z
    .string()
    .max(64, "Title must be 64 characters or fewer"),
  description: z.string().min(1, "Description is required"),
});

export type CommentFormData = z.infer<typeof commentSchema>;
