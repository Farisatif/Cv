import { ReactNode, useRef, useState } from "react";

/**
 * HoverCard
 * 
 * Card component with smooth KitSys-style hover effects:
 * - Lift on hover
 * - Enhanced shadow
 * - Scale transformation
 * - Smooth transitions
 */

interface HoverCardProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function HoverCard({
  children,
  className = "",
  style,
}: HoverCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePos({ x: 0, y: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const x = e.clientX - rect.left - centerX;
    const y = e.clientY - rect.top - centerY;

    const distance = Math.sqrt(x * x + y * y);
    const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
    const intensity = 1 - Math.min(1, distance / maxDistance);

    setMousePos({
      x: (x / centerX) * 2 * intensity,
      y: (y / centerY) * 2 * intensity,
    });
  };

  return (
    <div
      ref={cardRef}
      className={`
        card-lift relative overflow-hidden
        transition-all duration-300 cubic-bezier(0.16, 1, 0.3, 1)
        ${className}
      `}
      style={{
        ...style,
        transform: isHovered 
          ? `translateY(-8px) scale(1.02) translate3d(${mousePos.x * 2}px, ${mousePos.y * 2}px, 0)`
          : "translateY(0) scale(1) translate3d(0, 0, 0)",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      {/* Glow effect background */}
      {isHovered && (
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            background: `radial-gradient(circle at ${50 + mousePos.x * 10}% ${50 + mousePos.y * 10}%, hsl(var(--glow-primary)), transparent 80%)`,
            animation: "fade-in 0.3s ease-out",
          }}
        />
      )}
      
      {children}
    </div>
  );
}
