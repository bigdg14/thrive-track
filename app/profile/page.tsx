import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, Trophy, Star, Flame, TrendingUp, Award, Users, Target } from "lucide-react";
import Link from "next/link";
import { calculateLevel, xpForNextLevel, BADGES } from "@/lib/badges";

async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  });

  // Get user level data
  let userLevel = await prisma.userLevel.findUnique({
    where: { userId },
  });

  if (!userLevel) {
    userLevel = await prisma.userLevel.create({
      data: { userId },
    });
  }

  // Get earned badges
  const earnedBadges = await prisma.userBadge.findMany({
    where: { userId },
    orderBy: { earnedAt: "desc" },
    take: 6,
  });

  const badgeDetails = earnedBadges.map((ub) => {
    const badge = BADGES.find((b) => b.id === ub.badgeId);
    return { ...ub, ...badge };
  });

  // Get friend count
  const friendCount = await prisma.friendship.count({
    where: {
      userId,
      status: "accepted",
    },
  });

  // Get goal completion count
  const goalCount = await prisma.goal.count({
    where: {
      userId,
      status: "completed",
    },
  });

  const currentLevel = calculateLevel(userLevel.totalXP);
  const xpNeeded = xpForNextLevel(currentLevel);
  const xpProgress = userLevel.totalXP - (currentLevel > 1 ? xpForNextLevel(currentLevel - 1) : 0);
  const xpRequired = xpNeeded - (currentLevel > 1 ? xpForNextLevel(currentLevel - 1) : 0);
  const progressPercent = (xpProgress / xpRequired) * 100;

  return {
    user,
    userLevel,
    currentLevel,
    xpProgress,
    xpRequired,
    xpNeeded,
    progressPercent,
    earnedBadges: badgeDetails,
    friendCount,
    goalCount,
  };
}

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const profile = await getUserProfile(session.user.id);

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
                <h1 className="text-xl font-bold">My Profile</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Level Card */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Level {profile.currentLevel}</CardTitle>
                <CardDescription>{profile.user?.name}</CardDescription>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">{profile.userLevel.totalXP}</div>
                <div className="text-sm text-muted-foreground">Total XP</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress to Level {profile.currentLevel + 1}</span>
                <span className="font-medium">
                  {profile.xpProgress} / {profile.xpRequired} XP
                </span>
              </div>
              <Progress value={profile.progressPercent} className="h-2" />
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                <Target className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{profile.userLevel.workoutCount}</p>
                  <p className="text-sm text-muted-foreground">Workouts</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                <Flame className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{profile.userLevel.streakDays}</p>
                  <p className="text-sm text-muted-foreground">Day Streak</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                <TrendingUp className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{profile.userLevel.prCount}</p>
                  <p className="text-sm text-muted-foreground">Personal Records</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                <Star className="w-8 h-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{profile.goalCount}</p>
                  <p className="text-sm text-muted-foreground">Goals Completed</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-primary" />
                <span className="font-medium">Longest Streak</span>
              </div>
              <span className="text-xl font-bold text-primary">{profile.userLevel.longestStreak} days</span>
            </div>
          </CardContent>
        </Card>

        {/* Badges Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Badges</CardTitle>
                <CardDescription>Your latest achievements</CardDescription>
              </div>
              <Link href="/profile/badges">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {profile.earnedBadges.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Award className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No badges earned yet</p>
                <p className="text-sm">Complete workouts and goals to earn badges!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {profile.earnedBadges.map((badge: any) => (
                  <div
                    key={badge.id}
                    className="flex flex-col items-center gap-2 p-4 bg-secondary/50 rounded-lg border border-border"
                  >
                    <div className="text-4xl">{badge.icon}</div>
                    <div className="text-center">
                      <p className="font-medium text-sm">{badge.name}</p>
                      <Badge variant="outline" className={`mt-1 text-xs ${getRarityColor(badge.rarity)}`}>
                        {badge.rarity}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">{badge.description}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link href="/profile/badges">
            <Card className="bg-card border-border hover:border-primary transition-colors cursor-pointer">
              <CardContent className="flex items-center gap-3 p-4">
                <Award className="w-8 h-8 text-primary" />
                <div>
                  <p className="font-medium">All Badges</p>
                  <p className="text-sm text-muted-foreground">{profile.earnedBadges.length} earned</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/social/leaderboard">
            <Card className="bg-card border-border hover:border-primary transition-colors cursor-pointer">
              <CardContent className="flex items-center gap-3 p-4">
                <Trophy className="w-8 h-8 text-primary" />
                <div>
                  <p className="font-medium">Leaderboard</p>
                  <p className="text-sm text-muted-foreground">See rankings</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/social/friends">
            <Card className="bg-card border-border hover:border-primary transition-colors cursor-pointer">
              <CardContent className="flex items-center gap-3 p-4">
                <Users className="w-8 h-8 text-primary" />
                <div>
                  <p className="font-medium">Friends</p>
                  <p className="text-sm text-muted-foreground">{profile.friendCount} friends</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}
