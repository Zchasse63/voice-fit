"use client";

import { useParams } from "next/navigation";
import { Calendar } from "@/components/shared/Calendar";
import { ClientSelector } from "@/components/coach/ClientSelector";
import { useState } from "react";

export default function ClientCalendarPage() {
  const params = useParams();
  const clientId = params.clientId as string;
  const [selectedClientId, setSelectedClientId] = useState(clientId);

  return (
    <div className="space-y-lg">
      <ClientSelector
        selectedClientId={selectedClientId}
        onClientSelect={setSelectedClientId}
      />
      <h1 className="text-3xl font-bold">Calendar</h1>
      <Calendar userId={selectedClientId} />
    </div>
  );
}

