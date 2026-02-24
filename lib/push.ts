import webpush from "web-push";
import { supabaseAdmin } from "@/lib/supabaseServer";

let vapidReady = false;

function setupWebPush() {
  if (vapidReady) return;

  const publicKey = (process.env.VAPID_PUBLIC_KEY || "").trim();
  const privateKey = (process.env.VAPID_PRIVATE_KEY || "").trim();
  const subject = (process.env.VAPID_SUBJECT || "mailto:admin@example.com").trim();

  if (!publicKey || !privateKey) {
    throw new Error("Missing VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY");
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidReady = true;
}

type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

export async function sendAdminPush(payload: PushPayload) {
  try {
    setupWebPush();

    const db = supabaseAdmin();

    // Load all admin subscriptions
    const { data: subs, error } = await db
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_role", "admin");

    if (error || !subs || subs.length === 0) return;

    const message = JSON.stringify(payload);

    await Promise.all(
      subs.map(async (row) => {
        const subscription = {
          endpoint: row.endpoint,
          keys: {
            p256dh: row.p256dh,
            auth: row.auth,
          },
        };

        try {
          await webpush.sendNotification(subscription as any, message);
        } catch (err: any) {
          // 🚨 Clean up invalid subscriptions (expired / revoked)
          if (err?.statusCode === 404 || err?.statusCode === 410) {
            await db.from("push_subscriptions").delete().eq("id", row.id);
          }
        }
      })
    );
  } catch {
    // Never throw — push must not break app flow
  }
}