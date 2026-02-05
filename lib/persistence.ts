"use client"

import { useEffect, useState } from "react"
import { type Block } from "./block-types"

export type SaveStatus = "saved" | "saving" | "idle"

/**
 * Hook to automatically save blocks to localStorage with debouncing
 * @param blocks The blocks to save
 * @param delay Debounce delay in milliseconds (default: 600ms)
 * @returns The current save status
 */
export function useDebouncedSave(blocks: Block[], delay = 600): SaveStatus {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")

  useEffect(() => {
    if (blocks.length === 0) return

    setSaveStatus("saving")
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem("editor-blocks", JSON.stringify(blocks))
        setSaveStatus("saved")
        setTimeout(() => setSaveStatus("idle"), 2000)
      } catch (error) {
        console.error("Failed to save blocks:", error)
        setSaveStatus("idle")
      }
    }, delay)

    return () => clearTimeout(timeoutId)
  }, [blocks, delay])

  return saveStatus
}

/**
 * Load blocks from localStorage
 * @returns The saved blocks or null if none exist
 */
export function loadBlocks(): Block[] | null {
  if (typeof window === "undefined") return null
  
  try {
    const stored = localStorage.getItem("editor-blocks")
    return stored ? JSON.parse(stored) : null
  } catch (error) {
    console.error("Failed to load blocks:", error)
    return null
  }
}
