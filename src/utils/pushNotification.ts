export interface PushNotificationPayload {
  to: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: "default" | null;
  priority?: "default" | "high" | "normal";
}

export async function sendPushNotification(payload: PushNotificationPayload) {
  try {
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_SUPABASE_FUNCTION_URL}/sendPushNotification`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Supabase function error: ${text}`);
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error("Failed to send push notification:", err);
    throw err;
  }
}
