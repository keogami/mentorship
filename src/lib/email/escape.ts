const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Escape HTML special characters to prevent XSS in email templates */
export function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char]);
}

/** Strip CRLF characters to prevent email header injection */
export function stripCrlf(str: string): string {
  return str.replace(/[\r\n]/g, "");
}
