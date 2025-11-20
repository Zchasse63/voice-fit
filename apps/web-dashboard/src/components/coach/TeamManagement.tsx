"use client";

/**
 * TeamManagement Component
 * 
 * Manage organization, coaches, and team settings.
 */

import { useState, useEffect } from "react";
import { Users, Mail, CheckCircle, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

interface Invitation {
  id: string;
  client_email: string;
  status: "pending" | "accepted" | "declined" | "expired";
  invited_at: string;
  responded_at?: string;
}

export function TeamManagement({ className }: { className?: string }) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/coach/invitations");
      const data = await response.json();
      
      if (data.success) {
        setInvitations(data.invitations || []);
      }
    } catch (error) {
      console.error("Error fetching invitations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <CheckCircle className="w-5 h-5 text-success-light dark:text-success-dark" />;
      case "declined":
        return <XCircle className="w-5 h-5 text-error-light dark:text-error-dark" />;
      case "expired":
        return <Clock className="w-5 h-5 text-text-light-tertiary dark:text-text-dark-tertiary" />;
      default:
        return <Mail className="w-5 h-5 text-warning-light dark:text-warning-dark" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "text-success-light dark:text-success-dark";
      case "declined":
        return "text-error-light dark:text-error-dark";
      case "expired":
        return "text-text-light-tertiary dark:text-text-dark-tertiary";
      default:
        return "text-warning-light dark:text-warning-dark";
    }
  };

  if (isLoading) {
    return (
      <div className={cn("card", className)}>
        <p className="text-text-light-tertiary dark:text-text-dark-tertiary">
          Loading invitations...
        </p>
      </div>
    );
  }

  return (
    <div className={cn("card", className)}>
      <div className="flex items-center gap-sm mb-lg">
        <Users className="w-6 h-6 text-primary-500 dark:text-primary-dark" />
        <h3 className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
          Team Management
        </h3>
      </div>

      {invitations.length === 0 ? (
        <p className="text-text-light-tertiary dark:text-text-dark-tertiary">
          No invitations sent yet
        </p>
      ) : (
        <div className="space-y-sm">
          {invitations.map((invitation) => (
            <div
              key={invitation.id}
              className="p-md border border-border-light-light dark:border-border-dark-light rounded-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-sm">
                  {getStatusIcon(invitation.status)}
                  <div>
                    <p className="font-medium text-text-light-primary dark:text-text-dark-primary">
                      {invitation.client_email}
                    </p>
                    <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
                      Invited {new Date(invitation.invited_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "text-sm font-medium capitalize",
                    getStatusColor(invitation.status)
                  )}
                >
                  {invitation.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

