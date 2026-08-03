import { Suspense } from "react";

import AuthForm from "@/components/auth/auth-form";
import { AuthFormSkeleton } from "@/components/common/page-skeleton";

export default function SignupPage() {
  return (
    <Suspense fallback={<AuthFormSkeleton />}>
      <AuthForm initialMode="signup" />
    </Suspense>
  );
}
