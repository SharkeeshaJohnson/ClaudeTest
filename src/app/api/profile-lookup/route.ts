import { NextRequest, NextResponse } from "next/server";

// Types for profile data
interface TikTokProfile {
  followers: number;
  totalLikes: number;
  totalVideos: number;
  bio?: string;
}

interface InstagramProfile {
  followers: number;
  following: number;
  posts: number;
  bio?: string;
}

interface ProfileLookupResult {
  tiktok?: TikTokProfile | null;
  instagram?: InstagramProfile | null;
}

// Use AI Portal API to search for profile data
async function searchProfileData(
  username: string,
  platform: "tiktok" | "instagram",
  token: string
): Promise<TikTokProfile | InstagramProfile | null> {
  const platformName = platform === "tiktok" ? "TikTok" : "Instagram";

  const prompt = `Search for the ${platformName} profile "@${username}" and provide their public profile statistics.

Return ONLY a JSON object with this exact structure for ${platformName}:
${platform === "tiktok"
  ? `{
  "followers": <number of followers>,
  "totalLikes": <total likes on all videos>,
  "totalVideos": <number of videos>,
  "bio": "<profile bio if available>"
}`
  : `{
  "followers": <number of followers>,
  "following": <number of accounts they follow>,
  "posts": <number of posts>,
  "bio": "<profile bio if available>"
}`}

If you cannot find the profile or the data is unavailable, return null.
Return ONLY the JSON, no markdown or explanations.`;

  try {
    const response = await fetch("https://ai-portal-dev.zetachain.com/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-4o",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      console.error(`[ProfileLookup] API error for ${platform}:`, response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        // Validate required fields exist
        if (platform === "tiktok" && typeof parsed.followers === "number") {
          return parsed as TikTokProfile;
        }
        if (platform === "instagram" && typeof parsed.followers === "number") {
          return parsed as InstagramProfile;
        }
      }

      // Check for null response
      if (content.trim().toLowerCase() === "null") {
        return null;
      }
    } catch {
      console.error(`[ProfileLookup] Failed to parse response for ${platform}`);
    }

    return null;
  } catch (error) {
    console.error(`[ProfileLookup] Error fetching ${platform} profile:`, error);
    return null;
  }
}


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tiktokUsername, instagramUsername } = body;

    // Get authorization token from headers
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "Authorization required" },
        { status: 401 }
      );
    }

    if (!tiktokUsername && !instagramUsername) {
      return NextResponse.json(
        { error: "At least one username is required" },
        { status: 400 }
      );
    }

    const result: ProfileLookupResult = {};

    // Fetch profile data in parallel
    const promises: Promise<void>[] = [];

    if (tiktokUsername) {
      promises.push(
        searchProfileData(tiktokUsername, "tiktok", token).then((data) => {
          result.tiktok = data as TikTokProfile | null;
        })
      );
    }

    if (instagramUsername) {
      promises.push(
        searchProfileData(instagramUsername, "instagram", token).then((data) => {
          result.instagram = data as InstagramProfile | null;
        })
      );
    }

    await Promise.all(promises);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[ProfileLookup] Error:", error);
    return NextResponse.json(
      { error: "Failed to lookup profile" },
      { status: 500 }
    );
  }
}
