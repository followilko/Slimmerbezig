import gsap from "gsap"

import CustomEase from "gsap/CustomEase"
import Observer from "gsap/Observer"
import ScrollTrigger from "gsap/ScrollTrigger"

let registered = false

/**
 * Registers GSAP ScrollTrigger + CustomEase + Observer once on the client.
 * Safe to call from multiple client surfaces; SSR no-ops.
 */
export function registerGsap(): void {
  if (typeof window === "undefined") return
  if (registered) return

  gsap.registerPlugin(ScrollTrigger, CustomEase, Observer)
  registered = true
}
