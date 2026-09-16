import { prisma } from "./prisma";
import { EventItem, EventType, Status, DashboardStats } from "./types";

// In-memory store fallback when PostgreSQL is not yet connected
let fallbackEvents: EventItem[] = [
  {
    id: "evt-101",
    userId: "user-1",
    type: "MEETING",
    title: "Họp chiến lược phát triển AI Agent với Hermes Core",
    formatted_content: "🚨 **Cuộc họp quan trọng**: Review kiến trúc Microservices và kết nối Telegram Webhook với Upstash QStash. Thành phần tham dự: Tech Lead, Hermes AI.",
    startAt: new Date(Date.now() + 1000 * 60 * 45).toISOString(), // 45 mins from now
    endAt: new Date(Date.now() + 1000 * 60 * 105).toISOString(),
    status: "PENDING",
    reminders: [
      {
        id: "rem-101-1",
        eventId: "evt-101",
        remindAt: new Date(Date.now() + 1000 * 60 * 30).toISOString(), // 15 mins before
        isPreRemind: true,
        qstashMessageId: "msg_qstash_sample_1",
        status: "PENDING",
      },
      {
        id: "rem-101-2",
        eventId: "evt-101",
        remindAt: new Date(Date.now() + 1000 * 60 * 45).toISOString(), // At start time
        isPreRemind: false,
        qstashMessageId: "msg_qstash_sample_2",
        status: "PENDING",
      }
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "evt-102",
    userId: "user-1",
    type: "TASK",
    title: "Tối ưu hóa Database Indexing & Prisma Migrations",
    formatted_content: "Kiểm tra composite index trên bảng `Reminder` (remindAt, status) và `Event` (userId, startAt) để tăng tốc độ truy vấn webhook.",
    startAt: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(),
    endAt: new Date(Date.now() + 1000 * 60 * 60 * 6).toISOString(),
    status: "PENDING",
    reminders: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "evt-103",
    userId: "user-1",
    type: "REMINDER",
    title: "Uống 500ml nước & thực hiện bài tập giãn cơ 5 phút",
    formatted_content: "🔔 **Nhắc nhở sức khỏe**: Duy trì tập trung và tư thế ngồi chuẩn công thái học.",
    startAt: new Date(Date.now() + 1000 * 60 * 15).toISOString(),
    endAt: null,
    status: "PENDING",
    reminders: [
      {
        id: "rem-103-1",
        eventId: "evt-103",
        remindAt: new Date(Date.now() + 1000 * 60 * 15).toISOString(),
        isPreRemind: false,
        qstashMessageId: "msg_qstash_sample_3",
        status: "PENDING",
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "evt-104",
    userId: "user-1",
    type: "NOTE",
    title: "Ý tưởng: Tích hợp Hermes Agent Auto-Summarizer",
    formatted_content: "### Tổng hợp ý tưởng\n- Dùng Hermes Agent tóm tắt lại các ghi chú trong ngày vào 21:00 tối mỗi ngày.\n- Tự động gán nhãn tags và trích xuất action items thành TASK trong Second Brain.\n- Gửi digest ngắn qua Telegram bot.",
    startAt: null,
    endAt: null,
    status: "SENT",
    reminders: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "evt-105",
    userId: "user-1",
    type: "TASK",
    title: "Triển khai Dark Mode & Mobile Responsive hoàn hảo",
    formatted_content: "Thiết kế các component thẻ kính (glassmorphism), bảng màu sang trọng và tối ưu touch-target trên thiết bị di động.",
    startAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
    endAt: null,
    status: "SENT",
    reminders: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

let hermesCallCounter = 14;

export async function isDbConnected(): Promise<boolean> {
  if (!process.env.DATABASE_URL) return false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export async function getEvents(filters?: {
  type?: EventType;
  status?: Status;
  search?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<EventItem[]> {
  try {
    const connected = await isDbConnected();
    if (connected) {
      const where: any = {};
      if (filters?.type) where.type = filters.type;
      if (filters?.status) where.status = filters.status;
      if (filters?.search) {
        where.OR = [
          { title: { contains: filters.search, mode: "insensitive" } },
          { formatted_content: { contains: filters.search, mode: "insensitive" } },
        ];
      }
      if (filters?.startDate || filters?.endDate) {
        where.startAt = {};
        if (filters.startDate) where.startAt.gte = filters.startDate;
        if (filters.endDate) where.startAt.lte = filters.endDate;
      }

      const events = await prisma.event.findMany({
        where,
        include: { reminders: true, user: true },
        orderBy: { startAt: "asc" },
      });
      return events as unknown as EventItem[];
    }
  } catch (error) {
    console.warn("[DB] Using fallback memory store:", error);
  }

  // Filter in-memory
  let result = [...fallbackEvents];
  if (filters?.type) {
    result = result.filter((e) => e.type === filters.type);
  }
  if (filters?.status) {
    result = result.filter((e) => e.status === filters.status);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.formatted_content.toLowerCase().includes(q)
    );
  }
  return result;
}

export async function getEventById(id: string): Promise<EventItem | null> {
  try {
    const connected = await isDbConnected();
    if (connected) {
      const item = await prisma.event.findUnique({
        where: { id },
        include: { reminders: true, user: true },
      });
      return item as unknown as EventItem | null;
    }
  } catch (error) {
    console.warn("[DB] Using fallback memory store for getEventById:", error);
  }
  return fallbackEvents.find((e) => e.id === id) || null;
}

export async function getOrCreateUser(telegramChatId?: string | null, name?: string, email?: string) {
  const userEmail = email || (telegramChatId ? `user_${telegramChatId}@secondbrain.ai` : "default@secondbrain.ai");
  const userName = name || (telegramChatId ? `Telegram User ${telegramChatId}` : "Hermes Commander");

  try {
    const connected = await isDbConnected();
    if (connected) {
      if (telegramChatId) {
        const existing = await prisma.user.findUnique({
          where: { telegram_chat_id: telegramChatId },
        });
        if (existing) return existing;
      }

      return await prisma.user.upsert({
        where: { email: userEmail },
        update: {
          telegram_chat_id: telegramChatId ?? undefined,
          name: userName,
        },
        create: {
          email: userEmail,
          name: userName,
          telegram_chat_id: telegramChatId,
        },
      });
    }
  } catch (err) {
    console.warn("[DB] getOrCreateUser using mock user:", err);
  }

  return {
    id: "user-1",
    email: userEmail,
    name: userName,
    telegram_chat_id: telegramChatId || "123456789",
    createdAt: new Date(),
  };
}

export async function createEventWithReminders(data: {
  userId?: string;
  telegram_chat_id?: string;
  type: EventType;
  title: string;
  formatted_content: string;
  startAt?: Date | null;
  endAt?: Date | null;
  reminders?: {
    remindAt: Date;
    isPreRemind: boolean;
    qstashMessageId?: string;
  }[];
}): Promise<EventItem> {
  hermesCallCounter++;
  const user = await getOrCreateUser(data.telegram_chat_id);
  const userId = data.userId || user.id;

  try {
    const connected = await isDbConnected();
    if (connected) {
      const created = await prisma.event.create({
        data: {
          userId,
          type: data.type,
          title: data.title,
          formatted_content: data.formatted_content,
          startAt: data.startAt,
          endAt: data.endAt,
          status: "PENDING",
          reminders: {
            create: (data.reminders || []).map((r) => ({
              remindAt: r.remindAt,
              isPreRemind: r.isPreRemind,
              qstashMessageId: r.qstashMessageId || null,
              status: "PENDING",
            })),
          },
        },
        include: { reminders: true, user: true },
      });
      return created as unknown as EventItem;
    }
  } catch (err) {
    console.warn("[DB] createEvent fallback to memory store:", err);
  }

  const newId = `evt-${Date.now()}`;
  const newReminders = (data.reminders || []).map((r, i) => ({
    id: `rem-${newId}-${i}`,
    eventId: newId,
    remindAt: r.remindAt.toISOString(),
    isPreRemind: r.isPreRemind,
    qstashMessageId: r.qstashMessageId || `sim-msg-${Date.now()}-${i}`,
    status: "PENDING" as Status,
  }));

  const newEvent: EventItem = {
    id: newId,
    userId,
    type: data.type,
    title: data.title,
    formatted_content: data.formatted_content,
    startAt: data.startAt ? data.startAt.toISOString() : null,
    endAt: data.endAt ? data.endAt.toISOString() : null,
    status: "PENDING",
    reminders: newReminders,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  fallbackEvents.unshift(newEvent);
  return newEvent;
}

export async function cancelEvent(eventId: string): Promise<EventItem | null> {
  try {
    const connected = await isDbConnected();
    if (connected) {
      await prisma.reminder.updateMany({
        where: { eventId },
        data: { status: "CANCELLED" },
      });
      const updated = await prisma.event.update({
        where: { id: eventId },
        data: { status: "CANCELLED" },
        include: { reminders: true },
      });
      return updated as unknown as EventItem;
    }
  } catch (err) {
    console.warn("[DB] cancelEvent fallback to memory:", err);
  }

  const target = fallbackEvents.find((e) => e.id === eventId);
  if (target) {
    target.status = "CANCELLED";
    target.reminders.forEach((r) => {
      r.status = "CANCELLED";
    });
    return target;
  }
  return null;
}

export async function updateEvent(
  eventId: string,
  data: {
    title?: string;
    formatted_content?: string;
    type?: EventType;
    startAt?: Date | null;
    endAt?: Date | null;
  }
): Promise<EventItem | null> {
  try {
    const connected = await isDbConnected();
    if (connected) {
      const updated = await prisma.event.update({
        where: { id: eventId },
        data: {
          title: data.title,
          formatted_content: data.formatted_content,
          type: data.type,
          startAt: data.startAt,
          endAt: data.endAt,
        },
        include: { reminders: true, user: true },
      });
      return updated as unknown as EventItem;
    }
  } catch (err) {
    console.warn("[DB] updateEvent fallback to memory:", err);
  }

  const target = fallbackEvents.find((e) => e.id === eventId);
  if (target) {
    if (data.title !== undefined) target.title = data.title;
    if (data.formatted_content !== undefined) target.formatted_content = data.formatted_content;
    if (data.type !== undefined) target.type = data.type;
    if (data.startAt !== undefined) target.startAt = data.startAt ? data.startAt.toISOString() : null;
    if (data.endAt !== undefined) target.endAt = data.endAt ? data.endAt.toISOString() : null;
    target.updatedAt = new Date().toISOString();
    return target;
  }
  return null;
}

export async function toggleTaskStatus(eventId: string): Promise<EventItem | null> {
  try {
    const connected = await isDbConnected();
    if (connected) {
      const current = await prisma.event.findUnique({ where: { id: eventId } });
      if (current) {
        const nextStatus = current.status === "SENT" ? "PENDING" : "SENT";
        const updated = await prisma.event.update({
          where: { id: eventId },
          data: { status: nextStatus },
          include: { reminders: true },
        });
        return updated as unknown as EventItem;
      }
    }
  } catch (err) {
    console.warn("[DB] toggleTaskStatus fallback to memory:", err);
  }

  const target = fallbackEvents.find((e) => e.id === eventId);
  if (target) {
    target.status = target.status === "SENT" ? "PENDING" : "SENT";
    return target;
  }
  return null;
}

export async function deleteEvent(eventId: string): Promise<boolean> {
  try {
    const connected = await isDbConnected();
    if (connected) {
      await prisma.event.delete({ where: { id: eventId } });
      return true;
    }
  } catch (err) {
    console.warn("[DB] deleteEvent fallback to memory:", err);
  }

  const index = fallbackEvents.findIndex((e) => e.id === eventId);
  if (index !== -1) {
    fallbackEvents.splice(index, 1);
    return true;
  }
  return false;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const events = await getEvents();
  const tasks = events.filter((e) => e.type === "TASK");
  const activeTasks = tasks.filter((t) => t.status === "PENDING").length;
  const completedTasks = tasks.filter((t) => t.status === "SENT").length;
  const pendingMeetings = events.filter((e) => e.type === "MEETING" && e.status === "PENDING").length;
  const notesCount = events.filter((e) => e.type === "NOTE").length;

  // Reminders scheduled
  let upcomingRemindersCount = 0;
  events.forEach((e) => {
    e.reminders?.forEach((r) => {
      if (r.status === "PENDING") upcomingRemindersCount++;
    });
  });

  return {
    totalEvents: events.length,
    activeTasks,
    completedTasks,
    pendingMeetings,
    upcomingRemindersCount,
    notesCount,
    hermesApiCalls: hermesCallCounter,
  };
}

export async function findReminderById(reminderId: string) {
  try {
    const connected = await isDbConnected();
    if (connected) {
      return await prisma.reminder.findUnique({
        where: { id: reminderId },
        include: {
          event: {
            include: { user: true },
          },
        },
      });
    }
  } catch (err) {
    console.warn("[DB] findReminderById fallback:", err);
  }

  for (const ev of fallbackEvents) {
    const rem = ev.reminders.find((r) => r.id === reminderId);
    if (rem) {
      return {
        ...rem,
        event: {
          ...ev,
          user: {
            id: "user-1",
            email: "default@secondbrain.ai",
            name: "Commander",
            telegram_chat_id: "123456789",
          },
        },
      };
    }
  }
  return null;
}

export async function markReminderSent(reminderId: string, eventId: string) {
  try {
    const connected = await isDbConnected();
    if (connected) {
      await prisma.reminder.update({
        where: { id: reminderId },
        data: { status: "SENT" },
      });

      // Check if all reminders are sent
      const pendingReminders = await prisma.reminder.count({
        where: { eventId, status: "PENDING" },
      });
      if (pendingReminders === 0) {
        await prisma.event.update({
          where: { id: eventId },
          data: { status: "SENT" },
        });
      }
      return;
    }
  } catch (err) {
    console.warn("[DB] markReminderSent fallback:", err);
  }

  const ev = fallbackEvents.find((e) => e.id === eventId);
  if (ev) {
    const rem = ev.reminders.find((r) => r.id === reminderId);
    if (rem) rem.status = "SENT";
    const hasPending = ev.reminders.some((r) => r.status === "PENDING");
    if (!hasPending) ev.status = "SENT";
  }
}
