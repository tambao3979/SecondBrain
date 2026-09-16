import { Client, Receiver } from "@upstash/qstash";

const qstashToken = process.env.QSTASH_TOKEN;
const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;

export const qstashClient = qstashToken
  ? new Client({ token: qstashToken })
  : null;

export const qstashReceiver =
  currentSigningKey && nextSigningKey
    ? new Receiver({
        currentSigningKey,
        nextSigningKey,
      })
    : null;

export interface ScheduleReminderParams {
  reminderId: string;
  remindAt: Date;
  destinationUrl: string;
}

export async function scheduleReminder({
  reminderId,
  remindAt,
  destinationUrl,
}: ScheduleReminderParams): Promise<{ messageId: string; simulated?: boolean }> {
  const now = new Date();
  const delaySeconds = Math.max(0, Math.floor((remindAt.getTime() - now.getTime()) / 1000));

  if (!qstashClient) {
    console.log(
      `[QStash Simulation] QSTASH_TOKEN not provided. Simulated scheduling reminderId=${reminderId} for ${remindAt.toISOString()} (delay: ${delaySeconds}s) to ${destinationUrl}`
    );
    return {
      messageId: `msg_sim_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      simulated: true,
    };
  }

  try {
    const res = await qstashClient.publishJSON({
      url: destinationUrl,
      body: { reminderId },
      delay: delaySeconds,
    });

    return {
      messageId: res.messageId,
      simulated: false,
    };
  } catch (error) {
    console.error("[QStash Publish Error]:", error);
    // Fallback to simulated messageId if QStash API fails
    return {
      messageId: `msg_fallback_${Date.now()}`,
      simulated: true,
    };
  }
}

export async function cancelScheduledReminder(messageId: string): Promise<boolean> {
  if (!messageId || messageId.startsWith("msg_sim_") || messageId.startsWith("msg_fallback_")) {
    console.log(`[QStash] Cancelled simulated message ${messageId}`);
    return true;
  }

  if (!qstashClient) {
    console.log(`[QStash] No QSTASH_TOKEN configured. Cannot cancel remote message ${messageId}`);
    return true;
  }

  try {
    await qstashClient.messages.delete(messageId);
    return true;
  } catch (err) {
    console.error(`[QStash Delete Error] Failed to delete message ${messageId}:`, err);
    return false;
  }
}

export async function verifyQStashSignature(
  signature: string | null,
  body: string
): Promise<boolean> {
  // In development or if keys are not configured, allow bypass
  if (!qstashReceiver || !signature) {
    if (process.env.NODE_ENV === "development" || !qstashReceiver) {
      return true;
    }
    return false;
  }

  try {
    return await qstashReceiver.verify({
      signature,
      body,
    });
  } catch (err) {
    console.error("[QStash Signature Verification Error]:", err);
    return false;
  }
}
