import { RichText } from "@payloadcms/richtext-lexical/react"
import type { Page } from "@/payload-types"

type TextBlockProps = Extract<
  NonNullable<Page["layout"]>[number],
  { blockType: "textBlock" }
>

/**
 * `RichText`'s default converters render plain semantic HTML (p, h1-h6, ul,
 * ol, links, bold/italic) with no classes of their own — the surrounding
 * `prose`-style overrides below are what give it the MOWY look, since
 * Tailwind's own `prose` plugin isn't part of this project's stack.
 */
export default function TextBlock({ richText }: TextBlockProps) {
  return (
    <section className="border-b border-line bg-ink">
      <div className="content-container max-w-3xl py-16">
        <div
          className="space-y-5 text-body-lg leading-[1.7] text-chrome-dim
            [&_a]:text-cobalt-soft [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-cobalt
            [&_h1]:font-headline [&_h1]:text-h2 [&_h1]:text-chrome
            [&_h2]:font-headline [&_h2]:text-h3 [&_h2]:text-chrome
            [&_h3]:font-headline [&_h3]:text-h4 [&_h3]:text-chrome
            [&_strong]:text-chrome [&_strong]:font-semibold
            [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
        >
          <RichText data={richText} />
        </div>
      </div>
    </section>
  )
}
