import { signup } from "../actions";
import { AuthForm } from "../auth-form";

export default function SignupPage() {
  return (
    <AuthForm
      title="Create your account"
      description="Start organizing your team's work"
      submitLabel="Create account"
      action={signup}
      showName
      footerText="Already have an account?"
      footerLinkLabel="Log in"
      footerHref="/login"
    />
  );
}