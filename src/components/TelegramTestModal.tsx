"use client";

import React, { useState } from "react";
import { X, Send, CheckCircle2, AlertCircle, Bot } from "lucide-react";
import { useToast } from "./Toast";

interface TelegramTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TelegramTestModal({ isOpen, onClose }: TelegramTestModalProps) {
  const { toast } = useToast();
  const [chatId, setChatId] = useState("123456789");
  const [message, setMessage] = useState("🚀 *Kiểm tra kết nối Telegram Bot*: Second Brain đã sẵn sàng nhận lệnh từ Hermes Agent!");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/test/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, message }),
      });
      const data = await res.json();
      setResult(data);

      if (data.success) {
        toast({
          type: "success",
          title: data.simulated ? "Mô phỏng gửi Telegram" : "Đã gửi Telegram thành công!",
          message: data.simulated
            ? "Tin nhắn đã mô phỏng thành công (chưa cấu hình bot token thực tế)."
            : `Đã gửi đến chat ID ${chatId}`,
        });
      } else {
        toast({
          type: "error",
          title: "Telegram Bot báo lỗi",
          message: data.error || "Gửi tin nhắn thất bại",
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
        className="bg-slate-950 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-modal-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Kiểm Tra Telegram Bot</h3>
              <p className="text-[11px] text-slate-400">Gửi thông báo thử nghiệm tới Telegram Chat</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Telegram Chat ID
            </label>
            <input
              type="text"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="VD: 123456789"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              required
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Nhắn tin cho @userinfobot trên Telegram để lấy Chat ID của bạn.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Nội dung tin nhắn
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500 leading-relaxed"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl font-semibold text-xs text-white bg-cyan-600 hover:bg-cyan-500 shadow-md shadow-cyan-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Đang gửi tin...</span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Gửi Thử Nghiệm Ngay</span>
              </>
            )}
          </button>
        </form>

        {result && (
          <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300">
            <div className="flex items-center gap-1.5 mb-1 text-xs font-bold text-white">
              {result.success ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Thành công
                </span>
              ) : (
                <span className="text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Thất bại
                </span>
              )}
            </div>
            <pre className="text-slate-400 overflow-x-auto max-h-28">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
