"use client";

import { useParams } from "next/navigation";
import { HealthInsights } from "@/components/shared/HealthInsights";
import { Analytics } from "@/components/shared/Analytics";
import { Calendar } from "@/components/shared/Calendar";
import { ClientSelector } from "@/components/coach/ClientSelector";
import { useState } from "react";

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.clientId as string;
  const [selectedClientId, setSelectedClientId] = useState(clientId);

  return (
    <div className="space-y-lg">
      <ClientSelector
        selectedClientId={selectedClientId}
        onClientSelect={setSelectedClientId}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        <HealthInsights userId={selectedClientId} />
        <Analytics userId={selectedClientId} />
      </div>

      <Calendar userId={selectedClientId} />
    </div>
  );
}

