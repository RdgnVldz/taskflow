import Link from "next/link";
import { signup } from "../actions";
import { AuthForm } from "../auth-form";

export default function SignupPage() {
  return (
    <>
      <AuthForm title="Create account" submitLabel="Sign up" action={signup} showName />
      <p className="text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="underline">Log in</Link>
      </p>
    </>
  );
}