"use client";

import { useParams } from "next/navigation";
import { AIChat } from "@/components/shared/AIChat";
import { ClientSelector } from "@/components/coach/ClientSelector";
import { useState } from "react";

export default function ClientChatPage() {
  const params = useParams();
  const clientId = params.clientId as string;
  const [selectedClientId, setSelectedClientId] = useState(clientId);

  return (
    <div className="h-[calc(100vh-120px)] space-y-lg">
      <ClientSelector
        selectedClientId={selectedClientId}
        onClientSelect={setSelectedClientId}
      />
      <h1 className="text-3xl font-bold">AI Coach</h1>
      <div className="h-[calc(100%-120px)]">
        <AIChat clientId={selectedClientId} />
      </div>
    </div>
  );
}

