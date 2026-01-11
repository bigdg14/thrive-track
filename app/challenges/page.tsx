"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, Trophy, Users, Calendar, Target, Plus } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { format } from "date-fns";

interface Challenge {
  id: string;
  name: string;
  description: string;
  challengeType: string;
  goal: number;
  startDate: string;
  endDate: string;
  visibility: string;
  status: string;
  createdAt: string;
  creator: {
    id: string;
    name: string;
    image?: string;
  };
  participants: {
    id: string;
    progress: number;
    user: {
      id: string;
      name: string;
      image?: string;
    };
  }[];
  _count: {
    participants: number;
  };
  isParticipating: boolean;
  userProgress: number;
}

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("active");

  useEffect(() => {
    fetchChallenges(filter);
  }, [filter]);

  const fetchChallenges = async (filterType: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/challenges?filter=${filterType}`);
      const data = await res.json();
      setChallenges(data.challenges || []);
    } catch (error) {
      console.error("Failed to fetch challenges:", error);
      toast.error("Failed to load challenges");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinChallenge = async (challengeId: string) => {
    try {
      const res = await fetch(`/api/challenges/${challengeId}/join`, {
        method: "POST",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to join challenge");
      }

      toast.success("Successfully joined challenge!");
      fetchChallenges(filter);
    } catch (error: any) {
      toast.error(error.message || "Failed to join challenge");
    }
  };

  const handleLeaveChallenge = async (challengeId: string) => {
    if (!confirm("Are you sure you want to leave this challenge?")) return;

    try {
      const res = await fetch(`/api/challenges/${challengeId}/join`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to leave challenge");

      toast.success("Left challenge");
      fetchChallenges(filter);
    } catch (error) {
      toast.error("Failed to leave challenge");
    }
  };

  const getChallengeTypeLabel = (type: string) => {
    switch (type) {
      case "total_workouts":
        return "Total Workouts";
      case "total_weight":
        return "Total Weight Lifted";
      case "streak_days":
        return "Workout Streak";
      case "specific_exercise":
        return "Specific Exercise";
      default:
        return type;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-primary" />
                <h1 className="text-xl font-bold">Challenges</h1>
              </div>
            </div>
            <Link href="/challenges/create">
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Create
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Tabs */}
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="my-challenges">My Challenges</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-6 space-y-4">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading challenges...
              </div>
            ) : challenges.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Trophy className="w-12 h-12 mb-2 opacity-50" />
                  <p>No {filter} challenges</p>
                  <p className="text-sm">
                    {filter === "active" && "Check back later for new challenges"}
                    {filter === "my-challenges" && "Join a challenge to get started"}
                    {filter === "completed" && "Complete challenges to see them here"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              challenges.map((challenge) => {
                const progressPercent = (challenge.userProgress / challenge.goal) * 100;
                const isActive = new Date() <= new Date(challenge.endDate);

                return (
                  <Card key={challenge.id} className="bg-card border-border">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle>{challenge.name}</CardTitle>
                            {challenge.isParticipating && (
                              <Badge variant="default" className="text-xs">
                                Joined
                              </Badge>
                            )}
                          </div>
                          <CardDescription>{challenge.description}</CardDescription>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm mt-4">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-muted-foreground" />
                          <span>{getChallengeTypeLabel(challenge.challengeType)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span>{challenge._count.participants} participants</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>
                            {format(new Date(challenge.startDate), "MMM d")} -{" "}
                            {format(new Date(challenge.endDate), "MMM d")}
                          </span>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Challenge Creator */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Created by</span>
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={challenge.creator.image} />
                          <AvatarFallback>
                            {challenge.creator.name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{challenge.creator.name}</span>
                      </div>

                      {/* User Progress (if participating) */}
                      {challenge.isParticipating && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Your Progress</span>
                            <span className="font-medium">
                              {challenge.userProgress} / {challenge.goal}
                            </span>
                          </div>
                          <Progress value={progressPercent} className="h-2" />
                        </div>
                      )}

                      {/* Leaderboard Preview */}
                      {challenge.participants.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Top Participants</p>
                          <div className="space-y-1">
                            {challenge.participants.slice(0, 3).map((participant, idx) => (
                              <div
                                key={participant.id}
                                className="flex items-center justify-between p-2 bg-secondary/50 rounded text-sm"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-muted-foreground font-medium">
                                    #{idx + 1}
                                  </span>
                                  <Avatar className="w-6 h-6">
                                    <AvatarImage src={participant.user.image} />
                                    <AvatarFallback>
                                      {participant.user.name?.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{participant.user.name}</span>
                                </div>
                                <span className="font-medium">{participant.progress}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {challenge.isParticipating ? (
                          <>
                            <Link href={`/challenges/${challenge.id}`} className="flex-1">
                              <Button variant="default" className="w-full">
                                View Details
                              </Button>
                            </Link>
                            {isActive && (
                              <Button
                                variant="outline"
                                onClick={() => handleLeaveChallenge(challenge.id)}
                              >
                                Leave
                              </Button>
                            )}
                          </>
                        ) : (
                          <>
                            <Link href={`/challenges/${challenge.id}`} className="flex-1">
                              <Button variant="outline" className="w-full">
                                View Details
                              </Button>
                            </Link>
                            {isActive && (
                              <Button
                                variant="default"
                                onClick={() => handleJoinChallenge(challenge.id)}
                              >
                                Join Challenge
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
