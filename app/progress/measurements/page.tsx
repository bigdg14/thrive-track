"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Scale, Trash2, TrendingDown, TrendingUp, ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import Link from "next/link";

interface Measurement {
  id: string;
  date: string;
  weight?: number;
  bodyFatPercent?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  biceps?: number;
  thighs?: number;
  calves?: number;
  shoulders?: number;
  neck?: number;
  notes?: string;
}

export default function MeasurementsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [weight, setWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [chest, setChest] = useState("");
  const [waist, setWaist] = useState("");
  const [hips, setHips] = useState("");
  const [biceps, setBiceps] = useState("");
  const [thighs, setThighs] = useState("");
  const [calves, setCalves] = useState("");
  const [shoulders, setShoulders] = useState("");
  const [neck, setNeck] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchMeasurements();
    }
  }, [status, router]);

  const fetchMeasurements = async () => {
    try {
      const response = await fetch("/api/measurements");
      const data = await response.json();
      setMeasurements(data.measurements || []);
    } catch (error) {
      console.error("Error fetching measurements:", error);
      toast.error("Failed to load measurements");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMeasurement = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate at least one measurement is provided
    if (!weight && !bodyFat && !chest && !waist && !hips && !biceps && !thighs && !calves && !shoulders && !neck) {
      toast.error("Please enter at least one measurement");
      return;
    }

    try {
      const response = await fetch("/api/measurements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          weight: weight ? parseFloat(weight) : undefined,
          bodyFatPercent: bodyFat ? parseFloat(bodyFat) : undefined,
          chest: chest ? parseFloat(chest) : undefined,
          waist: waist ? parseFloat(waist) : undefined,
          hips: hips ? parseFloat(hips) : undefined,
          biceps: biceps ? parseFloat(biceps) : undefined,
          thighs: thighs ? parseFloat(thighs) : undefined,
          calves: calves ? parseFloat(calves) : undefined,
          shoulders: shoulders ? parseFloat(shoulders) : undefined,
          neck: neck ? parseFloat(neck) : undefined,
          notes: notes || undefined,
        }),
      });

      if (!response.ok) throw new Error("Failed to create measurement");

      toast.success("Measurement added successfully!");
      setIsDialogOpen(false);
      resetForm();
      fetchMeasurements();
    } catch (error) {
      console.error("Error creating measurement:", error);
      toast.error("Failed to add measurement");
    }
  };

  const handleDeleteMeasurement = async (id: string) => {
    if (!confirm("Are you sure you want to delete this measurement?")) return;

    try {
      const response = await fetch(`/api/measurements/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete measurement");

      toast.success("Measurement deleted");
      fetchMeasurements();
    } catch (error) {
      console.error("Error deleting measurement:", error);
      toast.error("Failed to delete measurement");
    }
  };

  const resetForm = () => {
    setDate(format(new Date(), "yyyy-MM-dd"));
    setWeight("");
    setBodyFat("");
    setChest("");
    setWaist("");
    setHips("");
    setBiceps("");
    setThighs("");
    setCalves("");
    setShoulders("");
    setNeck("");
    setNotes("");
  };

  // Prepare chart data
  const weightChartData = measurements
    .filter(m => m.weight)
    .map(m => ({
      date: format(new Date(m.date), "MMM d"),
      weight: m.weight,
    }))
    .reverse();

  const bodyFatChartData = measurements
    .filter(m => m.bodyFatPercent)
    .map(m => ({
      date: format(new Date(m.date), "MMM d"),
      bodyFat: m.bodyFatPercent,
    }))
    .reverse();

  const bodyMeasurementsChartData = measurements
    .filter(m => m.chest || m.waist || m.hips)
    .map(m => ({
      date: format(new Date(m.date), "MMM d"),
      chest: m.chest,
      waist: m.waist,
      hips: m.hips,
    }))
    .reverse();

  // Calculate trends
  const getWeightTrend = () => {
    if (weightChartData.length < 2) return null;
    const latest = weightChartData[weightChartData.length - 1].weight!;
    const previous = weightChartData[weightChartData.length - 2].weight!;
    const diff = latest - previous;
    return diff;
  };

  const weightTrend = getWeightTrend();
  const latestMeasurement = measurements[0];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading measurements...</p>
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
                <Scale className="w-6 h-6 text-primary" />
                <h1 className="text-xl font-bold">Body Measurements</h1>
              </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                <Plus className="mr-2 h-4 w-4" />
                Add Measurement
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-white">Add Body Measurement</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Record your body measurements (enter at least one value)
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateMeasurement} className="space-y-4">
                <div>
                  <Label htmlFor="date" className="text-gray-300">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="weight" className="text-gray-300">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="70.5"
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bodyFat" className="text-gray-300">Body Fat (%)</Label>
                    <Input
                      id="bodyFat"
                      type="number"
                      step="0.1"
                      value={bodyFat}
                      onChange={(e) => setBodyFat(e.target.value)}
                      placeholder="15.5"
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="chest" className="text-gray-300">Chest (cm)</Label>
                    <Input
                      id="chest"
                      type="number"
                      step="0.1"
                      value={chest}
                      onChange={(e) => setChest(e.target.value)}
                      placeholder="100"
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="waist" className="text-gray-300">Waist (cm)</Label>
                    <Input
                      id="waist"
                      type="number"
                      step="0.1"
                      value={waist}
                      onChange={(e) => setWaist(e.target.value)}
                      placeholder="80"
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="hips" className="text-gray-300">Hips (cm)</Label>
                    <Input
                      id="hips"
                      type="number"
                      step="0.1"
                      value={hips}
                      onChange={(e) => setHips(e.target.value)}
                      placeholder="95"
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="biceps" className="text-gray-300">Biceps (cm)</Label>
                    <Input
                      id="biceps"
                      type="number"
                      step="0.1"
                      value={biceps}
                      onChange={(e) => setBiceps(e.target.value)}
                      placeholder="35"
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="thighs" className="text-gray-300">Thighs (cm)</Label>
                    <Input
                      id="thighs"
                      type="number"
                      step="0.1"
                      value={thighs}
                      onChange={(e) => setThighs(e.target.value)}
                      placeholder="55"
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="calves" className="text-gray-300">Calves (cm)</Label>
                    <Input
                      id="calves"
                      type="number"
                      step="0.1"
                      value={calves}
                      onChange={(e) => setCalves(e.target.value)}
                      placeholder="38"
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="shoulders" className="text-gray-300">Shoulders (cm)</Label>
                    <Input
                      id="shoulders"
                      type="number"
                      step="0.1"
                      value={shoulders}
                      onChange={(e) => setShoulders(e.target.value)}
                      placeholder="115"
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="neck" className="text-gray-300">Neck (cm)</Label>
                    <Input
                      id="neck"
                      type="number"
                      step="0.1"
                      value={neck}
                      onChange={(e) => setNeck(e.target.value)}
                      placeholder="38"
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes" className="text-gray-300">Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional notes..."
                    className="bg-zinc-800 border-zinc-700 text-white"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                    Add Measurement
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1 border-zinc-700 text-white hover:bg-zinc-800"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        {latestMeasurement && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
                  <Scale className="mr-2 h-4 w-4" />
                  Current Weight
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">
                  {latestMeasurement.weight?.toFixed(1) || "-"} kg
                </p>
                {weightTrend !== null && (
                  <div className={`flex items-center text-sm mt-1 ${weightTrend > 0 ? "text-red-500" : weightTrend < 0 ? "text-green-500" : "text-gray-400"}`}>
                    {weightTrend > 0 ? (
                      <><TrendingUp className="h-4 w-4 mr-1" /> +{weightTrend.toFixed(1)} kg</>
                    ) : weightTrend < 0 ? (
                      <><TrendingDown className="h-4 w-4 mr-1" /> {weightTrend.toFixed(1)} kg</>
                    ) : (
                      "No change"
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">Body Fat</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">
                  {latestMeasurement.bodyFatPercent?.toFixed(1) || "-"}%
                </p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">Waist</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">
                  {latestMeasurement.waist?.toFixed(1) || "-"} cm
                </p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">Total Measurements</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">{measurements.length}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts and History */}
        <Tabs defaultValue="charts" className="w-full">
          <TabsList className="bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="charts" className="data-[state=active]:bg-zinc-800">
              Charts
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-zinc-800">
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="charts" className="mt-6 space-y-6">
            {/* Weight Chart */}
            {weightChartData.length > 0 && (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white">Weight Trend</CardTitle>
                  <CardDescription className="text-gray-400">
                    Your weight progress over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={weightChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="date" stroke="#71717a" />
                      <YAxis stroke="#71717a" />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a" }}
                        labelStyle={{ color: "#a1a1aa" }}
                      />
                      <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Body Fat Chart */}
            {bodyFatChartData.length > 0 && (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white">Body Fat Percentage</CardTitle>
                  <CardDescription className="text-gray-400">
                    Track your body fat percentage changes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={bodyFatChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="date" stroke="#71717a" />
                      <YAxis stroke="#71717a" />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a" }}
                        labelStyle={{ color: "#a1a1aa" }}
                      />
                      <Line type="monotone" dataKey="bodyFat" stroke="#22c55e" strokeWidth={2} dot={{ fill: "#22c55e" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Body Measurements Chart */}
            {bodyMeasurementsChartData.length > 0 && (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white">Body Measurements</CardTitle>
                  <CardDescription className="text-gray-400">
                    Chest, waist, and hips measurements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={bodyMeasurementsChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="date" stroke="#71717a" />
                      <YAxis stroke="#71717a" />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a" }}
                        labelStyle={{ color: "#a1a1aa" }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="chest" stroke="#3b82f6" strokeWidth={2} />
                      <Line type="monotone" dataKey="waist" stroke="#f59e0b" strokeWidth={2} />
                      <Line type="monotone" dataKey="hips" stroke="#8b5cf6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {measurements.length === 0 && (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-12 text-center">
                  <Scale className="mx-auto h-12 w-12 text-gray-600 mb-4" />
                  <p className="text-gray-400 mb-4">No measurements recorded yet</p>
                  <Button
                    onClick={() => setIsDialogOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Measurement
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            {measurements.length === 0 ? (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-12 text-center">
                  <Scale className="mx-auto h-12 w-12 text-gray-600 mb-4" />
                  <p className="text-gray-400 mb-4">No measurements recorded yet</p>
                  <Button
                    onClick={() => setIsDialogOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Measurement
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {measurements.map((measurement) => (
                  <Card key={measurement.id} className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-white text-lg">
                            {format(new Date(measurement.date), "MMMM d, yyyy")}
                          </CardTitle>
                          {measurement.notes && (
                            <CardDescription className="text-gray-400 mt-1">
                              {measurement.notes}
                            </CardDescription>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteMeasurement(measurement.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        {measurement.weight && (
                          <div>
                            <p className="text-gray-400">Weight</p>
                            <p className="text-white font-medium">{measurement.weight.toFixed(1)} kg</p>
                          </div>
                        )}
                        {measurement.bodyFatPercent && (
                          <div>
                            <p className="text-gray-400">Body Fat</p>
                            <p className="text-white font-medium">{measurement.bodyFatPercent.toFixed(1)}%</p>
                          </div>
                        )}
                        {measurement.chest && (
                          <div>
                            <p className="text-gray-400">Chest</p>
                            <p className="text-white font-medium">{measurement.chest.toFixed(1)} cm</p>
                          </div>
                        )}
                        {measurement.waist && (
                          <div>
                            <p className="text-gray-400">Waist</p>
                            <p className="text-white font-medium">{measurement.waist.toFixed(1)} cm</p>
                          </div>
                        )}
                        {measurement.hips && (
                          <div>
                            <p className="text-gray-400">Hips</p>
                            <p className="text-white font-medium">{measurement.hips.toFixed(1)} cm</p>
                          </div>
                        )}
                        {measurement.biceps && (
                          <div>
                            <p className="text-gray-400">Biceps</p>
                            <p className="text-white font-medium">{measurement.biceps.toFixed(1)} cm</p>
                          </div>
                        )}
                        {measurement.thighs && (
                          <div>
                            <p className="text-gray-400">Thighs</p>
                            <p className="text-white font-medium">{measurement.thighs.toFixed(1)} cm</p>
                          </div>
                        )}
                        {measurement.calves && (
                          <div>
                            <p className="text-gray-400">Calves</p>
                            <p className="text-white font-medium">{measurement.calves.toFixed(1)} cm</p>
                          </div>
                        )}
                        {measurement.shoulders && (
                          <div>
                            <p className="text-gray-400">Shoulders</p>
                            <p className="text-white font-medium">{measurement.shoulders.toFixed(1)} cm</p>
                          </div>
                        )}
                        {measurement.neck && (
                          <div>
                            <p className="text-gray-400">Neck</p>
                            <p className="text-white font-medium">{measurement.neck.toFixed(1)} cm</p>
                          </div>
                        )}
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
