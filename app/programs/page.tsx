"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Dumbbell, ChevronLeft, Clock, TrendingUp, Users, Plus } from "lucide-react";
import Link from "next/link";

interface WorkoutProgram {
  id: string;
  name: string;
  description: string | null;
  difficulty: string;
  durationWeeks: number;
  isSystemProgram: boolean;
  _count?: {
    programWorkouts: number;
  };
}

interface UserProgram {
  id: string;
  currentWeek: number;
  currentDay: number;
  status: string;
  startedAt: string;
  program: WorkoutProgram;
}

export default function ProgramsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [systemPrograms, setSystemPrograms] = useState<WorkoutProgram[]>([]);
  const [userPrograms, setUserPrograms] = useState<UserProgram[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      fetchPrograms();
    }
  }, [status, router]);

  const fetchPrograms = async () => {
    try {
      // Fetch system programs
      const systemRes = await fetch("/api/programs");
      if (systemRes.ok) {
        const data = await systemRes.json();
        setSystemPrograms(data.programs || []);
      }

      // Fetch user's active programs
      const userRes = await fetch("/api/programs/user");
      if (userRes.ok) {
        const data = await userRes.json();
        setUserPrograms(data.programs || []);
      }
    } catch (error) {
      console.error("Error fetching programs:", error);
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading programs...</p>
      </div>
    );
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
                <Calendar className="w-6 h-6 text-primary" />
                <h1 className="text-xl font-bold">Workout Programs</h1>
              </div>
            </div>

            <Link href="/programs/create">
              <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                <Plus className="mr-2 h-4 w-4" />
                Create Program
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="browse">Browse Programs</TabsTrigger>
            <TabsTrigger value="my-programs">My Programs ({userPrograms.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6 mt-6">
            {systemPrograms.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="py-12 text-center">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Programs Available</h3>
                  <p className="text-muted-foreground mb-4">
                    There are no pre-built programs available yet.
                  </p>
                  <Link href="/programs/create">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your Own
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {systemPrograms.map((program) => (
                  <Card key={program.id} className="bg-card border-border hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <CardTitle className="text-lg">{program.name}</CardTitle>
                        <Badge className={getDifficultyColor(program.difficulty)}>
                          {program.difficulty}
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {program.description || "No description available"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{program.durationWeeks} weeks</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Dumbbell className="w-4 h-4" />
                          <span>{program._count?.programWorkouts || 0} workouts</span>
                        </div>
                      </div>

                      <Link href={`/programs/${program.id}`}>
                        <Button className="w-full" variant="outline">
                          View Details
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-programs" className="space-y-6 mt-6">
            {userPrograms.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="py-12 text-center">
                  <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Active Programs</h3>
                  <p className="text-muted-foreground mb-4">
                    You haven't started any programs yet. Browse available programs to get started!
                  </p>
                  <Button onClick={() => document.querySelector('[value="browse"]')?.dispatchEvent(new MouseEvent('click'))}>
                    Browse Programs
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {userPrograms.map((userProgram) => (
                  <Card key={userProgram.id} className="bg-card border-border">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <CardTitle className="text-lg">{userProgram.program.name}</CardTitle>
                        <Badge variant={userProgram.status === "active" ? "default" : "secondary"}>
                          {userProgram.status}
                        </Badge>
                      </div>
                      <CardDescription>
                        Week {userProgram.currentWeek} of {userProgram.program.durationWeeks}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">
                            {Math.round((userProgram.currentWeek / userProgram.program.durationWeeks) * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className="bg-primary rounded-full h-2 transition-all"
                            style={{ width: `${(userProgram.currentWeek / userProgram.program.durationWeeks) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <TrendingUp className="w-4 h-4" />
                        <span>
                          Started {new Date(userProgram.startedAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <Link href={`/programs/${userProgram.program.id}`} className="flex-1">
                          <Button variant="outline" className="w-full">
                            View Program
                          </Button>
                        </Link>
                        <Link href={`/programs/user/${userProgram.id}`} className="flex-1">
                          <Button className="w-full">
                            Continue
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
