"use client";

import React, { useState, useMemo } from "react";
import {
  Calendar,
  Clock,
  Bell,
  XCircle,
  CheckCircle2,
  Trash2,
  Tag,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Edit3,
  CalendarCheck2,
  History,
  FileText,
} from "lucide-react";
import { EventItem, EventType, Status } from "@/lib/types";
import { formatDate, getRelativeTime } from "@/lib/utils";
import RichMarkdown from "./RichMarkdown";
import ConfirmModal from "./ConfirmModal";

interface TimelineViewProps {
  events: EventItem[];
  onCancelEvent: (id: string) => Promise<void>;
  onToggleTask: (id: string) => Promise<void>;
  onDeleteEvent: (id: string) => Promise<void>;
  onEditEvent?: (event: EventItem) => void;
  onOpenCreateModal: () => void;
}

export default function TimelineView({
  events,
  onCancelEvent,
  onToggleTask,
  onDeleteEvent,
  onEditEvent,
  onOpenCreateModal,
}: TimelineViewProps) {
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  // Deletion confirm modal state
  const [eventToDelete, setEventToDelete] = useState<EventItem | null>(null);

  // Filter events
  const filteredEvents = useMemo(() => {
    return events
      .filter((ev) => {
        if (filterType !== "ALL" && ev.type !== filterType) return false;
        if (filterStatus !== "ALL" && ev.status !== filterStatus) return false;
        return true;
      })
      .sort((a, b) => {
        const timeA = a.startAt ? new Date(a.startAt).getTime() : 0;
        const timeB = b.startAt ? new Date(b.startAt).getTime() : 0;
        if (sortOrder === "asc") {
          if (!timeA) return 1;
          if (!timeB) return -1;
          return timeA - timeB;
        } else {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
      });
  }, [events, filterType, filterStatus, sortOrder]);

  // Group events into cognitive timeframes
  const groupedEvents = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const tomorrowStart = todayStart + 86400000;
    const dayAfterTomorrow = todayStart + 86400000 * 2;
    const endOfWeek = todayStart + 86400000 * 7;

    const groups: {
      id: string;
      title: string;
      icon: any;
      color: string;
      items: EventItem[];
    }[] = [
      { id: "today", title: "Hôm nay", icon: CalendarCheck2, color: "text-indigo-400", items: [] },
      { id: "tomorrow", title: "Ngày mai", icon: Clock, color: "text-purple-400", items: [] },
      { id: "thisWeek", title: "Tuần này", icon: Calendar, color: "text-cyan-400", items: [] },
      { id: "upcoming", title: "Sắp tới", icon: Bell, color: "text-amber-400", items: [] },
      { id: "undated", title: "Ghi chú & Tự do", icon: FileText, color: "text-emerald-400", items: [] },
      { id: "past", title: "Đã qua", icon: History, color: "text-slate-400", items: [] },
    ];

    filteredEvents.forEach((ev) => {
      if (!ev.startAt) {
        groups[4].items.push(ev);
        return;
      }

      const evTime = new Date(ev.startAt).getTime();
      if (evTime < todayStart) {
        groups[5].items.push(ev);
      } else if (evTime >= todayStart && evTime < tomorrowStart) {
        groups[0].items.push(ev);
      } else if (evTime >= tomorrowStart && evTime < dayAfterTomorrow) {
        groups[1].items.push(ev);
      } else if (evTime >= dayAfterTomorrow && evTime <= endOfWeek) {
        groups[2].items.push(ev);
      } else {
        groups[3].items.push(ev);
      }
    });

    return groups.filter((g) => g.items.length > 0);
  }, [filteredEvents]);

  const getTypeStyle = (type: EventType) => {
    switch (type) {
      case "MEETING":
        return {
          badge: "bg-purple-500/10 text-purple-300 border-purple-500/30",
          node: "bg-purple-500 ring-4 ring-purple-500/20",
          glow: "border-purple-500/30 hover:border-purple-500/60",
          label: "Cuộc họp (Meeting)",
        };
      case "TASK":
        return {
          badge: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
          node: "bg-cyan-500 ring-4 ring-cyan-500/20",
          glow: "border-cyan-500/30 hover:border-cyan-500/60",
          label: "Nhiệm vụ (Task)",
        };
      case "REMINDER":
        return {
          badge: "bg-amber-500/10 text-amber-300 border-amber-500/30",
          node: "bg-amber-500 ring-4 ring-amber-500/20",
          glow: "border-amber-500/30 hover:border-amber-500/60",
          label: "Nhắc nhở (Reminder)",
        };
      case "NOTE":
        return {
          badge: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
          node: "bg-emerald-500 ring-4 ring-emerald-500/20",
          glow: "border-emerald-500/30 hover:border-emerald-500/60",
          label: "Ghi chú (Note)",
        };
    }
  };

  const getStatusBadge = (status: Status) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            Đang chờ
          </span>
        );
      case "SENT":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Đã gửi / Xong
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/30">
            <XCircle className="w-3 h-3 text-rose-400" />
            Đã hủy
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl glass-panel">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5" /> Phân loại:
          </span>
          {["ALL", "MEETING", "TASK", "REMINDER", "NOTE"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                filterType === type
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
              }`}
            >
              {type === "ALL" ? "Tất cả" : type}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400">Trạng thái:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">Tất cả</option>
              <option value="PENDING">Chỉ Pending</option>
              <option value="SENT">Chỉ Sent / Done</option>
              <option value="CANCELLED">Chỉ Cancelled</option>
            </select>
          </div>

          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 font-medium transition-colors"
            title="Đổi chiều sắp xếp"
          >
            <ArrowUpDown className="w-3 h-3 text-indigo-400" />
            <span>{sortOrder === "asc" ? "Gần nhất trước" : "Mới tạo nhất"}</span>
          </button>
        </div>
      </div>

      {/* Timeline Content */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl glass-panel">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Calendar className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-white">Không có sự kiện nào phù hợp</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Chưa có mục nào trong danh sách hoặc bộ lọc đang ẩn các sự kiện hiện tại.
          </p>
          <button
            onClick={onOpenCreateModal}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20"
          >
            + Tạo Sự Kiện Mới
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedEvents.map((group) => {
            const GroupIcon = group.icon;
            return (
              <div key={group.id} className="space-y-4">
                {/* Group Header */}
                <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800/80">
                  <GroupIcon className={`w-4 h-4 ${group.color}`} />
                  <h3 className="text-sm font-bold text-white tracking-tight">{group.title}</h3>
                  <span className="px-2 py-0.2 rounded-full text-[11px] font-mono bg-slate-900 border border-slate-800 text-slate-400">
                    {group.items.length}
                  </span>
                </div>

                {/* Timeline nodes within group */}
                <div className="relative pl-6 sm:pl-8 space-y-5 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-indigo-500 before:via-purple-500/50 before:to-transparent">
                  {group.items.map((item) => {
                    const style = getTypeStyle(item.type);
                    const isExpanded = expandedEventId === item.id;
                    const relativeTime = getRelativeTime(item.startAt);

                    return (
                      <div key={item.id} className="relative group">
                        {/* Timeline node */}
                        <div
                          className={`absolute -left-[27px] sm:-left-[35px] top-4 w-3.5 h-3.5 rounded-full ${style.node} transition-all group-hover:scale-125`}
                        />

                        {/* Event Card */}
                        <div
                          className={`glass-panel p-5 rounded-2xl border transition-all duration-300 ${style.glow} ${
                            item.status === "CANCELLED" ? "opacity-60 saturate-50" : ""
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${style.badge}`}>
                                {style.label}
                              </span>
                              {getStatusBadge(item.status)}
                              {relativeTime && item.status === "PENDING" && (
                                <span className="text-[11px] text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 font-mono">
                                  {relativeTime}
                                </span>
                              )}
                            </div>

                            {/* Date/Time badge */}
                            {item.startAt && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono bg-slate-900/90 px-3 py-1 rounded-xl border border-slate-800">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span>{formatDate(item.startAt)}</span>
                                {item.endAt && <span>- {formatDate(item.endAt, "HH:mm")}</span>}
                              </div>
                            )}
                          </div>

                          {/* Title & Markdown Content */}
                          <div className="mt-3">
                            <h4
                              className={`text-base font-semibold text-white tracking-tight ${
                                item.status === "SENT" && item.type === "TASK" ? "line-through text-slate-400" : ""
                              }`}
                            >
                              {item.title}
                            </h4>

                            <div className="mt-2 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/60 font-sans">
                              <RichMarkdown
                                content={item.formatted_content}
                                clampLines={!isExpanded && item.formatted_content.length > 220 ? 3 : undefined}
                              />
                            </div>

                            {item.formatted_content.length > 220 && (
                              <button
                                onClick={() => setExpandedEventId(isExpanded ? null : item.id)}
                                className="mt-1.5 text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                              >
                                {isExpanded ? (
                                  <>Thu gọn <ChevronUp className="w-3 h-3" /></>
                                ) : (
                                  <>Xem đầy đủ chi tiết <ChevronDown className="w-3 h-3" /></>
                                )}
                              </button>
                            )}
                          </div>

                          {/* Pre-reminders scheduled with QStash */}
                          {item.reminders && item.reminders.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-slate-800/60">
                              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 mb-2">
                                <Bell className="w-3.5 h-3.5 text-amber-400" />
                                <span>Lịch thông báo tự động (Upstash QStash Scheduler):</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {item.reminders.map((rem, idx) => (
                                  <div
                                    key={rem.id || idx}
                                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono border ${
                                      rem.status === "SENT"
                                        ? "bg-emerald-950/30 text-emerald-300 border-emerald-500/30"
                                        : rem.status === "CANCELLED"
                                        ? "bg-slate-900 text-slate-500 border-slate-800 line-through"
                                        : "bg-amber-950/30 text-amber-300 border-amber-500/30"
                                    }`}
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                    <span>
                                      {rem.isPreRemind ? "Nhắc trước: " : "Đúng giờ: "}
                                      {formatDate(rem.remindAt, "dd/MM HH:mm")}
                                    </span>
                                    {rem.qstashMessageId && (
                                      <span className="text-[9px] text-slate-400 opacity-70">
                                        ({rem.qstashMessageId.substring(0, 10)}...)
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Actions Bar */}
                          <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              {item.type === "TASK" && (
                                <button
                                  onClick={() => onToggleTask(item.id)}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                    item.status === "SENT"
                                      ? "bg-slate-800 hover:bg-slate-700 text-slate-300"
                                      : "bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30"
                                  }`}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  {item.status === "SENT" ? "Đánh dấu chưa xong" : "Hoàn thành Task"}
                                </button>
                              )}

                              {item.status === "PENDING" && (
                                <button
                                  onClick={() => onCancelEvent(item.id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-all"
                                  title="Hủy sự kiện và xóa tin nhắn hẹn giờ trên QStash"
                                >
                                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                                  Hủy Lịch (Cancel QStash)
                                </button>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              {onEditEvent && (
                                <button
                                  onClick={() => onEditEvent(item)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                                  title="Chỉnh sửa thông tin"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => setEventToDelete(item)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                title="Xóa vĩnh viễn"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(eventToDelete)}
        title="Xác nhận xóa sự kiện"
        message={`Bạn có chắc chắn muốn xóa "${eventToDelete?.title}" khỏi Second Brain? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa Vĩnh Viễn"
        cancelLabel="Giữ Lại"
        onConfirm={async () => {
          if (eventToDelete) {
            await onDeleteEvent(eventToDelete.id);
            setEventToDelete(null);
          }
        }}
        onCancel={() => setEventToDelete(null)}
      />
    </div>
  );
}
