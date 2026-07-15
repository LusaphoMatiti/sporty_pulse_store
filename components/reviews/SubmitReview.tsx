"use client";
import { useState } from "react";
import { SubmitButton } from "../form/Buttons";
import FormContainer from "../form/FormContainer";
import { Card } from "../ui/card";
import RatingInput from "./RatingInput";
import TextAreaInput from "../form/TextAreaInput";
import { Button } from "@/components/ui/button";
import { createReviewAction } from "@/utils/action";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ActionResult } from "@/utils/app-error";
import { toast } from "sonner";

interface SubmitReviewProps {
  productId: string;
}

const SubmitReview = ({ productId }: SubmitReviewProps) => {
  const [isReviewFormVisible, setIsReviewFormVisible] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <div>
      <Button
        size="lg"
        className="capitalize"
        onClick={() => setIsReviewFormVisible((prev) => !prev)}
      >
        Leave Review
      </Button>
      {isReviewFormVisible && (
        <Card className="p-8 mt-8">
          <FormContainer
            action={async (prevState: ActionResult, formData: FormData) => {
              const result = await createReviewAction(prevState, formData);

              if (result.success) {
                toast.success(result.message);
                router.push(`/equipments/${productId}`);
              } else {
                toast.error(result.message);
              }

              return result;
            }}
          >
            <input type="hidden" name="productId" value={productId} />
            <input
              type="text"
              name="authorName"
              value={session?.user?.name || "user"}
            />
            {/* NextAuth doesn't split first/last name like Clerk did --
                using the full name here instead of a first-name-only value. */}
            <input
              type="hidden"
              name="authorImageUrl"
              value={session?.user?.image || ""}
            />
            <RatingInput name="rating" labelText="Rating" />
            <TextAreaInput
              name="comment"
              labelText="feedback"
              defaultValue="Outstanding product!!!"
            />
            <SubmitButton className="mt-4" />
          </FormContainer>
        </Card>
      )}
    </div>
  );
};
export default SubmitReview;
