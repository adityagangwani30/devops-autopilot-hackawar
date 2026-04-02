"use client"

import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { useSessionContext } from "@/components/auth/SessionProvider"

type Session = typeof authClient.$Infer.Session

export function useSession() {
  const router = useRouter()
  const session = useSessionContext()

  const signIn = async (provider: "github", callbackURL = "/dashboard") => {
    try {
      await authClient.signIn.social({
        provider,
        callbackURL,
      })
    } catch (signInError) {
      console.error("Sign-in failed:", signInError)
    }
  }

  const signOut = async () => {
    try {
      await authClient.signOut()
    } catch (signOutError) {
      console.error("Sign-out failed:", signOutError)
    }
    router.push("/login")
  }

  return {
    session: (session ?? null) as Session | null,
    loading: false,
    error: null,
    signIn,
    signOut,
  }
}
