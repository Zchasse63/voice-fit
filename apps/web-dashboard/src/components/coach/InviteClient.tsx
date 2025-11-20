"use client";

/**
 * InviteClient Component
 * 
 * Form for coaches to invite clients by email.
 */

import { useState } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface InviteClientProps {
  onInviteSent?: () => void;
  className?: string;
}

export function InviteClient({ onInviteSent, className }: InviteClientProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch("/api/coach/invite-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_email: email,
          message: message || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to send invitation");
      }

      setSuccess(true);
      setEmail("");
      setMessage("");
      onInviteSent?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("card", className)}>
      <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-md">
        Invite New Client
      </h3>

      <form onSubmit={handleSubmit} className="space-y-md">
        <div>
          <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-xs">
            Client Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="client@example.com"
            disabled={isLoading}
            className="input w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-xs">
            Message (Optional)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a personal message..."
            rows={3}
            disabled={isLoading}
            className="input w-full resize-none"
          />
        </div>

        {error && (
          <div className="p-sm bg-error-light/10 dark:bg-error-dark/10 border border-error-light dark:border-error-dark rounded-md">
            <p className="text-sm text-error-light dark:text-error-dark">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-sm bg-success-light/10 dark:bg-success-dark/10 border border-success-light dark:border-success-dark rounded-md">
            <p className="text-sm text-success-light dark:text-success-dark">
              Invitation sent successfully!
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            "btn-primary w-full flex items-center justify-center gap-sm",
            isLoading && "opacity-50 cursor-not-allowed"
          )}
        >
          <Send className="w-4 h-4" />
          {isLoading ? "Sending..." : "Send Invitation"}
        </button>
      </form>
    </div>
  );
}

