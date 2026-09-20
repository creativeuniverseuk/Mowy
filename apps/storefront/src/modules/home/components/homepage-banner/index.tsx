import { getSiteSettings } from "@lib/data/site-settings"

/**
 * Thin announcement strip above the hero, driven by the admin's Site
 * settings page (apps/backend's src/admin/routes/settings/site). Renders
 * nothing when no banner text has been set — this is opt-in, not a
 * permanent fixture of the homepage.
 */
export default async function HomepageBanner() {
  const { homepage_banner_text } = await getSiteSettings()

  if (!homepage_banner_text) {
    return null
  }

  return (
    <div className="bg-cobalt">
      <p className="content-container py-2 text-center font-mono text-[11.5px] uppercase tracking-[0.08em] text-chrome">
        {homepage_banner_text}
      </p>
    </div>
  )
}
