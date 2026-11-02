import { redirect } from "next/navigation";
import { getCurrentUser } from "@/src/lib/session";
import { logout } from "@/src/app/(auth)/actions";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto mt-24 max-w-xl p-4">
      <h1 className="text-2xl font-bold">Welcome, {user.name}</h1>
      <p>{user.email}</p>
      <form action={logout} className="mt-4">
        <button className="rounded border px-3 py-2">Log out</button>
      </form>
    </main>
  );
}