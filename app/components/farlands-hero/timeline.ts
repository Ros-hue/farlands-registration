export const CONFIG = Object.freeze({
  quarterTurn: Math.PI / 2,
  fallHeight: 22,
  jumpHeight: 2.15,
  cubeSize: 4.4,
  steveHeight: 1.72,
  landingY: 2.2,
  fallEnd: 0.16,
  cloudPeak: 0.20,
  cloudEnd: 0.28,
  contact: 0.35,
  settled: 0.38,
  diveStart: 0.36,
  divePeak: 0.43,
  diveEnd: 0.50,
  transitionsStart: 0.52,
  transitionDuration: 0.088,
  transitionCount: 5,
  cameraFallZ: 12,
  cameraWorldZ: 14,
  cameraFallX: 2.8,
  cameraWorldX: 7,
  cameraDesktopDistance: 1.22,
  cameraMobileDistance: 1.85,
});

export const BIOMES = [
  { name: 'PLAINS', sector: '01', status: 'STABLE', note: 'A softer landing in uncharted lands.' },
  { name: 'FOREST', sector: '02', status: 'EXPLORING', note: 'Canopy of possibilities.' },
  { name: 'HIGHLANDS', sector: '03', status: 'ACTIVE', note: 'Vast peaks of innovation.' },
  { name: 'DUSTLANDS', sector: '04', status: 'UNSTABLE', note: 'Deep voxel anomalies.' },
  { name: 'FRONTIER', sector: '05', status: 'SURGING', note: 'Where standard generation breaks.' },
  { name: 'THE GATEWAY', sector: '06', status: 'PORTAL READY', note: 'Dimensional threshold.' },
];

export type HackathonStateContent = {
  chapter: string;
  badge: string;
  headline: string;
  tagline: string;
  details?: string[];
  ctaLabel?: string;
};

export const HACKATHON_STATES: HackathonStateContent[] = [
  {
    chapter: "01 / 05",
    badge: "FARLANDS // ARRIVAL",
    headline: "FARLANDS",
    tagline: "Enter a world beyond the ordinary.",
    ctaLabel: "EXPLORE",
  },
  {
    chapter: "02 / 05",
    badge: "THE CHALLENGE",
    headline: "BUILD. EXPLORE. CREATE.",
    tagline: "24-Hour Sprint • 1 to 4 Builders • ₹1,200 per Team",
    ctaLabel: "DISCOVER QUEST",
  },
  {
    chapter: "03 / 05",
    badge: "THE QUEST // TRACKS",
    headline: "Choose Your Dimension",
    tagline: "Three focused quest dimensions for ambitious creators:",
    details: [
      "Neural Redstone: Autonomous AI Agents & Generative Models",
      "Ender Ledger: Web3, Smart Contracts & Zero-Knowledge Proofs",
      "Farlands Anomaly: Custom GameDev, Shaders & Hardware Hacks",
    ],
    ctaLabel: "CONTINUE",
  },
  {
    chapter: "04 / 05",
    badge: "THE UNCHARTED EDGE",
    headline: "Uncharted Code",
    tagline: "No artificial ceilings. Turn anomalies into breakthroughs.",
    ctaLabel: "APPROACH PORTAL",
  },
  {
    chapter: "05 / 05",
    badge: "DIMENSIONAL GATEWAY",
    headline: "STEP INTO FARLANDS",
    tagline: "The exploration is complete. Step through the portal to register your squad.",
    ctaLabel: "REGISTER NOW",
  },
];

export const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
export const range = (v: number, a: number, b: number) => clamp((v - a) / (b - a));
export const smooth = (v: number) => {
  const t = clamp(v);
  return t * t * (3 - 2 * t);
};
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export type TimelineState = {
  progress?: number;
  cloud?: number;
  reveal?: number;
  intro?: number;
  worldTurn?: number;
  currentBiomeIndex?: number;
  targetBiomeIndex?: number;
  jump?: number;
  crouch?: number;
  air?: number;
  phase?: string;
  y?: number;
  fall?: number;
  hasLanded?: boolean;
  diveProgress?: number;
  pullbackProgress?: number;
  portalActive?: boolean;
  portalProgress?: number;
  coordinates?: { x: number; y: number; z: number };
};

// Pure, absolute-time sampling: reversing or skipping scroll never queues events.
export function sampleTimeline(progress: number, out: TimelineState = {}): TimelineState {
  const p = clamp(progress);
  const c = CONFIG;
  out.progress = p;
  out.cloud = smooth(range(p, 0.10, c.cloudPeak)) * (1 - smooth(range(p, 0.22, c.cloudEnd)));
  out.reveal = smooth(range(p, 0.20, 0.32));
  out.intro = 1 - smooth(range(p, 0.02, 0.12));
  out.worldTurn = 0;
  out.currentBiomeIndex = 0;
  out.targetBiomeIndex = 0;
  out.jump = 0;
  out.crouch = 0;
  out.air = 0;
  out.phase = 'fall';

  const approach = range(p, 0.24, c.contact);
  out.y =
    p < 0.20
      ? mix(c.fallHeight, 12, smooth(range(p, 0, 0.20)))
      : mix(12, c.landingY, approach * approach);
  out.fall = 1 - smooth(range(p, 0.26, c.contact));

  out.hasLanded = p >= c.contact;

  if (p >= c.contact) {
    out.y = c.landingY;
    out.phase = 'rest';
    out.crouch = p < c.settled ? 0.16 * Math.sin(Math.PI * range(p, c.contact, c.settled)) : 0;
  }

  // Cinematic World Dive & Title Reveal Phase (The Second Reference integration)
  // Camera swoops in close to terrain between 0.36 and 0.48, then pulls back
  out.diveProgress =
    p >= c.diveStart && p <= c.diveEnd
      ? Math.sin(Math.PI * range(p, c.diveStart, c.diveEnd))
      : 0;
  out.pullbackProgress = smooth(range(p, c.divePeak, c.diveEnd));

  if (p >= c.transitionsStart) {
    const step = Math.min(
      c.transitionCount - 1,
      Math.floor((p - c.transitionsStart) / c.transitionDuration)
    );
    const t = range(
      p,
      c.transitionsStart + step * c.transitionDuration,
      c.transitionsStart + (step + 1) * c.transitionDuration
    );
    const air = range(t, 0.16, 0.78);
    out.air = Math.sin(Math.PI * air);
    out.jump = c.jumpHeight * 4 * air * (1 - air);
    out.y = c.landingY + out.jump;
    out.crouch =
      t < 0.16
        ? 0.19 * Math.sin((Math.PI * t) / 0.16)
        : t > 0.78 && t < 0.92
          ? 0.14 * Math.sin((Math.PI * (t - 0.78)) / 0.14)
          : 0;
    out.worldTurn = step + smooth(range(t, 0.24, 0.68));
    out.currentBiomeIndex = step + (t >= 0.68 ? 1 : 0);
    out.targetBiomeIndex = Math.min(step + 1, c.transitionCount);
    out.phase = t < 0.16 ? 'anticipation' : t < 0.78 ? 'jump' : 'rest';
  }

  // Final rotation is the 6th face (index >= 5 or progress >= 0.88)
  const isFinalRotation = (out.currentBiomeIndex ?? 0) >= 5 || p >= 0.88;
  out.portalActive = isFinalRotation;
  out.portalProgress = isFinalRotation ? smooth(range(p, 0.88, 0.98)) : 0;

  return out;
}
