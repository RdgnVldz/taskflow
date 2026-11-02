import { LayoutDashboard } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-linear-to-b from-primary/10 via-background to-background p-4">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <LayoutDashboard className="size-5" />
        TaskFlow
      </div>
      {children}
    </main>
  );
}
