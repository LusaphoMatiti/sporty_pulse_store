import Container from "@/components/global/Container";
import LoadingContainer from "@/components/global/LoadingContainer";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import Hero from "@/components/home/Hero";

import { Suspense } from "react";
import ShopByCategory from "./(protected)/category/page";
import Blogpost from "@/components/blogpost/Blogpost";
import MarketingLayout from "@/components/layouts/MarketingLayout";
import { getServerUserId } from "@/utils/server/auth";

export default async function HomePage() {
  const userId = await getServerUserId();

  return (
    <MarketingLayout>
      <Hero />
      <Suspense fallback={<LoadingContainer />}>
        <Container className="py-10 px-10 sm:py-5">
          <FeaturedProducts />
        </Container>
      </Suspense>
      <Container className="py-10 px-10 sm:py-5">
        <Blogpost />
      </Container>

      <div className="pt-5 sm:px-10">
        <ShopByCategory />
      </div>
    </MarketingLayout>
  );
}
