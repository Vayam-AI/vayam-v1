import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { otpService } from '@/utils/otp';
import { sendEmail } from '@/utils/email';
import { db } from '@/db/drizzle';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { generateName } from '@/utils/generateName';
import { otpEmailTemplate } from '@/templates/otpEmail';
import { generateDisplayNameFromEmail } from '@/utils/extractUsername';

// Validation schema
const emailAuthSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

// Simple rate limiting using Map (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(ip);
  
  if (!userLimit || now > userLimit.resetTime) {
    // Reset or create new limit
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 }); // 1 minute window
    return false;
  }
  
  if (userLimit.count >= 3) { // Max 3 requests per minute
    return true;
  }
  
  userLimit.count++;
  return false;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a minute before trying again.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validatedData = emailAuthSchema.parse(body);
    

    // Check if user already exists and if provider matches
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1);

    let user = existingUser[0];
    let isNewUser = false;

    if (user) {
      // If provider is not 'email', block and return error
      if (user.provider && user.provider !== 'email') {
        return NextResponse.json(
          { error: 'This email is registered with a different provider. Please use the correct sign-in method.' },
          { status: 400 }
        );
      }
    } else {
      // If user doesn't exist, create a new user
      isNewUser = true;
      const displayName = generateDisplayNameFromEmail(validatedData.email);
      const insertedUser = await db
        .insert(users)
        .values({
          email: validatedData.email,
          username: generateName(),
          hname: displayName,
          provider: 'email',
          isEmailVerified: false,
          isMobileVerified: false,
        })
        .returning();
      user = insertedUser[0];
    }

    // Generate and send OTP
    const otp = otpService.generateOTP();
    await otpService.storeOTP(validatedData.email, otp);
    
    // Send OTP email
    const emailHtml = otpEmailTemplate({
      name: user.hname || user.username || 'User',
      otp: otp
    });
    await sendEmail(
      validatedData.email,
      isNewUser ? 'Welcome! Verify your email' : 'Sign in to your account',
      emailHtml,
      true
    );

    return NextResponse.json(
      { 
        message: `OTP sent to ${validatedData.email}`,
        email: validatedData.email,
        isNewUser,
  otpExpiry: 180 // 3 minutes in seconds
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Email auth error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid email address', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
