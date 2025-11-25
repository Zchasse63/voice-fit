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
    const { user_id, race_name, race_type, distance_km, elevation_gain_m, weather_forecast } =
      await req.json();

    if (!user_id || !race_name || !race_type || !distance_km) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate race plan
    const plan = generateRacePlan(race_type, distance_km, elevation_gain_m, weather_forecast);

    // Save plan to database
    const planData = {
      user_id,
      race_name,
      race_type,
      distance_km,
      elevation_gain_m,
      plan_details: plan,
      created_at: new Date().toISOString(),
    };

    await supabase.from("race_day_plans").insert([planData]);

    return new Response(
      JSON.stringify({
        success: true,
        race_name,
        race_type,
        distance_km,
        plan,
        generated_at: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating race plan:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate plan" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateRacePlan(
  raceType: string,
  distanceKm: number,
  elevationGainM: number,
  weatherForecast: any
): any {
  const plans: any = {
    "5k": {
      pacing_strategy: {
        warmup: "10 min easy jog",
        race: "Negative split strategy: first 2.5km at goal pace, last 2.5km 5-10 sec/km faster",
        splits: ["0-1km: 4:30/km", "1-2km: 4:25/km", "2-3km: 4:20/km", "3-5km: 4:15/km"],
      },
      nutrition_plan: {
        pre_race: "Light meal 2-3 hours before (bagel + banana)",
        during: "Water only (too short for fuel)",
        post_race: "Carbs + protein within 30 min",
      },
      hydration_strategy: {
        pre_race: "500ml water 2 hours before",
        during: "Water at aid stations if available",
        post_race: "500ml electrolyte drink",
      },
    },
    half_marathon: {
      pacing_strategy: {
        warmup: "15 min easy jog + dynamic stretches",
        race: "Even pacing or slight negative split",
        splits: ["0-5km: 5:00/km", "5-10km: 5:00/km", "10-15km: 4:55/km", "15-21km: 4:50/km"],
      },
      nutrition_plan: {
        pre_race: "Carb-loading 2-3 days before, light meal 2 hours before",
        during: "Gels at 5km, 10km, 15km (120-240 cal each)",
        post_race: "Carbs + protein within 30 min",
      },
      hydration_strategy: {
        pre_race: "500ml water 2 hours before",
        during: "200ml water every 2-3km",
        post_race: "1L electrolyte drink over 2 hours",
      },
    },
    marathon: {
      pacing_strategy: {
        warmup: "20 min easy jog + dynamic stretches",
        race: "Conservative first half, push second half",
        splits: [
          "0-10km: 5:30/km",
          "10-20km: 5:25/km",
          "20-30km: 5:20/km",
          "30-40km: 5:15/km",
        ],
      },
      nutrition_plan: {
        pre_race: "Carb-loading 3-4 days before, light meal 3 hours before",
        during: "Gels every 45 min (120-240 cal), sports drink at aid stations",
        post_race: "Carbs + protein within 30 min, continue hydration",
      },
      hydration_strategy: {
        pre_race: "500ml water 2 hours before",
        during: "200-300ml water every 2km, electrolytes every 5km",
        post_race: "1.5L electrolyte drink over 4 hours",
      },
    },
    triathlon: {
      pacing_strategy: {
        swim: "Start conservative, find rhythm, negative split",
        bike: "Steady effort, save energy for run",
        run: "Start easy, build into race pace",
      },
      nutrition_plan: {
        pre_race: "Light meal 2-3 hours before",
        during: "Gels on bike, water on run",
        post_race: "Carbs + protein within 30 min",
      },
      hydration_strategy: {
        pre_race: "500ml water 2 hours before",
        during: "Sports drink on bike, water on run",
        post_race: "1L electrolyte drink",
      },
    },
    ultra: {
      pacing_strategy: {
        strategy: "Ultra-conservative pacing, focus on consistency",
        first_half: "60-70% effort",
        second_half: "Maintain effort, don't race",
      },
      nutrition_plan: {
        pre_race: "Carb-load 5-7 days before",
        during: "Mix of gels, bars, real food at aid stations",
        post_race: "Continuous nutrition for 24 hours",
      },
      hydration_strategy: {
        during: "Drink to thirst, electrolytes every 30 min",
        post_race: "Continuous hydration for 24 hours",
      },
    },
  };

  const basePlan = plans[raceType] || plans.marathon;

  return {
    race_type: raceType,
    distance_km: distanceKm,
    elevation_gain_m: elevationGainM,
    ...basePlan,
    weather_adjustments: getWeatherAdjustments(weatherForecast),
    pre_race_checklist: [
      "Check weather forecast",
      "Prepare race outfit and test",
      "Set alarm 2 hours before race",
      "Eat light breakfast",
      "Arrive 45 min early",
      "Do dynamic warm-up",
      "Use bathroom",
      "Apply sunscreen",
    ],
    mental_strategy: [
      "Break race into segments",
      "Focus on effort, not pace",
      "Use positive self-talk",
      "Embrace discomfort",
      "Celebrate small wins",
    ],
  };
}

function getWeatherAdjustments(weather: any): any {
  if (!weather) return {};

  const temp = weather.temp || 15;
  const adjustments: any = {};

  if (temp > 25) {
    adjustments.heat = "Increase hydration by 20%, slow pace by 5-10 sec/km";
  } else if (temp < 5) {
    adjustments.cold = "Wear layers, increase warm-up time";
  }

  if (weather.wind && weather.wind > 20) {
    adjustments.wind = "Adjust pacing for headwind sections";
  }

  return adjustments;
}

