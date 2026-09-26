import Fullbody from "@/components/categories/Fullbody";
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
          video="https://res.cloudinary.com/dsoxsrjn2/video/upload/f_auto,q_auto/v1769429499/fullbody_video_ozisy8.mp4"
          quote="Every rep should count."
        />
        <Fullbody searchParams={resolvedSearchParams} />
        <PicQuote
          image="/fullbody.jpg"
          quote="One workout. Total accountability."
        />
      </MarketingLayout>
    </>
  );
}
