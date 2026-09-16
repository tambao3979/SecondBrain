import { NextRequest, NextResponse } from "next/server";
import {
  getEventById,
  cancelEvent,
  toggleTaskStatus,
  updateEvent,
  deleteEvent,
} from "@/lib/db-service";
import { cancelScheduledReminder } from "@/lib/qstash";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action } = body;

    const event = await getEventById(id);
    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      );
    }

    if (action === "CANCEL") {
      // Cancel QStash scheduled messages
      if (event.reminders && event.reminders.length > 0) {
        for (const rem of event.reminders) {
          if (rem.qstashMessageId && rem.status === "PENDING") {
            await cancelScheduledReminder(rem.qstashMessageId);
          }
        }
      }

      const updated = await cancelEvent(id);
      return NextResponse.json({
        success: true,
        message: "Event and scheduled reminders cancelled successfully",
        event: updated,
      });
    }

    if (action === "TOGGLE_TASK") {
      const updated = await toggleTaskStatus(id);
      return NextResponse.json({
        success: true,
        message: "Task status toggled",
        event: updated,
      });
    }

    if (action === "UPDATE") {
      const { title, formatted_content, type, startAt, endAt } = body;
      const updated = await updateEvent(id, {
        title,
        formatted_content,
        type,
        startAt: startAt ? new Date(startAt) : startAt === null ? null : undefined,
        endAt: endAt ? new Date(endAt) : endAt === null ? null : undefined,
      });
      return NextResponse.json({
        success: true,
        message: "Event updated successfully",
        event: updated,
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const event = await getEventById(id);
    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 }
      );
    }

    // Cancel any active reminders in QStash
    if (event.reminders) {
      for (const rem of event.reminders) {
        if (rem.qstashMessageId && rem.status === "PENDING") {
          await cancelScheduledReminder(rem.qstashMessageId);
        }
      }
    }

    const ok = await deleteEvent(id);
    return NextResponse.json({ success: ok, message: "Event deleted" });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
