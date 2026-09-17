"use client";

import { useState, useEffect } from "react";
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
  ArrowRight
} from "lucide-react";

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({ days: 24, hours: 12, minutes: 45, seconds: 30 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="countdown-box">
      <div className="countdown-unit">
        <span className={`countdown-val ${minecraftFont.className}`}>{timeLeft.days}</span>
        <span className={`countdown-label ${minecraftFont.className}`}>DAYS</span>
      </div>
      <span className={`countdown-colon ${minecraftFont.className}`}>:</span>
      <div className="countdown-unit">
        <span className={`countdown-val ${minecraftFont.className}`}>
          {timeLeft.hours.toString().padStart(2, "0")}
        </span>
        <span className={`countdown-label ${minecraftFont.className}`}>HOURS</span>
      </div>
      <span className={`countdown-colon ${minecraftFont.className}`}>:</span>
      <div className="countdown-unit">
        <span className={`countdown-val ${minecraftFont.className}`}>
          {timeLeft.minutes.toString().padStart(2, "0")}
        </span>
        <span className={`countdown-label ${minecraftFont.className}`}>MINS</span>
      </div>
      <span className={`countdown-colon ${minecraftFont.className}`}>:</span>
      <div className="countdown-unit">
        <span className={`countdown-val ${minecraftFont.className}`}>
          {timeLeft.seconds.toString().padStart(2, "0")}
        </span>
        <span className={`countdown-label ${minecraftFont.className}`}>SECS</span>
      </div>
    </div>
  );
}

