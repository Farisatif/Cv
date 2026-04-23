import { ReactNode, useRef, useEffect } from "react";

/**
 * InteractiveElement
 * 
 * Wrapper component that applies KitSys-style interactive effects:
 * - Hover lift (translateY + scale)
 * - Smooth transitions
 * - Ripple effect on click
 * - Theme-aware shadows
 */

interface InteractiveElementProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
  hoverLift?: boolean; // Enable hover lift effect
  rippleEffect?: boolean; // Enable ripple effect
}

export default function InteractiveElement({
  children,
  className = "",
  onClick,
  style,
  hoverLift = true,
  rippleEffect = true,
}: InteractiveElementProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const rippleRefs = useRef<Set<HTMLDivElement>>(new Set());

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (rippleEffect && elementRef.current) {
      const rect = elementRef.current.getBoundingClientRect();
      const ripple = document.createElement("div");
      ripple.className = "absolute rounded-full bg-glow-primary/20 pointer-events-none";
      ripple.style.left = `${e.clientX - rect.left}px`;
      ripple.style.top = `${e.clientY - rect.top}px`;
      ripple.style.width = "10px";
      ripple.style.height = "10px";
      ripple.style.animation = "ripple-expand 0.6s ease-out forwards";
      ripple.style.transform = "translate(-50%, -50%)";

      elementRef.current.appendChild(ripple);
      rippleRefs.current.add(ripple);

      setTimeout(() => {
        ripple.remove();
        rippleRefs.current.delete(ripple);
      }, 600);
    }

    onClick?.();
  };

  useEffect(() => {
    return () => {
      rippleRefs.current.forEach((ripple) => ripple.remove());
      rippleRefs.current.clear();
    };
  }, []);

  const baseClasses = `
    relative overflow-hidden transition-all duration-300
    ${hoverLift ? "hover:scale-102 hover:-translate-y-2" : ""}
    ${className}
  `.trim();

  return (
    <div
      ref={elementRef}
      className={baseClasses}
      onClick={handleClick}
      style={style}
    >
      {children}
    </div>
  );
}
