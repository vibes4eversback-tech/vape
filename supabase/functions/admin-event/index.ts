import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const allowed = new Set(["mini", "abuse", "countdown", "background", "dismiss", "announcement"]);
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return Response.json({ error: "POST required" }, { status: 405, headers: cors });
  try {
    const { pin, type, payload = {} } = await req.json();
    if (pin !== "030813") return Response.json({ error: "Invalid admin PIN" }, { status: 401, headers: cors });
    if (!allowed.has(type)) return Response.json({ error: "Unsupported event type" }, { status: 400, headers: cors });
    const url = Deno.env.get("SUPABASE_URL"), key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return Response.json({ error: "Server database credentials are missing" }, { status: 500, headers: cors });
    const db = createClient(url, key);
    const { data, error } = await db.from("site_events").insert({ event_type: type, payload }).select("id,created_at").single();
    if (error) throw error;
    return Response.json({ ok: true, event: data }, { headers: cors });
  } catch (e) {
    console.error(e);
    return Response.json({ error: e instanceof Error ? e.message : "Unexpected error" }, { status: 500, headers: cors });
  }
});
