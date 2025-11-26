import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get("accountId");
    const platform = searchParams.get("platform");
    const days = parseInt(searchParams.get("days") || "30");

    if (!accountId) {
      return NextResponse.json(
        { error: "accountId is required" },
        { status: 400 }
      );
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const where: Record<string, unknown> = {
      accountId,
      recordedAt: { gte: startDate },
    };
    if (platform) where.platform = platform;

    const metrics = await prisma.accountMetric.findMany({
      where,
      orderBy: { recordedAt: "asc" },
    });

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Failed to fetch account metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch account metrics" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      accountId,
      platform,
      followers,
      reach,
      impressions,
      profileViews,
      engagementRate,
      totalViews,
      totalLikes,
      totalComments,
      totalShares,
    } = body;

    if (!accountId || !platform) {
      return NextResponse.json(
        { error: "accountId and platform are required" },
        { status: 400 }
      );
    }

    const metric = await prisma.accountMetric.create({
      data: {
        accountId,
        platform,
        followers: followers || 0,
        reach,
        impressions,
        profileViews,
        engagementRate,
        totalViews,
        totalLikes,
        totalComments,
        totalShares,
      },
    });

    return NextResponse.json(metric, { status: 201 });
  } catch (error) {
    console.error("Failed to create account metric:", error);
    return NextResponse.json(
      { error: "Failed to create account metric" },
      { status: 500 }
    );
  }
}
