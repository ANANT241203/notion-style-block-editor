"use client"

import { useEffect, useRef, useState } from "react"
import { type BlockType, blockTypeConfig } from "@/lib/block-types"

interface SlashMenuProps {
  position: { top: number; left: number }
  onSelect: (type: BlockType) => void
  onClose: () => void
  filter: string
}

export function SlashMenu({ position, onSelect, onClose, filter }: SlashMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const blockTypes = Object.entries(blockTypeConfig).filter(([, config]) =>
    config.label.toLowerCase().includes(filter.toLowerCase())
  ) as [BlockType, (typeof blockTypeConfig)[BlockType]][]

  useEffect(() => {
    setSelectedIndex(0)
  }, [filter])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, blockTypes.length - 1))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === "Enter") {
        e.preventDefault()
        if (blockTypes[selectedIndex]) {
          onSelect(blockTypes[selectedIndex][0])
        }
      } else if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [blockTypes, selectedIndex, onSelect, onClose])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [onClose])

  if (blockTypes.length === 0) {
    return (
      <div
        ref={menuRef}
        className="fixed z-50 w-72 rounded-lg border border-border bg-popover p-2 shadow-lg"
        style={{ top: position.top, left: position.left }}
      >
        <p className="px-2 py-3 text-sm text-muted-foreground">No results</p>
      </div>
    )
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-72 rounded-lg border border-border bg-popover shadow-lg"
      style={{ top: position.top, left: position.left }}
    >
      <div className="p-2">
        <p className="px-2 pb-2 text-xs font-medium text-muted-foreground">BASIC BLOCKS</p>
        <div className="space-y-1">
          {blockTypes.map(([type, config], index) => (
            <button
              key={type}
              className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors duration-150 ease-out ${
                index === selectedIndex ? "bg-gray-100" : "hover:bg-gray-50"
              }`}
              onClick={() => onSelect(type)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-border bg-background text-sm font-medium">
                {config.icon}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{config.label}</p>
                <p className="truncate text-xs text-muted-foreground">{config.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
