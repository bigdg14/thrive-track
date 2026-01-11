"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, Award, Lock } from "lucide-react";
import Link from "next/link";

interface BadgeData {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  rarity: string;
  xpReward: number;
  earned: boolean;
  earnedAt?: string;
}

export default function BadgesPage() {
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      const res = await fetch("/api/gamification/badges");
      const data = await res.json();
      setBadges(data.allBadges || []);
    } catch (error) {
      console.error("Failed to fetch badges:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
      case "rare":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "epic":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "legendary":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const categories = ["all", "workout", "streak", "pr", "goal", "social"];
  const filteredBadges =
    selectedCategory === "all"
      ? badges
      : badges.filter((b) => b.category === selectedCategory);

  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/profile">
                <Button variant="ghost" size="icon">
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Award className="w-6 h-6 text-primary" />
                <h1 className="text-xl font-bold">All Badges</h1>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {earnedCount} / {badges.length} earned
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Progress Card */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Badge Collection</CardTitle>
            <CardDescription>
              Earn badges by completing workouts, reaching milestones, and achieving goals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm">
              <span>Collection Progress</span>
              <span className="font-medium">
                {badges.length > 0 ? Math.round((earnedCount / badges.length) * 100) : 0}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Category Filters */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="workout">Workout</TabsTrigger>
            <TabsTrigger value="streak">Streak</TabsTrigger>
            <TabsTrigger value="pr">PR</TabsTrigger>
            <TabsTrigger value="goal">Goal</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-6">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading badges...</div>
            ) : filteredBadges.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Award className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No badges in this category</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBadges.map((badge) => (
                  <Card
                    key={badge.id}
                    className={`bg-card border-border ${
                      badge.earned ? "" : "opacity-60"
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center gap-3 text-center">
                        <div className="relative">
                          <div
                            className={`text-6xl ${
                              badge.earned ? "" : "grayscale opacity-50"
                            }`}
                          >
                            {badge.icon}
                          </div>
                          {!badge.earned && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Lock className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        <div className="space-y-1">
                          <h3 className="font-bold text-lg">{badge.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {badge.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`text-xs ${getRarityColor(badge.rarity)}`}
                          >
                            {badge.rarity}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            +{badge.xpReward} XP
                          </Badge>
                        </div>

                        {badge.earned && badge.earnedAt && (
                          <p className="text-xs text-muted-foreground">
                            Earned {new Date(badge.earnedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
