import raw from "../type-scale.js"

export type TypeScaleToken = keyof typeof raw.typeScale

export const typeScale: Record<
  TypeScaleToken,
  {
    fontFamily: string
    fontSize: string
    lineHeight: string
    letterSpacing: string
    fontWeight: string
    use: string
  }
> = raw.typeScale
