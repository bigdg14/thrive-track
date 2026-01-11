"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, Activity, Users, Globe, Trophy, Target, Flame, Award } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  userId: string;
  activityType: string;
  description: string;
  metadata: any;
  createdAt: string;
  user: {
    id: string;
    name: string;
    image?: string;
  };
}

export default function ActivityFeedPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedType, setFeedType] = useState("friends");

  useEffect(() => {
    fetchActivityFeed(feedType);
  }, [feedType]);

  const fetchActivityFeed = async (type: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/social/feed?type=${type}&limit=50`);
      const data = await res.json();
      setActivities(data.activities || []);
    } catch (error) {
      console.error("Failed to fetch activity feed:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "workout_complete":
        return <Target className="w-5 h-5 text-blue-500" />;
      case "pr_set":
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case "goal_completed":
        return <Award className="w-5 h-5 text-green-500" />;
      case "challenge_completed":
        return <Trophy className="w-5 h-5 text-purple-500" />;
      case "challenge_joined":
        return <Users className="w-5 h-5 text-orange-500" />;
      case "friend_accepted":
        return <Users className="w-5 h-5 text-blue-500" />;
      case "streak_milestone":
        return <Flame className="w-5 h-5 text-orange-500" />;
      default:
        return <Activity className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "workout_complete":
        return "bg-blue-500/10";
      case "pr_set":
        return "bg-yellow-500/10";
      case "goal_completed":
        return "bg-green-500/10";
      case "challenge_completed":
        return "bg-purple-500/10";
      case "challenge_joined":
        return "bg-orange-500/10";
      case "friend_accepted":
        return "bg-blue-500/10";
      case "streak_milestone":
        return "bg-orange-500/10";
      default:
        return "bg-secondary/50";
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
                <Activity className="w-6 h-6 text-primary" />
                <h1 className="text-xl font-bold">Activity Feed</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Feed Type Tabs */}
        <Tabs value={feedType} onValueChange={setFeedType}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="friends">
              <Users className="w-4 h-4 mr-1" />
              Friends
            </TabsTrigger>
            <TabsTrigger value="personal">
              <Activity className="w-4 h-4 mr-1" />
              My Activity
            </TabsTrigger>
            <TabsTrigger value="global">
              <Globe className="w-4 h-4 mr-1" />
              Global
            </TabsTrigger>
          </TabsList>

          <TabsContent value={feedType} className="mt-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>
                  {feedType === "friends" && "Friends Activity"}
                  {feedType === "personal" && "Your Activity"}
                  {feedType === "global" && "Global Activity"}
                </CardTitle>
                <CardDescription>
                  {feedType === "friends" && "See what your friends are up to"}
                  {feedType === "personal" && "Your recent achievements and activities"}
                  {feedType === "global" && "Activity from all users"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Loading activity...
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No activity yet</p>
                    <p className="text-sm">
                      {feedType === "friends"
                        ? "Add friends to see their activity"
                        : "Start working out to see activity here!"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activities.map((activity) => (
                      <div
                        key={activity.id}
                        className={`flex items-start gap-4 p-4 rounded-lg border border-border ${getActivityColor(
                          activity.activityType
                        )}`}
                      >
                        <Avatar className="w-10 h-10 mt-1">
                          <AvatarImage src={activity.user.image} />
                          <AvatarFallback>
                            {activity.user.name?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{activity.user.name}</p>
                            <span className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(activity.createdAt), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-md bg-background">
                              {getActivityIcon(activity.activityType)}
                            </div>
                            <p className="text-sm">{activity.description}</p>
                          </div>

                          {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                            <div className="flex items-center gap-2 mt-2">
                              {activity.metadata.xpEarned && (
                                <Badge variant="outline" className="text-xs">
                                  +{activity.metadata.xpEarned} XP
                                </Badge>
                              )}
                              {activity.metadata.challengeName && (
                                <Badge variant="outline" className="text-xs">
                                  {activity.metadata.challengeName}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link href="/social/friends">
            <Card className="bg-card border-border hover:border-primary transition-colors cursor-pointer">
              <CardContent className="flex items-center gap-3 p-4">
                <Users className="w-8 h-8 text-primary" />
                <div>
                  <p className="font-medium">Friends</p>
                  <p className="text-sm text-muted-foreground">Manage connections</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/challenges">
            <Card className="bg-card border-border hover:border-primary transition-colors cursor-pointer">
              <CardContent className="flex items-center gap-3 p-4">
                <Trophy className="w-8 h-8 text-primary" />
                <div>
                  <p className="font-medium">Challenges</p>
                  <p className="text-sm text-muted-foreground">Join or create</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}
