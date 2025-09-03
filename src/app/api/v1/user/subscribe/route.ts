import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/authOptions";
import { subscribed } from "@/db/schema";

// GET: fetch current user's subscribe status for a conversation
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const uid = Number(session.user.id);
    const { searchParams } = new URL(req.url);
    const zid = Number(searchParams.get("zid"));
    if (!zid) {
      return NextResponse.json({ error: "Missing zid" }, { status: 400 });
    }
    const result = await db.select().from(subscribed).where(and(eq(subscribed.uid, uid), eq(subscribed.zid, zid)));
    return NextResponse.json({ isSubscribed: result.length > 0 });
  } catch (error) {
    console.error("[GET /api/v1/user/subscribe]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: subscribe or unsubscribe current user to a conversation
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const uid = Number(session.user.id);
    const { zid, subscribe } = await req.json();
    if (typeof zid !== "number" || typeof subscribe !== "boolean") {
      return NextResponse.json(
        { error: "zid (number) and subscribe (boolean) required" },
        { status: 400 }
      );
    }
    if (subscribe) {
      // Subscribe: insert if not exists
      await db.insert(subscribed).values({ uid, zid }).onConflictDoNothing();
    } else {
      // Unsubscribe: delete
      await db.delete(subscribed).where(and(eq(subscribed.uid, uid), eq(subscribed.zid, zid)));
    }
    return NextResponse.json({ success: true, subscribed: subscribe });
  } catch (error) {
    console.error("[POST /api/v1/user/subscribe]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
