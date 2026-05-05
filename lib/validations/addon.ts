import { z } from "zod";

export const categorySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(64, "Name must be at most 64 characters"),
});

export const optionSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(64, "Name must be at most 64 characters"),
  price: z
    .number()
    .int("Price must be a whole number")
    .min(0, "Price must be non-negative"),
});

export type CategoryFormData = z.infer<typeof categorySchema>;
export type OptionFormData = z.infer<typeof optionSchema>;
