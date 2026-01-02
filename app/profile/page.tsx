import { redirect } from "next/navigation"
import { auth, signOut } from "@/lib/auth"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import {
  User,
  Mail,
  Dumbbell,
  Target,
  Activity,
  LogOut,
  Settings,
  Award,
  ChevronLeft
} from "lucide-react"

async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      image: true,
      fitnessLevel: true,
      primaryGoals: true,
      height: true,
      weight: true,
      age: true,
      gender: true,
      activityLevel: true,
      unitsPreference: true,
      createdAt: true,
    },
  })

  const [totalWorkouts, totalPRs] = await Promise.all([
    prisma.workout.count({ where: { userId } }),
    prisma.personalRecord.count({ where: { userId } }),
  ])

  return {
    user,
    stats: {
      totalWorkouts,
      totalPRs,
    },
  }
}

export default async function ProfilePage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const data = await getUserProfile(session.user.id)
  const firstName = data.user?.name?.split(" ")[0] || "there"

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <User className="w-6 h-6 text-primary" />
                <h1 className="text-xl font-bold">Profile</h1>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-4xl">
        {/* User Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={data.user?.image || ""} />
                <AvatarFallback className="text-2xl">
                  {firstName[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-1">{data.user?.name}</h2>
                <p className="text-muted-foreground flex items-center gap-2 mb-4">
                  <Mail className="w-4 h-4" />
                  {data.user?.email}
                </p>
                <div className="flex gap-2">
                  {data.user?.fitnessLevel && (
                    <Badge variant="secondary" className="capitalize">
                      {data.user.fitnessLevel}
                    </Badge>
                  )}
                  {data.user?.activityLevel && (
                    <Badge variant="outline" className="capitalize">
                      {data.user.activityLevel.replace("_", " ")}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Workouts</CardTitle>
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.totalWorkouts}</div>
              <p className="text-xs text-muted-foreground">All-time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Personal Records</CardTitle>
              <Award className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.totalPRs}</div>
              <p className="text-xs text-muted-foreground">Total PRs</p>
            </CardContent>
          </Card>
        </div>

        {/* Fitness Goals */}
        {data.user?.primaryGoals && data.user.primaryGoals.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                <CardTitle>Fitness Goals</CardTitle>
              </div>
              <CardDescription>Your primary fitness objectives</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                {data.user.primaryGoals.map((goal) => (
                  <Badge key={goal} className="capitalize">
                    {goal.replace("_", " ")}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Personal Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              <CardTitle>Personal Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.user?.height && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Height</span>
                <span className="font-medium">{data.user.height} cm</span>
              </div>
            )}
            {data.user?.weight && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Weight</span>
                <span className="font-medium">{data.user.weight} kg</span>
              </div>
            )}
            {data.user?.age && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Age</span>
                <span className="font-medium">{data.user.age} years</span>
              </div>
            )}
            {data.user?.gender && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Gender</span>
                <span className="font-medium capitalize">
                  {data.user.gender.replace("_", " ")}
                </span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Units</span>
              <span className="font-medium capitalize">{data.user?.unitsPreference}</span>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              <CardTitle>Account</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/settings">
              <Button variant="outline" className="w-full gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </Button>
            </Link>
            <form action={async () => {
              "use server"
              await signOut({ redirectTo: "/login" })
            }}>
              <Button variant="destructive" className="w-full gap-2">
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
