import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAqiColor(category: string | undefined): string {
  if (!category) return "bg-slate-500 text-white";
  const cat = category.toLowerCase();
  if (cat === "good") return "bg-[#22C55E] text-white";
  if (cat === "moderate") return "bg-[#EAB308] text-slate-900";
  if (cat === "poor") return "bg-[#F97316] text-white";
  if (cat === "verypoor" || cat === "very_poor") return "bg-[#EF4444] text-white";
  if (cat === "severe") return "bg-[#EF4444] text-white";
  if (cat === "hazardous") return "bg-[#7C1D6F] text-white";
  return "bg-slate-500 text-white";
}

export function getAqiHex(category: string | undefined): string {
  if (!category) return "#64748B";
  const cat = category.toLowerCase();
  if (cat === "good") return "#22C55E";
  if (cat === "moderate") return "#EAB308";
  if (cat === "poor") return "#F97316";
  if (cat === "verypoor" || cat === "very_poor" || cat === "severe") return "#EF4444";
  if (cat === "hazardous") return "#7C1D6F";
  return "#64748B";
}

export function getRiskColor(level: string | undefined): string {
  if (!level) return "bg-slate-500 text-white";
  const lvl = level.toLowerCase();
  if (lvl === "low") return "bg-[#22C55E] text-white";
  if (lvl === "moderate") return "bg-[#EAB308] text-slate-900";
  if (lvl === "high") return "bg-[#F97316] text-white";
  if (lvl === "severe") return "bg-[#EF4444] text-white";
  return "bg-slate-500 text-white";
}
