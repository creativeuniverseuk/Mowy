// The "ChartBar" glyph from @medusajs/icons v2.21.0 (MIT, © Medusajs),
// inlined so the dashboard route doesn't need @medusajs/icons as a direct
// dependency — this app doesn't list it, and pnpm won't resolve a transitive
// one from src/admin. If it's ever added to package.json, replace this file
// with `import { ChartBar } from "@medusajs/icons"`.
export const ChartBarIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={15}
    height={15}
    viewBox="0 0 15 15"
    fill="none"
  >
    <g
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
    >
      <path d="M7.722 1.944h-.444a.89.89 0 0 0-.89.89v9.333c0 .49.399.888.89.888h.444c.491 0 .89-.397.89-.888V2.833a.89.89 0 0 0-.89-.889M2.833 6.389H2.39a.89.89 0 0 0-.889.889v4.889c0 .49.398.889.889.889h.444c.491 0 .89-.398.89-.89V7.279a.89.89 0 0 0-.89-.89M12.611 7.55h-.444c-.491 0-.889.328-.889.733v4.038c0 .406.398.734.889.734h.444c.491 0 .89-.328.89-.734V8.283c0-.405-.399-.734-.89-.734" />
    </g>
  </svg>
)
