"use client";

import { useActionState } from "react";
import type { FormState } from "./actions";

type Props = {
  title: string;
  submitLabel: string;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  showName?: boolean;
};

export function AuthForm({ title, submitLabel, action, showName }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form
      action={formAction}
      className="mx-auto mt-24 flex max-w-sm flex-col gap-4 p-4"
    >
      <h1 className="text-2xl font-bold">{title}</h1>

      {showName && (
        <input
          name="name"
          placeholder="Name"
          required
          className="rounded border bg-white p-2 text-black"
        />
      )}
      <input
        name="email"
        type="email"
        placeholder="Email"
        required
        className="rounded border bg-white p-2 text-black"
      />
      <input
        name="password"
        type="password"
        placeholder="Password"
        required
        className="rounded border bg-white p-2 text-black"
      />

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        disabled={pending}
        className="rounded bg-blue-600 p-2 text-white disabled:opacity-50"
      >
        {pending ? "Please wait..." : submitLabel}
      </button>
    </form>
  );
}