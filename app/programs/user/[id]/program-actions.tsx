"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Pause, Play, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface ProgramActionsProps {
  userProgramId: string;
  status: string;
}

export default function ProgramActions({ userProgramId, status }: ProgramActionsProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  const updateStatus = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/programs/user/${userProgramId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update program status");
      }

      toast.success(`Program ${newStatus === "paused" ? "paused" : newStatus === "completed" ? "completed" : "resumed"}!`);
      router.refresh();
    } catch (error) {
      toast.error("Failed to update program");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" disabled={isUpdating}>
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {status === "active" && (
          <>
            <DropdownMenuItem onClick={() => updateStatus("paused")}>
              <Pause className="mr-2 h-4 w-4" />
              Pause Program
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updateStatus("completed")}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Mark Complete
            </DropdownMenuItem>
          </>
        )}
        {status === "paused" && (
          <DropdownMenuItem onClick={() => updateStatus("active")}>
            <Play className="mr-2 h-4 w-4" />
            Resume Program
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
