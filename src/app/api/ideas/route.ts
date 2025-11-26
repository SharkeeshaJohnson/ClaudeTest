import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get("accountId");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");

    const where: Record<string, unknown> = {};
    if (accountId) where.accountId = accountId;
    if (status) where.status = status;
    if (priority) where.priority = parseInt(priority);

    const ideas = await prisma.idea.findMany({
      where,
      include: {
        account: true,
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(ideas);
  } catch (error) {
    console.error("Failed to fetch ideas:", error);
    return NextResponse.json(
      { error: "Failed to fetch ideas" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accountId, title, description, priority, tags } = body;

    if (!accountId || !title) {
      return NextResponse.json(
        { error: "accountId and title are required" },
        { status: 400 }
      );
    }

    const idea = await prisma.idea.create({
      data: {
        accountId,
        title,
        description,
        priority: priority || 3,
        tags: tags || [],
      },
      include: {
        account: true,
      },
    });

    return NextResponse.json(idea, { status: 201 });
  } catch (error) {
    console.error("Failed to create idea:", error);
    return NextResponse.json(
      { error: "Failed to create idea" },
      { status: 500 }
    );
  }
}
