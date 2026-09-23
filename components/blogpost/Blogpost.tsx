import Image from "next/image";

const Blogpost = () => {
  return (
    <div className="flex flex-col md:flex-row md:justify-between mt-10">
      <div className="md:w-1/2 flex flex-col justify-center">
        <h2 className="text-4xl font-bold mb-8">
          Fitness That Fits Into Your Day
        </h2>
        <p className="mb-2 text-lg">
          You don&apos;t need a full gym to stay consistent. with 30 minutes
          before or after work, a few gym equipment are enough to keep you
          moving, right where you are. No commute, no crowded spaces, no
          complicated setup.
        </p>
        <p className="text-lg">
          Recovery matters just as much as the workout. Stretching and using the
          right recovery tools helps you feel better, move better, and stay
          consistent on your own terms.
        </p>
      </div>

      <div className="relative w-full md:w-1/3 h-72 md:h-64 mt-5">
        <Image
          src="/sporty-blog.jpeg"
          alt="Athlete training"
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
    </div>
  );
};
export default Blogpost;
