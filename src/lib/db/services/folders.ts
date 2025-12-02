import { db, generateId, now, type IdeaFolder } from "../index";

// ============================================================================
// Idea Folder Service
// ============================================================================

export interface CreateFolderInput {
  accountId: string;
  name: string;
  color?: string | null;
}

export interface UpdateFolderInput {
  name?: string;
  color?: string | null;
}

export const ideaFolderService = {
  /**
   * Get all folders for an account
   */
  async getByAccountId(accountId: string): Promise<IdeaFolder[]> {
    const folders = await db.ideaFolders
      .where("accountId")
      .equals(accountId)
      .toArray();

    // Sort by name
    folders.sort((a, b) => a.name.localeCompare(b.name));

    return folders;
  },

  /**
   * Get a single folder by ID
   */
  async getById(id: string): Promise<IdeaFolder | undefined> {
    return db.ideaFolders.get(id);
  },

  /**
   * Create a new folder
   */
  async create(input: CreateFolderInput): Promise<IdeaFolder> {
    const timestamp = now();

    const folder: IdeaFolder = {
      id: generateId(),
      accountId: input.accountId,
      name: input.name,
      color: input.color ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await db.ideaFolders.add(folder);
    return folder;
  },

  /**
   * Update an existing folder
   */
  async update(id: string, input: UpdateFolderInput): Promise<IdeaFolder | null> {
    const existing = await db.ideaFolders.get(id);
    if (!existing) return null;

    const updates: Partial<IdeaFolder> = { updatedAt: now() };

    if (input.name !== undefined) updates.name = input.name;
    if (input.color !== undefined) updates.color = input.color;

    await db.ideaFolders.update(id, updates);
    return { ...existing, ...updates };
  },

  /**
   * Delete a folder and move all ideas to uncategorized
   */
  async delete(id: string): Promise<boolean> {
    const existing = await db.ideaFolders.get(id);
    if (!existing) return false;

    // Move all ideas in this folder to uncategorized (null)
    await db.ideas.where("folderId").equals(id).modify({ folderId: null });

    // Delete the folder
    await db.ideaFolders.delete(id);
    return true;
  },

  /**
   * Get folder with idea count
   */
  async getWithCount(accountId: string): Promise<(IdeaFolder & { ideaCount: number })[]> {
    const folders = await this.getByAccountId(accountId);
    const ideas = await db.ideas.where("accountId").equals(accountId).toArray();

    return folders.map((folder) => ({
      ...folder,
      ideaCount: ideas.filter((i) => i.folderId === folder.id).length,
    }));
  },
};
