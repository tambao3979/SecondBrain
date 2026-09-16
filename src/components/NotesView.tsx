"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Copy,
  Check,
  Trash2,
  Search,
  Pin,
  Edit3,
  BookOpen,
} from "lucide-react";
import { EventItem } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useToast } from "./Toast";
import RichMarkdown from "./RichMarkdown";
import ConfirmModal from "./ConfirmModal";

interface NotesViewProps {
  events: EventItem[];
  onDeleteEvent: (id: string) => Promise<void>;
  onEditEvent?: (event: EventItem) => void;
  onOpenCreateModal: () => void;
}

export default function NotesView({
  events,
  onDeleteEvent,
  onEditEvent,
  onOpenCreateModal,
}: NotesViewProps) {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [noteToDelete, setNoteToDelete] = useState<EventItem | null>(null);

  // Load pinned notes from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("sb_pinned_notes");
      if (saved) setPinnedIds(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, []);

  const togglePin = (id: string) => {
    const next = pinnedIds.includes(id)
      ? pinnedIds.filter((p) => p !== id)
      : [...pinnedIds, id];
    setPinnedIds(next);
    try {
      localStorage.setItem("sb_pinned_notes", JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const notes = events.filter((e) => e.type === "NOTE");

  const filteredNotes = notes
    .filter(
      (n) =>
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.formatted_content.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const isPinnedA = pinnedIds.includes(a.id);
      const isPinnedB = pinnedIds.includes(b.id);
      if (isPinnedA && !isPinnedB) return -1;
      if (!isPinnedA && isPinnedB) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    toast({
      type: "info",
      title: "Đã sao chép Markdown",
      message: "Nội dung ghi chú đã được lưu vào clipboard.",
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-3xl glass-panel">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Lọc ghi chú theo từ khóa hoặc nội dung..."
            className="w-full pl-9 pr-3 py-2 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all shadow-inner"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-xs text-slate-400 font-mono bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            {filteredNotes.length} ghi chú
          </span>
          <button
            onClick={onOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Note</span>
          </button>
        </div>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl glass-panel">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <BookOpen className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-white">Chưa có ghi chú nào</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Ghi lại các ý tưởng, tóm tắt tài liệu hoặc để Hermes Agent tự động đồng bộ vào Second Brain.
          </p>
          <button
            onClick={onOpenCreateModal}
            className="mt-4 px-4 py-2 rounded-2xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25"
          >
            + Tạo Ghi Chú Đầu Tiên
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredNotes.map((note) => {
            const isPinned = pinnedIds.includes(note.id);
            return (
              <div
                key={note.id}
                className={`glass-panel p-5 rounded-3xl border transition-all flex flex-col justify-between group relative overflow-hidden ${
                  isPinned
                    ? "border-emerald-500/50 bg-slate-900/80 shadow-lg shadow-emerald-950/30"
                    : "border-slate-800/80 hover:border-emerald-500/40"
                }`}
              >
                <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all pointer-events-none"></div>

                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                        NOTE
                      </span>
                      {isPinned && (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30">
                          <Pin className="w-2.5 h-2.5 fill-current" /> Đã ghim
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      {formatDate(note.createdAt, "dd/MM/yyyy")}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white tracking-tight group-hover:text-emerald-300 transition-colors">
                    {note.title}
                  </h3>

                  <div className="mt-3 text-xs text-slate-300 leading-relaxed font-sans bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800/50 max-h-60 overflow-y-auto">
                    <RichMarkdown content={note.formatted_content} />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
                  <button
                    onClick={() => handleCopy(note.id, note.formatted_content)}
                    className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-300 transition-colors font-medium"
                  >
                    {copiedId === note.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Đã sao chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Markdown</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => togglePin(note.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isPinned
                          ? "text-emerald-400 bg-emerald-500/10"
                          : "text-slate-400 hover:text-white hover:bg-slate-800"
                      }`}
                      title={isPinned ? "Bỏ ghim" : "Ghim lên đầu"}
                    >
                      <Pin className={`w-3.5 h-3.5 ${isPinned ? "fill-current" : ""}`} />
                    </button>

                    {onEditEvent && (
                      <button
                        onClick={() => onEditEvent(note)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Chỉnh sửa ghi chú"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => setNoteToDelete(note)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Xóa ghi chú"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={Boolean(noteToDelete)}
        title="Xác nhận xóa ghi chú"
        message={`Bạn có chắc muốn xóa ghi chú "${noteToDelete?.title}"?`}
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        onConfirm={async () => {
          if (noteToDelete) {
            await onDeleteEvent(noteToDelete.id);
            setNoteToDelete(null);
          }
        }}
        onCancel={() => setNoteToDelete(null)}
      />
    </div>
  );
}
