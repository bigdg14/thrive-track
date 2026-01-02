"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  ChevronLeft,
  Settings as SettingsIcon,
  Palette,
  Ruler,
  Bell,
  Save,
  Check
} from "lucide-react"
import { toast } from "sonner"

type UserSettings = {
  unitsPreference: "metric" | "imperial"
  notificationSettings: {
    workoutReminders: boolean
    achievementAlerts: boolean
    weeklyReports: boolean
  }
}

export default function SettingsPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [settings, setSettings] = useState<UserSettings>({
    unitsPreference: "metric",
    notificationSettings: {
      workoutReminders: true,
      achievementAlerts: true,
      weeklyReports: false,
    },
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch with theme
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch current settings
  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch("/api/user/settings")
        if (!response.ok) throw new Error("Failed to fetch settings")
        const data = await response.json()
        setSettings(data.settings)
      } catch (error) {
        console.error("Error fetching settings:", error)
        toast.error("Failed to load settings")
      } finally {
        setIsLoading(false)
      }
    }
    fetchSettings()
  }, [])

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (!response.ok) throw new Error("Failed to save settings")

      toast.success("Settings saved successfully!", {
        icon: <Check className="w-4 h-4" />,
      })
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error("Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  const handleUnitsChange = (value: string) => {
    setSettings({
      ...settings,
      unitsPreference: value as "metric" | "imperial",
    })
  }

  const handleNotificationToggle = (key: keyof UserSettings["notificationSettings"]) => {
    setSettings({
      ...settings,
      notificationSettings: {
        ...settings.notificationSettings,
        [key]: !settings.notificationSettings[key],
      },
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <SettingsIcon className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold">Settings</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-3xl">
        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              <CardTitle>Appearance</CardTitle>
            </div>
            <CardDescription>Customize how ThriveTrack looks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Theme</Label>
              {mounted && (
                <RadioGroup value={theme} onValueChange={setTheme}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="light" id="light" />
                    <Label htmlFor="light" className="font-normal cursor-pointer">
                      Light - Clean and bright interface
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dark" id="dark" />
                    <Label htmlFor="dark" className="font-normal cursor-pointer">
                      Dark - Easy on the eyes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="system" id="system" />
                    <Label htmlFor="system" className="font-normal cursor-pointer">
                      System - Match your device settings
                    </Label>
                  </div>
                </RadioGroup>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Units & Measurements */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Ruler className="w-5 h-5 text-primary" />
              <CardTitle>Units & Measurements</CardTitle>
            </div>
            <CardDescription>Choose your preferred unit system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Unit System</Label>
              <RadioGroup value={settings.unitsPreference} onValueChange={handleUnitsChange}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="metric" id="metric" />
                  <Label htmlFor="metric" className="font-normal cursor-pointer">
                    <div>
                      <div className="font-medium">Metric</div>
                      <div className="text-sm text-muted-foreground">
                        Kilograms (kg), Centimeters (cm)
                      </div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="imperial" id="imperial" />
                  <Label htmlFor="imperial" className="font-normal cursor-pointer">
                    <div>
                      <div className="font-medium">Imperial</div>
                      <div className="text-sm text-muted-foreground">
                        Pounds (lbs), Inches (in)
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>Manage your notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="workout-reminders">Workout Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Get reminded to log your workouts
                </p>
              </div>
              <Switch
                id="workout-reminders"
                checked={settings.notificationSettings.workoutReminders}
                onCheckedChange={() => handleNotificationToggle("workoutReminders")}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="achievement-alerts">Achievement Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when you hit new personal records
                </p>
              </div>
              <Switch
                id="achievement-alerts"
                checked={settings.notificationSettings.achievementAlerts}
                onCheckedChange={() => handleNotificationToggle("achievementAlerts")}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="weekly-reports">Weekly Progress Reports</Label>
                <p className="text-sm text-muted-foreground">
                  Receive weekly summaries of your progress
                </p>
              </div>
              <Switch
                id="weekly-reports"
                checked={settings.notificationSettings.weeklyReports}
                onCheckedChange={() => handleNotificationToggle("weeklyReports")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Link href="/dashboard">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button onClick={handleSaveSettings} disabled={isSaving} className="gap-2">
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </main>
    </div>
  )
}
