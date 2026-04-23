import { useEffect, useRef } from "react";

/* Respect users who prefer no motion */
function reducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isCoarsePointer() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(hover: none), (pointer: coarse)").matches;
}

/* ──────────────────────────────────────────────────────────────────────────
   useTilt — subtle 3D tilt on hover (desktop only).
   Apply ref to any element. Keeps performance via rAF + transform-only updates.
─────────────────────────────────────────────────────────────────────────── */
export function useTilt<T extends HTMLElement>(maxDeg = 6) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reducedMotion() || isCoarsePointer()) return;

    let frame = 0;
    let targetX = 0, targetY = 0, currentX = 0, currentY = 0;

    el.setAttribute("data-tilt", "");

    const tick = () => {
      currentX += (targetX - currentX) * 0.18;
      currentY += (targetY - currentY) * 0.18;
      el.style.transform =
        `perspective(900px) rotateX(${currentY.toFixed(2)}deg) rotateY(${currentX.toFixed(2)}deg) translateZ(0)`;
      if (Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05) {
        frame = requestAnimationFrame(tick);
      } else {
        frame = 0;
      }
    };

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top)  / rect.height;
      targetX = (px - 0.5) *  maxDeg * 2;
      targetY = (py - 0.5) * -maxDeg * 2;
      el.setAttribute("data-tilting", "1");
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const reset = () => {
      targetX = 0; targetY = 0;
      el.removeAttribute("data-tilting");
      if (!frame) frame = requestAnimationFrame(tick);
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", reset);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", reset);
      if (frame) cancelAnimationFrame(frame);
      el.style.transform = "";
    };
  }, [maxDeg]);

  return ref;
}

/* ──────────────────────────────────────────────────────────────────────────
   useMagnetic — element gently follows the cursor inside a radius.
─────────────────────────────────────────────────────────────────────────── */
export function useMagnetic<T extends HTMLElement>(strength = 0.25) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reducedMotion() || isCoarsePointer()) return;

    el.setAttribute("data-magnetic", "");
    let frame = 0;
    let tx = 0, ty = 0, cx = 0, cy = 0;

    const tick = () => {
      cx += (tx - cx) * 0.22;
      cy += (ty - cy) * 0.22;
      el.style.transform = `translate3d(${cx.toFixed(2)}px, ${cy.toFixed(2)}px, 0)`;
      if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) {
        frame = requestAnimationFrame(tick);
      } else {
        frame = 0;
      }
    };

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top  + rect.height / 2);
      tx = dx * strength;
      ty = dy * strength;
      el.setAttribute("data-magnetic-active", "1");
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const reset = () => {
      tx = 0; ty = 0;
      el.removeAttribute("data-magnetic-active");
      if (!frame) frame = requestAnimationFrame(tick);
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", reset);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", reset);
      if (frame) cancelAnimationFrame(frame);
      el.style.transform = "";
    };
  }, [strength]);

  return ref;
}

/* ──────────────────────────────────────────────────────────────────────────
   useParallax — translates element a bit as page scrolls past it.
   speed = 0.04..0.12 looks tasteful; negative for reverse direction.
─────────────────────────────────────────────────────────────────────────── */
export function useParallax<T extends HTMLElement>(speed = 0.06) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reducedMotion()) return;

    el.setAttribute("data-parallax", "");
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const winH = window.innerHeight;
      const center = rect.top + rect.height / 2;
      const offset = (center - winH / 2) * speed;
      el.style.transform = `translate3d(0, ${(-offset).toFixed(1)}px, 0)`;
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
      el.style.transform = "";
    };
  }, [speed]);

  return ref;
}

/* ──────────────────────────────────────────────────────────────────────────
   useReveal — lightweight class-based reveal (`.reveal` → `.is-in`).
─────────────────────────────────────────────────────────────────────────── */
export function useReveal<T extends HTMLElement>(threshold = 0.12) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.add("reveal");
    if (reducedMotion()) {
      el.classList.add("is-in");
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            el.classList.add("is-in");
            obs.disconnect();
          }
        });
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return ref;
}
