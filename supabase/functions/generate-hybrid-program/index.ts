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
    const { user_id, primary_goal, secondary_goal, duration_weeks } = await req.json();

    if (!user_id || !primary_goal || !secondary_goal) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate hybrid program structure
    const program = generateHybridProgram(primary_goal, secondary_goal, duration_weeks);

    // Save program to database
    const programData = {
      user_id,
      primary_goal,
      secondary_goal,
      duration_weeks,
      program_structure: program,
      created_at: new Date().toISOString(),
    };

    await supabase.from("hybrid_athlete_programs").insert([programData]);

    return new Response(
      JSON.stringify({
        success: true,
        primary_goal,
        secondary_goal,
        duration_weeks,
        program,
        generated_at: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating hybrid program:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate program" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateHybridProgram(
  primaryGoal: string,
  secondaryGoal: string,
  durationWeeks: number
): any {
  const programs: any = {
    "strength-endurance": {
      focus: ["Strength Maintenance", "Aerobic Capacity", "Recovery"],
      weekly_structure: {
        monday: "Lower Body Strength",
        tuesday: "Moderate Cardio (30-40 min)",
        wednesday: "Upper Body Strength",
        thursday: "Easy Cardio or Rest",
        friday: "Full Body Power",
        saturday: "Long Endurance Session",
        sunday: "Recovery & Mobility",
      },
      interference_mitigation: [
        "Separate strength and endurance by 6+ hours",
        "Prioritize strength on fresh days",
        "Use lower intensity cardio on strength days",
        "Increase calorie intake by 300-500 kcal",
        "Prioritize sleep (8-9 hours)",
      ],
      recovery_protocol: {
        daily: "10 min mobility + 5 min breathing",
        weekly: "1 full rest day + 1 active recovery day",
        monthly: "1 deload week (50% volume)",
      },
    },
    "endurance-strength": {
      focus: ["Aerobic Base", "Functional Strength", "Injury Prevention"],
      weekly_structure: {
        monday: "Easy Endurance (45-60 min)",
        tuesday: "Lower Body Strength",
        wednesday: "Moderate Endurance (30-40 min)",
        thursday: "Upper Body Strength",
        friday: "Easy Cardio or Rest",
        saturday: "Long Endurance Session",
        sunday: "Recovery & Mobility",
      },
      interference_mitigation: [
        "Strength training 2x/week (not on long run days)",
        "Use compound movements for efficiency",
        "Maintain high protein intake (1.6-2.2g/kg)",
        "Separate workouts by 6+ hours when possible",
        "Monitor HRV and recovery metrics",
      ],
      recovery_protocol: {
        daily: "15 min stretching + foam rolling",
        weekly: "1 full rest day + 1 easy day",
        monthly: "1 deload week (reduce volume by 40%)",
      },
    },
  };

  const key = `${primaryGoal}-${secondaryGoal}`;
  const program = programs[key] || programs["strength-endurance"];

  return {
    primary_goal: primaryGoal,
    secondary_goal: secondaryGoal,
    duration_weeks: durationWeeks,
    ...program,
    progression: generateProgression(durationWeeks),
    nutrition: {
      daily_calories: "Maintenance + 300-500 kcal",
      protein: "1.6-2.2g per kg body weight",
      carbs: "5-7g per kg body weight",
      fat: "1.5-2g per kg body weight",
      hydration: "3-4L per day + electrolytes",
    },
  };
}

function generateProgression(weeks: number): any {
  const phases = Math.ceil(weeks / 4);
  const progression: any = {};

  for (let i = 1; i <= phases; i++) {
    const phaseType =
      i === 1 ? "Base Building" : i === phases ? "Peak" : "Development";
    progression[`phase_${i}`] = {
      weeks: `${(i - 1) * 4 + 1}-${Math.min(i * 4, weeks)}`,
      strength_intensity: 60 + i * 8,
      endurance_volume: 100 + i * 5,
      focus: phaseType,
      recovery_emphasis: i === phases ? "High" : "Moderate",
    };
  }

  return progression;
}

