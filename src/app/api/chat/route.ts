import { prisma } from "@/lib/prisma";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";

const SYSTEM_PROMPT = `You are a personal social media strategist with full access to the user's data. Your role is to:

1. Analyze what content performs best
2. Identify patterns in successful vs unsuccessful videos
3. Provide actionable, data-backed recommendations
4. Answer strategy questions
5. Be encouraging but honest

Always reference specific data when making suggestions. Be concise and practical in your advice.

ACCOUNT CONTEXT:
{accountData}

VIDEO HISTORY:
{videoData}

PERFORMANCE METRICS:
{metricsData}

NOTES & LEARNINGS:
{notesData}`;

export async function POST(request: Request) {
  try {
    const { messages, accountId } = await request.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Gather context data
    let accountData = "No account selected";
    let videoData = "No videos found";
    let metricsData = "No metrics available";
    let notesData = "No notes available";

    if (accountId) {
      // Get account info
      const account = await prisma.account.findUnique({
        where: { id: accountId },
        include: {
          streaks: true,
        },
      });

      if (account) {
        accountData = JSON.stringify({
          name: account.name,
          type: account.type,
          platforms: account.platforms,
          nicheKeywords: account.nicheKeywords,
          streak: account.streaks?.[0]
            ? {
                current: account.streaks[0].currentStreak,
                longest: account.streaks[0].longestStreak,
                totalXP: account.streaks[0].totalXP,
              }
            : null,
        });
      }

      // Get videos with metrics
      const videos = await prisma.video.findMany({
        where: { accountId },
        include: {
          metrics: {
            orderBy: { recordedAt: "desc" },
            take: 1,
          },
          notes: true,
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      });

      if (videos.length > 0) {
        videoData = JSON.stringify(
          videos.map((v) => ({
            title: v.title,
            status: v.status,
            duration: v.duration,
            postedDate: v.postedDate,
            latestMetrics: v.metrics[0] || null,
          }))
        );

        // Compile metrics summary
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
          { totalViews: 0, totalLikes: 0, totalComments: 0, totalShares: 0, videoCount: 0 }
        );

        metricsData = JSON.stringify({
          summary: metricsSum,
          avgViews: metricsSum.videoCount
            ? Math.round(metricsSum.totalViews / metricsSum.videoCount)
            : 0,
          avgEngagement: metricsSum.videoCount
            ? Math.round(
                ((metricsSum.totalLikes + metricsSum.totalComments + metricsSum.totalShares) /
                  metricsSum.videoCount)
              )
            : 0,
        });

        // Compile notes
        const notes = videos
          .filter((v) => v.notes)
          .map((v) => ({
            video: v.title,
            whatWorked: v.notes?.whatWorked,
            whatDidnt: v.notes?.whatDidnt,
            tryNext: v.notes?.tryNext,
          }));

        if (notes.length > 0) {
          notesData = JSON.stringify(notes);
        }
      }
    }

    const systemPrompt = SYSTEM_PROMPT.replace("{accountData}", accountData)
      .replace("{videoData}", videoData)
      .replace("{metricsData}", metricsData)
      .replace("{notesData}", notesData);

    const result = streamText({
      model: anthropic("claude-sonnet-4-20250514"),
      system: systemPrompt,
      messages,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Failed to process chat:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process chat" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
