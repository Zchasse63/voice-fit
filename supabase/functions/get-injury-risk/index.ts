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
    const { user_id, days = 30 } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "Missing user_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    // Fetch training data
    const { data: trainingData } = await supabase
      .from("runs")
      .select("*")
      .eq("user_id", user_id)
      .gte("start_time", startDateStr)
      .lte("start_time", endDateStr)
      .order("start_time");

    // Fetch recovery metrics
    const { data: recoveryData } = await supabase
      .from("health_metrics")
      .select("*")
      .eq("user_id", user_id)
      .in("metric_type", ["recovery_score", "strain_score"])
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

    // Fetch nutrition data
    const { data: nutritionData } = await supabase
      .from("daily_nutrition_summary")
      .select("*")
      .eq("user_id", user_id)
      .gte("date", startDateStr)
      .lte("date", endDateStr)
      .order("date");

    let riskScore = 0;
    const riskFactors: any[] = [];

    // Factor 1: Training load spike
    if (trainingData && trainingData.length >= 7) {
      const recentVolume = trainingData.slice(0, 7).reduce((sum: number, w: any) => sum + (w.duration_minutes || 0), 0);
      const previousVolume = trainingData.length >= 14
        ? trainingData.slice(7, 14).reduce((sum: number, w: any) => sum + (w.duration_minutes || 0), 0)
        : recentVolume;

      if (previousVolume > 0) {
        const volumeIncrease = (recentVolume - previousVolume) / previousVolume;
        if (volumeIncrease > 0.3) {
          riskScore += 0.25;
          riskFactors.push({
            factor: "Training Load Spike",
            severity: volumeIncrease > 0.5 ? "high" : "medium",
            description: `Training volume increased ${(volumeIncrease * 100).toFixed(0)}% in the last week`,
            recommendation: "Consider a deload week or reduce intensity",
          });
        }
      }
    }

    // Factor 2: Low recovery
    if (recoveryData && recoveryData.length > 0) {
      const recoveryScores = recoveryData
        .filter((m: any) => m.metric_type === "recovery_score")
        .map((m: any) => m.value_numeric);

      if (recoveryScores.length > 0) {
        const avgRecovery = recoveryScores.reduce((a: number, b: number) => a + b, 0) / recoveryScores.length;
        if (avgRecovery < 50) {
          riskScore += 0.25;
          riskFactors.push({
            factor: "Low Recovery",
            severity: avgRecovery < 40 ? "high" : "medium",
            description: `Average recovery score is ${avgRecovery.toFixed(0)}%`,
            recommendation: "Prioritize sleep, nutrition, and active recovery",
          });
        }
      }
    }

    // Factor 3: Poor sleep
    if (sleepData && sleepData.length > 0) {
      const sleepDurations = sleepData.map((s: any) => (s.total_duration_minutes || 0) / 60);
      const avgSleep = sleepDurations.reduce((a: number, b: number) => a + b, 0) / sleepDurations.length;

      if (avgSleep < 6.5) {
        riskScore += 0.2;
        riskFactors.push({
          factor: "Insufficient Sleep",
          severity: avgSleep < 6 ? "high" : "medium",
          description: `Average sleep is ${avgSleep.toFixed(1)} hours`,
          recommendation: "Aim for 7-9 hours of sleep per night",
        });
      }
    }

    // Factor 4: Low protein
    if (nutritionData && nutritionData.length > 0) {
      const avgProtein = nutritionData.reduce((sum: number, n: any) => sum + (n.protein_g || 0), 0) / nutritionData.length;
      if (avgProtein < 100) {
        riskScore += 0.15;
        riskFactors.push({
          factor: "Low Protein Intake",
          severity: "medium",
          description: `Average protein intake is ${avgProtein.toFixed(0)}g`,
          recommendation: "Increase protein to 0.8-1g per lb of body weight",
        });
      }
    }

    const riskPercentage = Math.min(100, riskScore * 100);
    const riskLevel = riskPercentage < 25 ? "low" : riskPercentage < 50 ? "moderate" : riskPercentage < 75 ? "high" : "critical";

    return new Response(
      JSON.stringify({
        success: true,
        injury_risk_score: Math.round(riskPercentage * 10) / 10,
        risk_level: riskLevel,
        risk_factors: riskFactors,
        prediction_date: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error calculating injury risk:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to calculate injury risk" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

