import he from "he"

/** Escape HTML special characters to prevent XSS in email templates */
export function escapeHtml(str: string): string {
  return he.encode(str)
}

/** Strip CRLF characters to prevent email header injection */
export function stripCrlf(str: string): string {
  return str.replace(/[\r\n]/g, "")
}
