"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/utils/app-error";

const initialState: ActionResult = {
  success: false,
  message: "",
};

export type ActionFunction = (
  prevState: ActionResult,
  formData: FormData,
) => Promise<ActionResult>;

function FormContainer({
  action,
  children,
  onUnauthorized,
}: {
  action: ActionFunction;
  children: React.ReactNode;
  onUnauthorized?: () => void;
}) {
  const [state, formAction] = useActionState(action, initialState);

  useEffect(() => {
    if (!state.message) return;

    if (!state.success) {
      if (state.code === "UNAUTHORIZED") {
        onUnauthorized?.();
        toast.error("Please sign in to continue");
        return;
      }
      if (state.code === "NETWORK") {
        toast.error("Network error. Check your connection.");
        return;
      }

      if (state.code === "TIMEOUT") {
        toast.error("Server is slow. Try again.");
        return;
      }
    }

    state.success ? toast.success(state.message) : toast.error(state.message);
  }, [state, onUnauthorized]);

  return (
    <form action={formAction} aria-label="form">
      {children}
    </form>
  );
}

export default FormContainer;
