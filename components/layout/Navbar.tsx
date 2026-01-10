import Link from "next/link"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Button } from "@/components/ui/button"
import { Dumbbell } from "lucide-react"

export default function Navbar({ userName, userImage }: { userName?: string; userImage?: string }) {
  const initial = userName ? userName[0].toUpperCase() : "T"

  return (
    <nav className="sticky top-0 z-20 bg-card/70 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="p-2 bg-black/90 text-white rounded-lg">
              <Dumbbell className="w-5 h-5" />
            </div>
            <span className="font-semibold text-lg">ThriveTrack</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-4">
            <Link href="/programs">
              <Button variant="ghost" size="sm">Programs</Button>
            </Link>
            <Link href="/workouts">
              <Button variant="ghost" size="sm">Workouts</Button>
            </Link>
            <Link href="/progress">
              <Button variant="ghost" size="sm">Progress</Button>
            </Link>
          </div>

          <ThemeToggle />
          <Link href="/profile">
            <Avatar className="h-9 w-9">
              <AvatarImage src={userImage || ""} />
              <AvatarFallback>{initial}</AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </nav>
  )
}
