import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { users, passwordHashes } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { emailSigninSchema } from "@/common/authValidations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parse = emailSigninSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ error: parse.error.issues[0].message }, { status: 400 });
    }
    const { email, password } = parse.data;
    // Find user by email
    const userRows = await db.select().from(users).where(eq(users.email, email));
    if (!userRows.length) {
      return NextResponse.json({ error: "This email is not registered" }, { status: 401 });
    }
    const user = userRows[0];
    // Find password hash by uid
    const pwRows = await db.select().from(passwordHashes).where(eq(passwordHashes.uid, user.uid));
    if (!pwRows.length) {
      return NextResponse.json({ error: "Password was not set for your account please use the OTP verification" }, { status: 401 });
    }
    const hash = pwRows[0].pwhash;
    const valid = await bcrypt.compare(password, hash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }
    // Success: return minimal user info (customize as needed)
    return NextResponse.json({ success: true, uid: user.uid, email: user.email });
  } catch (error) {
    console.error("[POST /api/auth/password-login]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
