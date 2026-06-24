import type { GOALS } from "@/lib/ai/hack-draft"

export const GOAL_LABEL: Record<(typeof GOALS)[number], string> = {
  automate: "Automatiseren",
  analyse: "Analyseren",
  generate: "Genereren",
  organise: "Organiseren",
  communicate: "Communiceren",
  learn: "Leren",
  decide: "Beslissen",
}

export function goalLabel(goal: string | null | undefined): string | null {
  if (!goal) return null
  return GOAL_LABEL[goal as keyof typeof GOAL_LABEL] ?? goal
}
