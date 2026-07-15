"use client";

import { ReloadIcon } from "@radix-ui/react-icons";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { FaRegHeart, FaHeart } from "react-icons/fa";
import { LuTrash2, LuSquare } from "react-icons/lu";
import { SquarePen } from "lucide-react";

type btnSize = "default" | "lg" | "sm";

type SubmitButtonProps = {
  className?: string;
  text?: string;
  size?: btnSize;
  children?: React.ReactNode;
};

export function SubmitButton({
  className = "",
  text = "submit",
  size = "lg",
  children,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      className={cn("capitalize cursor-pointer", className)}
      size={size}
    >
      {pending ? (
        <>
          <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
          Please wait..
        </>
      ) : (
        (children ?? text)
      )}
    </Button>
  );
}

type actionType = "edit" | "delete";

export const IconButton = ({ actionType }: { actionType: actionType }) => {
  const { pending } = useFormStatus();

  const renderIcon = () => {
    switch (actionType) {
      case "edit":
        return <SquarePen />;
      case "delete":
        return <LuTrash2 />;
      default:
        const never: never = actionType;
        throw new Error(`Invalid action type: ${never}`);
    }
  };

  return (
    <Button
      type="submit"
      size="icon"
      variant="link"
      className="p-2 cursor-pointer"
    >
      {pending ? <ReloadIcon className="animate-spin" /> : renderIcon()}
    </Button>
  );
};

export const CardSignInButton = () => {
  return (
    <Button
      asChild
      type="button"
      size="icon"
      variant="outline"
      className="p-2 cursor-pointer bg-white hover:bg-gray-400"
      aria-label="Sign in button"
    >
      <Link href="/sign-in">
        <FaRegHeart />
      </Link>
    </Button>
  );
};

export const CardSubmitButton = ({
  isFavorite,
  pending,
  className,
  onClick,
}: {
  isFavorite: boolean;
  pending?: boolean;
  className?: string;
  onClick?: () => void;
}) => {
  return (
    <Button
      type="submit"
      size="icon"
      variant="outline"
      className={cn(
        "p-2 cursor-pointer bg-white hover:bg-gray-400 dark:border-gray-200",
        className,
      )}
      disabled={pending}
      onClick={onClick}
      aria-label="Card Submit button"
    >
      {pending ? (
        <ReloadIcon className="animate-spin" />
      ) : isFavorite ? (
        <FaHeart className="dark:text-red-500 " />
      ) : (
        <FaRegHeart className="dark:text-black" />
      )}
    </Button>
  );
};

export const ProductSignButton = () => {
  return (
    <Button
      asChild
      className="mt-8 capitalize cursor-pointer"
      aria-label="Sign In button"
    >
      <Link href="/sign-in">sign in</Link>
    </Button>
  );
};
