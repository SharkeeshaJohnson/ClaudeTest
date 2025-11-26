import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const video = await prisma.video.findUnique({
      where: { id },
      include: {
        account: true,
        metrics: {
          orderBy: { recordedAt: "desc" },
        },
        notes: true,
      },
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    return NextResponse.json(video);
  } catch (error) {
    console.error("Failed to fetch video:", error);
    return NextResponse.json(
      { error: "Failed to fetch video" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      title,
      script,
      caption,
      hashtags,
      hook,
      duration,
      status,
      postedDate,
      scheduledDate,
    } = body;

    const video = await prisma.video.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(script !== undefined && { script }),
        ...(caption !== undefined && { caption }),
        ...(hashtags !== undefined && { hashtags }),
        ...(hook !== undefined && { hook }),
        ...(duration !== undefined && { duration }),
        ...(status !== undefined && { status }),
        ...(postedDate !== undefined && {
          postedDate: postedDate ? new Date(postedDate) : null,
        }),
        ...(scheduledDate !== undefined && {
          scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        }),
      },
      include: {
        account: true,
        metrics: {
          orderBy: { recordedAt: "desc" },
          take: 1,
        },
        notes: true,
      },
    });

    return NextResponse.json(video);
  } catch (error) {
    console.error("Failed to update video:", error);
    return NextResponse.json(
      { error: "Failed to update video" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.video.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete video:", error);
    return NextResponse.json(
      { error: "Failed to delete video" },
      { status: 500 }
    );
  }
}
