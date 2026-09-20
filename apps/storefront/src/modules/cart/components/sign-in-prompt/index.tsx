import { Heading, Text } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const SignInPrompt = () => {
  return (
    <div className="flex items-center justify-between rounded-large border border-line bg-ink-2 px-6 py-5">
      <div>
        <Heading level="h2" className="font-headline text-h4 text-chrome">
          Already have an account?
        </Heading>
        <Text className="text-body-sm text-chrome-dim mt-2">
          Sign in for a better experience.
        </Text>
      </div>
      <div>
        <LocalizedClientLink href="/account">
          <button
            className="h-10 rounded-base border border-line bg-panel px-5 text-body-sm font-medium uppercase tracking-[0.08em] text-chrome transition-colors hover:border-cobalt-soft"
            data-testid="sign-in-button"
          >
            Sign in
          </button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default SignInPrompt
