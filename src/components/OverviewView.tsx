"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Clock,
  CheckCircle2,
  Calendar,
  Bot,
  Send,
  Plus,
  ArrowRight,
  ShieldCheck,
  Zap,
  Edit3,
} from "lucide-react";
import { EventItem, DashboardStats } from "@/lib/types";
import { formatDate, getRelativeTime } from "@/lib/utils";
import StatsCards from "./StatsCards";
import { useToast } from "./Toast";
import RichMarkdown from "./RichMarkdown";

interface OverviewViewProps {
  events: EventItem[];
  stats: DashboardStats;
  onNavigateTab: (tab: string) => void;
  onOpenCreateModal: () => void;
  onOpenSimulator: () => void;
  onOpenTelegramTest: () => void;
  onToggleTask: (id: string) => Promise<void>;
  onCancelEvent: (id: string) => Promise<void>;
  onEditEvent?: (event: EventItem) => void;
  onEventCreated?: () => Promise<void>;
}

export default function OverviewView({
  events,
  stats,
  onNavigateTab,
  onOpenCreateModal,
  onOpenSimulator,
  onOpenTelegramTest,
  onToggleTask,
  onCancelEvent,
  onEditEvent,
  onEventCreated,
}: OverviewViewProps) {
  const { toast } = useToast();

  // Gemini AI Natural Language Input State
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const handleAiQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/parse-and-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiPrompt }),
      });

      const data = await res.json();
      if (data.success) {
        toast({
          type: "success",
          title: "Gemini AI Đã Lên Lịch!",
          message: data.parsed?.summary_for_user || `Đã tạo: "${data.parsed?.title}"`,
        });
        setAiPrompt("");
        if (onEventCreated) await onEventCreated();
      } else {
        toast({
          type: "error",
          title: "Lỗi phân tích",
          message: data.error || "Không thể phân tích câu nói",
        });
      }
    } catch (err: unknown) {
      toast({ type: "error", title: "Lỗi kết nối", message: String(err) });
    } finally {
      setAiLoading(false);
    }
  };

  // Find next upcoming event
  const upcomingEvents = events
    .filter((e) => e.startAt && new Date(e.startAt).getTime() > Date.now() && e.status === "PENDING")
    .sort((a, b) => new Date(a.startAt!).getTime() - new Date(b.startAt!).getTime());

  const nextEvent = upcomingEvents[0];

  // Active tasks
  const pendingTasks = events.filter((e) => e.type === "TASK" && e.status === "PENDING").slice(0, 5);

  // Recent 5 events
  const recentTimeline = events.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Gemini AI Natural Language Assistant Bar */}
      <div className="glass-panel p-5 rounded-3xl relative overflow-hidden border border-indigo-500/30 shadow-xl shadow-indigo-950/30">
        <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-indigo-500/15 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-md shadow-indigo-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                Trợ Lý AI Gemini Quick Input
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Google Gemini Flash
                </span>
              </h3>
            </div>
          </div>
          <span className="text-[11px] text-slate-400">
            Nhập câu tự nhiên tiếng Việt bất kỳ, Gemini sẽ tự trích xuất ngày giờ & lên lịch
          </span>
        </div>

        <form onSubmit={handleAiQuickSubmit} className="relative flex items-center gap-2">
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Ví dụ: 'Mai 3h chiều họp team Product bàn roadmap Q4, nhắc trước 15p'..."
            className="w-full pl-4 pr-32 py-3 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
          />
          <button
            type="submit"
            disabled={aiLoading || !aiPrompt.trim()}
            className="absolute right-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {aiLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span className="hidden sm:inline">Đang phân tích...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>Lên Lịch AI</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
          <span className="text-slate-500">Gợi ý thử:</span>
          {[
            "Mai 3h chiều họp team Product, nhắc trước 15p",
            "Nhắc tôi 8h tối nay uống thuốc",
            "Task: Tối ưu database Prisma trước thứ 6",
            "Note: Ý tưởng nâng cấp bộ nhớ Second Brain",
          ].map((suggestion, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setAiPrompt(suggestion)}
              className="px-2.5 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors text-[10px]"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <StatsCards stats={stats} onNavigateTab={onNavigateTab} />

      {/* Hero Next Event Card & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Next Event Spotlight (7 cols) */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between border border-slate-800/80">
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 font-mono">
                  Sự kiện tiếp theo sắp tới
                </span>
              </div>
              {nextEvent && (
                <span className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1 rounded-xl border border-slate-800">
                  {getRelativeTime(nextEvent.startAt)}
                </span>
              )}
            </div>

            {nextEvent ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      nextEvent.type === "MEETING"
                        ? "bg-purple-500/10 text-purple-300 border border-purple-500/30"
                        : "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30"
                    }`}
                  >
                    {nextEvent.type}
                  </span>
                  <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(nextEvent.startAt)}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white tracking-tight">{nextEvent.title}</h3>
                <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/60 font-sans">
                  <RichMarkdown content={nextEvent.formatted_content} clampLines={3} />
                </div>
              </div>
            ) : (
              <div className="py-6 text-slate-400 text-sm">
                Hiện không có sự kiện nào sắp tới trong lịch. Bạn có thể bấm nút tạo mới bên dưới.
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
            <button
              onClick={() => onNavigateTab("timeline")}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors"
            >
              Xem toàn bộ Timeline <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-3">
              {nextEvent && onEditEvent && (
                <button
                  onClick={() => onEditEvent(nextEvent)}
                  className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Sửa
                </button>
              )}
              {nextEvent && (
                <button
                  onClick={() => onCancelEvent(nextEvent.id)}
                  className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors"
                >
                  Hủy lịch này
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions & System Status (5 cols) */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-3xl flex flex-col justify-between border border-slate-800/80">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" /> Thao tác nhanh & Tích hợp
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> ONLINE
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onOpenCreateModal}
                className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-850 transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Plus className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-white">Tạo mới</div>
                <div className="text-[10px] text-slate-400">Meeting, Task, Note</div>
              </button>

              <button
                onClick={onOpenSimulator}
                className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-850 transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-white">Hermes Simulator</div>
                <div className="text-[10px] text-slate-400">Test API & QStash</div>
              </button>

              <button
                onClick={onOpenTelegramTest}
                className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-850 transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Send className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-white">Test Telegram</div>
                <div className="text-[10px] text-slate-400">Gửi thử thông báo</div>
              </button>

              <button
                onClick={() => onNavigateTab("calendar")}
                className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-850 transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-white">Mở Calendar</div>
                <div className="text-[10px] text-slate-400">Lịch tháng chi tiết</div>
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Hermes Agent API Key</span>
            <code className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-purple-300 font-mono">
              x-api-key: protected
            </code>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Recent Timeline & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Timeline (7 cols) */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-400" /> Dòng thời gian gần đây
            </h3>
            <button
              onClick={() => onNavigateTab("timeline")}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
            >
              Xem tất cả
            </button>
          </div>

          <div className="space-y-3">
            {recentTimeline.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">Chưa có sự kiện nào.</div>
            ) : (
              recentTimeline.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${
                        item.type === "MEETING"
                          ? "bg-purple-500/10 text-purple-300 border-purple-500/30"
                          : item.type === "TASK"
                          ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/30"
                          : item.type === "NOTE"
                          ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                          : "bg-amber-500/10 text-amber-300 border-amber-500/30"
                      }`}
                    >
                      {item.type}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-white truncate">{item.title}</h4>
                      {item.startAt && (
                        <span className="text-[11px] text-slate-400 font-mono">
                          {formatDate(item.startAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full shrink-0 ${
                      item.status === "SENT"
                        ? "bg-emerald-950/40 text-emerald-400"
                        : item.status === "CANCELLED"
                        ? "bg-rose-950/40 text-rose-400 line-through"
                        : "bg-amber-950/40 text-amber-400"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pending Tasks Quick List (5 cols) */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" /> Nhiệm vụ cần làm
            </h3>
            <button
              onClick={() => onNavigateTab("tasks")}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300"
            >
              Mở Tasks ({pendingTasks.length})
            </button>
          </div>

          <div className="space-y-2.5">
            {pendingTasks.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                Tất cả nhiệm vụ đã được giải quyết xong!
              </div>
            ) : (
              pendingTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => onToggleTask(t.id)}
                  className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/40 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-4 h-4 rounded-full border border-slate-600 group-hover:border-cyan-400 transition-colors shrink-0"></div>
                    <span className="text-xs font-medium text-slate-200 truncate group-hover:text-white">
                      {t.title}
                    </span>
                  </div>
                  {t.startAt && (
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {getRelativeTime(t.startAt)}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
