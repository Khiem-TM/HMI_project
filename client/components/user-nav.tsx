"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { User, LogOut } from "lucide-react";

export function UserNav() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;

  const handleProfile = () => {
    console.log("Opening profile settings");
    router.push("/profile/settings");
  };

  const handleLogout = () => {
    console.log("Logging out");
    if (confirm("Are you sure you want to log out?")) {
      logout();
      router.push("/");
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Profile Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleProfile}
        className="flex items-center gap-2"
      >
        <User className="h-4 w-4" />
        <span className="hidden sm:inline">Hồ sơ</span>
      </Button>

      {/* Logout Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLogout}
        className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">Đăng xuất</span>
      </Button>
    </div>
  );
}
