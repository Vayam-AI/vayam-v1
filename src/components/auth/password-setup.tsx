"use client";

import { useState } from "react";
import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Lock,
  Eye,
  EyeOff,
  Shield,
  Check,
  X,
  AlertCircle,
  KeyRound,
} from "lucide-react";

interface PasswordSetupProps {
  updateMode?: boolean;
}

export default function PasswordSetup({ updateMode = false }: PasswordSetupProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  // Password strength validation
  const getPasswordStrength = (password: string) => {
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    const passedChecks = Object.values(checks).filter(Boolean).length;
    const strength = (passedChecks / 5) * 100;

    return {
      strength,
      checks,
      level: strength < 40 ? "weak" : strength < 80 ? "medium" : "strong",
    };
  };

  const passwordStrength = getPasswordStrength(password);
  const passwordsMatch =
    password === confirmPassword && confirmPassword.length > 0;

  const getStrengthColor = (level: string) => {
    switch (level) {
      case "weak":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "strong":
        return "bg-green-500";
      default:
        return "bg-gray-200";
    }
  };

  const getStrengthText = (level: string) => {
    switch (level) {
      case "weak":
        return "Weak";
      case "medium":
        return "Medium";
      case "strong":
        return "Strong";
      default:
        return "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (passwordStrength.strength < 60) {
      toast.error("Please choose a stronger password.");
      return;
    }

    setLoading(true);
    try {
      let res, data;
      if (updateMode) {
        res = await fetch("/api/v1/user/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });
      } else {
        res = await fetch("/api/auth/set-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });
      }
      data = await res.json();
      if (res.ok) {
        toast.success(updateMode ? "Password updated successfully!" : "Password set successfully!");
        if (!updateMode) router.push("/home");
      } else {
        toast.error(data.error || (updateMode ? "Failed to update password." : "Failed to set password."));
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const passwordRequirements = [
    {
      key: "length",
      label: "At least 8 characters",
      met: passwordStrength.checks.length,
    },
    {
      key: "lowercase",
      label: "One lowercase letter",
      met: passwordStrength.checks.lowercase,
    },
    {
      key: "uppercase",
      label: "One uppercase letter",
      met: passwordStrength.checks.uppercase,
    },
    { key: "number", label: "One number", met: passwordStrength.checks.number },
    {
      key: "special",
      label: "One special character",
      met: passwordStrength.checks.special,
    },
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
          <KeyRound className="w-6 h-6" />
        </div>
        <CardTitle className="text-2xl font-bold">
          {updateMode ? "Update Your Password" : "Set Your Password"}
        </CardTitle>
        <p className="text-muted-foreground mt-2">
          {updateMode
            ? "Change your password to keep your account secure."
            : "Create a strong password to secure your account"}
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Password Input */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-10 pr-10"
                placeholder="Enter your password"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Password strength
                  </span>
                  <span
                    className={`font-medium ${
                      passwordStrength.level === "strong"
                        ? "text-green-600"
                        : passwordStrength.level === "medium"
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {getStrengthText(passwordStrength.level)}
                  </span>
                </div>
                <Progress value={passwordStrength.strength} className="h-2" />
              </div>
            )}
          </div>

          {/* Confirm Password Input */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm Password
            </Label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="pl-10 pr-10"
                placeholder="Confirm your password"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Password Match Indicator */}
            {confirmPassword.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                {passwordsMatch ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">Passwords match</span>
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 text-red-500" />
                    <span className="text-red-500">Passwords don't match</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Password Requirements */}
          {password.length > 0 && (
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">
                  Password Requirements
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {passwordRequirements.map((req) => (
                  <div
                    key={req.key}
                    className="flex items-center gap-2 text-sm"
                  >
                    {req.met ? (
                      <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
                    ) : (
                      <X className="w-3 h-3 text-red-500 flex-shrink-0" />
                    )}
                    <span
                      className={
                        req.met ? "text-green-600" : "text-muted-foreground"
                      }
                    >
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-11 text-base font-medium"
            disabled={
              loading || !passwordsMatch || passwordStrength.strength < 60
            }
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                {updateMode ? "Updating Password..." : "Setting Password..."}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                {updateMode ? "Update Password" : "Set Password"}
              </div>
            )}
          </Button>
        </form>

        {/* Security Notice */}
        <div className="bg-muted/20 rounded-lg p-4 border border-muted">
          <div className="flex gap-3">
            <Shield className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Security Notice</p>
              <p className="text-xs text-muted-foreground">
                Your password is encrypted and stored securely. We recommend
                using a unique password that you don't use on other websites.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
