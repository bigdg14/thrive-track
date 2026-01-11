import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, ChevronLeft, Clock, Dumbbell, Play, Info } from "lucide-react";
import Link from "next/link";
import StartProgramButton from "./start-program-button";

async function getProgramDetails(programId: string, userId: string) {
  const program = await prisma.workoutProgram.findUnique({
    where: { id: programId },
    include: {
      programWorkouts: {
        orderBy: { dayNumber: "asc" },
      },
    },
  });

  if (!program) {
    return null;
  }

  // Check if user already has this program
  const userProgram = await prisma.userProgram.findFirst({
    where: {
      userId,
      programId,
      status: "active",
    },
  });

  // Get exercises for all workouts
  const workoutsWithExercises = await Promise.all(
    program.programWorkouts.map(async (workout) => {
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
    ...program,
    programWorkouts: workoutsWithExercises,
    userProgram,
  };
}

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;
  const program = await getProgramDetails(id, session.user.id);

  if (!program) {
    notFound();
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "beginner":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "intermediate":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "advanced":
        return "bg-red-500/10 text-red-500 border-red-500/20";
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
              <Link href="/programs">
                <Button variant="ghost" size="icon">
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold">{program.name}</h1>
                <p className="text-sm text-muted-foreground">Program Details</p>
              </div>
            </div>

            {program.userProgram ? (
              <Link href={`/programs/user/${program.userProgram.id}`}>
                <Button>
                  <Play className="mr-2 h-4 w-4" />
                  Continue Program
                </Button>
              </Link>
            ) : (
              <StartProgramButton programId={program.id} />
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Program Overview */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-start justify-between mb-2">
              <div className="space-y-1">
                <CardTitle className="text-2xl">{program.name}</CardTitle>
                <CardDescription>
                  {program.description || "No description available"}
                </CardDescription>
              </div>
              <Badge className={getDifficultyColor(program.difficulty)}>
                {program.difficulty}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{program.durationWeeks} Weeks</p>
                  <p className="text-muted-foreground text-xs">Duration</p>
                </div>
              </div>
              <Separator orientation="vertical" className="h-10" />
              <div className="flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{program.programWorkouts.length} Workouts</p>
                  <p className="text-muted-foreground text-xs">Total Sessions</p>
                </div>
              </div>
              <Separator orientation="vertical" className="h-10" />
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{Math.ceil(program.programWorkouts.length / 7)} Days/Week</p>
                  <p className="text-muted-foreground text-xs">Frequency</p>
                </div>
              </div>
            </div>

            {program.isSystemProgram && (
              <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-500">System Program</p>
                  <p className="text-muted-foreground">
                    This is a pre-built program designed by fitness professionals.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workout Schedule */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Workout Schedule</h2>
          <div className="space-y-3">
            {program.programWorkouts.map((workout, index) => (
              <Card key={workout.id} className="bg-card border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Day {workout.dayNumber}: {workout.workoutName}
                      </CardTitle>
                      <CardDescription>
                        {workout.exerciseDetails.length} exercises
                      </CardDescription>
                    </div>
                    <Badge variant="outline">{workout.exerciseDetails.length} exercises</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {workout.exerciseDetails.map((ex: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{ex.exercise?.name || "Unknown Exercise"}</p>
                          <p className="text-sm text-muted-foreground">
                            {ex.exercise?.muscleGroups.join(", ")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {ex.sets} × {ex.reps} {ex.weight ? `@ ${ex.weight}kg` : ""}
                          </p>
                          {ex.notes && (
                            <p className="text-sm text-muted-foreground">{ex.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
