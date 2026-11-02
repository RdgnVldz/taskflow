import Link from "next/link";
import { login } from "../actions";
import { AuthForm } from "../auth-form";

export default function LoginPage() {
  return (
    <>
      <AuthForm title="Log in" submitLabel="Log in" action={login} />
      <p className="text-center text-sm">
        No account yet?{" "}
        <Link href="/signup" className="underline">Sign up</Link>
      </p>
    </>
  );
}