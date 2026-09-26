import UpperBody from "@/components/categories/Upperbody";
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
          video="https://res.cloudinary.com/dsoxsrjn2/video/upload/f_auto,q_auto/v1769431303/upperbody_video_mwnson.mp4"
          quote="Strength shows when there’s nowhere to hide."
        />
        <UpperBody searchParams={resolvedSearchParams} />
        <PicQuote image="/upperbody.jpg" quote="Push. Pull. Earn it." />
      </MarketingLayout>
    </>
  );
}
