import { NextRequest, NextResponse } from "next/server";
import { processWithGeminiAgent } from "@/lib/gemini-parser";
import {
  createEventWithReminders,
  getEvents,
  deleteEvent,
  cancelEvent,
  toggleTaskStatus,
} from "@/lib/db-service";
import { scheduleReminder } from "@/lib/qstash";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, telegram_chat_id } = body;

    if (!text || typeof text !== "string" || text.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Missing 'text' in request body" },
        { status: 400 }
      );
    }

    const targetChatId =
      telegram_chat_id || process.env.DEFAULT_TELEGRAM_CHAT_ID || "123456789";

    // 1. Fetch current events for context
    const existingEvents = await getEvents();

    // 2. Process with Gemini Agent
    const agentResult = await processWithGeminiAgent(text, existingEvents);

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`}/api/webhooks/send-telegram`;

    let eventResult: any = null;

    if (agentResult.action === "CREATE") {
      const remindersToSchedule: {
        remindAt: Date;
        isPreRemind: boolean;
        qstashMessageId?: string;
      }[] = [];

      if (agentResult.startAt && Array.isArray(agentResult.pre_reminders_minutes) && agentResult.pre_reminders_minutes.length > 0) {
        const startDate = new Date(agentResult.startAt);
        for (const mins of agentResult.pre_reminders_minutes) {
          const remindTime = new Date(startDate.getTime() - mins * 60 * 1000);
          const qstashRes = await scheduleReminder({
            reminderId: `ai_rem_${Date.now()}_${mins}`,
            remindAt: remindTime,
            destinationUrl: webhookUrl,
          });

          remindersToSchedule.push({
            remindAt: remindTime,
            isPreRemind: mins > 0,
            qstashMessageId: qstashRes.messageId,
          });
        }
      }

      eventResult = await createEventWithReminders({
        telegram_chat_id: targetChatId,
        type: agentResult.type || "TASK",
        title: agentResult.title || text,
        formatted_content: agentResult.formatted_content || text,
        startAt: agentResult.startAt ? new Date(agentResult.startAt) : null,
        endAt: agentResult.endAt ? new Date(agentResult.endAt) : null,
        reminders: remindersToSchedule,
      });
    } else if (agentResult.action === "DELETE" || agentResult.action === "CANCEL") {
      const ids = agentResult.target_event_ids || [];
      for (const id of ids) {
        if (agentResult.action === "DELETE") {
          await deleteEvent(id);
        } else {
          await cancelEvent(id);
        }
      }
    } else if (agentResult.action === "COMPLETE") {
      const ids = agentResult.target_event_ids || [];
      for (const id of ids) {
        await toggleTaskStatus(id);
      }
    }

    return NextResponse.json({
      success: true,
      message: agentResult.reply_message,
      agentResult,
      event: eventResult,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[AI Parse API Error]:", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
