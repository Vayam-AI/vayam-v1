"use client";

import { signIn } from "next-auth/react";

export default function GoogleSignInButton() {
  return (
    <button
      type="button"
      onClick={() => signIn("google", { callbackUrl: "/mobile-verification" })}
      className="w-full flex items-center justify-center gap-2 bg-white dark:bg-white text-neutral-900 border border-neutral-300 rounded-lg font-medium text-base py-3 shadow-sm cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 focus:ring-offset-white"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g clipPath="url(#clip0_993_156)">
          <path
            d="M19.8052 10.2306C19.8052 9.55054 19.7481 8.86797 19.6265 8.20001H10.2V12.0491H15.6261C15.3982 13.2851 14.6552 14.3662 13.6016 15.0582V17.3171H16.6012C18.3472 15.7122 19.8052 13.2218 19.8052 10.2306Z"
            fill="#4285F4"
          />
          <path
            d="M10.2 20C12.7002 20 14.7712 19.1835 16.6012 17.3171L13.6016 15.0582C12.6107 15.7282 11.4062 16.1154 10.2 16.0909C7.78998 16.0909 5.73598 14.4828 4.96598 12.2948H1.8457V14.6242C3.6847 17.9222 6.78998 20 10.2 20Z"
            fill="#34A853"
          />
          <path
            d="M4.96598 12.2948C4.74998 11.6588 4.63636 10.9939 4.63636 10.3182C4.63636 9.64254 4.74998 8.97763 4.96598 8.34163V6.01221H1.8457C1.1537 7.36763 0.799988 8.82545 0.799988 10.3182C0.799988 11.8109 1.1537 13.2687 1.8457 14.6242L4.96598 12.2948Z"
            fill="#FBBC05"
          />
          <path
            d="M10.2 4.54545C11.5227 4.54545 12.7262 5.00272 13.6843 5.90909L16.6716 3.02182C14.7712 1.31636 12.7002 0.5 10.2 0.5C6.78998 0.5 3.6847 2.57782 1.8457 5.87582L4.96598 8.34163C5.73598 6.15363 7.78998 4.54545 10.2 4.54545Z"
            fill="#EA4335"
          />
        </g>
        <defs>
          <clipPath id="clip0_993_156">
            <rect
              width="19"
              height="19.5"
              fill="white"
              transform="translate(0.799988 0.5)"
            />
          </clipPath>
        </defs>
      </svg>
      Continue with Google
    </button>
  );
}
