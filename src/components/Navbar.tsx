"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  Brain,
  Plus,
  Bot,
  Send,
  Search,
  Sparkles,
  Layers,
  Calendar as CalendarIcon,
  CheckSquare,
  FileText,
  Radio,
  X,
} from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenCreateModal: () => void;
  onOpenSimulator: () => void;
  onOpenTelegramTest: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenCommandPalette?: () => void;
  statsCount?: {
    tasks: number;
    reminders: number;
  };
}

export default function Navbar({
  activeTab,
  setActiveTab,
  onOpenCreateModal,
  onOpenSimulator,
  onOpenTelegramTest,
  searchQuery,
  setSearchQuery,
  onOpenCommandPalette,
  statsCount,
}: NavbarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  // Global Ctrl + K / Cmd + K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (onOpenCommandPalette) {
          onOpenCommandPalette();
        } else if (window.innerWidth < 768) {
          setIsMobileSearchOpen(true);
          setTimeout(() => mobileInputRef.current?.focus(), 100);
        } else {
          inputRef.current?.focus();
          inputRef.current?.select();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Agent status */}
          <div className="flex items-center gap-4">
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => setActiveTab("overview")}
              title="Về trang tổng quan"
            >
              <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 shadow-lg shadow-purple-950/50 group-hover:scale-105 transition-transform">
                <Brain className="w-5 h-5 text-white" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
                    Second Brain
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30">
                      Hermes AI
                    </span>
                  </h1>
                </div>
                <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                  Timeline • Calendar • Tasks • Reminders
                </p>
              </div>
            </div>

            {/* Hermes status badge */}
            <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-mono text-[11px] text-slate-300">QStash Webhook: READY</span>
            </div>
          </div>

          {/* Desktop Search bar */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setSearchQuery("");
                    inputRef.current?.blur();
                  }
                }}
                placeholder="Tìm kiếm nhiệm vụ, sự kiện, ghi chú... (Ctrl K)"
                className="w-full pl-9 pr-16 py-2 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
              />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded-md transition-colors"
                  title="Xóa tìm kiếm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenCommandPalette}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2 py-0.5 rounded-lg font-mono border border-slate-700 transition-colors cursor-pointer"
                  title="Mở Command Palette (Ctrl K)"
                >
                  Ctrl K
                </button>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Mobile search toggle */}
            <button
              onClick={() => {
                setIsMobileSearchOpen(!isMobileSearchOpen);
                if (!isMobileSearchOpen) {
                  setTimeout(() => mobileInputRef.current?.focus(), 100);
                }
              }}
              className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
              title="Tìm kiếm"
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenSimulator}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-900/30 to-indigo-900/30 hover:from-purple-900/50 hover:to-indigo-900/50 text-purple-200 border border-purple-500/30 hover:border-purple-400 transition-all shadow-sm"
              title="Mô phỏng Hermes Agent gọi API tạo lịch và gửi thông báo"
            >
              <Bot className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Simulator</span>
            </button>

            <button
              onClick={onOpenTelegramTest}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 transition-all shadow-sm"
              title="Test gửi tin nhắn Telegram"
            >
              <Send className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Telegram</span>
            </button>

            <button
              onClick={onOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden xs:inline">Tạo Mới</span>
            </button>
          </div>
        </div>

        {/* Mobile search bar dropdown */}
        {isMobileSearchOpen && (
          <div className="md:hidden pb-3 pt-1 animate-in fade-in">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={mobileInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm nhiệm vụ, sự kiện, ghi chú..."
                className="w-full pl-9 pr-9 py-2 rounded-xl bg-slate-900 border border-indigo-500/50 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                onClick={() => {
                  setSearchQuery("");
                  setIsMobileSearchOpen(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation Bar (Desktop & Tablet) */}
        <nav className="flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-800/60 text-sm no-scrollbar">
          {[
            { id: "overview", label: "Tổng quan", icon: Sparkles },
            { id: "timeline", label: "Timeline", icon: Layers },
            { id: "calendar", label: "Lịch (Calendar)", icon: CalendarIcon },
            {
              id: "tasks",
              label: "Tasks",
              icon: CheckSquare,
              badge: statsCount?.tasks ? String(statsCount.tasks) : undefined,
            },
            { id: "notes", label: "Ghi chú (Notes)", icon: FileText },
            {
              id: "hermes",
              label: "Hermes & Telegram Hub",
              icon: Radio,
              badge: statsCount?.reminders ? `${statsCount.reminders} Reminders` : undefined,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-slate-800/90 text-white shadow-inner border border-slate-700/80"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-indigo-400" : "text-slate-500"}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isActive
                        ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
