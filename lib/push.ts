import webpush, { type PushSubscription } from "web-push";
import { supabaseAdmin } from "@/lib/supabaseServer";

function setupWebPush() {
  const publicKey = process.env.VAPID_PUBLIC_KEY || "";
  const privateKey = process.env.VAPID_PRIVATE_KEY || "";
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

  if (!publicKey || !privateKey) throw new Error("Missing VAPID keys in env");

  webpush.setVapidDetails(subject, publicKey, privateKey);
}

type PushRow = {
  id: string;
  subscription: PushSubscription;
};

export async function sendAdminPush(payload: { title: string; body: string; url?: string }) {
  setupWebPush();

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("push_subscriptions")
    .select("id, subscription")
    .eq("user_type", "admin");

  if (error || !data || data.length === 0) return;

  const rows = data as unknown as PushRow[];

  await Promise.all(
    rows.map(async (row) => {
      try {
        await webpush.sendNotification(row.subscription, JSON.stringify(payload));
      } catch {
        // optional: delete invalid subscription
      }
    })
  );
}