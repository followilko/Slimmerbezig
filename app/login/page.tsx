import Link from "next/link"
import { Suspense } from "react"

import { LinkedInLoginButton } from "@/components/auth/linkedin-login-button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function LoginPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Use your LinkedIn account to access your dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Suspense
            fallback={
              <p className="text-muted-foreground text-center text-sm">
                Loading…
              </p>
            }
          >
            <LinkedInLoginButton />
          </Suspense>
          <p className="text-muted-foreground text-center text-sm">
            <Link href="/" className="underline underline-offset-4">
              Back to home
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
