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
    const {
      user_id,
      date,
      calories,
      protein_g,
      carbs_g,
      fat_g,
      fiber_g,
      sugar_g,
      sodium_mg,
      water_ml,
      notes,
    } = await req.json();

    // Validate required fields
    if (!user_id || !date || !calories || !protein_g || !carbs_g || !fat_g) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: user_id, date, calories, protein_g, carbs_g, fat_g",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Prepare nutrition entry
    const nutritionEntry = {
      user_id,
      date,
      calories,
      protein_g,
      carbs_g,
      fat_g,
      fiber_g: fiber_g || 0,
      sugar_g: sugar_g || 0,
      sodium_mg: sodium_mg || 0,
      water_ml: water_ml || 0,
      source: "manual",
      source_priority: 100,
      notes: notes || null,
      created_at: new Date().toISOString(),
    };

    // Upsert nutrition data (replace if exists for this date)
    const { data, error } = await supabase
      .from("daily_nutrition_summary")
      .upsert(nutritionEntry, {
        onConflict: "user_id,date",
      })
      .select();

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        nutrition_id: data?.[0]?.id,
        entry: data?.[0],
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error logging nutrition:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to log nutrition",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

