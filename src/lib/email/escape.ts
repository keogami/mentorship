/** Strip CRLF characters to prevent email header injection */
export function stripCrlf(str: string): string {
  return str.replace(/[\r\n]/g, "")
}
