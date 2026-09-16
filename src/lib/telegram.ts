export interface SendTelegramMessageOptions {
  chatId: string;
  text: string;
  parseMode?: "Markdown" | "HTML" | "MarkdownV2";
}

export interface TelegramResponse {
  success: boolean;
  simulated?: boolean;
  messageId?: number | string;
  error?: string;
  details?: unknown;
}

export async function sendTelegramMessage({
  chatId,
  text,
  parseMode = "Markdown",
}: SendTelegramMessageOptions): Promise<TelegramResponse> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  // If no bot token is configured yet, provide a clear simulated delivery response
  if (!botToken || botToken.trim() === "" || botToken === "your_telegram_bot_token_here") {
    console.log(`[Telegram Simulation] (No bot token configured) Sending to ${chatId}:`, text);
    return {
      success: true,
      simulated: true,
      messageId: `sim-${Date.now()}`,
      details: {
        note: "TELEGRAM_BOT_TOKEN chưa được cấu hình trong .env. Tin nhắn đã được mô phỏng thành công trên giao diện Dashboard.",
        chatId,
        content: text,
      },
    };
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      // If failed with Markdown formatting, retry once with plain text without formatting
      if (parseMode) {
        console.warn("[Telegram] Failed with parseMode, retrying as plain text...", data.description);
        const retryRes = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text,
          }),
        });
        const retryData = await retryRes.json();
        if (retryData.ok) {
          return {
            success: true,
            messageId: retryData.result?.message_id,
            details: retryData,
          };
        }
      }

      return {
        success: false,
        error: data.description || "Lỗi khi gọi Telegram API",
        details: data,
      };
    }

    return {
      success: true,
      messageId: data.result?.message_id,
      details: data,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("[Telegram Network Error]:", errorMessage);
    return {
      success: false,
      error: `Network error: ${errorMessage}`,
    };
  }
}
