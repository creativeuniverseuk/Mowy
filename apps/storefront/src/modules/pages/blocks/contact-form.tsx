"use client"

import { motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import type { Page } from "@/payload-types"

type ContactFormProps = Extract<
  NonNullable<Page["layout"]>[number],
  { blockType: "contactForm" }
>

type FieldName = "name" | "email" | "message"
type FieldErrors = Partial<Record<FieldName, string>>
type Status = "idle" | "submitting" | "success" | "error"

const inputClass =
  "block w-full rounded-base border bg-panel px-4 text-body-sm text-chrome transition-colors placeholder:text-chrome-dim/60 hover:border-chrome-dim focus:border-cobalt focus:outline-none focus-visible:ring-2 focus-visible:ring-cobalt/40 disabled:opacity-60"

/**
 * Client side of the Contact Form block — posts to
 * src/app/(storefront)/api/contact/route.ts, which does the honeypot check,
 * rate limit, storage, and email. Field errors deliberately don't use the
 * red/amber/green status colours: those are reserved for stock state (see
 * CLAUDE.md's colour tokens), so an invalid field is marked with a brighter
 * border and a plain-text message instead.
 */
export default function ContactForm({
  heading,
  intro,
  submitLabel,
  successMessage,
}: ContactFormProps) {
  const [status, setStatus] = useState<Status>("idle")
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const successRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === "success") {
      successRef.current?.focus()
    }
  }, [status])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus("submitting")
    setErrors({})
    setFormError(null)

    const form = new FormData(event.currentTarget)

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          message: form.get("message"),
          website: form.get("website"),
        }),
      })

      if (response.ok) {
        setStatus("success")
        return
      }

      const data = (await response.json().catch(() => ({}))) as {
        message?: string
        errors?: FieldErrors
      }

      setErrors(data.errors ?? {})
      setFormError(data.message ?? "Something went wrong — please try again.")
      setStatus("error")
    } catch {
      setFormError(
        "We couldn't reach the server — check your connection and try again."
      )
      setStatus("error")
    }
  }

  const fieldProps = (field: FieldName, extraClass: string) => ({
    id: `contact-${field}`,
    name: field,
    required: true,
    disabled: status === "submitting",
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": errors[field] ? `contact-${field}-error` : undefined,
    className: `${inputClass} ${extraClass} ${
      errors[field] ? "border-chrome" : "border-line"
    }`,
  })

  const fieldError = (field: FieldName) =>
    errors[field] ? (
      <p id={`contact-${field}-error`} className="mt-2 text-body-sm text-chrome">
        {errors[field]}
      </p>
    ) : null

  return (
    <section className="border-b border-line bg-ink">
      <div className="content-container max-w-2xl py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="rounded-[14px] border border-line bg-ink-2 p-6 small:p-10"
        >
          {heading && (
            <h2 className="font-headline text-h3 text-chrome">{heading}</h2>
          )}
          {intro && (
            <p className="mt-3 text-body-lg leading-[1.7] text-chrome-dim">
              {intro}
            </p>
          )}

          {status === "success" ? (
            <div
              ref={successRef}
              tabIndex={-1}
              role="status"
              className="mt-8 rounded-base border border-cobalt/40 bg-panel px-5 py-4 text-body-sm leading-[1.7] text-chrome focus:outline-none"
            >
              {successMessage ||
                "Thanks — your message is on its way. We'll get back to you by email."}
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-y-5">
              <div className="grid grid-cols-1 gap-5 small:grid-cols-2">
                <div>
                  <label
                    htmlFor="contact-name"
                    className="mb-2 block text-body-sm font-medium text-chrome"
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    autoComplete="name"
                    maxLength={200}
                    {...fieldProps("name", "h-11")}
                  />
                  {fieldError("name")}
                </div>

                <div>
                  <label
                    htmlFor="contact-email"
                    className="mb-2 block text-body-sm font-medium text-chrome"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    autoComplete="email"
                    maxLength={320}
                    {...fieldProps("email", "h-11")}
                  />
                  {fieldError("email")}
                </div>
              </div>

              <div>
                <label
                  htmlFor="contact-message"
                  className="mb-2 block text-body-sm font-medium text-chrome"
                >
                  Message
                </label>
                <textarea
                  rows={6}
                  maxLength={5000}
                  {...fieldProps("message", "resize-y py-3")}
                />
                {fieldError("message")}
              </div>

              {/* Honeypot — invisible to people and skipped by keyboard and
                  screen readers; only bots that fill every field touch it. */}
              <div
                aria-hidden="true"
                className="absolute -left-[9999px] h-px w-px overflow-hidden"
              >
                <label htmlFor="contact-website">Website</label>
                <input
                  id="contact-website"
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              {formError && (
                <p
                  role="alert"
                  className="rounded-base border border-line bg-panel px-4 py-3 text-body-sm text-chrome"
                >
                  {formError}
                </p>
              )}

              <div>
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="inline-flex items-center rounded-md bg-cobalt-deep px-6 py-3 text-body-sm font-medium text-chrome transition-colors hover:bg-cobalt-deep/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {status === "submitting"
                    ? "Sending…"
                    : submitLabel || "Send message"}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  )
}
