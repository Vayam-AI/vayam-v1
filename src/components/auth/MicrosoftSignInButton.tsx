"use client";

import { signIn } from "next-auth/react";

export default function MicrosoftSignInButton() {
  return (
    <button
      type="button"
      onClick={() => signIn("microsoft", { callbackUrl: "/mobile-verification" })}
      className="w-full flex items-center justify-center gap-2 bg-white dark:bg-white text-neutral-900 border border-neutral-300 rounded-lg font-medium text-base py-3 shadow-sm cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 focus:ring-offset-white"
    >
      {/* Microsoft logo: four colored squares */}
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="8" height="8" fill="#F25022"/>
        <rect x="11" y="1" width="8" height="8" fill="#7FBA00"/>
        <rect x="1" y="11" width="8" height="8" fill="#00A4EF"/>
        <rect x="11" y="11" width="8" height="8" fill="#FFB900"/>
      </svg>
      Continue with Microsoft
    </button>
  );
}
