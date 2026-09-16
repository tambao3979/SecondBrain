"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Clock,
  Send,
  FileText,
  CheckSquare,
  Bell,
  Sparkles,
  Users,
} from "lucide-react";
import { EventType } from "@/lib/types";
import { useToast } from "./Toast";

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: () => Promise<void>;
  defaultDate?: Date;
}

export default function CreateEventModal({
  isOpen,
  onClose,
  onEventCreated,
  defaultDate,
}: CreateEventModalProps) {
  const { toast } = useToast();

  const [type, setType] = useState<EventType>("MEETING");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("14:00");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("15:00");
  const [preReminders, setPreReminders] = useState<number[]>([15, 0]);
  const [chatId, setChatId] = useState("123456789");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const targetDate = defaultDate || new Date();
      const yyyy = targetDate.getFullYear();
      const mm = String(targetDate.getMonth() + 1).padStart(2, "0");
      const dd = String(targetDate.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;
      setStartDate(dateStr);
      setEndDate(dateStr);

      const hours = String(targetDate.getHours() + 1).padStart(2, "0");
      setStartTime(`${hours}:00`);
      const endHours = String(targetDate.getHours() + 2).padStart(2, "0");
      setEndTime(`${endHours}:00`);
    }
  }, [isOpen, defaultDate]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleReminderMinutes = (mins: number) => {
    if (preReminders.includes(mins)) {
      setPreReminders(preReminders.filter((m) => m !== mins));
    } else {
      setPreReminders([...preReminders, mins].sort((a, b) => b - a));
    }
  };

  const applyTemplate = (templateType: EventType) => {
    if (templateType === "MEETING") {
      setTitle("Họp thảo luận tiến độ dự án Second Brain");
      setContent("🚨 **Cuộc họp định kỳ**:\n- Review các tính năng đã hoàn thiện\n- Lên kế hoạch tích hợp QStash và Telegram\n- Giao việc cho các thành viên");
    } else if (templateType === "TASK") {
      setTitle("Hoàn thiện module Serverless QStash Webhook");
      setContent("Kiểm tra xác thực chữ ký QStash, đảm bảo cơ chế Idempotency chống trùng lặp tin nhắn khi có retry.");
    } else if (templateType === "NOTE") {
      setTitle("Kiến trúc phân tầng Second Brain Dashboard");
      setContent("### Tổng quan kiến trúc\n1. Next.js 16 App Router\n2. Prisma ORM + PostgreSQL\n3. Upstash QStash cho delayed messaging\n4. Telegram Bot API");
    } else if (templateType === "REMINDER") {
      setTitle("Kiểm tra và backup dữ liệu database định kỳ");
      setContent("🔔 **Nhắc nhở quan trọng**: Tạo snapshot backup PostgreSQL trên Supabase/Neon.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      toast({ type: "error", title: "Thiếu tiêu đề", message: "Vui lòng nhập tiêu đề." });
      return;
    }

    setLoading(true);

    try {
      let startAtIso: string | null = null;
      let endAtIso: string | null = null;

      if (type !== "NOTE" && startDate && startTime) {
        startAtIso = new Date(`${startDate}T${startTime}:00`).toISOString();
      }
      if (type !== "NOTE" && endDate && endTime) {
        endAtIso = new Date(`${endDate}T${endTime}:00`).toISOString();
      }

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title,
          formatted_content: content,
          startAt: startAtIso,
          endAt: endAtIso,
          telegram_chat_id: chatId,
          pre_reminders_minutes: type === "NOTE" ? [] : preReminders,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast({
          type: "success",
          title: "Đã tạo thành công!",
          message: `Mục "${title}" đã được lưu và lên lịch QStash.`,
        });
        await onEventCreated();
        onClose();
      } else {
        toast({
          type: "error",
          title: "Lỗi tạo sự kiện",
          message: data.error || "Không thể tạo sự kiện",
        });
      }
    } catch (err: unknown) {
      toast({
        type: "error",
        title: "Lỗi kết nối",
        message: String(err),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-slate-950 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh] space-y-6 animate-modal-pop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Thêm Mới Vào Second Brain</h3>
              <p className="text-xs text-slate-400">Lên lịch họp, tạo task, ghi chú hoặc hẹn giờ nhắc Telegram</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">
              Chọn loại mục (Category)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "MEETING", label: "Cuộc họp", icon: Users, color: "hover:border-purple-500 text-purple-300" },
                { id: "TASK", label: "Task việc", icon: CheckSquare, color: "hover:border-cyan-500 text-cyan-300" },
                { id: "NOTE", label: "Ghi chú", icon: FileText, color: "hover:border-emerald-500 text-emerald-300" },
                { id: "REMINDER", label: "Nhắc nhở", icon: Bell, color: "hover:border-amber-500 text-amber-300" },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = type === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setType(item.id as EventType);
                      applyTemplate(item.id as EventType);
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                      isSelected
                        ? "bg-slate-800 border-indigo-500 shadow-lg shadow-indigo-950/50 text-white"
                        : "bg-slate-900/60 border-slate-800 text-slate-400 " + item.color
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-1" />
                    <span className="text-xs font-semibold">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Tiêu đề <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề cuộc họp, nhiệm vụ hoặc ghi chú..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          {/* Formatted Content */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Nội dung Markdown (Formatted Content)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              placeholder="Chi tiết nội dung (hỗ trợ Markdown: **in đậm**, - danh sách, # tiêu đề)..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed"
            />
          </div>

          {/* Date & Time (for Meeting, Task, Reminder) */}
          {type !== "NOTE" && (
            <div className="space-y-3 pt-2 border-t border-slate-800/80">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Ngày bắt đầu
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Giờ bắt đầu
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    required
                  />
                </div>
              </div>

              {/* Pre-reminders selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                  <Bell className="w-3.5 h-3.5 text-amber-400" /> Nhắc trước qua Telegram (Upstash QStash)
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { mins: 60, label: "60 phút trước" },
                    { mins: 30, label: "30 phút trước" },
                    { mins: 15, label: "15 phút trước" },
                    { mins: 0, label: "Đúng giờ (0p)" },
                  ].map((item) => {
                    const isChecked = preReminders.includes(item.mins);
                    return (
                      <button
                        key={item.mins}
                        type="button"
                        onClick={() => toggleReminderMinutes(item.mins)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                          isChecked
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                            : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Telegram Chat ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                  <Send className="w-3.5 h-3.5 text-cyan-400" /> Telegram Chat ID nhận thông báo
                </label>
                <input
                  type="text"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Đang lưu...</span>
                </>
              ) : (
                <span>Lưu Vào Second Brain</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
