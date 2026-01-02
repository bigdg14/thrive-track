import { create } from 'zustand'

type Exercise = {
  id: string
  name: string
  muscleGroups: string[]
  difficulty: string
  gifUrl: string | null
}

type WorkoutSet = {
  id: string
  setNumber: number
  reps: number | null
  weight: number | null
  duration: number | null
  distance: number | null
  completedAt: Date | null
}

type WorkoutExercise = {
  id: string
  exercise: Exercise
  sets: WorkoutSet[]
  notes: string
}

type WorkoutState = {
  // Workout data
  workoutId: string | null
  startedAt: Date | null
  exercises: WorkoutExercise[]
  currentExerciseIndex: number
  notes: string

  // Rest timer
  isResting: boolean
  restDuration: number
  restTimeRemaining: number
  restTimerId: NodeJS.Timeout | null

  // Actions
  startWorkout: () => void
  addExercise: (exercise: Exercise) => void
  removeExercise: (exerciseId: string) => void
  addSet: (exerciseId: string) => void
  updateSet: (exerciseId: string, setId: string, data: Partial<WorkoutSet>) => void
  removeSet: (exerciseId: string, setId: string) => void
  setCurrentExercise: (index: number) => void
  setNotes: (notes: string) => void

  // Rest timer actions
  startRestTimer: (duration: number) => void
  pauseRestTimer: () => void
  resumeRestTimer: () => void
  stopRestTimer: () => void

  // Workout lifecycle
  finishWorkout: () => Promise<void>
  cancelWorkout: () => void
  reset: () => void
}

