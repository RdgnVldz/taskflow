"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { FormState } from "./actions";
import { useSearchParams } from "next/navigation";

type Props = {
  title: string;
  description: string;
  submitLabel: string;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  showName?: boolean;
  footerText: string;
  footerLinkLabel: string;
  footerHref: string;
};

export function AuthForm({
  title,
  description,
  submitLabel,
  action,
  showName,
  footerText,
  footerLinkLabel,
  footerHref,
}: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);

  const next = useSearchParams().get("next");
  const footerLink = next
  ? `${footerHref}?next=${encodeURIComponent(next)}`
  : footerHref;


  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <form action={formAction}>
        <input type="hidden" name="next" value={next ?? ""} />
        <CardContent className="grid gap-4">
          {showName && (
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Your name"
                autoComplete="name"
                required
              />
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={showName ? "new-password" : "current-password"}
              required
            />
          </div>

          {state?.error && (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          )}
        </CardContent>

        <CardFooter className="mt-6 flex-col gap-4">
          <Button type="submit" variant="outline" className="w-full " disabled={pending}>
            {pending && <Loader2 className="animate-spin" />}
            {pending ? "Please wait..." : submitLabel}
          </Button>
          <p className="text-sm text-muted-foreground">
            {footerText}{" "}
            <Link
              href={footerLink}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {footerLinkLabel}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}