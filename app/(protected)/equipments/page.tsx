import Container from "@/components/global/Container";
import LoadingContainer from "@/components/global/LoadingContainer";
import SectionTitle from "@/components/global/SectionTitle";
import MarketingLayout from "@/components/layouts/MarketingLayout";
import BreadCrumbs from "@/components/single-product/BreadCrumbs";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

export default async function ProductsPage() {
  return (
    <MarketingLayout>
      <BreadCrumbs />
      <Suspense fallback={<LoadingContainer />}>
        <section className="pt-8 mt-0" data-nav-theme="light">
          <SectionTitle text="Training & Recovery Equipments" />

          <div className="pt-12 grid grid-cols-1 lg:grid-cols-2 gap-10 auto-rows-fr">
            {/* Core */}
            <article className="group relative">
              <Link href="/category/fitness/core">
                <Card className="overflow-hidden rounded-none border transition hover:shadow-lg">
                  <CardContent className="p-0">
                    <div className="relative aspect-[4/3] w-full overflow-hidden">
                      <Image
                        src="/core.jpg"
                        alt="Core"
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                      <div className="absolute inset-0 z-10 flex items-end p-10">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white">
                          Core
                        </h2>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </article>

            {/* Upper Body */}
            <article className="group relative">
              <Link href="/category/fitness/upper-body">
                <Card className="overflow-hidden rounded-none border transition hover:shadow-lg">
                  <CardContent className="p-0">
                    <div className="relative aspect-[4/3] w-full overflow-hidden">
                      <Image
                        src="/upperbody.jpg"
                        alt="Upper Body"
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                      <div className="absolute inset-0 z-10 flex items-end p-10">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white">
                          Upper Body
                        </h2>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </article>

            {/* Full Body */}
            <article className="group relative">
              <Link href="/category/fitness/full-body">
                <Card className="overflow-hidden rounded-none border transition hover:shadow-lg">
                  <CardContent className="p-0">
                    <div className="relative aspect-[4/3] w-full overflow-hidden">
                      <Image
                        src="/fullbody.jpg"
                        alt="Full Body"
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                      <div className="absolute inset-0 z-10 flex items-end p-10">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white">
                          Full Body
                        </h2>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </article>

            {/* Lower Body */}
            <article className="group relative">
              <Link href="/category/fitness/lower-body">
                <Card className="overflow-hidden rounded-none border transition hover:shadow-lg">
                  <CardContent className="p-0">
                    <div className="relative aspect-[4/3] w-full overflow-hidden">
                      <Image
                        src="/lowerbody.jpg"
                        alt="Lower Body"
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/45" />
                      <div className="absolute inset-0 z-10 flex items-end p-10">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white">
                          Lower Body
                        </h2>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </article>
            <article className="group relative">
              <Link href="/category/recovery">
                <Card className="overflow-hidden rounded-none border transition hover:shadow-xl">
                  <CardContent className="p-0">
                    <div className="relative aspect-[4/3] w-full overflow-hidden">
                      <Image
                        src="/Recovery.jpg"
                        alt="Recovery"
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="
                          object-cover
                          transition-transform
                          duration-300
                          group-hover:scale-105
                        "
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

                      {/* Content */}

                      <div className="absolute inset-0 z-10 flex items-end p-10">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white">
                          Recovery
                        </h2>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </article>
          </div>
        </section>
      </Suspense>
    </MarketingLayout>
  );
}
