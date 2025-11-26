"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { UserNav } from "@/components/user-nav";
import { ThemeToggle } from "@/components/theme-toggle";

export function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role === "admin" && pathname && !pathname.startsWith("/admin")) {
      router.replace("/admin");
    }
  }, [user, pathname, router]);

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/dictionary", label: "Dictionary" },
    { href: "/translator", label: "Translator" },
    { href: "/game", label: "Practice Game" },
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact" },
  ];

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary" />
              <span className="text-xl font-bold">SignLearn</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === item.href
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Auth Buttons / User Menu + Theme Toggle */}
          <div className="hidden md:flex items-center gap-2 relative z-[60]">
            <ThemeToggle />
            {!loading && (
              <>
                {user ? (
                  <UserNav />
                ) : (
                  <>
                    <Link href="/signin">
                      <Button
                        variant={pathname === "/signin" ? "default" : "ghost"}
                        className="transition-all duration-300"
                      >
                        Đăng nhập
                      </Button>
                    </Link>
                    <Link href="/signup">
                      <Button
                        variant={pathname === "/signup" ? "default" : "ghost"}
                        className="transition-all duration-300"
                      >
                        Đăng ký
                      </Button>
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button + Theme Toggle */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block py-2 text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-4">
              {/* Theme Toggle for Mobile */}
              <div className="md:hidden pb-2 border-b">
                <div className="flex items-center justify-between px-2">
                  <span className="text-sm font-medium">Theme</span>
                  <ThemeToggle />
                </div>
              </div>
              {user ? (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button variant="ghost" className="w-full">
                      Hồ sơ
                    </Button>
                  </Link>
                  <Link
                    href="/profile/settings"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button variant="ghost" className="w-full">
                      Cài đặt
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                      router.push("/");
                    }}
                  >
                    Đăng xuất
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/signin">
                    <Button variant="ghost" className="w-full">
                      Đăng nhập
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button className="w-full">Đăng ký</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
