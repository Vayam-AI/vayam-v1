"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import GoogleSignInButton from "./GoogleSignInButton";
import MicrosoftSignInButton from "./MicrosoftSignInButton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface EmailFormData {
  email: string;
}

interface OTPFormData {
  email: string;
  otp: string;
}

interface PasswordFormData {
  email: string;
  password: string;
}

export default function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  // Tab state for switching between OTP and password sign-in
  const [tab, setTab] = useState("otp");
  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({ email: "", password: "" });

  const [emailData, setEmailData] = useState<EmailFormData>({
    email: "",
  });

  const [otpData, setOtpData] = useState<OTPFormData>({
    email: "",
    otp: "",
  });

  // Timer effect for resend button
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    // Show messages from URL parameters
    const message = searchParams.get("message");
    if (message === "logged-out") {
      toast.success("Logged out successfully!");
    }
  }, [searchParams]);

  const handleOAuthSignIn = async (
    provider: "google" | "microsoft-entra-id"
  ) => {
    setOauthLoading(true);
    try {
      // Use NextAuth signIn with correct redirect
      await signIn(provider, {
        callbackUrl: "/mobile-verification",
        redirect: true,
      });
    } catch (error) {
      console.error("OAuth sign-in error:", error);
      toast.error("Sign-in failed. Please try again.");
      setOauthLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailData.email) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailData),
      });

      const data = await response.json();

      if (response.ok) {
        setOtpData({
          email: emailData.email,
          otp: "",
        });
        setIsNewUser(data.isNewUser);
        setShowOTP(true);
        startResendTimer();
        toast.success(`OTP sent to ${emailData.email}`);
      } else {
        toast.error(data.error || "Failed to send OTP");
      }
    } catch (error) {
      console.error("Email submission error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otpData.otp || otpData.otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);

    try {
      // Use NextAuth signIn with email-otp provider
      const result = await signIn("email-otp", {
        email: otpData.email,
        otp: otpData.otp,
        redirect: false,
      });

      if (result?.ok && !result?.error) {
        toast.success(
          isNewUser
            ? "Account created successfully!"
            : "Signed in successfully!"
        );
        // Redirect to mobile verification with NextAuth session
        router.push("/mobile-verification");
      } else {
        console.error("NextAuth email-otp signin error:", result?.error);
        if (result?.error && result.error.includes("different provider")) {
          toast.error(
            "This email is registered with a different provider. Please use the correct sign-in method."
          );
        } else {
          toast.error("Invalid OTP or verification failed");
        }
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    setLoading(true);
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: otpData.email }),
      });

      const data = await response.json();

      if (response.ok) {
        startResendTimer();
        toast.success("OTP resent successfully");
      } else {
        toast.error(data.error || "Failed to resend OTP");
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      toast.error("Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  const startResendTimer = () => {
    setCanResend(false);
    setResendTimer(180); // 3 minutes
  };

  const handleBackToEmail = () => {
    setShowOTP(false);
    setOtpData({ email: "", otp: "" });
    setResendTimer(0);
    setCanResend(true);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailData({ email: e.target.value });
  };

  const handleOTPChange = (value: string) => {
    setOtpData((prev) => ({ ...prev, otp: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.email || !passwordForm.password) {
      toast.error("Please enter both email and password");
      return;
    }
    setLoading(true);
    try {
      // Use NextAuth credentials provider to create session
      const result = await signIn("credentials", {
        email: passwordForm.email,
        password: passwordForm.password,
        redirect: false,
      });
      if (result?.ok && !result?.error) {
        toast.success("Signed in successfully!");
        router.push("/mobile-verification");
      } else {
        toast.error(result?.error || "Invalid email or password");
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {showOTP ? "Enter Verification Code" : "Welcome to Vayam"}
          </CardTitle>
          <CardDescription>
            {showOTP
              ? `We sent a code to ${otpData.email}`
              : "Sign in or create an account to continue"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {!showOTP ? (
            <>
              {/* OAuth Buttons */}
              <div className="space-y-3">
                <GoogleSignInButton />
                <MicrosoftSignInButton />
              </div>

              {/* Divider and Tabs for sign-in method */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400">
                    or
                  </span>
                </div>
              </div>

              <Tabs value={tab} onValueChange={setTab} className="w-full">
                <TabsList className="w-full grid grid-cols-2 mb-4">
                  <TabsTrigger value="otp">Sign in with OTP</TabsTrigger>
                  <TabsTrigger value="password">Sign in with Password</TabsTrigger>
                </TabsList>
                <TabsContent value="otp">
                  <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={emailData.email}
                        onChange={handleEmailChange}
                        required
                        disabled={loading || oauthLoading}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loading || oauthLoading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending code...
                        </>
                      ) : (
                        "Continue with Email"
                      )}
                    </Button>
                  </form>
                </TabsContent>
                <TabsContent value="password">
                  <form onSubmit={handlePasswordSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="password-email">Email</Label>
                      <Input
                        id="password-email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        value={passwordForm.email}
                        onChange={handlePasswordChange}
                        required
                        disabled={loading || oauthLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Enter your password"
                        value={passwordForm.password}
                        onChange={handlePasswordChange}
                        required
                        disabled={loading || oauthLoading}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loading || oauthLoading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign in with Password"
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            /* OTP Form */
            <form onSubmit={handleOTPSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otpData.otp}
                    onChange={handleOTPChange}
                    disabled={loading}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Enter the 6-digit code sent to your email
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || otpData.otp.length !== 6}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Code"
                )}
              </Button>

              {/* Resend OTP */}
              <div className="text-center">
                {canResend ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleResendOTP}
                    disabled={loading}
                  >
                    Resend code
                  </Button>
                ) : (
                  <p className="text-sm text-gray-500">
                    Resend code in {resendTimer}s
                  </p>
                )}
              </div>

              {/* Back to email */}
              <div className="text-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToEmail}
                  disabled={loading}
                >
                  ← Use different email
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}