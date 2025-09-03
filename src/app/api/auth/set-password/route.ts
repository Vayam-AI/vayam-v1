import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { users, passwordHashes } from "@/db/schema";
import { auth } from "@/lib/authOptions";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const uid = Number(session.user.id);
    const { password } = await req.json();
    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }
    const hash = await bcrypt.hash(password, 10);
    // Upsert password hash for user
    await db
      .insert(passwordHashes)
      .values({ uid, pwhash: hash })
      .onConflictDoUpdate({
        target: passwordHashes.uid,
        set: { pwhash: hash },
      });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/auth/set-password]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
