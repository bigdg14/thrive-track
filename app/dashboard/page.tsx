import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Progress } from "@/components/ui/progress"
import {
  Dumbbell,
  TrendingUp,
  Award,
  Calendar,
  Target,
  Activity,
  ChevronRight,
  Flame,
  Scale,
  Apple,
  TrendingDown
} from "lucide-react"
import { formatDistanceToNow, format, startOfDay, endOfDay } from "date-fns"

async function getDashboardData(userId: string) {
  const now = new Date()
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const today = new Date()

  // Get user data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      image: true,
      fitnessLevel: true,
      primaryGoals: true,
    },
  })

  // Get workout stats
  const [totalWorkouts, weekWorkouts, recentWorkouts, personalRecords] = await Promise.all([
    // Total workouts
    prisma.workout.count({
      where: { userId },
    }),
    // This week's workouts
    prisma.workout.count({
      where: {
        userId,
        startedAt: { gte: startOfWeek },
      },
    }),
    // Recent workouts (last 5)
    prisma.workout.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      take: 5,
      include: {
        workoutExercises: {
          include: {
            exercise: {
              select: {
                name: true,
                muscleGroups: true,
              },
            },
          },
        },
      },
    }),
    // Recent PRs
    prisma.personalRecord.findMany({
      where: { userId },
      orderBy: { achievedAt: "desc" },
      take: 3,
      include: {
        exercise: {
          select: {
            name: true,
          },
        },
      },
    }),
  ])

  // Phase 2 Data - Goals
  const activeGoals = await prisma.goal.findMany({
    where: {
      userId,
      status: "active",
    },
    orderBy: { createdAt: "desc" },
    take: 3,
  })

  // Phase 2 Data - Latest body measurement
  const latestMeasurement = await prisma.bodyMeasurement.findFirst({
    where: { userId },
    orderBy: { date: "desc" },
  })

  // Phase 2 Data - Previous measurement for trend
  const previousMeasurement = await prisma.bodyMeasurement.findFirst({
    where: {
      userId,
      ...(latestMeasurement && { date: { lt: latestMeasurement.date } })
    },
    orderBy: { date: "desc" },
  })

  // Phase 2 Data - Today's nutrition
  const [todaysNutrition, nutritionTarget] = await Promise.all([
    prisma.nutritionLog.findMany({
      where: {
        userId,
        date: {
          gte: startOfDay(today),
          lte: endOfDay(today),
        },
      },
    }),
    prisma.nutritionTarget.findUnique({
      where: { userId },
    }),
  ])

  // Calculate today's totals
  const nutritionTotals = todaysNutrition.reduce(
    (acc, log) => ({
      calories: acc.calories + log.calories,
      protein: acc.protein + log.protein,
      carbs: acc.carbs + log.carbs,
      fat: acc.fat + log.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  // Calculate streak (simplified - counts consecutive days with workouts)
  const allWorkouts = await prisma.workout.findMany({
    where: { userId },
    select: { startedAt: true },
    orderBy: { startedAt: "desc" },
  })

  let streak = 0
  if (allWorkouts.length > 0) {
    const dates = allWorkouts.map(w => new Date(w.startedAt).toDateString())
    const uniqueDates = [...new Set(dates)]

    for (let i = 0; i < uniqueDates.length; i++) {
      const date = new Date(uniqueDates[i])
      const expectedDate = new Date()
      expectedDate.setDate(expectedDate.getDate() - i)

      if (date.toDateString() === expectedDate.toDateString()) {
        streak++
      } else {
        break
      }
    }
  }

  return {
    user,
    stats: {
      totalWorkouts,
      weekWorkouts,
      streak,
      recentPRs: personalRecords.length,
    },
    recentWorkouts,
    personalRecords,
    // Phase 2 data
    activeGoals,
    latestMeasurement,
    previousMeasurement,
    nutritionTotals,
    nutritionTarget,
  }
}

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const data = await getDashboardData(session.user.id)
  const firstName = data.user?.name?.split(" ")[0] || "there"

  // Calculate weight trend
  const weightTrend = data.latestMeasurement?.weight && data.previousMeasurement?.weight
    ? data.latestMeasurement.weight - data.previousMeasurement.weight
    : null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Dumbbell className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-xl font-bold">ThriveTrack</h1>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link href="/profile">
                <Avatar className="h-10 w-10 cursor-pointer hover:ring-2 ring-primary transition-all">
                  <AvatarImage src={data.user?.image || ""} />
                  <AvatarFallback>{firstName[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="space-y-2">
          <h2 className="text-3xl font-bold">Welcome back, {firstName}! 👋</h2>
          <p className="text-muted-foreground">Ready to crush your fitness goals?</p>
        </div>

        {/* Start Workout CTA */}
        <Card className="bg-gradient-to-br from-primary/20 via-accent/10 to-primary/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-2 text-center md:text-left">
                <h3 className="text-2xl font-bold text-gradient">Ready to Work Out?</h3>
                <p className="text-muted-foreground">Track your sets, rest times, and smash those PRs!</p>
              </div>
              <Link href="/workouts/active">
                <Button size="lg" className="gap-2 text-lg px-8 py-6">
                  <Dumbbell className="w-5 h-5" />
                  Start Workout
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Streak Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
              <Flame className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.streak} days</div>
              <p className="text-xs text-muted-foreground mt-1">
                {data.stats.streak > 0 ? "Keep it going!" : "Start your streak today!"}
              </p>
            </CardContent>
          </Card>

          {/* This Week Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.weekWorkouts} workouts</div>
              <p className="text-xs text-muted-foreground mt-1">
                {data.stats.weekWorkouts >= 3 ? "Crushing it!" : "Let's get moving!"}
              </p>
            </CardContent>
          </Card>

          {/* Current Weight Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Weight</CardTitle>
              <Scale className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.latestMeasurement?.weight
                  ? `${data.latestMeasurement.weight.toFixed(1)} kg`
                  : "—"}
              </div>
              {weightTrend !== null && (
                <p className={`text-xs mt-1 flex items-center ${weightTrend > 0 ? "text-orange-500" : weightTrend < 0 ? "text-green-500" : "text-muted-foreground"}`}>
                  {weightTrend > 0 ? (
                    <><TrendingUp className="h-3 w-3 mr-1" /> +{weightTrend.toFixed(1)} kg</>
                  ) : weightTrend < 0 ? (
                    <><TrendingDown className="h-3 w-3 mr-1" /> {weightTrend.toFixed(1)} kg</>
                  ) : (
                    "No change"
                  )}
                </p>
              )}
              {!data.latestMeasurement && (
                <Link href="/progress/measurements">
                  <p className="text-xs text-primary hover:underline mt-1">Add measurement</p>
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Calories Today Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Calories Today</CardTitle>
              <Apple className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.nutritionTarget
                  ? `${data.nutritionTotals.calories} / ${data.nutritionTarget.dailyCalories}`
                  : `${data.nutritionTotals.calories}`}
              </div>
              {data.nutritionTarget && (
                <Progress
                  value={Math.min((data.nutritionTotals.calories / data.nutritionTarget.dailyCalories) * 100, 100)}
                  className="mt-2 h-1"
                />
              )}
              {!data.nutritionTarget && (
                <Link href="/nutrition/log">
                  <p className="text-xs text-primary hover:underline mt-1">Set targets</p>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Phase 2: Active Goals Section */}
        {data.activeGoals.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Active Goals</CardTitle>
                  <CardDescription>Track your fitness objectives</CardDescription>
                </div>
                <Link href="/progress/goals">
                  <Button variant="ghost" size="sm">
                    View All
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.activeGoals.map((goal) => {
                  const progress = goal.currentValue
                    ? Math.min((goal.currentValue / goal.targetValue) * 100, 100)
                    : 0

                  return (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{goal.title}</p>
                          {goal.currentValue !== null && (
                            <p className="text-sm text-muted-foreground">
                              {goal.currentValue} / {goal.targetValue} {goal.unit}
                            </p>
                          )}
                        </div>
                        {goal.deadline && (
                          <Badge variant="outline" className="text-xs">
                            {format(new Date(goal.deadline), "MMM d")}
                          </Badge>
                        )}
                      </div>
                      {goal.currentValue !== null && (
                        <div className="space-y-1">
                          <Progress value={progress} className="h-2" />
                          <p className="text-xs text-muted-foreground">{Math.round(progress)}% complete</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Workouts */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Workouts</CardTitle>
                  <CardDescription>Your latest training sessions</CardDescription>
                </div>
                <Link href="/workouts/history">
                  <Button variant="ghost" size="sm">
                    View All
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {data.recentWorkouts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No workouts yet</p>
                  <p className="text-sm">Start your first workout to see it here!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.recentWorkouts.map((workout) => (
                    <Link
                      key={workout.id}
                      href={`/workouts/${workout.id}`}
                      className="block p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium">
                            {workout.workoutExercises.length} exercise{workout.workoutExercises.length !== 1 ? 's' : ''}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(workout.startedAt), { addSuffix: true })}
                          </p>
                        </div>
                        {workout.duration && (
                          <Badge variant="secondary">{workout.duration} min</Badge>
                        )}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {workout.workoutExercises.slice(0, 3).map((we) => (
                          <Badge key={we.id} variant="outline" className="text-xs">
                            {we.exercise.name}
                          </Badge>
                        ))}
                        {workout.workoutExercises.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{workout.workoutExercises.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Personal Records */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Personal Records</CardTitle>
                  <CardDescription>Your recent achievements</CardDescription>
                </div>
                <Link href="/progress/records">
                  <Button variant="ghost" size="sm">
                    View All
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {data.personalRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Award className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No PRs yet</p>
                  <p className="text-sm">Complete a workout to start tracking records!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.personalRecords.map((pr) => (
                    <div
                      key={pr.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-500/10 rounded-lg">
                          <Award className="w-5 h-5 text-yellow-500" />
                        </div>
                        <div>
                          <p className="font-medium">{pr.exercise.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(pr.achievedAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{pr.value}</p>
                        <p className="text-xs text-muted-foreground">{pr.recordType}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Jump to your favorite features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Link href="/exercises">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Dumbbell className="w-4 h-4" />
                  Browse Exercises
                </Button>
              </Link>
              <Link href="/progress/goals">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Target className="w-4 h-4" />
                  My Goals
                </Button>
              </Link>
              <Link href="/progress/measurements">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Scale className="w-4 h-4" />
                  Measurements
                </Button>
              </Link>
              <Link href="/nutrition/log">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Apple className="w-4 h-4" />
                  Log Nutrition
                </Button>
              </Link>
              <Link href="/workouts/history">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Calendar className="w-4 h-4" />
                  Workout History
                </Button>
              </Link>
              <Link href="/progress/records">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Award className="w-4 h-4" />
                  Personal Records
                </Button>
              </Link>
              <Link href="/settings">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Activity className="w-4 h-4" />
                  Settings
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <TrendingUp className="w-4 h-4" />
                  View Profile
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
