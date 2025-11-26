import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await params;
    const streak = await prisma.streak.findUnique({
      where: { accountId },
    });

    if (!streak) {
      // Create default streak if not exists
      const newStreak = await prisma.streak.create({
        data: {
          accountId,
          currentStreak: 0,
          longestStreak: 0,
          totalXP: 0,
        },
      });
      return NextResponse.json(newStreak);
    }

    return NextResponse.json(streak);
  } catch (error) {
    console.error("Failed to fetch streak:", error);
    return NextResponse.json(
      { error: "Failed to fetch streak" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await params;
    const body = await request.json();
    const { action } = body; // "checkin", "post", "metrics"

    // Get current streak
    let streak = await prisma.streak.findUnique({
      where: { accountId },
    });

    if (!streak) {
      streak = await prisma.streak.create({
        data: {
          accountId,
          currentStreak: 0,
          longestStreak: 0,
          totalXP: 0,
        },
      });
    }

    const now = new Date();
    const lastActivity = streak.lastActivityDate
      ? new Date(streak.lastActivityDate)
      : null;

    // Check if this is a new day
    const isNewDay = !lastActivity ||
      lastActivity.toDateString() !== now.toDateString();

    // Calculate XP based on action
    let xpGain = 0;
    switch (action) {
      case "checkin":
        xpGain = 5;
        break;
      case "post":
        xpGain = 50;
        break;
      case "metrics":
        xpGain = 20;
        break;
      default:
        xpGain = 10;
    }

    // Calculate streak update
    let newCurrentStreak = streak.currentStreak;
    if (isNewDay) {
      // Check if streak should continue or reset
      if (lastActivity) {
        const dayDiff = Math.floor(
          (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (dayDiff === 1) {
          // Consecutive day
          newCurrentStreak = streak.currentStreak + 1;
          xpGain += 10; // Streak bonus
        } else if (dayDiff > 1) {
          // Streak broken
          newCurrentStreak = 1;
        }
      } else {
        newCurrentStreak = 1;
      }
    }

    // Update streak
    const updatedStreak = await prisma.streak.update({
      where: { accountId },
      data: {
        currentStreak: newCurrentStreak,
        longestStreak: Math.max(streak.longestStreak, newCurrentStreak),
        lastActivityDate: now,
        totalXP: streak.totalXP + xpGain,
      },
    });

    return NextResponse.json({
      streak: updatedStreak,
      xpGained: xpGain,
      isNewDay,
    });
  } catch (error) {
    console.error("Failed to update streak:", error);
    return NextResponse.json(
      { error: "Failed to update streak" },
      { status: 500 }
    );
  }
}
