"use client";

import React, { useState, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  CheckCircle2,
  XCircle,
  Edit3,
  Trash2,
  Calendar as CalendarIcon,
} from "lucide-react";
import { EventItem, EventType } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import RichMarkdown from "./RichMarkdown";
import ConfirmModal from "./ConfirmModal";

interface CalendarViewProps {
  events: EventItem[];
  onOpenCreateModal: (defaultDate?: Date) => void;
  onCancelEvent: (id: string) => Promise<void>;
  onToggleTask: (id: string) => Promise<void>;
  onEditEvent?: (event: EventItem) => void;
  onDeleteEvent?: (id: string) => Promise<void>;
}

export default function CalendarView({
  events,
  onOpenCreateModal,
  onCancelEvent,
  onToggleTask,
  onEditEvent,
  onDeleteEvent,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [eventToDelete, setEventToDelete] = useState<EventItem | null>(null);
  const schedulePanelRef = useRef<HTMLDivElement>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // First day of month and total days in month
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sunday
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const monthNames = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  ];

  const daysOfWeek = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  };

  // Helper to check if two dates are same day
  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  // Get events on a specific day
  const getEventsForDay = (date: Date) => {
    return events.filter((e) => {
      if (!e.startAt) return false;
      const d = new Date(e.startAt);
      return isSameDay(d, date);
    });
  };

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    // On small screens, smoothly scroll to schedule panel
    if (window.innerWidth < 1024 && schedulePanelRef.current) {
      schedulePanelRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const selectedDayEvents = getEventsForDay(selectedDate);

  // Generate 42 calendar grid cells (6 rows x 7 days)
  const calendarCells = [];

  // Previous month trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayNum = prevMonthTotalDays - i;
    const cellDate = new Date(year, month - 1, dayNum);
    calendarCells.push({ date: cellDate, isCurrentMonth: false, dayNum });
  }

  // Current month days
  for (let d = 1; d <= totalDays; d++) {
    const cellDate = new Date(year, month, d);
    calendarCells.push({ date: cellDate, isCurrentMonth: true, dayNum: d });
  }

  // Next month leading days
  const remainingCells = 42 - calendarCells.length;
  for (let d = 1; d <= remainingCells; d++) {
    const cellDate = new Date(year, month + 1, d);
    calendarCells.push({ date: cellDate, isCurrentMonth: false, dayNum: d });
  }

  const getTypeColor = (type: EventType) => {
    switch (type) {
      case "MEETING":
        return "bg-purple-500 text-purple-200 border-purple-400/40";
      case "TASK":
        return "bg-cyan-500 text-cyan-200 border-cyan-400/40";
      case "REMINDER":
        return "bg-amber-500 text-amber-200 border-amber-400/40";
      case "NOTE":
        return "bg-emerald-500 text-emerald-200 border-emerald-400/40";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Main Calendar Grid (8 cols) */}
      <div className="lg:col-span-8 glass-panel p-4 sm:p-6 rounded-3xl">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {monthNames[month]} <span className="text-slate-400 font-normal">{year}</span>
            </h2>
            <button
              onClick={goToToday}
              className="px-2.5 py-1 text-xs font-semibold rounded-xl bg-slate-900 text-slate-300 hover:text-white border border-slate-800 transition-colors shadow-sm"
            >
              Hôm nay
            </button>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Tháng trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Tháng sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400 mb-2">
          {daysOfWeek.map((day) => (
            <div key={day} className="py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Month grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarCells.map((cell, idx) => {
            const dayEvents = getEventsForDay(cell.date);
            const isToday = isSameDay(cell.date, new Date());
            const isSelected = isSameDay(cell.date, selectedDate);

            return (
              <div
                key={idx}
                onClick={() => handleSelectDate(cell.date)}
                className={`min-h-[54px] sm:min-h-[88px] p-1.5 sm:p-2 rounded-xl sm:rounded-2xl cursor-pointer transition-all border flex flex-col justify-between ${
                  isSelected
                    ? "bg-indigo-950/50 border-indigo-500 shadow-md shadow-indigo-950/60 ring-1 ring-indigo-500/50"
                    : isToday
                    ? "bg-slate-900/90 border-slate-700"
                    : cell.isCurrentMonth
                    ? "bg-slate-950/40 border-slate-800/60 hover:bg-slate-900/60 hover:border-slate-700"
                    : "bg-slate-950/10 border-slate-900/30 text-slate-600 opacity-40 hover:opacity-70"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full ${
                      isToday
                        ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/40"
                        : isSelected
                        ? "text-indigo-300 font-bold"
                        : cell.isCurrentMonth
                        ? "text-slate-300"
                        : "text-slate-600"
                    }`}
                  >
                    {cell.dayNum}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="text-[10px] font-mono text-indigo-300 font-semibold hidden sm:inline">
                      {dayEvents.length}
                    </span>
                  )}
                </div>

                {/* Mobile View: Event colorful dots */}
                <div className="flex sm:hidden items-center justify-center gap-0.5 mt-1 flex-wrap">
                  {dayEvents.slice(0, 3).map((ev) => (
                    <span
                      key={ev.id}
                      className={`w-1.5 h-1.5 rounded-full ${
                        ev.type === "MEETING"
                          ? "bg-purple-400"
                          : ev.type === "TASK"
                          ? "bg-cyan-400"
                          : ev.type === "REMINDER"
                          ? "bg-amber-400"
                          : "bg-emerald-400"
                      }`}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-[8px] text-slate-400 font-mono">+</span>
                  )}
                </div>

                {/* Desktop View: Event chips with title */}
                <div className="hidden sm:block mt-1 space-y-1 overflow-hidden">
                  {dayEvents.slice(0, 2).map((ev) => (
                    <div
                      key={ev.id}
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded truncate border ${getTypeColor(
                        ev.type
                      )} bg-opacity-20`}
                    >
                      {ev.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-[9px] text-slate-400 font-mono pl-1">
                      +{dayEvents.length - 2} khác
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Schedule Panel (4 cols) */}
      <div
        ref={schedulePanelRef}
        className="lg:col-span-4 glass-panel p-5 sm:p-6 rounded-3xl flex flex-col h-full"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
              <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" /> Lịch trình ngày
            </span>
            <h3 className="text-base font-bold text-white tracking-tight mt-0.5">
              {formatDate(selectedDate, "dd/MM/yyyy")}
            </h3>
          </div>
          <button
            onClick={() => onOpenCreateModal(selectedDate)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm</span>
          </button>
        </div>

        {/* Events for selected day */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1 max-h-[500px]">
          {selectedDayEvents.length === 0 ? (
            <div className="text-center py-14 text-slate-500 text-xs">
              Chưa có lịch hẹn hay công việc nào trong ngày này.
            </div>
          ) : (
            selectedDayEvents.map((ev) => (
              <div
                key={ev.id}
                className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getTypeColor(
                      ev.type
                    )} bg-opacity-20`}
                  >
                    {ev.type}
                  </span>
                  {ev.startAt && (
                    <span className="text-xs text-slate-300 font-mono flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {formatDate(ev.startAt, "HH:mm")}
                      {ev.endAt && ` - ${formatDate(ev.endAt, "HH:mm")}`}
                    </span>
                  )}
                </div>

                <h4
                  className={`text-sm font-semibold text-white ${
                    ev.status === "SENT" && ev.type === "TASK" ? "line-through text-slate-500" : ""
                  }`}
                >
                  {ev.title}
                </h4>

                <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/50">
                  <RichMarkdown content={ev.formatted_content} clampLines={2} />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                  <div>
                    {ev.type === "TASK" ? (
                      <button
                        onClick={() => onToggleTask(ev.id)}
                        className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {ev.status === "SENT" ? "Làm lại" : "Hoàn thành"}
                      </button>
                    ) : ev.status === "PENDING" ? (
                      <button
                        onClick={() => onCancelEvent(ev.id)}
                        className="text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Hủy hẹn
                      </button>
                    ) : (
                      <span className="text-slate-500 text-[11px] font-mono">{ev.status}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {onEditEvent && (
                      <button
                        onClick={() => onEditEvent(ev)}
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onDeleteEvent && (
                      <button
                        onClick={() => setEventToDelete(ev)}
                        className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={Boolean(eventToDelete)}
        title="Xác nhận xóa sự kiện"
        message={`Bạn có chắc muốn xóa "${eventToDelete?.title}" khỏi lịch?`}
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        onConfirm={async () => {
          if (eventToDelete && onDeleteEvent) {
            await onDeleteEvent(eventToDelete.id);
            setEventToDelete(null);
          }
        }}
        onCancel={() => setEventToDelete(null)}
      />
    </div>
  );
}
