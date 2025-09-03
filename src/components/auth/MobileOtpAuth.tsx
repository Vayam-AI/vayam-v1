"use client";

import React, { useState, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from "firebase/auth";
import { app } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Loader2, ArrowLeft, Phone, Shield } from "lucide-react";

export const MobileOtpAuth = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const auth = getAuth(app);
  const router = useRouter();
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const recaptchaInitialized = useRef<boolean>(false);

  // Initialize reCAPTCHA with better error handling
  const initializeRecaptcha = () => {
    if (!recaptchaInitialized.current) {
      try {
        // Clear any existing recaptcha container
        const container = document.getElementById("recaptcha-container");
        if (container) {
          container.innerHTML = "";
        }

        recaptchaVerifierRef.current = new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          {
            size: "invisible",
            callback: (response: string) => {
              console.log("reCAPTCHA solved:", response);
            },
            "expired-callback": () => {
              console.log("reCAPTCHA expired");
              toast.error("Security verification expired. Please try again.");
              resetRecaptcha();
            },
            "error-callback": (error: any) => {
              console.error("reCAPTCHA error:", error);
              toast.error(
                "Security verification failed. Please refresh and try again."
              );
              resetRecaptcha();
            },
          }
        );

        // Render the reCAPTCHA
        recaptchaVerifierRef.current
          .render()
          .then(() => {
            console.log("reCAPTCHA rendered successfully");
            recaptchaInitialized.current = true;
          })
          .catch((error) => {
            console.error("Error rendering reCAPTCHA:", error);
            toast.error(
              "Failed to initialize security verification. Please refresh the page."
            );
          });
      } catch (error) {
        console.error("Error initializing reCAPTCHA:", error);
        toast.error(
          "Failed to initialize security verification. Please refresh the page."
        );
      }
    }
  };

  // Reset reCAPTCHA
  const resetRecaptcha = () => {
    if (recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current.clear();
      } catch (error) {
        console.warn("Error clearing reCAPTCHA:", error);
      }
      recaptchaVerifierRef.current = null;
    }
    recaptchaInitialized.current = false;
  };

  useEffect(() => {
    // Initialize reCAPTCHA when component mounts
    const timer = setTimeout(() => {
      initializeRecaptcha();
    }, 100);

    return () => {
      clearTimeout(timer);
      resetRecaptcha();
    };
  }, [auth]);

  // Resend timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, "");
    return `+91${cleaned}`;
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, "");
    return cleaned.length === 10 && /^[6-9]/.test(cleaned);
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) {
      setPhoneNumber(value);
    }
  };

  const handleOtpChange = (value: string) => {
    setOtp(value);
  };

  const handleSendOtp = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      toast.error(
        "Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9"
      );
      return;
    }

    setLoading(true);

    try {
      // Check if mobile already exists
      const existsRes = await fetch("/api/auth/mobile-exists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: formatPhoneNumber(phoneNumber) }),
      });
      const existsData = await existsRes.json();
      if (existsData.exists) {
        toast.error(
          "This mobile number is already registered. Please use a different number or sign in."
        );
        setLoading(false);
        return;
      }

      const formattedPhoneNumber = formatPhoneNumber(phoneNumber);
      console.log("Attempting to send OTP to:", formattedPhoneNumber);

      // Ensure reCAPTCHA is initialized
      if (!recaptchaVerifierRef.current || !recaptchaInitialized.current) {
        console.log("Reinitializing reCAPTCHA...");
        resetRecaptcha();
        initializeRecaptcha();

        // Wait a bit for initialization
        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (!recaptchaVerifierRef.current) {
          throw new Error("Failed to initialize security verification");
        }
      }

      const confirmation = await signInWithPhoneNumber(
        auth,
        formattedPhoneNumber,
        recaptchaVerifierRef.current
      );

      setConfirmationResult(confirmation);
      setOtpSent(true);
      setResendTimer(60);
      toast.success("OTP sent successfully!");
    } catch (error: any) {
      console.error("Error sending OTP:", error);

      let errorMessage = "Failed to send OTP. Please try again.";

      switch (error.code) {
        case "auth/invalid-phone-number":
          errorMessage = "Invalid phone number format.";
          break;
        case "auth/too-many-requests":
          errorMessage = "Too many attempts. Please try again later.";
          break;
        case "auth/captcha-check-failed":
          errorMessage =
            "Security verification failed. Please refresh and try again.";
          resetRecaptcha();
          break;
        case "auth/invalid-app-credential":
          errorMessage = "App configuration error. Please contact support.";
          break;
        case "auth/network-request-failed":
          errorMessage =
            "Network error. Please check your internet connection.";
          break;
        case "auth/quota-exceeded":
          errorMessage = "Daily SMS limit exceeded. Please try again tomorrow.";
          break;
        default:
          if (error.message?.includes("reCAPTCHA")) {
            errorMessage =
              "Security verification failed. Please refresh and try again.";
            resetRecaptcha();
          }
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async () => {
    if (!confirmationResult) {
      toast.error("Please request OTP first");
      return;
    }

    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    setOtpLoading(true);
    try {
      const result = await confirmationResult.confirm(otp);
      console.log("User signed in successfully:", result.user.uid);

      // Update mobile in DB
      const response = await fetch("/api/auth/update-mobile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: formatPhoneNumber(phoneNumber) }),
      });
      if (!response.ok) {
        throw new Error("Failed to update mobile number in DB");
      }

      // Now sign in with NextAuth (email-otp or credentials provider)
      const signInRes = await signIn("email-otp", {
        redirect: false,
        mobile: formatPhoneNumber(phoneNumber),
        otp,
      });

      if (signInRes?.ok) {
        toast.success("Phone number verified and signed in successfully!");
        // Reset form
        setOtp("");
        setOtpSent(false);
        setConfirmationResult(null);
        router.push("/home");
      } else {
        toast.error("Verification succeeded but sign-in failed. Please try again or contact support.");
      }
    } catch (error: any) {
      console.error("Error confirming OTP:", error);

      let errorMessage = "Invalid OTP. Please try again.";

      switch (error.code) {
        case "auth/invalid-verification-code":
          errorMessage =
            "Invalid verification code. Please check and try again.";
          break;
        case "auth/code-expired":
          errorMessage =
            "Verification code has expired. Please request a new one.";
          break;
        case "auth/session-expired":
          errorMessage = "Session expired. Please request a new OTP.";
          setOtpSent(false);
          setConfirmationResult(null);
          break;
      }

      toast.error(errorMessage);
      setOtp("");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    // Reset state
    setOtpSent(false);
    setConfirmationResult(null);
    setOtp("");
    // Reset and reinitialize reCAPTCHA for resend
    resetRecaptcha();
    setTimeout(() => {
      initializeRecaptcha();
      setTimeout(() => {
        handleSendOtp();
      }, 500);
    }, 100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpSent) {
      handleOTPSubmit();
    } else {
      handleSendOtp();
    }
  };

  const handleBackToPhone = () => {
    setOtpSent(false);
    setConfirmationResult(null);
    setOtp("");
    setResendTimer(0);
    resetRecaptcha();
    setTimeout(initializeRecaptcha, 100);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 relative">
      <h1 className="text-2xl font-bold mb-2">
        Just one step away to join the conversation
      </h1>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-muted rounded-full">
            {otpSent ? (
              <Shield className="w-6 h-6" />
            ) : (
              <Phone className="w-6 h-6" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {otpSent ? "Verify OTP" : "Mobile Verification"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {otpSent
              ? `We've sent a 6-digit code to ${formatPhoneNumber(phoneNumber)}`
              : "Enter your phone number to receive a verification code"}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!otpSent ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="phone">Mobile Number</Label>
                  <div className="flex items-center">
                    <span className="px-3 py-2 border border-r-0 rounded-l-md bg-muted text-muted-foreground select-none">
                      +91
                    </span>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="9876543210"
                      value={phoneNumber}
                      onChange={handlePhoneNumberChange}
                      disabled={loading}
                      className="rounded-l-none"
                      maxLength={10}
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    loading ||
                    phoneNumber.length !== 10 ||
                    !validatePhoneNumber(phoneNumber)
                  }
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    "Send Verification Code"
                  )}
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="otp">Verification Code</Label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={handleOtpChange}
                      disabled={otpLoading}
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
                    Enter the 6-digit code sent to your phone
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={otpLoading || otp.length !== 6}
                >
                  {otpLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify Code"
                  )}
                </Button>

                <div className="flex flex-col space-y-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleResendOtp}
                    disabled={resendTimer > 0 || loading}
                    className="text-sm"
                  >
                    {resendTimer > 0
                      ? `Resend in ${resendTimer}s`
                      : "Resend Code"}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleBackToPhone}
                    className="text-sm"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Change Phone Number
                  </Button>
                </div>
              </>
            )}
          </form>
          {/* reCAPTCHA container - keep it visible for debugging */}
          <div id="recaptcha-container" className="mt-4"></div>
        </CardContent>
      </Card>
      {/* Skip for now button at bottom right */}
      <button
        className="fixed bottom-6 right-6 bg-muted text-muted-foreground px-4 py-2 rounded shadow text-xs hover:bg-accent transition"
        onClick={() => router.push("/home")}
        type="button"
      >
        Skip for now
      </button>
    </div>
  );
};

export default MobileOtpAuth;
