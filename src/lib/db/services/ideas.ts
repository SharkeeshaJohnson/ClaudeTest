import { db, generateId, now, type Idea } from "../index";

// ============================================================================
// Idea Service
// ============================================================================

export interface CreateIdeaInput {
  accountId: string;
  folderId?: string | null;
  title: string;
  description?: string | null;
  priority?: number;
  tags?: string[];
}

export interface UpdateIdeaInput {
  title?: string;
  description?: string | null;
  folderId?: string | null;
  priority?: number;
  status?: Idea["status"];
  tags?: string[];
}

export const ideaService = {
  /**
   * Get all ideas with optional filtering
   */
  async getAll(options?: {
    accountId?: string;
    status?: Idea["status"];
    priority?: number;
  }): Promise<Idea[]> {
    let ideas: Idea[];

    if (options?.accountId) {
      ideas = await db.ideas.where("accountId").equals(options.accountId).toArray();
    } else {
      ideas = await db.ideas.toArray();
    }

    // Apply filters
    if (options?.status) {
      ideas = ideas.filter((i) => i.status === options.status);
    }
    if (options?.priority !== undefined) {
      ideas = ideas.filter((i) => i.priority === options.priority);
    }

    // Sort by priority DESC, then createdAt DESC
    ideas.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return b.createdAt - a.createdAt;
    });

    return ideas;
  },

  /**
   * Get ideas by account ID
   */
  async getByAccountId(accountId: string): Promise<Idea[]> {
    return this.getAll({ accountId });
  },

  /**
   * Get a single idea by ID
   */
  async getById(id: string): Promise<Idea | undefined> {
    return db.ideas.get(id);
  },

  /**
   * Create a new idea
   */
  async create(input: CreateIdeaInput): Promise<Idea> {
    const timestamp = now();

    const idea: Idea = {
      id: generateId(),
      accountId: input.accountId,
      folderId: input.folderId ?? null,
      title: input.title,
      description: input.description ?? null,
      priority: input.priority ?? 3,
      status: "new",
      tags: input.tags || [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await db.ideas.add(idea);
    return idea;
  },

  /**
   * Update an existing idea
   */
  async update(id: string, input: UpdateIdeaInput): Promise<Idea | null> {
    const existing = await db.ideas.get(id);
    if (!existing) return null;

    const updates: Partial<Idea> = { updatedAt: now() };

    if (input.title !== undefined) updates.title = input.title;
    if (input.description !== undefined) updates.description = input.description;
    if (input.folderId !== undefined) updates.folderId = input.folderId;
    if (input.priority !== undefined) updates.priority = input.priority;
    if (input.status !== undefined) updates.status = input.status;
    if (input.tags !== undefined) updates.tags = input.tags;

    await db.ideas.update(id, updates);
    return { ...existing, ...updates };
  },

  /**
   * Delete an idea
   */
  async delete(id: string): Promise<boolean> {
    const existing = await db.ideas.get(id);
    if (!existing) return false;

    await db.ideas.delete(id);
    return true;
  },

  /**
   * Search ideas by title or description
   */
  async search(accountId: string, query: string): Promise<Idea[]> {
    const lowerQuery = query.toLowerCase();
    const ideas = await db.ideas.where("accountId").equals(accountId).toArray();

    return ideas.filter(
      (idea) =>
        idea.title.toLowerCase().includes(lowerQuery) ||
        (idea.description && idea.description.toLowerCase().includes(lowerQuery)) ||
        idea.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  },
};
