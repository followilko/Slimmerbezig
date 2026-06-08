import CustomEase from "gsap/CustomEase"

import { registerGsap } from "@/lib/anim/registerGsap"

/** Matches Osmo depth-tiles port — keep in sync with carousel tweens. */
export const DEPTH_TILES_EASE = "depth"
export const DEPTH_TILES_EASE_CURVE = "M0,0 C0.6,0 0,1 1,1"

export const DEPTH_TILES_MOVE_DURATION = 1.5
export const DEPTH_TILES_START_DELAY = 0.5
export const DEPTH_TILES_PAUSE_DURATION = 3
export const DEPTH_TILES_PEER_ENTER_AT = 0.85
export const DEPTH_TILES_PEER_EXIT_LEAD_TIME = 0.7
export const DEPTH_TILES_BACK_SCALE = 0.5

/** Remaining move time when the peer strip enters (finishes with the card). */
export const DEPTH_TILES_PEER_ENTER_DURATION =
  DEPTH_TILES_MOVE_DURATION - DEPTH_TILES_PEER_ENTER_AT

export function ensureDepthTilesEase(): void {
  registerGsap()
  if (!CustomEase.get(DEPTH_TILES_EASE)) {
    CustomEase.create(DEPTH_TILES_EASE, DEPTH_TILES_EASE_CURVE)
  }
}
