import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};

    if (accountId) {
      where.accountId = accountId;
    }

    if (status) {
      where.status = status;
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accountId, title, description, type, priority, dueDate, videoId } =
      body;

    if (!accountId || !title) {
      return NextResponse.json(
        { error: "accountId and title are required" },
        { status: 400 }
      );
    }

    const task = await prisma.task.create({
      data: {
        accountId,
        title,
        description: description || null,
        type: type || "reminder",
        priority: priority || 3,
        status: "pending",
        dueDate: dueDate ? new Date(dueDate) : null,
        videoId: videoId || null,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Failed to create task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
