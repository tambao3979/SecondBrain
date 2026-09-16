"use client";

import React, { useState } from "react";
import { X, Bot, Zap, CheckCircle2 } from "lucide-react";
import { EventType } from "@/lib/types";
import { useToast } from "./Toast";

interface SimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventDispatched: () => Promise<void>;
}

export default function SimulatorModal({
  isOpen,
  onClose,
  onEventDispatched,
}: SimulatorModalProps) {
  const { toast } = useToast();
  const [type, setType] = useState<EventType>("MEETING");
  const [title, setTitle] = useState("Họp chiến lược phát triển Second Brain AI với Hermes");
  const [content, setContent] = useState("🚨 **Cuộc họp quan trọng**: Đánh giá hiệu quả kiến trúc tự động hóa QStash và Telegram Bot.\n\n- Chuẩn bị báo cáo tiến độ\n- Thảo luận nâng cấp AI memory");
  const [minutes, setMinutes] = useState(30);
  const [chatId, setChatId] = useState("123456789");
  const [loading, setLoading] = useState(false);
  const [responseLog, setResponseLog] = useState<any>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResponseLog(null);

    try {
      const res = await fetch("/api/test/simulate-hermes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title,
          formatted_content: content,
          minutes_from_now: minutes,
          pre_reminders: [15, 0],
          telegram_chat_id: chatId,
        }),
      });

      const data = await res.json();
      setResponseLog(data);

      if (data.success) {
        toast({
          type: "success",
          title: "Hermes Agent Đã Bắn API!",
          message: `Sự kiện "${title}" đã được lưu và QStash đã nhận lịch delay.`,
        });
        await onEventDispatched();
      } else {
        toast({
          type: "error",
          title: "Lỗi mô phỏng",
          message: data.error || "Không thể thực hiện mô phỏng",
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
        className="bg-slate-950 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto animate-modal-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Hermes Agent Simulator</h3>
              <p className="text-[11px] text-slate-400">Mô phỏng Hermes AI gọi API tạo lịch hẹn & pre-reminders</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSimulate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Loại sự kiện</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as EventType)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="MEETING">MEETING (Cuộc họp)</option>
                <option value="TASK">TASK (Nhiệm vụ)</option>
                <option value="REMINDER">REMINDER (Nhắc nhở)</option>
                <option value="NOTE">NOTE (Ghi chú)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Thời gian (sau X phút)</label>
              <input
                type="number"
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
                min={1}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Tiêu đề</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Nội dung Markdown</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-purple-500 leading-relaxed"
              required
            />
          </div>

          <div className="p-3 bg-purple-950/20 border border-purple-500/30 rounded-xl text-xs text-purple-300 flex items-center justify-between">
            <span>Pre-reminders hẹn giờ:</span>
            <span className="font-mono font-bold">[15, 0] (15p trước & Lúc bắt đầu)</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Hermes đang điều phối...</span>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Bắn Lệnh API Ngay</span>
              </>
            )}
          </button>
        </form>

        {responseLog && (
          <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300">
            <div className="flex items-center gap-1.5 mb-1 text-xs font-bold text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> Phản hồi từ Backend
            </div>
            <pre className="text-slate-400 overflow-x-auto max-h-32">
              {JSON.stringify(responseLog, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
