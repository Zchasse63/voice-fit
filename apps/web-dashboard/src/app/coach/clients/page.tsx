"use client";

/**
 * Coach Clients List Page
 * 
 * Shows all assigned clients with status and quick actions.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { InviteClient } from "@/components/coach/InviteClient";
import { TeamManagement } from "@/components/coach/TeamManagement";
import { ClientSelector } from "@/components/coach/ClientSelector";

export default function CoachClientsPage() {
  const router = useRouter();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    router.push(`/coach/clients/${clientId}`);
  };

  return (
    <div className="space-y-lg">
      <div>
        <h1 className="text-3xl font-bold text-text-light-primary dark:text-text-dark-primary mb-sm">
          My Clients
        </h1>
        <p className="text-text-light-tertiary dark:text-text-dark-tertiary">
          Manage your clients and send invitations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        <div className="space-y-lg">
          <ClientSelector
            selectedClientId={selectedClientId}
            onClientSelect={handleClientSelect}
          />
          <InviteClient />
        </div>
        
        <TeamManagement />
      </div>
    </div>
  );
}

