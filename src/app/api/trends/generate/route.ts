import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";

const AI_JOURNEY_PROMPT = `Analyze current trending topics on TikTok and Instagram Reels related to: AI, vibe coding, no-code development, personal tech journeys, and beginner programmers learning with AI.

Provide your response in the following JSON format only (no additional text):
{
  "trendingTopics": ["topic1", "topic2", "topic3", "topic4", "topic5"],
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5", "#hashtag6", "#hashtag7", "#hashtag8", "#hashtag9", "#hashtag10"],
  "contentAngles": ["angle1", "angle2", "angle3", "angle4", "angle5"],
  "seasonalHooks": ["hook1", "hook2", "hook3"]
}`;

const DOG_CONTENT_PROMPT = `Analyze current viral dog/pet content trends on TikTok and Instagram Reels.

Provide your response in the following JSON format only (no additional text):
{
  "trendingFormats": ["format1", "format2", "format3", "format4", "format5"],
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5", "#hashtag6", "#hashtag7", "#hashtag8", "#hashtag9", "#hashtag10"],
  "seasonalOpportunities": ["opportunity1", "opportunity2", "opportunity3"],
  "uniqueAngles": ["angle1", "angle2", "angle3", "angle4", "angle5"]
}`;

type Provider = "claude" | "gpt4" | "gemini" | "grok";

async function generateWithProvider(provider: Provider, prompt: string) {
  try {
    switch (provider) {
      case "claude":
        if (!process.env.ANTHROPIC_API_KEY) {
          throw new Error("ANTHROPIC_API_KEY not configured");
        }
        const claudeResult = await generateText({
          model: anthropic("claude-sonnet-4-20250514"),
          prompt,
        });
        return claudeResult.text;

      case "gpt4":
        if (!process.env.OPENAI_API_KEY) {
          throw new Error("OPENAI_API_KEY not configured");
        }
        const gptResult = await generateText({
          model: openai("gpt-4o"),
          prompt,
        });
        return gptResult.text;

      case "gemini":
        if (!process.env.GOOGLE_AI_API_KEY) {
          throw new Error("GOOGLE_AI_API_KEY not configured");
        }
        const geminiResult = await generateText({
          model: google("gemini-1.5-pro"),
          prompt,
        });
        return geminiResult.text;

      case "grok":
        // Grok uses OpenAI-compatible API
        if (!process.env.XAI_API_KEY) {
          throw new Error("XAI_API_KEY not configured");
        }
        // Note: Grok would need a custom provider setup
        // For now, return a placeholder
        throw new Error("Grok integration pending - API key required");

      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  } catch (error) {
    console.error(`Error with ${provider}:`, error);
    throw error;
  }
}

function parseJsonResponse(text: string) {
  // Try to extract JSON from the response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      throw new Error("Failed to parse JSON response");
    }
  }
  throw new Error("No JSON found in response");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accountId, provider } = body as { accountId: string; provider: Provider };

    if (!accountId || !provider) {
      return NextResponse.json(
        { error: "accountId and provider are required" },
        { status: 400 }
      );
    }

    // Get account to determine prompt type
    const account = await prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const prompt =
      account.type === "ai_journey" ? AI_JOURNEY_PROMPT : DOG_CONTENT_PROMPT;

    // Generate with the selected provider
    const responseText = await generateWithProvider(provider, prompt);
    const content = parseJsonResponse(responseText);

    // Save the trend report
    const trendReport = await prisma.trendReport.create({
      data: {
        accountId,
        provider,
        content,
      },
    });

    return NextResponse.json({
      id: trendReport.id,
      provider,
      content,
      generatedAt: trendReport.generatedAt,
    });
  } catch (error) {
    console.error("Failed to generate trends:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate trends";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
