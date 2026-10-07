export function normalizeHttpMethod(method?: string): string {
  return (method || "GET").toUpperCase();
}
