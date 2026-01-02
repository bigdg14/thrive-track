import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Award, ChevronLeft, TrendingUp, Target, Trophy, Flame } from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"

async function getPersonalRecords(userId: string) {
  const records = await prisma.personalRecord.findMany({
    where: { userId },
    include: {
      exercise: {
        select: {
          id: true,
          name: true,
          muscleGroups: true,
          difficulty: true,
        },
      },
    },
    orderBy: { achievedAt: "desc" },
  })

  // Group by exercise
  const byExercise = records.reduce((acc, record) => {
    const exerciseId = record.exerciseId
    if (!acc[exerciseId]) {
      acc[exerciseId] = {
        exercise: record.exercise,
        records: [],
      }
    }
    acc[exerciseId].records.push(record)
    return acc
  }, {} as Record<string, { exercise: any; records: any[] }>)

  // Group by record type
  const maxWeightRecords = records.filter((r) => r.recordType === "max_weight")
  const maxRepsRecords = records.filter((r) => r.recordType === "max_reps")

  // Stats
  const totalPRs = records.length
  const recentPRs = records.filter((r) => {
    const daysAgo = (new Date().getTime() - new Date(r.achievedAt).getTime()) / (1000 * 60 * 60 * 24)
    return daysAgo <= 30
  }).length

  return {
    records,
    byExercise: Object.values(byExercise),
    maxWeightRecords,
    maxRepsRecords,
    stats: {
      totalPRs,
      recentPRs,
      exercisesWithPRs: Object.keys(byExercise).length,
    },
  }
}

export default async function PersonalRecordsPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const data = await getPersonalRecords(session.user.id)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Award className="w-6 h-6 text-yellow-500" />
              <h1 className="text-xl font-bold">Personal Records</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-6xl">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total PRs</CardTitle>
              <Trophy className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.totalPRs}</div>
              <p className="text-xs text-muted-foreground">All-time records</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent PRs</CardTitle>
              <Flame className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.recentPRs}</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Exercises</CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.exercisesWithPRs}</div>
              <p className="text-xs text-muted-foreground">With records</p>
            </CardContent>
          </Card>
        </div>

        {data.records.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12 text-muted-foreground">
                <Award className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Personal Records Yet</h3>
                <p className="mb-4">Complete your first workout to start tracking records!</p>
                <Link href="/workouts/active">
                  <Button>Start Workout</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Records</TabsTrigger>
              <TabsTrigger value="weight">Max Weight</TabsTrigger>
              <TabsTrigger value="reps">Max Reps</TabsTrigger>
            </TabsList>

            {/* All Records - By Exercise */}
            <TabsContent value="all" className="space-y-4 mt-6">
              {data.byExercise.map(({ exercise, records }) => {
                const maxWeight = records.find((r) => r.recordType === "max_weight")
                const maxReps = records.find((r) => r.recordType === "max_reps")

                return (
                  <Card key={exercise.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-yellow-500" />
                            {exercise.name}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {records.length} record{records.length !== 1 ? "s" : ""}
                          </CardDescription>
                        </div>
                        <div className="flex gap-1 flex-wrap justify-end">
                          {exercise.muscleGroups.slice(0, 2).map((muscle: string) => (
                            <Badge key={muscle} variant="secondary">
                              {muscle}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {maxWeight && (
                        <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Max Weight</p>
                            <p className="text-2xl font-bold">{maxWeight.value} kg</p>
                            {maxWeight.metadata && typeof maxWeight.metadata === "object" && "reps" in maxWeight.metadata && (
                              <p className="text-sm text-muted-foreground">
                                {(maxWeight.metadata as { reps: number }).reps} reps
                              </p>
                            )}
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(maxWeight.achievedAt), { addSuffix: true })}
                          </div>
                        </div>
                      )}

                      {maxReps && (
                        <div className="flex items-center justify-between p-3 bg-accent/5 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Max Reps</p>
                            <p className="text-2xl font-bold">{maxReps.value}</p>
                            {maxReps.metadata && typeof maxReps.metadata === "object" && "weight" in maxReps.metadata && (
                              <p className="text-sm text-muted-foreground">
                                @ {(maxReps.metadata as { weight: number }).weight} kg
                              </p>
                            )}
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(maxReps.achievedAt), { addSuffix: true })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </TabsContent>

            {/* Max Weight Records */}
            <TabsContent value="weight" className="space-y-3 mt-6">
              {data.maxWeightRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{record.exercise.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(record.achievedAt), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{record.value} kg</p>
                    {record.metadata && typeof record.metadata === "object" && "reps" in record.metadata && (
                      <p className="text-sm text-muted-foreground">
                        {(record.metadata as { reps: number }).reps} reps
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* Max Reps Records */}
            <TabsContent value="reps" className="space-y-3 mt-6">
              {data.maxRepsRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-accent/10 rounded-lg">
                      <Target className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <p className="font-semibold">{record.exercise.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(record.achievedAt), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{record.value}</p>
                    {record.metadata && typeof record.metadata === "object" && "weight" in record.metadata && (
                      <p className="text-sm text-muted-foreground">
                        @ {(record.metadata as { weight: number }).weight} kg
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  )
}
