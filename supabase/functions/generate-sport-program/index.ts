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
    const { user_id, sport, position, season, duration_weeks } = await req.json();

    if (!user_id || !sport) {
      return new Response(
        JSON.stringify({ error: "Missing user_id or sport" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate sport-specific program structure
    const program = generateSportProgram(sport, position, season, duration_weeks);

    // Save program to database
    const programData = {
      user_id,
      sport,
      position: position || null,
      season,
      duration_weeks,
      program_structure: program,
      created_at: new Date().toISOString(),
    };

    await supabase.from("sport_training_programs").insert([programData]);

    return new Response(
      JSON.stringify({
        success: true,
        sport,
        position,
        season,
        duration_weeks,
        program,
        generated_at: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating sport program:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate program" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateSportProgram(
  sport: string,
  position: string | null,
  season: string,
  durationWeeks: number
): any {
  const sportPrograms: any = {
    basketball: {
      "off-season": {
        focus: ["Strength", "Power", "Vertical Jump", "Lateral Agility"],
        weekly_structure: {
          monday: "Lower Body Strength + Plyometrics",
          tuesday: "Upper Body Strength + Core",
          wednesday: "Rest or Light Cardio",
          thursday: "Full Body Power + Court Agility",
          friday: "Upper Body Hypertrophy",
          saturday: "Sport-Specific Drills",
          sunday: "Recovery",
        },
        key_exercises: [
          "Squats",
          "Deadlifts",
          "Box Jumps",
          "Lateral Bounds",
          "Bench Press",
          "Rows",
          "Core Work",
        ],
      },
      "pre-season": {
        focus: ["Sport-Specific Conditioning", "Agility", "Endurance"],
        weekly_structure: {
          monday: "Lower Body + Court Conditioning",
          tuesday: "Upper Body + Agility Ladder",
          wednesday: "Full Body Circuit",
          thursday: "Sport-Specific Drills",
          friday: "Strength Maintenance",
          saturday: "Game Simulation",
          sunday: "Recovery",
        },
      },
      "in-season": {
        focus: ["Maintenance", "Injury Prevention", "Recovery"],
        weekly_structure: {
          monday: "Light Strength + Mobility",
          tuesday: "Upper Body Maintenance",
          wednesday: "Rest or Recovery",
          thursday: "Lower Body Maintenance",
          friday: "Light Conditioning",
          saturday: "Game Day",
          sunday: "Recovery",
        },
      },
    },
    soccer: {
      "off-season": {
        focus: ["Strength", "Power", "Acceleration", "Deceleration"],
        weekly_structure: {
          monday: "Lower Body Strength",
          tuesday: "Upper Body + Core",
          wednesday: "Plyometrics + Agility",
          thursday: "Full Body Power",
          friday: "Strength Maintenance",
          saturday: "Sport-Specific Drills",
          sunday: "Recovery",
        },
        key_exercises: [
          "Squats",
          "Lunges",
          "Single-Leg Deadlifts",
          "Box Jumps",
          "Lateral Bounds",
          "Core Stability",
        ],
      },
      "pre-season": {
        focus: ["Conditioning", "Agility", "Endurance"],
        weekly_structure: {
          monday: "Lower Body + Conditioning",
          tuesday: "Agility Ladder + Footwork",
          wednesday: "Interval Training",
          thursday: "Sport-Specific Drills",
          friday: "Strength Maintenance",
          saturday: "Scrimmage",
          sunday: "Recovery",
        },
      },
      "in-season": {
        focus: ["Maintenance", "Injury Prevention"],
        weekly_structure: {
          monday: "Light Strength",
          tuesday: "Mobility + Core",
          wednesday: "Rest",
          thursday: "Light Conditioning",
          friday: "Game Prep",
          saturday: "Match Day",
          sunday: "Recovery",
        },
      },
    },
  };

  const sport_lower = sport.toLowerCase();
  const program = sportPrograms[sport_lower]?.[season] || {
    focus: ["General Strength", "Conditioning"],
    weekly_structure: {
      monday: "Lower Body",
      tuesday: "Upper Body",
      wednesday: "Rest",
      thursday: "Full Body",
      friday: "Sport-Specific",
      saturday: "Conditioning",
      sunday: "Recovery",
    },
  };

  return {
    sport,
    position,
    season,
    duration_weeks: durationWeeks,
    ...program,
    progression: generateProgression(durationWeeks),
  };
}

function generateProgression(weeks: number): any {
  const phases = Math.ceil(weeks / 4);
  const progression: any = {};

  for (let i = 1; i <= phases; i++) {
    progression[`phase_${i}`] = {
      weeks: `${(i - 1) * 4 + 1}-${Math.min(i * 4, weeks)}`,
      intensity: 60 + i * 10,
      volume: 100 + i * 5,
      focus: i === 1 ? "Base Building" : i === phases ? "Peak" : "Development",
    };
  }

  return progression;
}

