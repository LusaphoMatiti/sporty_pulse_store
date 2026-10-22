import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import MarketingLayout from "@/components/layouts/MarketingLayout";

export default function AppPromoPage() {
  return (
    <>
      <section className="flex flex-col items-center py-16 text-left">
        {/* TODO: replace with your actual app artwork/screenshot.
            Full-bleed banner — breaks out of any parent max-width to
            span the full viewport at every screen size. object-cover
            guarantees full width; on screens where max-h caps the box
            shorter than the image's native ratio, it crops the
            top/bottom slightly rather than distorting the image. */}
        <div
          className="relative -ml-[50vw] -mr-[50vw] aspect-[2.35/1] max-h-[220px] w-screen overflow-hidden sm:max-h-[300px] lg:max-h-[500px]"
          data-nav-theme="light"
        >
          <Image
            src="/sporty-cin.png"
            alt="Sporty Pulse app"
            fill
            sizes="100vw"
            className="object-cover"
            data-nav-theme="dark"
            priority
          />
        </div>

        <div className="w-full max-w-2xl self-start px-6 text-left lg:ml-60">
          {/* TODO: replace with your real copy */}
          <h1 className="mt-8 text-3xl font-bold sm:text-4xl">
            Sporty Pulse Pro
          </h1>

          <p className="mt-4 leading-7 text-lg text-muted-foreground">
            Sporty Pulse Pro turns your equipment into a structured training
            system built around your goals, fitness level, and lifestyle. Follow
            guided programs, track every session, build your training history,
            and stay consistent with streaks that keep you accountable, whether
            you train at home or in the gym. Your training should evolve as you
            do. Progress through programs designed to grow with your strength
            and fitness, and unlock AI-powered coaching with Pro for more
            personalized guidance.
          </p>
          <p className="font-bold mt-4 text-lg">
            Download Sporty Pulse Pro and take control of your training.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {/* TODO: replace with your real Play Store / App Store links */}
            <Button asChild size="lg" className="flex-1">
              <Link
                href="https://play.google.com/store/apps"
                target="_blank"
                rel="noopener noreferrer"
              >
                Download for Android
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="flex-1">
              <Link
                href="https://apps.apple.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Download for iOS
              </Link>
            </Button>
          </div>
        </div>
        <a className="font-bold mt-10 text-gray-500 cursor-pointer">
          Learn more about Sporty Pulse Pro
        </a>
      </section>
    </>
  );
}
