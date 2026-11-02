import { login } from "../actions";
import { AuthForm } from "../auth-form";

export default function LoginPage() {
  return (
    <AuthForm
      title="Welcome back"
      description="Log in to your account"
      submitLabel="Log in"
      action={login}
      footerText="No account yet?"
      footerLinkLabel="Sign up"
      footerHref="/signup"
    />
  );
}