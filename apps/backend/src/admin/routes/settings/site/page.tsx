import { defineRouteConfig } from "@medusajs/admin-sdk"
import { useEffect, useState } from "react"
import {
  Button,
  Container,
  Heading,
  Input,
  Label,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"

type SocialLinks = Record<string, string>

type SiteSettings = {
  id: string
  logo_url: string | null
  contact_email: string | null
  contact_phone: string | null
  address: string | null
  social_links: SocialLinks | null
  accent_color: string | null
  homepage_banner_text: string | null
}

const SOCIAL_PLATFORMS = ["instagram", "facebook", "tiktok", "x"] as const

const DEFAULT_ACCENT = "#3b6eff"

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    credentials: "include",
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.message ?? `Request to ${url} failed (${res.status}).`)
  }
  return res.json()
}

const SiteSettingsPage = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [contactEmail, setContactEmail] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [address, setAddress] = useState("")
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({})
  const [accentColor, setAccentColor] = useState(DEFAULT_ACCENT)
  const [bannerText, setBannerText] = useState("")

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const { site_settings } = (await fetchJson("/admin/site-settings")) as {
          site_settings: SiteSettings
        }
        if (cancelled) return

        setLogoUrl(site_settings.logo_url)
        setContactEmail(site_settings.contact_email ?? "")
        setContactPhone(site_settings.contact_phone ?? "")
        setAddress(site_settings.address ?? "")
        setSocialLinks(site_settings.social_links ?? {})
        setAccentColor(site_settings.accent_color ?? DEFAULT_ACCENT)
        setBannerText(site_settings.homepage_banner_text ?? "")
      } catch (err: any) {
        if (!cancelled) {
          toast.error("Couldn't load site settings", { description: err.message })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("files", file)
      const res = await fetch("/admin/uploads", {
        method: "POST",
        credentials: "include",
        body: formData,
      })
      if (!res.ok) throw new Error(`Upload failed (${res.status}).`)
      const json = await res.json()
      setLogoUrl(json.files?.[0]?.url ?? null)
    } catch (err: any) {
      toast.error("Couldn't upload logo", { description: err.message })
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      await fetchJson("/admin/site-settings", {
        method: "POST",
        body: JSON.stringify({
          logo_url: logoUrl,
          contact_email: contactEmail || null,
          contact_phone: contactPhone || null,
          address: address || null,
          social_links: socialLinks,
          accent_color: accentColor,
          homepage_banner_text: bannerText || null,
        }),
      })
      toast.success("Site settings saved")
    } catch (err: any) {
      toast.error("Couldn't save site settings", { description: err.message })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Container className="p-6">
        <Text size="small" className="text-ui-fg-subtle">
          Loading…
        </Text>
      </Container>
    )
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">Site settings</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Logo, contact details and homepage banner shown on the storefront.
          </Text>
        </div>
        <Button onClick={handleSave} disabled={saving || uploading}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>

      <div className="flex flex-col gap-y-6 px-6 py-6">
        <div className="flex flex-col gap-y-2">
          <Label size="small" weight="plus">
            Logo
          </Label>
          <div className="flex items-center gap-x-3">
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt="Logo preview"
                className="h-12 w-12 rounded-md border object-contain bg-ui-bg-base"
              />
            )}
            <Input
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              disabled={uploading}
            />
            {logoUrl && (
              <Button
                variant="secondary"
                size="small"
                onClick={() => setLogoUrl(null)}
                disabled={uploading}
              >
                Remove
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
          <div className="flex flex-col gap-y-2">
            <Label size="small" weight="plus" htmlFor="contact-email">
              Contact email
            </Label>
            <Input
              id="contact-email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-y-2">
            <Label size="small" weight="plus" htmlFor="contact-phone">
              Contact phone
            </Label>
            <Input
              id="contact-phone"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-y-2">
          <Label size="small" weight="plus" htmlFor="address">
            Address
          </Label>
          <Textarea
            id="address"
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-y-2">
          <Label size="small" weight="plus">
            Social links
          </Label>
          <div className="flex flex-col gap-y-2">
            {SOCIAL_PLATFORMS.map((platform) => (
              <div key={platform} className="flex items-center gap-x-2">
                <Label size="small" className="w-20 shrink-0 capitalize text-ui-fg-subtle">
                  {platform}
                </Label>
                <Input
                  placeholder={`https://${platform}.com/...`}
                  value={socialLinks[platform] ?? ""}
                  onChange={(e) =>
                    setSocialLinks((prev) => ({ ...prev, [platform]: e.target.value }))
                  }
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-y-2">
          <Label size="small" weight="plus" htmlFor="accent-color">
            Accent colour
          </Label>
          <div className="flex items-center gap-x-3">
            <input
              id="accent-color"
              type="color"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="h-8 w-12 cursor-pointer rounded border p-0"
            />
            <Input
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="w-32"
            />
          </div>
        </div>

        <div className="flex flex-col gap-y-2">
          <Label size="small" weight="plus" htmlFor="banner-text">
            Homepage banner text
          </Label>
          <Textarea
            id="banner-text"
            rows={2}
            placeholder="e.g. Free UK shipping on orders over £30"
            value={bannerText}
            onChange={(e) => setBannerText(e.target.value)}
          />
        </div>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Site settings",
})

export default SiteSettingsPage
