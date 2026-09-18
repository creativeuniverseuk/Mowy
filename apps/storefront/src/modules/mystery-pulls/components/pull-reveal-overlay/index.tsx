"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { MysteryPullResult, getMysteryPullResult } from "@lib/data/mystery-pulls"
import { lightenHex } from "@modules/mystery-pulls/utils/theme"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

// Matches design-reference/mowy-mystery-pull.html's shake duration — the
// pack always shakes for at least this long even if the result comes back
// instantly, so the reveal never feels rushed or glitchy.
const MIN_SHAKE_MS = 1100
const POLL_INTERVAL_MS = 1200
// 100 attempts * 1.2s = 120s — comfortably past the reconciliation job's
// worst case (apps/backend's src/jobs/reconcile-mystery-pull-assignments.ts
// runs every 15s), with real margin rather than just barely clearing it.
// These two numbers are a pair: if one changes, check the other still
// leaves headroom.
const MAX_POLL_ATTEMPTS = 100
// After this long with no result, the shake alone reads as "broken" to a
// real customer — show a reassuring message rather than leaving them
// staring at ambiguous silence for up to two minutes.
const REASSURANCE_AFTER_MS = 12000

type Phase = "shaking" | "bursting" | "revealed" | "timed-out" | "error"

type Particle = { id: number; dx: number; dy: number; color: string }

/**
 * Full-screen pull reveal. On mount it polls the real backend result (see
 * lib/data/mystery-pulls#getMysteryPullResult) — assignment runs
 * asynchronously on payment.captured (apps/backend's
 * src/subscribers/mystery-pull-assign-on-capture.ts), so the result usually
 * isn't ready the instant this page loads. The outcome shown is always the
 * one the backend already drew; nothing here ever picks a rarity itself.
 */
