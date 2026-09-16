"use client";

import React from "react";
import { CheckCircle2, Calendar, BellRing, FileText, ArrowUpRight, ShieldCheck } from "lucide-react";
import { DashboardStats } from "@/lib/types";

interface StatsCardsProps {
  stats: DashboardStats;
  onNavigateTab: (tab: string) => void;
}

export default function StatsCards({ stats, onNavigateTab }: StatsCardsProps) {
  const totalTasks = stats.activeTasks + stats.completedTasks;
  const taskProgress = totalTasks > 0 ? Math.round((stats.completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Active Tasks Card */}
      <div
        onClick={() => onNavigateTab("tasks")}
        className="glass-panel-interactive p-4 rounded-2xl cursor-pointer group relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-all"></div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Nhiệm vụ (Tasks)</span>
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white tracking-tight">{stats.activeTasks}</span>
          <span className="text-xs text-slate-400">còn lại / {totalTasks} tổng</span>
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>Tiến độ hoàn thành</span>
            <span className="font-semibold text-cyan-400">{taskProgress}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500 rounded-full"
              style={{ width: `${taskProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Upcoming Meetings / Timeline */}
      <div
        onClick={() => onNavigateTab("timeline")}
        className="glass-panel-interactive p-4 rounded-2xl cursor-pointer group relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all"></div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Cuộc họp & Timeline</span>
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Calendar className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white tracking-tight">{stats.pendingMeetings}</span>
          <span className="text-xs text-slate-400">lịch hẹn sắp diễn ra</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px] text-purple-300/80">
          <span className="flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> Xem chi tiết Timeline
          </span>
          <span className="px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-[10px] text-purple-300">
            Auto Remind
          </span>
        </div>
      </div>

      {/* Scheduled QStash Reminders */}
      <div
        onClick={() => onNavigateTab("hermes")}
        className="glass-panel-interactive p-4 rounded-2xl cursor-pointer group relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all"></div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Nhắc nhở Telegram (QStash)</span>
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <BellRing className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white tracking-tight">{stats.upcomingRemindersCount}</span>
          <span className="text-xs text-slate-400">thông báo đang xếp hàng</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px] text-amber-300/80">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Webhook Idempotency
          </span>
          <span className="font-mono text-[10px] text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
            Serverless
          </span>
        </div>
      </div>

      {/* Notes & Knowledge Cards */}
      <div
        onClick={() => onNavigateTab("notes")}
        className="glass-panel-interactive p-4 rounded-2xl cursor-pointer group relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all"></div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Ghi chú (Second Brain)</span>
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <FileText className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white tracking-tight">{stats.notesCount}</span>
          <span className="text-xs text-slate-400">tài liệu & ghi chép</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px] text-emerald-300/80">
          <span>Hỗ trợ Markdown render</span>
          <span className="font-mono text-[10px] text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
            Hermes Sync
          </span>
        </div>
      </div>
    </div>
  );
}
