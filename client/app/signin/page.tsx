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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
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
    <div className="min-h-[calc(100vh-4rem)] grid md:grid-cols-2 overflow-hidden bg-center bg-cover bg-no-repeat" 
    style={{ backgroundImage: "url('/Component 3.png')" }}>
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
        className="hidden md:block relative "
      >
        <div className="absolute inset-0 flex items-center justify-center translate-x-10">
          <div className="text-lg text-muted-foreground p-8">
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-2xl font-bold text-black">SignLearn</span>
              <div className="w-[20%] flex-1 h-[2px] bg-[#043bb3]"></div>
            </div>
            <h2 className="text-4xl font-bold mb-4 text-black">Chào mừng đến với {""}
              <span style = {{color: "#043bb3"}}>SignLearn</span>
            </h2>
            <p className="text-lg text-black">
              Sứ mệnh của chúng tôi là hỗ trợ cộng đồng người khiếm thính bằng cách mang đến các công cụ học ngôn ngữ ký hiệu dễ tiếp cận và công nghệ dịch thuật tự động
            </p>
            <p className="text-right font-bold italic text-[#043bb3] mt-4 text-sm">"Caring for life, every step of the way"</p>
          </div>
        </div>
      </motion.div>
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
        className="flex items-center justify-center p-8 -translate-x-10"
      >
        <div className="w-full max-w-xs space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-black">Chào mừng bạn!</h1>
            <p className="text-muted-foreground mt-2">
              Vui lòng nhập thông tin của bạn tại đây.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Nhập email của bạn tại đây"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Nhập mật khẩu của bạn tại đây"
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
                  Nhớ tài khoản
                </label>
              </div>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-primary hover:underline"
              >
                Quên mật khẩu
              </Link>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              {"Bạn chưa có tài khoản? "}
              <Link
                href="/signup"
                className="font-medium text-primary hover:underline"
              >
                Đăng ký miễn phí
              </Link>
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