export default function PullRevealOverlay({
  orderId,
  packArtUrl,
  packThemeColor,
  productHandle,
}: {
  orderId: string
  packArtUrl: string | null
  packThemeColor: string
  productHandle: string | null
}) {
  const [phase, setPhase] = useState<Phase>("shaking")
  const [result, setResult] = useState<MysteryPullResult | null>(null)
  const [particles, setParticles] = useState<Particle[]>([])
  const [elapsedMs, setElapsedMs] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const packThemeSoft = lightenHex(packThemeColor, 0.35)
  const hasBurst = phase === "bursting" || phase === "revealed"
  const showReassurance = phase === "shaking" && elapsedMs >= REASSURANCE_AFTER_MS

  useEffect(() => {
    if (result) return

    let cancelled = false
    let attempts = 0
    const startedAt = Date.now()

    const tick = async () => {
      attempts += 1

      let fresh: MysteryPullResult | null
      try {
        fresh = await getMysteryPullResult(orderId)
      } catch (err) {
        // A real failure, not "not ready yet" — see
        // lib/data/mystery-pulls#getMysteryPullResult's doc comment. Stop
        // polling and say so, rather than silently retrying an error that
        // won't fix itself (or worse, looking identical to still-shaking
        // for the full two-minute window).
        if (!cancelled) {
          setErrorMessage(err instanceof Error ? err.message : String(err))
          setPhase("error")
        }
        return
      }
      if (cancelled) return

      if (fresh) {
        const wait = Math.max(0, MIN_SHAKE_MS - (Date.now() - startedAt))
        setTimeout(() => {
          if (!cancelled) setResult(fresh)
        }, wait)
        return
      }

      setElapsedMs(Date.now() - startedAt)

      if (attempts >= MAX_POLL_ATTEMPTS) {
        setPhase("timed-out")
        return
      }

      setTimeout(tick, POLL_INTERVAL_MS)
    }

    tick()
    return () => {
      cancelled = true
    }
  }, [orderId, result])

  useEffect(() => {
    if (!result) return

    setParticles(
      Array.from({ length: 18 }, (_, i) => {
        const angle = Math.random() * Math.PI * 2
        const dist = 80 + Math.random() * 90
        return {
          id: i,
          dx: Math.cos(angle) * dist,
          dy: Math.sin(angle) * dist,
          color: Math.random() > 0.5 ? packThemeSoft : "#ffffff",
        }
      })
    )
    setPhase("bursting")

    const revealTimer = setTimeout(() => setPhase("revealed"), 400)
    return () => clearTimeout(revealTimer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(6,6,9,0.97)]">
      <div className="relative flex h-[440px] w-[320px] items-center justify-center">
        <motion.div
          className="pointer-events-none absolute -inset-[100px] rounded-full"
          style={{
            background: `radial-gradient(circle, rgba(255,255,255,0.9) 0%, ${packThemeSoft} 40%, transparent 70%)`,
          }}
          initial={{ opacity: 0, scale: 0.2 }}
          animate={
            hasBurst
              ? { opacity: [0, 1, 0], scale: [0.2, 1.3, 2.2] }
              : { opacity: 0, scale: 0.2 }
          }
          transition={{ duration: 0.7, ease: "easeOut", times: [0, 0.35, 1] }}
        />

        <motion.div
          className="absolute h-[260px] w-[180px] overflow-hidden rounded-2xl border border-white/15"
          style={{
            background: `linear-gradient(165deg, ${packThemeColor} 0%, #0c0c10 75%)`,
            boxShadow: `0 0 50px -6px ${packThemeColor}`,
          }}
          animate={
            hasBurst
              ? { opacity: 0, scale: 1.4 }
              : phase === "error"
              ? { x: 0, rotate: 0 }
              : {
                  x: [0, -6, 6, -8, 8, -6, 6, -4, 4, -2, 0],
                  rotate: [0, -2, 2, -3, 3, -2, 2, -1, 1, 0, 0],
                }
          }
          transition={
            hasBurst
              ? { duration: 0.5, ease: "easeIn" }
              : phase === "error"
              ? { duration: 0.3 }
              : {
                  duration: 1.1,
                  ease: "easeInOut",
                  repeat: Infinity,
                  times: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
                }
          }
        >
          {packArtUrl && (
            <Image
              src={packArtUrl}
              alt="Pack art"
              fill
              sizes="180px"
              className="object-cover"
            />
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-3 pb-2.5 pt-2.5 text-center font-mono text-[11px] uppercase tracking-[0.12em] text-white/85">
            Opening…
          </div>
        </motion.div>

        {showReassurance && (
          <motion.div
            className="absolute -bottom-20 max-w-[260px] text-center text-sm text-chrome-dim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            Still confirming your pull — this can take a little longer than
            usual. Hang tight, it's on its way.
          </motion.div>
        )}

        {phase === "bursting" &&
          particles.map((p) => (
            <motion.div
              key={p.id}
              className="pointer-events-none absolute left-1/2 top-1/2 h-[5px] w-[5px] rounded-full"
              style={{ background: p.color }}
              initial={{ opacity: 1, x: "-50%", y: "-50%", scale: 1 }}
              animate={{
                opacity: 0,
                x: `calc(-50% + ${p.dx}px)`,
                y: `calc(-50% + ${p.dy}px)`,
                scale: 0.3,
              }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />
          ))}

        {phase === "revealed" && result && (
          <motion.div
            className="absolute flex h-[320px] w-[230px] flex-col items-center justify-center gap-3.5 rounded-2xl border-2 p-4"
            style={{
              background: "linear-gradient(160deg, #1a1a22, #0c0c10)",
              borderColor: result.rarity_color,
              boxShadow: `0 0 50px ${result.rarity_color}`,
            }}
            initial={{ opacity: 0, rotateY: 180, scale: 0.6 }}
            animate={{ opacity: [0, 1, 1], rotateY: 0, scale: 1 }}
            transition={{
              duration: 0.9,
              ease: [0.2, 0.8, 0.3, 1.2],
              times: [0, 0.6, 1],
            }}
          >
            <span
              className="rounded-full border px-3.5 py-[5px] font-headline text-[13px] font-bold tracking-[0.12em]"
              style={{
                color: result.rarity_color,
                borderColor: result.rarity_color,
                background: "rgba(255,255,255,0.08)",
              }}
            >
              {result.rarity_tier}
            </span>
            {result.image && (
              <div className="relative h-[140px] w-[110px] overflow-hidden rounded-md">
                <Image
                  src={result.image}
                  alt={result.card_name ?? "Your pull"}
                  fill
                  sizes="110px"
                  className="object-contain"
                />
              </div>
            )}
            <span className="text-sm text-chrome-dim">
              {result.card_name ?? "Mystery card"}
            </span>
          </motion.div>
        )}

        {phase === "timed-out" && (
          <div className="max-w-[260px] text-center text-sm text-chrome-dim">
            Still finalising your pull — this can take a moment after
            payment. Check{" "}
            <LocalizedClientLink
              href="/account/orders"
              className="text-cobalt-soft underline"
            >
              your orders
            </LocalizedClientLink>{" "}
            shortly.
          </div>
        )}

        {phase === "error" && (
          <div className="max-w-[280px] text-center text-sm">
            <p className="text-out-of-stock">
              Something went wrong confirming your pull.
            </p>
            <p className="mt-1.5 text-chrome-dim">
              Your payment went through — this is just a display problem.
              Check{" "}
              <LocalizedClientLink
                href="/account/orders"
                className="text-cobalt-soft underline"
              >
                your orders
              </LocalizedClientLink>{" "}
              or contact us if it doesn't show up there.
            </p>
            {errorMessage && (
              <p className="mt-2 truncate font-mono text-[10px] text-chrome-dim/60">
                {errorMessage}
              </p>
            )}
          </div>
        )}

        {phase === "revealed" && (
          <motion.div
            className="absolute -bottom-[70px] flex gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            {productHandle && (
              <LocalizedClientLink href={`/products/${productHandle}`}>
                <Button
                  size="lg"
                  className="text-ink hover:opacity-90"
                  style={{ background: packThemeColor }}
                >
                  Open another
                </Button>
              </LocalizedClientLink>
            )}
            <LocalizedClientLink href="/account/orders">
              <Button size="lg" variant="outline" className="border-line text-chrome">
                Add to collection
              </Button>
            </LocalizedClientLink>
          </motion.div>
        )}
      </div>
    </div>
  )
}
