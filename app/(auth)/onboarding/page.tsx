"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Dumbbell, Target, Activity, User, TrendingUp, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

type FitnessLevel = "beginner" | "intermediate" | "advanced"
type Goal = "weight_loss" | "muscle_gain" | "strength" | "endurance" | "general_fitness"
type ActivityLevel = "sedentary" | "lightly_active" | "active" | "very_active"
type Gender = "male" | "female" | "other" | "prefer_not_to_say"

export default function OnboardingPage() {
  const router = useRouter()
  const { data: session, update } = useSession()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    fitnessLevel: "" as FitnessLevel | "",
    primaryGoals: [] as Goal[],
    height: "",
    weight: "",
    age: "",
    gender: "" as Gender | "",
    activityLevel: "" as ActivityLevel | "",
  })

  const totalSteps = 4
  const progress = (step / totalSteps) * 100

  const fitnessLevels: { value: FitnessLevel; label: string; description: string }[] = [
    { value: "beginner", label: "Beginner", description: "New to fitness or getting back after a break" },
    { value: "intermediate", label: "Intermediate", description: "Workout regularly, know the basics" },
    { value: "advanced", label: "Advanced", description: "Experienced, have specific training goals" },
  ]

  const goals: { value: Goal; label: string; icon: typeof Target }[] = [
    { value: "weight_loss", label: "Weight Loss", icon: TrendingUp },
    { value: "muscle_gain", label: "Muscle Gain", icon: Dumbbell },
    { value: "strength", label: "Strength", icon: Activity },
    { value: "endurance", label: "Endurance", icon: Target },
    { value: "general_fitness", label: "General Fitness", icon: CheckCircle2 },
  ]

  const activityLevels: { value: ActivityLevel; label: string; description: string }[] = [
    { value: "sedentary", label: "Sedentary", description: "Little to no exercise" },
    { value: "lightly_active", label: "Lightly Active", description: "Exercise 1-3 days/week" },
    { value: "active", label: "Active", description: "Exercise 4-5 days/week" },
    { value: "very_active", label: "Very Active", description: "Exercise 6-7 days/week" },
  ]

  const toggleGoal = (goal: Goal) => {
    if (formData.primaryGoals.includes(goal)) {
      setFormData({
        ...formData,
        primaryGoals: formData.primaryGoals.filter((g) => g !== goal),
      })
    } else {
      setFormData({
        ...formData,
        primaryGoals: [...formData.primaryGoals, goal],
      })
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.fitnessLevel !== ""
      case 2:
        return formData.primaryGoals.length > 0
      case 3:
        return formData.height && formData.weight && formData.age && formData.gender
      case 4:
        return formData.activityLevel !== ""
      default:
        return false
    }
  }

  const handleSubmit = async () => {
    if (!session?.user?.id) {
      toast.error("You must be logged in")
      router.push("/login")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fitnessLevel: formData.fitnessLevel,
          primaryGoals: formData.primaryGoals,
          height: parseFloat(formData.height),
          weight: parseFloat(formData.weight),
          age: parseInt(formData.age),
          gender: formData.gender,
          activityLevel: formData.activityLevel,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update profile")
      }

      toast.success("Profile completed!", {
        description: "Welcome to your fitness journey!",
      })

      // Update session
      await update()

      router.push("/dashboard")
      router.refresh()
    } catch (error) {
      toast.error("Failed to save profile", {
        description: "Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-4 bg-primary/10 rounded-full">
              <Dumbbell className="w-12 h-12 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">Let's Get Started!</h1>
          <p className="text-muted-foreground">Help us personalize your fitness experience</p>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Step {step} of {totalSteps}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Steps */}
        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 && "What's your fitness level?"}
              {step === 2 && "What are your goals?"}
              {step === 3 && "Tell us about yourself"}
              {step === 4 && "How active are you?"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "This helps us recommend appropriate workouts"}
              {step === 2 && "You can select multiple goals"}
              {step === 3 && "We'll use this to calculate personalized recommendations"}
              {step === 4 && "This helps us understand your current routine"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Fitness Level */}
            {step === 1 && (
              <div className="space-y-3">
                {fitnessLevels.map((level) => (
                  <button
                    key={level.value}
                    onClick={() => setFormData({ ...formData, fitnessLevel: level.value })}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      formData.fitnessLevel === level.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{level.label}</p>
                        <p className="text-sm text-muted-foreground">{level.description}</p>
                      </div>
                      {formData.fitnessLevel === level.value && (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Step 2: Goals */}
            {step === 2 && (
              <div className="grid grid-cols-2 gap-3">
                {goals.map((goal) => {
                  const Icon = goal.icon
                  const isSelected = formData.primaryGoals.includes(goal.value)
                  return (
                    <button
                      key={goal.value}
                      onClick={() => toggleGoal(goal.value)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2 text-center">
                        <Icon className={`w-8 h-8 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                        <p className="font-medium text-sm">{goal.label}</p>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Step 3: Personal Info */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      placeholder="170"
                      value={formData.height}
                      onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      placeholder="70"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="25"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "male", label: "Male" },
                      { value: "female", label: "Female" },
                      { value: "other", label: "Other" },
                      { value: "prefer_not_to_say", label: "Prefer not to say" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setFormData({ ...formData, gender: option.value as Gender })}
                        className={`p-3 rounded-lg border-2 text-sm transition-all ${
                          formData.gender === option.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Activity Level */}
            {step === 4 && (
              <div className="space-y-3">
                {activityLevels.map((level) => (
                  <button
                    key={level.value}
                    onClick={() => setFormData({ ...formData, activityLevel: level.value })}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      formData.activityLevel === level.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{level.label}</p>
                        <p className="text-sm text-muted-foreground">{level.description}</p>
                      </div>
                      {formData.activityLevel === level.value && (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setStep(step - 1)}
            disabled={step === 1 || isLoading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          {step < totalSteps ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed() || isLoading}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!canProceed() || isLoading}>
              {isLoading ? "Saving..." : "Complete Setup"}
              <CheckCircle2 className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
