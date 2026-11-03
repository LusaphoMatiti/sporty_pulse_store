"use client";

import { useEffect, useRef, useState } from "react";
import SelectProductAmount from "../single-product/SelectProductAmount";
import { Mode } from "../single-product/SelectProductAmount";
import { SubmitButton } from "../form/Buttons";
import {
  removeCartItemAction,
  updateCartItemAction,
  type CartItemActionState,
} from "@/utils/action";
import { toast } from "sonner";

const ThirdColumn = ({ quantity, id }: { quantity: number; id: string }) => {
  const [amount, setAmount] = useState(quantity);
  const [isBusy, setIsBusy] = useState(false);
  // Synchronous guard: blocks a second submission even before React has
  // re-rendered with isBusy, for example a double click, or the update and
  // remove forms being used at the same time.
  const inFlight = useRef(false);

  // Keep the selector in line with the saved quantity whenever it changes,
  // for example after an update, or when the cart is refreshed elsewhere.
  useEffect(() => {
    setAmount(quantity);
  }, [quantity]);

  // Must stay async: the selector's setAmount prop is typed to return a Promise.
  const handleAmountChange = async (value: number) => {
    setAmount(value);
  };

  const runAction = async (
    action: (formData: FormData) => Promise<CartItemActionState>,
    formData: FormData,
    loadingMessage: string,
  ) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setIsBusy(true);

    // The same toast id is reused for the result, so the loading
    // notification is replaced instead of being left on screen.
    const toastId = toast.loading(loadingMessage);
    try {
      const result = await action(formData);
      if (result.success) {
        toast.success(result.message, { id: toastId });
        if (result.amount !== undefined) setAmount(result.amount);
      } else {
        toast.error(result.message, { id: toastId });
        setAmount(quantity); // back to the saved value
      }
    } catch {
      toast.error("Something went wrong. Please try again.", { id: toastId });
      setAmount(quantity);
    } finally {
      inFlight.current = false;
      setIsBusy(false);
    }
  };

  return (
    <div className="md:ml-8">
      {/* UPDATE QUANTITY */}
      <form
        action={(formData: FormData) =>
          runAction(updateCartItemAction, formData, "Updating quantity...")
        }
      >
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="amount" value={amount} />

        <SelectProductAmount
          amount={amount}
          setAmount={handleAmountChange}
          mode={Mode.CartItem}
          isLoading={isBusy}
        />

        <SubmitButton size="sm" className="mt-4" text="Update" />
      </form>

      {/* REMOVE ITEM */}
      <form
        action={(formData: FormData) =>
          runAction(removeCartItemAction, formData, "Removing item...")
        }
      >
        <input type="hidden" name="id" value={id} />
        <SubmitButton size="sm" className="mt-2" text="Remove" />
      </form>
    </div>
  );
};

export default ThirdColumn;
