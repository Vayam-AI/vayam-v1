import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { otpVerificationSchema } from "@/common/authValidations";
import { otpService } from "@/utils/otp";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Handle both validation schemas
    let email, otp;
    try {
      const validatedData = otpVerificationSchema.parse(body);
      email = validatedData.email;
      otp = validatedData.otp;
    } catch {
      // If validation fails, try direct extraction
      email = body.email;
      otp = body.otp;
    }

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: "Email and OTP are required" },
        { status: 400 }
      );
    }

    // Verify OTP
    const isValidOTP = await otpService.verifyOTP(email, otp);

    if (!isValidOTP) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    // Set isEmailVerified true for this user
    await db
      .update(users)
      .set({ isEmailVerified: true })
      .where(eq(users.email, email));

    // Return success for NextAuth
    return NextResponse.json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
