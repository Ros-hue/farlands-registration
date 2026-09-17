"use client";

import { useRef, useState } from "react";
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
import { Volume2, VolumeX, Sparkles, ArrowRight } from "lucide-react";

// Dynamically import Three.js canvas without SSR
const MinecraftFarlandsCanvas = dynamic(() => import("./MinecraftFarlandsCanvas"), {
  ssr: false,
  loading: () => <div className="canvas-placeholder-loader" />
});

// Sound Synthesizer using Web Audio API
function playSynthesizedSound(type: "bow" | "warp" | "click") {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
    } else if (type === "warp") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.7);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 1.3);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.3);
    }
  } catch (e) {
    // Audio Context fallback
  }
}

interface JourneyProps {
  onCompleteJourney?: () => void;
}

export default function VishwakarmaToFarlandsJourney({ onCompleteJourney }: JourneyProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [arrowFired, setArrowFired] = useState(false);
  const [journeyCompleted, setJourneyCompleted] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const progress = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 28,
    mass: 0.3,
  });

  // Track progress stages
  const [stage, setStage] = useState<"vishwakarma" | "arrow_shot" | "farlands">("vishwakarma");

  useMotionValueEvent(progress, "change", (latest) => {
    if (latest >= 0.4 && stage !== "farlands") {
      setStage("farlands");
      if (!journeyCompleted) {
        setJourneyCompleted(true);
        if (onCompleteJourney) onCompleteJourney();
      }
    } else if (latest >= 0.15 && latest < 0.4 && stage !== "arrow_shot") {
      setStage("arrow_shot");
    } else if (latest < 0.15 && stage !== "vishwakarma") {
      setStage("vishwakarma");
    }
  });

  const handleSkip = () => {
    if (audioEnabled) playSynthesizedSound("click");
    if (containerRef.current) {
      const top = containerRef.current.offsetTop + containerRef.current.offsetHeight;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  // Transform values for Ancient Vishwakarma Archer Realm
  const ancientOpacity = useTransform(progress, [0, 0.22, 0.35], [1, 0.85, 0]);
  const archerScale = useTransform(progress, [0, 0.3], [1, 1.2]);
  const archerBrightness = useTransform(progress, [0, 0.2, 0.35], [1, 1.15, 0.3]);

  // Cosmic Arrow Flight
  const arrowX = useTransform(progress, [0.08, 0.32], [-200, 1200]);
  const arrowScale = useTransform(progress, [0.08, 0.22, 0.32], [0.8, 1.8, 3]);
  const arrowOpacity = useTransform(progress, [0.06, 0.1, 0.3, 0.35], [0, 1, 1, 0]);

  // Dimensional Voxel Wormhole Warp
  const warpOpacity = useTransform(progress, [0.2, 0.32, 0.42], [0, 1, 0]);
  const warpScale = useTransform(progress, [0.2, 0.42], [0.5, 3.5]);

  // Farlands World Reveal (Active up to 80% scroll progress)
  const farlandsOpacity = useTransform(progress, [0.32, 0.45, 0.85, 0.98], [0, 1, 1, 0]);

  if (prefersReduced) {
    return (
      <div className="journey-reduced">
        <div className={`journey-reduced-content ${minecraftFont.className}`}>
          <h1>VISHWAKARMA ? FARLANDS HACKATHON 2026</h1>
          <p>From Ancient Craftsmanship to the Uncharted Edge of Minecraft.</p>
        </div>
      </div>
    );
  }

  return (
    <section ref={containerRef} className="journey-container">
      <div className="journey-sticky">
        
        {/* TOP TOOLBAR: Audio & Skip Controls */}
        <div className="journey-nav-bar clean">
          <div className="journey-actions">
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className="journey-btn-icon"
              title={audioEnabled ? "Mute Sound FX" : "Enable Sound FX"}
            >
              {audioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>

            <button onClick={handleSkip} className={`journey-btn-skip ${minecraftFont.className}`}>
              SKIP TO REGISTRATION <ArrowRight size={14} style={{ marginLeft: 6 }} />
            </button>
          </div>
        </div>

        {/* ERA 1: LORD VISHWAKARMA ARCHER */}
        <motion.div
          className="journey-layer archer-realm"
          style={{ opacity: ancientOpacity, scale: archerScale, filter: `brightness(${archerBrightness})` }}
        >
          {/* Full Bleed Hero Artwork */}
          <div className="archer-bg-image-wrapper">
            <Image
              src="/vishwakarma-archer.jpg"
              alt="Lord Vishwakarma pulling the golden bow over ancient temples"
              fill
              priority
              className="archer-hero-img"
            />
            <div className="archer-subtle-vignette" />
            <div className="gold-particle-flare" />
          </div>

          {/* Borderless Floating Typography */}
          <div className="archer-borderless-content">
            <span className={`ancient-kicker-glow ${minecraftFont.className}`}>PREVIOUS ERA: VISHWAKARMA</span>
            <h1 className="ancient-title-hero">The Age of Vishwakarma</h1>

            <div className={`ancient-typewriter-hero ${minecraftFont.className}`}>
              <p>
                <TypewriterWords
                  text="In Vishwakarma, we crafted grand blueprints across ancient stone and sacred geometry..."
                  progress={progress}
                  range={[0.01, 0.08]}
                />
              </p>
              <p className="highlight-hero">
                <TypewriterWords
                  text="Now Vishwakarma draws the Golden Bow. Launch the arrow into the Minecraft Farlands!"
                  progress={progress}
                  range={[0.08, 0.16]}
                />
              </p>
            </div>
          </div>
        </motion.div>

        {/* ERA 1.5: ANCIENT GOLDEN ARROW FLYTHROUGH ANIMATION */}
        <motion.div className="arrow-flight-layer" style={{ opacity: arrowOpacity }}>
          <motion.div className="cosmic-arrow" style={{ x: arrowX, scale: arrowScale }}>
            <div className="arrow-head-gold" />
            <div className="arrow-shaft-gold" />
            <div className="arrow-trail-gold" />
            <div className="arrow-sparkles" />
          </motion.div>
        </motion.div>

        {/* TRANSITION: DIMENSIONAL VOXEL WORMHOLE WARP */}
        <motion.div
          className="voxel-warp-tunnel"
          style={{ opacity: warpOpacity, scale: warpScale }}
        >
          <div className="warp-particles" />
          <div className="speed-lines" />
          <div className="voxel-breakout-grid" />
        </motion.div>

        {/* ERA 2: MINECRAFT FARLANDS 3D VOXEL WORLD (Active up to 80% scroll progress) */}
        <motion.div className="journey-layer farlands-realm" style={{ opacity: farlandsOpacity }}>
          <MinecraftFarlandsCanvas progress={progress} />

          {/* Clean Overlay Banner leading to Registration */}
          {stage === "farlands" && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="farlands-arrival-banner"
            >
              <span className={`farlands-subtitle ${minecraftFont.className}`}>
                WELCOME TO THE UNCHARTED EDGE
              </span>
              <h1 className={`farlands-heading ${minecraftFont.className}`}>FARLANDS 2026</h1>
              <p className="farlands-desc">
                Where worlds collide. 24 hours of non-stop Minecraft-themed innovation.
              </p>
              
              <div className="scroll-indicator">
                <span className={minecraftFont.className}>SCROLL DOWN TO REGISTER & EXPLORE TRACKS</span>
                <div className="chevron-down" />
              </div>
            </motion.div>
          )}
        </motion.div>

      </div>
    </section>
  );
}
