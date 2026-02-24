"use client";

import { useState, useEffect, useRef } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   ACCOUNTANT CHARACTER
   
   ARM FIX: Only ONE left arm group. The briefcase is INSIDE
   arm-l group so it moves with it. No duplicate elements.
   
   PIVOT POINTS (svgOrigin for GSAP):
   - Leg-L hip:       42 175
   - Leg-R hip:       78 175
   - Arm-L shoulder:  14 110
   - Arm-R shoulder: 106 110
   - Forearm elbow:  106 150
   - Head neck base:  60 92
════════════════════════════════════════════════════════════ */
function AccountantSVG() {
  return (
    <svg
      id="char-svg"
      viewBox="0 0 120 290"
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: 'visible' }}
    >
      <defs>
        <radialGradient id="gSkin" cx="45%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#FFDDB8" />
          <stop offset="100%" stopColor="#E8A06A" />
        </radialGradient>
        <radialGradient id="gSuit" cx="40%" cy="25%" r="65%">
          <stop offset="0%" stopColor="#2E4070" />
          <stop offset="100%" stopColor="#1A2845" />
        </radialGradient>
        <radialGradient id="gHair" cx="50%" cy="20%" r="60%">
          <stop offset="0%" stopColor="#4A3520" />
          <stop offset="100%" stopColor="#2C1A0A" />
        </radialGradient>
        <filter id="fDrop" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#00000028" />
        </filter>
      </defs>

      {/* Ground shadow */}
      <ellipse cx="60" cy="284" rx="40" ry="7" fill="#FF6B1A" opacity="0.14" />

      {/* ── LEGS ── */}
      <g id="leg-l">
        <rect x="31" y="175" width="22" height="32" rx="11" fill="#243060" />
        <ellipse cx="42" cy="208" rx="11" ry="7" fill="#1a2450" />
        <rect x="33" y="205" width="18" height="34" rx="9" fill="#1A2845" />
        <ellipse cx="42" cy="241" rx="16" ry="7" fill="#0d111e" />
        <ellipse cx="45" cy="239" rx="9" ry="4" fill="#181f30" />
      </g>
      <g id="leg-r">
        <rect x="67" y="175" width="22" height="32" rx="11" fill="#243060" />
        <ellipse cx="78" cy="208" rx="11" ry="7" fill="#1a2450" />
        <rect x="69" y="205" width="18" height="34" rx="9" fill="#1A2845" />
        <ellipse cx="78" cy="241" rx="16" ry="7" fill="#0d111e" />
        <ellipse cx="81" cy="239" rx="9" ry="4" fill="#181f30" />
      </g>

      {/* ── BODY / SUIT ── */}
      <rect x="22" y="108" width="76" height="72" rx="20" fill="url(#gSuit)" filter="url(#fDrop)" />
      {/* Side depth */}
      <rect x="22" y="128" width="12" height="48" rx="6" fill="#16213a" opacity="0.55" />
      <rect x="86" y="128" width="12" height="48" rx="6" fill="#16213a" opacity="0.55" />
      {/* Lapels */}
      <path d="M60 112 L45 132 L60 140 Z" fill="#243560" />
      <path d="M60 112 L75 132 L60 140 Z" fill="#243560" />
      {/* Shirt */}
      <rect x="53" y="111" width="14" height="32" rx="3" fill="#F8FAFF" />
      {/* Tie */}
      <path d="M60 115 L56 128 L60 150 L64 128 Z" fill="#FF6B1A" />
      <path d="M56 115 L60 120 L64 115 Z" fill="#D45510" />
      <line x1="58" y1="131" x2="62" y2="131" stroke="#FF8C3A" strokeWidth="1" opacity="0.5" />
      <line x1="57.5" y1="138" x2="62.5" y2="138" stroke="#FF8C3A" strokeWidth="1" opacity="0.5" />
      {/* Buttons */}
      <circle cx="60" cy="153" r="2.3" fill="#0f1828" />
      <circle cx="60" cy="162" r="2.3" fill="#0f1828" />
      {/* Pocket square */}
      <path d="M25 126 L35 119 L39 128 L27 133 Z" fill="#FF6B1A" opacity="0.6" />

      {/* ── LEFT ARM (ONE group — shoulder + forearm + hand + briefcase) ──
           Pivots from shoulder at (14, 110)
           NO separate forearm group here to avoid duplication          ── */}
      <g id="arm-l">
        {/* Upper arm */}
        <rect x="4" y="110" width="20" height="38" rx="10" fill="#1A2845" />
        {/* Shirt cuff */}
        <rect x="5" y="142" width="18" height="8" rx="4" fill="#F8FAFF" />
        {/* Hand */}
        <ellipse cx="14" cy="156" rx="9" ry="8" fill="url(#gSkin)" />
        {/* Briefcase — attached to hand, moves with arm */}
        <rect x="2" y="161" width="26" height="18" rx="5" fill="#C8993E" />
        <rect x="2" y="161" width="26" height="18" rx="5" fill="none" stroke="#A87828" strokeWidth="1.5" />
        <path d="M9 161 Q9 155 14 155 Q19 155 19 161"
              fill="none" stroke="#A87828" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="2" y1="170" x2="28" y2="170" stroke="#A87828" strokeWidth="1.2" />
        <rect x="12" y="166" width="6" height="5" rx="1.5" fill="#8B6010" />
        <path d="M13 166 Q15 163 17 166"
              fill="none" stroke="#8B6010" strokeWidth="1.2" strokeLinecap="round" />
      </g>

      {/* ── RIGHT ARM — upper arm separate from forearm for elbow bend ──
           Upper arm shoulder pivot: (106, 110)
           Forearm elbow pivot:     (106, 150)                          ── */}
      <g id="arm-r-upper">
        <rect x="96" y="110" width="20" height="40" rx="10" fill="#1A2845" />
        <rect x="97" y="144" width="18" height="8" rx="4" fill="#F8FAFF" />
      </g>
      <g id="arm-r-forearm">
        <rect x="96" y="150" width="20" height="36" rx="10" fill="#243060" />
        <rect x="97" y="180" width="18" height="8" rx="4" fill="#F8FAFF" />
        <ellipse cx="106" cy="193" rx="9" ry="8" fill="url(#gSkin)" />
        {/* Knuckle detail */}
        <path d="M100 190 Q106 187 112 190" stroke="#C88A50" strokeWidth="1" fill="none" />
      </g>

      {/* ── NECK ── */}
      <rect x="50" y="92" width="20" height="22" rx="10" fill="url(#gSkin)" />
      <path d="M34 110 Q60 100 86 110" stroke="#F0F4FF" strokeWidth="3"
            fill="none" strokeLinecap="round" />

      {/* ── HEAD ── */}
      <g id="head">
        {/* Face */}
        <ellipse cx="60" cy="60" rx="36" ry="38" fill="url(#gSkin)" filter="url(#fDrop)" />

        {/* Ears */}
        <ellipse cx="25" cy="62" rx="6.5" ry="9" fill="#EDAA72" />
        <ellipse cx="25" cy="62" rx="3.5" ry="5.5" fill="#D88A50" />
        <ellipse cx="95" cy="62" rx="6.5" ry="9" fill="#EDAA72" />
        <ellipse cx="95" cy="62" rx="3.5" ry="5.5" fill="#D88A50" />

        {/* Hair */}
        <ellipse cx="60" cy="30" rx="36" ry="20" fill="url(#gHair)" />
        <path d="M26 46 Q24 30 34 22 Q44 14 60 16 Q76 14 86 22 Q96 30 94 46"
              fill="url(#gHair)" />
        {/* Side part */}
        <path d="M48 16 Q50 24 52 32" stroke="#3a2610" strokeWidth="2"
              fill="none" strokeLinecap="round" />
        <path d="M36 20 Q50 16 60 18" stroke="#6a4828" strokeWidth="2.5"
              fill="none" strokeLinecap="round" opacity="0.4" />

        {/* Glasses */}
        <rect x="26" y="52" width="26" height="18" rx="6" fill="none"
              stroke="#5a5a6a" strokeWidth="2.2" />
        <rect x="27" y="53" width="24" height="16" rx="5" fill="#88aadd" opacity="0.07" />
        <rect x="68" y="52" width="26" height="18" rx="6" fill="none"
              stroke="#5a5a6a" strokeWidth="2.2" />
        <rect x="69" y="53" width="24" height="16" rx="5" fill="#88aadd" opacity="0.07" />
        <rect x="52" y="59" width="16" height="3" rx="1.5" fill="#5a5a6a" />
        <line x1="26" y1="61" x2="18" y2="62" stroke="#5a5a6a" strokeWidth="2" />
        <line x1="94" y1="61" x2="102" y2="62" stroke="#5a5a6a" strokeWidth="2" />

        {/* Eyes */}
        <ellipse cx="39" cy="61" rx="5.5" ry="6" fill="#fff" />
        <circle cx="40" cy="62" r="3.5" fill="#1E1008" />
        <circle cx="41.5" cy="60" r="1.4" fill="#fff" />

        <ellipse cx="81" cy="61" rx="5.5" ry="6" fill="#fff" />
        <circle cx="82" cy="62" r="3.5" fill="#1E1008" />
        <circle cx="83.5" cy="60" r="1.4" fill="#fff" />

        {/* Eyebrows */}
        <path id="brow-l" d="M29 49 Q39 44 47 48"
              stroke="#2C1A0A" strokeWidth="3.2" fill="none" strokeLinecap="round" />
        <path id="brow-r" d="M73 48 Q81 44 91 49"
              stroke="#2C1A0A" strokeWidth="3.2" fill="none" strokeLinecap="round" />

        {/* Nose */}
        <path d="M56 68 Q53 78 57 82 Q60 85 63 82 Q67 78 64 68"
              stroke="#C07840" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <ellipse cx="56.5" cy="82" rx="3.5" ry="2" fill="#C07840" opacity="0.3" />
        <ellipse cx="63.5" cy="82" rx="3.5" ry="2" fill="#C07840" opacity="0.3" />

        {/* Mouth */}
        <path id="mouth" d="M46 90 Q60 99 74 90"
              stroke="#B06030" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <path id="teeth" d="M50 91 Q60 97 70 91"
              stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0" />

        {/* Cheeks */}
        <ellipse cx="28" cy="74" rx="7" ry="4.5" fill="#FF8060" opacity="0.16" />
        <ellipse cx="92" cy="74" rx="7" ry="4.5" fill="#FF8060" opacity="0.16" />
      </g>

      {/* Flying document */}
      <g id="fly-doc" opacity="0">
        <rect x="88" y="155" width="30" height="38" rx="3" fill="#F8FAFF"
              stroke="#ddd" strokeWidth="1.2" />
        <line x1="92" y1="164" x2="114" y2="164" stroke="#ccc" strokeWidth="1.5" />
        <line x1="92" y1="170" x2="114" y2="170" stroke="#ccc" strokeWidth="1.5" />
        <line x1="92" y1="176" x2="108" y2="176" stroke="#FF6B1A" strokeWidth="1.5" />
        <text x="103" y="188" fontSize="11" fill="#FF6B1A" fontWeight="bold"
              textAnchor="middle">$</text>
      </g>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN LOGIN PAGE
