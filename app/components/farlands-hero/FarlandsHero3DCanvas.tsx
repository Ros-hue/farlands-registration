"use client";

import { useEffect, useRef, useState } from "react";
import { Hero3D } from "./Hero3D";
import { BIOMES, range, smooth, TimelineState } from "./timeline";
import { minecraftFont } from "../../fonts";

type FarlandsHero3DCanvasProps = {
  progress: number; // 0 to 1 relative progress in Farlands Act
};

export default function FarlandsHero3DCanvas({ progress }: FarlandsHero3DCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<Hero3D | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeBiome, setActiveBiome] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let heroInstance: Hero3D | null = null;

    const onUpdate = (state: TimelineState) => {
      if (typeof state.currentBiomeIndex === "number") {
        setActiveBiome(state.currentBiomeIndex);
      }
    };

    const onError = (err: Error) => {
      console.warn("3D Hero fallback:", err);
      setLoading(false);
      setError("WebGL scene unavailable");
    };

    try {
      heroInstance = new Hero3D(container, onUpdate, onError);
      heroRef.current = heroInstance;

      heroInstance
        .load()
        .then(() => {
          setLoading(false);
          heroInstance?.setProgress(progress);
        })
        .catch((e) => {
          console.warn("Failed loading 3D models:", e);
          setLoading(false);
        });
    } catch (e) {
      console.warn("Error creating Hero3D:", e);
      setLoading(false);
    }

    return () => {
      heroInstance?.dispose();
      heroRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (heroRef.current) {
      heroRef.current.setProgress(progress);
    }
  }, [progress]);

  const currentBiome = BIOMES[Math.min(activeBiome, BIOMES.length - 1)];

  return (
    <div className="farlands-hero-3d-wrapper">
      <div ref={containerRef} className="farlands-hero-scene" />

      {/* Floating 3D HUD & Biome Indicators from farlands-my-iteration */}
      <div className="farlands-cube-hud">
        <div className="cube-eyebrow">
          <span className="live-dot" />
          <span className={minecraftFont.className}>FARLANDS VOXEL MATRIX</span>
        </div>

        <div className="cube-biome-card">
          <span className={`cube-biome-num ${minecraftFont.className}`}>
            BIOME {String(activeBiome + 1).padStart(2, "0")} / 06
          </span>
          <h3 className={minecraftFont.className}>{currentBiome.name}</h3>
          <p>{currentBiome.note}</p>
        </div>
      </div>

      {loading && (
        <div className="farlands-hero-loader">
          <div className="loader-voxel" />
          <span className={minecraftFont.className}>GENERATING FARLANDS TERRAIN...</span>
        </div>
      )}

      <style jsx>{`
        .farlands-hero-3d-wrapper {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: linear-gradient(180deg, #0b1122 0%, #151d38 55%, #1a1630 100%);
        }

        .farlands-hero-scene {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }

        .farlands-cube-hud {
          position: absolute;
          left: 40px;
          top: 100px;
          z-index: 15;
          pointer-events: none;
          max-width: 320px;
        }

        .cube-eyebrow {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #00f0ff;
          font-size: 11px;
          letter-spacing: 2px;
          margin-bottom: 12px;
        }

        .live-dot {
          width: 8px;
          height: 8px;
          background: #00f0ff;
          box-shadow: 0 0 10px #00f0ff;
          border-radius: 50%;
          animation: pulse 1.5s infinite;
        }

        .cube-biome-card {
          background: rgba(14, 20, 36, 0.75);
          border: 1px solid rgba(0, 240, 255, 0.25);
          backdrop-filter: blur(12px);
          padding: 16px 20px;
          border-radius: 8px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }

        .cube-biome-num {
          display: block;
          font-size: 10px;
          color: #ffd700;
          letter-spacing: 1px;
          margin-bottom: 6px;
        }

        .cube-biome-card h3 {
          margin: 0 0 6px 0;
          font-size: 14px;
          color: #ffffff;
          letter-spacing: 0.5px;
        }

        .cube-biome-card p {
          margin: 0;
          font-size: 12px;
          color: #9ca3af;
          line-height: 1.5;
        }

        .farlands-hero-loader {
          position: absolute;
          bottom: 30px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 12px;
          color: #9bb8e8;
          font-size: 11px;
          background: rgba(10, 18, 36, 0.85);
          border: 1px solid rgba(140, 180, 255, 0.3);
          padding: 10px 20px;
          border-radius: 6px;
          z-index: 20;
        }

        .loader-voxel {
          width: 10px;
          height: 10px;
          background: #00f0ff;
          box-shadow: 0 0 8px #00f0ff;
          animation: spin 1s infinite linear;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .farlands-cube-hud {
            left: 20px;
            top: 75px;
            max-width: 260px;
          }
          .cube-biome-card h3 {
            font-size: 12px;
          }
          .cube-biome-card p {
            font-size: 11px;
          }
        }
      `}</style>
    </div>
  );
}
