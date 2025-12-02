"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { conversationService } from "@/lib/db/services";
import type { Conversation } from "@/lib/db";

// ============================================================================
// Types
// ============================================================================

interface ConversationSidebarProps {
  accountId: string | null;
  activeConversationId: string | null;
  onSelectConversation: (conversation: Conversation) => void;
  onNewConversation: () => void;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function ConversationSidebar({
  accountId,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  className,
}: ConversationSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Conversation[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Load conversations
  useEffect(() => {
    async function loadConversations() {
      if (!accountId) {
        setConversations([]);
        return;
      }
      const convos = await conversationService.getByAccountId(accountId);
      setConversations(convos);
    }
    loadConversations();
  }, [accountId]);

  // Handle search
  useEffect(() => {
    async function performSearch() {
      if (!accountId || !searchQuery.trim()) {
        setSearchResults(null);
        return;
      }

      setIsSearching(true);
      const results = await conversationService.search(accountId, searchQuery);
      setSearchResults(results);
      setIsSearching(false);
    }

    const debounce = setTimeout(performSearch, 300);
    return () => clearTimeout(debounce);
  }, [accountId, searchQuery]);

  // Focus edit input when editing
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRename = async (conversationId: string) => {
    if (!editTitle.trim()) {
      setEditingId(null);
      return;
    }

    await conversationService.rename(conversationId, editTitle.trim());
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, title: editTitle.trim() } : c))
    );
    setEditingId(null);
  };

  const handleDelete = async (conversationId: string) => {
    await conversationService.delete(conversationId);
    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    setMenuOpenId(null);

    // If we deleted the active conversation, trigger new conversation
    if (conversationId === activeConversationId) {
      onNewConversation();
    }
  };

  const startEditing = (conversation: Conversation) => {
    setEditingId(conversation.id);
    setEditTitle(conversationService.getDisplayTitle(conversation));
    setMenuOpenId(null);
  };

  const displayList = searchResults ?? conversations;

  // Memoize current time for relative time calculations
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  // Update current time periodically for relative time display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const formatRelativeTime = (timestamp: number) => {
    const diff = currentTime - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="p-4 space-y-4">
        {/* New Chat Button */}
        <button
          onClick={onNewConversation}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl",
            "bg-foreground text-background text-sm font-medium",
            "hover:bg-foreground/90 transition-all duration-200"
          )}
        >
          <Plus className="h-4 w-4" />
          New conversation
        </button>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "w-full pl-9 pr-3 py-2.5 rounded-lg text-sm font-normal",
              "bg-[#C8B8A6]/10 border border-[#C8B8A6]/25",
              "placeholder:text-muted-foreground/70",
              "focus:outline-none focus:border-[#C8B8A6]/50 focus:bg-[#C8B8A6]/15",
              "transition-all duration-200"
            )}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted/50"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {isSearching ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-5 w-5 border border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
          </div>
        ) : displayList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <MessageSquare className="h-8 w-8 text-muted-foreground/60 mb-3" />
            <p className="text-sm text-muted-foreground font-medium">
              {searchQuery ? "No conversations found" : "No conversations yet"}
            </p>
            {!searchQuery && (
              <p className="text-xs text-muted-foreground/70 mt-1 font-normal">
                Start a new conversation
              </p>
            )}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {displayList.map((conversation, index) => {
              const isActive = conversation.id === activeConversationId;
              const isEditing = editingId === conversation.id;
              const title = conversationService.getDisplayTitle(conversation);

              return (
                <motion.div
                  key={conversation.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.02 }}
                  className="relative group mb-1"
                >
                  {isEditing ? (
                    <div className="flex items-center gap-1 p-1">
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRename(conversation.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className={cn(
                          "flex-1 px-2.5 py-2 rounded-lg text-sm font-medium",
                          "bg-muted/50 border border-primary/30",
                          "focus:outline-none"
                        )}
                      />
                      <button
                        onClick={() => handleRename(conversation.id)}
                        className="p-1.5 rounded-lg hover:bg-muted/50 text-primary"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => onSelectConversation(conversation)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          onSelectConversation(conversation);
                        }
                      }}
                      className={cn(
                        "w-full flex items-start gap-3 p-3 rounded-lg text-left cursor-pointer",
                        "transition-all duration-200",
                        isActive
                          ? "bg-[#C8B8A6]/15 border border-[#C8B8A6]/25"
                          : "hover:bg-[#C8B8A6]/10 border border-transparent"
                      )}
                    >
                      <MessageSquare
                        className={cn(
                          "h-4 w-4 mt-0.5 flex-shrink-0",
                          isActive ? "text-[#C8B8A6]" : "text-muted-foreground"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "text-sm truncate font-medium",
                            isActive ? "text-foreground" : "text-foreground/90"
                          )}
                        >
                          {title}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-1 font-normal">
                          {formatRelativeTime(conversation.updatedAt)}
                        </p>
                      </div>

                      {/* Menu Button */}
                      <div
                        className={cn(
                          "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                          menuOpenId === conversation.id && "opacity-100"
                        )}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId(
                              menuOpenId === conversation.id ? null : conversation.id
                            );
                          }}
                          className="p-1 rounded-lg hover:bg-muted/50"
                        >
                          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {menuOpenId === conversation.id && (
                      <motion.div
                        ref={menuRef}
                        initial={{ opacity: 0, scale: 0.95, y: -5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -5 }}
                        className={cn(
                          "absolute right-2 top-full z-50 mt-1",
                          "bg-card border border-border/40 rounded-lg shadow-lg",
                          "py-1.5 min-w-[130px]"
                        )}
                      >
                        <button
                          onClick={() => startEditing(conversation)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Rename
                        </button>
                        <button
                          onClick={() => handleDelete(conversation.id)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
