import SectionTitle from "./SectionTitle";
import { FiArrowRight } from "react-icons/fi";
import { SubmitButton } from "../form/Buttons";
import WorkOut from "../home/WorkOut";
import { Muscle } from "@prisma/client";

type TrainerProps = {
  equipmentName: string;
  video: string;
  muscles?: { id: string; name: string }[];
};

const Trainer = ({ equipmentName, video, muscles }: TrainerProps) => {
  return (
    <section className="mt-16">
      <SectionTitle text={`Train with the ${equipmentName} `} />

      <div className="container mx-auto px-6 py-10 lg:py-16">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-center">
          {/* LEFT SIDE — IMAGE / VIDEO */}
          <div className="w-full lg:w-1/2">
            <div className="w-full max-w-xl aspect-video">
              <WorkOut
                className="object-cover w-full h-full rounded-xl"
                video={video}
              />
            </div>
          </div>

          {/* RIGHT SIDE — TEXT */}
          <div className="w-full lg:w-1/2">
            <div className="max-w-lg">
              <h2 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                A simple guided workout to get you started
              </h2>

              <p className="mt-4 text-gray-600 dark:text-gray-300">
                {`Learn how to use this ${equipmentName}  correctly with a step-by-step
                training approach. The guided plan shows proper form, muscle
                focus, and how to structure your workout so you can train with
                confidence from day one `}
              </p>

              <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                Target muscles:
              </h2>

              {/* Muscle Badges */}
              <div className="flex flex-wrap gap-3 mt-8 max-w-md">
                {muscles?.map((muscle) => (
                  <span
                    key={muscle.id}
                    className="
                                   inline-flex items-center
  whitespace-nowrap
  px-4 py-2
  rounded-full
  bg-gray-100 dark:bg-neutral-800
  text-gray-700 dark:text-gray-200
  text-sm font-medium
  border border-gray-200 dark:border-neutral-700
                                 "
                  >
                    <svg
                      className="w-4 h-4 mr-2 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {muscle.name}
                  </span>
                ))}

                <SubmitButton className="mt-8">
                  <span className="flex items-center gap-2">
                    Start guided training
                    <FiArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </SubmitButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Trainer;
