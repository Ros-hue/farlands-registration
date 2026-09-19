"use client";

import { useEffect, useRef } from "react";

export default function FarlandsCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Gracefully disable on touch / mobile devices
    if (typeof window === "undefined") return;
    const isTouch =
      window.matchMedia("(pointer: coarse)").matches ||
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0;
    if (isTouch) return;

    const cursor = cursorRef.current;
    const dot = dotRef.current;
    if (!cursor || !dot) return;

    document.body.classList.add("has-custom-cursor");

    let mouseX = -100;
    let mouseY = -100;
    let currentX = -100;
    let currentY = -100;
    let isHovered = false;
    let isClicking = false;
    let animationFrameId: number;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (dot) {
        dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      }
    };

    const onMouseDown = () => {
      isClicking = true;
      cursor.classList.add("cursor-clicking");
    };

    const onMouseUp = () => {
      isClicking = false;
      cursor.classList.remove("cursor-clicking");
    };

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.closest("a") ||
          target.closest("button") ||
          target.closest("input") ||
          target.closest("select") ||
          target.closest("textarea") ||
          target.closest('[role="button"]') ||
          target.classList.contains("clickable"))
      ) {
        isHovered = true;
        cursor.classList.add("cursor-hover");
      } else {
        isHovered = false;
        cursor.classList.remove("cursor-hover");
      }
    };

    const loop = () => {
      // Smooth interpolation for the outer crosshair
      const ease = 0.22;
      currentX += (mouseX - currentX) * ease;
      currentY += (mouseY - currentY) * ease;

      cursor.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      animationFrameId = requestAnimationFrame(loop);
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mousedown", onMouseDown, { passive: true });
    window.addEventListener("mouseup", onMouseUp, { passive: true });
    window.addEventListener("mouseover", onMouseOver, { passive: true });
    animationFrameId = requestAnimationFrame(loop);

    return () => {
      document.body.classList.remove("has-custom-cursor");
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("mouseover", onMouseOver);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="minecraft-cursor-dot" aria-hidden="true" />
      <div ref={cursorRef} className="minecraft-cursor-crosshair" aria-hidden="true">
        <div className="crosshair-h" />
        <div className="crosshair-v" />
        <div className="crosshair-square" />
      </div>
      <style jsx global>{`
        body.has-custom-cursor,
        body.has-custom-cursor a,
        body.has-custom-cursor button,
        body.has-custom-cursor input,
        body.has-custom-cursor select,
        body.has-custom-cursor textarea,
        body.has-custom-cursor [role="button"] {
          cursor: none !important;
        }

        .minecraft-cursor-dot {
          position: fixed;
          top: -2px;
          left: -2px;
          width: 4px;
          height: 4px;
          background: #ffffff;
          box-shadow: 0 0 6px #00f0ff, 0 0 10px #ffffff;
          border-radius: 0;
          pointer-events: none;
          z-index: 999999;
          will-change: transform;
          mix-blend-mode: difference;
        }

        .minecraft-cursor-crosshair {
          position: fixed;
          top: -14px;
          left: -14px;
          width: 28px;
          height: 28px;
          pointer-events: none;
          z-index: 999998;
          will-change: transform;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.05s ease-out;
        }

        .crosshair-h {
          position: absolute;
          width: 18px;
          height: 2px;
          background: rgba(255, 255, 255, 0.85);
          box-shadow: 0 0 4px rgba(0, 240, 255, 0.6);
        }

        .crosshair-v {
          position: absolute;
          width: 2px;
          height: 18px;
          background: rgba(255, 255, 255, 0.85);
          box-shadow: 0 0 4px rgba(0, 240, 255, 0.6);
        }

        .crosshair-square {
          position: absolute;
          width: 8px;
          height: 8px;
          border: 1px solid rgba(0, 240, 255, 0.7);
          box-shadow: 0 0 8px rgba(0, 240, 255, 0.4);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .cursor-hover .crosshair-square {
          width: 20px;
          height: 20px;
          border-color: #ffd700;
          box-shadow: 0 0 12px rgba(255, 215, 0, 0.8);
          transform: rotate(45deg);
        }

        .cursor-hover .crosshair-h,
        .cursor-hover .crosshair-v {
          background: #ffd700;
          box-shadow: 0 0 8px rgba(255, 215, 0, 0.8);
        }

        .cursor-clicking .crosshair-square {
          transform: scale(0.65);
          border-color: #ff3344;
          box-shadow: 0 0 12px rgba(255, 51, 68, 0.9);
        }

        @media (pointer: coarse) {
          .minecraft-cursor-dot,
          .minecraft-cursor-crosshair {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
