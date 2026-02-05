/**
 * Utility functions for managing caret position in contentEditable elements
 */

/**
 * Get the current caret position within a contentEditable element
 * @param element The contentEditable element
 * @returns The caret position as a number
 */
export function getCaretPosition(element: HTMLElement): number {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return 0
  const range = selection.getRangeAt(0)
  const preCaretRange = range.cloneRange()
  preCaretRange.selectNodeContents(element)
  preCaretRange.setEnd(range.endContainer, range.endOffset)
  return preCaretRange.toString().length
}

/**
 * Set the caret position within a contentEditable element
 * @param element The contentEditable element
 * @param position The position to set the caret to
 */
export function setCaretPosition(element: HTMLElement, position: number): void {
  const range = document.createRange()
  const sel = window.getSelection()

  let currentPos = 0
  let found = false

  function traverse(node: Node) {
    if (found) return
    if (node.nodeType === Node.TEXT_NODE) {
      const textLength = node.textContent?.length || 0
      if (currentPos + textLength >= position) {
        range.setStart(node, position - currentPos)
        range.collapse(true)
        found = true
      } else {
        currentPos += textLength
      }
    } else {
      for (const child of Array.from(node.childNodes)) {
        traverse(child)
        if (found) break
      }
    }
  }

  traverse(element)

  if (!found) {
    range.selectNodeContents(element)
    range.collapse(false)
  }

  sel?.removeAllRanges()
  sel?.addRange(range)
}
