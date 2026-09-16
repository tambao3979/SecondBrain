import { GoogleGenerativeAI } from "@google/generative-ai";
import { EventItem, EventType } from "./types";

export type AgentAction =
  | "CREATE"
  | "DELETE"
  | "CANCEL"
  | "COMPLETE"
  | "QUERY"
  | "CHAT";

export interface AgentResult {
  action: AgentAction;
  reply_message: string;
  type?: EventType;
  title?: string;
  formatted_content?: string;
  startAt?: string | null; // ISO-8601 UTC or with offset
  endAt?: string | null;
  pre_reminders_minutes?: number[];
  target_event_ids?: string[];
  used_model?: string;
}

// Ưu tiên model mạnh nhất đầu tiên, tự động chuyển model tiếp theo khi gặp rate limit (429), quá tải (503), hoặc lỗi
export const GEMINI_MODEL_CASCADE = [
  "gemini-3.1-pro-preview",
  "gemini-pro-latest",
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3-flash-preview",
  "gemini-3.5-flash-lite",
  "gemini-flash-lite-latest",
];

function cleanJsonResponse(raw: string): string {
  let text = raw.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  return text.trim();
}

function getVnTimeInfo() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    weekday: "long",
  });
  return {
    now,
    vnTimeStr: formatter.format(now),
    isoStr: now.toISOString(),
  };
}

export async function processWithGeminiAgent(
  userText: string,
  existingEvents: EventItem[] = []
): Promise<AgentResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  const { now, vnTimeStr, isoStr } = getVnTimeInfo();

  // Create a clean summary of existing items in the database for the AI context
  const activeEventsContext = existingEvents
    .slice(0, 20)
    .map((e) => ({
      id: e.id,
      type: e.type,
      title: e.title,
      status: e.status,
      startAt: e.startAt,
    }));

  if (apiKey && apiKey.trim() !== "" && apiKey !== "your_gemini_api_key_here") {
    const genAI = new GoogleGenerativeAI(apiKey);

    const prompt = `
Bạn là Bộ Não AI điều hành hệ thống "Second Brain" (giao tiếp với người dùng qua Telegram tiếng Việt).
Người dùng có thể nhắn bất kỳ câu nói đời thường nào:
- Lên lịch / Nhắc nhở / Tạo việc / Ghi chú mới.
- Xóa, hủy bỏ, hoặc báo đã làm xong việc ("xóa lịch họp đi", "tôi làm xong task đó rồi", "hủy hẹn chiều nay", "xóa ghi chú...").
- Hỏi han, tra cứu ("hôm nay tôi có lịch gì?", "ngày mai có rảnh không?", "liệt kê task chưa làm").
- Trò chuyện, chào hỏi bình thường ("chào bạn", "bạn làm được gì?").

THỜI GIAN HIỆN TẠI (Múi giờ Việt Nam GMT+7): ${vnTimeStr} (${isoStr})

DANH SÁCH DỮ LIỆU HIỆN CÓ TRONG SECOND BRAIN:
${JSON.stringify(activeEventsContext, null, 2)}

CÂU NGƯỜI DÙNG NHẮN: "${userText}"

NHIỆM VỤ:
Phân tích câu nói và chọn 1 hành động duy nhất (action):

1. "CREATE" (Người dùng muốn lên lịch mới, tạo task, ghi chú hoặc nhắc nhở):
   - type: "MEETING" | "TASK" | "REMINDER" | "NOTE"
   - title: Tiêu đề súc tích
   - formatted_content: Nội dung Markdown đẹp mắt
   - startAt: Thời gian bắt đầu tính theo ISO-8601 (GMT+7 hoặc UTC)
   - endAt: Thời gian kết thúc (nếu có, hoặc null)
   - pre_reminders_minutes: Mảng số phút cần nhắc trước (VD: [15, 0])
   - reply_message: Câu phản hồi tiếng Việt xác nhận đã tạo

2. "DELETE" hoặc "CANCEL" (Người dùng muốn xóa hoặc hủy sự kiện, lịch họp, ghi chú, việc cần làm):
   - target_event_ids: Mảng các id trong danh sách sự kiện hiện có phù hợp nhất với yêu cầu của người dùng
   - reply_message: Câu phản hồi tiếng Việt báo đã xóa/hủy những mục nào

3. "COMPLETE" (Người dùng báo đã hoàn thành công việc / đã làm rồi):
   - target_event_ids: Mảng các id của task phù hợp
   - reply_message: Câu phản hồi chúc mừng và xác nhận đã đánh dấu hoàn tất

4. "QUERY" (Người dùng hỏi lịch trình, xem việc cần làm, ghi chú):
   - reply_message: Câu trả lời chi tiết, tự nhiên, dựa vào danh sách dữ liệu hiện có

5. "CHAT" (Chào hỏi hoặc nói chuyện thông thường):
   - reply_message: Câu phản hồi thân thiện, giải thích cách trợ lý có thể giúp đỡ

ĐỊNH DẠNG JSON BẮT BUỘC:
{
  "action": "CREATE" | "DELETE" | "CANCEL" | "COMPLETE" | "QUERY" | "CHAT",
  "reply_message": string,
  "target_event_ids": string[],
  "type": "MEETING" | "TASK" | "REMINDER" | "NOTE" (nếu là CREATE),
  "title": string (nếu là CREATE),
  "formatted_content": string (nếu là CREATE),
  "startAt": string | null (nếu là CREATE),
  "endAt": string | null (nếu là CREATE),
  "pre_reminders_minutes": number[] (nếu là CREATE)
}
`;

    // Cascade: Thử lần lượt các model từ mạnh nhất trở xuống
    for (const modelName of GEMINI_MODEL_CASCADE) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        });

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const parsed = JSON.parse(cleanJsonResponse(text)) as AgentResult;
        parsed.used_model = modelName;
        console.log(`[Gemini Agent] ✅ Thành công với model [${modelName}] cho "${userText.substring(0, 50)}..."`);
        return parsed;
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.warn(`[Gemini Cascade] ⚠️ Model [${modelName}] không phản hồi (${errMsg.split("\n")[0]}). Đang tự động chuyển qua model tiếp theo...`);
      }
    }

    console.error("[Gemini Cascade] ❌ Tất cả các model Gemini đều bị lỗi hoặc hết quota. Sử dụng fallback heuristic.");
  }

  // Fallback heuristic if API key is not ready or all models failed
  return fallbackAgent(userText, now, existingEvents);
}

