import { Sora } from "next/font/google";

import { platformColors, platformName } from "@/core/platform-brand";

import { PlatformMark } from "./platform-mark";

const sora = Sora({ subsets: ["latin"], weight: "600" });

type PlatformLogoProps = {
  /** Alto del símbolo en px; el nombre se escala con él. */
  size?: number;
  className?: string;
};

/** Logo completo de la plataforma: el símbolo y el nombre en minúscula (docs/22-marketing.md §12). */
export function PlatformLogo({ size = 28, className }: PlatformLogoProps) {
  return (
    <span
      className={`inline-flex items-center ${sora.className} ${className ?? ""}`}
      style={{ gap: size * 0.36, color: platformColors.ink }}
    >
      <PlatformMark size={size} className="shrink-0" variant="color" />
      <span
        className="lowercase"
        style={{ fontSize: size * 0.86, lineHeight: 1, letterSpacing: "-0.03em" }}
      >
        {platformName}
      </span>
    </span>
  );
}
