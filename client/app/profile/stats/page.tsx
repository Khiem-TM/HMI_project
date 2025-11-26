"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  Target,
  Award,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import Link from "next/link";

export default function ProfileStatsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("all");

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/signin");
        return;
      }
      loadStats();
    }
  }, [user, authLoading, router, period]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await apiService.profile.getStats({ period });
      setStats(response.data.stats);
    } catch (error: any) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <Link href="/profile">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại hồ sơ
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">Thống kê</h1>
            <p className="text-muted-foreground">
              Chi tiết thông kê quá trình học của bạn
            </p>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="year">Năm này</SelectItem>
              <SelectItem value="month">Tháng này</SelectItem>
              <SelectItem value="week">Tuần này</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {stats && (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Tổng điểm
                </CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.overview?.totalScore || 0}
                </div>
                <p className="text-xs text-muted-foreground">Points earned</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Game đã chơi
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.overview?.totalGamesPlayed || 0}
                </div>
                <p className="text-xs text-muted-foreground">Tổng số lượt</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Độ chính xác</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.overview?.accuracyRate || 0}%
                </div>
                <p className="text-xs text-muted-foreground">Số lượt trả lời đúng</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Số lượt streak
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.overview?.currentStreak || 0}
                </div>
                <p className="text-xs text-muted-foreground">Days in a row</p>
              </CardContent>
            </Card>
          </div>

          {stats.byCategory && Object.keys(stats.byCategory).length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Stats by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(stats.byCategory).map(
                    ([category, catStats]: [string, any]) => (
                      <div key={category} className="p-4 border rounded-lg">
                        <h3 className="font-semibold mb-3 capitalize">
                          {category}
                        </h3>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Games</p>
                            <p className="font-bold">
                              {catStats.gamesPlayed || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Correct</p>
                            <p className="font-bold text-green-600">
                              {catStats.correctAnswers || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Wrong</p>
                            <p className="font-bold text-red-600">
                              {catStats.wrongAnswers || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Score</p>
                            <p className="font-bold">{catStats.score || 0}</p>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {stats.byDifficulty && Object.keys(stats.byDifficulty).length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Stats by Difficulty</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(stats.byDifficulty).map(
                    ([difficulty, diffStats]: [string, any]) => (
                      <div key={difficulty} className="p-4 border rounded-lg">
                        <h3 className="font-semibold mb-3 capitalize">
                          {difficulty}
                        </h3>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Games</p>
                            <p className="font-bold">
                              {diffStats.gamesPlayed || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Correct</p>
                            <p className="font-bold text-green-600">
                              {diffStats.correctAnswers || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Wrong</p>
                            <p className="font-bold text-red-600">
                              {diffStats.wrongAnswers || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Score</p>
                            <p className="font-bold">{diffStats.score || 0}</p>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {stats.timeline && stats.timeline.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Performance Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.timeline.slice(-10).map((item: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {new Date(item.date).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {item.gameMode}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{item.score} pts</p>
                        <p className="text-xs text-muted-foreground">
                          {item.accuracy}% accuracy
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
