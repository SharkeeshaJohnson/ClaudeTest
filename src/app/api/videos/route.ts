import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get("accountId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (accountId) where.accountId = accountId;
    if (status) where.status = status;

    const videos = await prisma.video.findMany({
      where,
      include: {
        account: true,
        metrics: {
          orderBy: { recordedAt: "desc" },
          take: 1,
        },
        notes: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(videos);
  } catch (error) {
    console.error("Failed to fetch videos:", error);
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      accountId,
      title,
      script,
      caption,
      hashtags,
      hook,
      duration,
      status,
      scheduledDate,
    } = body;

    if (!accountId || !title || !duration) {
      return NextResponse.json(
        { error: "accountId, title, and duration are required" },
        { status: 400 }
      );
    }

    const video = await prisma.video.create({
      data: {
        accountId,
        title,
        script,
        caption,
        hashtags: hashtags || [],
        hook,
        duration,
        status: status || "planned",
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      },
      include: {
        account: true,
      },
    });

    return NextResponse.json(video, { status: 201 });
  } catch (error) {
    console.error("Failed to create video:", error);
    return NextResponse.json(
      { error: "Failed to create video" },
      { status: 500 }
    );
  }
}
