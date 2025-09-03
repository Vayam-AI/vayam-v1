import GoogleProvider from "next-auth/providers/google";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import CredentialsProvider from "next-auth/providers/credentials";
import NextAuth, { NextAuthConfig } from "next-auth";
import { db } from "@/db/drizzle";
import { users, passwordHashes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateName } from "@/utils/generateName";
import { PasswordService } from "@/utils/password";

export const authOptions: NextAuthConfig = {
  secret: process.env.NEXTAUTH_SECRET || "development-secret-key",
  trustHost: true,
  basePath: "/api/auth",
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // Microsoft Entra ID - only enable if environment variables are present
    ...(process.env.MICROSOFT_ENTRA_ID_CLIENT_ID && process.env.MICROSOFT_ENTRA_ID_CLIENT_SECRET
      ? [MicrosoftEntraID({
          clientId: process.env.MICROSOFT_ENTRA_ID_CLIENT_ID,
          clientSecret: process.env.MICROSOFT_ENTRA_ID_CLIENT_SECRET,
        })]
      : []),
    // Credentials provider for email/password authentication
    CredentialsProvider({
      id: "credentials",
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Find user by email
          const user = await db
            .select()
            .from(users)
            .where(eq(users.email, credentials.email as string))
            .limit(1);

          if (!user[0]) {
            return null;
          }

          // Get password hash
          const passwordHash = await db
            .select()
            .from(passwordHashes)
            .where(eq(passwordHashes.uid, user[0].uid))
            .limit(1);

          if (!passwordHash[0]) {
            return null;
          }

          // Verify password
          const passwordService = new PasswordService();
          const isValidPassword = await passwordService.verifyPassword(
            credentials.password as string,
            passwordHash[0].pwhash
          );

          if (!isValidPassword) {
            return null;
          }

          // Return user object for NextAuth
          return {
            id: user[0].uid.toString(),
            email: user[0].email!,
            name: user[0].hname!,
            provider: 'credentials'
          };
        } catch (error) {
          console.error("Credentials authorization error:", error);
          return null;
        }
      }
    }),
    // Email-OTP provider for passwordless authentication
    CredentialsProvider({
      id: "email-otp",
      name: "Email and OTP",
      credentials: {
        email: { label: "Email", type: "email" },
        otp: { label: "OTP", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.otp) {
          return null;
        }

        try {
          // Verify OTP first using the existing verify-otp route
          const otpResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              otp: credentials.otp
            })
          });

          if (!otpResponse.ok) {
            return null;
          }

          const otpData = await otpResponse.json();
          if (!otpData.success) {
            return null;
          }

          // Find or create user
          let user = await db
            .select()
            .from(users)
            .where(eq(users.email, credentials.email as string))
            .limit(1);

          if (!user[0]) {
            // Create new user for email+OTP
            const inserted = await db
              .insert(users)
              .values({
                email: credentials.email as string,
                username: generateName(),
                hname: (credentials.email as string).split('@')[0], // Use email prefix as name
                provider: 'email',
                isEmailVerified: true, // OTP verification confirms email
                isMobileVerified: false,
              })
              .returning();
            user = inserted;
          }

          // Return user object for NextAuth
          return {
            id: user[0].uid.toString(),
            email: user[0].email!,
            name: user[0].hname!,
            provider: 'email-otp'
          };
        } catch (error) {
          console.error("Email-OTP authorization error:", error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user, account }: any) {
      // Handle OAuth signin (Google, Microsoft, etc.)
      if (user?.email && account && account.provider !== 'credentials') {
        try {
          const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.email, user.email))
            .limit(1);

          let dbUser = existingUser[0];

          if (!dbUser) {
            // Determine provider
            let provider = 'email';
            if (account.provider === 'google') provider = 'google';
            if (account.provider === 'microsoft-entra-id') provider = 'microsoft';

            const inserted = await db
              .insert(users)
              .values({
                email: user.email,
                username: generateName(),
                hname: user.name || "",
                provider: provider,
                isEmailVerified: provider !== 'email', // OAuth providers are pre-verified
                isMobileVerified: false,
              })
              .returning();
            dbUser = inserted[0];
          } else {
            // User exists - check for provider compatibility
            const currentProvider = account.provider === 'google' ? 'google' 
              : account.provider === 'microsoft-entra-id' ? 'microsoft' 
              : 'email';
            
            // Allow linking OAuth accounts to existing email accounts
            if (dbUser.provider === 'email' && currentProvider !== 'email') {
              // Update user provider to the OAuth provider they're using
              await db
                .update(users)
                .set({ 
                  provider: currentProvider,
                  // Ensure email is verified for OAuth providers
                  isEmailVerified: true 
                })
                .where(eq(users.uid, dbUser.uid));
            }
            
            // If user registered with OAuth but trying to sign in with different OAuth
            else if (dbUser.provider !== 'email' && dbUser.provider !== currentProvider) {
              throw new Error('OAUTH_PROVIDER_CONFLICT');
            }
          }

          token.userId = dbUser.uid.toString();
        } catch (error) {
          console.error("Error in JWT callback:", error);
          if (error instanceof Error && error.message === 'EMAIL_PROVIDER_CONFLICT') {
            throw new Error("This email was registered with email/password. Please sign in using email and password instead.");
          }
          if (error instanceof Error && error.message === 'OAUTH_PROVIDER_CONFLICT') {
            throw new Error("This email is registered with a different provider. Please use the correct sign-in method.");
          }
          throw new Error("Database error during authentication");
        }
      }
      
      // Handle credentials signin (email/password)
      if (user?.email && account && account.provider === 'credentials') {
        token.userId = user.id;
      }
      
      return token;
    },

    async session({ session, token }: any) {
      if (session.user && token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },

    async signIn({ user, account, profile }: any) {
      return true;
    },

    async redirect({ url, baseUrl }: any) {
      // If it's a signout, redirect to home with logout message
      if (url.includes('/api/auth/signout')) {
        return "/?message=logged-out";
      }
      // For sign-in, redirect to mobile verification
      if (url.includes('/api/auth/signin') || url === baseUrl) {
        return "/mobile-verification";
      }
      // If URL starts with baseUrl, it's a relative redirect
      if (url.startsWith(baseUrl)) {
        return url;
      }
      // Default redirect to mobile verification
      return "/mobile-verification";
    },
  },
  events: {
    async signIn({ user, account, profile }: any) {
      // User signed in
    },
  },
};

// Type augmentations for session and JWT
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
    };
  }
}

// Export the NextAuth configuration
export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);