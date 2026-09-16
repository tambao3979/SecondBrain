# Master Blueprint: Second Brain Dashboard & Hermes Integration

## 1. Project Overview
Xây dựng một hệ thống Website Dashboard "Second Brain" quản lý Timeline, Calendar, Tasks, Notes và Reminders. Hệ thống đóng vai trò lưu trữ và hiển thị, được điều khiển bởi **Hermes Agent** (thông qua API). Khi có lịch hẹn, hệ thống sẽ tự động gửi thông báo qua Telegram cho người dùng.

**Nguyên tắc cho AI Agent (Antigravity):**
- Sử dụng TypeScript strict mode.
- Viết code modular, phân tách rõ các layer (UI components, Server Actions, API Routes, Utils).
- Tối ưu UI cho Mobile-first bằng Tailwind CSS.
- Mọi thao tác với Database phải qua Prisma ORM.

## 2. Optimized Tech Stack
- **Framework:** Next.js 14/15 (App Router) - Full-stack Monorepo.
- **UI & Styling:** Tailwind CSS, Shadcn UI, Radix UI primitives, Lucide Icons.
- **Database:** PostgreSQL (Supabase hoặc Neon), Prisma ORM.
- **Job Scheduler (Serverless-friendly):** Upstash QStash (Dùng để hẹn giờ gọi lại Webhook thay cho Redis/Worker truyền thống).
- **Authentication:** NextAuth.js (Auth.js) hoặc JWT cơ bản kết hợp API Key middleware.
- **Bot Integration:** `node-telegram-bot-api` hoặc HTTP fetch trực tiếp đến Telegram API.

## 3. Database Schema (Prisma)
Yêu cầu khởi tạo schema sau trong `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id               String   @id @default(uuid())
  email            String   @unique
  name             String?
  telegram_chat_id String?  @unique
  events           Event[]
  createdAt        DateTime @default(now())
}

model Event {
  id                String     @id @default(uuid())
  userId            String
  type              EventType  @default(TASK)
  title             String
  formatted_content String     @db.Text
  startAt           DateTime?
  endAt             DateTime?
  status            Status     @default(PENDING)
  user              User       @relation(fields: [userId], references: [id])
  reminders         Reminder[]
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt
}

model Reminder {
  id              String   @id @default(uuid())
  eventId         String
  remindAt        DateTime
  isPreRemind     Boolean  @default(false)
  qstashMessageId String?  // Lưu ID của QStash để có thể cancel nếu đổi lịch
  status          Status   @default(PENDING)
  event           Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
}

enum EventType { TASK, NOTE, MEETING, REMINDER }
enum Status { PENDING, SENT, CANCELLED }
```

## 4. API Design (Hermes -> Next.js)

### 4.1. Tạo Event & Lên lịch (Create)
- **Endpoint:** `POST /api/hermes/events`
- **Security:** Header `x-api-key`
- **Body:**
```json
{
  "telegram_chat_id": "123456789",
  "type": "MEETING",
  "title": "Họp team Product",
  "formatted_content": "🚨 **Nhắc nhở cuộc họp**...",
  "start_at": "2024-01-20T15:00:00Z",
  "pre_reminders_minutes": [15, 0]
}
```
- **Action (Backend Flow):**
  1. Xác thực API Key.
  2. Tìm User dựa trên `telegram_chat_id`.
  3. Tạo `Event` trong DB.
  4. Lặp qua `pre_reminders_minutes`, tính toán `remindAt`. Với mỗi mốc thời gian, tạo bản ghi `Reminder`.
  5. Gọi API **Upstash QStash** để publish một message (có delay đến `remindAt`) trỏ về endpoint `/api/webhooks/send-telegram`. Lưu `messageId` trả về từ QStash vào DB.

### 4.2. Webhook thực thi gửi tin nhắn Telegram (Execute)
- **Endpoint:** `POST /api/webhooks/send-telegram`
- **Security:** Verify QStash Signature.
- **Body từ QStash:** `{ "reminderId": "uuid" }`
- **Action:**
  1. Lấy thông tin Reminder và Event tương ứng.
  2. Kiểm tra status: Nếu Event hoặc Reminder đã bị CANCELLED -> Bỏ qua.
  3. Gọi Telegram Bot API (`sendMessage`) với `chat_id` và `formatted_content`.
  4. Đánh dấu Reminder status = `SENT`. Nếu là reminder cuối cùng, đổi Event status = `SENT`.

## 5. Implementation Phases (Dành cho AI Agent)

### Phase 1: Foundation & Database
- Khởi tạo Next.js App Router với TypeScript, Tailwind.
- Cài đặt Prisma, định nghĩa Schema và chạy migration.
- Viết các tiện ích kết nối Database (`lib/prisma.ts`).
- Thiết lập thư mục cấu trúc: `components/`, `app/api/`, `lib/`, `actions/`.

### Phase 2: Core API & Scheduling (Backend Logic)
- Viết middleware kiểm tra `x-api-key` cho route `/api/hermes/*`.
- Triển khai `POST /api/hermes/events`.
- Tích hợp `@upstash/qstash` SDK. Cấu hình publish job kèm delay.
- Viết Webhook handler `/api/webhooks/send-telegram` tích hợp hàm gửi tin nhắn Telegram (dùng hàm `fetch` cơ bản tới `https://api.telegram.org/bot<TOKEN>/sendMessage`).

### Phase 3: Dashboard Frontend
- Cài đặt Shadcn UI components (Card, Button, Input, Dialog, Table, Tabs).
- Tạo trang Dashboard chính (`/dashboard`):
  - **Tabs Layout:** Timeline, Calendar, Tasks, Notes.
  - Tích hợp thư viện `react-big-calendar` hoặc `FullCalendar` cho Calendar view.
  - Viết Server Actions để fetch dữ liệu Event (phân trang, lọc theo type).
- Tạo giao diện list ra các Event đang PENDING, cho phép user click vào để Cancel. 
- (Khi Cancel, gọi QStash API để xóa message hẹn giờ dựa trên `qstashMessageId`).

### Phase 4: Refine & Polish
- Tối ưu giao diện cho màn hình mobile (Responsive).
- Thêm loading states, toast notifications (thông báo lỗi/thành công trên web).
- Đảm bảo xử lý lỗi (Error boundary) và múi giờ (luôn convert về local timezone trên Frontend bằng `date-fns` hoặc `dayjs`).

## 6. Technical Risks to Watch (AI Note)
- **Timezone:** Dữ liệu nhận từ Hermes và lưu vào Prisma phải luôn là chuẩn UTC (ISO-8601).
- **Idempotency:** Webhook gửi Telegram phải kiểm tra kỹ trạng thái Reminder (`PENDING`) trước khi gửi để tránh duplicate tin nhắn nếu QStash retry.
