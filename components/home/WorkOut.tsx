"use client";

import { useRef, useEffect } from "react";
import clsx from "clsx";

type Prop = {
  video: string;
  quote?: string;
  className?: string;
};

export default function WorkOut({ video, quote, className }: Prop) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    videoRef.current.playbackRate = prefersReducedMotion ? 1 : 1.25;

    const playPromise = videoRef.current.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        console.log("Autoplay blocked on mobile");
      });
    }
  }, []);

  return (
    <section
      className={
        className
          ? className
          : "relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen overflow-hidden bg-black"
      }
    >
      <div className="relative h-[260px] sm:h-[360px] lg:h-[400px] w-full overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/homeworkout-poster.jpg"
          className="absolute left-1/2 top-1/2 h-full w-[140%] -translate-x-1/2 -translate-y-1/2 object-cover"
        >
          <source src={video} type="video/mp4" />
        </video>

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/45 z-10" />

        {/* Content */}
        <div
          className="
            absolute inset-0 z-20
            flex flex-col
            items-center
            justify-center
            text-center
            px-6 sm:px-10 lg:px-16
          "
        >
          <h3 className="max-w-2xl font-bold text-2xl sm:text-4xl lg:text-5xl text-white">
            {quote}
          </h3>
        </div>
      </div>
    </section>
  );
}
