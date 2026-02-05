"use client"

import React from "react"

import { useEffect, useRef, useState, useCallback } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { type Block, type BlockType, blockTypeConfig } from "@/lib/block-types"
import { getCaretPosition, setCaretPosition } from "@/lib/caret-utils"
import { BlockControls } from "./block-controls"
import { SlashMenu } from "./slash-menu"
import { Check } from "lucide-react"

interface EditableBlockProps {
  block: Block
  onUpdate: (block: Block) => void
  onDelete: (id: string) => void
  onAddBlock: (afterId: string, type?: BlockType, initialContent?: string) => void
  onMergeWithPrevious: (currentId: string, content: string) => void
  onFocusNext: () => void
  onFocusPrev: () => void
  registerRef: (id: string, ref: HTMLDivElement | null) => void
}

export function EditableBlock({
  block,
  onUpdate,
  onDelete,
  onAddBlock,
  onMergeWithPrevious,
  onFocusNext,
  onFocusPrev,
  registerRef,
}: EditableBlockProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [showSlashMenu, setShowSlashMenu] = useState(false)
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 })
  const [slashFilter, setSlashFilter] = useState("")
  const slashStartIndexRef = useRef<number | null>(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id })

  useEffect(() => {
    registerRef(block.id, contentRef.current)
    return () => registerRef(block.id, null)
  }, [block.id, registerRef])

  // Initialize content on mount and sync when block type changes
  useEffect(() => {
    if (contentRef.current && contentRef.current.textContent !== block.content) {
      contentRef.current.textContent = block.content
    }
  }, [block.id, block.type])
  
  // Sync content when it changes externally (but not during slash menu selection)
  const prevContentRef = useRef(block.content)
  useEffect(() => {
    if (contentRef.current && prevContentRef.current !== block.content && !showSlashMenu) {
      const isActive = document.activeElement === contentRef.current
      if (!isActive) {
        contentRef.current.textContent = block.content
      }
    }
    prevContentRef.current = block.content
  }, [block.content, showSlashMenu])

  const handleInput = useCallback(() => {
    const content = contentRef.current?.textContent || ""
    
    if (showSlashMenu && slashStartIndexRef.current !== null) {
      const caretPos = contentRef.current ? getCaretPosition(contentRef.current) : 0
      const filter = content.slice(slashStartIndexRef.current + 1, caretPos)
      setSlashFilter(filter)
      
      if (caretPos <= slashStartIndexRef.current) {
        setShowSlashMenu(false)
        slashStartIndexRef.current = null
      }
    }
    
    onUpdate({ ...block, content })
  }, [block, onUpdate, showSlashMenu])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const content = contentRef.current?.textContent || ""
      const caretPos = contentRef.current ? getCaretPosition(contentRef.current) : 0

      if (e.key === "/" && !showSlashMenu) {
        const rect = contentRef.current?.getBoundingClientRect()
        if (rect) {
          setSlashMenuPosition({
            top: rect.bottom + 8,
            left: rect.left,
          })
          setShowSlashMenu(true)
          setSlashFilter("")
          slashStartIndexRef.current = caretPos
        }
      }

      if (showSlashMenu) {
        if (["ArrowUp", "ArrowDown", "Enter"].includes(e.key)) {
          e.preventDefault()
          return
        }
        if (e.key === "Escape") {
          setShowSlashMenu(false)
          slashStartIndexRef.current = null
          return
        }
      }

      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        const contentBefore = content.slice(0, caretPos)
        const contentAfter = content.slice(caretPos)
        
        // Manually update the DOM before state update to prevent content duplication
        if (contentRef.current) {
          contentRef.current.textContent = contentBefore
        }
        
        onUpdate({ ...block, content: contentBefore })
        onAddBlock(block.id, "paragraph", contentAfter)
      }

      if (e.key === "Backspace") {
        if (content === "") {
          e.preventDefault()
          onDelete(block.id)
          onFocusPrev()
        } else if (caretPos === 0) {
          e.preventDefault()
          onMergeWithPrevious(block.id, content)
        }
      }

      if (e.key === "ArrowUp" && caretPos === 0) {
        e.preventDefault()
        onFocusPrev()
      }

      if (e.key === "ArrowDown" && caretPos === content.length) {
        e.preventDefault()
        onFocusNext()
      }
    },
    [block, onAddBlock, onDelete, onUpdate, onMergeWithPrevious, onFocusNext, onFocusPrev, showSlashMenu]
  )

  const handleSlashSelect = useCallback(
    (type: BlockType) => {
      setShowSlashMenu(false)
      
      const content = contentRef.current?.textContent || ""
      const caretPos = contentRef.current ? getCaretPosition(contentRef.current) : 0
      const newContent = content.slice(0, slashStartIndexRef.current || 0) + content.slice(caretPos)
      const savedSlashStart = slashStartIndexRef.current || 0
      
      slashStartIndexRef.current = null
      
      // Immediately update the DOM before state update
      if (contentRef.current) {
        contentRef.current.textContent = newContent
      }
      
      onUpdate({ ...block, type, content: newContent, checked: type === "todo" ? false : undefined })
      
      requestAnimationFrame(() => {
        if (contentRef.current) {
          contentRef.current.focus()
          setCaretPosition(contentRef.current, savedSlashStart)
        }
      })
    },
    [block, onUpdate]
  )

  const handleCheckToggle = useCallback(() => {
    onUpdate({ ...block, checked: !block.checked })
  }, [block, onUpdate])

  const config = blockTypeConfig[block.type]

  const getBlockClasses = () => {
    switch (block.type) {
      case "heading1":
        return "text-[2rem] font-bold leading-tight"
      case "heading2":
        return "text-[1.5rem] font-semibold leading-tight"
      case "heading3":
        return "text-[1.25rem] font-semibold leading-snug"
      case "todo":
        return "text-base leading-relaxed"
      default:
        return "text-base leading-relaxed"
    }
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative py-2 rounded-md transition-colors duration-150 ease-out hover:bg-gray-50 ${
        isDragging ? "opacity-50 z-50" : ""
      }`}
    >
      <BlockControls
        onAddBlock={() => onAddBlock(block.id)}
        onDelete={() => {
          onDelete(block.id)
          onFocusPrev()
        }}
        attributes={attributes}
        listeners={listeners}
      />

      <div className="flex items-start gap-2">
        {block.type === "todo" && (
          <button
            onClick={handleCheckToggle}
            className={`mt-[5px] flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors duration-150 ease-out ${
              block.checked
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-muted-foreground/40 hover:border-muted-foreground"
            }`}
          >
            {block.checked && <Check className="h-3 w-3" />}
          </button>
        )}

        <div
          ref={contentRef}
          contentEditable
          suppressContentEditableWarning
          className={`w-full outline-none ${getBlockClasses()} ${
            block.type === "todo" && block.checked ? "text-muted-foreground line-through" : ""
          } empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]`}
          data-placeholder={config.placeholder}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
        />
      </div>

      {showSlashMenu && (
        <SlashMenu
          position={slashMenuPosition}
          onSelect={handleSlashSelect}
          onClose={() => {
            setShowSlashMenu(false)
            slashStartIndexRef.current = null
          }}
          filter={slashFilter}
        />
      )}
    </div>
  )
}
