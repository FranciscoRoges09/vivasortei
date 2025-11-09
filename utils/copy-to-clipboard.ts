/**
 * Utility function to copy text to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text)
    console.log("[v0] Text copied to clipboard:", text.substring(0, 20) + "...")
    return true
  } catch (err) {
    console.error("[v0] Failed to copy to clipboard:", err)
    return false
  }
}
