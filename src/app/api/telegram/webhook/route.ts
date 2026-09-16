import { NextRequest, NextResponse } from "next/server";
import { processWithGeminiAgent, parseImageWithGemini } from "@/lib/gemini-parser";
import {
  createEventWithReminders,
  getEvents,
  cancelEvent,
  deleteEvent,
  toggleTaskStatus,
} from "@/lib/db-service";
import { scheduleReminder } from "@/lib/qstash";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
    const message = update.message;
    if (!message) {
      return NextResponse.json({ ok: true });
    }

    const chatId = String(message.chat.id);
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`}/api/webhooks/send-telegram`;

    // -------------------------------------------------------------
    // CASE 1: USER SENT A PHOTO (MULTIMODAL AI)
    // -------------------------------------------------------------
    if (message.photo && Array.isArray(message.photo) && message.photo.length > 0) {
      const highestResPhoto = message.photo[message.photo.length - 1];
      let caption = message.caption || "";
      if (message.reply_to_message?.text) {
        caption = `[Ngữ cảnh phản hồi: "${message.reply_to_message.text.trim()}"] ${caption}`.trim();
      }

      await sendTelegramMessage({
        chatId,
        text: "🔍 *Gemini AI đang phân tích hình ảnh của bạn...* Vui lòng đợi trong giây lát.",
        parseMode: "Markdown",
      });

      let imageBase64 = "";
      if (botToken) {
        try {
          const fileRes = await fetch(
            `https://api.telegram.org/bot${botToken}/getFile?file_id=${highestResPhoto.file_id}`
          );
          const fileData = await fileRes.json();
          if (fileData.ok && fileData.result?.file_path) {
            const downloadUrl = `https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`;
            const imgRes = await fetch(downloadUrl);
            const arrayBuffer = await imgRes.arrayBuffer();
            imageBase64 = Buffer.from(arrayBuffer).toString("base64");
          }
        } catch (e) {
          console.error("[Telegram Photo Download Error]:", e);
        }
      }

      const parsed = await parseImageWithGemini(imageBase64, "image/jpeg", caption);

      const remindersToSchedule: {
        remindAt: Date;
        isPreRemind: boolean;
        qstashMessageId?: string;
      }[] = [];

      if (parsed.startAt && Array.isArray(parsed.pre_reminders_minutes) && parsed.pre_reminders_minutes.length > 0) {
        const startDate = new Date(parsed.startAt);
        for (const mins of parsed.pre_reminders_minutes) {
          const remindTime = new Date(startDate.getTime() - mins * 60 * 1000);
          const qstashRes = await scheduleReminder({
            reminderId: `img_rem_${Date.now()}_${mins}`,
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

      await createEventWithReminders({
        telegram_chat_id: chatId,
        type: parsed.type || "NOTE",
        title: parsed.title || "Hình ảnh từ Telegram",
        formatted_content: parsed.formatted_content || "",
        startAt: parsed.startAt ? new Date(parsed.startAt) : null,
        endAt: parsed.endAt ? new Date(parsed.endAt) : null,
        reminders: remindersToSchedule,
      });

      const modelFooter = parsed.used_model ? `\n\n_⚡ Model: ${parsed.used_model}_` : "";
      const replyMsg = `📸 *Gemini Đã Phân Tích & Lưu Hình Ảnh!*\n\n📌 *Tiêu đề*: ${parsed.title}\n📂 *Phân loại*: ${parsed.type}\n\n${(parsed.formatted_content || "").substring(0, 800)}\n\n_— Đã lưu thành công vào Second Brain_${modelFooter}`;

      await sendTelegramMessage({
        chatId,
        text: replyMsg,
        parseMode: "Markdown",
      });

      return NextResponse.json({ ok: true });
    }

    // -------------------------------------------------------------
    // CASE 2: TEXT MESSAGE OR NATURAL CONVERSATION
    // -------------------------------------------------------------
    let userText = (message.text || "").trim();
    if (!userText) {
      return NextResponse.json({ ok: true });
    }

    // Hỗ trợ ngữ cảnh khi người dùng reply / trích dẫn tin nhắn cũ
    if (message.reply_to_message?.text) {
      const prevMessage = message.reply_to_message.text.trim();
      userText = `[Ngữ cảnh tin nhắn trước đó được phản hồi: "${prevMessage}"]\n\nYêu cầu hiện tại của người dùng: "${userText}"`;
    }

    // 1. Fetch current events from database to give Gemini context
    const existingEvents = await getEvents();

    // 2. Process with Conversational Agent (Gemini Cascade)
    const agentResult = await processWithGeminiAgent(userText, existingEvents);

    console.log(`[Telegram Agent] Intent: ${agentResult.action} (Model: ${agentResult.used_model || "fallback"}) for "${userText.substring(0, 50)}..."`);

    // 3. Execute the corresponding action
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
            reminderId: `tg_rem_${Date.now()}_${mins}`,
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

      await createEventWithReminders({
        telegram_chat_id: chatId,
        type: agentResult.type || "TASK",
        title: agentResult.title || userText,
        formatted_content: agentResult.formatted_content || userText,
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

    // 4. Send the intelligent AI response back to Telegram with model indicator
    const replyWithModel = agentResult.used_model
      ? `${agentResult.reply_message}\n\n_⚡ Model: ${agentResult.used_model}_`
      : agentResult.reply_message;

    await sendTelegramMessage({
      chatId,
      text: replyWithModel,
      parseMode: "Markdown",
    });

    return NextResponse.json({ ok: true, agentResult });
  } catch (error: unknown) {
    console.error("[Telegram Webhook Error]:", error);
    try {
      const update = await req.json().catch(() => null);
      const errChatId = update?.message?.chat?.id;
      if (errChatId) {
        await sendTelegramMessage({
          chatId: String(errChatId),
          text: "⚠️ *Đã xảy ra lỗi khi xử lý tin nhắn của bạn.* Vui lòng thử lại sau vài giây!",
          parseMode: "Markdown",
        }).catch(() => {});
      }
    } catch {
      // ignore
    }
    return NextResponse.json({ ok: true });
  }
}