════════════════════════════════════════════════════════════ */
export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const router = useRouter();

  const charRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let rafId: number;
    let walkTime  = 0;
    let walkSpeed = 0;
    let walking   = false;

    import('gsap').then(({ gsap }) => {
      const char      = charRef.current;
      const card      = cardRef.current;
      const legL      = document.getElementById('leg-l');
      const legR      = document.getElementById('leg-r');
      const armL      = document.getElementById('arm-l');
      const armUpper  = document.getElementById('arm-r-upper');
      const forearm   = document.getElementById('arm-r-forearm');
      const head      = document.getElementById('head');
      const browL     = document.getElementById('brow-l');
      const browR     = document.getElementById('brow-r');
      const mouth     = document.getElementById('mouth');
      const teeth     = document.getElementById('teeth');
      const flyDoc    = document.getElementById('fly-doc');

      if (!char || !card) return;

      // Detect mobile for offset adjustments
      const isMobile = window.innerWidth < 768;
      const startX   = isMobile ? -160 : -240;
      const cardStartX = isMobile ? 280 : 400;

      gsap.set(char, { x: startX });
      gsap.set(card, { x: cardStartX, opacity: 0, scale: 0.88 });

      // ── 60fps walking loop ──
      function walkLoop() {
        if (!walking) return;
        walkTime += 0.058;

        const swing  = 26 * walkSpeed;
        const lAngle = Math.sin(walkTime) * swing;
        const rAngle = Math.sin(walkTime + Math.PI) * swing;
        const bob    = Math.abs(Math.sin(walkTime)) * -5 * walkSpeed;

        if (legL) gsap.set(legL, { rotation: lAngle,  svgOrigin: '42 175' });
        if (legR) gsap.set(legR, { rotation: rAngle,  svgOrigin: '78 175' });
        if (char) gsap.set(char, { y: bob });
        // Left arm counter-swing (briefcase stays inside this group)
        if (armL) gsap.set(armL, { rotation: -lAngle * 0.55, svgOrigin: '14 110' });
        // Subtle head sway
        if (head) gsap.set(head, { rotation: Math.sin(walkTime * 0.5) * 2.5, svgOrigin: '60 92' });

        rafId = requestAnimationFrame(walkLoop);
      }

      // ── Timeline ──
      const tl = gsap.timeline({ delay: 0.5 });

      // ① Walk in
      tl.add(() => {
        walking = true;
        gsap.to({ s: 0 }, {
          s: 1, duration: 0.55,
          onUpdate: function () { walkSpeed = (this.targets()[0] as any).s; }
        });
        walkLoop();
      })
      .to(char, {
        x: 0, duration: isMobile ? 1.8 : 2.3, ease: 'power1.inOut',
        onComplete() {
          gsap.to({ s: 1 }, {
            s: 0, duration: 0.4,
            onUpdate: function () { walkSpeed = (this.targets()[0] as any).s; },
            onComplete() { walking = false; cancelAnimationFrame(rafId); }
          });
        }
      })

      // ② Settle
      .to([legL, legR], {
        rotation: 0,
        svgOrigin: (i: number) => i === 0 ? '42 175' : '78 175',
        duration: 0.38, ease: 'power3.out'
      }, '-=0.3')
      .to(char, { y: 0, duration: 0.25, ease: 'power2.out' }, '<')
      .to(armL,  { rotation: 0, svgOrigin: '14 110', duration: 0.3, ease: 'power2.out' }, '<')

      // ③ Head turns toward card
      .to(head, { rotation: 18, svgOrigin: '60 92', duration: 0.42, ease: 'back.out(2.8)' }, '+=0.12')

      // ④ Excited expression
      .to(browL,  { attr: { d: 'M29 44 Q39 39 47 43' }, duration: 0.28, ease: 'power2.out' }, '<0.08')
      .to(browR,  { attr: { d: 'M73 43 Q81 39 91 44' }, duration: 0.28 }, '<')
      .to(mouth,  { attr: { d: 'M46 88 Q60 102 74 88' }, duration: 0.28 }, '<')
      .to(teeth,  { opacity: 0.85, duration: 0.2 }, '<0.1')
      .to({}, { duration: 0.3 })

      // ⑤ Wind-up right arm (shoulder first, elbow follows)
      .to(armUpper, { rotation: -100, svgOrigin: '106 110', duration: 0.52, ease: 'power2.out' })
      .to(forearm,  { rotation: -50,  svgOrigin: '106 150', duration: 0.42, ease: 'power2.out' }, '<0.06')
      .to(flyDoc, { opacity: 1, duration: 0.2 }, '<0.25')
      .to({}, { duration: 0.16 })

      // ⑥ Throw (whip effect: shoulder → forearm cascade)
      .to(armUpper, { rotation: 32,  svgOrigin: '106 110', duration: 0.2, ease: 'power4.in' })
      .to(forearm,  { rotation: 58,  svgOrigin: '106 150', duration: 0.17, ease: 'power4.in' }, '<0.04')
      .to(flyDoc,   { x: -370, y: -65, rotation: -28, scale: 0.55, opacity: 0,
                      duration: 0.42, ease: 'power2.in' }, '<')

      // ⑦ Card pulls in
      .to(card, { x: 0, opacity: 1, scale: 1, duration: 0.58, ease: 'back.out(1.7)' }, '<0.08')
      .to(card, { y: -10, duration: 0.12, ease: 'power2.out', yoyo: true, repeat: 1 })

      // ⑧ Arm returns (elastic, forearm leads)
      .to(forearm,  { rotation: 0, svgOrigin: '106 150', duration: 0.62, ease: 'elastic.out(1.05,0.62)' }, '-=0.18')
      .to(armUpper, { rotation: 0, svgOrigin: '106 110', duration: 0.68, ease: 'elastic.out(1.05,0.62)' }, '<0.04')

      // ⑨ Satisfied face
      .to(head,  { rotation: 0, svgOrigin: '60 92', duration: 0.38, ease: 'power2.out' }, '<0.1')
      .to(browL, { attr: { d: 'M29 49 Q39 44 47 48' }, duration: 0.3 }, '<')
      .to(browR, { attr: { d: 'M73 48 Q81 44 91 49' }, duration: 0.3 }, '<')
      .to(mouth, { attr: { d: 'M48 90 Q60 97 72 90' }, duration: 0.3 }, '<')
      .to(teeth, { opacity: 0, duration: 0.2 }, '<')

      // ⑩ Fields stagger in
      .fromTo('.login-field', { opacity: 0, y: 18 },
        { opacity: 1, y: 0, stagger: 0.1, duration: 0.45, ease: 'power3.out' }, '-=0.1')
      .fromTo('.login-btn', { opacity: 0, y: 10, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.38, ease: 'back.out(1.8)' }, '-=0.08')

      // ⑪ Idle breathing
      .to(char, { y: -5, duration: 1.3, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    });

    return () => { cancelAnimationFrame(rafId); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await signIn('credentials', { redirect: false, email, password });
    if (result?.error) setError('Credenciales inválidas. Intenta de nuevo.');
    else router.push('/');
    setLoading(false);
  };

  return (
    <div className="
      flex flex-col md:flex-row
      items-center md:items-end
      justify-center
      min-h-screen
      bg-[#0a0c14]
      px-4 py-10
      relative overflow-hidden
      gap-6 md:gap-10
    ">
      {/* ── Ambient glows ── */}
      <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-100px] w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[700px] h-[460px] bg-[var(--brand-primary)]/5 rounded-full blur-[100px]" />
      </div>

      {/* Grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(255,107,26,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,107,26,0.04) 1px,transparent 1px)',
        backgroundSize: '48px 48px'
      }} />

      {/* Floor line — only on desktop */}
      <div className="absolute hidden md:block pointer-events-none" style={{
        bottom: '11%', left: 0, right: 0, height: '1px',
        background: 'linear-gradient(90deg,transparent,rgba(255,107,26,0.12) 20%,rgba(255,107,26,0.32) 50%,rgba(255,107,26,0.12) 80%,transparent)'
      }} />

      {/* ── CHARACTER ──
           Mobile: centered above card, smaller size
           Desktop: left of card, full size, aligned to floor  ── */}
      <div
        ref={charRef}
        className="
          relative flex-shrink-0 z-10
          w-[90px] h-[220px]
          md:w-[130px] md:h-[300px]
          mb-0 md:mb-[18px]
          order-1 md:order-none
        "
      >
        <AccountantSVG />

        {/* Name badge — hidden on very small screens */}
        <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap hidden sm:block">
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-primary)] animate-pulse" />
            <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">
              Fin. Advisor
            </span>
          </div>
        </div>
      </div>

      {/* ── LOGIN CARD ──
           Mobile: full width (max 380px), centered
           Desktop: fixed 400px, side by side with character ── */}
      <div
        ref={cardRef}
        className="w-full max-w-[380px] md:w-[400px] z-10"
        style={{ transformOrigin: 'left center' }}
      >
        <div className="rounded-[2rem] md:rounded-[2.5rem] bg-[#13151f] border-2 border-white/5 shadow-2xl relative overflow-hidden">

          {/* Top stripe */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[var(--brand-primary)] to-orange-400" />
          {/* Corner glow */}
          <div className="absolute top-0 left-0 w-52 h-52 bg-[var(--brand-primary)]/6 rounded-full blur-[70px] pointer-events-none" />

          {/* Header */}
          <div className="pt-9 md:pt-11 pb-5 md:pb-7 px-7 md:px-10 text-center relative">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-[var(--brand-primary)]/10 rounded-2xl md:rounded-3xl mx-auto mb-4 md:mb-5 flex items-center justify-center border border-[var(--brand-primary)]/20 shadow-inner relative overflow-hidden">
              <svg width="28" height="28" viewBox="0 0 30 30" fill="none">
                <path d="M5 22L10 15L15 18L20 10L25 14"
                      stroke="var(--brand-primary)" strokeWidth="2.5"
                      strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="25" cy="14" r="3" fill="var(--brand-primary)" opacity="0.35" />
                <line x1="5" y1="25" x2="25" y2="25"
                      stroke="var(--brand-primary)" strokeWidth="2"
                      strokeLinecap="round" opacity="0.3" />
              </svg>
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-primary)]/15 to-transparent" />
            </div>

            <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-white leading-none">
              Acceso <span className="text-[var(--brand-primary)]">Pro</span>
            </h1>
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-gray-500 mt-2">
              Plataforma Financiera v1.3
            </p>
          </div>

          {/* Form */}
          <div className="px-7 md:px-9 pb-9 md:pb-11">
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">

              <div className="login-field space-y-2 opacity-0">
                <label className="block text-[9px] font-black uppercase text-gray-500 tracking-widest ml-2">
                  Email del Administrador
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="USUARIO..."
                  required
                  className="
                    w-full bg-white/5 border-2 border-white/5
                    h-12 md:h-14 rounded-xl md:rounded-2xl
                    text-white font-black uppercase text-xs
                    focus:border-[var(--brand-primary)] focus:outline-none
                    transition-all px-5 md:px-6
                    placeholder:text-white/20
                  "
                />
              </div>

              <div className="login-field space-y-2 opacity-0">
                <label className="block text-[9px] font-black uppercase text-gray-500 tracking-widest ml-2">
                  Clave Maestra
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="
                    w-full bg-white/5 border-2 border-white/5
                    h-12 md:h-14 rounded-xl md:rounded-2xl
                    text-white font-black text-xs
                    focus:border-[var(--brand-primary)] focus:outline-none
                    transition-all px-5 md:px-6
                    placeholder:text-white/30
                  "
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-3 md:p-4 rounded-xl text-center">
                  <p className="text-red-500 text-[10px] font-black uppercase tracking-widest italic">
                    {error}
                  </p>
                </div>
              )}

              <div className="login-btn opacity-0 pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="
                    w-full bg-white text-black
                    hover:bg-[var(--brand-primary)] hover:text-white
                    h-13 md:h-16 rounded-xl md:rounded-2xl
                    font-black uppercase text-xs tracking-[0.2em]
                    shadow-2xl transition-all active:scale-95
                    flex items-center justify-center gap-3
                    py-4
                  "
                >
                  {loading
                    ? <Loader2 className="animate-spin h-5 w-5" />
                    : <><span>Entrar al Sistema</span><span className="text-base">→</span></>
                  }
                </button>
              </div>

              <div className="login-field text-center pt-2 opacity-0">
                <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">
                  ¿Sin cuenta oficial?{' '}
                  <Link href="/register" className="text-[var(--brand-primary)] hover:underline ml-1">
                    Solicitar Registro
                  </Link>
                </p>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}