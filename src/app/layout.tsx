import type React from "react";
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { SessionWrapper } from "@/components/auth/session-wrapper";
import { ModeToggle } from "@/components/theme/mode-toggle";
import { OnboardingProvider } from "@/contexts/OnboardingContext";

export const metadata: Metadata = {
  title: "Vayam - Empowering Conversations",
  description:
    "A collaborative platform for meaningful conversations and community engagement",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className="font-sans antialiased">
        <SessionWrapper>
          <OnboardingProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster />

              {/* Fixed ModeToggle at bottom right */}
              <div className="fixed bottom-4 right-4 z-50">
                <ModeToggle />
              </div>
            </ThemeProvider>
          </OnboardingProvider>
        </SessionWrapper>
      </body>
    </html>
  );
}
