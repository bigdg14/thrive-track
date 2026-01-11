"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, Trophy } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function CreateChallengePage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    challengeType: "total_workouts",
    goal: "",
    startDate: "",
    endDate: "",
    visibility: "public",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      // Validate dates
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);

      if (end <= start) {
        toast.error("End date must be after start date");
        setIsCreating(false);
        return;
      }

      if (start < new Date()) {
        toast.error("Start date must be in the future");
        setIsCreating(false);
        return;
      }

      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          goal: parseInt(formData.goal),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create challenge");
      }

      const data = await res.json();
      toast.success("Challenge created successfully!");
      router.push(`/challenges/${data.challenge.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create challenge");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/challenges">
                <Button variant="ghost" size="icon">
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-primary" />
                <h1 className="text-xl font-bold">Create Challenge</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>New Challenge</CardTitle>
            <CardDescription>
              Create a fitness challenge to compete with friends and the community
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Challenge Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Challenge Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., 30-Day Workout Challenge"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this challenge is about..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Challenge Type */}
              <div className="space-y-2">
                <Label htmlFor="challengeType">Challenge Type *</Label>
                <Select
                  value={formData.challengeType}
                  onValueChange={(value) => setFormData({ ...formData, challengeType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="total_workouts">Total Workouts</SelectItem>
                    <SelectItem value="total_weight">Total Weight Lifted (kg)</SelectItem>
                    <SelectItem value="streak_days">Workout Streak (days)</SelectItem>
                    <SelectItem value="specific_exercise">Specific Exercise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Goal */}
              <div className="space-y-2">
                <Label htmlFor="goal">Goal Target *</Label>
                <Input
                  id="goal"
                  type="number"
                  placeholder="e.g., 30"
                  value={formData.goal}
                  onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                  required
                  min="1"
                />
                <p className="text-sm text-muted-foreground">
                  {formData.challengeType === "total_workouts" && "Number of workouts to complete"}
                  {formData.challengeType === "total_weight" && "Total kilograms to lift"}
                  {formData.challengeType === "streak_days" && "Number of consecutive workout days"}
                  {formData.challengeType === "specific_exercise" && "Number of reps/sets"}
                </p>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Visibility */}
              <div className="space-y-2">
                <Label htmlFor="visibility">Visibility *</Label>
                <Select
                  value={formData.visibility}
                  onValueChange={(value) => setFormData({ ...formData, visibility: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public - Anyone can join</SelectItem>
                    <SelectItem value="friends">Friends Only</SelectItem>
                    <SelectItem value="private">Private - Invite only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <Link href="/challenges" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={isCreating} className="flex-1">
                  {isCreating ? "Creating..." : "Create Challenge"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
