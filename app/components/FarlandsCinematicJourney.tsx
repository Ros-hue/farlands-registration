"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValueEvent,
  useReducedMotion,
} from "framer-motion";
import { minecraftFont } from "../fonts";
import { TypewriterWords } from "./Typewriter";
import { Volume2, VolumeX, Sparkles, ArrowRight, Compass, Shield, Zap } from "lucide-react";

// Dynamically import 3D Canvas without SSR
const FarlandsHero3DCanvas = dynamic(() => import("./farlands-hero/FarlandsHero3DCanvas"), {
  ssr: false,
  loading: () => <div className="canvas-placeholder-loader" />,
});

// Sound Synthesizer using Web Audio API
function playSynthesizedSound(type: "bow" | "warp" | "click" | "portal") {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === "click") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === "bow") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.25);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.55);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.55);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.55);
    } else if (type === "warp" || type === "portal") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.6);
      osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 1.2);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    }
  } catch {
    // Audio Context fallback
  }
}

export default function FarlandsCinematicJourney() {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [currentStage, setCurrentStage] = useState<"farlands" | "vishwakarma" | "portal" | "hub">("farlands");

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const progress = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 28,
    mass: 0.3,
  });

  // Track scroll position for internal 3D progress and sound triggers
  const [rawP, setRawP] = useState(0);

  useMotionValueEvent(progress, "change", (latest) => {
    setRawP(latest);
    if (latest < 0.35) {
      if (currentStage !== "farlands") setCurrentStage("farlands");
    } else if (latest >= 0.35 && latest < 0.65) {
      if (currentStage !== "vishwakarma") {
        setCurrentStage("vishwakarma");
        if (audioEnabled) playSynthesizedSound("bow");
      }
    } else if (latest >= 0.65 && latest < 0.88) {
      if (currentStage !== "portal") {
        setCurrentStage("portal");
        if (audioEnabled) playSynthesizedSound("warp");
      }
    } else if (latest >= 0.88) {
      if (currentStage !== "hub") setCurrentStage("hub");
    }
  });

  const handleSkipToRegister = () => {
    if (audioEnabled) playSynthesizedSound("click");
    if (containerRef.current) {
      const targetTop = containerRef.current.offsetTop + containerRef.current.offsetHeight;
      window.scrollTo({ top: targetTop, behavior: "smooth" });
    }
  };

  // Transform layers for the 4-phase journey:
  // Phase 1: Farlands 3D Voxel World (0 to 0.38)
  const farlandsOpacity = useTransform(progress, [0, 0.28, 0.36], [1, 1, 0]);
  const farlandsScale = useTransform(progress, [0, 0.35], [1, 1.15]);
  const heroProgress = Math.min(1, Math.max(0, rawP / 0.32));

  // Phase 2: Vishwakarma Memories (0.32 to 0.65)
  const vishwaOpacity = useTransform(progress, [0.32, 0.38, 0.58, 0.66], [0, 1, 1, 0]);
  const vishwaScale = useTransform(progress, [0.32, 0.65], [0.95, 1.1]);

  // Cosmic Arrow Launch across the memory realm
  const arrowX = useTransform(progress, [0.45, 0.68], [-300, 1400]);
  const arrowScale = useTransform(progress, [0.45, 0.56, 0.68], [0.8, 2, 3.2]);
  const arrowOpacity = useTransform(progress, [0.44, 0.48, 0.65, 0.7], [0, 1, 1, 0]);

  // Phase 3: The Dimensional Portal (0.62 to 0.88)
  const portalOpacity = useTransform(progress, [0.62, 0.7, 0.84, 0.92], [0, 1, 1, 0]);
  const portalScale = useTransform(progress, [0.62, 0.85], [0.7, 2.8]);
  const portalVortexRotate = useTransform(progress, [0.62, 0.9], [0, 360]);

  // Phase 4: Arrival Announcement (0.82 to 1.0)
  const arrivalOpacity = useTransform(progress, [0.82, 0.92, 1], [0, 1, 1]);

  if (prefersReduced) {
    return (
      <div className="journey-reduced">
        <div className={`journey-reduced-content ${minecraftFont.className}`}>
          <h1>FARLANDS HACKATHON 2026</h1>
          <p>The journey from Vishwakarma into the uncharted Minecraft frontier.</p>
          <a href="/register" className="btn-primary-farlands">
            REGISTER YOUR TEAM NOW
          </a>
        </div>
      </div>
    );
  }

  return (
    <section ref={containerRef} className="journey-container" id="journey-root">
      <div className="journey-sticky">
        {/* Top Floating Control Bar */}
        <div className="journey-nav-bar clean">
          <div className="journey-brand">
            <span className={`brand-text ${minecraftFont.className}`}>FARLANDS</span>
            <span className="brand-badge">2026</span>
          </div>

          <div className="journey-actions">
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className="journey-btn-icon"
              title={audioEnabled ? "Mute SFX" : "Enable SFX"}
              type="button"
            >
              {audioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>

            <button
              onClick={handleSkipToRegister}
              className={`journey-btn-skip ${minecraftFont.className}`}
              type="button"
            >
              SKIP TO REGISTRATION <ArrowRight size={14} style={{ marginLeft: 6 }} />
            </button>
          </div>
        </div>

        {/* ACT I: FARLANDS 3D VOXEL WORLD (Inspired by farlands-my-iteration) */}
        <motion.div
          className="journey-layer farlands-act"
          style={{ opacity: farlandsOpacity, scale: farlandsScale }}
        >
          <FarlandsHero3DCanvas progress={heroProgress} />

          <div className="farlands-floating-intro">
            <div className="intro-badge">
              <Sparkles size={14} className="cyan-icon" />
              <span className={minecraftFont.className}>EXPLORING THE FARLANDS</span>
            </div>
            <h1 className={`intro-title ${minecraftFont.className}`}>
              A DIFFERENT <br />
              <span className="gradient-text">PERSPECTIVE.</span>
            </h1>
            <p className="intro-desc">
              Where standard terrain generation glitches and infinite innovation begins.
              Scroll to take the leap.
            </p>
            <div className="scroll-hint">
              <span className={minecraftFont.className}>SCROLL TO EXPLORE</span>
              <div className="hint-arrow" />
            </div>
          </div>
        </motion.div>

        {/* ACT II: VISHWAKARMA MEMORIES */}
        <motion.div
          className="journey-layer vishwakarma-act"
          style={{ opacity: vishwaOpacity, scale: vishwaScale }}
        >
          <div className="vishwa-bg-wrapper">
            <Image
              src="/vishwakarma-archer.jpg"
              alt="Lord Vishwakarma with the golden bow"
              fill
              priority
              className="vishwa-bg-img"
            />
            <div className="vishwa-vignette" />
            <div className="gold-dust-particles" />
          </div>

          <div className="vishwa-text-container">
            <span className={`vishwa-kicker ${minecraftFont.className}`}>
              MEMORIES OF VISHWAKARMA // THE ARCHITECTURAL ROOT
            </span>
            <h2 className="vishwa-heading">The Divine Blueprint</h2>
            <div className={`vishwa-quote ${minecraftFont.className}`}>
              <p>
                <TypewriterWords
                  text="In Vishwakarma, we etched grand temples in stone, mastered sacred geometry, and built precision craftsmanship."
                  progress={progress}
                  range={[0.34, 0.44]}
                />
              </p>
              <p className="highlight-line">
                <TypewriterWords
                  text="Now the Master Architect draws the Golden Bow—releasing ancient wisdom into the voxel multiverse."
                  progress={progress}
                  range={[0.44, 0.54]}
                />
              </p>
            </div>
          </div>
        </motion.div>

        {/* ACT II.5: THE COSMIC GOLDEN ARROW */}
        <motion.div className="arrow-flight-layer" style={{ opacity: arrowOpacity }}>
          <motion.div className="cosmic-arrow" style={{ x: arrowX, scale: arrowScale }}>
            <div className="arrow-head-gold" />
            <div className="arrow-shaft-gold" />
            <div className="arrow-trail-gold" />
            <div className="arrow-sparkles" />
          </motion.div>
        </motion.div>

        {/* ACT III: THE DIMENSIONAL PORTAL */}
        <motion.div
          className="journey-layer portal-act"
          style={{ opacity: portalOpacity, scale: portalScale }}
        >
          <div className="portal-frame-wrapper">
            {/* Swirling Obsidian Portal Ring */}
            <motion.div
              className="portal-swirl-vortex"
              style={{ rotate: portalVortexRotate }}
            >
              <div className="vortex-layer outer" />
              <div className="vortex-layer inner" />
            </motion.div>

            <div className="portal-center-energy" />
            <div className="speed-lines" />
            <div className="portal-warp-grid" />

            <div className="portal-hud-callout">
              <span className={`portal-tag ${minecraftFont.className}`}>DIMENSIONAL PORTAL ACTIVATED</span>
              <h2 className={`portal-title ${minecraftFont.className}`}>ENTERING FARLANDS 2026</h2>
              <p>Breaching coordinate boundaries... 24-hour innovation sprint incoming.</p>
            </div>
          </div>
        </motion.div>

        {/* ACT IV: ARRIVAL ANNOUNCEMENT OVERLAY */}
        <motion.div
          className="journey-layer arrival-act"
          style={{ opacity: arrivalOpacity }}
        >
          <div className="arrival-content">
            <div className="arrival-badge">
              <Zap size={16} color="#ffd700" />
              <span className={minecraftFont.className}>PORTAL COMPLETED</span>
            </div>
            <h1 className={`arrival-heading ${minecraftFont.className}`}>
              WELCOME TO THE <br />
              <span className="accent-color">FARLANDS HACKATHON</span>
            </h1>
            <p className="arrival-subtitle">
              Squad size: 1-4 Builders &bull; Registration: ₹1,200 per Team &bull; 24H Non-Stop
            </p>

            <div className="arrival-ctas">
              <a href="/register" className={`btn-primary-farlands lg ${minecraftFont.className}`}>
                REGISTER YOUR SQUAD NOW <ArrowRight size={18} style={{ marginLeft: 8 }} />
              </a>
              <a href="#about" className={`btn-secondary-farlands ${minecraftFont.className}`}>
                EXPLORE HACKATHON HUB
              </a>
            </div>

            <div className="scroll-continue">
              <span className={minecraftFont.className}>SCROLL DOWN FOR TRACKS, RULES &amp; FAQ</span>
              <div className="scroll-chevron" />
            </div>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        .journey-container {
          position: relative;
          height: 440vh;
          width: 100%;
          background: #080a12;
        }

        .journey-sticky {
          position: sticky;
          top: 0;
          height: 100vh;
          width: 100%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #080a12;
        }

        .journey-layer {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .journey-nav-bar {
          position: absolute;
          top: 24px;
          left: 36px;
          right: 36px;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          pointer-events: auto;
        }

        .journey-brand {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .brand-text {
          font-size: 1.15rem;
          color: #ffd700;
          letter-spacing: 1px;
        }

        .brand-badge {
          background: rgba(0, 240, 255, 0.15);
          border: 1px solid rgba(0, 240, 255, 0.4);
          color: #00f0ff;
          font-size: 0.7rem;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 700;
        }

        .journey-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .journey-btn-icon {
          background: rgba(18, 24, 38, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #e5e7eb;
          padding: 10px;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s ease;
          backdrop-filter: blur(10px);
        }

        .journey-btn-icon:hover {
          color: #ffd700;
          border-color: #ffd700;
          transform: scale(1.05);
        }

        .journey-btn-skip {
          background: linear-gradient(135deg, rgba(168, 85, 247, 0.5), rgba(0, 240, 255, 0.5));
          border: 1px solid rgba(168, 85, 247, 0.8);
          color: #ffffff;
          padding: 10px 18px;
          border-radius: 6px;
          font-size: 0.75rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          backdrop-filter: blur(12px);
          transition: all 0.2s ease;
          letter-spacing: 1px;
        }

        .journey-btn-skip:hover {
          background: linear-gradient(135deg, #a855f7, #00f0ff);
          box-shadow: 0 0 20px rgba(168, 85, 247, 0.6);
          transform: translateY(-2px);
        }

        /* ACT I: FARLANDS INTRO STYLING */
        .farlands-act {
          z-index: 10;
        }

        .farlands-floating-intro {
          position: absolute;
          bottom: 12%;
          left: 50%;
          transform: translateX(-50%);
          text-align: center;
          z-index: 20;
          width: 90%;
          max-width: 720px;
          pointer-events: auto;
        }

        .intro-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(0, 240, 255, 0.12);
          border: 1px solid rgba(0, 240, 255, 0.35);
          color: #00f0ff;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 0.75rem;
          letter-spacing: 1px;
          margin-bottom: 16px;
        }

        .intro-title {
          font-size: 3rem;
          color: #ffffff;
          line-height: 1.15;
          margin: 0 0 16px 0;
          text-shadow: 0 0 30px rgba(0, 0, 0, 0.9);
        }

        .gradient-text {
          background: linear-gradient(135deg, #00f0ff 0%, #a855f7 60%, #ffd700 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .intro-desc {
          font-size: 1.05rem;
          color: #d1d5db;
          line-height: 1.6;
          margin: 0 auto 24px auto;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
        }

        .scroll-hint {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          color: #9ca3af;
          font-size: 0.75rem;
          letter-spacing: 1.5px;
        }

        .hint-arrow {
          width: 10px;
          height: 10px;
          border-right: 2px solid #00f0ff;
          border-bottom: 2px solid #00f0ff;
          transform: rotate(45deg);
          animation: bounce-hint 1.5s infinite;
        }

        @keyframes bounce-hint {
          0%, 100% { transform: translateY(0) rotate(45deg); }
          50% { transform: translateY(6px) rotate(45deg); }
        }

        /* ACT II: VISHWAKARMA MEMORIES */
        .vishwakarma-act {
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .vishwa-bg-wrapper {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }

        .vishwa-bg-img {
          object-fit: cover;
          object-position: center 25%;
          filter: contrast(1.1) brightness(0.9);
        }

        .vishwa-vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, transparent 30%, rgba(5, 4, 2, 0.8) 90%),
                      linear-gradient(180deg, rgba(8, 10, 18, 0.6) 0%, transparent 40%, rgba(8, 10, 18, 0.95) 100%);
        }

        .gold-dust-particles {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255, 215, 0, 0.25) 1.5px, transparent 1.5px);
          background-size: 40px 40px;
          opacity: 0.6;
        }

        .vishwa-text-container {
          position: relative;
          z-index: 25;
          text-align: center;
          max-width: 820px;
          width: 90%;
          padding: 0 20px;
          pointer-events: auto;
        }

        .vishwa-kicker {
          font-size: 0.8rem;
          color: #ffd700;
          letter-spacing: 3px;
          display: block;
          margin-bottom: 12px;
          text-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
        }

        .vishwa-heading {
          font-size: 3.5rem;
          font-weight: 900;
          background: linear-gradient(135deg, #ffffff 0%, #fff0a0 50%, #ffd700 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 0 0 20px 0;
          filter: drop-shadow(0 4px 20px rgba(0, 0, 0, 0.9));
        }

        .vishwa-quote {
          font-size: 1.05rem;
          line-height: 1.8;
          color: #fff5e0;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.9);
        }

        .highlight-line {
          margin-top: 14px;
          color: #ffffff;
          font-weight: 700;
          text-shadow: 0 0 15px rgba(255, 215, 0, 0.8);
        }

        /* ARROW FLIGHT */
        .arrow-flight-layer {
          position: absolute;
          inset: 0;
          z-index: 30;
          pointer-events: none;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cosmic-arrow {
          position: relative;
          width: 240px;
          height: 8px;
          background: #ffffff;
          box-shadow: 0 0 25px #ffd700, 0 0 50px #ffffff;
        }

        .arrow-head-gold {
          position: absolute;
          right: -16px;
          top: -12px;
          width: 0;
          height: 0;
          border-left: 22px solid #ffffff;
          border-top: 16px solid transparent;
          border-bottom: 16px solid transparent;
          filter: drop-shadow(0 0 15px #ffd700);
        }

        .arrow-trail-gold {
          position: absolute;
          left: -280px;
          top: -6px;
          width: 280px;
          height: 20px;
          background: linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.95));
        }

        /* ACT III: PORTAL VORTEX */
        .portal-act {
          z-index: 40;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at center, #2e0854 0%, #080a12 85%);
        }

        .portal-frame-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .portal-swirl-vortex {
          position: absolute;
          width: 550px;
          height: 550px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .vortex-layer.outer {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: conic-gradient(from 0deg, #9400d3, #00f0ff, #ff00ff, #9400d3);
          filter: blur(35px);
          opacity: 0.7;
        }

        .vortex-layer.inner {
          position: absolute;
          inset: 40px;
          border-radius: 50%;
          background: radial-gradient(circle at center, #05060b 40%, #7b1fa2 100%);
          box-shadow: inset 0 0 50px #00f0ff, 0 0 80px rgba(168, 85, 247, 0.8);
        }

        .portal-center-energy {
          position: absolute;
          width: 220px;
          height: 380px;
          background: linear-gradient(180deg, #a855f7, #3b82f6);
          border: 4px solid #ffffff;
          box-shadow: 0 0 60px #a855f7, inset 0 0 40px #ffffff;
          border-radius: 12px;
          filter: blur(2px);
          animation: portal-pulse 2s infinite ease-in-out;
        }

        @keyframes portal-pulse {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.08); opacity: 1; }
        }

        .speed-lines {
          position: absolute;
          inset: 0;
          background-image: repeating-linear-gradient(
            90deg,
            rgba(0, 240, 255, 0.2) 0px,
            transparent 24px,
            transparent 48px
          );
        }

        .portal-hud-callout {
          position: absolute;
          bottom: 15%;
          text-align: center;
          z-index: 50;
        }

        .portal-tag {
          color: #00f0ff;
          font-size: 0.8rem;
          letter-spacing: 2px;
          display: block;
          margin-bottom: 8px;
          text-shadow: 0 0 10px #00f0ff;
        }

        .portal-title {
          font-size: 2.4rem;
          color: #ffffff;
          margin: 0 0 8px 0;
          text-shadow: 0 0 20px #a855f7;
        }

        .portal-hud-callout p {
          color: #d1d5db;
          font-size: 1rem;
          margin: 0;
        }

        /* ACT IV: ARRIVAL ANNOUNCEMENT */
        .arrival-act {
          z-index: 60;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(8, 10, 18, 0.95);
          pointer-events: auto;
        }

        .arrival-content {
          text-align: center;
          max-width: 820px;
          padding: 0 24px;
        }

        .arrival-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 215, 0, 0.15);
          border: 1px solid rgba(255, 215, 0, 0.4);
          color: #ffd700;
          padding: 8px 18px;
          border-radius: 20px;
          font-size: 0.8rem;
          letter-spacing: 1.5px;
          margin-bottom: 20px;
        }

        .arrival-heading {
          font-size: 3.2rem;
          color: #ffffff;
          line-height: 1.2;
          margin: 0 0 16px 0;
        }

        .accent-color {
          background: linear-gradient(135deg, #00f0ff, #ffd700);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .arrival-subtitle {
          color: #9ca3af;
          font-size: 1.15rem;
          margin-bottom: 32px;
        }

        .arrival-ctas {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 36px;
        }

        .btn-primary-farlands {
          background: linear-gradient(135deg, #ff3344 0%, #c026d3 100%);
          color: #ffffff !important;
          border: none;
          padding: 16px 36px;
          font-size: 0.95rem;
          letter-spacing: 1px;
          font-weight: 700;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 20px rgba(255, 51, 68, 0.4);
          transition: all 0.25s ease;
          text-decoration: none !important;
          cursor: pointer;
        }

        .btn-primary-farlands:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(255, 51, 68, 0.6);
          background: linear-gradient(135deg, #ff4d5e 0%, #d946ef 100%);
        }

        .btn-secondary-farlands {
          background: rgba(18, 24, 38, 0.8);
          color: #ffffff !important;
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 16px 32px;
          font-size: 0.95rem;
          letter-spacing: 1px;
          font-weight: 700;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.25s ease;
          text-decoration: none !important;
        }

        .btn-secondary-farlands:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }

        .scroll-continue {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: #6b7280;
          font-size: 0.75rem;
          letter-spacing: 1.5px;
        }

        .scroll-chevron {
          width: 12px;
          height: 12px;
          border-right: 2px solid #00f0ff;
          border-bottom: 2px solid #00f0ff;
          transform: rotate(45deg);
          animation: bounce-hint 1.5s infinite;
        }

        @media (max-width: 768px) {
          .journey-nav-bar {
            top: 16px;
            left: 16px;
            right: 16px;
          }
          .intro-title {
            font-size: 2rem;
          }
          .vishwa-heading {
            font-size: 2.2rem;
          }
          .portal-title {
            font-size: 1.8rem;
          }
          .arrival-heading {
            font-size: 2.2rem;
          }
          .portal-swirl-vortex {
            width: 320px;
            height: 320px;
          }
        }
      `}</style>
    </section>
  );
}
