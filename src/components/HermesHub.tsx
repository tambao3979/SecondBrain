"use client";

import React, { useState } from "react";
import {
  Bot,
  Send,
  BellRing,
  Code,
  CheckCircle2,
  Copy,
  Check,
  Zap,
  Radio,
  Clock,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { EventItem, EventType } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useToast } from "./Toast";
import ConfirmModal from "./ConfirmModal";

interface HermesHubProps {
  events: EventItem[];
  onRefresh: () => Promise<void>;
  onCancelEvent: (id: string) => Promise<void>;
}

export default function HermesHub({
  events,
  onRefresh,
  onCancelEvent,
}: HermesHubProps) {
  const { toast } = useToast();
  const [jobToCancel, setJobToCancel] = useState<{ id: string; title: string } | null>(null);

  // Hermes simulator state
  const [simType, setSimType] = useState<EventType>("MEETING");
  const [simTitle, setSimTitle] = useState("Họp chiến lược phát triển Second Brain AI");
  const [simContent, setSimContent] = useState("🚨 **Nhắc nhở cuộc họp**: Thảo luận kiến trúc tích hợp Upstash QStash và Telegram Bot.\n\n- Chuẩn bị báo cáo tiến độ\n- Thảo luận nâng cấp AI memory");
  const [simMinutes, setSimMinutes] = useState<number>(30);
  const [simChatId, setSimChatId] = useState("123456789");
  const [simLoading, setSimLoading] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);

  // Telegram test state
  const [tgChatId, setTgChatId] = useState("123456789");
  const [tgMessage, setTgMessage] = useState("🚀 *Kiểm tra kết nối Telegram Bot*: Second Brain đã sẵn sàng nhận lệnh từ Hermes Agent!");
  const [tgLoading, setTgLoading] = useState(false);

  // Copy snippet state
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // Collect all scheduled reminders from events
  const allReminders = events.flatMap((e) =>
    (e.reminders || []).map((r) => ({
      ...r,
      eventTitle: e.title,
      eventType: e.type,
    }))
  );

  const pendingReminders = allReminders.filter((r) => r.status === "PENDING");

  const handleSimulateHermes = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimLoading(true);
    setSimResult(null);

    try {
      const res = await fetch("/api/test/simulate-hermes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: simType,
          title: simTitle,
          formatted_content: simContent,
          minutes_from_now: simMinutes,
          pre_reminders: [15, 0],
          telegram_chat_id: simChatId,
        }),
      });

      const data = await res.json();
      setSimResult(data);

      if (data.success) {
        toast({
          type: "success",
          title: "Hermes Event Dispatched!",
          message: `Sự kiện "${simTitle}" đã được tạo và lên lịch QStash thành công.`,
        });
        await onRefresh();
      } else {
        toast({
          type: "error",
          title: "Lỗi tạo sự kiện",
          message: data.error || "Không thể mô phỏng sự kiện",
        });
      }
    } catch (err: unknown) {
      toast({
        type: "error",
        title: "Lỗi kết nối",
        message: String(err),
      });
    } finally {
      setSimLoading(false);
    }
  };

  const handleTestTelegram = async (e: React.FormEvent) => {
    e.preventDefault();
    setTgLoading(true);

    try {
      const res = await fetch("/api/test/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: tgChatId,
          message: tgMessage,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast({
          type: "success",
          title: data.simulated ? "Mô phỏng gửi tin Telegram" : "Đã gửi Telegram thành công!",
          message: data.simulated
            ? "Đã mô phỏng gửi thành công (chưa cấu hình TELEGRAM_BOT_TOKEN trong .env)."
            : `Đã gửi tin nhắn tới Telegram Chat ID ${tgChatId}.`,
        });
      } else {
        toast({
          type: "error",
          title: "Telegram Bot báo lỗi",
          message: data.error || "Không thể gửi tin nhắn Telegram",
        });
      }
    } catch (err: unknown) {
      toast({
        type: "error",
        title: "Lỗi mạng",
        message: String(err),
      });
    } finally {
      setTgLoading(false);
    }
  };

  const curlSnippet = `curl -X POST "${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/api/hermes/events" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: hermes-secret-api-key-2026" \\
  -d '{
    "telegram_chat_id": "${simChatId}",
    "type": "MEETING",
    "title": "Họp chiến lược Product",
    "formatted_content": "🚨 **Nhắc nhở cuộc họp**...",
    "start_at": "${new Date(Date.now() + 1800000).toISOString()}",
    "pre_reminders_minutes": [15, 0]
  }'`;

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(curlSnippet);
    setCopiedSnippet(true);
    toast({
      type: "info",
      title: "Đã sao chép cURL",
      message: "Bạn có thể dán vào terminal hoặc cấu hình trong Hermes Agent.",
    });
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl glass-panel relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-purple-600/10 via-indigo-600/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Bot className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Hermes Agent & Telegram Webhook Hub
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse" /> LIVE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Cổng điều khiển kết nối giữa Hermes Agent (AI bên ngoài), Upstash QStash (Serverless delayed webhook) và Telegram Bot tự động.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
              <span className="text-slate-500 block text-[10px] uppercase font-mono">QStash Scheduled</span>
              <span className="text-white font-bold font-mono">{pendingReminders.length} nhắc nhở</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
              <span className="text-slate-500 block text-[10px] uppercase font-mono">X-API-KEY</span>
              <span className="text-emerald-400 font-mono">PROTECTED</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Hermes Agent Simulator */}
        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-400" />
              <h3 className="text-base font-bold text-white tracking-tight">
                Hermes Agent Simulator
              </h3>
            </div>
            <span className="text-[11px] text-purple-300 font-mono bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
              POST /api/hermes/events
            </span>
          </div>

          <form onSubmit={handleSimulateHermes} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Loại sự kiện (Type)
                </label>
                <select
                  value={simType}
                  onChange={(e) => setSimType(e.target.value as EventType)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="MEETING">MEETING (Cuộc họp)</option>
                  <option value="TASK">TASK (Nhiệm vụ)</option>
                  <option value="REMINDER">REMINDER (Nhắc nhở)</option>
                  <option value="NOTE">NOTE (Ghi chú)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Telegram Chat ID
                </label>
                <input
                  type="text"
                  value={simChatId}
                  onChange={(e) => setSimChatId(e.target.value)}
                  placeholder="123456789"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Tiêu đề (Title)
              </label>
              <input
                type="text"
                value={simTitle}
                onChange={(e) => setSimTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Nội dung Markdown (Formatted Content)
              </label>
              <textarea
                value={simContent}
                onChange={(e) => setSimContent(e.target.value)}
                rows={3}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-mono leading-relaxed"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Thời gian bắt đầu (sau X phút)
                </label>
                <input
                  type="number"
                  value={simMinutes}
                  onChange={(e) => setSimMinutes(Number(e.target.value))}
                  min={1}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Mốc nhắc nhở trước (phút)
                </label>
                <div className="flex items-center h-[38px] px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-purple-300">
                  [15, 0] (15p trước & lúc bắt đầu)
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={simLoading}
              className="w-full py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {simLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Hermes Agent đang gọi API...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Mô Phỏng Hermes Agent Gọi API</span>
                </>
              )}
            </button>
          </form>

          {/* Result JSON Inspector */}
          {simResult && (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Phản hồi từ Server (200 OK)
                </span>
                <span>{new Date().toLocaleTimeString()}</span>
              </div>
              <pre className="text-slate-300 overflow-x-auto max-h-40 text-[11px]">
                {JSON.stringify(simResult, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Right Column: Telegram Tester & Integration Specs */}
        <div className="space-y-6">
          {/* Telegram Bot Live Tester */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white tracking-tight">
                  Kiểm tra gửi Telegram Bot
                </h3>
              </div>
              <span className="text-[11px] text-cyan-300 font-mono bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                Direct Telegram API
              </span>
            </div>

            <form onSubmit={handleTestTelegram} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Telegram Chat ID nhận tin
                </label>
                <input
                  type="text"
                  value={tgChatId}
                  onChange={(e) => setTgChatId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  placeholder="ID chat Telegram (ví dụ: 123456789)"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Nội dung tin nhắn test
                </label>
                <textarea
                  value={tgMessage}
                  onChange={(e) => setTgMessage(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={tgLoading}
                className="w-full py-2 rounded-xl font-semibold text-xs text-white bg-cyan-600 hover:bg-cyan-500 shadow-md shadow-cyan-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {tgLoading ? (
                  <span>Đang gửi tin nhắn...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Gửi Test Telegram Ngay</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* cURL Snippet for Hermes Agent */}
          <div className="glass-panel p-6 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-indigo-400" />
                <h4 className="text-sm font-bold text-white tracking-tight">
                  cURL Snippet cho Hermes Agent
                </h4>
              </div>
              <button
                onClick={handleCopySnippet}
                className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
              >
                {copiedSnippet ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
              <pre>{curlSnippet}</pre>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                Header <code className="text-slate-200">x-api-key: hermes-secret-api-key-2026</code>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Table: Scheduled QStash Reminders Queue */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BellRing className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Hàng đợi nhắc nhở Upstash QStash (Active Reminders Queue)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {pendingReminders.length} jobs đang chờ bắn Webhook
          </span>
        </div>

        {pendingReminders.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-500">
            Hiện không có tin nhắn nào đang chờ kích hoạt trong hàng đợi QStash.
          </div>
        ) : (
          <div>
            {/* Mobile Card List */}
            <div className="sm:hidden space-y-3">
              {pendingReminders.map((rem) => (
                <div
                  key={rem.id}
                  className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                      {rem.isPreRemind ? "Nhắc trước" : "Đúng giờ"}
                    </span>
                    <span className="text-amber-300 text-xs font-mono flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDate(rem.remindAt)}
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold text-white">{rem.eventTitle}</h4>

                  <div className="text-[11px] font-mono text-slate-500 truncate">
                    Msg ID: {rem.qstashMessageId || "sim-msg-local"}
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex justify-end">
                    <button
                      onClick={() => setJobToCancel({ id: rem.eventId, title: rem.eventTitle })}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-all"
                    >
                      Hủy Webhook Job
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-400 border-b border-slate-800 font-mono uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Sự kiện</th>
                    <th className="py-2.5 px-3">Loại</th>
                    <th className="py-2.5 px-3">Thời gian bắn Webhook</th>
                    <th className="py-2.5 px-3">QStash Message ID</th>
                    <th className="py-2.5 px-3">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                  {pendingReminders.map((rem) => (
                    <tr key={rem.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-3 font-sans font-medium text-white max-w-xs truncate">
                        {rem.eventTitle}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                          {rem.isPreRemind ? "Nhắc trước" : "Đúng giờ"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-amber-300 flex items-center gap-1.5 pt-4">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDate(rem.remindAt)}
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-[11px]">
                        {rem.qstashMessageId || "sim-msg-local"}
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => setJobToCancel({ id: rem.eventId, title: rem.eventTitle })}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-sans font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-all"
                        >
                          Hủy Job
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(jobToCancel)}
        title="Xác nhận hủy QStash Webhook"
        message={`Bạn có chắc muốn hủy thông báo QStash cho sự kiện "${jobToCancel?.title}"? Tin nhắn tự động sẽ không được gửi qua Telegram.`}
        confirmLabel="Hủy Job"
        cancelLabel="Đóng"
        onConfirm={async () => {
          if (jobToCancel) {
            await onCancelEvent(jobToCancel.id);
            setJobToCancel(null);
          }
        }}
        onCancel={() => setJobToCancel(null)}
      />
    </div>
  );
}
