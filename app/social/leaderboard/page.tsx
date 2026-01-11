"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, Trophy, Medal, Crown, TrendingUp, Flame, Target } from "lucide-react";
import Link from "next/link";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  image?: string;
  level: number;
  totalXP: number;
  workoutCount: number;
  streakDays: number;
  prCount: number;
  isCurrentUser: boolean;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState("xp");

  useEffect(() => {
    fetchLeaderboard(selectedType);
  }, [selectedType]);

  const fetchLeaderboard = async (type: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/gamification/leaderboard?type=${type}&limit=50`);
      const data = await res.json();
      setLeaderboard(data.leaderboard || []);
      setUserRank(data.userRank || 0);
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getValueForType = (entry: LeaderboardEntry) => {
    switch (selectedType) {
      case "xp":
        return `${entry.totalXP.toLocaleString()} XP`;
      case "workouts":
        return `${entry.workoutCount} workouts`;
      case "streak":
        return `${entry.streakDays} days`;
      case "prs":
        return `${entry.prCount} PRs`;
      default:
        return entry.totalXP.toLocaleString();
    }
  };

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
                <Trophy className="w-6 h-6 text-primary" />
                <h1 className="text-xl font-bold">Leaderboard</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* User Rank Card */}
        {userRank > 0 && (
          <Card className="bg-card border-border border-primary">
            <CardHeader>
              <CardTitle>Your Ranking</CardTitle>
              <CardDescription>See where you stand</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getRankIcon(userRank)}
                  <div>
                    <p className="font-medium">Rank #{userRank}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedType === "xp" && "Total XP"}
                      {selectedType === "workouts" && "Workouts Completed"}
                      {selectedType === "streak" && "Current Streak"}
                      {selectedType === "prs" && "Personal Records"}
                    </p>
                  </div>
                </div>
                <Trophy className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leaderboard Type Tabs */}
        <Tabs value={selectedType} onValueChange={setSelectedType}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="xp">
              <TrendingUp className="w-4 h-4 mr-1" />
              XP
            </TabsTrigger>
            <TabsTrigger value="workouts">
              <Target className="w-4 h-4 mr-1" />
              Workouts
            </TabsTrigger>
            <TabsTrigger value="streak">
              <Flame className="w-4 h-4 mr-1" />
              Streak
            </TabsTrigger>
            <TabsTrigger value="prs">
              <Trophy className="w-4 h-4 mr-1" />
              PRs
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedType} className="mt-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Top 50</CardTitle>
                <CardDescription>
                  The best performers in{" "}
                  {selectedType === "xp" && "total XP"}
                  {selectedType === "workouts" && "workout count"}
                  {selectedType === "streak" && "current streak"}
                  {selectedType === "prs" && "personal records"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Loading leaderboard...
                  </div>
                ) : leaderboard.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No data available</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {leaderboard.map((entry) => (
                      <div
                        key={entry.userId}
                        className={`flex items-center justify-between p-4 rounded-lg border ${
                          entry.isCurrentUser
                            ? "bg-primary/10 border-primary"
                            : "bg-secondary/50 border-border"
                        }`}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-10 flex items-center justify-center">
                            {getRankIcon(entry.rank)}
                          </div>

                          <Avatar className="w-10 h-10">
                            <AvatarImage src={entry.image} />
                            <AvatarFallback>
                              {entry.name?.charAt(0).toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{entry.name}</p>
                              {entry.isCurrentUser && (
                                <Badge variant="default" className="text-xs">
                                  You
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Level {entry.level}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-bold text-lg">{getValueForType(entry)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
