/**
 * Escapes `<` so a `</script>`-shaped substring in the data (e.g. a product
 * description) can't close the JSON-LD <script> tag early.
 */
export function toJsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c")
}
