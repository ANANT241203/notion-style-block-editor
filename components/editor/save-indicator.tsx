"use client"

import { Check, LoaderCircle } from "lucide-react"
import { type SaveStatus } from "@/lib/persistence"

interface SaveIndicatorProps {
  status: SaveStatus
}

export function SaveIndicator({ status }: SaveIndicatorProps) {
  if (status === "idle") return null

  return (
    <div className="fixed bottom-4 right-4 flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm shadow-md transition-all duration-150 ease-out">
      {status === "saving" ? (
        <>
          <LoaderCircle className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Saving...</span>
        </>
      ) : (
        <>
          <Check className="h-4 w-4 text-green-600 dark:text-green-500" />
          <span className="text-foreground">Saved</span>
        </>
      )}
    </div>
  )
}
