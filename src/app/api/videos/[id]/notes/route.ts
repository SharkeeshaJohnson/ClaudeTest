import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { whatWorked, whatDidnt, tryNext } = body;

    // Verify video exists
    const video = await prisma.video.findUnique({
      where: { id },
      include: { notes: true },
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Upsert the notes
    const notes = await prisma.mediaNote.upsert({
      where: { videoId: id },
      create: {
        videoId: id,
        whatWorked,
        whatDidnt,
        tryNext,
      },
      update: {
        ...(whatWorked !== undefined && { whatWorked }),
        ...(whatDidnt !== undefined && { whatDidnt }),
        ...(tryNext !== undefined && { tryNext }),
      },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error("Failed to update media notes:", error);
    return NextResponse.json(
      { error: "Failed to update media notes" },
      { status: 500 }
    );
  }
}
