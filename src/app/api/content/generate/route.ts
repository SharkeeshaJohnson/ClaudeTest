import { prisma } from "@/lib/prisma";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";

const AI_JOURNEY_PROMPT = `You are a social media content strategist specializing in AI/tech content for TikTok and Instagram Reels.

Create a complete video content package based on the following details:
- Topic: {topic}
- Duration: {duration} seconds
- Tone: {tone}

Generate the following in a structured format:

## Hook (First 3 seconds)
A powerful attention-grabbing opening line that stops scrollers.

## Script
A complete spoken script with timing markers like [0:03], [0:10], etc. Make it conversational and engaging.

## Video Structure
- Intro (3s): Hook
- Body ({bodyDuration}s): Main content points
- CTA (5s): Call to action

## Shot List
Bullet points of what to film/show at each section.

## Caption
An engaging caption for the post.

## Hashtags
10 relevant hashtags for maximum reach.

Keep the content authentic, relatable, and optimized for short-form video engagement.`;

const DOG_CONTENT_PROMPT = `You are a pet content strategist specializing in viral dog content for TikTok and Instagram Reels.

Create a complete video content package based on the following details:
- Theme: {topic}
- Duration: {duration} seconds
- Tone: {tone}

Generate the following in a structured format:

## Hook (First 3 seconds)
A cute/funny opening that immediately captures attention.

## Filming Idea
Describe exactly what to capture - scenarios, reactions, moments to look for.

## Setup Instructions
How to set up the shot, what props to use, lighting tips.

## Suggested Audio
Trending sounds or music that would work well with this content.

## Caption
An engaging caption that connects with pet lovers.

## Hashtags
10 viral pet hashtags for maximum reach.

## Pro Tips
Extra tips for capturing the best moments with your pet.

Focus on authentic, heartwarming, or funny content that resonates with pet lovers.`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accountId, topic, duration, tone } = body;

    if (!accountId || !topic || !duration) {
      return new Response(
        JSON.stringify({ error: "accountId, topic, and duration are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get account to determine prompt type
    const account = await prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      return new Response(
        JSON.stringify({ error: "Account not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const bodyDuration = duration - 8; // Subtract hook (3s) and CTA (5s)
    const basePrompt =
      account.type === "ai_journey" ? AI_JOURNEY_PROMPT : DOG_CONTENT_PROMPT;

    const prompt = basePrompt
      .replace("{topic}", topic)
      .replace("{duration}", duration.toString())
      .replace("{tone}", tone || "engaging")
      .replace("{bodyDuration}", bodyDuration.toString());

    const result = streamText({
      model: anthropic("claude-sonnet-4-20250514"),
      prompt,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Failed to generate content:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate content" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
