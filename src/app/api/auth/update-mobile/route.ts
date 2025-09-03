import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { auth } from "@/lib/authOptions";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const uid = Number(session.user.id);
    const { mobile } = await req.json();
    if (!mobile || typeof mobile !== "string") {
      return NextResponse.json(
        { error: "Mobile number required" },
        { status: 400 }
      );
    }
    await db
      .update(users)
      .set({ isMobileVerified: true, mobile })
      .where(eq(users.uid, uid));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/auth/mobile-update]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
