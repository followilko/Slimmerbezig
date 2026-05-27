import gsap from "gsap"

import CustomEase from "gsap/CustomEase"
import ScrollTrigger from "gsap/ScrollTrigger"

let registered = false

/**
 * Registers GSAP ScrollTrigger + CustomEase once on the client.
 * Safe to call from multiple client surfaces; SSR no-ops.
 */
export function registerGsap(): void {
  if (typeof window === "undefined") return
  if (registered) return

  gsap.registerPlugin(ScrollTrigger, CustomEase)
  registered = true
}
