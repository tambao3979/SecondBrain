import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined, formatStr: string = "dd/MM/yyyy HH:mm"): string {
  if (!date) return "--";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "--";
    
    // Format manually or safely
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    if (formatStr === "HH:mm") return `${hours}:${minutes}`;
    if (formatStr === "dd/MM/yyyy") return `${day}/${month}/${year}`;
    if (formatStr === "dd MMM") {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${day} ${monthNames[d.getMonth()]}`;
    }
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return "--";
  }
}

export function getRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return "";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMins / 60);
    const diffDays = Math.round(diffHours / 24);

    if (diffMs > 0) {
      if (diffMins < 1) return "Ngay bây giờ";
      if (diffMins < 60) return `Trong ${diffMins} phút`;
      if (diffHours < 24) return `Trong ${diffHours} giờ`;
      if (diffDays === 1) return "Ngày mai";
      return `Trong ${diffDays} ngày`;
    } else {
      const pastMins = Math.abs(diffMins);
      const pastHours = Math.abs(diffHours);
      const pastDays = Math.abs(diffDays);
      if (pastMins < 1) return "Vừa xong";
      if (pastMins < 60) return `${pastMins} phút trước`;
      if (pastHours < 24) return `${pastHours} giờ trước`;
      if (pastDays === 1) return "Hôm qua";
      return `${pastDays} ngày trước`;
    }
  } catch {
    return "";
  }
}
