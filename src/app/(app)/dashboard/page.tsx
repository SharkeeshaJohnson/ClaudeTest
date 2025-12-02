"use client";

import { useEffect, useState, useRef, FormEvent, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Send,
  User,
  Bookmark,
  Check,
  Brain,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAccountStore } from "@/store/account-store";
import { cn } from "@/lib/utils";
import { useJemma, type JemmaMessage } from "@/features/chat/use-jemma";
import { ConversationSidebar } from "@/features/chat/conversation-sidebar";
import { ideaService } from "@/lib/db/services";
import { useMemoryExtractor } from "@/lib/memory";
import type { Conversation } from "@/lib/db";

export default function DashboardPage() {
  const { selectedAccountId } = useAccountStore();

  // Memory extractor for saving insights
  const { extractFromAction } = useMemoryExtractor();

  // Conversation state
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarKey, setSidebarKey] = useState(0);

  // Jemma chat state
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [savedMessageIds, setSavedMessageIds] = useState<Set<string>>(new Set());
  const [memorizedMessageIds, setMemorizedMessageIds] = useState<Set<string>>(new Set());

  const handleConversationCreated = useCallback((conversationId: string) => {
    setActiveConversationId(conversationId);
    setSidebarKey((prev) => prev + 1);
  }, []);

  const {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    loadConversation,
  } = useJemma({
    accountId: selectedAccountId || undefined,
    conversationId: activeConversationId,
    onConversationCreated: handleConversationCreated,
  });

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput("");
    await sendMessage(message);
  };

  const saveToIdeas = async (message: JemmaMessage) => {
    if (!selectedAccountId) return;

    try {
      const firstLine = message.content.split("\n")[0];
      const title = firstLine.length > 60
        ? firstLine.substring(0, 57) + "..."
        : firstLine;

      await ideaService.create({
        accountId: selectedAccountId,
        title: `Jemma: ${title}`,
        description: message.content,
        tags: ["jemma", "ai-suggestion"],
        priority: 3,
      });

      setSavedMessageIds((prev) => new Set([...prev, message.id]));
    } catch (error) {
      console.error("Failed to save to ideas:", error);
    }
  };

  const saveToMemory = async (message: JemmaMessage) => {
    if (!selectedAccountId) return;

    try {
      await extractFromAction({
        type: "chat_insight",
        content: message.content,
        accountId: selectedAccountId,
      });

      setMemorizedMessageIds((prev) => new Set([...prev, message.id]));
    } catch (error) {
      console.error("Failed to save to memory:", error);
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setActiveConversationId(conversation.id);
    loadConversation(conversation.id);
  };

  const handleNewConversation = () => {
    setActiveConversationId(null);
    clearMessages();
  };

  const suggestedQuestions = [
    "What type of content performs best?",
    "What should I post today?",
    "Give me content ideas",
    "How can I grow faster?",
  ];

  // Welcome message when no messages
  const welcomeMessage: JemmaMessage = {
    id: "welcome",
    role: "assistant" as const,
    content: "Hello. I'm Jemma, your content strategist. I'm here to help with ideas, strategy, and growth insights. What would you like to explore?",
    timestamp: 0,
  };
  const displayMessages: JemmaMessage[] = messages.length === 0
    ? [welcomeMessage]
    : messages;

  return (
    <div className="h-[calc(100vh-2rem)] flex">
      {/* Conversation Sidebar */}
      <motion.div
        initial={false}
        animate={{
          width: sidebarOpen ? 280 : 0,
          opacity: sidebarOpen ? 1 : 0,
        }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="h-full border-r border-border/30 bg-card/30 overflow-hidden flex-shrink-0"
      >
        <ConversationSidebar
          key={sidebarKey}
          accountId={selectedAccountId}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          className="h-full"
        />
      </motion.div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-3 border-b border-border/30">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors duration-200"
            title={sidebarOpen ? "Hide conversations" : "Show conversations"}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-5 w-5 text-muted-foreground" />
            ) : (
              <PanelLeft className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-2xl mx-auto space-y-6">
            {displayMessages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "flex gap-4",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <div className="w-9 h-9 flex-shrink-0 rounded-full bg-muted flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 18C4 18 6.5 20 12 20C17.5 20 20 18 20 18C20 18 21 15 12 15C3 15 4 18 4 18Z" fill="#C8B8A6"/>
                      <path d="M6 13C6 13 7 14.5 12 14.5C17 14.5 18 13 18 13C18 13 19 10.5 12 10.5C5 10.5 6 13 6 13Z" fill="#C8B8A6"/>
                      <path d="M8 8C8 8 8.5 9 12 9C15.5 9 16 8 16 8C16 8 16.5 6 12 6C7.5 6 8 8 8 8Z" fill="#C8B8A6"/>
                    </svg>
                  </div>
                )}
                <div className="flex flex-col gap-2 max-w-[75%]">
                  <div
                    className={cn(
                      "rounded-2xl px-5 py-3.5",
                      message.role === "user"
                        ? "bg-foreground text-background"
                        : "bg-[#C8B8A6]/15 border border-[#C8B8A6]/25"
                    )}
                  >
                    <p className={cn(
                      "text-sm whitespace-pre-wrap leading-relaxed",
                      message.role === "user" ? "font-normal" : "font-normal text-foreground"
                    )}>
                      {message.content}
                    </p>
                  </div>
                  {/* Action buttons for assistant messages (not welcome) */}
                  {message.role === "assistant" && message.id !== "welcome" && (
                    <div className="flex gap-3 ml-1">
                      <button
                        onClick={() => saveToIdeas(message)}
                        disabled={savedMessageIds.has(message.id)}
                        className={cn(
                          "flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-all duration-200",
                          savedMessageIds.has(message.id)
                            ? "text-primary bg-primary/10"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        {savedMessageIds.has(message.id) ? (
                          <>
                            <Check className="h-3 w-3" />
                            Saved
                          </>
                        ) : (
                          <>
                            <Bookmark className="h-3 w-3" />
                            Save to Ideas
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => saveToMemory(message)}
                        disabled={memorizedMessageIds.has(message.id)}
                        className={cn(
                          "flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-all duration-200",
                          memorizedMessageIds.has(message.id)
                            ? "text-primary bg-primary/10"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        {memorizedMessageIds.has(message.id) ? (
                          <>
                            <Check className="h-3 w-3" />
                            Memorized
                          </>
                        ) : (
                          <>
                            <Brain className="h-3 w-3" />
                            Remember
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
                {message.role === "user" && (
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0 border border-border/30">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </motion.div>
            ))}
            {isLoading && messages.length > 0 && !messages[messages.length - 1]?.content && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-4 justify-start"
              >
                <div className="w-9 h-9 flex-shrink-0 rounded-full bg-muted flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 18C4 18 6.5 20 12 20C17.5 20 20 18 20 18C20 18 21 15 12 15C3 15 4 18 4 18Z" fill="#C8B8A6"/>
                    <path d="M6 13C6 13 7 14.5 12 14.5C17 14.5 18 13 18 13C18 13 19 10.5 12 10.5C5 10.5 6 13 6 13Z" fill="#C8B8A6"/>
                    <path d="M8 8C8 8 8.5 9 12 9C15.5 9 16 8 16 8C16 8 16.5 6 12 6C7.5 6 8 8 8 8Z" fill="#C8B8A6"/>
                  </svg>
                </div>
                <div className="bg-[#C8B8A6]/15 border border-[#C8B8A6]/25 rounded-2xl px-5 py-4">
                  <div className="flex gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C8B8A6] animate-bounce" />
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-[#C8B8A6] animate-bounce"
                      style={{ animationDelay: "0.15s" }}
                    />
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-[#C8B8A6] animate-bounce"
                      style={{ animationDelay: "0.3s" }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Suggested Questions */}
        {messages.length === 0 && (
          <div className="px-6 pb-4">
            <div className="max-w-2xl mx-auto flex flex-wrap gap-2 justify-center">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="text-sm px-4 py-2.5 rounded-full bg-[#C8B8A6]/10 border border-[#C8B8A6]/25 hover:bg-[#C8B8A6]/20 hover:border-[#C8B8A6]/40 transition-all duration-200 font-medium text-foreground/80"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="px-6 py-5 border-t border-border/50">
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto flex gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Jemma anything..."
              className="flex-1 h-12 rounded-xl border-[#C8B8A6]/25 bg-[#C8B8A6]/10 focus:bg-background focus:border-[#C8B8A6]/40 placeholder:text-muted-foreground font-normal text-foreground"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="h-12 w-12 rounded-xl bg-[#3E3E3B] hover:bg-[#3E3E3B]/90 text-white transition-all duration-200"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
