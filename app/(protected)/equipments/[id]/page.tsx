import BreadCrumbs from "@/components/single-product/BreadCrumbs";
import {
  fetchSingleProduct,
  fetchSingleProductWithMuscles,
  findExistingReview,
} from "@/utils/action";
import Image from "next/image";
import { formatCurrency } from "@/utils/format";
import FavoriteToggleButton from "@/components/products/FavoriteToggleButton";
import AddToCart from "@/components/single-product/AddToCart";
import ProductRating from "@/components/single-product/ProductRating";
import ShareButton from "@/components/single-product/ShareButton";
import SubmitReview from "@/components/reviews/SubmitReview";
import ProductReviews from "@/components/reviews/ProductReviews";
import { currentUser } from "@clerk/nextjs/server";
import SimilarProducts from "@/components/single-product/SimilarProducts";
import MarketingLayout from "@/components/layouts/MarketingLayout";
import TrackView from "@/components/single-product/TrackView";
import Trainer from "@/components/global/Trainer";
import { Muscle } from "@prisma/client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SingleProductsPage({ params }: PageProps) {
  const { id } = await params;
  const product = await fetchSingleProductWithMuscles(id);

  if (!product) {
    return (
      <section className="p-8 text-center">
        <h1 className="text-2xl font-semibold">Product not found</h1>
      </section>
    );
  }

  const { name, image, company, description, price } = product;
  const dollarsAmount = formatCurrency(price);

  const user = await currentUser();
  const reviewDoesNotExist =
    user && !(await findExistingReview(user.id, product.id));

  const muscles = product.productMuscles.map((pm) => pm.muscle);

  return (
    <>
      <BreadCrumbs currentLabel={name} />
      <MarketingLayout>
        <TrackView productId={id} />
        <div className="mt-6 grid gap-y-8 lg:grid-cols-2 lg:gap-x-16">
          {/* IMAGE COLUMN */}
          <div className="relative w-full h-[260px] sm:h-[320px] md:h-[420px] lg:h-[500px]">
            <Image
              src={image}
              alt={name}
              fill
              sizes="(max-width:768px) 100vw, (max-width:1200px) 50vw, 33vw"
              priority
              className="object-contain"
            />
          </div>

          {/* PRODUCT DETAILS COLUMN */}
          <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-x-8">
              <h1 className="capitalize text-3xl font-bold">{name}</h1>
              <div className="flex items-center gap-x-2">
                <FavoriteToggleButton productId={id} />
                <ShareButton name={name} productId={id} />
              </div>
            </div>

            <ProductRating productId={id} />
            <h4 className="text-xl mt-2">{company}</h4>

            <p className="mt-4 text-3xl font-bold tracking-tight">
              {dollarsAmount}
            </p>

            <p className="mt-6 leading-8 text-muted-foreground">
              {description}
            </p>

            <AddToCart productId={id} />
          </div>
        </div>

        <Trainer
          equipmentName={name}
          video="https://res.cloudinary.com/dsoxsrjn2/video/upload/v1769429711/lowerbody_video_m6vidn.mp4"
          muscles={muscles}
        />

        <ProductReviews productId={id} />

        {reviewDoesNotExist && <SubmitReview productId={id} />}
        <div className="mt-20">
          <SimilarProducts
            muscle={product.muscle}
            currentProductId={product.id}
          />
        </div>
      </MarketingLayout>
    </>
  );
}
