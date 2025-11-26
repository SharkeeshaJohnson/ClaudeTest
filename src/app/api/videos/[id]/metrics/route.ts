import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const metrics = await prisma.videoMetric.findMany({
      where: { videoId: id },
      orderBy: { recordedAt: "desc" },
    });

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Failed to fetch video metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch video metrics" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { platform, views, likes, comments, shares } = body;

    if (!platform) {
      return NextResponse.json(
        { error: "Platform is required" },
        { status: 400 }
      );
    }

    // Verify video exists
    const video = await prisma.video.findUnique({
      where: { id },
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const metric = await prisma.videoMetric.create({
      data: {
        videoId: id,
        platform,
        views: views || 0,
        likes: likes || 0,
        comments: comments || 0,
        shares: shares || 0,
      },
    });

    return NextResponse.json(metric, { status: 201 });
  } catch (error) {
    console.error("Failed to create video metric:", error);
    return NextResponse.json(
      { error: "Failed to create video metric" },
      { status: 500 }
    );
  }
}
