"use client";

import type React from "react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

import { signInWithGooglePopup } from "@/lib/firebase";
import { apiService } from "@/lib/api";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login, user } = useAuth();

  useEffect(() => {
    if (user) {
      if (user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    }
  }, [user, router]);

  //GOOGLE LOGIN
  const handleGoogleLogin = async () => {
    try {
      setError("");
      setLoading(true);

      // A. Mở Popup Google
      const googleUser = await signInWithGooglePopup();
      if (!googleUser.email) throw new Error("Không lấy được email từ Google");

      // B. Gọi API Backend
      const res = await apiService.auth.googleLogin({
        email: googleUser.email,
        name: googleUser.displayName || "User",
        googleId: googleUser.uid,
        avatar: googleUser.photoURL || "",
      });

      // C. Lưu Token
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      // D. Chuyển hướng thông minh (Admin về /admin, User về /)
      if (res.data.user.role === "admin") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/";
      }

    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Lỗi đăng nhập với Google");
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      // Logic check role sau khi login thường
      try {
        const savedUser = localStorage.getItem("user");
        const parsed = savedUser ? JSON.parse(savedUser) : null;
        if (parsed?.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/");
        }
      } catch {
        router.push("/");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="min-h-[calc(100vh-4rem)] grid md:grid-cols-2 overflow-hidden">
        <motion.div
            key="signin-form"
            initial={{ opacity: 0, x: -80, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -80, scale: 0.95 }}
            transition={{
              duration: 0.5,
              ease: [0.43, 0.13, 0.23, 0.96],
              opacity: { duration: 0.3 },
            }}
            className="flex items-center justify-center p-8"
        >
          <div className="w-full max-w-md space-y-8">
            <div>
              <h1 className="text-3xl font-bold">Welcome back</h1>
              <p className="text-muted-foreground mt-2">
                Welcome back! Please enter your details.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* 3. THÊM NÚT GOOGLE VÀO ĐÂY */}
              <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={handleGoogleLogin}
                  disabled={loading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </Button>

              {/* 4. THÊM ĐƯỜNG KẺ "OR" */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  or
                </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                      id="remember"
                      checked={remember}
                      onCheckedChange={(checked) => setRemember(checked as boolean)}
                  />
                  <label
                      htmlFor="remember"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Remember for 30 days
                  </label>
                </div>
                <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-primary hover:underline"
                >
                  Forgot password
                </Link>
              </div>

              {error && (
                  <div className="text-red-500 text-sm text-center">{error}</div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Đang đăng nhập..." : "Log in"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                {"Don't have an account? "}
                <Link
                    href="/signup"
                    className="font-medium text-primary hover:underline"
                >
                  Sign up for free
                </Link>
              </p>
            </form>
          </div>
        </motion.div>

        <motion.div
            key="signin-image"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{
              duration: 0.6,
              ease: [0.43, 0.13, 0.23, 0.96],
              delay: 0.1,
            }}
            className="hidden md:block relative bg-muted"
        >
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <div className="text-center text-muted-foreground p-8">
              <h2 className="text-3xl font-bold mb-4">Learn Sign Language</h2>
              <p className="text-lg">
                Connect with the deaf community through visual communication
              </p>
            </div>
          </div>
        </motion.div>
      </div>
  );
}