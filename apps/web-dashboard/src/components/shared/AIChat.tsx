"use client";

/**
 * AIChat Component
 * 
 * Shared AI chat interface for both Premium and Coach dashboards.
 * Accepts userId (Premium mode) or clientId (Coach mode) to scope conversations.
 * 
 * CRITICAL: Matches iOS app chat UI exactly - iOS Messages style bubbles
 */

import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface AIChatProps {
  userId?: string; // For Premium users viewing their own data
  clientId?: string; // For Coaches viewing client data
  className?: string;
}

export function AIChat({ userId, clientId, className }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const targetUserId = clientId || userId;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // TODO: Call backend API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          userId: targetUserId,
          history: messages,
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "I'm here to help!",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Fallback message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-md space-y-sm scrollbar-thin">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-text-light-tertiary dark:text-text-dark-tertiary text-sm">
              Start a conversation with your AI coach
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "rounded-[18px] px-md py-3 max-w-[75%]",
                message.role === "user"
                  ? "bg-accent-light-blue dark:bg-accent-dark-blue text-white"
                  : "bg-background-light-secondary dark:bg-background-dark-secondary text-text-light-primary dark:text-text-dark-primary"
              )}
            >
              <p className="text-base whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-background-light-secondary dark:bg-background-dark-secondary rounded-[18px] px-md py-3">
              <Loader2 className="w-5 h-5 animate-spin text-text-light-tertiary dark:text-text-dark-tertiary" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Container */}
      <div className="border-t border-border-light-light dark:border-border-dark-light p-md">
        <div className="flex gap-sm items-center">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask your AI coach..."
            disabled={isLoading}
            className="flex-1 input"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={cn(
              "btn btn-primary w-[52px] h-[52px] rounded-full flex items-center justify-center",
              (!input.trim() || isLoading) && "opacity-50 cursor-not-allowed"
            )}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

