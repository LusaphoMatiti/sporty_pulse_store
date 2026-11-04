"use server";

import db from "@/utils/db";
import { redirect } from "next/navigation";
import {
  imageSchema,
  productSchema,
  validateWithZodSchema,
} from "@/utils/schemas";
import { deleteImage, uploadImage } from "@/utils/supabase";
import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/utils/guards";
import { isValidPrice } from "@/utils/validation";

export const createProduction = async (prevState: any, formData: FormData) => {
  const user = await getAdminUser();

  try {
    const rawData = Object.fromEntries(formData.entries());
    const muscleIds = formData.getAll("muscleIds") as string[];
    const rawCategory = formData.get("category") as string;
    const muscleGroup = formData.get("muscle") as string;

    const file = formData.get("image") as File;
    if (!(file instanceof File)) {
      return { success: false, message: "Image is required" };
    }

    if (!rawCategory || !["fitness", "recovery"].includes(rawCategory)) {
      return {
        success: false,
        message: "Category is required and must be fitness or recovery",
      };
    }

    const validatedFields = validateWithZodSchema(productSchema, rawData);
    if (!validatedFields.success) {
      return { success: false, message: validatedFields.message };
    }

    const validatedFile = validateWithZodSchema(imageSchema, { image: file });
    if (!validatedFile.success) {
      return { success: false, message: validatedFile.message };
    }

    const fullPath = await uploadImage(validatedFile.data.image);
    const { muscle, ...safeData } = validatedFields.data;

    await db.products.create({
      data: {
        ...safeData,
        image: fullPath,
        userId: user.id,

        // simple string column
        muscle: muscleGroup,

        // connectOrCreate for Category (safe)
        category: {
          connectOrCreate: {
            where: {
              name: rawCategory, // because name is @unique in Category model
            },
            create: {
              name: rawCategory,
            },
          },
        },

        // connectOrCreate for muscles (composite unique)
        productMuscles: {
          create: muscleIds.map((id) => ({
            muscle: {
              connect: { id }, // safe because id is primary key
            },
          })),
        },
      },
    });

    revalidatePath("/admin/products");
    return { success: true, message: "Product created successfully" };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Body exceeded 1 MB limit")
    ) {
      return { success: false, message: "File size must be less than 1 MB" };
    }

    return {
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
    };
  }
};

export const fetchAdminProducts = async () => {
  await getAdminUser();
  return db.products.findMany({ orderBy: { createdAt: "desc" } });
};

export const fetchAdminProductDetails = async (productId: string) => {
  await getAdminUser();
  const product = await db.products.findUnique({ where: { id: productId } });
  if (!product) redirect("/admin/products");
  return product;
};

export const deleteProductAction = async (
  prevState: any,
  formData: FormData,
) => {
  await getAdminUser();
  try {
    const productId = formData.get("productId") as string;
    if (!productId) {
      return { success: false, message: "Product ID missing" };
    }

    const product = await db.products.delete({
      where: { id: productId },
    });
    await deleteImage(product.image);
    revalidatePath("/admin/products");
    return { success: true, message: "Product removed" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "An error occurred",
    };
  }
};

export const updateProductAction = async (
  prevState: any,
  formData: FormData,
) => {
  await getAdminUser();
  try {
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const company = formData.get("company") as string;
    const description = formData.get("description") as string;
    const price = Number(formData.get("price"));
    const featured = formData.has("featured");

    if (!isValidPrice(price)) {
      return {
        success: false,
        message: "Price must be a whole number of at least 1",
      };
    }

    await db.products.update({
      where: { id },
      data: { name, company, description, price, featured },
    });
    revalidatePath(`/admin/products/${id}/edit`);
    return { success: true, message: "Product updated successfully" };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update product",
    };
  }
};

export const updateProductImageAction = async (
  prevState: any,
  formData: FormData,
) => {
  await getAdminUser();
  try {
    const image = formData.get("image") as File;
    const productId = formData.get("id") as string;
    const oldImageUrl = formData.get("url") as string;

    const validatedFile = validateWithZodSchema(imageSchema, { image });
    if (!validatedFile.success)
      return {
        success: false,
        message: "Invalid file: " + validatedFile.message,
      };

    const fullPath = await uploadImage(validatedFile.data.image);
    await deleteImage(oldImageUrl);
    await db.products.update({
      where: { id: productId },
      data: { image: fullPath },
    });

    revalidatePath(`/admin/products/${productId}/edit`);
    return { success: true, message: "Product image updated successfully" };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
};

export const fetchAdminOrders = async () => {
  await getAdminUser();

  const orders = await db.order.findMany({
    where: {
      isPaid: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return orders;
};
