"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, Trophy, Lock, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AchievementsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlockedCount, setUnlockedCount] = useState(0);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/signin");
        return;
      }
      loadAchievements();
    }
  }, [user, authLoading, router]);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const response = await apiService.profile.getAchievements();
      setAchievements(response.data.achievements || []);
      setUnlockedCount(response.data.unlockedCount || 0);
    } catch (error: any) {
      console.error("Error loading achievements:", error);
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

  const groupedAchievements = achievements.reduce(
    (acc: any, achievement: any) => {
      const category = achievement.category || "other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(achievement);
      return acc;
    },
    {}
  );

  const categoryNames: Record<string, string> = {
    score: "Score Achievements",
    streak: "Streak Achievements",
    accuracy: "Accuracy Achievements",
    games: "Game Count Achievements",
    category: "Category Achievements",
    other: "Other Achievements",
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <Link href="/profile">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại hồ sơ
          </Button>
        </Link>
        <h1 className="text-4xl font-bold text-primary mb-2">Thành tích</h1>
        <p className="text-muted-foreground">
          {unlockedCount} trong số {achievements.length} thành tích đã mở khóa
        </p>
      </div>

      {/* Progress Bar */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Quá trình</span>
              <span className="text-muted-foreground">
                {Math.round((unlockedCount / achievements.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div
                className="bg-primary h-3 rounded-full transition-all"
                style={{
                  width: `${(unlockedCount / achievements.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements by Category */}
      {Object.entries(groupedAchievements).map(
        ([category, categoryAchievements]: [string, any]) => (
          <Card key={category} className="mb-6">
            <CardHeader>
              <CardTitle>{categoryNames[category] || category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryAchievements.map((achievement: any) => (
                  <div
                    key={achievement._id}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      achievement.unlocked
                        ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20"
                        : "border-muted bg-muted/50 opacity-60"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          achievement.unlocked
                            ? "bg-yellow-100 dark:bg-yellow-900/40"
                            : "bg-muted"
                        }`}
                      >
                        {achievement.unlocked ? (
                          <Trophy className="h-6 w-6 text-yellow-600" />
                        ) : (
                          <Lock className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">
                          {achievement.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {achievement.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            Threshold: {achievement.threshold}
                          </span>
                          {achievement.points > 0 && (
                            <span className="text-xs font-medium text-green-600">
                              +{achievement.points} pts
                            </span>
                          )}
                        </div>
                        {achievement.unlocked && achievement.unlockedAt && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Unlocked:{" "}
                            {new Date(
                              achievement.unlockedAt
                            ).toLocaleDateString()}
                          </p>
                        )}
                        {!achievement.unlocked && achievement.progress > 0 && (
                          <div className="mt-2">
                            <div className="w-full bg-muted rounded-full h-1.5">
                              <div
                                className="bg-primary h-1.5 rounded-full"
                                style={{ width: `${achievement.progress}%` }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {achievement.progress}% complete
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}
