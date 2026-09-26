import Core from "@/components/categories/Core";
import WorkOut from "@/components/home/WorkOut";
import MarketingLayout from "@/components/layouts/MarketingLayout";
import PicQuote from "@/components/quote/PicQuote";
import BreadCrumbs from "@/components/single-product/BreadCrumbs";

interface PageProps {
  searchParams: Promise<{
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
  }>;
}

export default async function CoreCategoryPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  return (
    <>
      <BreadCrumbs />

      <MarketingLayout>
        <WorkOut
          video="https://res.cloudinary.com/dsoxsrjn2/video/upload/f_auto,q_auto/v1769429546/core_video_c7b79l.mp4"
          quote="Strong cores don’t happen by accident."
        />
        <Core searchParams={resolvedSearchParams} />

        <PicQuote
          image="/core.jpg"
          quote="Control your core. Control everything"
        />
      </MarketingLayout>
    </>
  );
}
