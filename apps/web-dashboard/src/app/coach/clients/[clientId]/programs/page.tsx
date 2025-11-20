"use client";

import { useParams } from "next/navigation";
import { ProgramBuilder } from "@/components/shared/ProgramBuilder";
import { ClientSelector } from "@/components/coach/ClientSelector";
import { useState } from "react";

export default function ClientProgramsPage() {
  const params = useParams();
  const clientId = params.clientId as string;
  const [selectedClientId, setSelectedClientId] = useState(clientId);

  return (
    <div className="space-y-lg">
      <ClientSelector
        selectedClientId={selectedClientId}
        onClientSelect={setSelectedClientId}
      />
      <h1 className="text-3xl font-bold">Training Programs</h1>
      <ProgramBuilder userId={selectedClientId} />
    </div>
  );
}

