"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Sparkles, User, Trash2 } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAccountStore } from "@/store/account-store";
import { cn } from "@/lib/utils";
import { useJemma, type JemmaMessage } from "@/features/chat/use-jemma";

// Inner component that uses the hook (only rendered when authenticated)
function AIChatInner({
  isOpen,
  setIsOpen,
  selectedAccountId,
  accountName
}: {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  selectedAccountId: string | null;
  accountName: string;
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");

  // Use the Jemma hook with the SDK
  const {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
  } = useJemma({ accountId: selectedAccountId || undefined });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput("");
    await sendMessage(message);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const clearChat = () => {
    clearMessages();
  };

  const suggestedQuestions = [
    "What type of content performs best?",
    "What should I post today?",
    "How can I improve engagement?",
    "Compare my platforms",
  ];

  // Welcome message when no messages
  const displayMessages: JemmaMessage[] = messages.length === 0
    ? [{
        id: "welcome",
        role: "assistant" as const,
        content: "Hi! I'm Jemma, your AI social media strategist. I can help you analyze your content performance, suggest improvements, and answer questions about your strategy. What would you like to know?",
        timestamp: Date.now(),
      }]
    : messages;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/20"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 h-screen w-96 bg-card border-l border-border shadow-xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border p-4">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    "bg-primary"
                  )}
                >
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold">Jemma</h2>
                  <p className="text-xs text-muted-foreground">
                    {accountName || "Select an account"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearChat}
                  title="Clear chat"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {displayMessages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex gap-2",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.role === "assistant" && (
                      <div
                        className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
                          "bg-primary"
                        )}
                      >
                        <Sparkles className="h-3 w-3 text-white" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "rounded-lg p-3 max-w-[85%]",
                        message.role === "user"
                          ? "bg-primary text-white"
                          : "bg-muted"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                    {message.role === "user" && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <User className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </motion.div>
                ))}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-2 justify-start"
                  >
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
                        "bg-primary"
                      )}
                    >
                      <Sparkles className="h-3 w-3 text-white animate-pulse" />
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
                        <span
                          className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        />
                        <span
                          className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
                {/* Scroll anchor */}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Suggested Questions */}
            {messages.length === 0 && (
              <div className="px-4 py-2 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">
                  Suggested questions:
                </p>
                <div className="flex flex-wrap gap-1">
                  {suggestedQuestions.map((q) => (
                    <button
                      key={q}
                      onClick={() => setInput(q)}
                      className="text-xs px-2 py-1 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="border-t border-border p-4">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Ask Jemma anything..."
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={isLoading || !input.trim()}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const { authenticated, ready } = usePrivy();
  const { selectedAccountId, accounts } = useAccountStore();
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  // Don't render anything until Privy is ready and user is authenticated
  if (!ready || !authenticated) {
    return null;
  }

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg hover:shadow-xl transition-shadow bg-primary hover:bg-primary/90"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={false}
        animate={{
          opacity: isOpen ? 0 : 1,
          pointerEvents: isOpen ? "none" : "auto",
        }}
      >
        <MessageCircle className="h-6 w-6 text-white" />
      </motion.button>

      {/* Chat drawer - only rendered when authenticated */}
      <AIChatInner
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        selectedAccountId={selectedAccountId}
        accountName={selectedAccount?.name || ""}
      />
    </>
  );
}
