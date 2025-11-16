"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminUserDetailsPage() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!authLoading) {
      if (!currentUser) {
        router.push("/signin");
        return;
      }
      if (currentUser.role !== "admin") {
        router.push("/");
        return;
      }
      loadUser();
      loadActivities();
    }
  }, [userId, currentUser, authLoading, page]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const response = await apiService.admin.getUserById(userId);
      setUser(response.data.user);
    } catch (error: any) {
      console.error("Error loading user:", error);
      toast({
        title: "Error",
        description: "Failed to load user details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadActivities = async () => {
    try {
      setActivitiesLoading(true);
      const response = await apiService.admin.getUserActivities(userId, {
        page,
        limit: 20,
      });
      setActivities(response.data.activities || []);
    } catch (error: any) {
      console.error("Error loading activities:", error);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!confirm(`Are you sure you want to delete user "${user?.name}"?`)) {
      return;
    }

    try {
      await apiService.admin.deleteUser(userId);
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      router.push("/admin/users");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser || currentUser.role !== "admin" || !user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => router.push("/admin/users")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>
        <h1 className="text-4xl font-bold text-primary mb-2">User Details</h1>
        <p className="text-muted-foreground">{user.name}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-semibold">{user.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-semibold">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <span
                className={`inline-block px-2 py-1 rounded text-xs ${
                  user.role === "admin"
                    ? "bg-purple-100 text-purple-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {user.role}
              </span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <span
                className={`inline-block px-2 py-1 rounded text-xs ${
                  user.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {user.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created At</p>
              <p className="font-semibold">
                {new Date(user.createdAt).toLocaleString()}
              </p>
            </div>
            {user.lastLoginAt && (
              <div>
                <p className="text-sm text-muted-foreground">Last Login</p>
                <p className="font-semibold">
                  {new Date(user.lastLoginAt).toLocaleString()}
                </p>
              </div>
            )}
            {user._id !== currentUser._id && (
              <Button variant="destructive" onClick={handleDeleteUser}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete User
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Profile Stats */}
        {user.profile && (
          <Card>
            <CardHeader>
              <CardTitle>Profile Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Score</p>
                <p className="text-2xl font-bold text-primary">
                  {user.profile.totalScore || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Games Played</p>
                <p className="text-2xl font-bold">
                  {user.profile.totalGamesPlayed || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Accuracy Rate</p>
                <p className="text-2xl font-bold">
                  {user.profile.accuracyRate || 0}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Streak</p>
                <p className="text-2xl font-bold">
                  {user.profile.currentStreak || 0} days
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Level & Rank</p>
                <p className="text-xl font-bold">
                  Level {user.profile.level || 1} • {user.profile.rank || "bronze"}
                </p>
              </div>
              {user.stats && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Game Sessions</p>
                    <p className="text-lg font-semibold">{user.stats.gameSessions || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Translations</p>
                    <p className="text-lg font-semibold">{user.stats.translations || 0}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Activities */}
      <Card>
        <CardHeader>
          <CardTitle>User Activities</CardTitle>
        </CardHeader>
        <CardContent>
          {activitiesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : activities.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No activities found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                          {activity.action}
                        </span>
                      </TableCell>
                      <TableCell>
                        {activity.details && typeof activity.details === "object" ? (
                          <pre className="text-xs">
                            {JSON.stringify(activity.details, null, 2)}
                          </pre>
                        ) : (
                          <span className="text-sm">{activity.details || "-"}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {activity.ipAddress || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(activity.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