export async function parseImageWithGemini(
  imageBase64: string,
  mimeType: string = "image/jpeg",
  caption?: string
): Promise<AgentResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  const { now, vnTimeStr, isoStr } = getVnTimeInfo();

  if (apiKey && apiKey.trim() !== "" && apiKey !== "your_gemini_api_key_here") {
    const genAI = new GoogleGenerativeAI(apiKey);

    const prompt = `
Bạn là Trợ lý AI đa phương thức (Multimodal) của hệ thống "Second Brain Dashboard".
Người dùng vừa gửi một bức ảnh từ Telegram (ví dụ: ảnh bảng vẽ cuộc họp, slide trình chiếu, tài liệu, hóa đơn, ghi chú viết tay, ảnh chụp màn hình hoặc công việc cần làm).

THỜI GIAN HIỆN TẠI (Việt Nam GMT+7): ${vnTimeStr} (${isoStr})
CHÚ THÍCH CỦA NGƯỜI DÙNG: "${caption || "Không có chú thích"}"

NHIỆM VỤ CỦA BẠN:
1. Đọc và phân tích toàn bộ văn bản, hình vẽ, sơ đồ trong bức ảnh (OCR).
2. Xác định xem đây là:
   - "NOTE": Tài liệu, ý tưởng, tóm tắt bài học, sơ đồ kiến trúc, hóa đơn.
   - "TASK": Bảng công việc to-do list, việc cần giải quyết có hạn chót.
   - "MEETING": Lịch họp ghi trên bảng hoặc thư mời sự kiện.
3. Tạo tiêu đề "title" súc tích, mô tả đúng nội dung bức ảnh.
4. Viết "formatted_content" theo định dạng Markdown chi tiết:
   - ### 📸 Tóm tắt nội dung hình ảnh
   - ### 🔍 Chi tiết quan trọng / Trích xuất chữ
   - ### 🎯 Hành động tiếp theo (nếu có)
5. Nếu phát hiện có ngày giờ họp hoặc deadline, tính toán "startAt" theo ISO-8601 (GMT+7 hoặc UTC). Nếu không có thì null.
6. Trả về JSON:
{
  "action": "CREATE",
  "type": "NOTE" | "TASK" | "MEETING" | "REMINDER",
  "title": string,
  "formatted_content": string,
  "startAt": string | null,
  "endAt": string | null,
  "pre_reminders_minutes": number[],
  "reply_message": string
}
`;

    // Cascade multimodal models
    for (const modelName of GEMINI_MODEL_CASCADE) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        });

        const result = await model.generateContent([
          { text: prompt },
          {
            inlineData: {
              data: imageBase64,
              mimeType,
            },
          },
        ]);

        const responseText = result.response.text();
        const parsed = JSON.parse(cleanJsonResponse(responseText)) as AgentResult;
        parsed.used_model = modelName;
        console.log(`[Gemini Image Parser] ✅ Thành công với model [${modelName}]`);
        return parsed;
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.warn(`[Gemini Image Cascade] ⚠️ Model [${modelName}] lỗi: ${errMsg.split("\n")[0]}. Đang chuyển model tiếp theo...`);
      }
    }

    console.error("[Gemini Image Cascade] ❌ Tất cả các model đều gặp lỗi, dùng fallback ghi chú.");
  }

  return {
    action: "CREATE",
    type: "NOTE",
    title: caption || `Hình ảnh ghi nhận lúc ${now.toLocaleTimeString("vi-VN")}`,
    formatted_content: `📸 **Hình ảnh đính kèm từ Telegram**\n\nChú thích: ${caption || "Không có"}\nThời gian: ${now.toLocaleString("vi-VN")}`,
    startAt: null,
    endAt: null,
    pre_reminders_minutes: [],
    reply_message: "📸 Đã lưu hình ảnh vào kho Ghi chú Second Brain!",
  };
}

