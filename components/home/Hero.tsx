import { Button } from "@heroui/button";
import Image from "next/image";
import Link from "next/link";

const Hero = () => {
  return (
    <main
      className="relative w-full min-h-[60vh] sm:min-h-[65vh] lg:min-h-[60vh] overflow-hidden flex text-center justify-center "
      data-nav-theme="dark"
    >
      <Image
        src="/sportsman.jpg"
        alt="Training"
        className="absolute inset-0
        w-full
        h-full
        object-cover
        object-[50%_85%]
        sm:object-[50%_75%]
        lg:object-[50%_60%]
        "
        fill
        placeholder="blur"
        blurDataURL="/blur.png"
        priority
      />

      <div className="absolute inset-0 bg-black/55" />

      {/* Content */}

      <div className="relative z-10 w-full max-w-3xl px-4 sm:px-8 lg:px-16 flex flex-col justify-center items-center">
        <h1 className="max-w-2xl font-semibold text-2xl sm:text-4xl lg:text-5xl  text-white tracking-wider">
          Too busy for the gym?
        </h1>
        <p className="mt-5 sm:mt-6 max-w-xl  leading-relaxed sm:leading-loose lg:text-lg text-white tracking-wider">
          Sporty Pulse helps you stay active and recover at home. Turn any
          corner of your space into a personal fitness zone without sacrificing
          time or convience.
        </p>
        <Button
          size="lg"
          className="border border-white px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base text-white w-30 mt-8 sm:mt-10 rounded-lg backdrop-blur-sm hover:bg-white/20 ease-in transition tracking-wider"
          aria-label="Open shop"
        >
          <Link href="/equipments">Shop Now</Link>
        </Button>
      </div>
    </main>
  );
};
export default Hero;
