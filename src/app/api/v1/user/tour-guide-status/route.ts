import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/authOptions";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const type = req.nextUrl.searchParams.get("type");
    const uid = Number(session.user.id);

    const user = await db
      .select()
      .from(users)
      .where(eq(users.uid, uid))
      .limit(1);

    if (!user[0]) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (type === "conversation") {
      return NextResponse.json({
        is_conversation_onboarding_done: user[0].isConversationsOnboardingDone,
      });
    }

    // Default to home
    return NextResponse.json({
      is_home_onboarding_done: user[0].isHomeOnboardingDone,
    });
  } catch (error) {
    console.error("[GET /api/v1/user/tour-guide-status]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const type = req.nextUrl.searchParams.get("type");
    const uid = Number(session.user.id);
    const body = await req.json();

    if (type === "conversation") {
      if (typeof body.is_conversation_onboarding_done !== "boolean") {
        return NextResponse.json(
          { error: "Invalid conversation onboarding status" },
          { status: 400 }
        );
      }
      await db
        .update(users)
        .set({
          isConversationsOnboardingDone: body.is_conversation_onboarding_done,
        })
        .where(eq(users.uid, uid));
    } else {
      // Default to home
      if (typeof body.is_home_onboarding_done !== "boolean") {
        return NextResponse.json(
          { error: "Invalid home onboarding status" },
          { status: 400 }
        );
      }
      await db
        .update(users)
        .set({ 
          isHomeOnboardingDone: body.is_home_onboarding_done,
        })
        .where(eq(users.uid, uid));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/v1/user/tour-guide-status]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}