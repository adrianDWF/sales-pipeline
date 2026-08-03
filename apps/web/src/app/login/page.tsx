import { Suspense } from "react";

import AuthForm from "@/components/auth/auth-form";
import { AuthFormSkeleton } from "@/components/common/page-skeleton";

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthFormSkeleton />}>
      <AuthForm initialMode="login" />
    </Suspense>
  );
}
