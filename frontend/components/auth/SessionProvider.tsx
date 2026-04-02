"use client"

import { createContext, useContext } from "react"
import { authClient } from "@/lib/auth-client"

type Session = typeof authClient.$Infer.Session

const SessionContext = createContext<Session | null>(null)

export function SessionProvider({
  children,
  session,
}: {
  children: React.ReactNode
  session: Session
}) {
  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSessionContext() {
  return useContext(SessionContext)
}
