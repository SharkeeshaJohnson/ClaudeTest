import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { subDays, addDays } from "date-fns";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accountId } = body;

    if (!accountId) {
      return NextResponse.json(
        { error: "accountId is required" },
        { status: 400 }
      );
    }

    // Find videos that were posted 7+ days ago and don't have recent metrics
    const sevenDaysAgo = subDays(new Date(), 7);

    const videosNeedingMetrics = await prisma.video.findMany({
      where: {
        accountId,
        status: "posted",
        postedDate: {
          lte: sevenDaysAgo,
        },
      },
      include: {
        metrics: {
          orderBy: { recordedAt: "desc" },
          take: 1,
        },
      },
    });

    // Filter to videos where last metric is older than 7 days or no metrics exist
    const videosToUpdate = videosNeedingMetrics.filter((video) => {
      if (video.metrics.length === 0) return true;
      const lastMetric = video.metrics[0];
      return lastMetric.recordedAt < sevenDaysAgo;
    });

    // Check for existing tasks for these videos
    const existingTasks = await prisma.task.findMany({
      where: {
        accountId,
        type: "metrics_update",
        status: { not: "completed" },
        videoId: { in: videosToUpdate.map((v) => v.id) },
      },
    });

    const existingVideoIds = new Set(
      existingTasks.map((t) => t.videoId).filter(Boolean)
    );

    // Create tasks for videos that don't already have pending tasks
    const tasksToCreate = videosToUpdate
      .filter((video) => !existingVideoIds.has(video.id))
      .map((video) => ({
        accountId,
        title: `Update metrics for "${video.title}"`,
        description: `It's been 7+ days since the last metrics update for this video. Update the views, likes, comments, and shares.`,
        type: "metrics_update" as const,
        priority: 4,
        status: "pending" as const,
        dueDate: addDays(new Date(), 1), // Due tomorrow
        videoId: video.id,
      }));

    if (tasksToCreate.length > 0) {
      await prisma.task.createMany({
        data: tasksToCreate,
      });
    }

    return NextResponse.json({
      generated: tasksToCreate.length,
      message: `Generated ${tasksToCreate.length} new metrics update tasks`,
    });
  } catch (error) {
    console.error("Failed to generate tasks:", error);
    return NextResponse.json(
      { error: "Failed to generate tasks" },
      { status: 500 }
    );
  }
}
