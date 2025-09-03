"use client"

import { SessionProvider } from "next-auth/react"
import type React from "react"

export function SessionWrapper({ children }: { children: React.ReactNode }) {
  return <SessionProvider basePath="/api/auth">{children}</SessionProvider>
}