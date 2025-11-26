import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { format } from "date-fns";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");
    const type = searchParams.get("type") || "all"; // "videos", "metrics", "ideas", "all"

    if (!accountId) {
      return NextResponse.json(
        { error: "accountId is required" },
        { status: 400 }
      );
    }

    const account = await prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const exportData: Record<string, unknown> = {
      exportedAt: new Date().toISOString(),
      accountName: account.name,
      accountType: account.type,
    };

    // Export videos with metrics
    if (type === "videos" || type === "all") {
      const videos = await prisma.video.findMany({
        where: { accountId },
        include: {
          metrics: {
            orderBy: { recordedAt: "desc" },
          },
          notes: true,
        },
        orderBy: { createdAt: "desc" },
      });

      exportData.videos = videos.map((video) => ({
        title: video.title,
        status: video.status,
        duration: video.duration,
        postedDate: video.postedDate
          ? format(new Date(video.postedDate), "yyyy-MM-dd")
          : null,
        scheduledDate: video.scheduledDate
          ? format(new Date(video.scheduledDate), "yyyy-MM-dd")
          : null,
        script: video.script,
        caption: video.caption,
        hashtags: video.hashtags.join(", "),
        hook: video.hook,
        metrics: video.metrics.map((m) => ({
          platform: m.platform,
          views: m.views,
          likes: m.likes,
          comments: m.comments,
          shares: m.shares,
          recordedAt: format(new Date(m.recordedAt), "yyyy-MM-dd HH:mm"),
        })),
        notes: video.notes
          ? {
              whatWorked: video.notes.whatWorked,
              whatDidnt: video.notes.whatDidnt,
              tryNext: video.notes.tryNext,
            }
          : null,
      }));
    }

    // Export metrics summary
    if (type === "metrics" || type === "all") {
      const videos = await prisma.video.findMany({
        where: { accountId, status: "posted" },
        include: {
          metrics: {
            orderBy: { recordedAt: "desc" },
            take: 1,
          },
        },
      });

      const metricsSum = videos.reduce(
        (acc, v) => {
          if (v.metrics[0]) {
            acc.totalViews += v.metrics[0].views;
            acc.totalLikes += v.metrics[0].likes;
            acc.totalComments += v.metrics[0].comments;
            acc.totalShares += v.metrics[0].shares;
            acc.videoCount++;
          }
          return acc;
        },
        {
          totalViews: 0,
          totalLikes: 0,
          totalComments: 0,
          totalShares: 0,
          videoCount: 0,
        }
      );

      exportData.metricsSummary = {
        ...metricsSum,
        avgViews: metricsSum.videoCount
          ? Math.round(metricsSum.totalViews / metricsSum.videoCount)
          : 0,
        avgLikes: metricsSum.videoCount
          ? Math.round(metricsSum.totalLikes / metricsSum.videoCount)
          : 0,
        avgComments: metricsSum.videoCount
          ? Math.round(metricsSum.totalComments / metricsSum.videoCount)
          : 0,
        avgShares: metricsSum.videoCount
          ? Math.round(metricsSum.totalShares / metricsSum.videoCount)
          : 0,
        engagementRate: metricsSum.totalViews
          ? (
              ((metricsSum.totalLikes +
                metricsSum.totalComments +
                metricsSum.totalShares) /
                metricsSum.totalViews) *
              100
            ).toFixed(2) + "%"
          : "0%",
      };
    }

    // Export ideas
    if (type === "ideas" || type === "all") {
      const ideas = await prisma.idea.findMany({
        where: { accountId },
        orderBy: { priority: "desc" },
      });

      exportData.ideas = ideas.map((idea) => ({
        title: idea.title,
        description: idea.description,
        priority: idea.priority,
        status: idea.status,
        tags: idea.tags.join(", "),
        createdAt: format(new Date(idea.createdAt), "yyyy-MM-dd"),
      }));
    }

    // Export streak data
    if (type === "all") {
      const streak = await prisma.streak.findUnique({
        where: { accountId },
      });

      if (streak) {
        exportData.streak = {
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak,
          totalXP: streak.totalXP,
          lastActivity: streak.lastActivityDate
            ? format(new Date(streak.lastActivityDate), "yyyy-MM-dd")
            : null,
        };
      }
    }

    // Return as JSON for download
    const filename = `smcc-export-${account.name.toLowerCase().replace(/\s+/g, "-")}-${format(new Date(), "yyyy-MM-dd")}.json`;

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Failed to export data:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}
