import { redirect, notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ChevronLeft,
  Dumbbell,
  Info,
  Lightbulb,
  Target,
  AlertCircle,
  Plus
} from "lucide-react"

async function getExercise(id: string) {
  const exercise = await prisma.exercise.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      muscleGroups: true,
      secondaryMuscles: true,
      equipment: true,
      difficulty: true,
      exerciseType: true,
      gifUrl: true,
      instructions: true,
      tips: true,
      alternatives: true,
    },
  })

  return exercise
}

export default async function ExerciseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const { id } = await params
  const exercise = await getExercise(id)

  if (!exercise) {
    notFound()
  }

  const instructions = exercise.instructions as string[] | null
  const tips = exercise.tips as string[] | null

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-accent text-accent-foreground"
      case "intermediate":
        return "bg-primary text-primary-foreground"
      case "advanced":
        return "bg-destructive text-destructive-foreground"
      default:
        return "bg-secondary text-secondary-foreground"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/exercises">
                <Button variant="ghost" size="icon">
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Dumbbell className="w-6 h-6 text-primary" />
                <h1 className="text-xl font-bold">Exercise Details</h1>
              </div>
            </div>
            <Link href="/workouts/active">
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Add to Workout
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-4xl">
        {/* Title Section */}
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <h2 className="text-3xl font-bold">{exercise.name}</h2>
            <Badge className={getDifficultyColor(exercise.difficulty)}>
              {exercise.difficulty}
            </Badge>
          </div>
          {exercise.description && (
            <p className="text-muted-foreground text-lg">{exercise.description}</p>
          )}
        </div>

        {/* GIF Demo */}
        {exercise.gifUrl && (
          <Card>
            <CardContent className="pt-6">
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                <img
                  src={exercise.gifUrl}
                  alt={exercise.name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Muscle Groups */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                <CardTitle>Muscle Groups</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Primary</p>
                <div className="flex gap-2 flex-wrap">
                  {exercise.muscleGroups.map((muscle) => (
                    <Badge key={muscle} className="text-sm">
                      {muscle}
                    </Badge>
                  ))}
                </div>
              </div>
              {exercise.secondaryMuscles.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Secondary</p>
                    <div className="flex gap-2 flex-wrap">
                      {exercise.secondaryMuscles.map((muscle) => (
                        <Badge key={muscle} variant="secondary" className="text-sm">
                          {muscle}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Equipment & Type */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-primary" />
                <CardTitle>Equipment & Type</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Equipment Required</p>
                <div className="flex gap-2 flex-wrap">
                  {exercise.equipment.map((eq) => (
                    <Badge key={eq} variant="outline" className="text-sm">
                      {eq}
                    </Badge>
                  ))}
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Exercise Type</p>
                <Badge variant="secondary" className="text-sm">
                  {exercise.exerciseType}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        {instructions && instructions.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                <CardTitle>How to Perform</CardTitle>
              </div>
              <CardDescription>Step-by-step instructions</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {instructions.map((instruction, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-semibold text-sm flex-shrink-0">
                      {index + 1}
                    </span>
                    <p className="text-sm leading-relaxed pt-0.5">{instruction}</p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        )}

        {/* Tips */}
        {tips && tips.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                <CardTitle>Tips & Common Mistakes</CardTitle>
              </div>
              <CardDescription>Get the most out of this exercise</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {tips.map((tip, index) => (
                  <li key={index} className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm leading-relaxed">{tip}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* CTA */}
        <Card className="bg-gradient-to-br from-primary/20 via-accent/10 to-primary/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <h3 className="text-xl font-bold mb-1">Ready to try {exercise.name}?</h3>
                <p className="text-sm text-muted-foreground">
                  Add it to your workout and start tracking your progress
                </p>
              </div>
              <Link href="/workouts/active">
                <Button size="lg" className="gap-2">
                  <Plus className="w-5 h-5" />
                  Add to Workout
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
