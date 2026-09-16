"use client";

import React, { useState, useEffect } from "react";
import { X, Edit3, Calendar, Clock } from "lucide-react";
import { EventItem, EventType } from "@/lib/types";
import { useToast } from "./Toast";

interface EditEventModalProps {
  isOpen: boolean;
  event: EventItem | null;
  onClose: () => void;
  onEventUpdated: () => Promise<void>;
}

export default function EditEventModal({
  isOpen,
  event,
  onClose,
  onEventUpdated,
}: EditEventModalProps) {
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<EventType>("NOTE");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("12:00");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && event) {
      setTitle(event.title || "");
      setContent(event.formatted_content || "");
      setType(event.type || "NOTE");

      if (event.startAt) {
        const d = new Date(event.startAt);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        setStartDate(`${yyyy}-${mm}-${dd}`);

        const hh = String(d.getHours()).padStart(2, "0");
        const min = String(d.getMinutes()).padStart(2, "0");
        setStartTime(`${hh}:${min}`);
      } else {
        setStartDate("");
        setStartTime("12:00");
      }
    }
  }, [isOpen, event]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !event) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({ type: "error", title: "Lỗi", message: "Tiêu đề không được để trống." });
      return;
    }

    setLoading(true);
    try {
      let startAtIso: string | null = null;
      if (type !== "NOTE" && startDate && startTime) {
        startAtIso = new Date(`${startDate}T${startTime}:00`).toISOString();
      }

      const res = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE",
          title,
          formatted_content: content,
          type,
          startAt: startAtIso,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast({
          type: "success",
          title: "Đã cập nhật",
          message: `Mục "${title}" đã được lưu thay đổi.`,
        });
        await onEventUpdated();
        onClose();
      } else {
        toast({
          type: "error",
          title: "Lỗi cập nhật",
          message: data.error || "Không thể cập nhật mục này",
        });
      }
    } catch (err: unknown) {
      toast({ type: "error", title: "Lỗi mạng", message: String(err) });
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
        className="bg-slate-950 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-modal-pop relative space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Chỉnh Sửa Thông Tin</h3>
              <p className="text-[11px] text-slate-400">Cập nhật tiêu đề, nội dung Markdown và thời gian</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Loại mục</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as EventType)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="MEETING">MEETING (Cuộc họp)</option>
                <option value="TASK">TASK (Nhiệm vụ)</option>
                <option value="NOTE">NOTE (Ghi chú)</option>
                <option value="REMINDER">REMINDER (Nhắc nhở)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">ID</label>
              <div className="px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-xs font-mono text-slate-400 truncate">
                {event.id}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Tiêu đề <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Nội dung Markdown
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed"
            />
          </div>

          {type !== "NOTE" && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Ngày
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Giờ
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
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
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {loading ? "Đang lưu..." : "Lưu Thay Đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
