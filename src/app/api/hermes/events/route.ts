import { NextRequest, NextResponse } from "next/server";
import { createEventWithReminders } from "@/lib/db-service";
import { scheduleReminder } from "@/lib/qstash";
import { EventType } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-api-key");
    const configuredKey = process.env.HERMES_API_KEY || "hermes-secret-api-key-2026";

    // 1. Verify API Key
    if (!apiKey || apiKey !== configuredKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Invalid or missing x-api-key header",
        },
        { status: 401 }
      );
    }

    // 2. Parse payload
    const body = await req.json();
    const {
      telegram_chat_id,
      type = "TASK",
      title,
      formatted_content,
      start_at,
      end_at,
      pre_reminders_minutes,
    } = body;

    if (!title || !formatted_content) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: title and formatted_content are mandatory",
        },
        { status: 400 }
      );
    }

    const startAt = start_at ? new Date(start_at) : null;
    const endAt = end_at ? new Date(end_at) : null;

    // 3. Calculate Reminders
    const remindersToSchedule: {
      remindAt: Date;
      isPreRemind: boolean;
      qstashMessageId?: string;
    }[] = [];

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`}/api/webhooks/send-telegram`;

    if (startAt && Array.isArray(pre_reminders_minutes) && pre_reminders_minutes.length > 0) {
      for (const mins of pre_reminders_minutes) {
        const remindTime = new Date(startAt.getTime() - mins * 60 * 1000);
        // Only schedule future reminders or immediate
        const isPre = mins > 0;
        remindersToSchedule.push({
          remindAt: remindTime,
          isPreRemind: isPre,
        });
      }
    }

    // Schedule each reminder via QStash
    for (let i = 0; i < remindersToSchedule.length; i++) {
      const r = remindersToSchedule[i];
      const tempId = `rem_pending_${Date.now()}_${i}`;
      const qstashRes = await scheduleReminder({
        reminderId: tempId,
        remindAt: r.remindAt,
        destinationUrl: webhookUrl,
      });
      r.qstashMessageId = qstashRes.messageId;
    }

    // 4. Save Event & Reminders in DB
    const event = await createEventWithReminders({
      telegram_chat_id: telegram_chat_id || undefined,
      type: type as EventType,
      title,
      formatted_content,
      startAt,
      endAt,
      reminders: remindersToSchedule,
    });

    return NextResponse.json({
      success: true,
      message: "Event and scheduled reminders created successfully by Hermes Agent",
      event,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Hermes API Error]:", message);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        details: message,
      },
      { status: 500 }
    );
  }
}
