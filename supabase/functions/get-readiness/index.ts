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

    // Fetch recovery metrics
    const { data: metricsData } = await supabase
      .from("health_metrics")
      .select("*")
      .eq("user_id", user_id)
      .in("metric_type", ["recovery_score", "sleep_duration", "hrv"])
      .gte("date", startDateStr)
      .lte("date", endDateStr)
      .order("date");

    // Fetch nutrition data
    const { data: nutritionData } = await supabase
      .from("daily_nutrition_summary")
      .select("*")
      .eq("user_id", user_id)
      .gte("date", startDateStr)
      .lte("date", endDateStr)
      .order("date");

    let readinessScore = 50;
    const performanceFactors: any[] = [];

    // Factor 1: Recovery score (last 3 days)
    if (metricsData && metricsData.length > 0) {
      const recoveryScores = metricsData
        .filter((m: any) => m.metric_type === "recovery_score")
        .slice(0, 3)
        .map((m: any) => m.value_numeric);

      if (recoveryScores.length > 0) {
        const avgRecovery = recoveryScores.reduce((a: number, b: number) => a + b, 0) / recoveryScores.length;
        readinessScore += (avgRecovery - 50) * 0.3;
        performanceFactors.push({
          factor: "Recovery Status",
          value: avgRecovery.toFixed(0),
          impact: avgRecovery > 60 ? "positive" : "negative",
        });
      }

      // Factor 2: Sleep quality
      const sleepScores = metricsData
        .filter((m: any) => m.metric_type === "sleep_duration")
        .slice(0, 3)
        .map((m: any) => m.value_numeric);

      if (sleepScores.length > 0) {
        const avgSleep = sleepScores.reduce((a: number, b: number) => a + b, 0) / sleepScores.length;
        const sleepImpact = (avgSleep - 7) * 5;
        readinessScore += sleepImpact * 0.2;
        performanceFactors.push({
          factor: "Sleep Quality",
          value: avgSleep.toFixed(1),
          impact: avgSleep >= 7 ? "positive" : "negative",
        });
      }

      // Factor 3: HRV
      const hrvScores = metricsData
        .filter((m: any) => m.metric_type === "hrv")
        .slice(0, 3)
        .map((m: any) => m.value_numeric);

      if (hrvScores.length > 0) {
        const avgHrv = hrvScores.reduce((a: number, b: number) => a + b, 0) / hrvScores.length;
        const hrvImpact = (avgHrv - 50) * 0.2;
        readinessScore += hrvImpact * 0.15;
        performanceFactors.push({
          factor: "HRV Status",
          value: avgHrv.toFixed(0),
          impact: avgHrv > 50 ? "positive" : "negative",
        });
      }
    }

    // Factor 4: Nutrition adequacy
    if (nutritionData && nutritionData.length > 0) {
      const recentNutrition = nutritionData.slice(0, 3);
      const avgCalories = recentNutrition.reduce((sum: number, n: any) => sum + (n.calories || 0), 0) / recentNutrition.length;
      const avgProtein = recentNutrition.reduce((sum: number, n: any) => sum + (n.protein_g || 0), 0) / recentNutrition.length;

      let nutritionScore = 0;
      if (avgCalories > 2000) nutritionScore += 15;
      if (avgProtein > 100) nutritionScore += 15;

      readinessScore += nutritionScore * 0.15;
      performanceFactors.push({
        factor: "Nutrition Status",
        value: `${avgCalories.toFixed(0)} kcal, ${avgProtein.toFixed(0)}g protein`,
        impact: nutritionScore > 20 ? "positive" : "neutral",
      });
    }

    readinessScore = Math.max(0, Math.min(100, readinessScore));

    const readinessLevel =
      readinessScore < 30 ? "poor" : readinessScore < 50 ? "fair" : readinessScore < 70 ? "good" : "excellent";

    let recommendation = "You're ready for a high-intensity workout!";
    if (readinessScore < 30) {
      recommendation = "Rest day recommended. Focus on recovery.";
    } else if (readinessScore < 50) {
      recommendation = "Light activity recommended. Avoid high intensity.";
    } else if (readinessScore < 70) {
      recommendation = "Moderate intensity workout is appropriate.";
    }

    return new Response(
      JSON.stringify({
        success: true,
        readiness_score: Math.round(readinessScore * 10) / 10,
        readiness_level: readinessLevel,
        performance_factors: performanceFactors,
        recommendation,
        prediction_date: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error calculating readiness:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to calculate readiness" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

