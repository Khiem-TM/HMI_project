"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User,
  Mail,
  Shield,
  Calendar,
  Settings,
  Trophy,
  TrendingUp,
  Award,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { apiService } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/signin");
    } else if (user) {
      loadProfile();
    }
  }, [user, loading, router]);

  const loadProfile = async () => {
    try {
      setProfileLoading(true);
      const response = await apiService.profile.getProfile();
      setProfile(response.data.user);
    } catch (error: any) {
      console.error("Error loading profile:", error);
    } finally {
      setProfileLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang tải hồ sơ...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2">Hồ sơ của tôi</h1>
        <p className="text-muted-foreground">
          Xem và quản lý thông tin cá nhân của bạn
        </p>
      </div>

      <div className="grid gap-6">
        {/* Profile Header Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`}
                  alt={user.name}
                />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold mb-1">{user.name}</h2>
                <p className="text-muted-foreground mb-4">{user.email}</p>
                <Link href="/profile/settings">
                  <Button>
                    <Settings className="mr-2 h-4 w-4" />
                    Chỉnh sửa hồ sơ
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thông tin tài khoản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
              <User className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Họ và tên</p>
                <p className="text-sm text-muted-foreground">{user.name}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
              <Mail className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Email</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
              <Shield className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Vai trò</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {user.role}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
              <Calendar className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Tham gia từ</p>
                <p className="text-sm text-muted-foreground">
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        {profileLoading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            </CardContent>
          </Card>
        ) : profile?.profile ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Tiến trình học tập</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-primary/10">
                    <p className="text-2xl font-bold text-primary">
                      {profile.profile.totalScore || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Tổng điểm</p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/20">
                    <p className="text-2xl font-bold text-secondary-foreground">
                      {profile.profile.totalGamesPlayed || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Số trò chơi đã chơi
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/20">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {profile.profile.accuracyRate || 0}%
                    </p>
                    <p className="text-xs text-muted-foreground">Độ chính xác</p>
                  </div>
                  <div className="p-4 rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {profile.profile.currentStreak || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Chuỗi ngày</p>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Cấp độ & Hạng
                      </p>
                      <p className="text-xl font-bold">
                        Cấp độ {profile.profile.level || 1} •{" "}
                        <span className="capitalize">
                          {profile.profile.rank || "bronze"}
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        Chuỗi dài nhất
                      </p>
                      <p className="text-xl font-bold">
                        {profile.profile.longestStreak || 0} ngày
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/profile/achievements">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Award className="h-8 w-8 text-yellow-600" />
                      <div>
                        <p className="font-semibold">Thành tích</p>
                        <p className="text-sm text-muted-foreground">
                          Xem huy hiệu của bạn
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/profile/stats">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="font-semibold">Thống kê chi tiết</p>
                        <p className="text-sm text-muted-foreground">
                          Xem phân tích
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Bắt đầu chơi trò chơi để xem tiến trình của bạn!
                </p>
                <Link href="/game">
                  <Button>Bắt đầu chơi</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
