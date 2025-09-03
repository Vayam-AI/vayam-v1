"use client";
import AuthForm from "@/components/auth/auth-form";
import { Suspense } from "react";

export default function AuthPage() {
  // Only render AuthForm if unauthenticated
  return (
    <div className="min-h-screen">
      <Suspense>
        <AuthForm />
      </Suspense>
    </div>
  );
}
