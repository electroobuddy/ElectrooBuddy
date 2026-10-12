"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, ShoppingBag, ChevronRight, Check,
  Zap, Shield, Clock, Star, Phone, Award, Smile, Wrench
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
interface HeroProps {
  serviceShowcase: {
    title: string;
    description: string;
    color: string;
    features: string[];
    icon: React.ElementType;
  }[];
  counters: { experience: number; clients: number; projects: number };
  currentService: number;
  setCurrentService: (n: number) => void;
  scrollToSection: (id: string) => void;
  handleBookService: (title: string) => void;
}

// ── Spark particle ────────────────────────────────────────────────────────────
interface Spark { id: number; x: number; y: number; vx: number; vy: number; life: number; size: number; }

// ── Main Component ────────────────────────────────────────────────────────────
export default function HeroSection({
  serviceShowcase, counters, currentService,
  setCurrentService, scrollToSection, handleBookService,
}: HeroProps) {
  const [sparks, setSparks]       = useState<Spark[]>([]);
  const [tick, setTick]           = useState(0);
  const [cardHover, setCardHover] = useState(false);
  const sparkId  = useRef(0);
  const frameRef = useRef<number>();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ── Animate sparks ──────────────────────────────────────────────────────────
  useEffect(() => {
    let last = 0;
    function loop(t: number) {
      frameRef.current = requestAnimationFrame(loop);
      if (t - last < 50) return; // ~20fps for sparks
      last = t;
      setSparks(prev => {
        const next = prev
          .map(s => ({ ...s, x: s.x + s.vx, y: s.y + s.vy, vy: s.vy + 0.08, life: s.life - 1 }))
          .filter(s => s.life > 0);
        // Spawn 1–2 new sparks per tick
        const spawned: Spark[] = [];
        const count = Math.random() < 0.4 ? 2 : 1;
        for (let i = 0; i < count; i++) {
          spawned.push({
            id: ++sparkId.current,
            x: 55 + Math.random() * 42, // % of width
            y: -2,
            vx: (Math.random() - 0.5) * 1.2,
            vy: 0.4 + Math.random() * 0.8,
            life: 28 + Math.floor(Math.random() * 20),
            size: 2 + Math.random() * 3,
          });
        }
        return [...next, ...spawned].slice(-60);
      });
    }
    frameRef.current = requestAnimationFrame(loop);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, []);

  // ── Canvas circuit drawing ──────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const lines = [
      { x1: 0, y1: 0.3, x2: 0.18, y2: 0.3, x3: 0.22, y3: 0.45, x4: 0.35, y4: 0.45 },
      { x1: 0, y1: 0.6, x2: 0.10, y2: 0.6, x3: 0.14, y3: 0.7, x4: 0.28, y4: 0.7 },
      { x1: 1, y1: 0.2, x2: 0.82, y2: 0.2, x3: 0.78, y3: 0.38, x4: 0.65, y4: 0.38 },
      { x1: 1, y1: 0.8, x2: 0.88, y2: 0.8, x3: 0.84, y3: 0.65, x4: 0.72, y4: 0.65 },
    ];

    const W = canvas.width, H = canvas.height;
    lines.forEach(l => {
      const grad = ctx.createLinearGradient(l.x1 * W, l.y1 * H, l.x4 * W, l.y4 * H);
      grad.addColorStop(0, "rgba(59,130,246,0)");
      grad.addColorStop(0.5, "rgba(59,130,246,0.35)");
      grad.addColorStop(1, "rgba(59,130,246,0)");
      ctx.beginPath();
      ctx.moveTo(l.x1 * W, l.y1 * H);
      ctx.lineTo(l.x2 * W, l.y2 * H);
      ctx.lineTo(l.x3 * W, l.y3 * H);
      ctx.lineTo(l.x4 * W, l.y4 * H);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1;
      ctx.stroke();
      // Node dots
      [l.x1, l.x4].forEach((x, i) => {
        const y = i === 0 ? l.y1 : l.y4;
        ctx.beginPath();
        ctx.arc(x * W, y * H, 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(59,130,246,0.5)";
        ctx.fill();
      });
    });
  }, []);

  // ── Auto-rotate ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const iv = setInterval(() => {
      setCurrentService(p  => (p + 1) % serviceShowcase.length);
    }, 4000);
    return () => clearInterval(iv);
  }, [serviceShowcase.length, setCurrentService]);

  const IconComponent = serviceShowcase[currentService].icon;

  return (
    <>
      {/* ─────────────────────────────────────────────────────────────────────
          GLOBAL STYLES
      ──────────────────────────────────────────────────────────────────────── */}
      <style>{`
        0,600;0,700;0,900;1,900&family=DM+Sans:wght@300;400;500;600&display=swap');

        .eb-hero {
          position: relative;
          background: #060b14;
          overflow: hidden;
          font-family: 'DM Sans', sans-serif;
        }

        /* ── electric grid overlay ── */
        .eb-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        /* ── radial glow blobs ── */
        .eb-glow-l {
          position: absolute;
          left: -15%;
          top: 10%;
          width: 55vw;
          height: 55vw;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(29,78,216,0.22) 0%, transparent 65%);
          pointer-events: none;
          filter: blur(1px);
        }
        .eb-glow-r {
          position: absolute;
          right: -10%;
          bottom: 0;
          width: 40vw;
          height: 40vw;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(250,204,21,0.08) 0%, transparent 65%);
          pointer-events: none;
        }

        /* ── bolt icon ── */
        .eb-bolt {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: linear-gradient(135deg, #facc15, #f59e0b);
          box-shadow: 0 0 32px rgba(250,204,21,0.45), 0 0 64px rgba(250,204,21,0.15);
          animation: boltPulse 2.4s ease-in-out infinite;
          flex-shrink: 0;
        }
        @keyframes boltPulse {
          0%,100% { box-shadow: 0 0 28px rgba(250,204,21,0.45), 0 0 56px rgba(250,204,21,0.15); }
          50%      { box-shadow: 0 0 48px rgba(250,204,21,0.7),  0 0 96px rgba(250,204,21,0.28); }
        }

        /* ── badge ── */
        .eb-badge {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 100px;
          padding: 6px 16px 6px 8px;
          backdrop-filter: blur(8px);
        }
        .eb-badge-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 8px #22c55e;
          animation: liveBlip 1.6s ease-in-out infinite;
        }
        @keyframes liveBlip {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.35; }
        }

        /* ── heading ── */
        .eb-h1 {
          font-family: 'Barlow', sans-serif;
          font-weight: 900;
          font-style: italic;
          line-height: 1.0;
          letter-spacing: -0.02em;
        }
        .eb-h1-accent {
          background: linear-gradient(90deg, #facc15 0%, #f59e0b 50%, #fde68a 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          display: block;
        }

        /* ── stat pills ── */
        .eb-stat { display: flex; flex-direction: column; align-items: center; }
        .eb-stat-val {
          font-family: 'Barlow', sans-serif;
          font-weight: 900;
          font-size: 1.35rem;
          color: #fff;
          line-height: 1;
        }
        .eb-stat-lbl { font-size: 0.68rem; color: rgba(255,255,255,0.5); margin-top: 2px; letter-spacing: 0.06em; text-transform: uppercase; }

        /* ── spark canvas overlay ── */
        .eb-sparks {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .eb-spark {
          position: absolute;
          border-radius: 50%;
          background: #facc15;
          box-shadow: 0 0 6px #facc15, 0 0 12px rgba(250,204,21,0.5);
          transform: translate(-50%, -50%);
        }

        /* ── showcase card ── */
        .eb-card {
          background: linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 20px;
          backdrop-filter: blur(16px);
          box-shadow: 0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .eb-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(250,204,21,0.6), transparent);
        }
        .eb-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(250,204,21,0.15);
        }

        /* ── feature chips ── */
        .eb-chip {
          display: flex;
          align-items: center;
          gap: 7px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 8px 10px;
          font-size: 0.75rem;
          color: rgba(255,255,255,0.85);
          transition: background 0.2s;
        }
        .eb-chip:hover { background: rgba(255,255,255,0.12); }

        /* ── book button ── */
        .eb-book-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          background: linear-gradient(90deg, #facc15, #f59e0b);
          color: #1a1a0a;
          font-weight: 700;
          font-size: 0.9rem;
          letter-spacing: 0.01em;
          border: none;
          border-radius: 12px;
          padding: 13px 20px;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 20px rgba(250,204,21,0.35);
          font-family: 'DM Sans', sans-serif;
        }
        .eb-book-btn:hover {
          opacity: 0.92;
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(250,204,21,0.5);
        }

        /* ── nav dots ── */
        .eb-dot {
          height: 6px;
          border-radius: 9999px;
          background: rgba(255,255,255,0.35);
          cursor: pointer;
          transition: all 0.3s;
        }
        .eb-dot.active { background: #facc15; width: 24px !important; }

        /* ── CTA buttons ── */
        .eb-cta-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #fff;
          color: #1e3a8a;
          font-weight: 700;
          font-size: 0.9rem;
          border-radius: 10px;
          padding: 12px 24px;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          font-family: 'DM Sans', sans-serif;
          box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        }
        .eb-cta-primary:hover { background: #f0f9ff; transform: translateY(-1px); box-shadow: 0 6px 24px rgba(0,0,0,0.3); }

        .eb-cta-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: transparent;
          color: #fff;
          font-weight: 600;
          font-size: 0.9rem;
          border-radius: 10px;
          padding: 11px 22px;
          border: 1.5px solid rgba(255,255,255,0.3);
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          font-family: 'DM Sans', sans-serif;
        }
        .eb-cta-secondary:hover { border-color: rgba(255,255,255,0.6); background: rgba(255,255,255,0.07); }

        /* ── floating emergency badge ── */
        .eb-emergency {
          position: absolute;
          bottom: 20px;
          left: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          background: #facc15;
          color: #1a1a0a;
          font-weight: 700;
          font-size: 0.78rem;
          border-radius: 10px;
          padding: 8px 14px;
          box-shadow: 0 4px 20px rgba(250,204,21,0.5);
          animation: emergencyPop 3s ease-in-out infinite;
        }
        @keyframes emergencyPop {
          0%,100% { transform: scale(1); }
          50%      { transform: scale(1.03); }
        }

        /* ── stats section ── */
        .eb-stats-bar {
          background: #0d1520;
          border-top: 1px solid rgba(59,130,246,0.15);
          border-bottom: 1px solid rgba(59,130,246,0.08);
        }
        .eb-stat-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 32px 20px;
          position: relative;
          transition: background 0.25s;
          border-radius: 0;
        }
        .eb-stat-card:hover { background: rgba(59,130,246,0.04); }
        .eb-stat-card + .eb-stat-card::before {
          content: '';
          position: absolute;
          left: 0; top: 20%; bottom: 20%;
          width: 1px;
          background: rgba(59,130,246,0.15);
        }
        .eb-stat-card-num {
          font-family: 'Barlow', sans-serif;
          font-weight: 900;
          font-size: clamp(2rem, 4vw, 2.75rem);
          color: #3b82f6;
          line-height: 1;
          margin-bottom: 6px;
        }
        .eb-stat-card-lbl {
          font-size: 0.85rem;
          font-weight: 600;
          color: rgba(255,255,255,0.7);
          margin-bottom: 8px;
        }

        /* ── reveal animations ── */
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .eb-anim { animation: slideUp 0.7s ease both; }
        .eb-anim-1 { animation-delay: 0.05s; }
        .eb-anim-2 { animation-delay: 0.15s; }
        .eb-anim-3 { animation-delay: 0.28s; }
        .eb-anim-4 { animation-delay: 0.42s; }
        .eb-anim-5 { animation-delay: 0.55s; }
        .eb-anim-6 { animation-delay: 0.68s; }

        /* ── service icon ring ── */
        @keyframes spin-slow { to { transform: rotate(360deg); } }
        .eb-icon-ring {
          position: absolute;
          inset: -8px;
          border-radius: 50%;
          border: 2px dashed rgba(250,204,21,0.3);
          animation: spin-slow 12s linear infinite;
        }

        /* ── card slide ── */
        @keyframes cardSlide {
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .eb-card-content { animation: cardSlide 0.35s ease both; }

        /* ── responsive ── */
        @media (max-width: 767px) {
          .eb-emergency { bottom: 12px; left: 12px; font-size: 0.72rem; padding: 6px 11px; }
          .eb-stat-card + .eb-stat-card::before { display: none; }
        }
      `}</style>

      {/* ══════════════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="home" className="eb-hero">

        {/* Background layers */}
        <div className="eb-grid" />
        <div className="eb-glow-l" />
        <div className="eb-glow-r" />
        <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: 1 }} />

        {/* Spark particles */}
        <div className="eb-sparks">
          {sparks.map(s => (
            <div
              key={s.id}
              className="eb-spark"
              style={{
                left:    `${s.x}%`,
                top:     `${s.y}%`,
                width:   s.size,
                height:  s.size,
                opacity: Math.min(1, s.life / 18),
              }}
            />
          ))}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 lg:py-28 relative z-10">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

            {/* ── LEFT ── */}
            <div className="text-center lg:text-left">

              {/* Live badge */}
              <div className="eb-anim eb-anim-1 flex justify-center lg:justify-start mb-6">
                <div className="eb-badge">
                  <div className="eb-badge-dot" />
                  <span className="text-xs font-semibold text-white/80 tracking-wide">Serving Ujjain Since 1992</span>
                </div>
              </div>

              {/* Headline */}
              <div className="eb-anim eb-anim-2 mb-4 flex items-start justify-center lg:justify-start gap-4">
                <div className="eb-bolt mt-1 hidden sm:flex">
                  <Zap size={26} color="#1a1a0a" strokeWidth={2.5} fill="#1a1a0a" />
                </div>
                <h1
                  className="eb-h1 text-white"
                  style={{ fontSize: "clamp(2.4rem, 6vw, 4.5rem)" }}
                >
                  Expert<br />
                  <span className="eb-h1-accent">Electrical &</span>
                  <br />Appliance Repair
                </h1>
              </div>

              {/* Subtext */}
              <p className="eb-anim eb-anim-3 text-sm sm:text-base text-white/60 mb-8 max-w-md mx-auto lg:mx-0 leading-relaxed">
                {counters.experience}+ years of certified expertise. From ACs and fans to TVs
                and wiring — fast response, transparent pricing, guaranteed workmanship.
              </p>

              {/* Quick stats row */}
              <div className="eb-anim eb-anim-4 flex items-center justify-center lg:justify-start gap-6 sm:gap-8 mb-8">
                {[
                  { val: "45min", lbl: "Response" },
                  { val: "4.9★",  lbl: "Rating",   gold: true },
                  { val: "8K+",   lbl: "Jobs Done" },
                ].map((s, i) => (
                  <div key={i} className="eb-stat">
                    <span
                      className="eb-stat-val"
                      style={{ color: s.gold ? "#facc15" : "#fff" }}
                    >
                      {s.val}
                    </span>
                    <span className="eb-stat-lbl">{s.lbl}</span>
                  </div>
                ))}
                <div style={{ width: 1, height: 36, background: "rgba(255,255,255,0.12)" }} />
                <a
                  href={`tel:9999999999`}
                  className="flex items-center gap-2 text-white/70 hover:text-white transition text-sm"
                >
                  <Phone size={14} />
                  <span className="font-semibold hidden sm:inline">Call Now</span>
                </a>
              </div>

              {/* CTA row */}
              <div className="eb-anim eb-anim-5 flex flex-col sm:flex-row gap-3 items-center justify-center lg:justify-start">
                <button
                  onClick={() => scrollToSection("request-service")}
                  className="eb-cta-primary w-full sm:w-auto"
                >
                  <Zap size={16} fill="currentColor" />
                  Book a Service
                </button>
                <Link
                  to="/products"
                  className="eb-cta-secondary w-full sm:w-auto"
                >
                  <ShoppingBag size={16} />
                  Shop Products
                </Link>
                <button
                  onClick={() => scrollToSection("contact")}
                  className="text-white/55 hover:text-white text-sm font-medium transition px-2"
                >
                  Contact →
                </button>
              </div>

              {/* Trust pills */}
              <div className="eb-anim eb-anim-6 flex flex-wrap gap-2 justify-center lg:justify-start mt-8">
                {[
                  { icon: Shield, label: "ISI Certified" },
                  { icon: Clock,  label: "Same-day Service" },
                  { icon: Star,   label: "4.9 Google Rating" },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
                  >
                    <Icon size={12} className="text-blue-400" />
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* ── RIGHT — Service Card ── */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="w-full" style={{ maxWidth: 420 }}>

                <div className="eb-card p-6 sm:p-7">

                  {/* Card header */}
                  <div className="flex items-center justify-between mb-5">
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: "rgba(255,255,255,0.35)" }}
                    >
                      Featured Service
                    </span>
                    <span
                      className="text-[10px] font-semibold px-2 py-1 rounded-full"
                      style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.25)" }}
                    >
                      ● Available Now
                    </span>
                  </div>

                  {/* Animated service content */}
                  <div className="eb-card-content" key={currentService}>

                    {/* Icon */}
                    <div className="flex justify-center mb-5">
                      <div className="relative">
                        <div
                          className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl"
                          style={{ background: `linear-gradient(135deg, ${serviceShowcase[currentService].color.replace("from-", "").replace(/ to-.+/, "")} 0%, rgba(30,30,60,0.5) 100%)` }}
                        >
                          <IconComponent size={38} className="text-white" />
                        </div>
                        <div className="eb-icon-ring" />
                      </div>
                    </div>

                    {/* Title + desc */}
                    <h3
                      className="font-bold text-center text-white mb-2"
                      style={{ fontFamily: "'Barlow',sans-serif", fontSize: "1.35rem", fontStyle: "italic" }}
                    >
                      {serviceShowcase[currentService].title}
                    </h3>
                    <p className="text-center text-xs sm:text-sm mb-5" style={{ color: "rgba(255,255,255,0.55)", lineHeight: 1.65 }}>
                      {serviceShowcase[currentService].description}
                    </p>

                    {/* Feature chips */}
                    <div className="grid grid-cols-2 gap-2 mb-5">
                      {serviceShowcase[currentService].features.map((f, i) => (
                        <div key={i} className="eb-chip">
                          <Check size={11} className="text-green-400 flex-shrink-0" strokeWidth={3} />
                          {f}
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    <button
                      className="eb-book-btn"
                      onClick={() => handleBookService(serviceShowcase[currentService].title)}
                    >
                      Book This Service
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>

                {/* Slider nav */}
                <div className="flex items-center justify-center gap-3 mt-5">
                  <button
                    onClick={() => setCurrentService((currentService - 1 + serviceShowcase.length) % serviceShowcase.length)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition"
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }}
                    aria-label="Previous"
                  >
                    <ChevronRight size={16} style={{ transform: "rotate(180deg)" }} />
                  </button>

                  <div className="flex gap-1.5">
                    {serviceShowcase.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentService(i)}
                        className={`eb-dot${i === currentService ? " active" : ""}`}
                        style={{ width: i === currentService ? 24 : 6 }}
                        aria-label={`Service ${i + 1}`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentService((currentService + 1) % serviceShowcase.length)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition"
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }}
                    aria-label="Next"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Floating emergency badge */}
              <div className="eb-emergency">
                <Zap size={13} fill="currentColor" />
                24/7 Emergency Available
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          STATS BAR
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="eb-stats-bar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3">

            {[
              { num: `${counters.experience}+`, lbl: "Years Experience",  icon: Award,  sub: "Trusted since 1992" },
              { num: `${counters.clients.toLocaleString()}+`, lbl: "Satisfied Clients", icon: Smile, sub: "Across Ujjain" },
              { num: `${counters.projects.toLocaleString()}+`, lbl: "Jobs Completed",    icon: Wrench, sub: "& counting" },
            ].map(({ num, lbl, icon: Icon, sub }) => (
              <div key={lbl} className="eb-stat-card">

                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.2)" }}
                >
                  <Icon size={18} className="text-blue-400" />
                </div>

                <div className="eb-stat-card-num">{num}</div>
                <div className="eb-stat-card-lbl">{lbl}</div>
                <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", letterSpacing: "0.05em" }}>{sub}</div>
              </div>
            ))}

          </div>
        </div>
      </div>
    </>
  );
}