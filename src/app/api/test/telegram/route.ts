import { NextRequest, NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { chatId, message } = body;

    const targetChatId =
      chatId || process.env.DEFAULT_TELEGRAM_CHAT_ID || "123456789";
    const content =
      message ||
      `🤖 *Second Brain x Hermes Agent Test*\n\nXin chào! Đây là tin nhắn kiểm tra kết nối từ hệ thống Dashboard Second Brain.\nThời gian: \`${new Date().toLocaleString("vi-VN")}\`\n\n_Hệ thống đã sẵn sàng gửi nhắc nhở tự động!_`;

    const res = await sendTelegramMessage({
      chatId: targetChatId,
      text: content,
      parseMode: "Markdown",
    });

    return NextResponse.json({
      success: res.success,
      simulated: res.simulated,
      messageId: res.messageId,
      details: res.details,
      error: res.error,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