function fallbackAgent(text: string, now: Date, existingEvents: EventItem[]): AgentResult {
  const lower = text.toLowerCase();

  // Delete / Cancel intent
  if (lower.includes("xóa") || lower.includes("hủy") || lower.includes("bỏ")) {
    let matchedIds: string[] = [];
    if (lower.includes("họp") || lower.includes("meeting")) {
      matchedIds = existingEvents.filter((e) => e.type === "MEETING").map((e) => e.id);
    } else if (lower.includes("ghi chú") || lower.includes("note")) {
      matchedIds = existingEvents.filter((e) => e.type === "NOTE").map((e) => e.id);
    } else {
      matchedIds = existingEvents.slice(0, 1).map((e) => e.id);
    }
    return {
      action: "DELETE",
      target_event_ids: matchedIds,
      reply_message: `🗑️ Đã xóa các mục theo yêu cầu của bạn!`,
    };
  }

  // Done / Complete intent
  if (lower.includes("làm rồi") || lower.includes("xong rồi") || lower.includes("hoàn thành")) {
    const pendingTasks = existingEvents.filter((e) => e.type === "TASK" && e.status === "PENDING");
    return {
      action: "COMPLETE",
      target_event_ids: pendingTasks.slice(0, 2).map((t) => t.id),
      reply_message: `✅ Tuyệt vời! Đã đánh dấu hoàn thành nhiệm vụ cho bạn.`,
    };
  }

  // Query intent
  if (lower.includes("hôm nay") || lower.includes("lịch") || lower.includes("xem") || lower.includes("có gì")) {
    return {
      action: "QUERY",
      reply_message: `📅 Hiện tại bạn có ${existingEvents.length} mục trong Second Brain. Bạn có thể mở dashboard tại http://localhost:3000 để xem chi tiết nhé!`,
    };
  }

  // Create intent
  let type: EventType = "TASK";
  if (lower.includes("họp")) type = "MEETING";
  else if (lower.includes("nhắc")) type = "REMINDER";
  else if (lower.includes("ghi chú") || lower.includes("note")) type = "NOTE";

  return {
    action: "CREATE",
    type,
    title: text.charAt(0).toUpperCase() + text.slice(1),
    formatted_content: `📌 Nội dung: ${text}`,
    startAt: type === "NOTE" ? null : new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
    endAt: null,
    pre_reminders_minutes: type === "NOTE" ? [] : [15, 0],
    reply_message: `✅ Đã lưu mục "${text}" vào Second Brain!`,
  };
}
