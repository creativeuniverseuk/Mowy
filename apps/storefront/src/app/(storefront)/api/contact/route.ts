import { createHash } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { getPayload } from "payload"
import config from "@payload-config"

/**
 * Receives the Contact Form block (src/modules/pages/blocks/contact-form.tsx).
 *
 * 1. Drops bots that fill the hidden `website` honeypot — answered with a
 *    normal-looking success so they don't learn to skip it.
 * 2. Rate-limits by sender (RATE_LIMIT_MAX per RATE_LIMIT_WINDOW_MS), counted
 *    from stored submissions rather than in memory, so it holds across
 *    serverless instances.
 * 3. Stores the submission in Payload's contact-submissions collection
 *    before anything else can fail, so a message is never lost.
 * 4. Asks the backend (apps/backend/src/api/contact-form/route.ts) to email
 *    it to the shop via Resend, and records whether that worked.
 *
 * POST /api/contact  { name, email, message, website }
 */
const RATE_LIMIT_MAX = 3
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000

const LIMITS = { name: 200, email: 320, message: 5000 }

// Deliberately loose — the real check is whether a reply reaches them.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type FieldErrors = Partial<Record<"name" | "email" | "message", string>>

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function validate(name: string, email: string, message: string) {
  const errors: FieldErrors = {}

  if (!name) errors.name = "Please tell us your name."
  else if (name.length > LIMITS.name) errors.name = "That name is too long."

  if (!email) errors.email = "Please enter your email address."
  else if (email.length > LIMITS.email || !EMAIL_PATTERN.test(email))
    errors.email = "That doesn't look like a valid email address."

  if (!message) errors.message = "Please write a message."
  else if (message.length > LIMITS.message)
    errors.message = `Please keep your message under ${LIMITS.message} characters.`

  return errors
}

function hashSender(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"

  return createHash("sha256")
    .update(`${ip}:${process.env.PAYLOAD_SECRET ?? ""}`)
    .digest("hex")
}

async function sendEmail(
  submission: { name: string; email: string; message: string },
  submissionId: string | number
) {
  const backendUrl = process.env.MEDUSA_BACKEND_URL
  const secret = process.env.CONTACT_FORM_SECRET

  if (!backendUrl || !secret) {
    console.error(
      "contact route: MEDUSA_BACKEND_URL or CONTACT_FORM_SECRET not set — submission stored but not emailed."
    )
    return false
  }

  try {
    const response = await fetch(`${backendUrl.replace(/\/$/, "")}/contact-form`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-contact-form-secret": secret,
      },
      body: JSON.stringify({ ...submission, submission_id: submissionId }),
      cache: "no-store",
    })

    if (!response.ok) {
      console.error(`contact route: backend email request returned ${response.status}.`)
      return false
    }

    return true
  } catch (error) {
    console.error(
      `contact route: couldn't reach the backend to send the email — ${
        error instanceof Error ? error.message : String(error)
      }`
    )
    return false
  }
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 })
  }

  if (readString(body.website)) {
    return NextResponse.json({ ok: true })
  }

  const name = readString(body.name)
  const email = readString(body.email)
  const message = readString(body.message)

  const errors = validate(name, email, message)

  if (Object.keys(errors).length) {
    return NextResponse.json(
      { message: "Please check the highlighted fields.", errors },
      { status: 400 }
    )
  }

  const payload = await getPayload({ config })
  const ipHash = hashSender(request)

  const { totalDocs: recent } = await payload.count({
    collection: "contact-submissions",
    where: {
      and: [
        { ipHash: { equals: ipHash } },
        {
          createdAt: {
            greater_than: new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString(),
          },
        },
      ],
    },
  })

  if (recent >= RATE_LIMIT_MAX) {
    return NextResponse.json(
      {
        message:
          "You've sent a few messages in a short time — please wait a few minutes before trying again.",
      },
      { status: 429 }
    )
  }

  const submission = await payload.create({
    collection: "contact-submissions",
    data: { name, email, message, ipHash, emailStatus: "pending" },
  })

  const sent = await sendEmail({ name, email, message }, submission.id)

  await payload.update({
    collection: "contact-submissions",
    id: submission.id,
    data: { emailStatus: sent ? "sent" : "failed" },
  })

  // The message is safely stored either way, so the sender gets a success
  // response even if the email didn't go — a failed send shows up as
  // "Failed" in the CMS's Contact Submissions list instead.
  return NextResponse.json({ ok: true })
}
