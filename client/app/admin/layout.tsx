"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Users,
  LayoutGrid,
  Activity,
  Settings,
  LogOut,
  Shield,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.replace("/signin");
    }
  }, [user, router]);

  const nav = [
    { href: "/admin", label: "Dashboard", icon: LayoutGrid },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen grid grid-cols-12">
      <aside className="col-span-12 md:col-span-3 lg:col-span-2 border-r bg-muted/30">
        <div className="p-4 flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <span className="font-bold">Admin Panel</span>
        </div>
        <nav className="p-2 space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-muted ${
                pathname === item.href ? "bg-muted" : ""
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              logout();
              router.push("/");
            }}
          >
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </aside>
      <main className="col-span-12 md:col-span-9 lg:col-span-10">
        <div className="border-b p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              Welcome, {user?.name || "Admin"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Role: {user?.role || "admin"}
            </p>
          </div>
        </div>
        <div className="p-4">{children}</div>
      </main>
    </div>
  );
}
