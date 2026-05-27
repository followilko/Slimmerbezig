"use client"

import { useState } from "react"

import { deleteAccount } from "@/app/auth/actions"
import { Button } from "@/components/ui/button"

export function DeleteAccountButton() {
  const [armed, setArmed] = useState(false)

  if (!armed) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="border-destructive text-destructive hover:bg-destructive/10"
        onClick={() => setArmed(true)}
      >
        Delete my profile
      </Button>
    )
  }

  return (
    <div className="flex w-full flex-col gap-3 sm:w-auto sm:items-end">
      <p className="text-muted-foreground max-w-xs text-xs sm:text-right">
        Wipes your profile and all your data. Sign in again to start fresh.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setArmed(false)}>
          Cancel
        </Button>
        <form action={deleteAccount}>
          <Button type="submit" variant="destructive" size="sm">
            Confirm delete
          </Button>
        </form>
      </div>
    </div>
  )
}
