import { publicTheme as t } from "@/components/shared/public-template";
import { cn } from "@/lib/utils";

const dayParts = [
  { title: "Mañana", from: "00:00", to: "13:00" },
  { title: "Tarde", from: "13:00", to: "19:00" },
  { title: "Noche", from: "19:00", to: "24:00" },
] as const;

export function PublicSlotGroups({
  slots,
  time,
  onPick,
}: {
  slots: string[];
  time: string;
  onPick: (slot: string) => void;
}) {
  return (
    <>
      {dayParts.map((part) => {
        const inPart = slots.filter((slot) => slot >= part.from && slot < part.to);
        if (inPart.length === 0) {
          return null;
        }
        return (
          <div key={part.title} className="grid gap-3">
            <p className={cn(t.eyebrow, t.muted)}>{part.title}</p>
            <div className="grid grid-cols-4 gap-2">
              {inPart.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  aria-pressed={time === slot}
                  onClick={() => onPick(slot)}
                  className={cn(
                    "min-h-11 rounded-2xl border text-[16px] font-medium",
                    time === slot
                      ? "border-[#1c1917] bg-[#1c1917] text-[#f7f4ef]"
                      : "border-[#e7e0d5] bg-white",
                  )}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}
