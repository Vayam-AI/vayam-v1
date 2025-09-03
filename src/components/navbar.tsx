"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  User,
  LogOut,
  Plus,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { isAdminUser } from "@/utils/adminCheck";

export default function Navbar() {
  const { data: session } = useSession();
  const [showProfile, setShowProfile] = useState(false);

  const isAdmin = isAdminUser(session?.user?.email);  

  const handleLogout = async () => {
    try {
      // Use signOut with redirect to '/'
      await signOut({ callbackUrl: "/" });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-50 w-full bg-background border-b border-border shadow-sm"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link href="/home" className="flex items-center space-x-3">
                <span className="text-2xl font-bold text-foreground">
                  Vayam
                </span>
              </Link>
            </motion.div>

            {/* Right Side */}
            <div className="flex items-center space-x-4">
              {/* Authentication Buttons for non-signed-in users */}
              {!session?.user && (
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" asChild>
                    <Link href="/signin">
                      Sign In
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link href="/signup">
                      Sign Up
                    </Link>
                  </Button>
                </div>
              )}

              {/* User Menu */}
              {session?.user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="relative h-8 w-8 rounded-full text-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
                      >
                        <div className="flex items-center justify-center rounded-full">
                          <Menu className="h-4 w-4" />
                        </div>
                      </Button>
                    </motion.div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/conversations/create" className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Create Conversation
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/conversations/dashboard" className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Dashboard
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2">
                      <LogOut className="h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </motion.nav>
    </>
  );
}
