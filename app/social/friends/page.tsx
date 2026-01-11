"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";

type UserSummary = { id: string; name?: string | null; image?: string | null; email?: string };

export default function FriendsPage() {
  const [incoming, setIncoming] = useState<Array<any>>([]);
  const [outgoing, setOutgoing] = useState<Array<any>>([]);
  const [friends, setFriends] = useState<Array<UserSummary>>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadAll() {
    setLoading(true);
    try {
      const [incRes, outRes, friRes] = await Promise.all([
        fetch(`/api/social/friends?type=incoming`).then((r) => r.json()),
        fetch(`/api/social/friends?type=outgoing`).then((r) => r.json()),
        fetch(`/api/social/friends?type=friends`).then((r) => r.json()),
      ]);
      setIncoming(incRes.incoming || []);
      setOutgoing(outRes.outgoing || []);
      setFriends(friRes.friends || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function sendRequest() {
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/social/friends`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }).then((r) => r.json());
      if (res.friendship) {
        setEmail("");
        await loadAll();
      } else {
        console.error(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function respond(id: string, action: string) {
    setLoading(true);
    try {
      await fetch(`/api/social/friends/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      await loadAll();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Friends</h1>

      <Card className="p-4 mb-6">
        <div className="flex gap-3 items-center">
          <input
            className="flex-1 input"
            placeholder="Friend's email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button onClick={sendRequest} disabled={loading || email.length === 0}>
            Send Request
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <section>
          <h2 className="font-semibold mb-2">Incoming</h2>
          {incoming.length === 0 && <Card className="p-3">No incoming requests</Card>}
          {incoming.map((r: any) => (
            <Card key={r.id} className="p-3 mb-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar src={r.user.image || undefined} alt={r.user.name || "User"} />
                <div>
                  <div className="font-medium">{r.user.name || r.user.email}</div>
                  <div className="text-sm text-muted-foreground">Requested</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => respond(r.id, "accept")} disabled={loading}>
                  Accept
                </Button>
                <Button variant="ghost" onClick={() => respond(r.id, "decline")} disabled={loading}>
                  Decline
                </Button>
              </div>
            </Card>
          ))}
        </section>

        <section>
          <h2 className="font-semibold mb-2">Outgoing</h2>
          {outgoing.length === 0 && <Card className="p-3">No outgoing requests</Card>}
          {outgoing.map((r: any) => (
            <Card key={r.id} className="p-3 mb-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar src={r.friend.image || undefined} alt={r.friend.name || "User"} />
                <div>
                  <div className="font-medium">{r.friend.name || r.friend.email}</div>
                  <div className="text-sm text-muted-foreground">Sent</div>
                </div>
              </div>
            </Card>
          ))}
        </section>

        <section>
          <h2 className="font-semibold mb-2">Friends</h2>
          {friends.length === 0 && <Card className="p-3">No friends yet</Card>}
          {friends.map((f) => (
            <Card key={f.id} className="p-3 mb-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar src={f.image || undefined} alt={f.name || "User"} />
                <div>
                  <div className="font-medium">{f.name}</div>
                </div>
              </div>
            </Card>
          ))}
        </section>
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, Users, UserPlus, Check, X, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Friend {
  id: string;
  friendId: string;
  status: string;
  createdAt: string;
  friend: {
    id: string;
    name: string;
    email: string;
    image?: string;
    userLevel?: {
      level: number;
      totalXP: number;
      streakDays: number;
      workoutCount: number;
    };
  };
}

interface PendingRequest {
  id: string;
  userId: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
    userLevel?: {
      level: number;
      totalXP: number;
      streakDays: number;
      workoutCount: number;
    };
  };
}

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/social/friends?status=accepted");
      const data = await res.json();
      setFriends(data.friends || []);
      setPendingRequests(data.pendingRequests || []);
    } catch (error) {
      console.error("Failed to fetch friends:", error);
      toast.error("Failed to load friends");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const res = await fetch(`/api/social/friends/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });

      if (!res.ok) throw new Error("Failed to accept request");

      toast.success("Friend request accepted!");
      fetchFriends();
    } catch (error) {
      toast.error("Failed to accept friend request");
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const res = await fetch(`/api/social/friends/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });

      if (!res.ok) throw new Error("Failed to reject request");

      toast.success("Friend request rejected");
      fetchFriends();
    } catch (error) {
      toast.error("Failed to reject friend request");
    }
  };

  const handleRemoveFriend = async (friendshipId: string) => {
    if (!confirm("Are you sure you want to remove this friend?")) return;

    try {
      const res = await fetch(`/api/social/friends/${friendshipId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to remove friend");

      toast.success("Friend removed");
      fetchFriends();
    } catch (error) {
      toast.error("Failed to remove friend");
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
                <Users className="w-6 h-6 text-primary" />
                <h1 className="text-xl font-bold">Friends</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Card */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Your Network</CardTitle>
            <CardDescription>Stay connected and motivated together</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                <Users className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{friends.length}</p>
                  <p className="text-sm text-muted-foreground">Friends</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                <UserPlus className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{pendingRequests.length}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="friends">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="friends">
              My Friends ({friends.length})
            </TabsTrigger>
            <TabsTrigger value="requests">
              Requests ({pendingRequests.length})
            </TabsTrigger>
          </TabsList>

          {/* Friends List */}
          <TabsContent value="friends" className="mt-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Friends List</CardTitle>
                <CardDescription>People you're connected with</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Loading friends...
                  </div>
                ) : friends.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No friends yet</p>
                    <p className="text-sm">Start connecting with other users!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {friends.map((friendship) => (
                      <div
                        key={friendship.id}
                        className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg border border-border"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={friendship.friend.image} />
                            <AvatarFallback>
                              {friendship.friend.name?.charAt(0).toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1">
                            <p className="font-medium">{friendship.friend.name}</p>
                            {friendship.friend.userLevel && (
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  Level {friendship.friend.userLevel.level}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {friendship.friend.userLevel.workoutCount} workouts
                                </span>
                                {friendship.friend.userLevel.streakDays > 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    {friendship.friend.userLevel.streakDays} day streak
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveFriend(friendship.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pending Requests */}
          <TabsContent value="requests" className="mt-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Friend Requests</CardTitle>
                <CardDescription>Accept or decline friend requests</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Loading requests...
                  </div>
                ) : pendingRequests.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <UserPlus className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No pending requests</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg border border-border"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={request.user.image} />
                            <AvatarFallback>
                              {request.user.name?.charAt(0).toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>

                          <div>
                            <p className="font-medium">{request.user.name}</p>
                            {request.user.userLevel && (
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  Level {request.user.userLevel.level}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {request.user.userLevel.totalXP} XP
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleAcceptRequest(request.id)}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectRequest(request.id)}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Decline
                          </Button>
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
