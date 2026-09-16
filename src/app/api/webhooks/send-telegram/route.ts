import { NextRequest, NextResponse } from "next/server";
import { findReminderById, markReminderSent } from "@/lib/db-service";
import { sendTelegramMessage } from "@/lib/telegram";
import { verifyQStashSignature } from "@/lib/qstash";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("upstash-signature");

    // 1. Verify QStash signature
    const isValid = await verifyQStashSignature(signature, rawBody);
    if (!isValid) {
      console.warn("[Webhook] Invalid QStash signature received");
      return NextResponse.json(
        { success: false, error: "Invalid QStash signature" },
        { status: 401 }
      );
    }

    // 2. Parse body
    let body: { reminderId?: string; eventId?: string; customMessage?: string };
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { reminderId } = body;
    if (!reminderId) {
      return NextResponse.json(
        { success: false, error: "Missing reminderId in payload" },
        { status: 400 }
      );
    }

    // 3. Find reminder and event
    const reminder = await findReminderById(reminderId);
    if (!reminder) {
      console.log(`[Webhook] Reminder ${reminderId} not found, ignoring`);
      return NextResponse.json({
        success: true,
        message: "Reminder not found, skipped",
      });
    }

    // 4. Idempotency & status check
    // If Event or Reminder is CANCELLED or already SENT -> Skip!
    if (reminder.status === "CANCELLED" || reminder.event.status === "CANCELLED") {
      console.log(`[Webhook] Event or Reminder is CANCELLED. Skipping send.`);
      return NextResponse.json({
        success: true,
        message: "Reminder or Event is CANCELLED, notification aborted",
      });
    }

    if (reminder.status === "SENT") {
      console.log(`[Webhook] Reminder ${reminderId} was already sent, skipping duplicate.`);
      return NextResponse.json({
        success: true,
        message: "Reminder already sent (idempotent skip)",
      });
    }

    // 5. Send message via Telegram
    const chatId = reminder.event.user.telegram_chat_id || process.env.DEFAULT_TELEGRAM_CHAT_ID;
    if (!chatId) {
      console.warn(`[Webhook] No telegram_chat_id found for user ${reminder.event.user.id}`);
      return NextResponse.json({
        success: false,
        error: "User has no Telegram chat ID configured",
      });
    }

    const prefix = reminder.isPreRemind
      ? `⏳ **[NHẮC TRƯỚC]**\n`
      : `🔔 **[THÔNG BÁO TỚI GIỜ]**\n`;

    const telegramContent = `${prefix}**${reminder.event.title}**\n\n${reminder.event.formatted_content}\n\n_— Gửi tự động từ Second Brain Hermes Agent_`;

    const tgResult = await sendTelegramMessage({
      chatId,
      text: telegramContent,
      parseMode: "Markdown",
    });

    // 6. Update database status
    await markReminderSent(reminder.id, reminder.eventId);

    return NextResponse.json({
      success: true,
      message: "Telegram notification sent successfully",
      telegramResult: tgResult,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Webhook Error]:", message);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error in Webhook",
        details: message,
      },
      { status: 500 }
    );
  }
}
