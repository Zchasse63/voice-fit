"use client";

import { useParams } from "next/navigation";
import { Analytics } from "@/components/shared/Analytics";
import { ClientSelector } from "@/components/coach/ClientSelector";
import { useState } from "react";

export default function ClientAnalyticsPage() {
  const params = useParams();
  const clientId = params.clientId as string;
  const [selectedClientId, setSelectedClientId] = useState(clientId);

  return (
    <div className="space-y-lg">
      <ClientSelector
        selectedClientId={selectedClientId}
        onClientSelect={setSelectedClientId}
      />
      <h1 className="text-3xl font-bold">Analytics</h1>
      <Analytics userId={selectedClientId} />
    </div>
  );
}

