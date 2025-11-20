"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ProgramBuilder } from "@/components/shared/ProgramBuilder";

export default function ProgramsPage() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id || null);
  };

  if (!userId) return <div>Loading...</div>;

  return (
    <div className="space-y-lg">
      <h1 className="text-3xl font-bold text-text-light-primary dark:text-text-dark-primary">
        Training Programs
      </h1>
      <ProgramBuilder userId={userId} />
    </div>
  );
}

