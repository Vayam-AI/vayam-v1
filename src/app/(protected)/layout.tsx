import { auth } from "@/lib/authOptions"
import { redirect } from "next/navigation"
import Navbar from "@/components/navbar"
import { OnboardingProvider } from "@/contexts/OnboardingContext"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="flex-1">
        <OnboardingProvider>
          {children}
        </OnboardingProvider>
      </main>
    </div>
  )
}
