import { NextRequest, NextResponse } from "next/server";
import { createEventWithReminders } from "@/lib/db-service";
import { scheduleReminder } from "@/lib/qstash";
import { EventType } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      type = "MEETING",
      title = "Họp chiến lược Hermes Agent x Second Brain",
      formatted_content = "🚨 **Cuộc họp gấp**: Đánh giá hiệu quả kiến trúc tự động hóa QStash và Telegram Bot.\n\n- Chuẩn bị báo cáo tiến độ\n- Thảo luận nâng cấp AI memory",
      minutes_from_now = 30,
      pre_reminders = [15, 0],
      telegram_chat_id = "123456789",
    } = body;

    const startAt = new Date(Date.now() + minutes_from_now * 60 * 1000);
    const endAt = new Date(startAt.getTime() + 60 * 60 * 1000);

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`}/api/webhooks/send-telegram`;

    const remindersToSchedule: {
      remindAt: Date;
      isPreRemind: boolean;
      qstashMessageId?: string;
    }[] = [];

    for (const mins of pre_reminders) {
      const remindTime = new Date(startAt.getTime() - mins * 60 * 1000);
      const qstashRes = await scheduleReminder({
        reminderId: `sim_rem_${Date.now()}_${mins}`,
        remindAt: remindTime,
        destinationUrl: webhookUrl,
      });

      remindersToSchedule.push({
        remindAt: remindTime,
        isPreRemind: mins > 0,
        qstashMessageId: qstashRes.messageId,
      });
    }

    const event = await createEventWithReminders({
      telegram_chat_id,
      type: type as EventType,
      title,
      formatted_content,
      startAt,
      endAt,
      reminders: remindersToSchedule,
    });

    return NextResponse.json({
      success: true,
      message: `Hermes Agent simulated event "${title}" successfully dispatched!`,
      event,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
