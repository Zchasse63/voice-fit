"use client";

/**
 * BulkClientAssignment Component
 * 
 * Multi-select client picker for assigning programs to multiple clients.
 * Set start dates for each client.
 */

import { useState, useEffect } from "react";
import { Check, X, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface Client {
  id: string;
  email: string;
  full_name?: string;
}

interface ClientAssignment {
  client_id: string;
  start_date: string;
}

interface BulkClientAssignmentProps {
  clients: Client[];
  onAssign: (assignments: ClientAssignment[]) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function BulkClientAssignment({
  clients,
  onAssign,
  onCancel,
  isLoading = false,
}: BulkClientAssignmentProps) {
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [startDates, setStartDates] = useState<Record<string, string>>({});

  useEffect(() => {
    // Initialize start dates to today
    const today = new Date().toISOString().split("T")[0];
    const initialDates: Record<string, string> = {};
    clients.forEach((client) => {
      initialDates[client.id] = today;
    });
    setStartDates(initialDates);
  }, [clients]);

  const toggleClient = (clientId: string) => {
    const newSelected = new Set(selectedClients);
    if (newSelected.has(clientId)) {
      newSelected.delete(clientId);
    } else {
      newSelected.add(clientId);
    }
    setSelectedClients(newSelected);
  };

  const handleStartDateChange = (clientId: string, date: string) => {
    setStartDates((prev) => ({
      ...prev,
      [clientId]: date,
    }));
  };

  const handleAssign = () => {
    const assignments: ClientAssignment[] = Array.from(selectedClients).map(
      (clientId) => ({
        client_id: clientId,
        start_date: startDates[clientId],
      })
    );
    onAssign(assignments);
  };

  const selectAll = () => {
    setSelectedClients(new Set(clients.map((c) => c.id)));
  };

  const deselectAll = () => {
    setSelectedClients(new Set());
  };

  return (
    <div className="space-y-lg">
      {/* Header */}
      <div className="card">
        <h2 className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary mb-md">
          Assign Program to Clients
        </h2>
        <p className="text-text-light-secondary dark:text-text-dark-secondary">
          Select clients and set start dates for the program
        </p>
      </div>

      {/* Selection Controls */}
      <div className="card flex gap-md">
        <button
          onClick={selectAll}
          className="btn-secondary flex-1"
          disabled={isLoading}
        >
          Select All
        </button>
        <button
          onClick={deselectAll}
          className="btn-secondary flex-1"
          disabled={isLoading}
        >
          Deselect All
        </button>
      </div>

      {/* Client List */}
      <div className="card">
        <h3 className="font-semibold text-text-light-primary dark:text-text-dark-primary mb-md">
          Clients ({selectedClients.size} selected)
        </h3>
        <div className="space-y-sm max-h-96 overflow-y-auto">
          {clients.map((client) => (
            <div
              key={client.id}
              className="p-md border border-border-light-light dark:border-border-dark-light rounded-md hover:bg-background-light-secondary dark:hover:bg-background-dark-secondary transition-colors"
            >
              <div className="flex items-start gap-md">
                <button
                  onClick={() => toggleClient(client.id)}
                  className={cn(
                    "mt-1 w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                    selectedClients.has(client.id)
                      ? "bg-primary-500 dark:bg-primary-dark border-primary-500 dark:border-primary-dark"
                      : "border-border-light-light dark:border-border-dark-light"
                  )}
                >
                  {selectedClients.has(client.id) && (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-light-primary dark:text-text-dark-primary">
                    {client.full_name || client.email}
                  </p>
                  <p className="text-sm text-text-light-tertiary dark:text-text-dark-tertiary">
                    {client.email}
                  </p>
                </div>

                {selectedClients.has(client.id) && (
                  <div className="flex items-center gap-sm">
                    <Calendar className="w-4 h-4 text-text-light-tertiary dark:text-text-dark-tertiary" />
                    <input
                      type="date"
                      value={startDates[client.id] || ""}
                      onChange={(e) => handleStartDateChange(client.id, e.target.value)}
                      className="p-xs border border-border-light-light dark:border-border-dark-light rounded bg-background-light-primary dark:bg-background-dark-primary text-text-light-primary dark:text-text-dark-primary text-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-md">
        <button
          onClick={onCancel}
          className="btn-secondary flex-1"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          onClick={handleAssign}
          className="btn-primary flex-1"
          disabled={isLoading || selectedClients.size === 0}
        >
          {isLoading ? "Assigning..." : `Assign to ${selectedClients.size} Client${selectedClients.size !== 1 ? "s" : ""}`}
        </button>
      </div>
    </div>
  );
}

