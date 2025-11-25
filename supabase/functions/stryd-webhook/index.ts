import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { hmacSha256 } from "https://deno.land/std@0.208.0/crypto/mod.ts";

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
    const strydWebhookSecret = Deno.env.get("STRYD_WEBHOOK_SECRET");

    if (!supabaseUrl || !supabaseKey || !strydWebhookSecret) {
      throw new Error("Missing environment variables");
    }

    // Verify webhook signature
    const signature = req.headers.get("x-stryd-signature");
    const body = await req.text();
    
    if (!verifySignature(body, signature, strydWebhookSecret)) {
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const data = JSON.parse(body);

    // Process power data
    const powerData = {
      user_id: data.user_id,
      activity_id: data.activity_id,
      power_avg: data.power_avg,
      power_max: data.power_max,
      power_normalized: data.power_normalized,
      cadence_avg: data.cadence_avg,
      ground_contact_time: data.ground_contact_time,
      vertical_oscillation: data.vertical_oscillation,
      leg_spring_stiffness: data.leg_spring_stiffness,
      duration_minutes: data.duration_minutes,
      distance_km: data.distance_km,
      timestamp: data.timestamp,
      created_at: new Date().toISOString(),
    };

    // Store power data
    await supabase.from("stryd_power_data").insert([powerData]);

    // Calculate and store running mechanics analysis
    const mechanics = analyzeRunningMechanics(data);
    await supabase.from("running_mechanics").insert([
      {
        user_id: data.user_id,
        activity_id: data.activity_id,
        ...mechanics,
        created_at: new Date().toISOString(),
      },
    ]);

    return new Response(
      JSON.stringify({
        success: true,
        activity_id: data.activity_id,
        processed_at: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing Stryd webhook:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to process webhook" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function verifySignature(body: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBytes = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
    const computedSignature = Array.from(new Uint8Array(signatureBytes))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return computedSignature === signature;
  } catch (error) {
    console.error("Error verifying signature:", error);
    return false;
  }
}

function analyzeRunningMechanics(data: any): any {
  const gct = data.ground_contact_time || 0;
  const vo = data.vertical_oscillation || 0;
  const cadence = data.cadence_avg || 0;

  const analysis: any = {
    ground_contact_time: gct,
    vertical_oscillation: vo,
    cadence: cadence,
    efficiency_score: calculateEfficiency(data),
    form_assessment: assessForm(gct, vo, cadence),
  };

  return analysis;
}

function calculateEfficiency(data: any): number {
  const power = data.power_avg || 0;
  const pace = data.pace_avg || 1;
  const efficiency = power / pace;

  // Normalize to 0-100 scale
  return Math.min(100, Math.max(0, 100 - efficiency * 10));
}

function assessForm(gct: number, vo: number, cadence: number): string {
  const issues: string[] = [];

  if (gct > 300) {
    issues.push("High ground contact time - increase cadence");
  }
  if (vo > 10) {
    issues.push("High vertical oscillation - improve form");
  }
  if (cadence < 160) {
    issues.push("Low cadence - aim for 170-180 steps/min");
  }

  if (issues.length === 0) {
    return "Excellent form";
  }

  return issues.join(" | ");
}

