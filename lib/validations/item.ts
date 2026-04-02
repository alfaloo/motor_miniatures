import { z } from "zod";

export const itemSchema = z
  .object({
    brand: z.string().min(1, "Brand is required"),
    make: z.string().min(1, "Make is required"),
    model: z.string().min(1, "Model is required"),
    variant: z.string().min(1, "Variant is required"),
    scale: z.enum(["1/18", "1/24", "1/43", "1/64"], {
      errorMap: () => ({ message: "Scale must be one of 1/18, 1/24, 1/43, 1/64" }),
    }),
    serial_number: z.preprocess(
      (v) => (typeof v === "number" && isNaN(v) ? null : v),
      z.number().int().positive().optional().nullable()
    ),
    production_count: z.preprocess(
      (v) => (typeof v === "number" && isNaN(v) ? null : v),
      z.number().int().positive().optional().nullable()
    ),
    grade: z
      .number()
      .int()
      .min(1)
      .max(10)
      .optional()
      .nullable(),
    purchase_price: z
      .number()
      .int()
      .positive("Purchase price must be a positive integer"),
    purchase_platform: z.string().min(1, "Purchase platform is required"),
    purchase_year: z
      .number()
      .int()
      .min(1900, "Purchase year must be 1900 or later"),
    purchase_month: z
      .number()
      .int()
      .min(1, "Purchase month must be between 1 and 12")
      .max(12, "Purchase month must be between 1 and 12"),
    is_preorder: z.boolean(),
    received_year: z.number().int().optional().nullable(),
    received_month: z.number().int().optional().nullable(),
    is_wishlist: z.boolean().default(false),
    is_sold: z.boolean(),
    sold_price: z.number().int().positive().optional().nullable(),
    sold_platform: z.string().optional().nullable(),
    sold_year: z
      .number()
      .int()
      .min(1900, "Sold year must be 1900 or later")
      .optional()
      .nullable(),
    sold_month: z
      .number()
      .int()
      .min(1)
      .max(12)
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      if (data.is_sold) {
        return (
          data.sold_price != null &&
          data.sold_platform != null &&
          data.sold_platform.trim().length > 0 &&
          data.sold_year != null &&
          data.sold_month != null
        );
      }
      return true;
    },
    {
      message:
        "Sold price, platform, year, and month are required when item is sold",
      path: ["sold_price"],
    }
  );

export type ItemFormData = z.infer<typeof itemSchema>;
