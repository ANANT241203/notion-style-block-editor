"use client"

import React from "react"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { type Block, type BlockType, generateId } from "@/lib/block-types"
import { useDebouncedSave, loadBlocks } from "@/lib/persistence"
import { EditableBlock } from "./editable-block"
import { SaveIndicator } from "./save-indicator"

const initialBlocks: Block[] = [
  {
    id: generateId(),
    type: "heading1",
    content: "Welcome to the Block Editor",
  },
  {
    id: generateId(),
    type: "paragraph",
    content: "This is a Notion-style block editor. Each block is editable and you can change its type using slash commands.",
  },
  {
    id: generateId(),
    type: "heading2",
    content: "Getting Started",
  },
  {
    id: generateId(),
    type: "paragraph",
    content: "Hover over any block to see the drag handle and plus button. Click the plus button to add a new block below.",
  },
  {
    id: generateId(),
    type: "heading3",
    content: "Slash Commands",
  },
  {
    id: generateId(),
    type: "paragraph",
    content: "Type / anywhere to open the command menu and change the block type.",
  },
  {
    id: generateId(),
    type: "todo",
    content: "Try adding a new block",
    checked: false,
  },
  {
    id: generateId(),
    type: "todo",
    content: "Convert a block using slash commands",
    checked: false,
  },
  {
    id: generateId(),
    type: "todo",
    content: "Drag blocks to reorder them",
    checked: true,
  },
]

export function BlockEditor() {
  // Always use initialBlocks for SSR and initial render to avoid hydration mismatch
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks)
  const [isMounted, setIsMounted] = useState(false)
  const blockRefs = useRef<Map<string, HTMLDivElement | null>>(new Map())
  const saveStatus = useDebouncedSave(blocks)
  
  // Mark as mounted to enable dnd-kit (client-only)
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  // Load from localStorage after hydration completes
  useEffect(() => {
    const saved = loadBlocks()
    if (saved) {
      setBlocks(saved)
    }
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const registerRef = useCallback((id: string, ref: HTMLDivElement | null) => {
    if (ref) {
      blockRefs.current.set(id, ref)
    } else {
      blockRefs.current.delete(id)
    }
  }, [])

  const focusBlock = useCallback((id: string) => {
    requestAnimationFrame(() => {
      const ref = blockRefs.current.get(id)
      if (ref) {
        ref.focus()
        const range = document.createRange()
        range.selectNodeContents(ref)
        range.collapse(false)
        const sel = window.getSelection()
        sel?.removeAllRanges()
        sel?.addRange(range)
      }
    })
  }, [])

  const handleUpdateBlock = useCallback((updatedBlock: Block) => {
    setBlocks((prev) =>
      prev.map((block) => (block.id === updatedBlock.id ? updatedBlock : block))
    )
  }, [])

  const handleDeleteBlock = useCallback((id: string) => {
    setBlocks((prev) => {
      if (prev.length === 1) return prev
      return prev.filter((block) => block.id !== id)
    })
  }, [])

  const handleAddBlock = useCallback(
    (afterId: string, type: BlockType = "paragraph", initialContent = "") => {
      const newBlock: Block = {
        id: generateId(),
        type,
        content: initialContent,
        checked: type === "todo" ? false : undefined,
      }

      setBlocks((prev) => {
        const index = prev.findIndex((block) => block.id === afterId)
        const newBlocks = [...prev]
        newBlocks.splice(index + 1, 0, newBlock)
        return newBlocks
      })

      focusBlock(newBlock.id)
    },
    [focusBlock]
  )

  const handleFocusNext = useCallback(
    (currentId: string) => {
      const currentIndex = blocks.findIndex((block) => block.id === currentId)
      if (currentIndex < blocks.length - 1) {
        focusBlock(blocks[currentIndex + 1].id)
      }
    },
    [blocks, focusBlock]
  )

  const handleFocusPrev = useCallback(
    (currentId: string) => {
      const currentIndex = blocks.findIndex((block) => block.id === currentId)
      if (currentIndex > 0) {
        focusBlock(blocks[currentIndex - 1].id)
      }
    },
    [blocks, focusBlock]
  )

  const handleMergeWithPrevious = useCallback(
    (currentId: string, content: string) => {
      const currentIndex = blocks.findIndex((block) => block.id === currentId)
      if (currentIndex === 0) return

      const previousBlock = blocks[currentIndex - 1]

      setBlocks((prev) => {
        const newBlocks = [...prev]
        newBlocks[currentIndex - 1] = {
          ...previousBlock,
          content: previousBlock.content + content,
        }
        newBlocks.splice(currentIndex, 1)
        return newBlocks
      })

      requestAnimationFrame(() => {
        const ref = blockRefs.current.get(previousBlock.id)
        if (ref) {
          ref.focus()
          const range = document.createRange()
          range.selectNodeContents(ref)
          range.collapse(false)
          const sel = window.getSelection()
          sel?.removeAllRanges()
          sel?.addRange(range)
        }
      })
    },
    [blocks]
  )

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setBlocks((prev) => {
        const oldIndex = prev.findIndex((block) => block.id === active.id)
        const newIndex = prev.findIndex((block) => block.id === over.id)
        return arrayMove(prev, oldIndex, newIndex)
      })
    }
  }, [])

  const content = (
    <div className="mx-auto max-w-2xl px-16 py-12">
      <div className="space-y-2">
        {blocks.map((block) => (
          <EditableBlock
            key={block.id}
            block={block}
            onUpdate={handleUpdateBlock}
            onDelete={handleDeleteBlock}
            onAddBlock={handleAddBlock}
            onMergeWithPrevious={handleMergeWithPrevious}
            onFocusNext={() => handleFocusNext(block.id)}
            onFocusPrev={() => handleFocusPrev(block.id)}
            registerRef={registerRef}
          />
        ))}
      </div>
    </div>
  )

  return (
    <>
      {isMounted ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="mx-auto max-w-2xl px-16 py-12">
            <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {blocks.map((block) => (
                  <EditableBlock
                    key={block.id}
                    block={block}
                    onUpdate={handleUpdateBlock}
                    onDelete={handleDeleteBlock}
                    onAddBlock={handleAddBlock}
                    onMergeWithPrevious={handleMergeWithPrevious}
                    onFocusNext={() => handleFocusNext(block.id)}
                    onFocusPrev={() => handleFocusPrev(block.id)}
                    registerRef={registerRef}
                  />
                ))}
              </div>
            </SortableContext>
          </div>
        </DndContext>
      ) : (
        content
      )}
      <SaveIndicator status={saveStatus} />
    </>
  )
}
