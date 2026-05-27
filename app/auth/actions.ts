"use server"

import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/")
}

/** Removes auth.users (and cascaded profile/data); see supabase/04_delete_account.sql */
export async function deleteAccount(): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  const { error } = await supabase.rpc("delete_my_account")

  if (error) {
    throw error
  }

  await supabase.auth.signOut()
  redirect("/")
}
