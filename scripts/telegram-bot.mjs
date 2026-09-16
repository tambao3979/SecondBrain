/**
 * Telegram Long-Polling Bot Runner for Second Brain
 * Run with: npm run bot
 * This allows receiving Telegram messages & images directly on localhost WITHOUT needing Ngrok or public HTTPS!
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

if (!botToken || botToken === "your_telegram_bot_token_here") {
  console.error("\n❌ CHƯA CÓ TELEGRAM_BOT_TOKEN!");
  console.error("Vui lòng mở file .env.local và điền TELEGRAM_BOT_TOKEN từ @BotFather.");
  console.error("Ví dụ: TELEGRAM_BOT_TOKEN=\"123456789:ABCdef...\"\n");
  process.exit(1);
}

console.log("\n=======================================================");
console.log("🤖 SECOND BRAIN TELEGRAM BOT RUNNER (Long-Polling)");
console.log("=======================================================");
console.log(`🔗 Webhook Target: ${appUrl}/api/telegram/webhook`);
console.log("⏳ Đang kết nối tới Telegram Bot API...");

let lastUpdateId = 0;

async function deleteWebhook() {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook`);
    const data = await res.json();
    if (data.ok) {
      console.log("✓ Đã chuyển sang chế độ Long-Polling (xóa webhook cũ nếu có).");
    }
  } catch (e) {
    console.warn("Cảnh báo khi xóa webhook:", e.message);
  }
}

async function pollUpdates() {
  try {
    const url = `https://api.telegram.org/bot${botToken}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.ok && Array.isArray(data.result)) {
      for (const update of data.result) {
        lastUpdateId = update.update_id;

        if (update.message) {
          const sender = update.message.from?.first_name || "User";
          const text = update.message.text || (update.message.photo ? "[Đã gửi ảnh]" : "[Dữ liệu khác]");
          console.log(`\n📩 Nhận tin từ [${sender}]: "${text}"`);

          // Forward to Next.js webhook endpoint
          try {
            const webhookRes = await fetch(`${appUrl}/api/telegram/webhook`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(update),
            });
            const webhookData = await webhookRes.json();
            const usedModel = webhookData?.agentResult?.used_model;
            console.log(`✓ Đã xử lý và đồng bộ vào Second Brain ${usedModel ? `[Model: ${usedModel}]` : ""}:`, webhookData?.agentResult?.reply_message || webhookData);
          } catch (err) {
            console.error(`❌ Lỗi gọi Next.js webhook (${appUrl}):`, err.message);
            console.log(`💡 Hãy đảm bảo Next.js đang chạy (npm run dev) tại ${appUrl}!`);

            // Gửi thông báo đến Telegram để người dùng biết server chưa bật thay vì im lặng
            const chatId = update.message.chat?.id;
            if (chatId) {
              try {
                await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    chat_id: chatId,
                    text: "⚠️ *Second Brain Webhook Chưa Khởi Động*\n\nServer Next.js chưa được khởi động trên máy tính (`http://localhost:3000`).\n\nVui lòng mở terminal và chạy lệnh:\n`npm run dev` (hoặc `npm run dev:all`)\nđể Second Brain xử lý tin nhắn của bạn!",
                    parse_mode: "Markdown",
                  }),
                });
              } catch (notifyErr) {
                // ignore
              }
            }
          }
        }
      }
    }
  } catch (err) {
    // Timeout or network glitch, retry
    if (!err.message?.includes("timeout")) {
      console.warn("Poll notice:", err.message);
    }
  }

  // Continue polling loop
  setTimeout(pollUpdates, 1000);
}

// Start
deleteWebhook().then(() => {
  console.log("🚀 BOT ĐÃ SẴN SÀNG! Bạn có thể mở Telegram trên điện thoại và nhắn tin cho Bot ngay bây giờ.");
  pollUpdates();
});
