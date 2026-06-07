import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  drawing_uploaded: "Drawing Uploaded",
  analyzed: "Analyzed",
  boq_generated: "BOQ Generated",
};

export const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  drawing_uploaded: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  analyzed: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  boq_generated: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};

export const BUILDING_TYPE_LABELS: Record<string, string> = {
  office: "Office",
  residential: "Residential",
  industrial: "Industrial",
  hospital: "Hospital",
  school: "School / Educational",
  warehouse: "Warehouse",
  hotel: "Hotel",
  other: "Other",
};

export const HAZARD_LABELS: Record<string, string> = {
  light: "Light Hazard",
  ordinary: "Ordinary Hazard",
  high: "High Hazard",
};

export const HAZARD_COLORS: Record<string, string> = {
  light: "text-emerald-400",
  ordinary: "text-amber-400",
  high: "text-red-400",
};
