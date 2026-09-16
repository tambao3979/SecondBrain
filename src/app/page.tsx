"use client";

import React, { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import OverviewView from "@/components/OverviewView";
import TimelineView from "@/components/TimelineView";
import CalendarView from "@/components/CalendarView";
import TasksView from "@/components/TasksView";
import NotesView from "@/components/NotesView";
import HermesHub from "@/components/HermesHub";
import CreateEventModal from "@/components/CreateEventModal";
import EditEventModal from "@/components/EditEventModal";
import CommandPalette from "@/components/CommandPalette";
import SkeletonLoading from "@/components/SkeletonLoading";
import SimulatorModal from "@/components/SimulatorModal";
import TelegramTestModal from "@/components/TelegramTestModal";
import { EventItem, DashboardStats } from "@/lib/types";
import { useToast } from "@/components/Toast";
import { RefreshCw } from "lucide-react";

export default function DashboardPage() {
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<string>("overview");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    activeTasks: 0,
    completedTasks: 0,
    pendingMeetings: 0,
    upcomingRemindersCount: 0,
    notesCount: 0,
    hermesApiCalls: 14,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isTelegramTestOpen, setIsTelegramTestOpen] = useState(false);
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<Date | undefined>(undefined);

  // Global Ctrl + K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Load data from API
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [eventsRes, statsRes] = await Promise.all([
        fetch("/api/events"),
        fetch("/api/stats"),
      ]);

      const eventsData = await eventsRes.json();
      const statsData = await statsRes.json();

      if (eventsData.success && Array.isArray(eventsData.events)) {
        setEvents(eventsData.events);
      }
      if (statsData.success && statsData.stats) {
        setStats(statsData.stats);
      }
    } catch (err) {
      console.error("[Dashboard] Error loading data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Cancel Event action
  const handleCancelEvent = async (id: string) => {
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CANCEL" }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          type: "info",
          title: "Đã hủy sự kiện & QStash Job",
          message: "Lịch hẹn và thông báo nhắc nhở QStash đã được hủy bỏ thành công.",
        });
        await loadData();
      } else {
        toast({
          type: "error",
          title: "Lỗi hủy sự kiện",
          message: data.error || "Không thể hủy sự kiện",
        });
      }
    } catch (err: unknown) {
      toast({ type: "error", title: "Lỗi mạng", message: String(err) });
    }
  };

  // Toggle Task status
  const handleToggleTask = async (id: string) => {
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "TOGGLE_TASK" }),
      });
      const data = await res.json();
      if (data.success) {
        const isDone = data.event?.status === "SENT";
        toast({
          type: "success",
          title: isDone ? "Task hoàn thành!" : "Đã chuyển về Pending",
          message: isDone ? "Tuyệt vời! Bạn đã hoàn thành một nhiệm vụ." : "Nhiệm vụ đã được mở lại.",
        });
        await loadData();
      }
    } catch (err: unknown) {
      toast({ type: "error", title: "Lỗi", message: String(err) });
    }
  };

  // Delete Event
  const handleDeleteEvent = async (id: string) => {
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast({
          type: "info",
          title: "Đã xóa mục",
          message: "Mục đã được loại bỏ khỏi Second Brain.",
        });
        await loadData();
      }
    } catch (err: unknown) {
      toast({ type: "error", title: "Lỗi xóa", message: String(err) });
    }
  };

  // Handle open create modal from calendar day
  const handleOpenCreateWithDate = (date?: Date) => {
    setCalendarSelectedDate(date);
    setIsCreateModalOpen(true);
  };

  // Search filter
  const filteredEvents = events.filter((e) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.title.toLowerCase().includes(q) ||
      e.formatted_content.toLowerCase().includes(q) ||
      e.type.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCreateModal={() => {
          setCalendarSelectedDate(undefined);
          setIsCreateModalOpen(true);
        }}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        onOpenTelegramTest={() => setIsTelegramTestOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        statsCount={{
          tasks: stats.activeTasks,
          reminders: stats.upcomingRemindersCount,
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 sm:pb-8">
        {loading && events.length === 0 ? (
          <SkeletonLoading />
        ) : (
          <div>
            {/* View Switcher */}
            {activeTab === "overview" && (
              <OverviewView
                events={filteredEvents}
                stats={stats}
                onNavigateTab={setActiveTab}
                onOpenCreateModal={() => setIsCreateModalOpen(true)}
                onOpenSimulator={() => setIsSimulatorOpen(true)}
                onOpenTelegramTest={() => setIsTelegramTestOpen(true)}
                onToggleTask={handleToggleTask}
                onCancelEvent={handleCancelEvent}
                onEditEvent={(ev) => setEditingEvent(ev)}
                onEventCreated={loadData}
              />
            )}

            {activeTab === "timeline" && (
              <TimelineView
                events={filteredEvents}
                onCancelEvent={handleCancelEvent}
                onToggleTask={handleToggleTask}
                onDeleteEvent={handleDeleteEvent}
                onEditEvent={(ev) => setEditingEvent(ev)}
                onOpenCreateModal={() => setIsCreateModalOpen(true)}
              />
            )}

            {activeTab === "calendar" && (
              <CalendarView
                events={filteredEvents}
                onOpenCreateModal={handleOpenCreateWithDate}
                onCancelEvent={handleCancelEvent}
                onToggleTask={handleToggleTask}
                onEditEvent={(ev) => setEditingEvent(ev)}
                onDeleteEvent={handleDeleteEvent}
              />
            )}

            {activeTab === "tasks" && (
              <TasksView
                events={filteredEvents}
                onToggleTask={handleToggleTask}
                onDeleteEvent={handleDeleteEvent}
                onEditEvent={(ev) => setEditingEvent(ev)}
                onOpenCreateModal={() => setIsCreateModalOpen(true)}
              />
            )}

            {activeTab === "notes" && (
              <NotesView
                events={filteredEvents}
                onDeleteEvent={handleDeleteEvent}
                onEditEvent={(ev) => setEditingEvent(ev)}
                onOpenCreateModal={() => setIsCreateModalOpen(true)}
              />
            )}

            {activeTab === "hermes" && (
              <HermesHub
                events={events}
                onRefresh={loadData}
                onCancelEvent={handleCancelEvent}
              />
            )}
          </div>
        )}
      </main>

      {/* Floating Refresh Button */}
      <button
        onClick={loadData}
        className="fixed bottom-20 sm:bottom-6 left-4 sm:left-6 p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white shadow-xl backdrop-blur-md transition-all group active:scale-95 z-30"
        title="Làm mới dữ liệu từ máy chủ"
      >
        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-400" : ""}`} />
      </button>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCreateModal={() => {
          setCalendarSelectedDate(undefined);
          setIsCreateModalOpen(true);
        }}
        tasksCount={stats.activeTasks}
      />

      {/* Modals */}
      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onEventCreated={loadData}
        defaultDate={calendarSelectedDate}
      />

      <EditEventModal
        isOpen={Boolean(editingEvent)}
        event={editingEvent}
        onClose={() => setEditingEvent(null)}
        onEventUpdated={loadData}
      />

      <SimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onEventDispatched={loadData}
      />

      <TelegramTestModal
        isOpen={isTelegramTestOpen}
        onClose={() => setIsTelegramTestOpen(false)}
      />

      {/* Global Command Palette (Ctrl + K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        events={events}
        onNavigateTab={setActiveTab}
        onOpenCreateModal={() => {
          setCalendarSelectedDate(undefined);
          setIsCreateModalOpen(true);
        }}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        onOpenTelegramTest={() => setIsTelegramTestOpen(true)}
        onSelectEvent={(ev) => setEditingEvent(ev)}
      />
    </div>
  );
}
