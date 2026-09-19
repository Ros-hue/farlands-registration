"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Hero3D } from "./Hero3D";
import { BIOMES, HACKATHON_STATES, TimelineState } from "./timeline";
import { minecraftFont } from "../../fonts";

// Web Audio API synthesizer
function playSynthSound(type: "click" | "portal") {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    if (type === "click") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(280, ctx.currentTime + 0.07);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
    } else {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(960, ctx.currentTime + 0.55);
      osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 1.2);
      gain.gain.setValueAtTime(0.22, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
    }
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1.2);
  } catch {
    // silent fail
  }
}

// Chapter definitions for the bottom tab bar
const CHAPTERS = [
  { id: 0, code: "01", label: "REALM", progress: 0.0 },
  { id: 1, code: "02", label: "CANYON", progress: 0.22 },
  { id: 2, code: "03", label: "ISLANDS", progress: 0.44 },
  { id: 3, code: "04", label: "EXPEDITION", progress: 0.66 },
  { id: 4, code: "05", label: "REGISTER", progress: 0.88 },
];

export default function FarlandsWorldExperience() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<Hero3D | null>(null);

  const [loading, setLoading] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [activeBiomeIndex, setActiveBiomeIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [coords, setCoords] = useState({ x: 18, y: 128, z: 24 });
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isFinalRotation, setIsFinalRotation] = useState(false);
  const [isEnteringPortal, setIsEnteringPortal] = useState(false);
  const [isWebglFailed, setIsWebglFailed] = useState(false);
  const [fps, setFps] = useState(60);

  // FPS counter for F3-style HUD
  const fpsRef = useRef({ frames: 0, last: 0 });

  useEffect(() => {
    let rafId: number;
    const measure = (t: number) => {
      fpsRef.current.frames++;
      if (t - fpsRef.current.last >= 1000) {
        setFps(fpsRef.current.frames);
        fpsRef.current.frames = 0;
        fpsRef.current.last = t;
      }
      rafId = requestAnimationFrame(measure);
    };
    rafId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(rafId);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsTouchDevice(
        window.matchMedia("(pointer: coarse)").matches ||
          "ontouchstart" in window ||
          navigator.maxTouchPoints > 0
      );
    }
  }, []);

  // Initialize Hero3D engine
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let heroInstance: Hero3D | null = null;

    const onUpdate = (state: TimelineState) => {
      const p = state.progress ?? 0;
      setProgress(p);
      const biomeIdx = Math.min(BIOMES.length - 1, state.currentBiomeIndex ?? 0);
      setActiveBiomeIndex(biomeIdx);
      if (state.coordinates) setCoords(state.coordinates);
      setIsFinalRotation(Boolean(state.portalActive || biomeIdx >= 5 || p >= 0.88));
    };

    const onError = (err: Error) => {
      console.warn("Hero3D notice:", err);
      setLoading(false);
      setIsWebglFailed(true);
    };

    try {
      heroInstance = new Hero3D(container, onUpdate, onError);
      heroRef.current = heroInstance;
      heroInstance.load().then(() => setLoading(false)).catch(() => setLoading(false));
    } catch (e) {
      console.warn("Hero3D init error:", e);
      setLoading(false);
      setIsWebglFailed(true);
    }

    return () => {
      heroInstance?.dispose();
      heroRef.current = null;
    };
  }, []);

  // Sync scroll → 3D engine
  const handleScroll = useCallback(() => {
    if (!scrollWrapperRef.current || !heroRef.current || isEnteringPortal) return;
    const totalH = scrollWrapperRef.current.offsetHeight - window.innerHeight;
    const p = Math.max(0, Math.min(1, window.scrollY / Math.max(1, totalH)));
    heroRef.current.setProgress(p);
  }, [isEnteringPortal]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [handleScroll]);

  // Chapter jump
  const goToProgress = (p: number) => {
    if (audioEnabled) playSynthSound("click");
    if (!scrollWrapperRef.current) return;
    const totalH = scrollWrapperRef.current.offsetHeight - window.innerHeight;
    window.scrollTo({ top: p * totalH, behavior: "smooth" });
  };

  // Portal entry transition
  const handleRegister = () => {
    if (isEnteringPortal) return;
    setIsEnteringPortal(true);
    if (audioEnabled) playSynthSound("portal");
    if (heroRef.current) {
      heroRef.current.enterPortal(() => router.push("/register"));
    } else {
      setTimeout(() => router.push("/register"), 1100);
    }
  };

  const currentBiome = BIOMES[activeBiomeIndex] || BIOMES[0];
  const currentState = HACKATHON_STATES[Math.min(activeBiomeIndex, HACKATHON_STATES.length - 1)];

  // Opacity helpers
  const scrollCueOpacity = Math.max(0, 1 - progress * 22);
  const openingTitleOpacity = Math.max(0, 1 - progress * 18);
  const activeChapterId = isFinalRotation ? 4 : Math.min(3, activeBiomeIndex);

  // Biome panel: appears only after landing
  const biomePanelOpacity = progress > 0.32 && !isFinalRotation
    ? Math.min(1, (progress - 0.32) / 0.06)
    : isFinalRotation ? 0 : 0;

  // Sign post: visible mid-journey
  const signPostOpacity = progress > 0.38 && progress < 0.88
    ? Math.min(1, (progress - 0.38) / 0.05)
    : 0;

  return (
    <div ref={scrollWrapperRef} className="fl-world-wrapper">
      {/* ── STICKY 100vh VIEWPORT ── */}
      <div className="fl-stage">

        {/* THREE.js 3D Canvas */}
        <div ref={containerRef} className="fl-3d-canvas" />

        {/* ════════════════════════════════════════════════
            OPENING CINEMATIC TITLE
            Inspired by Ref 2: full-screen FARLANDS title
            letterboxed over the immersive 3D world
        ════════════════════════════════════════════════ */}
        {openingTitleOpacity > 0.01 && (
          <div
            className="fl-opening-title"
            style={{ opacity: openingTitleOpacity, pointerEvents: "none" }}
            aria-hidden="true"
          >
            <div className="opening-eyebrow">
              <span className="eyebrow-dot" />
              <span className={`eyebrow-text ${minecraftFont.className}`}>
                A 48-HOUR MINECRAFT HACKATHON
              </span>
              <span className="eyebrow-dot" />
            </div>
            <h1 className={`opening-farlands-title ${minecraftFont.className}`}>
              FARLANDS
            </h1>
            <p className={`opening-tagline ${minecraftFont.className}`}>
              WHERE IDEAS BECOME WORLDS
              <br />
              <span className="tagline-accent">BEYOND THE BOUNDARY.</span>
            </p>
            <div className="opening-chapter-badge">
              <span className={minecraftFont.className}>01. FARLANDS // THE UNCHARTED REALM</span>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════
            TOP NAVIGATION BAR
            Minimal — brand, audio, 3D CINEMATIC label, login
        ════════════════════════════════════════════════ */}
        <header className="fl-topbar">
          <div className="fl-brand">
            <div className="fl-brand-hex">
              <svg width="16" height="18" viewBox="0 0 16 18" fill="none" aria-hidden="true">
                <path d="M8 1L15 5V13L8 17L1 13V5L8 1Z" stroke="#00e5e5" strokeWidth="1.4" strokeLinejoin="round" />
                <path d="M1 5L8 9L15 5" stroke="#00e5e5" strokeWidth="1.4" />
                <path d="M8 9V17" stroke="#00e5e5" strokeWidth="1.4" />
              </svg>
            </div>
            <span className={`fl-brand-name ${minecraftFont.className}`}>FARLANDS</span>
            <span className={`fl-brand-year ${minecraftFont.className}`}>&apos;26</span>
          </div>

          <div className="fl-topbar-right">
            <div className="fl-cinematic-badge">
              <span className="cinematic-pip" />
              <span className={`cinematic-label ${minecraftFont.className}`}>3D CINEMATIC</span>
            </div>

            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className="fl-icon-btn"
              title={audioEnabled ? "Mute" : "Enable Sound"}
              type="button"
            >
              {audioEnabled ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              )}
            </button>

            <Link href="/login" className={`fl-login-btn ${minecraftFont.className}`}>
              LOGIN
            </Link>
          </div>
        </header>

        {/* ════════════════════════════════════════════════
            F3-STYLE DEBUG HUD (bottom-left)
            THE UNIQUE FACTOR — authentic Minecraft F3 screen
            aesthetic for a tech hackathon audience
        ════════════════════════════════════════════════ */}
        <div className="fl-f3-hud" aria-label="World debug info">
          <div className={`f3-line f3-version ${minecraftFont.className}`}>
            Farlands / Hackathon 2026 / WebGL
          </div>
          <div className={`f3-line ${minecraftFont.className}`}>
            {fps} fps / {Math.round(progress * 100)}% explored
          </div>
          <div className="f3-divider" />
          <div className={`f3-line f3-coords ${minecraftFont.className}`}>
            XYZ: {coords.x >= 0 ? `+${coords.x}` : coords.x} / {coords.y} / {coords.z >= 0 ? `+${coords.z}` : coords.z}
          </div>
          <div className={`f3-line ${minecraftFont.className}`}>
            Biome: {currentBiome.name} / Sector {currentBiome.sector}
          </div>
          <div className={`f3-line f3-status ${minecraftFont.className}`}>
            Status: <span className={`f3-status-val ${currentBiome.status === 'STABLE' ? 'f3-stable' : currentBiome.status === 'PORTAL READY' ? 'f3-portal' : 'f3-active'}`}>
              {currentBiome.status}
            </span>
          </div>
        </div>

        {/* ════════════════════════════════════════════════
            MINECRAFT SIGN POST (mid-journey info panel)
            Small voxel sign — not a dashboard card
        ════════════════════════════════════════════════ */}
        {signPostOpacity > 0.01 && (
          <div
            className="fl-sign-post-wrap"
            style={{ opacity: signPostOpacity }}
            aria-hidden="true"
          >
            {/* Sign board */}
            <div className="fl-sign-board">
              <div className="sign-notch-tl" />
              <div className="sign-notch-tr" />
              <div className="sign-notch-bl" />
              <div className="sign-notch-br" />

              <div className="sign-header">
                <span className={`sign-chapter-tag ${minecraftFont.className}`}>
                  {currentState.chapter}
                </span>
                <span className={`sign-badge ${minecraftFont.className}`}>
                  {currentState.badge}
                </span>
              </div>

              <div className={`sign-headline ${minecraftFont.className}`}>
                {currentState.headline}
              </div>

              <p className="sign-tagline">{currentState.tagline}</p>

              {currentState.details && (
                <ul className="sign-details">
                  {currentState.details.map((item, i) => (
                    <li key={i}>
                      <span className="sign-bullet">▸</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}

              <button
                type="button"
                onClick={() => goToProgress(Math.min(1, (activeBiomeIndex + 1) * 0.18 + 0.05))}
                className={`sign-cta-btn ${minecraftFont.className}`}
              >
                {currentState.ctaLabel || "EXPLORE"} ›
              </button>
            </div>
            {/* Sign post stem */}
            <div className="fl-sign-stem" />
          </div>
        )}

        {/* ════════════════════════════════════════════════
            FINAL PORTAL CLIMAX — minimal centered overlay
            No floating card — text lives in the 3D world
        ════════════════════════════════════════════════ */}
        {isFinalRotation && (
          <div className={`fl-portal-climax ${isEnteringPortal ? "warp-active" : ""}`}>
            <div className="portal-status-pill">
              <span className="portal-pip-pulse" />
              <span className={minecraftFont.className}>DIMENSIONAL GATEWAY READY</span>
            </div>

            <h1 className={`portal-climax-title ${minecraftFont.className}`}>
              STEP INTO
              <br />
              <span className="portal-title-gradient">FARLANDS</span>
            </h1>

            <p className="portal-climax-desc">
              Assemble your squad — 1 to 4 builders — for the 24-hour sprint.<br />
              <strong>₹1,200 per team.</strong> Build beyond the boundary.
            </p>

            <button
              type="button"
              onClick={handleRegister}
              disabled={isEnteringPortal}
              className={`portal-register-btn ${minecraftFont.className} ${isEnteringPortal ? "entering" : ""}`}
            >
              <span className="btn-bracket">[</span>
              {isEnteringPortal ? " ENTERING PORTAL... " : " REGISTER NOW → "}
              <span className="btn-bracket">]</span>
            </button>

            <p className="portal-hint">
              {isEnteringPortal
                ? "Steve is walking through the portal..."
                : "Click to send Steve through the Nether Portal"}
            </p>
          </div>
        )}

        {/* ════════════════════════════════════════════════
            BOTTOM CHAPTER TAB BAR
            Inspired by Ref 2's bottom navigation tabs
        ════════════════════════════════════════════════ */}
        <nav className="fl-chapter-tabs" aria-label="Journey chapters">
          {/* Progress line above the tabs */}
          <div className="chapter-progress-track">
            <div
              className="chapter-progress-fill"
              style={{ width: `${progress * 100}%` }}
            />
          </div>

          <div className="chapter-tabs-inner">
            {CHAPTERS.map((ch) => {
              const isActive = ch.id === activeChapterId;
              const isPast = ch.id < activeChapterId;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => goToProgress(ch.progress)}
                  className={`chapter-tab ${isActive ? "tab-active" : ""} ${isPast ? "tab-past" : ""}`}
                >
                  <span className={`tab-code ${minecraftFont.className}`}>{ch.code}.</span>
                  <span className={`tab-label ${minecraftFont.className}`}>{ch.label}</span>
                  {isActive && <span className="tab-active-line" />}
                </button>
              );
            })}

            {/* Registration status on the far right */}
            <div className="tab-reg-status">
              <span className="reg-dot" />
              <span className={`reg-label ${minecraftFont.className}`}>
                REGISTRATION OPEN
              </span>
            </div>
          </div>
        </nav>

        {/* ════════════════════════════════════════════════
            SCROLL / SWIPE CUE
        ════════════════════════════════════════════════ */}
        {scrollCueOpacity > 0.01 && (
          <div
            className="fl-scroll-cue"
            style={{ opacity: scrollCueOpacity }}
            onClick={() => goToProgress(0.22)}
          >
            <div className="scroll-cue-line">
              <div className="scroll-cue-pip" />
            </div>
            <span className={`scroll-cue-text ${minecraftFont.className}`}>
              {isTouchDevice ? "SWIPE TO EXPLORE" : "SCROLL TO EXPLORE"}
            </span>
          </div>
        )}

        {/* ════════════════════════════════════════════════
            PORTAL WARP FLARE (full-screen on entry)
        ════════════════════════════════════════════════ */}
        <div className={`portal-warp-flare ${isEnteringPortal ? "warp-on" : ""}`} />

        {/* ════════════════════════════════════════════════
            LOADING SCREEN
        ════════════════════════════════════════════════ */}
        {loading && (
          <div className="fl-loader">
            <div className="loader-row">
              <div className="loader-block b1" />
              <div className="loader-block b2" />
              <div className="loader-block b3" />
              <div className="loader-block b4" />
            </div>
            <span className={`loader-text ${minecraftFont.className}`}>
              GENERATING WORLD...
            </span>
          </div>
        )}

        {/* ════════════════════════════════════════════════
            WEBGL FALLBACK
        ════════════════════════════════════════════════ */}
        {isWebglFailed && (
          <div className="fl-webgl-fallback">
            <h2 className={minecraftFont.className}>FARLANDS HACKATHON 2026</h2>
            <p>Your browser couldn&apos;t load the 3D world. Register directly below.</p>
            <Link href="/register" className={`portal-register-btn ${minecraftFont.className}`}>
              <span className="btn-bracket">[</span> REGISTER NOW → <span className="btn-bracket">]</span>
            </Link>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════
          INLINE STYLES — all component CSS lives here for zero flash
      ════════════════════════════════════════════════════════════════ */}
      <style jsx>{`
        /* ── LAYOUT ── */
        .fl-world-wrapper {
          position: relative;
          height: 500vh;
          width: 100%;
          /*
            Rich Minecraft Forest & Canyon Atmosphere:
            Deep spruce canopy mist into vibrant Minecraft grass green
          */
          background: linear-gradient(
            180deg,
            #132e20 0%,     /* Deep spruce canopy / mountain mist */
            #1b432e 15%,    /* Emerald hillside mist */
            #275a3e 35%,    /* Sunlit valley ridge */
            #387550 55%,    /* Rich foliage */
            #4a9263 75%,    /* Minecraft grass green */
            #1c452b 100%    /* Deep canyon moss */
          );
        }

        .fl-stage {
          position: sticky;
          top: 0;
          height: 100vh;
          width: 100%;
          overflow: hidden;
        }

        .fl-3d-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }

        /* ── OPENING CINEMATIC TITLE (Echoing Reference 2) ── */
        .fl-opening-title {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 30;
          text-align: center;
          padding: 0 20px;
          /* Subtle emerald pixel grid overlay for Minecraft texture feel */
          background-image: radial-gradient(
            rgba(74, 222, 128, 0.08) 1px,
            transparent 1px
          );
          background-size: 28px 28px;
        }

        .opening-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          background: rgba(10, 32, 22, 0.85);
          border: 1px solid rgba(74, 222, 128, 0.45);
          padding: 6px 20px;
          border-radius: 9999px;
          box-shadow: 0 0 18px rgba(74, 222, 128, 0.25);
          margin-bottom: 18px;
        }

        .eyebrow-dot {
          width: 6px;
          height: 6px;
          background: #4ade80;
          border-radius: 50%;
          box-shadow: 0 0 10px #4ade80;
          flex-shrink: 0;
          animation: pip-blink 1.5s ease-in-out infinite;
        }

        .eyebrow-text {
          font-size: clamp(7px, 1.1vw, 10px);
          color: #86efac;
          letter-spacing: 3px;
          text-shadow: 0 0 10px rgba(74, 222, 128, 0.6);
        }

        .opening-farlands-title {
          font-size: clamp(52px, 9.5vw, 112px);
          background: linear-gradient(180deg, #e8faf0 0%, #6ee7b7 45%, #15803d 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 14px 0;
          letter-spacing: 6px;
          line-height: 1;
          filter: drop-shadow(0 0 28px rgba(74, 222, 128, 0.65)) drop-shadow(0 4px 18px rgba(0, 0, 0, 0.9));
        }

        .opening-tagline {
          font-size: clamp(8px, 1.2vw, 12px);
          color: #a7f3d0;
          letter-spacing: 2px;
          line-height: 2;
          margin: 0 0 24px 0;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.8);
        }

        .tagline-accent {
          color: #fef08a;
          text-shadow: 0 0 12px rgba(254, 240, 138, 0.6);
        }

        .opening-chapter-badge {
          background: rgba(10, 32, 22, 0.85);
          border: 1px solid rgba(74, 222, 128, 0.5);
          padding: 7px 22px;
          border-radius: 9999px;
          font-size: clamp(7px, 0.95vw, 9px);
          color: #86efac;
          letter-spacing: 2px;
          text-shadow: 0 0 10px rgba(74, 222, 128, 0.6);
          box-shadow: 0 0 18px rgba(74, 222, 128, 0.25);
          backdrop-filter: blur(8px);
        }

        /* ── TOP NAVIGATION ── */
        .fl-topbar {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 55;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 32px;
          background: linear-gradient(180deg, rgba(8, 26, 17, 0.82) 0%, transparent 100%);
          pointer-events: auto;
        }

        .fl-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .fl-brand-hex {
          opacity: 0.95;
        }

        .fl-brand-name {
          font-size: 0.95rem;
          color: #ffffff;
          letter-spacing: 2px;
          text-shadow: 0 0 12px rgba(74, 222, 128, 0.6);
        }

        .fl-brand-year {
          font-size: 0.6rem;
          color: #4ade80;
          background: rgba(74, 222, 128, 0.15);
          border: 1px solid rgba(74, 222, 128, 0.45);
          padding: 3px 7px;
          letter-spacing: 1px;
        }

        .fl-topbar-right {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .fl-cinematic-badge {
          display: flex;
          align-items: center;
          gap: 7px;
          background: rgba(7, 24, 16, 0.85);
          border: 1px solid rgba(74, 222, 128, 0.4);
          padding: 5px 12px;
          border-radius: 9999px;
          backdrop-filter: blur(10px);
          pointer-events: none;
        }

        .cinematic-pip {
          width: 6px;
          height: 6px;
          background: #4ade80;
          border-radius: 50%;
          box-shadow: 0 0 8px #4ade80;
          animation: pip-blink 2s ease-in-out infinite;
        }

        .cinematic-label {
          font-size: 0.58rem;
          color: #86efac;
          letter-spacing: 1.5px;
        }

        .fl-icon-btn {
          background: rgba(7, 24, 16, 0.85);
          border: 1px solid rgba(74, 222, 128, 0.3);
          color: #86efac;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          backdrop-filter: blur(12px);
          transition: all 0.18s ease;
          border-radius: 8px;
        }

        .fl-icon-btn:hover {
          border-color: #4ade80;
          color: #ffffff;
          box-shadow: 0 0 12px rgba(74, 222, 128, 0.4);
        }

        .fl-login-btn {
          background: rgba(7, 24, 16, 0.85);
          border: 1px solid rgba(74, 222, 128, 0.5);
          color: #4ade80 !important;
          padding: 8px 18px;
          font-size: 0.65rem;
          letter-spacing: 1.5px;
          text-decoration: none !important;
          display: inline-flex;
          align-items: center;
          backdrop-filter: blur(12px);
          border-radius: 6px;
          transition: all 0.18s ease;
        }

        .fl-login-btn:hover {
          background: rgba(74, 222, 128, 0.18);
          border-color: #4ade80;
          box-shadow: 0 0 16px rgba(74, 222, 128, 0.4);
        }

        /* ════════════════════════════════════════
           F3 DEBUG HUD — THE UNIQUE FACTOR
           Authentic Minecraft F3 aesthetic
           for tech-savvy hackathon participants
        ════════════════════════════════════════ */
        .fl-f3-hud {
          position: absolute;
          top: 72px;
          left: 18px;
          z-index: 40;
          pointer-events: none;
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .f3-line {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.82);
          letter-spacing: 0;
          line-height: 1.6;
          /* Minecraft F3 yellow text background effect */
          background: rgba(0, 0, 0, 0.38);
          padding: 0 3px;
          display: inline-block;
          width: fit-content;
          text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.9);
        }

        .f3-version {
          color: rgba(255, 255, 165, 0.9);
        }

        .f3-coords {
          color: rgba(255, 255, 255, 0.88);
        }

        .f3-divider {
          height: 4px;
        }

        .f3-status-val {
          display: inline;
        }

        .f3-stable { color: #4ade80; }
        .f3-active { color: #fbbf24; }
        .f3-portal { color: #e879f9; text-shadow: 0 0 8px rgba(232, 121, 249, 0.8); }

        /* ── MINECRAFT SIGN POST ── */
        .fl-sign-post-wrap {
          position: absolute;
          right: 32px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 45;
          display: flex;
          flex-direction: column;
          align-items: center;
          pointer-events: auto;
          transition: opacity 0.4s ease;
        }

        .fl-sign-board {
          position: relative;
          max-width: 280px;
          width: calc(min(280px, 100vw - 60px));
          background: linear-gradient(135deg, #2d1a00 0%, #3d2500 50%, #2a1800 100%);
          border: 3px solid #5c3900;
          /* Pixel-art thick border outline */
          box-shadow:
            inset 0 0 0 1px rgba(255, 200, 80, 0.12),
            0 4px 0 0 #1a0e00,
            4px 0 0 0 #1a0e00,
            0 -4px 0 0 #4a2e00,
            -4px 0 0 0 #4a2e00,
            0 12px 35px rgba(0, 0, 0, 0.75);
          padding: 16px 18px;
          animation: sign-wobble 4s ease-in-out infinite;
        }

        /* Pixel corner notches — hallmark of Minecraft sign */
        .sign-notch-tl,
        .sign-notch-tr,
        .sign-notch-bl,
        .sign-notch-br {
          position: absolute;
          width: 5px;
          height: 5px;
          background: #2d1a00;
        }
        .sign-notch-tl { top: -3px; left: -3px; }
        .sign-notch-tr { top: -3px; right: -3px; }
        .sign-notch-bl { bottom: -3px; left: -3px; }
        .sign-notch-br { bottom: -3px; right: -3px; }

        .sign-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
          padding-bottom: 6px;
          border-bottom: 1px solid rgba(255, 200, 80, 0.2);
        }

        .sign-chapter-tag {
          font-size: 8px;
          color: rgba(255, 200, 80, 0.65);
          letter-spacing: 1px;
        }

        .sign-badge {
          font-size: 7px;
          color: #00e5e5;
          letter-spacing: 0.5px;
          background: rgba(0, 229, 229, 0.1);
          border: 1px solid rgba(0, 229, 229, 0.3);
          padding: 2px 6px;
        }

        .sign-headline {
          font-size: clamp(9px, 1.2vw, 11px);
          color: #ffffff;
          letter-spacing: 1px;
          line-height: 1.4;
          margin: 0 0 6px 0;
          text-shadow: 0 0 8px rgba(255, 255, 255, 0.2);
        }

        .sign-tagline {
          font-size: 10px;
          color: rgba(255, 224, 160, 0.75);
          line-height: 1.6;
          margin: 0 0 8px 0;
          font-family: var(--font-sans), system-ui, sans-serif;
        }

        .sign-details {
          list-style: none;
          margin: 0 0 10px 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .sign-details li {
          display: flex;
          gap: 6px;
          font-size: 9px;
          color: rgba(255, 255, 255, 0.7);
          font-family: var(--font-sans), system-ui, sans-serif;
          line-height: 1.5;
        }

        .sign-bullet {
          color: #00e5e5;
          flex-shrink: 0;
          font-size: 8px;
          margin-top: 1px;
        }

        .sign-cta-btn {
          background: rgba(0, 229, 229, 0.1);
          border: 1px solid rgba(0, 229, 229, 0.5);
          color: #00e5e5;
          padding: 6px 14px;
          font-size: 8px;
          letter-spacing: 1.5px;
          cursor: pointer;
          transition: all 0.18s ease;
          width: 100%;
          text-align: center;
          margin-top: 4px;
        }

        .sign-cta-btn:hover {
          background: rgba(0, 229, 229, 0.2);
          box-shadow: 0 0 10px rgba(0, 229, 229, 0.35);
        }

        /* Sign post stem */
        .fl-sign-stem {
          width: 10px;
          height: 32px;
          background: linear-gradient(180deg, #4a2e00 0%, #2d1a00 100%);
          border-left: 2px solid #1a0e00;
          border-right: 2px solid #5c3900;
        }

        /* ── PORTAL CLIMAX OVERLAY ── */
        .fl-portal-climax {
          position: absolute;
          inset: 0;
          z-index: 50;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 0 20px;
          pointer-events: auto;
          /* Very subtle dark vignette so 3D portal stays visible */
          background: radial-gradient(
            ellipse at center,
            transparent 40%,
            rgba(8, 4, 20, 0.65) 100%
          );
        }

        .fl-portal-climax.warp-active {
          background: rgba(4, 1, 16, 0.85);
        }

        .portal-status-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(0, 0, 0, 0.6);
          border: 1px solid rgba(232, 121, 249, 0.5);
          padding: 6px 16px;
          margin-bottom: 20px;
          backdrop-filter: blur(8px);
        }

        .portal-pip-pulse {
          width: 6px;
          height: 6px;
          background: #e879f9;
          border-radius: 50%;
          box-shadow: 0 0 10px #e879f9;
          animation: pip-blink 1s ease-in-out infinite;
        }

        .portal-status-pill span:last-child {
          font-size: 8px;
          color: #e879f9;
          letter-spacing: 2px;
        }

        .portal-climax-title {
          font-size: clamp(28px, 4.5vw, 52px);
          color: #ffffff;
          margin: 0 0 16px 0;
          line-height: 1.2;
          letter-spacing: 3px;
          text-shadow: 0 0 30px rgba(255, 45, 170, 0.5), 0 4px 20px rgba(0, 0, 0, 0.9);
        }

        .portal-title-gradient {
          background: linear-gradient(135deg, #ff2daa 0%, #7c3cff 50%, #00e5e5 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          display: block;
          font-size: clamp(36px, 6vw, 72px);
        }

        .portal-climax-desc {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.65);
          max-width: 400px;
          line-height: 1.7;
          margin: 0 0 24px 0;
          font-family: var(--font-sans), system-ui, sans-serif;
        }

        .portal-climax-desc strong {
          color: #ffd166;
        }

        .portal-register-btn {
          display: inline-flex;
          align-items: center;
          gap: 0;
          background: transparent;
          border: 2px solid #ff2daa;
          color: #ffffff !important;
          padding: 14px 32px;
          font-size: clamp(9px, 1.3vw, 12px);
          letter-spacing: 2px;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: all 0.2s ease;
          text-decoration: none !important;
          animation: portal-border-pulse 2s ease-in-out infinite;
        }

        .portal-register-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255, 45, 170, 0.15), rgba(124, 60, 255, 0.15));
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .portal-register-btn:hover::before,
        .portal-register-btn:not(:disabled):hover {
          opacity: 1;
          box-shadow: 0 0 25px rgba(255, 45, 170, 0.5), 0 0 60px rgba(124, 60, 255, 0.2);
        }

        .portal-register-btn.entering {
          border-color: #7c3cff;
          animation: portal-border-pulse 0.4s ease-in-out infinite;
          opacity: 0.75;
        }

        .btn-bracket {
          color: #ff2daa;
          font-size: 1.3em;
          line-height: 1;
        }

        .portal-hint {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.35);
          margin-top: 12px;
          letter-spacing: 0.5px;
          font-family: var(--font-sans), system-ui, sans-serif;
        }

        /* ── BOTTOM CHAPTER TAB BAR (Echoing Reference 2) ── */
        .fl-chapter-tabs {
          position: absolute;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          width: min(980px, 94vw);
          z-index: 52;
          background: rgba(7, 24, 16, 0.92);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(74, 222, 128, 0.35);
          border-radius: 9999px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.65), 0 0 20px rgba(74, 222, 128, 0.15);
          pointer-events: auto;
          overflow: hidden;
          padding: 2px 8px;
        }

        .chapter-progress-track {
          height: 3px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 9999px;
          margin: 4px 12px 2px 12px;
          position: relative;
          overflow: hidden;
        }

        .chapter-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #22c55e, #4ade80, #86efac);
          transition: width 0.15s ease-out;
          box-shadow: 0 0 10px rgba(74, 222, 128, 0.7);
        }

        .chapter-tabs-inner {
          display: flex;
          align-items: center;
          height: 42px;
          gap: 4px;
        }

        .chapter-tab {
          flex: 1;
          background: transparent;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
          position: relative;
          transition: all 0.2s ease;
          padding: 6px 12px;
          border-radius: 9999px;
          color: rgba(255, 255, 255, 0.45);
        }

        .chapter-tab:hover {
          background: rgba(74, 222, 128, 0.1);
          color: rgba(255, 255, 255, 0.85);
        }

        .chapter-tab.tab-past {
          color: rgba(134, 239, 172, 0.6);
        }

        .chapter-tab.tab-active {
          color: #ffffff;
          background: rgba(74, 222, 128, 0.22);
          border: 1px solid rgba(74, 222, 128, 0.55);
          box-shadow: 0 0 14px rgba(74, 222, 128, 0.35);
        }

        .tab-code {
          font-size: 8px;
          letter-spacing: 0.5px;
          opacity: 0.6;
        }

        .tab-active .tab-code {
          color: #4ade80;
          opacity: 1;
        }

        .tab-label {
          font-size: 8px;
          letter-spacing: 1.5px;
        }

        .tab-active-line {
          display: none;
        }

        .tab-reg-status {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 6px 16px;
          border-left: 1px solid rgba(74, 222, 128, 0.2);
          pointer-events: none;
          min-width: max-content;
        }

        .reg-dot {
          width: 6px;
          height: 6px;
          background: #4ade80;
          border-radius: 50%;
          box-shadow: 0 0 10px #4ade80;
          animation: pip-blink 1.8s ease-in-out infinite;
        }

        .reg-label {
          font-size: 7px;
          color: #4ade80;
          letter-spacing: 1.5px;
          text-shadow: 0 0 8px rgba(74, 222, 128, 0.5);
        }

        /* ── SCROLL CUE ── */
        .fl-scroll-cue {
          position: absolute;
          bottom: 60px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 40;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          pointer-events: auto;
          transition: opacity 0.3s ease;
        }

        .scroll-cue-line {
          width: 1px;
          height: 38px;
          background: linear-gradient(180deg, transparent, rgba(255,255,255,0.5));
          position: relative;
          overflow: hidden;
        }

        .scroll-cue-pip {
          position: absolute;
          width: 3px;
          height: 3px;
          background: #ffffff;
          border-radius: 50%;
          left: -1px;
          animation: scroll-pip 1.6s ease-in-out infinite;
        }

        .scroll-cue-text {
          font-size: 8px;
          color: rgba(255, 255, 255, 0.55);
          letter-spacing: 2.5px;
          white-space: nowrap;
        }

        /* ── PORTAL WARP FLARE ── */
        .portal-warp-flare {
          position: absolute;
          inset: 0;
          z-index: 100;
          pointer-events: none;
          background: radial-gradient(
            ellipse at center,
            rgba(255, 45, 170, 0.9) 0%,
            rgba(124, 60, 255, 0.75) 40%,
            rgba(0, 229, 229, 0.5) 70%,
            rgba(0, 0, 0, 0) 100%
          );
          opacity: 0;
          transform: scale(0);
          transition: opacity 0.35s ease, transform 0.35s ease;
        }

        .portal-warp-flare.warp-on {
          opacity: 1;
          transform: scale(3);
          transition: opacity 0.6s ease, transform 0.8s ease;
        }

        /* ── LOADING SCREEN ── */
        .fl-loader {
          position: absolute;
          inset: 0;
          z-index: 80;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          background: linear-gradient(180deg, #0d1b35 0%, #1a3a6e 100%);
        }

        .loader-row {
          display: flex;
          gap: 4px;
          align-items: flex-end;
        }

        .loader-block {
          width: 14px;
          background: #4ea8de;
        }

        .b1 { height: 14px; animation: bar-pulse 1.2s 0.0s ease-in-out infinite; }
        .b2 { height: 20px; animation: bar-pulse 1.2s 0.15s ease-in-out infinite; }
        .b3 { height: 28px; animation: bar-pulse 1.2s 0.30s ease-in-out infinite; background: #00e5e5; }
        .b4 { height: 20px; animation: bar-pulse 1.2s 0.45s ease-in-out infinite; }

        .loader-text {
          font-size: 9px;
          color: rgba(255, 255, 255, 0.6);
          letter-spacing: 2px;
        }

        /* ── WEBGL FALLBACK ── */
        .fl-webgl-fallback {
          position: absolute;
          inset: 0;
          z-index: 90;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 18px;
          background: linear-gradient(180deg, #0d1b35 0%, #1a3a6e 100%);
          text-align: center;
          padding: 40px;
        }

        .fl-webgl-fallback h2 {
          font-size: clamp(18px, 3vw, 28px);
          color: #ffffff;
          letter-spacing: 2px;
          margin: 0;
        }

        .fl-webgl-fallback p {
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
          font-family: var(--font-sans), system-ui, sans-serif;
          margin: 0;
          max-width: 400px;
        }

        /* ════════════════════════════════════
           KEYFRAME ANIMATIONS
        ════════════════════════════════════ */
        @keyframes pip-blink {
          0%, 100% { opacity: 1; box-shadow: 0 0 8px currentColor; }
          50% { opacity: 0.35; box-shadow: none; }
        }

        @keyframes sign-wobble {
          0%, 100% { transform: rotate(-0.5deg); }
          50% { transform: rotate(0.5deg); }
        }

        @keyframes portal-border-pulse {
          0%, 100% { border-color: #ff2daa; box-shadow: 0 0 12px rgba(255, 45, 170, 0.4); }
          50% { border-color: #7c3cff; box-shadow: 0 0 20px rgba(124, 60, 255, 0.5); }
        }

        @keyframes scroll-pip {
          0% { top: -3px; opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }

        @keyframes bar-pulse {
          0%, 100% { transform: scaleY(0.6); opacity: 0.5; }
          50% { transform: scaleY(1); opacity: 1; }
        }

        /* ════════════════════════════════════
           RESPONSIVE
        ════════════════════════════════════ */
        @media (max-width: 768px) {
          .fl-topbar { padding: 14px 18px; }
          .fl-brand-name { font-size: 0.75rem; }
          .fl-cinematic-badge { display: none; }
          .fl-sign-post-wrap { right: 14px; max-width: 220px; }
          .fl-sign-board { padding: 12px 14px; }
          .sign-details { display: none; }
          .opening-farlands-title { letter-spacing: 2px; }
          .tab-reg-status { display: none; }
          .chapter-tab { padding: 0 4px; gap: 3px; }
          .tab-label { display: none; }
          .fl-f3-hud { display: none; }
          .portal-climax-title { font-size: clamp(22px, 6vw, 36px); }
          .portal-register-btn { padding: 11px 22px; font-size: 9px; }
        }

        @media (max-width: 480px) {
          .fl-sign-post-wrap { display: none; }
          .fl-world-wrapper { height: 480vh; }
        }

        @media (prefers-reduced-motion: reduce) {
          .sign-wobble, .loader-block, .portal-border-pulse,
          .scroll-cue-pip, .cinematic-pip, .portal-pip-pulse,
          .reg-dot { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
