import { z } from "zod";

export const PREORDER_WAIT_DAY_OPTIONS = [7, 14, 21, 30, 45, 60, 90] as const;

export const listingSchema = z.object({
  brand: z
    .string()
    .min(1, "Brand is required")
    .max(32, "Brand must be at most 32 characters"),
  make: z
    .string()
    .min(1, "Make is required")
    .max(32, "Make must be at most 32 characters"),
  model: z
    .string()
    .min(1, "Model is required")
    .max(64, "Model must be at most 64 characters"),
  variant: z
    .string()
    .min(1, "Variant is required")
    .max(128, "Variant must be at most 128 characters"),
  scale: z.enum(["1/18", "1/24", "1/43", "1/64"], {
    errorMap: () => ({ message: "Scale must be one of: 1/18, 1/24, 1/43, 1/64" }),
  }),
  production_count: z.preprocess(
    (val) => (typeof val === "number" && isNaN(val) ? undefined : val),
    z.number().int("Production count must be a whole number").positive("Production count must be a positive integer").optional()
  ),
  description: z.string().optional(),
  is_preorder: z.boolean(),
  preorder_wait_days: z
    .number()
    .int()
    .optional()
    .nullable(),
  addon_option_ids: z.array(z.string().uuid()).default([]),
});

export type ListingFormData = z.infer<typeof listingSchema>;
