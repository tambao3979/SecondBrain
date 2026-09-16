export type EventType = "TASK" | "NOTE" | "MEETING" | "REMINDER";
export type Status = "PENDING" | "SENT" | "CANCELLED";

export interface User {
  id: string;
  email: string;
  name: string | null;
  telegram_chat_id: string | null;
  createdAt: string | Date;
}

export interface Reminder {
  id: string;
  eventId: string;
  remindAt: string | Date;
  isPreRemind: boolean;
  qstashMessageId: string | null;
  status: Status;
  createdAt?: string | Date;
}

export interface EventItem {
  id: string;
  userId: string;
  type: EventType;
  title: string;
  formatted_content: string;
  startAt: string | Date | null;
  endAt: string | Date | null;
  status: Status;
  user?: User;
  reminders: Reminder[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface HermesEventPayload {
  telegram_chat_id: string;
  type: EventType;
  title: string;
  formatted_content: string;
  start_at?: string;
  end_at?: string;
  pre_reminders_minutes?: number[];
}

export interface DashboardStats {
  totalEvents: number;
  activeTasks: number;
  completedTasks: number;
  pendingMeetings: number;
  upcomingRemindersCount: number;
  notesCount: number;
  hermesApiCalls: number;
}
