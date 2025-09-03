"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Loading from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSession } from "next-auth/react";
import PasswordSetup from "@/components/auth/password-setup";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  Settings, 
  ArrowLeft,
  CheckCircle,
  XCircle,
  Edit3
} from "lucide-react";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [hasPassword, setHasPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/signin");
      return;
    }
    async function fetchProfile() {
      setLoading(true);
      try {
        const res = await fetch("/api/v1/user/profile");
        const data = await res.json();
        if (res.ok) {
          setUser(data.user);
          setHasPassword(!!data.hasPassword);
          setError(null);
        } else {
          setError(data.error || "Failed to load profile");
        }
      } catch {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [status, router]);

  if (loading || status === "loading") return <Loading />;
  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Error Loading Profile
              </h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  if (!user) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const verificationStats = [
    {
      label: "Email Verified",
      verified: user.isEmailVerified,
      icon: Mail,
    },
    {
      label: "Mobile Verified",
      verified: user.isMobileVerified,
      icon: Phone,
    },
  ];

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/home")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">My Profile</h1>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Profile Card */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-6">
                    <div className="space-y-1">
                      <h2 className="text-2xl font-bold">
                        {user.hname || user.username || "Welcome!"}
                      </h2>
                      <p className="text-muted-foreground flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {user.email}
                      </p>
                      {user.mobile && (
                        <p className="text-muted-foreground flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {user.mobile}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Account Details */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Account Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                          Username
                        </span>
                        <span className="text-sm font-mono">
                          {user.username || "Not set"}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                          Provider
                        </span>
                        <Badge variant="secondary">
                          {user.provider?.charAt(0).toUpperCase() +
                            user.provider?.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Joined
                        </span>
                        <span className="text-sm">
                          {user.createdAt
                            ? formatDate(user.createdAt)
                            : "Unknown"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {user.tags && user.tags.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {user.tags.map((tag: string, index: number) => (
                        <Badge key={index} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Verification Status */}
            <Card>
              <CardHeader className="pb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Verification Status
                </h3>
              </CardHeader>
              <CardContent className="space-y-3">
                {verificationStats.map((stat, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted"
                  >
                    <div className="flex items-center gap-2">
                      <stat.icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{stat.label}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {stat.verified ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span
                        className={`text-xs font-medium ${
                          stat.verified ? "text-green-600" : "text-red-500"
                        }`}
                      >
                        {stat.verified ? "Verified" : "Unverified"}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Password Setup Component at the very bottom */}
        <div className="max-w-2xl mx-auto mt-10">
          {hasPassword ? (
            <>
              <div className="mb-4 text-center text-green-700 font-medium">
                You have already set a password. You can update your password below.
              </div>
              <PasswordSetup updateMode />
            </>
          ) : (
            <PasswordSetup />
          )}
        </div>
      </div>
    </div>
  );
}