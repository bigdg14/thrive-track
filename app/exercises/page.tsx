"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Dumbbell,
  Filter,
  ChevronLeft,
  Heart,
  ChevronRight
} from "lucide-react"

type Exercise = {
  id: string
  name: string
  description: string | null
  muscleGroups: string[]
  secondaryMuscles: string[]
  equipment: string[]
  difficulty: string
  exerciseType: string
  gifUrl: string | null
}

const muscleGroups = [
  { value: "all", label: "All Muscles" },
  { value: "chest", label: "Chest" },
  { value: "back", label: "Back" },
  { value: "legs", label: "Legs" },
  { value: "shoulders", label: "Shoulders" },
  { value: "arms", label: "Arms" },
  { value: "core", label: "Core" },
]

const equipmentTypes = [
  { value: "all", label: "All Equipment" },
  { value: "barbell", label: "Barbell" },
  { value: "dumbbell", label: "Dumbbell" },
  { value: "bodyweight", label: "Bodyweight" },
  { value: "machine", label: "Machine" },
  { value: "cable", label: "Cable" },
]

const difficultyLevels = [
  { value: "all", label: "All Levels" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
]

export default function ExercisesPage() {
  const router = useRouter()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMuscle, setSelectedMuscle] = useState("all")
  const [selectedEquipment, setSelectedEquipment] = useState("all")
  const [selectedDifficulty, setSelectedDifficulty] = useState("all")
  const [isLoading, setIsLoading] = useState(true)

  // Fetch exercises
  useEffect(() => {
    async function fetchExercises() {
      try {
        const response = await fetch("/api/exercises")
        if (!response.ok) throw new Error("Failed to fetch exercises")
        const data = await response.json()
        setExercises(data.exercises)
        setFilteredExercises(data.exercises)
      } catch (error) {
        console.error("Error fetching exercises:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchExercises()
  }, [])

  // Filter exercises
  useEffect(() => {
    let filtered = exercises

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((ex) =>
        ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Muscle group filter
    if (selectedMuscle !== "all") {
      filtered = filtered.filter((ex) => {
        const lowerMuscle = selectedMuscle.toLowerCase()
        return ex.muscleGroups.some(m => m.toLowerCase() === lowerMuscle) ||
               ex.secondaryMuscles.some(m => m.toLowerCase() === lowerMuscle)
      })
    }

    // Equipment filter
    if (selectedEquipment !== "all") {
      filtered = filtered.filter((ex) => {
        const lowerEquipment = selectedEquipment.toLowerCase()
        return ex.equipment.some(e => e.toLowerCase().includes(lowerEquipment))
      })
    }

    // Difficulty filter
    if (selectedDifficulty !== "all") {
      filtered = filtered.filter((ex) => ex.difficulty.toLowerCase() === selectedDifficulty.toLowerCase())
    }

    setFilteredExercises(filtered)
  }, [searchQuery, selectedMuscle, selectedEquipment, selectedDifficulty, exercises])

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
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Dumbbell className="w-6 h-6 text-primary" />
                <h1 className="text-xl font-bold">Exercise Library</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filters */}
        <Tabs defaultValue="muscle" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="muscle">Muscle</TabsTrigger>
            <TabsTrigger value="equipment">Equipment</TabsTrigger>
            <TabsTrigger value="difficulty">Difficulty</TabsTrigger>
          </TabsList>

          <TabsContent value="muscle" className="mt-4">
            <div className="flex gap-2 flex-wrap">
              {muscleGroups.map((muscle) => (
                <Button
                  key={muscle.value}
                  variant={selectedMuscle === muscle.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedMuscle(muscle.value)}
                >
                  {muscle.label}
                </Button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="equipment" className="mt-4">
            <div className="flex gap-2 flex-wrap">
              {equipmentTypes.map((equipment) => (
                <Button
                  key={equipment.value}
                  variant={selectedEquipment === equipment.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedEquipment(equipment.value)}
                >
                  {equipment.label}
                </Button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="difficulty" className="mt-4">
            <div className="flex gap-2 flex-wrap">
              {difficultyLevels.map((level) => (
                <Button
                  key={level.value}
                  variant={selectedDifficulty === level.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDifficulty(level.value)}
                >
                  {level.label}
                </Button>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''}
          </p>
          {(searchQuery || selectedMuscle !== "all" || selectedEquipment !== "all" || selectedDifficulty !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("")
                setSelectedMuscle("all")
                setSelectedEquipment("all")
                setSelectedDifficulty("all")
              }}
            >
              Clear filters
            </Button>
          )}
        </div>

        {/* Exercise Grid */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2 mt-2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-32 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredExercises.length === 0 ? (
          <div className="text-center py-12">
            <Filter className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No exercises found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your filters or search query
            </p>
            <Button
              onClick={() => {
                setSearchQuery("")
                setSelectedMuscle("all")
                setSelectedEquipment("all")
                setSelectedDifficulty("all")
              }}
            >
              Clear all filters
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredExercises.map((exercise) => (
              <Link key={exercise.id} href={`/exercises/${exercise.id}`}>
                <Card className="h-full hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer group">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {exercise.name}
                      </CardTitle>
                      <Badge className={getDifficultyColor(exercise.difficulty)}>
                        {exercise.difficulty}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {exercise.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Muscle Groups */}
                    <div className="flex gap-1 flex-wrap">
                      {exercise.muscleGroups.map((muscle) => (
                        <Badge key={muscle} variant="secondary" className="text-xs">
                          {muscle}
                        </Badge>
                      ))}
                    </div>

                    {/* Equipment */}
                    <div className="flex gap-1 flex-wrap">
                      {exercise.equipment.slice(0, 3).map((eq) => (
                        <Badge key={eq} variant="outline" className="text-xs">
                          {eq}
                        </Badge>
                      ))}
                      {exercise.equipment.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{exercise.equipment.length - 3}
                        </Badge>
                      )}
                    </div>

                    {/* View Details Arrow */}
                    <div className="flex items-center justify-end text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      View details
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
