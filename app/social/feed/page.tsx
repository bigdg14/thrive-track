"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
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
  const [composerText, setComposerText] = useState("");
  const [composerVisibility, setComposerVisibility] = useState<"friends" | "public">("friends");
  const [posting, setPosting] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [me, setMe] = useState<{ name?: string | null; image?: string | null } | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [lastFailedPosts, setLastFailedPosts] = useState<Record<string, any>>({});
  const deleteTimersRef = useRef<Record<string, number>>({});

  useEffect(() => {
    fetchActivityFeed(feedType);
  }, [feedType]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/user/profile`);
        const data = await res.json();
        setMe(data.user || null);
      } catch (err) {
        console.error("Failed to fetch profile", err);
      }
    })();
  }, []);

  const initials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

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

  const scheduleDelete = (id: string) => {
    if (deleteTimersRef.current[id]) return; // already scheduled

    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/social/feed/${id}`, { method: "DELETE" });
        if (!res.ok) {
          toast.error("Unable to remove post");
          return;
        }
        setActivities((prev) => prev.filter((a) => a.id !== id));
        toast.success("Post removed");
      } catch (err) {
        console.error("Failed to delete activity:", err);
        toast.error("Unable to remove post");
      } finally {
        delete deleteTimersRef.current[id];
      }
    }, 8000);

    deleteTimersRef.current[id] = timer as unknown as number;

    toast("Post will be removed", {
      action: {
        label: "Undo",
        onClick: () => cancelScheduledDelete(id),
      },
    });
  };

  const cancelScheduledDelete = (id: string) => {
    const timer = deleteTimersRef.current[id];
    if (!timer) return;
    clearTimeout(timer as unknown as number);
    delete deleteTimersRef.current[id];
    toast.success("Removal cancelled");
  };

  useEffect(() => {
    return () => {
      Object.values(deleteTimersRef.current).forEach((t) => clearTimeout(t as unknown as number));
    };
  }, []);

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
                {/* Composer toggle */}
                <div className="mb-4">
                  {!showComposer ? (
                    <div className="flex justify-end">
                      <Button variant="ghost" onClick={() => setShowComposer(true)}>
                        Add new post
                      </Button>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <div className="flex gap-3">
                        <Avatar className="w-10 h-10 mt-1">
                          {me?.image ? <AvatarImage src={me.image} /> : <AvatarFallback>{initials(me?.name)}</AvatarFallback>}
                        </Avatar>
                        <div className="flex-1">
                          <textarea
                            className="w-full resize-none p-3 rounded-md bg-background border border-border"
                            rows={3}
                            placeholder="Share something with your friends..."
                            value={composerText}
                            onChange={(e) => setComposerText(e.target.value)}
                          />

                          <div className="mt-2 flex items-center gap-2">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const f = e.target.files?.[0] ?? null;
                                setAttachmentFile(f);
                                if (f) {
                                  const url = URL.createObjectURL(f);
                                  setAttachmentPreview(url);
                                  // also read as data URL for sending
                                  const reader = new FileReader();
                                  reader.onload = () => {
                                    setAttachmentPreview(reader.result as string);
                                  };
                                  reader.readAsDataURL(f);
                                } else {
                                  setAttachmentPreview(null);
                                }
                              }}
                            />
                            {attachmentPreview && (
                              <div className="w-20 h-20 rounded overflow-hidden border border-border">
                                <img src={attachmentPreview} alt="preview" className="w-full h-full object-cover" />
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                              <select
                                value={composerVisibility}
                                onChange={(e) => setComposerVisibility(e.target.value as any)}
                                className="bg-transparent border border-border rounded px-2 py-1"
                              >
                                <option value="friends">Friends</option>
                                <option value="public">Public</option>
                              </select>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button variant="outline" onClick={() => { setShowComposer(false); setComposerText(""); }} disabled={posting}>
                                Cancel
                              </Button>
                              <Button
                                onClick={async () => {
                                  if (!composerText.trim()) return;
                                  setPosting(true);

                                  // optimistic entry
                                  const tempId = `temp-${Date.now()}`;
                                    const tempEntry: ActivityItem = {
                                    id: tempId,
                                    userId: "me",
                                    activityType: "user_post",
                                    description: composerText,
                                    metadata: {},
                                    createdAt: new Date().toISOString(),
                                    user: { id: "me", name: me?.name ?? "You", image: me?.image ?? undefined },
                                  };

                                  setActivities((prev) => [tempEntry, ...prev]);
                                  const payload = {
                                    activityType: "user_post",
                                    description: composerText,
                                    metadata: {},
                                    visibility: composerVisibility,
                                  } as any;

                                  if (attachmentPreview) {
                                    // include image data URL in metadata (prototype)
                                    payload.metadata.image = attachmentPreview;
                                  }

                                  const postActivity = async (pl: any, tId: string) => {
                                    try {
                                      const res = await fetch(`/api/social/feed`, {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify(pl),
                                      });
                                      const data = await res.json();
                                      if (data.activity) {
                                        // replace temp with real entry
                                        setActivities((prev) => [data.activity, ...prev.filter((a) => a.id !== tId)]);
                                        toast.success("Posted", {
                                          action: {
                                            label: "Undo",
                                            onClick: () => scheduleDelete(data.activity.id),
                                          },
                                        });
                                        // clear stored failed if any
                                        setLastFailedPosts((prev) => {
                                          const next = { ...prev };
                                          delete next[tId];
                                          return next;
                                        });
                                      } else {
                                        // failed - keep temp and store payload for retry
                                        setLastFailedPosts((prev) => ({ ...prev, [tId]: pl }));
                                        toast.error("Failed to post", {
                                          action: {
                                            label: "Retry",
                                            onClick: () => retryPost(tId),
                                          },
                                        });
                                      }
                                    } catch (err) {
                                      // keep temp and store payload for retry
                                      setLastFailedPosts((prev) => ({ ...prev, [tId]: pl }));
                                      toast.error("Network error while posting", {
                                        action: { label: "Retry", onClick: () => retryPost(tId) },
                                      });
                                    }
                                  };

                                  const retryPost = async (tId: string) => {
                                    const pl = lastFailedPosts[tId];
                                    if (!pl) return;
                                    await postActivity(pl, tId);
                                  };

                                  try {
                                    await postActivity(payload, tempId);
                                  } finally {
                                    setPosting(false);
                                    setComposerText("");
                                    setShowComposer(false);
                                    setAttachmentFile(null);
                                    setAttachmentPreview(null);
                                  }
                                }}
                                disabled={posting}
                              >
                                {posting ? "Posting..." : "Post"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
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
