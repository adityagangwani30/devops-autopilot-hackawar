"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  name: string
  email: string
  image?: string
  role?: string
}

interface Session {
  user: User
  session: {
    id: string
    expiresAt: string
    token: string
  }
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch("/api/auth/get-session")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) {
          setSession(data)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const signIn = async (provider: string) => {
    const res = await fetch(`/api/auth/sign-in/${provider}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callbackURL: "/dashboard" }),
    })
    const data = await res.json()
    if (data?.url) {
      window.location.href = data.url
    }
  }

  const signOut = async () => {
    await fetch("/api/auth/sign-out", { method: "POST" })
    setSession(null)
    router.push("/login")
  }

  return { session, loading, signIn, signOut }
}
