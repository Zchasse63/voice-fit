import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
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

    // Get request body
    const { user_id, days = 30 } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "Missing user_id" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    // Fetch nutrition data
    const { data: nutritionData } = await supabase
      .from("daily_nutrition_summary")
      .select("*")
      .eq("user_id", user_id)
      .gte("date", startDateStr)
      .lte("date", endDateStr)
      .order("date");

    // Fetch recovery metrics
    const { data: recoveryData } = await supabase
      .from("health_metrics")
      .select("*")
      .eq("user_id", user_id)
      .in("metric_type", ["recovery_score", "hrv", "resting_hr"])
      .gte("date", startDateStr)
      .lte("date", endDateStr)
      .order("date");

    // Fetch sleep data
    const { data: sleepData } = await supabase
      .from("sleep_sessions")
      .select("*")
      .eq("user_id", user_id)
      .gte("start_time", startDateStr)
      .lte("start_time", endDateStr)
      .order("start_time");

    // Fetch workout data
    const { data: workoutData } = await supabase
      .from("runs")
      .select("*")
      .eq("user_id", user_id)
      .gte("start_time", startDateStr)
      .lte("start_time", endDateStr)
      .order("start_time");

    // Calculate correlations
    const correlations = {
      nutrition_recovery: calculateCorrelation(
        nutritionData?.map((n: any) => n.calories) || [],
        recoveryData?.map((r: any) => r.value_numeric) || [],
        "calorie intake",
        "recovery score"
      ),
      nutrition_performance: calculateCorrelation(
        nutritionData?.map((n: any) => n.carbs_g) || [],
        workoutData?.map((w: any) => w.duration_minutes) || [],
        "carb intake",
        "workout duration"
      ),
      sleep_recovery: calculateCorrelation(
        sleepData?.map((s: any) => s.total_duration_minutes) || [],
        recoveryData?.map((r: any) => r.value_numeric) || [],
        "sleep duration",
        "recovery score"
      ),
      training_recovery: calculateCorrelation(
        workoutData?.map((w: any) => w.duration_minutes) || [],
        recoveryData?.map((r: any) => r.value_numeric) || [],
        "training volume",
        "recovery score"
      ),
      protein_recovery: calculateCorrelation(
        nutritionData?.map((n: any) => n.protein_g) || [],
        recoveryData?.map((r: any) => r.value_numeric) || [],
        "protein intake",
        "recovery score"
      ),
      carbs_performance: calculateCorrelation(
        nutritionData?.map((n: any) => n.carbs_g) || [],
        workoutData?.map((w: any) => w.duration_minutes) || [],
        "carb intake",
        "workout performance"
      ),
    };

    return new Response(
      JSON.stringify({
        success: true,
        correlations,
        analysis_period_days: days,
        analyzed_at: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error calculating correlations:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to calculate correlations",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function calculateCorrelation(
  x: number[],
  y: number[],
  xLabel: string,
  yLabel: string
): {
  correlation: number;
  sample_size: number;
  insight: string;
} {
  if (x.length < 2 || y.length < 2 || x.length !== y.length) {
    return {
      correlation: 0,
      sample_size: Math.min(x.length, y.length),
      insight: "Insufficient data",
    };
  }

  const n = x.length;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  const numerator = x.reduce((sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY), 0);
  const denominator =
    Math.sqrt(x.reduce((sum, xi) => sum + (xi - meanX) ** 2, 0)) *
    Math.sqrt(y.reduce((sum, yi) => sum + (yi - meanY) ** 2, 0));

  if (denominator === 0) {
    return {
      correlation: 0,
      sample_size: n,
      insight: "No variation in data",
    };
  }

  const correlation = numerator / denominator;
  const absCorr = Math.abs(correlation);

  let strength = "weak";
  if (absCorr >= 0.7) strength = "strong";
  else if (absCorr >= 0.3) strength = "moderate";

  const direction = correlation > 0 ? "positive" : "negative";
  const insight = `${strength.charAt(0).toUpperCase() + strength.slice(1)} ${direction} correlation between ${xLabel} and ${yLabel}`;

  return {
    correlation: Math.round(correlation * 1000) / 1000,
    sample_size: n,
    insight,
  };
}

