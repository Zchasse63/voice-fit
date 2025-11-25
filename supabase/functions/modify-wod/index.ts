import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase credentials");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { user_id, wod_text } = await req.json();

    if (!user_id || !wod_text) {
      return new Response(
        JSON.stringify({ error: "Missing user_id or wod_text" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch user injuries
    const injuriesRes = await supabase
      .from("injuries")
      .select("body_part")
      .eq("user_id", user_id)
      .is("resolved_at", null);

    const injuries = injuriesRes.data || [];
    const injuredParts = injuries.map((i: any) => i.body_part);

    // Parse WOD to extract movements
    const movements = parseWODMovements(wod_text);

    // Generate modifications for each level
    const modifications = [
      generateModification("beginner", movements, injuredParts),
      generateModification("intermediate", movements, injuredParts),
      generateModification("advanced", movements, injuredParts),
    ];

    return new Response(
      JSON.stringify({
        success: true,
        original_wod: wod_text,
        modifications,
        user_injuries: injuredParts,
        generated_at: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error modifying WOD:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to modify WOD" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function parseWODMovements(wodText: string): string[] {
  // Extract movement names from WOD text
  const movements: string[] = [];
  const lines = wodText.split("\n");

  for (const line of lines) {
    // Look for patterns like "10 Thrusters", "5x5 Squats", etc.
    const match = line.match(/\d+x?\d*\s+([A-Za-z\s]+)/);
    if (match) {
      movements.push(match[1].trim());
    }
  }

  return [...new Set(movements)]; // Remove duplicates
}

function generateModification(
  level: "beginner" | "intermediate" | "advanced",
  movements: string[],
  injuredParts: string[]
): any {
  const modifications: any = {
    beginner: {
      reps_multiplier: 0.6,
      weight_reduction: 0.5,
      time_estimate: "20-25 min",
      modifications: [
        "Reduce reps by 40%",
        "Use lighter weights or resistance",
        "Take longer rest periods",
        "Modify high-impact movements",
      ],
    },
    intermediate: {
      reps_multiplier: 0.8,
      weight_reduction: 0.75,
      time_estimate: "15-20 min",
      modifications: [
        "Reduce reps by 20%",
        "Use 75% of prescribed weight",
        "Standard rest periods",
        "Scale complex movements",
      ],
    },
    advanced: {
      reps_multiplier: 1.0,
      weight_reduction: 1.0,
      time_estimate: "12-18 min",
      modifications: [
        "Perform as prescribed",
        "Use full prescribed weight",
        "Minimal rest periods",
        "Challenge yourself",
      ],
    },
  };

  const mod = modifications[level];
  const scaledMovements = movements.map((m) => {
    // Check if movement involves injured areas
    const isInjured = injuredParts.some((part) =>
      m.toLowerCase().includes(part.toLowerCase())
    );

    return {
      name: m,
      reps: `${Math.round(100 * mod.reps_multiplier)}% reps`,
      weight: `${Math.round(100 * mod.weight_reduction)}% weight`,
      notes: isInjured ? "⚠️ Modified for injury" : "",
    };
  });

  return {
    level,
    movements: scaledMovements,
    time_estimate: mod.time_estimate,
    modifications: mod.modifications,
  };
}

