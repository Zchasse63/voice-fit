"use client";

/**
 * ClientSelector Component
 * 
 * Dropdown for coaches to switch between assigned clients.
 * Shows client name, status, and last activity.
 */

import { useState, useEffect } from "react";
import { ChevronDown, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

interface Client {
  id: string;
  email: string;
  full_name?: string;
  last_active?: string;
}

interface ClientSelectorProps {
  selectedClientId: string | null;
  onClientSelect: (clientId: string) => void;
  className?: string;
}

export function ClientSelector({
  selectedClientId,
  onClientSelect,
  className,
}: ClientSelectorProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Fetch assigned clients
      const { data: assignments } = await supabase
        .from("client_assignments")
        .select(`
          client_id,
          user_profiles!client_id (
            user_id,
            email,
            full_name
          )
        `)
        .eq("coach_id", user.id)
        .is("revoked_at", null);

      if (assignments) {
        const clientList = assignments.map((assignment: any) => ({
          id: assignment.user_profiles.user_id,
          email: assignment.user_profiles.email,
          full_name: assignment.user_profiles.full_name,
        }));
        
        setClients(clientList);
        
        // Auto-select first client if none selected
        if (!selectedClientId && clientList.length > 0) {
          onClientSelect(clientList[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  if (isLoading) {
    return (
      <div className={cn("card p-md", className)}>
        <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
          Loading clients...
        </p>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className={cn("card p-md", className)}>
        <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
          No clients assigned yet
        </p>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full card p-md flex items-center justify-between hover:bg-background-light-secondary dark:hover:bg-background-dark-secondary transition-colors"
      >
        <div className="flex items-center gap-sm">
          <div className="w-10 h-10 rounded-full bg-primary-500 dark:bg-primary-dark flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-text-light-primary dark:text-text-dark-primary">
              {selectedClient?.full_name || selectedClient?.email || "Select Client"}
            </p>
            <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
              {selectedClient?.email}
            </p>
          </div>
        </div>
        <ChevronDown
          className={cn(
            "w-5 h-5 text-text-light-secondary dark:text-text-dark-secondary transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-xs card max-h-64 overflow-y-auto z-50 shadow-lg">
          {clients.map((client) => (
            <button
              key={client.id}
              onClick={() => {
                onClientSelect(client.id);
                setIsOpen(false);
              }}
              className={cn(
                "w-full p-md flex items-center gap-sm hover:bg-background-light-secondary dark:hover:bg-background-dark-secondary transition-colors text-left",
                client.id === selectedClientId && "bg-background-light-tertiary dark:bg-background-dark-tertiary"
              )}
            >
              <div className="w-10 h-10 rounded-full bg-primary-500 dark:bg-primary-dark flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-text-light-primary dark:text-text-dark-primary truncate">
                  {client.full_name || client.email}
                </p>
                <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary truncate">
                  {client.email}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

