"use client";

import { useState } from "react";
import Link from "next/link";
import { minecraftFont } from "../fonts";
import {
  Sparkles,
  Trophy,
  Zap,
  Cpu,
  Boxes,
  Compass,
  ChevronDown,
  Shield,
  CheckCircle2,
  Gift,
  ArrowRight,
  LogIn,
} from "lucide-react";

export default function FarlandsLandingContent() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "Who can participate in Farlands Hackathon?",
      a: "Students, developers, designers, and innovators of all skill levels are welcome! Whether you are a beginner writing your first code or a seasoned hacker, there is a place for your squad in the Farlands.",
    },
    {
      q: "What is the squad size limit?",
      a: "Teams can range from 1 to 4 members. You can register individually or assemble a full 4-player team.",
    },
    {
      q: "What is the registration fee?",
      a: "Registration is ₹1,200 per team (covering up to 4 members). Once registered, you will be redirected to the secure UPI verification portal to submit your transaction details.",
    },
    {
      q: "What are the hackathon quest tracks?",
      a: "We have three primary quest dimensions: Artificial Intelligence & Autonomous Agents (Neural Redstone), Web3 & Blockchain (Ender Ledger), and Open Innovation & GameDev (Farlands Anomaly).",
    },
    {
      q: "How does the Vishwakarma to Farlands journey work?",
      a: "Vishwakarma established our foundations of architecture, precision, and sacred craft. Farlands is the unexplored digital frontier—where standard boundaries bend and transformative hacks take shape.",
    },
    {
      q: "Can I log in after registering?",
      a: "Yes! After submitting your registration, you can sign in anytime using your generated Team ID (e.g. FL26-XXXXXX) or your Team Leader email to monitor payment approval, team status, and announcements.",
    },
  ];

  return (
    <div className="farlands-hub">
      {/* STICKY MINIMAL NAVIGATION */}
      <nav className="farlands-nav">
        <div className="nav-brand">
          <span className={`nav-logo ${minecraftFont.className}`}>FARLANDS</span>
          <span className={`nav-tag ${minecraftFont.className}`}>HACKATHON 2026</span>
        </div>

        <div className={`nav-links ${minecraftFont.className}`}>
          <a href="#about">ABOUT</a>
          <a href="#tracks">TRACKS</a>
          <a href="#timeline">TIMELINE</a>
          <a href="#prizes">PRIZES</a>
          <a href="#faqs">FAQ</a>
        </div>

        <div className="nav-cta-group">
          <Link href="/login" className={`nav-login-btn ${minecraftFont.className}`}>
            <LogIn size={14} style={{ marginRight: 6 }} /> LOGIN
          </Link>
          <Link href="/register" className={`nav-register-btn ${minecraftFont.className}`}>
            REGISTER NOW
          </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="farlands-hero">
        <div className="hero-badge">
          <Sparkles size={14} className="gold-icon" />
          <span className={minecraftFont.className}>FARLANDS HACKATHON 2026</span>
        </div>

        <h1 className="hero-title">
          BEYOND THE <br />
          <span className={`hero-accent ${minecraftFont.className}`}>FARLANDS.</span>
        </h1>

        <p className="hero-subtitle">
          From Vishwakarma&apos;s ancient architecture into the glitched, infinite horizons of Minecraft.
          Build, code, and conquer in a 24-hour innovation sprint.
        </p>

        <div className="hero-cta-group">
          <Link href="/register" className={`btn-primary-farlands ${minecraftFont.className}`}>
            <Zap size={18} style={{ marginRight: 8 }} /> REGISTER YOUR SQUAD
          </Link>
          <a href="#tracks" className={`btn-secondary-farlands ${minecraftFont.className}`}>
            EXPLORE TRACKS
          </a>
        </div>

        {/* HACKATHON STATS */}
        <div className="hero-stats">
          <div className="stat-card">
            <span className={`stat-num ${minecraftFont.className}`}>24H</span>
            <span className={`stat-lbl ${minecraftFont.className}`}>NON-STOP SPRINT</span>
          </div>
          <div className="stat-card">
            <span className={`stat-num ${minecraftFont.className}`}>₹1,200</span>
            <span className={`stat-lbl ${minecraftFont.className}`}>PER SQUAD (1-4)</span>
          </div>
          <div className="stat-card">
            <span className={`stat-num ${minecraftFont.className}`}>3</span>
            <span className={`stat-lbl ${minecraftFont.className}`}>QUEST TRACKS</span>
          </div>
          <div className="stat-card">
            <span className={`stat-num ${minecraftFont.className}`}>1-4</span>
            <span className={`stat-lbl ${minecraftFont.className}`}>SQUAD SIZE</span>
          </div>
        </div>
      </header>

      {/* ABOUT SECTION */}
      <section className="hub-section" id="about">
        <div className="section-header">
          <span className={`section-kicker ${minecraftFont.className}`}>THE CONTINUOUS EXPEDITION</span>
          <h2 className={minecraftFont.className}>Where Worlds Collide</h2>
          <p>
            In Minecraft, the Farlands represent the legendary edge of terrain generation—where rules bend,
            creativity multiplies, and impossible architectures emerge.
          </p>
        </div>

        <div className="lore-grid">
          <div className="lore-card">
            <div className="lore-icon-box gold">
              <Shield size={28} />
            </div>
            <h3 className={minecraftFont.className}>Vishwakarma Heritage</h3>
            <p>
              Grounded in the sacred principles of divine architecture, precision engineering, and timeless craftsmanship.
            </p>
          </div>

          <div className="lore-card">
            <div className="lore-icon-box purple">
              <Boxes size={28} />
            </div>
            <h3 className={minecraftFont.className}>Voxel Innovation</h3>
            <p>
              Break down complex problems block by block. Use AI, Web3, and open innovation tools to construct the future.
            </p>
          </div>

          <div className="lore-card">
            <div className="lore-icon-box green">
              <Compass size={28} />
            </div>
            <h3 className={minecraftFont.className}>Uncharted Frontier</h3>
            <p>
              Push past conventional limits. Exploit glitches in old paradigms and turn unexpected anomalies into breakthroughs.
            </p>
          </div>
        </div>
      </section>

      {/* TRACKS SECTION */}
      <section className="hub-section tracks-section" id="tracks">
        <div className="section-header">
          <span className={`section-kicker ${minecraftFont.className}`}>CHOOSE YOUR DIMENSION</span>
          <h2 className={minecraftFont.className}>Hackathon Quest Tracks</h2>
        </div>

        <div className="tracks-container">
          <div className="track-card">
            <div className="track-card-header">
              <div className="track-icon redstone">
                <Cpu size={30} />
              </div>
              <span className={`track-badge redstone ${minecraftFont.className}`}>AI &amp; AGENTS</span>
            </div>
            <h3 className={minecraftFont.className}>Neural Redstone</h3>
            <p>
              Deploy autonomous AI agents, fine-tuned neural models, and intelligent workflows that automate complex multi-step systems.
            </p>
            <ul className="track-perks">
              <li>
                <CheckCircle2 size={16} className="perk-check redstone" /> LLMs &amp; Autonomous Agents
              </li>
              <li>
                <CheckCircle2 size={16} className="perk-check redstone" /> Computer Vision &amp; Generative AI
              </li>
              <li>
                <CheckCircle2 size={16} className="perk-check redstone" /> Smart Automation Circuitry
              </li>
            </ul>
          </div>

          <div className="track-card">
            <div className="track-card-header">
              <div className="track-icon ender">
                <Boxes size={30} />
              </div>
              <span className={`track-badge ender ${minecraftFont.className}`}>WEB3 &amp; PROTOCOLS</span>
            </div>
            <h3 className={minecraftFont.className}>Ender Ledger</h3>
            <p>
              Construct decentralized dApps, zero-knowledge verifiable systems, and secure peer-to-peer economic protocols.
            </p>
            <ul className="track-perks">
              <li>
                <CheckCircle2 size={16} className="perk-check ender" /> Smart Contracts &amp; DeFi
              </li>
              <li>
                <CheckCircle2 size={16} className="perk-check ender" /> Decentralized Infrastructure
              </li>
              <li>
                <CheckCircle2 size={16} className="perk-check ender" /> Zero-Knowledge Proofs
              </li>
            </ul>
          </div>

          <div className="track-card">
            <div className="track-card-header">
              <div className="track-icon emerald">
                <Sparkles size={30} />
              </div>
              <span className={`track-badge emerald ${minecraftFont.className}`}>OPEN INNOVATION</span>
            </div>
            <h3 className={minecraftFont.className}>Farlands Anomaly</h3>
            <p>
              No constraints. No strict boundaries. Build wild hacks, custom game engines, hardware robotics, or unconventional developer tools.
            </p>
            <ul className="track-perks">
              <li>
                <CheckCircle2 size={16} className="perk-check emerald" /> Game Development &amp; Shaders
              </li>
              <li>
                <CheckCircle2 size={16} className="perk-check emerald" /> Hardware &amp; IoT Integrations
              </li>
              <li>
                <CheckCircle2 size={16} className="perk-check emerald" /> High-Impact Developer Utilities
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* TIMELINE SECTION */}
      <section className="hub-section" id="timeline">
        <div className="section-header">
          <span className={`section-kicker ${minecraftFont.className}`}>PROGRESSION PATH</span>
          <h2 className={minecraftFont.className}>Crafting Your Victory</h2>
        </div>

        <div className="crafting-timeline">
          <div className="timeline-node">
            <div className={`node-icon wood ${minecraftFont.className}`}>1</div>
            <div className="node-content">
              <span className={`node-step ${minecraftFont.className}`}>STEP I: SQUAD FORMATION</span>
              <h4 className={minecraftFont.className}>Register &amp; Assemble</h4>
              <p>Form your squad of 1-4 hackers, complete registration, and secure your place in the arena.</p>
            </div>
          </div>

          <div className="timeline-node">
            <div className={`node-icon stone ${minecraftFont.className}`}>2</div>
            <div className="node-content">
              <span className={`node-step ${minecraftFont.className}`}>STEP II: KICKOFF</span>
              <h4 className={minecraftFont.className}>Opening Ceremony &amp; Track Briefing</h4>
              <p>Track releases, mentor introductions, technical workshops, and idea validation sessions.</p>
            </div>
          </div>

          <div className="timeline-node">
            <div className={`node-icon iron ${minecraftFont.className}`}>3</div>
            <div className="node-content">
              <span className={`node-step ${minecraftFont.className}`}>STEP III: THE SPRINT</span>
              <h4 className={minecraftFont.className}>24-Hour Building Sprint</h4>
              <p>Non-stop building with midnight gaming breaks, redstone mentor check-ins, and code sprints.</p>
            </div>
          </div>

          <div className="timeline-node">
            <div className={`node-icon diamond ${minecraftFont.className}`}>4</div>
            <div className="node-content">
              <span className={`node-step ${minecraftFont.className}`}>STEP IV: TRIUMPH</span>
              <h4 className={minecraftFont.className}>Demos &amp; Awards</h4>
              <p>Live project presentations, jury evaluations, and crowning the Farlands Champions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PRIZES SECTION */}
      <section className="hub-section prizes-section" id="prizes">
        <div className="section-header">
          <span className={`section-kicker ${minecraftFont.className}`}>ENDER CHEST LOOT</span>
          <h2 className={minecraftFont.className}>Hackathon Prizes</h2>
        </div>

        <div className="prizes-grid">
          <div className="prize-card gold-tier">
            <div className="prize-trophy">
              <Trophy size={44} color="#ffd700" />
            </div>
            <h3 className={minecraftFont.className}>PRIZE 1</h3>
            <div className={`prize-amount ${minecraftFont.className}`}>CHAMPIONS</div>
            <p>Ender Dragon Trophy + Premium Swag Kits + Cloud Credits &amp; Incubation Opportunity</p>
          </div>

          <div className="prize-card diamond-tier">
            <div className="prize-trophy">
              <Zap size={44} color="#00f0ff" />
            </div>
            <h3 className={minecraftFont.className}>PRIZE 2</h3>
            <div className={`prize-amount ${minecraftFont.className}`}>RUNNER UP</div>
            <p>Diamond Sword Trophy + Hardware Swag Kits + Exclusive Developer Subscriptions</p>
          </div>

          <div className="prize-card emerald-tier">
            <div className="prize-trophy">
              <Gift size={44} color="#10b981" />
            </div>
            <h3 className={minecraftFont.className}>PRIZE 3</h3>
            <div className={`prize-amount ${minecraftFont.className}`}>SECOND RUNNER UP</div>
            <p>Emerald Block Trophy + Exclusive Developer Goodies + Mentorship Sessions</p>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="hub-section" id="faqs">
        <div className="section-header">
          <span className={`section-kicker ${minecraftFont.className}`}>GOT QUESTIONS?</span>
          <h2 className={minecraftFont.className}>Frequently Asked Questions</h2>
        </div>

        <div className="faq-list">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className={`faq-item ${activeFaq === i ? "active" : ""}`}
              onClick={() => setActiveFaq(activeFaq === i ? null : i)}
            >
              <div className="faq-question">
                <span className={minecraftFont.className}>{faq.q}</span>
                <ChevronDown className="faq-chevron" size={20} />
              </div>
              {activeFaq === i && <p className="faq-answer">{faq.a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* FINAL REGISTRATION BANNER */}
      <section className="final-cta-banner">
        <div className="cta-box">
          <h2 className={minecraftFont.className}>READY TO ENTER THE FARLANDS?</h2>
          <p>Registration takes under 2 minutes. Assemble your squad and claim your place in history.</p>
          <Link href="/register" className={`btn-primary-farlands lg ${minecraftFont.className}`}>
            REGISTER YOUR TEAM NOW <ArrowRight size={18} style={{ marginLeft: 8 }} />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="farlands-footer">
        <div className="footer-inner">
          <div className="footer-left">
            <span className={`footer-logo ${minecraftFont.className}`}>FARLANDS 2026</span>
            <p>The continuous journey from Vishwakarma to the Minecraft frontier.</p>
          </div>
          <div className="footer-right">
            <span>&copy; 2026 Farlands Hackathon</span>
            <span>Crafted with passion, code &amp; voxels</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
