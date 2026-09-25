"use client"

import { useEffect } from "react"

// Next.js requires global-error to render its own <html>/<body> — it
// replaces the root layout entirely when triggered, so it can't rely on
// fonts, design tokens, or context providers from layout.tsx being intact.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "1.5rem",
          textAlign: "center",
          backgroundColor: "#14141c",
          color: "#e8e9ee",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>
          Something went wrong
        </h1>
        <p style={{ maxWidth: "28rem", color: "#a4a6b3" }}>
          We hit an unexpected error. Try again, or reload the page.
        </p>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              borderRadius: "6px",
              backgroundColor: "#345fd1",
              color: "#e8e9ee",
              padding: "0.75rem 1.5rem",
              border: "none",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Try again
          </button>
          <a
            href="/"
            style={{ color: "#3b6eff", alignSelf: "center", fontWeight: 500 }}
          >
            Go to homepage
          </a>
        </div>
      </body>
    </html>
  )
}
