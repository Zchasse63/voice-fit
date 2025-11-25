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
    const { user_id, command, context } = await req.json();

    if (!user_id || !command) {
      return new Response(
        JSON.stringify({ error: "Missing user_id or command" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Process command
    const interpretation = interpretCommand(command, context);

    // Log command for analytics
    await supabase.from("voice_commands").insert([
      {
        user_id,
        command,
        interpretation: interpretation.type,
        created_at: new Date().toISOString(),
      },
    ]);

    return new Response(
      JSON.stringify({
        success: true,
        command,
        interpretation,
        generated_at: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing voice command:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to process command" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function interpretCommand(command: string, context: any): any {
  const cmd = command.toLowerCase();

  // Exercise swap commands
  if (cmd.includes("swap") || cmd.includes("replace")) {
    return {
      type: "swap_exercise",
      action: "Replace current exercise",
      confirmation: "I'll help you swap that exercise",
    };
  }

  // Difficulty adjustment
  if (cmd.includes("easier") || cmd.includes("lighter")) {
    return {
      type: "reduce_difficulty",
      action: "Reduce weight or reps by 10-20%",
      confirmation: "Making it easier for you",
    };
  }

  if (cmd.includes("harder") || cmd.includes("heavier")) {
    return {
      type: "increase_difficulty",
      action: "Increase weight or reps by 10-20%",
      confirmation: "Increasing the intensity",
    };
  }

  // Form cues
  if (cmd.includes("form") || cmd.includes("how do i")) {
    return {
      type: "form_cue",
      action: "Provide form instructions",
      confirmation: "Here's the proper form",
    };
  }

  // Workout control
  if (cmd.includes("timer") || cmd.includes("rest")) {
    return {
      type: "start_timer",
      action: "Start rest timer",
      confirmation: "Starting rest timer",
    };
  }

  if (cmd.includes("next") || cmd.includes("skip")) {
    return {
      type: "next_set",
      action: "Move to next set",
      confirmation: "Moving to next set",
    };
  }

  if (cmd.includes("end") || cmd.includes("finish")) {
    return {
      type: "end_workout",
      action: "Finish workout",
      confirmation: "Ending workout",
    };
  }

  // Program modifications
  if (cmd.includes("more") && cmd.includes("cardio")) {
    return {
      type: "increase_cardio",
      action: "Add more cardio volume",
      confirmation: "I'll add more cardio to your program",
    };
  }

  if (cmd.includes("less") && cmd.includes("volume")) {
    return {
      type: "reduce_volume",
      action: "Reduce workout volume",
      confirmation: "Reducing workout volume",
    };
  }

  // Default
  return {
    type: "unknown",
    action: "Clarification needed",
    confirmation: "I didn't quite understand that. Can you rephrase?",
  };
}

