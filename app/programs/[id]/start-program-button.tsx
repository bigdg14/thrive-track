"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { toast } from "sonner";

export default function StartProgramButton({ programId }: { programId: string }) {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);

  const handleStartProgram = async () => {
    setIsStarting(true);
    try {
      const res = await fetch("/api/programs/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programId }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to start program");
      }

      const data = await res.json();
      toast.success("Program started successfully!");
      router.push(`/programs/user/${data.userProgram.id}`);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to start program");
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <Button onClick={handleStartProgram} disabled={isStarting}>
      <Play className="mr-2 h-4 w-4" />
      {isStarting ? "Starting..." : "Start Program"}
    </Button>
  );
}
