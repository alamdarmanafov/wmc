// Supabase Edge Function: send-push
// Triggered by a Database Webhook on INSERT into public.notifications.
// Looks up the recipient's Expo push token (profile_private) and their
// notification preferences, then calls the Expo Push API.
//
// Setup:
//   supabase functions deploy send-push --no-verify-jwt
//   Dashboard → Database → Webhooks → table: notifications, event: INSERT,
//   URL: https://<project>.functions.supabase.co/send-push
//   Header: Authorization: Bearer <WEBHOOK_SECRET>  (set WEBHOOK_SECRET in function secrets)

import { createClient } from "npm:@supabase/supabase-js@2";

type NotificationRow = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown>;
};

const PREF_BY_TYPE: Record<string, string> = {
  connection_request: "connections",
  connection_accepted: "connections",
  event_joined: "events",
  event_reminder: "events",
  activity_joined: "activities",
  new_community: "communities",
  nearby_people: "nearby",
  message: "messages",
  system: "system",
};

Deno.serve(async (req) => {
  const secret = Deno.env.get("WEBHOOK_SECRET");
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("unauthorized", { status: 401 });
  }

  const payload = await req.json();
  const row = payload.record as NotificationRow | undefined;
  if (!row) return new Response("no record", { status: 400 });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const [{ data: priv }, { data: profile }] = await Promise.all([
    supabase.from("profile_private").select("push_token").eq("user_id", row.user_id).maybeSingle(),
    supabase.from("profiles").select("notification_prefs, status").eq("id", row.user_id).maybeSingle(),
  ]);

  const token = priv?.push_token;
  if (!token || !token.startsWith("ExponentPushToken")) return new Response("no token", { status: 200 });
  if (profile?.status !== "active") return new Response("inactive user", { status: 200 });

  const prefKey = PREF_BY_TYPE[row.type];
  const prefs = (profile?.notification_prefs ?? {}) as Record<string, boolean>;
  if (prefKey && prefKey !== "system" && prefs[prefKey] === false) {
    return new Response("muted by preference", { status: 200 });
  }

  const res = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      to: token,
      title: row.title,
      body: row.body ?? undefined,
      data: { ...row.data, type: row.type, notification_id: row.id },
      sound: "default",
    }),
  });

  const result = await res.json();
  // Expo returns DeviceNotRegistered when the token is stale → clear it.
  if (result?.data?.details?.error === "DeviceNotRegistered") {
    await supabase.from("profile_private").update({ push_token: null }).eq("user_id", row.user_id);
  }
  return new Response(JSON.stringify(result), { headers: { "content-type": "application/json" } });
});