const generateId = () => Math.random().toString(36).substr(2, 9)

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  // Initial state
  workoutId: null,
  startedAt: null,
  exercises: [],
  currentExerciseIndex: 0,
  notes: '',
  isResting: false,
  restDuration: 90, // Default 90 seconds
  restTimeRemaining: 90,
  restTimerId: null,

  // Start a new workout
  startWorkout: () => {
    set({
      workoutId: generateId(),
      startedAt: new Date(),
      exercises: [],
      currentExerciseIndex: 0,
      notes: '',
    })
  },

  // Add an exercise to the workout
  addExercise: (exercise) => {
    const newExercise: WorkoutExercise = {
      id: generateId(),
      exercise,
      sets: [],
      notes: '',
    }
    set((state) => ({
      exercises: [...state.exercises, newExercise],
    }))
  },

  // Remove an exercise
  removeExercise: (exerciseId) => {
    set((state) => ({
      exercises: state.exercises.filter((e) => e.id !== exerciseId),
    }))
  },

  // Add a set to an exercise
  addSet: (exerciseId) => {
    set((state) => {
      const exercises = state.exercises.map((ex) => {
        if (ex.id === exerciseId) {
          const newSet: WorkoutSet = {
            id: generateId(),
            setNumber: ex.sets.length + 1,
            reps: null,
            weight: null,
            duration: null,
            distance: null,
            completedAt: null,
          }
          return {
            ...ex,
            sets: [...ex.sets, newSet],
          }
        }
        return ex
      })
      return { exercises }
    })
  },

  // Update a set
  updateSet: (exerciseId, setId, data) => {
    set((state) => {
      const exercises = state.exercises.map((ex) => {
        if (ex.id === exerciseId) {
          const sets = ex.sets.map((s) => {
            if (s.id === setId) {
              return { ...s, ...data, completedAt: new Date() }
            }
            return s
          })
          return { ...ex, sets }
        }
        return ex
      })
      return { exercises }
    })
  },

  // Remove a set
  removeSet: (exerciseId, setId) => {
    set((state) => {
      const exercises = state.exercises.map((ex) => {
        if (ex.id === exerciseId) {
          const sets = ex.sets
            .filter((s) => s.id !== setId)
            .map((s, index) => ({ ...s, setNumber: index + 1 }))
          return { ...ex, sets }
        }
        return ex
      })
      return { exercises }
    })
  },

  // Set current exercise
  setCurrentExercise: (index) => {
    set({ currentExerciseIndex: index })
  },

  // Set workout notes
  setNotes: (notes) => {
    set({ notes })
  },

  // Start rest timer
  startRestTimer: (duration) => {
    const state = get()
    if (state.restTimerId) {
      clearInterval(state.restTimerId)
    }

    set({
      isResting: true,
      restDuration: duration,
      restTimeRemaining: duration,
    })

    const timerId = setInterval(() => {
      const currentState = get()
      const newTime = currentState.restTimeRemaining - 1

      if (newTime <= 0) {
        // Timer finished - play audio alert
        if (typeof window !== 'undefined' && window.Audio) {
          const audio = new Audio('/sounds/timer-complete.mp3')
          audio.play().catch(() => {
            // Fallback if audio doesn't play
            console.log('Timer complete!')
          })
        }
        get().stopRestTimer()
      } else {
        set({ restTimeRemaining: newTime })
      }
    }, 1000)

    set({ restTimerId: timerId })
  },

  // Pause rest timer
  pauseRestTimer: () => {
    const state = get()
    if (state.restTimerId) {
      clearInterval(state.restTimerId)
      set({ restTimerId: null })
    }
  },

  // Resume rest timer
  resumeRestTimer: () => {
    const state = get()
    if (!state.restTimerId && state.isResting) {
      const timerId = setInterval(() => {
        const currentState = get()
        const newTime = currentState.restTimeRemaining - 1

        if (newTime <= 0) {
          if (typeof window !== 'undefined' && window.Audio) {
            const audio = new Audio('/sounds/timer-complete.mp3')
            audio.play().catch(() => {})
          }
          get().stopRestTimer()
        } else {
          set({ restTimeRemaining: newTime })
        }
      }, 1000)

      set({ restTimerId: timerId })
    }
  },

  // Stop rest timer
  stopRestTimer: () => {
    const state = get()
    if (state.restTimerId) {
      clearInterval(state.restTimerId)
    }
    set({
      isResting: false,
      restTimerId: null,
      restTimeRemaining: state.restDuration,
    })
  },

  // Finish workout and save to database
  finishWorkout: async () => {
    const state = get()

    if (!state.startedAt || state.exercises.length === 0) {
      throw new Error('No workout to save')
    }

    const endedAt = new Date()
    const duration = Math.floor((endedAt.getTime() - state.startedAt.getTime()) / 1000 / 60)

    // Calculate total volume
    const totalVolume = state.exercises.reduce((total, ex) => {
      return total + ex.sets.reduce((setTotal, set) => {
        if (set.reps && set.weight) {
          return setTotal + (set.reps * set.weight)
        }
        return setTotal
      }, 0)
    }, 0)

    const workoutData = {
      startedAt: state.startedAt,
      endedAt,
      duration,
      notes: state.notes,
      totalVolume,
      exercises: state.exercises.map((ex) => ({
        exerciseId: ex.exercise.id,
        notes: ex.notes,
        sets: ex.sets.map((set) => ({
          setNumber: set.setNumber,
          reps: set.reps,
          weight: set.weight,
          duration: set.duration,
          distance: set.distance,
          completedAt: set.completedAt,
        })),
      })),
    }

    // Save to database
    const response = await fetch('/api/workouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workoutData),
    })

    if (!response.ok) {
      throw new Error('Failed to save workout')
    }

    const data = await response.json()

    // Reset the store
    get().reset()

    return data
  },

  // Cancel workout
  cancelWorkout: () => {
    const state = get()
    if (state.restTimerId) {
      clearInterval(state.restTimerId)
    }
    get().reset()
  },

  // Reset store
  reset: () => {
    set({
      workoutId: null,
      startedAt: null,
      exercises: [],
      currentExerciseIndex: 0,
      notes: '',
      isResting: false,
      restDuration: 90,
      restTimeRemaining: 90,
      restTimerId: null,
    })
  },
}))
