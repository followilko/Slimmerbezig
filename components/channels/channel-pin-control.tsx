"use client"

import { Pin } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"

import { setChannelPinnedHack } from "@/app/(app)/channels/actions"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ChannelPinControl({
  slug,
  hackId,
  pinned,
}: {
  slug: string
  hackId: string
  pinned: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      const res = await setChannelPinnedHack({
        slug,
        hackId: pinned ? null : hackId,
      })
      if (!res.ok) {
        toast.error(
          res.reason === "not_allowed"
            ? "Je mag geen posts vastzetten in dit kanaal."
            : "Vastzetten lukte niet. Probeer opnieuw."
        )
        return
      }
      toast.success(pinned ? "Post losgezet" : "Post vastgezet bovenaan")
      router.refresh()
    })
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      className={cn(
        "h-8 gap-1.5 rounded-full bg-white/90 text-xs shadow-sm backdrop-blur-sm",
        pinned && "ring-1 ring-foreground/20"
      )}
      onClick={handleClick}
      disabled={pending}
      aria-pressed={pinned}
      aria-label={pinned ? "Losmaken" : "Vastzetten bovenaan"}
      title={pinned ? "Losmaken" : "Vastzetten bovenaan"}
    >
      <Pin className={cn("size-3.5", pinned && "fill-current")} />
      {pinned ? "Losmaken" : "Vastzetten"}
    </Button>
  )
}
