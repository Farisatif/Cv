import { ReactNode } from "react";

/**
 * MarqueeText
 * 
 * Scrolling text effect (like KitSys).
 * Repeats text infinitely with smooth animation.
 */

interface MarqueeTextProps {
  children: ReactNode;
  speed?: "slow" | "normal" | "fast"; // Controls animation speed
  pauseOnHover?: boolean;
  className?: string;
}

export default function MarqueeText({
  children,
  speed = "normal",
  pauseOnHover = true,
  className = "",
}: MarqueeTextProps) {
  const speedMap = {
    slow: "30s",
    normal: "20s",
    fast: "12s",
  };

  const animationDuration = speedMap[speed];

  return (
    <div 
      className={`marquee-container ${className}`}
      style={{
        "--marquee-duration": animationDuration,
      } as React.CSSProperties & { "--marquee-duration": string }}
    >
      <div 
        className={`marquee-content ${pauseOnHover ? "hover:animation-paused" : ""}`}
        style={{
          animation: `marquee-scroll ${animationDuration} linear infinite`,
        }}
      >
        <div className="marquee-item">{children}</div>
        <div className="marquee-item" aria-hidden="true">{children}</div>
      </div>
    </div>
  );
}
