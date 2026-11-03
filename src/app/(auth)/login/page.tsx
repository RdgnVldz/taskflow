import { Suspense } from "react";
import { login } from "../actions";
import { AuthForm } from "../auth-form";

export default function LoginPage() {
  return (
    <Suspense
      fallback={<div className="h-80 w-full max-w-sm animate-pulse rounded-xl bg-muted" />}
    >
      <AuthForm
        title="Welcome back"
        description="Log in to your account"
        submitLabel="Log in"
        action={login}
        footerText="No account yet?"
        footerLinkLabel="Sign up"
        footerHref="/signup"
      />
    </Suspense>
  );
}