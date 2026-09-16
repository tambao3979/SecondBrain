"use client";

import React, { useState, useMemo } from "react";
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  LayoutGrid,
  List,
  Clock,
  Sparkles,
  Edit3,
  Search,
  Filter,
  Flame,
  AlertCircle,
} from "lucide-react";
import { EventItem } from "@/lib/types";
import { formatDate, getRelativeTime } from "@/lib/utils";
import RichMarkdown from "./RichMarkdown";
import ConfirmModal from "./ConfirmModal";

interface TasksViewProps {
  events: EventItem[];
  onToggleTask: (id: string) => Promise<void>;
  onDeleteEvent: (id: string) => Promise<void>;
  onEditEvent?: (event: EventItem) => void;
  onOpenCreateModal: () => void;
}

export default function TasksView({
  events,
  onToggleTask,
  onDeleteEvent,
  onEditEvent,
  onOpenCreateModal,
}: TasksViewProps) {
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [searchTask, setSearchTask] = useState<string>("");
  const [eventToDelete, setEventToDelete] = useState<EventItem | null>(null);

  // Helper to determine priority
  const getTaskPriority = (t: EventItem): "high" | "medium" | "low" => {
    const text = (t.title + " " + t.formatted_content).toLowerCase();
    if (text.includes("gấp") || text.includes("khẩn cấp") || text.includes("high") || text.includes("🚨") || text.includes("critical")) {
      return "high";
    }
    if (text.includes("quan trọng") || text.includes("medium") || text.includes("sớm") || text.includes("⚡")) {
      return "medium";
    }
    return "low";
  };

  const allTasks = useMemo(() => events.filter((e) => e.type === "TASK"), [events]);
  const pendingTasksCount = allTasks.filter((t) => t.status === "PENDING").length;
  const completedTasksCount = allTasks.filter((t) => t.status === "SENT").length;
  const progressPercent = allTasks.length > 0 ? Math.round((completedTasksCount / allTasks.length) * 100) : 0;

  const filteredTasks = useMemo(() => {
    return allTasks.filter((t) => {
      // Status filter
      if (filter === "pending" && t.status !== "PENDING") return false;
      if (filter === "completed" && t.status !== "SENT") return false;

      // Priority filter
      const p = getTaskPriority(t);
      if (priorityFilter !== "all" && p !== priorityFilter) return false;

      // Search keyword
      if (searchTask.trim()) {
        const q = searchTask.toLowerCase();
        return t.title.toLowerCase().includes(q) || t.formatted_content.toLowerCase().includes(q);
      }

      return true;
    });
  }, [allTasks, filter, priorityFilter, searchTask]);

  const pendingTasks = filteredTasks.filter((t) => t.status === "PENDING");
  const completedTasks = filteredTasks.filter((t) => t.status === "SENT");

  const getPriorityBadge = (p: "high" | "medium" | "low") => {
    switch (p) {
      case "high":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/30">
            <Flame className="w-3 h-3 text-rose-400" /> Khẩn cấp
          </span>
        );
      case "medium":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30">
            <AlertCircle className="w-3 h-3 text-amber-400" /> Quan trọng
          </span>
        );
      case "low":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
            Bình thường
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Progress */}
      <div className="p-4 sm:p-5 rounded-3xl glass-panel space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-900 p-1 rounded-2xl border border-slate-800">
              <button
                onClick={() => setViewMode("kanban")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  viewMode === "kanban"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Kanban</span>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  viewMode === "list"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Danh sách</span>
              </button>
            </div>

            {/* Quick Search inside Tasks */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTask}
                onChange={(e) => setSearchTask(e.target.value)}
                placeholder="Lọc task theo từ khóa..."
                className="w-48 sm:w-56 pl-8 pr-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
            {/* Priority filter */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Ưu tiên:
              </span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">Tất cả</option>
                <option value="high">Khẩn cấp</option>
                <option value="medium">Quan trọng</option>
                <option value="low">Bình thường</option>
              </select>
            </div>

            <button
              onClick={onOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/30 transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Task</span>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="pt-2 border-t border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Tiến độ công việc:</span>
            <span className="font-bold text-white font-mono">{completedTasksCount}/{allTasks.length}</span>
            <span className="text-cyan-400 font-semibold font-mono">({progressPercent}%)</span>
          </div>
          <div className="flex-1 max-w-xs h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800/80">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Column: Pending Tasks */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></div>
                <h3 className="text-sm font-bold text-white tracking-tight">Cần làm (Pending)</h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {pendingTasks.length}
                </span>
              </div>
            </div>

            <div className="space-y-3 min-h-[250px]">
              {pendingTasks.length === 0 ? (
                <div className="p-8 text-center rounded-3xl glass-panel text-slate-500 text-xs">
                  Không còn task nào đang chờ xử lý. Tuyệt vời!
                </div>
              ) : (
                pendingTasks.map((t) => {
                  const priority = getTaskPriority(t);
                  return (
                    <div
                      key={t.id}
                      className="glass-panel p-4 rounded-2xl border border-slate-800/80 hover:border-cyan-500/40 transition-all space-y-3 group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <button
                          onClick={() => onToggleTask(t.id)}
                          className="mt-0.5 text-slate-500 hover:text-cyan-400 transition-colors shrink-0"
                          title="Đánh dấu hoàn thành"
                        >
                          <Circle className="w-5 h-5" />
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {getPriorityBadge(priority)}
                          </div>
                          <h4 className="text-sm font-semibold text-white tracking-tight">{t.title}</h4>
                          {t.formatted_content && (
                            <div className="mt-1 text-xs text-slate-300">
                              <RichMarkdown content={t.formatted_content} clampLines={2} />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                        {t.startAt ? (
                          <span className="text-[11px] text-cyan-300 font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {getRelativeTime(t.startAt) || formatDate(t.startAt, "dd/MM HH:mm")}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500">Không đặt hạn</span>
                        )}

                        <div className="flex items-center gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          {onEditEvent && (
                            <button
                              onClick={() => onEditEvent(t)}
                              className="text-slate-400 hover:text-white p-1 rounded transition-colors"
                              title="Chỉnh sửa"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => setEventToDelete(t)}
                            className="text-slate-400 hover:text-rose-400 p-1 rounded transition-colors"
                            title="Xóa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Column: Completed Tasks */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                <h3 className="text-sm font-bold text-white tracking-tight">Đã hoàn thành (Done)</h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {completedTasks.length}
                </span>
              </div>
            </div>

            <div className="space-y-3 min-h-[250px]">
              {completedTasks.length === 0 ? (
                <div className="p-8 text-center rounded-3xl glass-panel text-slate-500 text-xs">
                  Chưa có task nào hoàn thành.
                </div>
              ) : (
                completedTasks.map((t) => (
                  <div
                    key={t.id}
                    className="glass-panel p-4 rounded-2xl border border-slate-800/50 opacity-70 hover:opacity-100 transition-all space-y-3 group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        onClick={() => onToggleTask(t.id)}
                        className="mt-0.5 text-emerald-400 hover:text-slate-400 transition-colors shrink-0"
                        title="Đánh dấu chưa xong"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-slate-400 line-through tracking-tight">
                          {t.title}
                        </h4>
                        {t.formatted_content && (
                          <div className="mt-1 text-xs text-slate-500">
                            <RichMarkdown content={t.formatted_content} clampLines={1} />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                      <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                        <Sparkles className="w-3 h-3" /> Hoàn tất
                      </span>
                      <div className="flex items-center gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        {onEditEvent && (
                          <button
                            onClick={() => onEditEvent(t)}
                            className="text-slate-400 hover:text-white p-1 rounded transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => setEventToDelete(t)}
                          className="text-slate-400 hover:text-rose-400 p-1 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* List Mode */
        <div className="space-y-2.5">
          {filteredTasks.length === 0 ? (
            <div className="p-12 text-center rounded-3xl glass-panel text-slate-500 text-xs">
              Không có task nào phù hợp với điều kiện lọc.
            </div>
          ) : (
            filteredTasks.map((t) => {
              const priority = getTaskPriority(t);
              return (
                <div
                  key={t.id}
                  className="glass-panel p-4 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      onClick={() => onToggleTask(t.id)}
                      className={`shrink-0 ${
                        t.status === "SENT" ? "text-emerald-400" : "text-slate-500 hover:text-cyan-400"
                      }`}
                    >
                      {t.status === "SENT" ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {getPriorityBadge(priority)}
                        <h4
                          className={`text-sm font-semibold truncate ${
                            t.status === "SENT" ? "line-through text-slate-500" : "text-white"
                          }`}
                        >
                          {t.title}
                        </h4>
                      </div>
                      {t.formatted_content && (
                        <p className="text-xs text-slate-400 truncate mt-0.5">{t.formatted_content}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {t.startAt && (
                      <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                        {formatDate(t.startAt, "dd/MM HH:mm")}
                      </span>
                    )}
                    <div className="flex items-center gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      {onEditEvent && (
                        <button
                          onClick={() => onEditEvent(t)}
                          className="text-slate-400 hover:text-white p-1 rounded"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => setEventToDelete(t)}
                        className="text-slate-400 hover:text-rose-400 p-1 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={Boolean(eventToDelete)}
        title="Xác nhận xóa nhiệm vụ"
        message={`Bạn có chắc muốn xóa task "${eventToDelete?.title}"?`}
        confirmLabel="Xóa"
        cancelLabel="Hủy"
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
