"use client"

import { GripVertical, Plus, Trash2 } from "lucide-react"
import { type DraggableAttributes } from "@dnd-kit/core"
import { type SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities"

interface BlockControlsProps {
  onAddBlock: () => void
  onDelete: () => void
  attributes: DraggableAttributes
  listeners: SyntheticListenerMap | undefined
}

export function BlockControls({ onAddBlock, onDelete, attributes, listeners }: BlockControlsProps) {
  return (
    <div className="absolute -left-[5.125rem] top-2 flex items-center gap-1 opacity-0 transition-all duration-150 ease-out group-hover:opacity-100">
      <button
        onClick={onDelete}
        className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors duration-150 ease-out hover:bg-red-100 hover:text-red-600"
        title="Delete block"
      >
        <Trash2 className="h-4 w-4" />
      </button>
      <button
        onClick={onAddBlock}
        className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors duration-150 ease-out hover:bg-accent hover:text-foreground"
        title="Click to add below"
      >
        <Plus className="h-4 w-4" />
      </button>
      <button
        {...attributes}
        {...listeners}
        className="flex h-6 w-6 cursor-grab items-center justify-center rounded text-muted-foreground transition-colors duration-150 ease-out hover:bg-accent hover:text-foreground active:cursor-grabbing"
        title="Drag to move"
      >
        <GripVertical className="h-4 w-4" />
      </button>
    </div>
  )
}
