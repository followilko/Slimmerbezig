"use client"

import { ArrowRight, Bell, BellOff, Check } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import {
  joinChannel,
  leaveChannel,
  setChannelNotify,
} from "@/app/(app)/channels/actions"
import { Button } from "@/components/ui/button"

export function ChannelJoinControls({
  channelId,
  slug,
  joined: initialJoined,
  notify: initialNotify,
}: {
  channelId: string
  slug: string
  joined: boolean
  notify: boolean
}) {
  const router = useRouter()
  const [joined, setJoined] = useState(initialJoined)
  const [notify, setNotify] = useState(initialNotify)
  const [pending, startTransition] = useTransition()

  function handleJoin() {
    setJoined(true)
    setNotify(true)
    startTransition(async () => {
      const res = await joinChannel({ channelId, slug })
      if (!res.ok) {
        setJoined(false)
        toast.error("Lid worden lukte niet. Probeer opnieuw.")
      }
      router.refresh()
    })
  }

  function handleLeave() {
    setJoined(false)
    startTransition(async () => {
      const res = await leaveChannel({ channelId, slug })
      if (!res.ok) {
        setJoined(true)
        toast.error("Verlaten lukte niet. Probeer opnieuw.")
      }
      router.refresh()
    })
  }

  function handleToggleNotify() {
    const next = !notify
    setNotify(next)
    startTransition(async () => {
      const res = await setChannelNotify({ channelId, slug, notify: next })
      if (!res.ok) {
        setNotify(!next)
        toast.error("Voorkeur opslaan lukte niet.")
      }
      router.refresh()
    })
  }

  if (!joined) {
    return (
      <Button size="lg" onClick={handleJoin} disabled={pending}>
        Word lid
        <ArrowRight data-icon="inline-end" />
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="lg"
        variant="outline"
        onClick={handleLeave}
        disabled={pending}
      >
        <Check data-icon="inline-start" />
        Joined
      </Button>
      <Button
        size="icon-lg"
        variant="outline"
        onClick={handleToggleNotify}
        disabled={pending}
        aria-pressed={notify}
        aria-label={
          notify ? "Meldingen uitzetten" : "Meldingen aanzetten"
        }
        title={notify ? "Meldingen aan" : "Meldingen uit"}
      >
        {notify ? <Bell /> : <BellOff className="text-muted-foreground" />}
      </Button>
    </div>
  )
}
