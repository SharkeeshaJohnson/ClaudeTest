import { db, generateId, now, type Task } from "../index";

// ============================================================================
// Task Service
// ============================================================================

export interface CreateTaskInput {
  accountId: string;
  title: string;
  description?: string | null;
  type?: Task["type"];
  priority?: number;
  dueDate?: number | null;
  videoId?: string | null;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  type?: Task["type"];
  priority?: number;
  status?: Task["status"];
  dueDate?: number | null;
  completedAt?: number | null;
}

export const taskService = {
  /**
   * Get all tasks with optional filtering
   */
  async getAll(options?: {
    accountId?: string;
    status?: Task["status"];
    dueBefore?: number;
  }): Promise<Task[]> {
    let tasks: Task[];

    if (options?.accountId) {
      tasks = await db.tasks.where("accountId").equals(options.accountId).toArray();
    } else {
      tasks = await db.tasks.toArray();
    }

    // Apply status filter
    if (options?.status) {
      tasks = tasks.filter((t) => t.status === options.status);
    }

    // Apply dueBefore filter
    if (options?.dueBefore !== undefined) {
      tasks = tasks.filter((t) => t.dueDate !== null && t.dueDate <= options.dueBefore!);
    }

    // Sort by dueDate ASC (nulls last), then priority DESC
    tasks.sort((a, b) => {
      // Handle null dueDates (put them last)
      if (a.dueDate === null && b.dueDate !== null) return 1;
      if (a.dueDate !== null && b.dueDate === null) return -1;
      if (a.dueDate !== null && b.dueDate !== null && a.dueDate !== b.dueDate) {
        return a.dueDate - b.dueDate;
      }
      // Then by priority DESC
      return b.priority - a.priority;
    });

    return tasks;
  },

  /**
   * Get tasks by account ID
   */
  async getByAccountId(accountId: string, status?: Task["status"]): Promise<Task[]> {
    return this.getAll({ accountId, status });
  },

  /**
   * Get a single task by ID
   */
  async getById(id: string): Promise<Task | undefined> {
    return db.tasks.get(id);
  },

  /**
   * Create a new task
   */
  async create(input: CreateTaskInput): Promise<Task> {
    const timestamp = now();

    const task: Task = {
      id: generateId(),
      accountId: input.accountId,
      title: input.title,
      description: input.description ?? null,
      type: input.type ?? "reminder",
      priority: input.priority ?? 3,
      status: "pending",
      dueDate: input.dueDate ?? null,
      completedAt: null,
      videoId: input.videoId ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await db.tasks.add(task);
    return task;
  },

  /**
   * Update an existing task
   */
  async update(id: string, input: UpdateTaskInput): Promise<Task | null> {
    const existing = await db.tasks.get(id);
    if (!existing) return null;

    const updates: Partial<Task> = { updatedAt: now() };

    if (input.title !== undefined) updates.title = input.title;
    if (input.description !== undefined) updates.description = input.description;
    if (input.type !== undefined) updates.type = input.type;
    if (input.priority !== undefined) updates.priority = input.priority;
    if (input.status !== undefined) updates.status = input.status;
    if (input.dueDate !== undefined) updates.dueDate = input.dueDate;
    if (input.completedAt !== undefined) updates.completedAt = input.completedAt;

    await db.tasks.update(id, updates);
    return { ...existing, ...updates };
  },

  /**
   * Mark a task as completed
   */
  async complete(id: string): Promise<Task | null> {
    return this.update(id, {
      status: "completed",
      completedAt: now(),
    });
  },

  /**
   * Delete a task
   */
  async delete(id: string): Promise<boolean> {
    const existing = await db.tasks.get(id);
    if (!existing) return false;

    await db.tasks.delete(id);
    return true;
  },

  /**
   * Generate metrics update tasks for videos that need them
   */
  async generateMetricsUpdateTasks(accountId: string): Promise<number> {
    const { videoService } = await import("./videos");
    const videosNeedingUpdate = await videoService.getVideosNeedingMetricsUpdate(accountId);

    // Get existing pending metrics_update tasks
    const existingTasks = await db.tasks
      .where("accountId")
      .equals(accountId)
      .filter((t) => t.type === "metrics_update" && t.status === "pending")
      .toArray();

    const existingVideoIds = new Set(existingTasks.map((t) => t.videoId).filter(Boolean));

    // Create tasks for videos without pending tasks
    const tomorrow = now() + 24 * 60 * 60 * 1000;
    let created = 0;

    for (const video of videosNeedingUpdate) {
      if (!existingVideoIds.has(video.id)) {
        await this.create({
          accountId,
          title: `Update metrics for "${video.title}"`,
          description: "It's been a week since this video was posted. Time to record the latest metrics!",
          type: "metrics_update",
          priority: 4,
          dueDate: tomorrow,
          videoId: video.id,
        });
        created++;
      }
    }

    return created;
  },
};
