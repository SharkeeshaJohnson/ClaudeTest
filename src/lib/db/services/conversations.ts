import { db, generateId, now, type Conversation } from "../index";

// ============================================================================
// Conversation Service
// ============================================================================

export type MessageRole = "user" | "assistant" | "system";

export interface Message {
  role: MessageRole;
  content: string;
  timestamp: number;
}

export interface CreateConversationInput {
  accountId?: string | null;
  title?: string | null;
  messages?: Message[];
}

export const conversationService = {
  /**
   * Get all conversations for an account
   */
  async getByAccountId(accountId: string): Promise<Conversation[]> {
    return db.conversations
      .where("accountId")
      .equals(accountId)
      .reverse()
      .sortBy("updatedAt");
  },

  /**
   * Get a single conversation by ID
   */
  async getById(id: string): Promise<Conversation | undefined> {
    return db.conversations.get(id);
  },

  /**
   * Create a new conversation
   */
  async create(input: CreateConversationInput): Promise<Conversation> {
    const timestamp = now();

    const conversation: Conversation = {
      id: generateId(),
      accountId: input.accountId ?? null,
      title: input.title ?? null,
      messages: input.messages || [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await db.conversations.add(conversation);
    return conversation;
  },

  /**
   * Add a message to a conversation
   */
  async addMessage(
    conversationId: string,
    role: MessageRole,
    content: string
  ): Promise<Conversation | null> {
    const conversation = await db.conversations.get(conversationId);
    if (!conversation) return null;

    const message: Message = {
      role,
      content,
      timestamp: now(),
    };

    const updatedMessages = [...conversation.messages, message];

    await db.conversations.update(conversationId, {
      messages: updatedMessages,
      updatedAt: now(),
    });

    return { ...conversation, messages: updatedMessages, updatedAt: now() };
  },

  /**
   * Get or create a conversation for an account
   */
  async getOrCreate(accountId: string): Promise<Conversation> {
    // Try to get the most recent conversation
    const conversations = await this.getByAccountId(accountId);

    // If there's a recent conversation (within the last hour), use it
    const oneHourAgo = now() - 60 * 60 * 1000;
    const recentConversation = conversations.find((c) => c.updatedAt > oneHourAgo);

    if (recentConversation) {
      return recentConversation;
    }

    // Otherwise, create a new one
    return this.create({ accountId });
  },

  /**
   * Delete a conversation
   */
  async delete(id: string): Promise<boolean> {
    const existing = await db.conversations.get(id);
    if (!existing) return false;

    await db.conversations.delete(id);
    return true;
  },

  /**
   * Clear all messages in a conversation (start fresh)
   */
  async clearMessages(conversationId: string): Promise<Conversation | null> {
    const conversation = await db.conversations.get(conversationId);
    if (!conversation) return null;

    await db.conversations.update(conversationId, {
      messages: [],
      updatedAt: now(),
    });

    return { ...conversation, messages: [], updatedAt: now() };
  },

  /**
   * Get conversation history formatted for AI context
   */
  async getFormattedHistory(
    conversationId: string,
    maxMessages: number = 20
  ): Promise<Array<{ role: string; content: string }>> {
    const conversation = await db.conversations.get(conversationId);
    if (!conversation) return [];

    return conversation.messages
      .slice(-maxMessages)
      .map((m) => ({ role: m.role, content: m.content }));
  },

  /**
   * Rename a conversation
   */
  async rename(conversationId: string, title: string): Promise<Conversation | null> {
    const conversation = await db.conversations.get(conversationId);
    if (!conversation) return null;

    await db.conversations.update(conversationId, {
      title,
      updatedAt: now(),
    });

    return { ...conversation, title, updatedAt: now() };
  },

  /**
   * Search conversations by message content
   */
  async search(accountId: string, query: string): Promise<Conversation[]> {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase();
    const conversations = await db.conversations
      .where("accountId")
      .equals(accountId)
      .toArray();

    // Filter conversations that have messages containing the query
    return conversations.filter((conversation) =>
      conversation.messages.some((message) =>
        message.content.toLowerCase().includes(lowerQuery)
      )
    );
  },

  /**
   * Get a display title for a conversation
   * Returns the custom title if set, otherwise generates from first message
   */
  getDisplayTitle(conversation: Conversation): string {
    if (conversation.title) return conversation.title;

    // Find the first user message
    const firstUserMessage = conversation.messages.find((m) => m.role === "user");
    if (firstUserMessage) {
      const content = firstUserMessage.content;
      // Truncate to 40 characters
      return content.length > 40 ? content.substring(0, 37) + "..." : content;
    }

    return "New Chat";
  },
};
