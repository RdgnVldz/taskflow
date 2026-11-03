"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, destroySession } from "@/lib/session";

export type FormState = { error?: string } | undefined;

const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().toLowerCase().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export async function signup(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { name, email, password } = parsed.data;

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (existing) return { error: "Email is already registered" };

  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db
    .insert(users)
    .values({ name, email, passwordHash })
    .returning({ id: users.id });

  await createSession(user.id);
  redirect("/dashboard");
}

export async function login(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid email or password" };

  const { email, password } = parsed.data;

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !valid) return { error: "Invalid email or password" };

  await createSession(user.id);
  redirect("/dashboard");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}