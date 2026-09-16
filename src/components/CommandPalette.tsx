"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  Sparkles,
  Layers,
  Calendar as CalendarIcon,
  CheckSquare,
  FileText,
  Radio,
  Plus,
  Bot,
  Send,
  ArrowRight,
  X,
  Clock,
} from "lucide-react";
import { EventItem } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface CommandItem {
  id: string;
  title: string;
  category: string;
  icon: any;
  color: string;
  detail?: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  events: EventItem[];
  onNavigateTab: (tab: string) => void;
  onOpenCreateModal: () => void;
  onOpenSimulator: () => void;
  onOpenTelegramTest: () => void;
  onSelectEvent: (event: EventItem) => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  events,
  onNavigateTab,
  onOpenCreateModal,
  onOpenSimulator,
  onOpenTelegramTest,
  onSelectEvent,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
      // Lock body scroll
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // System navigation commands
  const systemCommands: CommandItem[] = useMemo(() => {
    return [
      {
        id: "cmd-create",
        title: "Tạo mới Meeting, Task hoặc Note...",
        category: "Thao tác nhanh",
        icon: Plus,
        color: "text-indigo-400",
        action: () => {
          onClose();
          onOpenCreateModal();
        },
      },
      {
        id: "cmd-sim",
        title: "Mở Hermes Agent Simulator",
        category: "Thao tác nhanh",
        icon: Bot,
        color: "text-purple-400",
        action: () => {
          onClose();
          onOpenSimulator();
        },
      },
      {
        id: "cmd-tg",
        title: "Kiểm tra gửi tin nhắn Telegram Bot",
        category: "Thao tác nhanh",
        icon: Send,
        color: "text-cyan-400",
        action: () => {
          onClose();
          onOpenTelegramTest();
        },
      },
      {
        id: "nav-overview",
        title: "Đi đến Tổng quan (Overview)",
        category: "Điều hướng",
        icon: Sparkles,
        color: "text-indigo-400",
        action: () => {
          onClose();
          onNavigateTab("overview");
        },
      },
      {
        id: "nav-timeline",
        title: "Đi đến Dòng thời gian (Timeline)",
        category: "Điều hướng",
        icon: Layers,
        color: "text-purple-400",
        action: () => {
          onClose();
          onNavigateTab("timeline");
        },
      },
      {
        id: "nav-calendar",
        title: "Đi đến Lịch tháng (Calendar)",
        category: "Điều hướng",
        icon: CalendarIcon,
        color: "text-emerald-400",
        action: () => {
          onClose();
          onNavigateTab("calendar");
        },
      },
      {
        id: "nav-tasks",
        title: "Đi đến Danh sách Nhiệm vụ (Tasks)",
        category: "Điều hướng",
        icon: CheckSquare,
        color: "text-cyan-400",
        action: () => {
          onClose();
          onNavigateTab("tasks");
        },
      },
      {
        id: "nav-notes",
        title: "Đi đến Ghi chú & Tài liệu (Notes)",
        category: "Điều hướng",
        icon: FileText,
        color: "text-amber-400",
        action: () => {
          onClose();
          onNavigateTab("notes");
        },
      },
      {
        id: "nav-hermes",
        title: "Đi đến Hermes & Telegram Hub",
        category: "Điều hướng",
        icon: Radio,
        color: "text-rose-400",
        action: () => {
          onClose();
          onNavigateTab("hermes");
        },
      },
    ];
  }, [onClose, onOpenCreateModal, onOpenSimulator, onOpenTelegramTest, onNavigateTab]);

  // Filtered items based on query
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();

    const matchedCommands = systemCommands.filter(
      (c) => c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)
    );

    const matchedEvents = q
      ? events.filter(
          (e) =>
            e.title.toLowerCase().includes(q) ||
            e.formatted_content.toLowerCase().includes(q) ||
            e.type.toLowerCase().includes(q)
        ).slice(0, 8)
      : events.slice(0, 5);

    const eventCommands: CommandItem[] = matchedEvents.map((e) => ({
      id: `event-${e.id}`,
      title: e.title,
      category: e.type === "NOTE" ? "Ghi chú" : e.type === "TASK" ? "Nhiệm vụ" : "Lịch hẹn",
      icon: e.type === "NOTE" ? FileText : e.type === "TASK" ? CheckSquare : CalendarIcon,
      color:
        e.type === "MEETING"
          ? "text-purple-400"
          : e.type === "TASK"
          ? "text-cyan-400"
          : e.type === "NOTE"
          ? "text-emerald-400"
          : "text-amber-400",
      detail: e.startAt ? formatDate(e.startAt, "dd/MM HH:mm") : undefined,
      action: () => {
        onClose();
        onSelectEvent(e);
      },
    }));

    return [...matchedCommands, ...eventCommands];
  }, [query, systemCommands, events, onClose, onSelectEvent]);

  // Keyboard navigation inside Command Palette
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1 < filteredItems.length ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filteredItems.length - 1));
      } else if (e.key === "Enter" && filteredItems.length > 0) {
        e.preventDefault();
        const item = filteredItems[selectedIndex];
        if (item) item.action();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 pt-16 sm:pt-24 bg-black/80 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-slate-950/95 border border-slate-800/90 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden animate-modal-pop relative flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-slate-800/80">
          <Search className="w-5 h-5 text-indigo-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Tìm kiếm hoặc gõ lệnh... (vd: tạo mới, họp, task, note)"
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:block text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 ml-2">
            ESC để đóng
          </span>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Không tìm thấy kết quả phù hợp với &quot;{query}&quot;.
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl cursor-pointer transition-all ${
                    isSelected
                      ? "bg-indigo-600/20 text-white border border-indigo-500/40 shadow-sm"
                      : "text-slate-300 hover:bg-slate-900/60 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-indigo-600 text-white" : "bg-slate-900 " + item.color
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate text-white">{item.title}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-2">
                        <span>{item.category}</span>
                        {item.detail && (
                          <span className="text-slate-400 font-mono flex items-center gap-1">
                            • <Clock className="w-3 h-3" /> {item.detail}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <ArrowRight
                    className={`w-4 h-4 shrink-0 transition-opacity ${
                      isSelected ? "opacity-100 text-indigo-400" : "opacity-0"
                    }`}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2 bg-slate-900/60 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ để di chuyển</span>
            <span>↵ để chọn</span>
          </div>
          <span>{filteredItems.length} kết quả</span>
        </div>
      </div>
    </div>
  );
}
