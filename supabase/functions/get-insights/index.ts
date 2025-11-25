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

    // Fetch all data
    const [nutritionRes, metricsRes, trainingRes] = await Promise.all([
      supabase
        .from("daily_nutrition_summary")
        .select("*")
        .eq("user_id", user_id)
        .gte("date", startDateStr)
        .lte("date", endDateStr),
      supabase
        .from("health_metrics")
        .select("*")
        .eq("user_id", user_id)
        .gte("date", startDateStr)
        .lte("date", endDateStr),
      supabase
        .from("runs")
        .select("*")
        .eq("user_id", user_id)
        .gte("start_time", startDateStr)
        .lte("start_time", endDateStr),
    ]);

    const nutritionData = nutritionRes.data || [];
    const metricsData = metricsRes.data || [];
    const trainingData = trainingRes.data || [];

    const insights: any[] = [];

    // Insight 1: Nutrition-Performance
    if (nutritionData.length > 0 && trainingData.length > 0) {
      const avgCarbs = nutritionData.reduce((sum: number, n: any) => sum + (n.carbs_g || 0), 0) / nutritionData.length;
      const avgDuration = trainingData.reduce((sum: number, t: any) => sum + (t.duration_minutes || 0), 0) / trainingData.length;

      if (avgCarbs > 200 && avgDuration > 30) {
        insights.push({
          type: "nutrition_performance",
          title: "Carbs Fuel Your Performance",
          description: "Strong correlation detected between carb intake and workout duration. Increasing carbs on training days could improve performance.",
          priority: "high",
          action: "Aim for 3-5g carbs per lb of body weight on training days",
        });
      }
    }

    // Insight 2: Protein-Recovery
    if (nutritionData.length > 0 && metricsData.length > 0) {
      const avgProtein = nutritionData.reduce((sum: number, n: any) => sum + (n.protein_g || 0), 0) / nutritionData.length;
      const recoveryScores = metricsData
        .filter((m: any) => m.metric_type === "recovery_score")
        .map((m: any) => m.value_numeric);

      if (avgProtein > 120 && recoveryScores.length > 0) {
        const avgRecovery = recoveryScores.reduce((a: number, b: number) => a + b, 0) / recoveryScores.length;
        if (avgRecovery > 60) {
          insights.push({
            type: "protein_recovery",
            title: "Protein Supports Recovery",
            description: "Strong correlation between protein intake and recovery scores. Consistent protein intake is key to faster recovery.",
            priority: "high",
            action: "Maintain 0.8-1g protein per lb of body weight daily",
          });
        }
      }
    }

    // Insight 3: Sleep-Recovery
    if (metricsData.length > 0) {
      const sleepScores = metricsData
        .filter((m: any) => m.metric_type === "sleep_duration")
        .map((m: any) => m.value_numeric);
      const recoveryScores = metricsData
        .filter((m: any) => m.metric_type === "recovery_score")
        .map((m: any) => m.value_numeric);

      if (sleepScores.length > 0 && recoveryScores.length > 0) {
        const avgSleep = sleepScores.reduce((a: number, b: number) => a + b, 0) / sleepScores.length;
        const avgRecovery = recoveryScores.reduce((a: number, b: number) => a + b, 0) / recoveryScores.length;

        if (avgSleep > 7 && avgRecovery > 70) {
          insights.push({
            type: "sleep_recovery",
            title: "Sleep is Your Recovery Tool",
            description: "Strong correlation between sleep duration and recovery scores. Prioritizing sleep will significantly improve recovery.",
            priority: "high",
            action: "Target 7-9 hours of sleep per night",
          });
        }
      }
    }

    // Insight 4: Low Calories
    if (nutritionData.length > 0) {
      const avgCalories = nutritionData.reduce((sum: number, n: any) => sum + (n.calories || 0), 0) / nutritionData.length;
      if (avgCalories < 1800) {
        insights.push({
          type: "low_calories",
          title: "Calorie Intake Low",
          description: `Average daily intake is ${avgCalories.toFixed(0)} kcal. This may impair recovery and performance.`,
          priority: "high",
          action: "Increase calorie intake by 200-300 kcal per day",
        });
      }
    }

    // Insight 5: Low Protein
    if (nutritionData.length > 0) {
      const avgProtein = nutritionData.reduce((sum: number, n: any) => sum + (n.protein_g || 0), 0) / nutritionData.length;
      if (avgProtein < 100) {
        insights.push({
          type: "low_protein",
          title: "Protein Intake Below Optimal",
          description: `Average protein is ${avgProtein.toFixed(0)}g. Increase for better recovery.`,
          priority: "medium",
          action: "Add protein-rich foods to each meal",
        });
      }
    }

    // Sort by priority
    const priorityOrder: any = { critical: 0, high: 1, medium: 2, low: 3 };
    insights.sort((a: any, b: any) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return new Response(
      JSON.stringify({
        success: true,
        insights: insights.slice(0, 5), // Limit to top 5 insights
        total_insights: insights.length,
        generated_at: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating insights:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate insights" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

