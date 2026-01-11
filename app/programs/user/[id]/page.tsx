import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Calendar, ChevronLeft, CheckCircle2, Circle, TrendingUp, Dumbbell } from "lucide-react";
import Link from "next/link";
import ProgramActions from "./program-actions";

async function getUserProgram(userProgramId: string, userId: string) {
  const userProgram = await prisma.userProgram.findUnique({
    where: {
      id: userProgramId,
      userId, // Security: ensure user owns this program
    },
    include: {
      program: {
        include: {
          programWorkouts: {
            orderBy: { dayNumber: "asc" },
          },
        },
      },
    },
  });

  if (!userProgram) {
    return null;
  }

  // Get exercises for the current week's workouts
  const currentWeekWorkouts = userProgram.program.programWorkouts.filter(
    (w) => w.dayNumber >= (userProgram.currentWeek - 1) * 7 + 1 &&
           w.dayNumber <= userProgram.currentWeek * 7
  );

  const workoutsWithExercises = await Promise.all(
    currentWeekWorkouts.map(async (workout) => {
      const exerciseData = workout.exercises as any[];
      const exerciseIds = exerciseData.map((e: any) => e.exerciseId);

      const exercises = await prisma.exercise.findMany({
        where: { id: { in: exerciseIds } },
        select: {
          id: true,
          name: true,
          muscleGroups: true,
        },
      });

      return {
        ...workout,
        exerciseDetails: exerciseData.map((e: any) => ({
          ...e,
          exercise: exercises.find((ex) => ex.id === e.exerciseId),
        })),
      };
    })
  );

  return {
    ...userProgram,
    currentWeekWorkouts: workoutsWithExercises,
  };
}

export default async function UserProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;
  const userProgram = await getUserProgram(id, session.user.id);

  if (!userProgram) {
    notFound();
  }

  const progressPercent = (userProgram.currentWeek / userProgram.program.durationWeeks) * 100;
  const weeksRemaining = userProgram.program.durationWeeks - userProgram.currentWeek;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/programs">
                <Button variant="ghost" size="icon">
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold">{userProgram.program.name}</h1>
                <p className="text-sm text-muted-foreground">
                  Week {userProgram.currentWeek} of {userProgram.program.durationWeeks}
                </p>
              </div>
            </div>

            <ProgramActions userProgramId={userProgram.id} status={userProgram.status} />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Progress Card */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <CardTitle>Your Progress</CardTitle>
              <Badge variant={userProgram.status === "active" ? "default" : "secondary"}>
                {userProgram.status}
              </Badge>
            </div>
            <CardDescription>
              {weeksRemaining > 0
                ? `${weeksRemaining} week${weeksRemaining > 1 ? "s" : ""} remaining`
                : "Final week!"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-medium">{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Started</p>
                  <p className="text-muted-foreground">
                    {new Date(userProgram.startedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Current Week</p>
                  <p className="text-muted-foreground">
                    Week {userProgram.currentWeek}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* This Week's Workouts */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Week {userProgram.currentWeek} Workouts</h2>
          <div className="space-y-3">
            {userProgram.currentWeekWorkouts.map((workout: any) => {
              const isCompleted = workout.dayNumber < userProgram.currentDay;
              const isCurrent = workout.dayNumber === userProgram.currentDay;

              return (
                <Card
                  key={workout.id}
                  className={`bg-card border-border ${
                    isCurrent ? "ring-2 ring-primary" : ""
                  } ${isCompleted ? "opacity-75" : ""}`}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isCompleted ? (
                          <CheckCircle2 className="w-6 h-6 text-green-500" />
                        ) : isCurrent ? (
                          <Circle className="w-6 h-6 text-primary" />
                        ) : (
                          <Circle className="w-6 h-6 text-muted-foreground" />
                        )}
                        <div>
                          <CardTitle className="text-lg">
                            Day {workout.dayNumber % 7 || 7}: {workout.workoutName}
                          </CardTitle>
                          <CardDescription>
                            {workout.exerciseDetails.length} exercises
                          </CardDescription>
                        </div>
                      </div>
                      {isCurrent && <Badge>Current</Badge>}
                      {isCompleted && <Badge variant="outline">Completed</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      {workout.exerciseDetails.map((ex: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Dumbbell className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-sm">
                                {ex.exercise?.name || "Unknown Exercise"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {ex.exercise?.muscleGroups.join(", ")}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-sm">
                              {ex.sets} × {ex.reps}
                            </p>
                            {ex.weight && (
                              <p className="text-xs text-muted-foreground">{ex.weight}kg</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {isCurrent && !isCompleted && (
                      <Link href={`/workouts/active?programWorkout=${workout.id}&userProgram=${userProgram.id}`}>
                        <Button className="w-full">Start This Workout</Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
