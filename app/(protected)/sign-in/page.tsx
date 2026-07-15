import { Suspense } from "react";
import SignInForm from "@/components/auth/sign-in-form";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="py-20">
      <h1 className="text-2xl font-semibold mb-8 text-center capitalize">
        Sign in
      </h1>
      <Suspense fallback={null}>
        <SignInForm />
      </Suspense>
      <p className="text-center text-sm mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
