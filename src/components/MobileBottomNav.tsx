"use client";

import React from "react";
import {
  Sparkles,
  Layers,
  Calendar as CalendarIcon,
  CheckSquare,
  FileText,
  Radio,
  Plus,
} from "lucide-react";

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenCreateModal: () => void;
  tasksCount?: number;
}

export default function MobileBottomNav({
  activeTab,
  setActiveTab,
  onOpenCreateModal,
  tasksCount,
}: MobileBottomNavProps) {
  const navItems = [
    { id: "overview", label: "Tổng quan", icon: Sparkles },
    { id: "timeline", label: "Timeline", icon: Layers },
    { id: "calendar", label: "Lịch", icon: CalendarIcon },
    { id: "tasks", label: "Tasks", icon: CheckSquare, badge: tasksCount },
    { id: "notes", label: "Ghi chú", icon: FileText },
    { id: "hermes", label: "Hub", icon: Radio },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-2xl border-t border-slate-800/80 px-2 py-1.5 flex items-center justify-around shadow-2xl safe-area-bottom">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all relative ${
              isActive
                ? "text-indigo-400 font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${isActive ? "text-indigo-400 scale-110" : "text-slate-400"} transition-transform`} />
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-1 -right-2 w-3.5 h-3.5 bg-cyan-500 text-white text-[9px] font-mono rounded-full flex items-center justify-center">
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
          </button>
        );
      })}

      {/* Floating Create Button for mobile thumb */}
      <button
        onClick={onOpenCreateModal}
        className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40 active:scale-95 transition-transform ml-1"
        title="Tạo mới"
      >
        <Plus className="w-5 h-5" />
      </button>
    </nav>
  );
}
