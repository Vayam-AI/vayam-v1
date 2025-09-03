import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { users, passwordHashes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/authOptions";
import { passwordService } from "@/utils/password";

export async function GET(req: NextRequest) {
  try {
    // Get session using NextAuth
    const session = await auth();
    
    // Check if user is authenticated
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" }, 
        { status: 401 }
      );
    }

    const uid = Number(session.user.id);

    // Fetch user details from the database
    const user = await db
      .select({
        uid: users.uid,
        username: users.username,
        hname: users.hname,
        email: users.email,
        mobile: users.mobile,
        provider: users.provider,
        tags: users.tags,
        isEmailVerified: users.isEmailVerified,
        isMobileVerified: users.isMobileVerified,
        isHomeOnboardingDone: users.isHomeOnboardingDone,
        isConversationsOnboardingDone: users.isConversationsOnboardingDone,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.uid, uid))
      .limit(1);

    // Check if user exists
    if (!user || user.length === 0) {
      return NextResponse.json(
        { error: "User not found" }, 
        { status: 404 }
      );
    }

    const userProfile = user[0];

    const password = await db
      .select({
        password: passwordHashes.pwhash,
      })
      .from(passwordHashes)
      .where(eq(passwordHashes.uid, uid))
      .limit(1);

    // Only return if password exists (do not return hash)
    const hasPassword = !!(password && password.length > 0 && password[0]?.password);

    // Return user profile data
    return NextResponse.json({
      success: true,
      user: userProfile,
      hasPassword,
    });

  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Get session using NextAuth
    const session = await auth();
    
    // Check if user is authenticated
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" }, 
        { status: 401 }
      );
    }

    const uid = Number(session.user.id);
    const body = await req.json();


    // Define allowed fields that can be updated
    const allowedUpdates = {
      hname: body.hname,
      mobile: body.mobile,
      tags: body.tags,
      isHomeOnboardingDone: body.isHomeOnboardingDone,
      isConversationsOnboardingDone: body.isConversationsOnboardingDone,
    };

    // Remove undefined fields
    const updates = Object.fromEntries(
      Object.entries(allowedUpdates).filter(([_, value]) => value !== undefined)
    );

    // If password is present, hash and upsert it
    let passwordUpdated = false;
    if (body.password) {
      const hashed = await passwordService.hashPassword(body.password);
      // Upsert password hash for the user
      const existing = await db
        .select()
        .from(passwordHashes)
        .where(eq(passwordHashes.uid, uid))
        .limit(1);
      if (existing.length > 0) {
        await db
          .update(passwordHashes)
          .set({ pwhash: hashed })
          .where(eq(passwordHashes.uid, uid));
      } else {
        await db.insert(passwordHashes).values({ uid, pwhash: hashed });
      }
      passwordUpdated = true;
    }

    // Check if there are any updates to apply
    if (Object.keys(updates).length === 0 && !passwordUpdated) {
      return NextResponse.json(
        { error: "No valid fields to update" }, 
        { status: 400 }
      );
    }

    // Update user profile if there are updates
    let updatedUser = [];
    if (Object.keys(updates).length > 0) {
      updatedUser = await db
        .update(users)
        .set(updates)
        .where(eq(users.uid, uid))
        .returning({
          uid: users.uid,
          username: users.username,
          hname: users.hname,
          email: users.email,
          mobile: users.mobile,
          provider: users.provider,
          tags: users.tags,
          isEmailVerified: users.isEmailVerified,
          isMobileVerified: users.isMobileVerified,
          isHomeOnboardingDone: users.isHomeOnboardingDone,
          isConversationsOnboardingDone: users.isConversationsOnboardingDone,
          createdAt: users.createdAt,
        });
    } else {
      // If only password was updated, fetch the user
      updatedUser = await db
        .select({
          uid: users.uid,
          username: users.username,
          hname: users.hname,
          email: users.email,
          mobile: users.mobile,
          provider: users.provider,
          tags: users.tags,
          isEmailVerified: users.isEmailVerified,
          isMobileVerified: users.isMobileVerified,
          isHomeOnboardingDone: users.isHomeOnboardingDone,
          isConversationsOnboardingDone: users.isConversationsOnboardingDone,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.uid, uid))
        .limit(1);
    }

    // Check if user was found and updated
    if (!updatedUser || updatedUser.length === 0) {
      return NextResponse.json(
        { error: "User not found" }, 
        { status: 404 }
      );
    }

    // Return updated user profile
    return NextResponse.json({
      success: true,
      message: passwordUpdated
        ? Object.keys(updates).length > 0
          ? "Profile and password updated successfully"
          : "Password updated successfully"
        : "Profile updated successfully",
      user: updatedUser[0],
      passwordUpdated,
    });

  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}
