import { NextRequest, NextResponse } from "next/server";
import { getEvents, createEventWithReminders } from "@/lib/db-service";
import { scheduleReminder } from "@/lib/qstash";
import { EventType, Status } from "@/lib/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") as EventType | null;
    const status = searchParams.get("status") as Status | null;
    const search = searchParams.get("search") || undefined;

    const events = await getEvents({
      type: type || undefined,
      status: status || undefined,
      search,
    });

    return NextResponse.json({ success: true, events });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      type = "TASK",
      formatted_content,
      startAt,
      endAt,
      telegram_chat_id,
      pre_reminders_minutes,
    } = body;

    if (!title) {
      return NextResponse.json(
        { success: false, error: "Title is required" },
        { status: 400 }
      );
    }

    const startDate = startAt ? new Date(startAt) : null;
    const endDate = endAt ? new Date(endAt) : null;

    const remindersToSchedule: {
      remindAt: Date;
      isPreRemind: boolean;
      qstashMessageId?: string;
    }[] = [];

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`}/api/webhooks/send-telegram`;

    if (startDate && Array.isArray(pre_reminders_minutes)) {
      for (const mins of pre_reminders_minutes) {
        const remindTime = new Date(startDate.getTime() - mins * 60 * 1000);
        const qstashRes = await scheduleReminder({
          reminderId: `temp-${Date.now()}`,
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

    const event = await createEventWithReminders({
      title,
      type,
      formatted_content: formatted_content || "",
      startAt: startDate,
      endAt: endDate,
      telegram_chat_id,
      reminders: remindersToSchedule,
    });

    return NextResponse.json({ success: true, event });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
