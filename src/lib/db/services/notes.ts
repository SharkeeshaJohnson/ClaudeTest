import { db, generateId, now, type VideoNote } from "../index";

// ============================================================================
// Video Note Service
// ============================================================================

export interface UpsertVideoNoteInput {
  videoId: string;
  whatWorked?: string | null;
  whatDidnt?: string | null;
  tryNext?: string | null;
}

export const videoNoteService = {
  /**
   * Get note for a video
   */
  async getByVideoId(videoId: string): Promise<VideoNote | undefined> {
    return db.videoNotes.where("videoId").equals(videoId).first();
  },

  /**
   * Create or update a video note (upsert)
   */
  async upsert(input: UpsertVideoNoteInput): Promise<VideoNote> {
    const existing = await this.getByVideoId(input.videoId);
    const timestamp = now();

    if (existing) {
      // Update existing note
      const updates: Partial<VideoNote> = { updatedAt: timestamp };

      if (input.whatWorked !== undefined) updates.whatWorked = input.whatWorked;
      if (input.whatDidnt !== undefined) updates.whatDidnt = input.whatDidnt;
      if (input.tryNext !== undefined) updates.tryNext = input.tryNext;

      await db.videoNotes.update(existing.id, updates);
      return { ...existing, ...updates };
    } else {
      // Create new note
      const note: VideoNote = {
        id: generateId(),
        videoId: input.videoId,
        whatWorked: input.whatWorked ?? null,
        whatDidnt: input.whatDidnt ?? null,
        tryNext: input.tryNext ?? null,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      await db.videoNotes.add(note);
      return note;
    }
  },

  /**
   * Delete a video note
   */
  async delete(videoId: string): Promise<boolean> {
    const existing = await this.getByVideoId(videoId);
    if (!existing) return false;

    await db.videoNotes.delete(existing.id);
    return true;
  },

  /**
   * Get all notes for an account (through videos)
   */
  async getAllByAccountId(accountId: string): Promise<Array<VideoNote & { videoTitle: string }>> {
    const videos = await db.videos.where("accountId").equals(accountId).toArray();
    const videoIds = videos.map((v) => v.id);
    const videoMap = new Map(videos.map((v) => [v.id, v.title]));

    const notes = await db.videoNotes.where("videoId").anyOf(videoIds).toArray();

    return notes.map((note) => ({
      ...note,
      videoTitle: videoMap.get(note.videoId) || "Unknown Video",
    }));
  },
};