export default function FarlandsLandingContent() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "Who can participate in Farlands Hackathon?",
      a: "Students, developers, designers, and innovators of all skill levels are welcome! Whether you are a beginner writing your first code or a seasoned hacker, there is a place for you."
    },
    {
      q: "What is the team size limit?",
      a: "Teams can range from 1 to 4 members. You can register individually and join our Discord to find teammates before the hackathon begins."
    },
    {
      q: "Is there any registration fee?",
      a: "Zero! Farlands is completely free to attend. We provide resources, workshops, mentor support, and prizes at no cost."
    },
    {
      q: "What are the track categories?",
      a: "We have three main tracks: Artificial Intelligence (Neural Redstone), Web3 & Blockchain (Ender Ledger), and Open Innovation (Farlands Anomaly)."
    },
    {
      q: "How does the transition from Vishwakarma work?",
      a: "Vishwakarma was our foundation of architecture; Farlands is the unexplored frontier. This hackathon pushes code beyond standard boundaries into uncharted innovation."
    }
  ];

  return (
    <div className="farlands-hub">
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

        <Link href="/register" className={`nav-register-btn ${minecraftFont.className}`}>
          REGISTER NOW
        </Link>
      </nav>

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
          From Vishwakarma&apos;s ancient architecture to the infinite glitched horizons of Minecraft.
          Build, code, and conquer in a 24-hour innovation sprint.
        </p>

        <div className="hero-timer-wrapper">
          <span className={`timer-title ${minecraftFont.className}`}>HACKATHON KICKOFF IN:</span>
          <CountdownTimer />
        </div>

        <div className="hero-cta-group">
          <Link href="/register" className={`btn-primary-farlands ${minecraftFont.className}`}>
            <Zap size={18} style={{ marginRight: 8 }} /> REGISTER YOUR TEAM
          </Link>
          <a href="#tracks" className={`btn-secondary-farlands ${minecraftFont.className}`}>
            EXPLORE TRACKS
          </a>
        </div>

        <div className="hero-stats">
          <div className="stat-card">
            <span className={`stat-num ${minecraftFont.className}`}>24H</span>
            <span className={`stat-lbl ${minecraftFont.className}`}>NON-STOP HACKING</span>
          </div>
          <div className="stat-card">
            <span className={`stat-num ${minecraftFont.className}`}>$150K+</span>
            <span className={`stat-lbl ${minecraftFont.className}`}>PRIZES & BOUNTIES</span>
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

      <section className="hub-section" id="about">
        <div className="section-header">
          <span className={`section-kicker ${minecraftFont.className}`}>THE CONTINUOUS JOURNEY</span>
          <h2 className={minecraftFont.className}>Where Worlds Collide</h2>
          <p>
            In Minecraft, the Farlands represent the legendary edge of terrain generation - where rules bend,
            creativity multiplies, and impossible structures take shape.
          </p>
        </div>

        <div className="lore-grid">
          <div className="lore-card">
            <div className="lore-icon-box gold">
              <Shield size={28} />
            </div>
            <h3 className={minecraftFont.className}>Vishwakarma Legacy</h3>
            <p>
              Built on the principles of precision, strength, and divine architecture established in Vishwakarma.
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
            <h3 className={minecraftFont.className}>Uncharted Territory</h3>
            <p>
              Push past traditional hackathon limits. Discover glitches in old paradigms and turn them into breakthroughs.
            </p>
          </div>
        </div>
      </section>

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
              <span className={`track-badge redstone ${minecraftFont.className}`}>AI & ML</span>
            </div>
            <h3 className={minecraftFont.className}>Neural Redstone</h3>
            <p>
              Deploy autonomous AI agents, machine learning models, and intelligent workflows that automate complex systems.
            </p>
            <ul className="track-perks">
              <li><CheckCircle2 size={16} className="perk-check redstone" /> LLMs & Autonomous Agents</li>
              <li><CheckCircle2 size={16} className="perk-check redstone" /> Computer Vision & Generative AI</li>
              <li><CheckCircle2 size={16} className="perk-check redstone" /> Smart Automation Redstone</li>
            </ul>
          </div>

          <div className="track-card">
            <div className="track-card-header">
              <div className="track-icon ender">
                <Boxes size={30} />
              </div>
              <span className={`track-badge ender ${minecraftFont.className}`}>WEB3 & BLOCKCHAIN</span>
            </div>
            <h3 className={minecraftFont.className}>Ender Ledger</h3>
            <p>
              Construct decentralized dApps, zero-knowledge proofs, and secure cross-chain protocols.
            </p>
            <ul className="track-perks">
              <li><CheckCircle2 size={16} className="perk-check ender" /> Smart Contracts & DeFi</li>
              <li><CheckCircle2 size={16} className="perk-check ender" /> Decentralized Storage</li>
              <li><CheckCircle2 size={16} className="perk-check ender" /> Zero-Knowledge Proofs</li>
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
              No constraints. No strict boundaries. Build wild hacks, game engines, hardware tools, or unconventional software.
            </p>
            <ul className="track-perks">
              <li><CheckCircle2 size={16} className="perk-check emerald" /> Game Development</li>
              <li><CheckCircle2 size={16} className="perk-check emerald" /> Hardware & IoT Hacks</li>
              <li><CheckCircle2 size={16} className="perk-check emerald" /> Developer Tools & Utilities</li>
            </ul>
          </div>
        </div>
      </section>

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
              <h4 className={minecraftFont.className}>Register & Assemble</h4>
              <p>Form your team of 1-4 hackers, register on the platform, and claim your spot.</p>
            </div>
          </div>

          <div className="timeline-node">
            <div className={`node-icon stone ${minecraftFont.className}`}>2</div>
            <div className="node-content">
              <span className={`node-step ${minecraftFont.className}`}>STEP II: KICKOFF</span>
              <h4 className={minecraftFont.className}>Opening Ceremony & Keynote</h4>
              <p>Track releases, mentor introductions, and initial idea validation sessions.</p>
            </div>
          </div>

          <div className="timeline-node">
            <div className={`node-icon iron ${minecraftFont.className}`}>3</div>
            <div className="node-content">
              <span className={`node-step ${minecraftFont.className}`}>STEP III: THE SPRINT</span>
              <h4 className={minecraftFont.className}>24-Hour Hacking Journey</h4>
              <p>Non-stop building with midnight gaming breaks, redstone workshops, and mentor check-ins.</p>
            </div>
          </div>

          <div className="timeline-node">
            <div className={`node-icon diamond ${minecraftFont.className}`}>4</div>
            <div className="node-content">
              <span className={`node-step ${minecraftFont.className}`}>STEP IV: TRIUMPH</span>
              <h4 className={minecraftFont.className}>Demos & Awards</h4>
              <p>Project presentations, judge evaluations, and crowning the Farlands Champions.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="hub-section prizes-section" id="prizes">
        <div className="section-header">
          <span className={`section-kicker ${minecraftFont.className}`}>ENDER CHEST LOOT</span>
          <h2 className={minecraftFont.className}>$150,000+ Prize Pool</h2>
        </div>

        <div className="prizes-grid">
          <div className="prize-card gold-tier">
            <div className="prize-trophy">
              <Trophy size={44} color="#ffd700" />
            </div>
            <h3 className={minecraftFont.className}>1ST PLACE</h3>
            <div className={`prize-amount ${minecraftFont.className}`}>$50,000</div>
            <p>Ender Dragon Trophy + Cloud Credits + VC Incubator Pitch</p>
          </div>

          <div className="prize-card diamond-tier">
            <div className="prize-trophy">
              <Zap size={44} color="#00f0ff" />
            </div>
            <h3 className={minecraftFont.className}>2ND PLACE</h3>
            <div className={`prize-amount ${minecraftFont.className}`}>$30,000</div>
            <p>Diamond Sword Trophy + Hardware Swag Kits</p>
          </div>

          <div className="prize-card emerald-tier">
            <div className="prize-trophy">
              <Gift size={44} color="#10b981" />
            </div>
            <h3 className={minecraftFont.className}>3RD PLACE</h3>
            <div className={`prize-amount ${minecraftFont.className}`}>$15,000</div>
            <p>Emerald Block Trophy + Exclusive Developer Subscriptions</p>
          </div>
        </div>
      </section>

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

      <section className="final-cta-banner">
        <div className="cta-box">
          <h2 className={minecraftFont.className}>READY TO ENTER THE FARLANDS?</h2>
          <p>Registration takes under 2 minutes. Bring your squad and claim your place in history.</p>
          <Link href="/register" className={`btn-primary-farlands lg ${minecraftFont.className}`}>
            REGISTER YOUR TEAM NOW <ArrowRight size={18} style={{ marginLeft: 8 }} />
          </Link>
        </div>
      </section>

      <footer className="farlands-footer">
        <div className="footer-inner">
          <div className="footer-left">
            <span className={`footer-logo ${minecraftFont.className}`}>FARLANDS 2026</span>
            <p>The continuous journey from Vishwakarma to the Minecraft frontier.</p>
          </div>
          <div className="footer-right">
            <span>&copy; 2026 Farlands Hackathon</span>
            <span>Built with passion, code &amp; voxels</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
