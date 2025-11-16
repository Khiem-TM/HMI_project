"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/signin");
      return;
    }
    if (user.role !== "admin") {
      router.push("/");
    }
  }, [user]);

  if (!user || user.role !== "admin") return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2">Admin Settings</h1>
        <p className="text-muted-foreground">System configurations and admin options</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Site Title</Label>
              <Input placeholder="SignLearn" defaultValue="SignLearn" />
            </div>
            <div>
              <Label>Support Email</Label>
              <Input placeholder="support@example.com" />
            </div>
            <Button disabled>Save (placeholder)</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>JWT Expiration</Label>
              <Input placeholder="7d" defaultValue="7d" />
            </div>
            <div>
              <Label>Allowed Origins</Label>
              <Input placeholder="http://localhost:3001" defaultValue="http://localhost:3001" />
            </div>
            <Button disabled>Save (placeholder)</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}