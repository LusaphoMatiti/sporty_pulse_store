import { toast } from "sonner";
import { file, z, ZodSchema } from "zod";

export const productSchema = z.object({
  name: z.string().min(2).max(100),
  company: z.string(),
  muscle: z.enum(["full-body", "upper-body", "lower-body", "core", "recovery"]),
  featured: z.coerce.boolean().default(false),
  price: z.coerce.number().int().min(0),
  description: z.string(),
});

export const imageSchema = z.object({
  image: validateImageFile(),
});

function validateImageFile() {
  const maxUploadSize = 1024 * 1024;
  const acceptedFileTypes = ["image/"];
  return z
    .instanceof(File)
    .refine((file) => {
      return !file || file.size <= maxUploadSize;
    }, `File size must be less than 1 MB`)
    .refine((file) => {
      return (
        !file || acceptedFileTypes.some((type) => file.type.startsWith(type))
      );
    }, "File must be an image");
}

export function validateWithZodSchema<T>(
  schema: ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; message: string } {
  const result = schema.safeParse(data);

  if (!result.success) {
    const firstMessage =
      result.error.issues[0]?.message || "Something went wrong.";
    return { success: false, message: firstMessage };
  }

  return { success: true, data: result.data };
}

export const reviewSchema = z.object({
  productId: z.string().refine((value) => value !== "", {
    message: "Product ID cannot be empty",
  }),
  authorName: z.string().refine((value) => value !== "", {
    message: "Author name cannot be empty",
  }),
  authorImageUrl: z.string().refine((value) => value !== "", {
    message: "Author image URL cannot be empty",
  }),
  rating: z.coerce
    .number()
    .int()
    .min(1, { message: "Rating must be at least 1" })
    .max(5, { message: "Rating must be at most 5" }),
  comment: z
    .string()
    .min(10, { message: "Comment must be at least 10 characters long" })
    .max(1000, { message: "Comment must be at most 1000 characters long" }),
});
