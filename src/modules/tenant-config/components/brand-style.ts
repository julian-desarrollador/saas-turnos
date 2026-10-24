import type { PublicAccent } from "@/components/shared/public-template";
import type { BrandColor } from "@/modules/tenant-config/application/ports/site-store";

export const brandAccent: Record<BrandColor, PublicAccent> = {
  slate: {
    text: "text-slate-700",
    solid: "bg-slate-700 text-white",
    glow: "shadow-[0_4px_16px_rgba(51,65,85,0.45)]",
  },
  rose: {
    text: "text-rose-700",
    solid: "bg-rose-700 text-white",
    glow: "shadow-[0_4px_16px_rgba(190,18,60,0.45)]",
  },
  amber: {
    text: "text-amber-700",
    solid: "bg-amber-700 text-white",
    glow: "shadow-[0_4px_16px_rgba(180,83,9,0.45)]",
  },
  emerald: {
    text: "text-emerald-800",
    solid: "bg-emerald-800 text-white",
    glow: "shadow-[0_4px_16px_rgba(6,95,70,0.45)]",
  },
  sky: {
    text: "text-sky-800",
    solid: "bg-sky-800 text-white",
    glow: "shadow-[0_4px_16px_rgba(7,89,133,0.45)]",
  },
  violet: {
    text: "text-violet-800",
    solid: "bg-violet-800 text-white",
    glow: "shadow-[0_4px_16px_rgba(91,33,182,0.45)]",
  },
  stone: {
    text: "text-stone-600",
    solid: "bg-stone-600 text-white",
    glow: "shadow-[0_4px_16px_rgba(87,83,78,0.45)]",
  },
  zinc: {
    text: "text-zinc-700",
    solid: "bg-zinc-700 text-white",
    glow: "shadow-[0_4px_16px_rgba(63,63,70,0.45)]",
  },
};
