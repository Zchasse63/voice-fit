"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AIChat } from "@/components/shared/AIChat";

export default function ChatPage() {
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
    <div className="h-[calc(100vh-120px)]">
      <h1 className="text-3xl font-bold text-text-light-primary dark:text-text-dark-primary mb-lg">
        AI Coach
      </h1>
      <div className="h-[calc(100%-60px)]">
        <AIChat userId={userId} />
      </div>
    </div>
  );
}

