export type BlockType = "paragraph" | "heading1" | "heading2" | "heading3" | "todo"

export interface Block {
  id: string
  type: BlockType
  content: string
  checked?: boolean
}

export const blockTypeConfig: Record<
  BlockType,
  {
    label: string
    description: string
    icon: string
    placeholder: string
  }
> = {
  paragraph: {
    label: "Text",
    description: "Just start writing with plain text.",
    icon: "T",
    placeholder: "Type '/' for commands...",
  },
  heading1: {
    label: "Heading 1",
    description: "Big section heading.",
    icon: "H1",
    placeholder: "Heading 1",
  },
  heading2: {
    label: "Heading 2",
    description: "Medium section heading.",
    icon: "H2",
    placeholder: "Heading 2",
  },
  heading3: {
    label: "Heading 3",
    description: "Small section heading.",
    icon: "H3",
    placeholder: "Heading 3",
  },
  todo: {
    label: "To-do list",
    description: "Track tasks with a to-do list.",
    icon: "☐",
    placeholder: "To-do",
  },
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}
