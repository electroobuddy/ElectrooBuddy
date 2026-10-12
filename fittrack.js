const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, PageNumber, Footer, PageBreak
} = require('docx');
const fs = require('fs');

// ── Color Palette ────────────────────────────────────────────────────────────
const C = {
  brand:       "0F4C75",
  accent:      "FF6B35",
  green:       "1DB954",
  purple:      "7B2FBE",
  dark:        "1A1A2E",
  white:       "FFFFFF",
  lightBlue:   "D6E8F7",
  lightOrange: "FFF0E8",
  lightGreen:  "D6F5E3",
  lightPurple: "EDE0F7",
  lightGray:   "F5F5F5",
  midGray:     "DDDDDD",
  textGray:    "555555",
};

// ── Border helpers ───────────────────────────────────────────────────────────
const bdr  = (c = C.midGray) => ({ style: BorderStyle.SINGLE, size: 1, color: c });
const bdrAll = (c)  => ({ top: bdr(c), bottom: bdr(c), left: bdr(c), right: bdr(c) });
const noBdr = { style: BorderStyle.NONE, size: 0, color: C.white };
const noBdrAll = { top: noBdr, bottom: noBdr, left: noBdr, right: noBdr };

// ── Typography helpers ────────────────────────────────────────────────────────
const run  = (text, opts = {}) => new TextRun({ text, font: "Arial", size: 22, ...opts });
const bold = (text, opts = {}) => run(text, { bold: true, ...opts });

const h1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 480, after: 200 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 10, color: C.brand, space: 6 } },
  children: [run(text, { size: 40, bold: true, color: C.brand })]
});
const h2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 360, after: 160 },
  children: [run(text, { size: 30, bold: true, color: C.dark })]
});
const h3 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 280, after: 120 },
  children: [run(text, { size: 26, bold: true, color: C.accent })]
});
const h4 = (text) => new Paragraph({
  spacing: { before: 200, after: 80 },
  children: [run(text, { size: 23, bold: true, color: C.purple })]
});

const p = (text, opts = {}) => new Paragraph({
  spacing: { before: 80, after: 80 },
  children: [run(text, opts)]
});
const bullet = (text, lvl = 0) => new Paragraph({
  numbering: { reference: "bullets", level: lvl },
  spacing: { before: 50, after: 50 },
  children: [run(text)]
});
const sp = () => new Paragraph({ children: [run("  ")], spacing: { before: 60, after: 60 } });
const pb = () => new Paragraph({ children: [new PageBreak()] });

// ── Box helper ────────────────────────────────────────────────────────────────
function box(title, lines, titleFill = C.brand, bodyFill = C.lightBlue) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [
      new TableRow({ children: [new TableCell({
        borders: bdrAll(C.midGray), width: { size: 9360, type: WidthType.DXA },
        shading: { fill: titleFill, type: ShadingType.CLEAR },
        margins: { top: 100, bottom: 100, left: 160, right: 160 },
        children: [new Paragraph({ children: [run(title, { bold: true, color: C.white, size: 23 })] })]
      })]  }),
      ...lines.map(l => new TableRow({ children: [new TableCell({
        borders: bdrAll(C.midGray), width: { size: 9360, type: WidthType.DXA },
        shading: { fill: bodyFill, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 160, right: 160 },
        children: [new Paragraph({ children: [run(l, { size: 21 })] })]
      })] }))
    ]
  });
}

// ── 2-col table ───────────────────────────────────────────────────────────────
function tbl2(hdr, rows, w = [2800, 6560]) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA }, columnWidths: w,
    rows: [
      new TableRow({ tableHeader: true, children: hdr.map((h, i) => new TableCell({
        borders: bdrAll(C.midGray), width: { size: w[i], type: WidthType.DXA },
        shading: { fill: C.brand, type: ShadingType.CLEAR },
        margins: { top: 100, bottom: 100, left: 120, right: 120 },
        children: [new Paragraph({ children: [run(h, { bold: true, color: C.white })] })]
      })) }),
      ...rows.map((row, ri) => new TableRow({ children: row.map((cell, ci) => new TableCell({
        borders: bdrAll(C.midGray), width: { size: w[ci], type: WidthType.DXA },
        shading: { fill: ri % 2 === 0 ? C.white : C.lightGray, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({ children: [run(cell, { size: 21 })] })]
      })) }))
    ]
  });
}

// ── Screen block ─────────────────────────────────────────────────────────────
// Each screen gets: screen name box + purpose + layout + UI elements + interactions + states + design notes
function screen(num, name, purpose, layout, elements, interactions, states, designNotes) {
  return [
    new Paragraph({
      spacing: { before: 320, after: 0 },
      shading: { fill: C.brand, type: ShadingType.CLEAR },
      children: [run(`  SCREEN ${num}  |  ${name}`, { bold: true, color: C.white, size: 24 })]
    }),
    new Paragraph({
      spacing: { before: 0, after: 160 },
      shading: { fill: C.lightBlue, type: ShadingType.CLEAR },
      children: [run(`  PURPOSE: ${purpose}`, { size: 20, color: C.dark, italics: true })]
    }),
    h4("📐 Layout & Structure"),
    ...layout.map(l => bullet(l)),
    sp(),
    h4("🧩 UI Elements"),
    ...elements.map(e => bullet(e)),
    sp(),
    h4("⚡ Interactions & Micro-animations"),
    ...interactions.map(i => bullet(i)),
    sp(),
    h4("🔄 States"),
    ...states.map(s => bullet(s)),
    sp(),
    h4("🎨 Design Notes"),
    ...designNotes.map(d => bullet(d)),
    sp(), sp(),
  ];
}

// ═════════════════════════════════════════════════════════════════════════════
// DOCUMENT CONTENT
// ═════════════════════════════════════════════════════════════════════════════

// ─── COVER ───────────────────────────────────────────────────────────────────
const cover = [
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600, after: 200 },
    children: [run("🏃 FitStake", { size: 80, bold: true, color: C.brand })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 160 },
    children: [run("Complete UI/UX Design System & Coding Agent Prompt", { size: 30, bold: true, color: C.accent })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 600 },
    children: [run("All Screens  •  Design Tokens  •  Component Library  •  Production-Ready Code Prompt", { size: 22, color: C.textGray })] }),
  new Table({
    width: { size: 7200, type: WidthType.DXA }, columnWidths: [3600, 3600],
    rows: [
      new TableRow({ children: [
        new TableCell({ borders: bdrAll(), width: { size: 3600, type: WidthType.DXA }, shading: { fill: C.brand, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 160, right: 160 },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [run("Document Type", { bold: true, color: C.white })] })] }),
        new TableCell({ borders: bdrAll(), width: { size: 3600, type: WidthType.DXA }, shading: { fill: C.lightBlue, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 160, right: 160 },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [run("UI/UX + Dev Prompt Pack")] })] }),
      ]}),
      new TableRow({ children: [
        new TableCell({ borders: bdrAll(), width: { size: 3600, type: WidthType.DXA }, shading: { fill: C.brand, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 160, right: 160 },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [run("Total Screens Covered", { bold: true, color: C.white })] })] }),
        new TableCell({ borders: bdrAll(), width: { size: 3600, type: WidthType.DXA }, shading: { fill: C.lightOrange, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 160, right: 160 },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [run("48 Screens", { bold: true, color: C.accent })] })] }),
      ]}),
      new TableRow({ children: [
        new TableCell({ borders: bdrAll(), width: { size: 3600, type: WidthType.DXA }, shading: { fill: C.brand, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 160, right: 160 },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [run("Version", { bold: true, color: C.white })] })] }),
        new TableCell({ borders: bdrAll(), width: { size: 3600, type: WidthType.DXA }, shading: { fill: C.lightBlue, type: ShadingType.CLEAR }, margins: { top: 100, bottom: 100, left: 160, right: 160 },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [run("1.0 — June 2026")] })] }),
      ]}),
    ]
  }),
  pb()
];

// ─── PART A: UI/UX DESIGN SYSTEM ─────────────────────────────────────────────
const partA_header = [
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 100 },
    shading: { fill: C.brand, type: ShadingType.CLEAR },
    children: [run("   PART A — UI/UX DESIGN SYSTEM PROMPT   ", { bold: true, color: C.white, size: 32 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 200 },
    shading: { fill: C.lightBlue, type: ShadingType.CLEAR },
    children: [run("  Use this section with Figma, Sketch, Adobe XD, or any AI design tool (Galileo, Uizard, v0, Lovable)  ", { size: 20, italics: true })] }),
  sp(),
];

// ─── A1. GLOBAL DESIGN LANGUAGE ──────────────────────────────────────────────
const a1 = [
  h1("A1. Global Design Language"),
  h2("Brand Identity & Visual Philosophy"),
  p("FitStake's visual language must communicate TRUST (financial platform), ENERGY (fitness app), and ACHIEVEMENT (reward platform) simultaneously. The design lives at the intersection of a banking app's reliability and a fitness app's energy."),
  sp(),
  h3("Color System"),
  tbl2(["Token", "Value & Usage"], [
    ["--color-primary", "#0F4C75 — Main brand, CTAs, navigation active state, headers"],
    ["--color-accent", "#FF6B35 — Streak fire, forfeit warnings, streak shield CTA, highlights"],
    ["--color-success", "#1DB954 — Task complete, money earned, streak milestone, verification passed"],
    ["--color-danger", "#E53E3E — Missed task, forfeited money, streak broken, payment error"],
    ["--color-warning", "#F6AD55 — Grace window active, 2-hr deadline approaching, low wallet balance"],
    ["--color-purple", "#7B2FBE — Shield subscription, premium features, Elite badge"],
    ["--color-bg-dark", "#1A1A2E — Dark mode background, splash screen"],
    ["--color-bg-light", "#F8F9FA — Light mode background"],
    ["--color-surface", "#FFFFFF — Cards, modals, input fields (light mode)"],
    ["--color-surface-dark", "#252545 — Cards, modals (dark mode)"],
    ["--color-text-primary", "#1A1A2E — Body text (light mode)"],
    ["--color-text-secondary", "#6B7280 — Captions, helper text, timestamps"],
    ["--color-border", "#E5E7EB — Card borders, dividers, input outlines"],
  ]),
  sp(),
  h3("Typography Scale"),
  tbl2(["Token", "Spec & Usage"], [
    ["--font-family", "Primary: 'Inter' (all UI). Numeric data: 'DM Mono'. Fallback: system-ui"],
    ["--text-xs", "11px / 400 — timestamps, micro-labels, legal copy"],
    ["--text-sm", "13px / 400 — captions, helper text, badges"],
    ["--text-base", "15px / 400 — body text, descriptions"],
    ["--text-md", "17px / 500 — list items, card body, secondary actions"],
    ["--text-lg", "20px / 600 — section titles, card headlines"],
    ["--text-xl", "24px / 700 — screen titles, modal headers"],
    ["--text-2xl", "30px / 700 — money amounts, streak numbers (DM Mono)"],
    ["--text-3xl", "40px / 800 — hero numbers, big win displays (DM Mono)"],
    ["--text-4xl", "56px / 900 — splash screen logo, empty state illustration numbers"],
  ]),
  sp(),
  h3("Spacing & Grid"),
  tbl2(["Token", "Value"], [
    ["--space-1", "4px — tight internal padding"],
    ["--space-2", "8px — icon-label gap, badge padding"],
    ["--space-3", "12px — list item internal padding"],
    ["--space-4", "16px — card padding, section gap (base unit)"],
    ["--space-6", "24px — screen horizontal padding"],
    ["--space-8", "32px — section separation"],
    ["--space-12", "48px — major section breaks, CTA bottom margin"],
    ["--radius-sm", "8px — input fields, small cards"],
    ["--radius-md", "16px — standard cards, modals"],
    ["--radius-lg", "24px — bottom sheets, hero cards"],
    ["--radius-full", "999px — pills, avatar frames, progress bars"],
    ["Grid", "375px base width; 24px horizontal margins; 8-column grid"],
  ]),
  sp(),
  h3("Elevation & Shadows"),
  tbl2(["Level", "Shadow Value & Use"], [
    ["Level 0", "none — flat backgrounds"],
    ["Level 1", "0 1px 3px rgba(0,0,0,0.08) — cards at rest"],
    ["Level 2", "0 4px 12px rgba(0,0,0,0.12) — floating elements, sticky headers"],
    ["Level 3", "0 8px 24px rgba(0,0,0,0.16) — modals, drawers, popups"],
    ["Level 4", "0 16px 48px rgba(0,0,0,0.24) — full-screen overlays, achievement popups"],
  ]),
  sp(),
  h3("Motion & Animation Principles"),
  bullet("Duration scale: 100ms (micro), 200ms (standard), 400ms (emphasis), 600ms (delight/celebration)"),
  bullet("Easing: ease-out for entrances, ease-in for exits, spring(1, 80, 10, 0) for celebratory bounces"),
  bullet("Money credited: counter animates from old value to new value over 800ms with haptic feedback"),
  bullet("Streak fire: particle burst animation on streak increment milestone (7, 30, 60, 100 days)"),
  bullet("Task completion: full-screen green flash (150ms) + confetti rain (600ms) + haptic: success pattern"),
  bullet("Forfeit: screen briefly pulses red (200ms) + haptic: error pattern + sound: subtle thud"),
  bullet("Never animate: loading states longer than 300ms must show skeleton screens, not spinners"),
  sp(), sp(),
  pb()
];

// ─── A2. COMPONENT LIBRARY ────────────────────────────────────────────────────
const a2 = [
  h1("A2. Core Component Library"),
  h3("CTA Buttons"),
  tbl2(["Variant", "Spec"], [
    ["Primary", "bg: --color-primary; text: white; h: 56px; radius: 16px; font: 17px/700; full-width by default"],
    ["Secondary", "bg: transparent; border: 2px solid --color-primary; text: --color-primary; same dimensions"],
    ["Danger", "bg: --color-danger; text: white; use for: forfeit confirm, delete goal"],
    ["Success", "bg: --color-success; text: white; use for: complete task, withdraw funds"],
    ["Ghost", "bg: transparent; text: --color-primary; underline on press; use for: skip, cancel, later"],
    ["Loading state", "Replace label with 3-dot pulse animation; disable interaction; opacity 0.7"],
    ["Disabled state", "opacity: 0.4; pointer-events: none; cursor: not-allowed"],
  ]),
  sp(),
  h3("Cards"),
  tbl2(["Card Type", "Spec"], [
    ["Goal Card", "radius: 20px; shadow: Level 1; padding: 20px; gradient header strip (primary → accent); 3 data points: stake, progress, streak"],
    ["Challenge Card", "radius: 20px; left accent border (4px, --color-accent); participant avatar stack; prize amount prominent"],
    ["Transaction Card", "flat; full-width; left icon (green arrow = earn, red arrow = forfeit); DM Mono for amount"],
    ["Leaderboard Row", "rank number (DM Mono, 32px); avatar; name; metric; animated rank change indicator"],
    ["Achievement Badge", "circular; 64px; gradient fill by tier; shine animation on unlock"],
    ["Streak Shield Card", "purple gradient background; shield icon; restore count as large number"],
  ]),
  sp(),
  h3("Form Elements"),
  tbl2(["Element", "Spec"], [
    ["Text Input", "h: 56px; radius: 12px; border: 1.5px solid --color-border; focus: border 2px --color-primary + glow shadow"],
    ["Money Input", "h: 72px; DM Mono; font-size: 32px; ₹/$ prefix in text-secondary; number keyboard type"],
    ["Slider", "track-h: 6px; thumb: 28px circle; filled: --color-primary; handle shadow on drag"],
    ["Toggle", "w: 52px h: 30px; on: --color-success; off: --color-border; slide animation 200ms"],
    ["Checkbox", "24px; radius: 6px; checked: --color-primary fill + white checkmark; animated fill 150ms"],
    ["Radio", "24px circle; selected: --color-primary ring + inner dot; deselected: --color-border"],
    ["Dropdown", "same as text input; chevron icon right; opens as bottom sheet on mobile"],
    ["Date Picker", "inline calendar in bottom sheet; primary color for selected; accent for today"],
  ]),
  sp(),
  h3("Navigation"),
  tbl2(["Element", "Spec"], [
    ["Tab Bar", "5 tabs: Home, Goals, Challenges, Leaderboard, Profile; h: 84px (incl. safe area); active: icon + label, --color-primary; inactive: icon only, --color-text-secondary; notification dot: --color-accent"],
    ["Top Nav Bar", "h: 56px; left: back arrow or hamburger; center: screen title (text-xl/700); right: action icon; bg: --color-surface; border-bottom: 1px --color-border"],
    ["Back Button", "44px hit area; left chevron; label = parent screen name (iOS style)"],
    ["Bottom Sheet", "handle bar (40x4px, --color-border, radius: 2px); max-height: 90vh; radius-top: 24px; drag to dismiss"],
    ["Toast / Snackbar", "bottom: 100px; radius: 12px; max-w: 343px; center-aligned; auto-dismiss: 3s; money toasts are always green with ₹ icon"],
  ]),
  sp(),
  h3("Data Visualization"),
  tbl2(["Chart Type", "Use & Spec"], [
    ["Streak Heatmap", "GitHub-style calendar grid; cell: 12px square, 2px gap; fill: empty/25%/50%/75%/100% mapped to white→brand gradient; scroll horizontal"],
    ["Progress Ring", "SVG circle; stroke-width: 8px; background: --color-border; fill: animated from 0 to % on mount; center: large % number"],
    ["Earnback Bar Chart", "weekly bars; bar-w: 24px; gap: 8px; earned: --color-success; forfeited: --color-danger; today: outlined"],
    ["Cumulative Wallet Line", "smooth bezier; area fill with 20% opacity gradient; x-axis: dates; y-axis: ₹ balance"],
    ["Challenge Distribution", "horizontal stacked bar; each participant a different color segment; animated on load"],
  ]),
  sp(), sp(),
  pb()
];

// ─── A3. SCREEN-BY-SCREEN DESIGN ─────────────────────────────────────────────
const a3_header = [
  h1("A3. Screen-by-Screen Design Specifications"),
  p("Every screen below includes: Layout, UI Elements, Interactions, States, and Design Notes. Screens are organized by user flow."),
  sp(), sp(),
];

// ── FLOW 1: AUTH ──────────────────────────────────────────────────────────────
const flow1 = [
  h2("FLOW 1 — Authentication & Onboarding (Screens 1–8)"),
  sp(),

  ...screen("01", "Splash Screen",
    "First impression — brand identity, app loads in background",
    [
      "Full-screen dark background (#1A1A2E)",
      "Centered logo mark: running figure inside a coin circle (SVG, 120px)",
      "App name 'FitStake' below logo (--text-4xl, brand color, DM Mono bold)",
      "Tagline beneath: 'Stake. Sweat. Earn.' (--text-md, text-secondary, letter-spacing: 4px)",
      "Bottom: version number (--text-xs, text-secondary)",
    ],
    [
      "Logo animates in: scale 0.5→1.0 with spring bounce (duration 600ms, delay 200ms)",
      "Tagline fades in word by word with 150ms stagger",
      "Progress bar (2px, brand color) runs along bottom indicating load progress",
      "Auto-navigates to Welcome or Home after 2.5s (skip if returning user)",
    ],
    [
      "First-time user → navigates to Welcome Screen (Screen 02)",
      "Returning user with valid session → navigates directly to Dashboard (Screen 09)",
      "Returning user with expired session → navigates to Login (Screen 03)",
    ],
    [
      "Use Lottie for the logo animation file — pre-render the coin-to-runner morph",
      "Dark background ensures no flash of white on OLED screens",
      "No interactive elements — this is a pure brand moment",
    ]
  ),

  ...screen("02", "Welcome / Hero Screen",
    "Introduce app's core value proposition before sign-up",
    [
      "3-slide horizontal pager with dot indicators (brand color for active)",
      "Each slide: full-bleed illustration (top 55%), title (--text-2xl bold), subtitle (--text-base, text-secondary), takes up bottom 45%",
      "Slide 1: 'Put Your Money Where Your Goals Are' — illustration: coins turning into running shoes",
      "Slide 2: 'Earn Back Every Rupee' — illustration: progress bar filling up with coins raining down",
      "Slide 3: 'Compete. Complete. Collect.' — illustration: group of avatars on a podium",
      "Bottom: 'Get Started' primary CTA + 'I already have an account' ghost button",
    ],
    [
      "Swipe gesture between slides; auto-advance every 4 seconds",
      "Dot indicator animates: active dot expands to 24px wide (pill shape)",
      "CTA button pulsates subtly (scale 1.0→1.03, 2s loop) on final slide to encourage tap",
      "Skip button top-right appears after 1 second (--text-sm, ghost style)",
    ],
    [
      "Default: Slide 1 shown",
      "Paused: auto-advance pauses on manual swipe; resumes after 6s",
    ],
    [
      "Illustrations should be custom — no generic stock. Style: bold flat illustration with subtle gradient fills",
      "Content should feel aspirational and financial-savvy, not just another fitness app",
      "Localize currency symbol based on device region settings",
    ]
  ),

  ...screen("03", "Sign Up Screen",
    "Account creation with minimal friction",
    [
      "Back button top-left",
      "Screen title: 'Create Account' (--text-xl bold) centered",
      "Social sign-in section: Google button + Apple button (full-width, outlined style, 56px h, logo + text)",
      "Divider: '— or sign up with email —' (--text-sm, text-secondary)",
      "Form fields: Full Name, Email, Phone Number (with country code selector), Password, Confirm Password",
      "Password strength indicator bar below password field (4 segments: weak/fair/strong/excellent)",
      "Terms & Privacy checkbox: 'I agree to Terms of Service and Privacy Policy' (links underlined, --color-primary)",
      "'Create Account' primary CTA (full-width, bottom)",
      "Footer: 'Already have an account? Log In' (--color-primary, tappable)",
    ],
    [
      "Each field validates on blur: green checkmark if valid, red error message if invalid",
      "Phone number auto-formats as user types (e.g., 98765 43210)",
      "Password field: eye icon to toggle visibility",
      "Keyboard avoid: form scrolls up when keyboard appears, CTA remains visible",
      "'Create Account' tap: inline loading spinner in button, then success animation",
      "Google/Apple sign-in triggers native auth sheet",
    ],
    [
      "Empty: all fields blank, CTA disabled (opacity 0.4)",
      "Partial: some fields filled, CTA enabled only when all required valid",
      "Error: field with red border + error message below (--text-sm, --color-danger)",
      "Loading: CTA shows spinner, all fields disabled",
      "Success: brief success animation, then auto-navigate to OTP screen",
    ],
    [
      "Autofill supported — respect iOS/Android autofill attributes",
      "Country code picker should be a searchable bottom sheet, not a modal",
      "Do NOT collect DOB on this screen — ask in onboarding quiz",
    ]
  ),

  ...screen("04", "OTP Verification Screen",
    "Verify phone number before proceeding",
    [
      "Back button top-left",
      "Icon: phone with verification shield (brand color, 64px)",
      "Title: 'Verify Your Number' (--text-xl bold)",
      "Subtitle: 'We sent a 6-digit code to +91 XXXXX XXXXX' (--text-base, text-secondary, number masked)",
      "6 individual OTP input boxes (each 52px × 64px, radius: 12px, border: 2px, DM Mono text-2xl)",
      "Countdown timer: 'Resend in 0:45' (--text-sm, text-secondary)",
      "Resend button (ghost, becomes active when timer hits 0)",
      "'Verify' primary CTA (auto-submits when 6 digits entered)",
    ],
    [
      "Auto-advance focus between boxes on digit entry",
      "Paste full OTP auto-populates all 6 boxes",
      "Backspace from empty box moves focus to previous box",
      "Resend tap: timer resets to 60s, subtle shake animation on boxes to indicate new code sent",
      "Auto-submit on 6th digit entry — no need to tap Verify manually",
    ],
    [
      "Waiting: boxes empty, countdown running",
      "Partial: some boxes filled, no action yet",
      "Verifying: boxes pulse (light blue background) while API call in progress",
      "Error: boxes shake (horizontal keyframe), turn red, clear after 1s for re-entry",
      "Success: boxes turn green sequentially, then navigate",
    ],
    [
      "Support SMS auto-read on Android (SMS Retriever API) — auto-populate OTP",
      "On iOS, support QuickType suggestion above keyboard",
      "Edit number link below subtitle to go back to previous screen",
    ]
  ),

  ...screen("05", "Login Screen",
    "Returning user sign-in",
    [
      "Back button top-left",
      "Title: 'Welcome Back' (--text-2xl bold, brand color)",
      "Subtitle: 'Let's earn some money today 💪' (--text-base, text-secondary)",
      "Social sign-in: Google + Apple buttons",
      "Divider: '— or —'",
      "Email/Phone field + Password field",
      "Forgot password link (--color-primary, right-aligned below password field)",
      "'Log In' primary CTA",
      "Biometric auth button (fingerprint/face icon, outlined) if previously enabled",
      "Footer: 'New here? Create an account' (--color-primary)",
    ],
    [
      "Biometric button auto-triggers Face ID / Fingerprint on screen appear if previously enabled",
      "Forgot password: navigates to reset flow (email entry → OTP → new password)",
      "Log In: loading state → success vibration → navigate to Dashboard",
      "Failed login: error toast + field shake animation",
    ],
    [
      "Default", "Loading", "Error (wrong credentials)", "Biometric available (show biometric button)", "Biometric failed (show manual form, error message)"
    ],
    [
      "Persist email/phone in field for returning users",
      "Never show 'wrong email' vs 'wrong password' separately for security",
      "Biometric fallback: always show manual login option below",
    ]
  ),

  ...screen("06", "Onboarding Quiz — Step 1 (Fitness Level)",
    "Personalize goal recommendations — slide 1 of 4",
    [
      "Progress bar at top (25% filled, brand color, 4px height)",
      "Step indicator: 'Step 1 of 4' (--text-sm, text-secondary)",
      "Question (--text-xl bold): 'What best describes your current fitness level?'",
      "4 option cards (full-width, 72px h, radius: 16px, border: 1.5px): Beginner / Intermediate / Active / Athlete",
      "Each card has: left emoji (40px), title (--text-md bold), subtitle description (--text-sm, text-secondary)",
      "'Continue' primary CTA (disabled until selection)",
      "'Skip for now' ghost link at bottom",
    ],
    [
      "Tap card: immediate visual select (border 2px brand color, light blue fill, checkmark top-right)",
      "Deselect: tap again or tap another card",
      "Continue: slide-left transition to next step",
      "Skip: slides forward without storing value",
    ],
    [
      "Unselected: default white card", "Selected: brand border + light fill + checkmark"
    ],
    [
      "Each quiz step uses the same layout template — only question and options change",
      "Answers feed into goal recommendation algorithm on screen 08",
      "Fun illustration top-right corner (small, 80px) relevant to fitness level chosen",
    ]
  ),

  ...screen("07", "Onboarding Quiz — Steps 2–4",
    "Collect: Primary Goal / Preferred Activity / Daily Available Time",
    [
      "Same layout as Screen 06 with updated progress bar (50% → 75% → 100%)",
      "Step 2: Primary Goal — Lose Weight / Build Muscle / Improve Endurance / Stay Active / Train for Event",
      "Step 3: Preferred Activity — Running / Walking / Cycling / Yoga / Strength / Swimming / Mixed",
      "Step 4: Time Available — 15 min / 30 min / 45 min / 60+ min per day",
      "Step 4 also has: preferred time of day (Morning / Evening / Flexible) as a secondary selection",
    ],
    [
      "Each step: same interaction as Step 1",
      "Back arrow navigates to previous step (within quiz, not back to auth)",
      "Final step Continue: triggers goal recommendation generation (loading screen 200ms)",
    ],
    [
      "Same states as Screen 06"
    ],
    [
      "Multi-select on Step 3 (activity) is allowed — user can pick up to 3 activities",
      "Store all quiz results locally; sync to profile in background",
    ]
  ),

  ...screen("08", "Goal Recommendation Screen",
    "AI-generated first goal based on quiz — reduces cold-start friction",
    [
      "Top: celebration illustration (confetti, checkmark)",
      "Title: 'Your Personalized Plan is Ready!' (--text-xl bold, brand color)",
      "Recommendation card (rounded-24px, gradient bg: brand→brand-dark):",
      "  — Goal title (--text-lg, white bold)",
      "  — Duration badge (e.g., '30 Days')",
      "  — Daily task description",
      "  — Suggested stake range: '₹500 – ₹2,000 per month'",
      "  — Why this goal: 2-line explanation (--text-sm, white 80% opacity)",
      "'Start This Goal' primary CTA (accent color, full-width)",
      "'Customize Goal' secondary CTA",
      "'Browse All Goals' ghost link",
    ],
    [
      "Card entrance: slides up from bottom with spring animation",
      "Stake range tappable: opens goal creation pre-filled",
      "'Start This Goal': pre-fills Create Goal screen → takes user to Wallet top-up if balance insufficient",
    ],
    [
      "Loading: skeleton card pulses while recommendation generates",
      "Loaded: full card visible with animation",
    ],
    [
      "This screen is the onboarding payoff — make it feel rewarding and personalized",
      "Reference quiz answers in the 'why this goal' text for genuine personalization feel",
    ]
  ),
  sp(), sp(), pb()
];

// ── FLOW 2: HOME DASHBOARD ─────────────────────────────────────────────────────
const flow2 = [
  h2("FLOW 2 — Home Dashboard (Screens 9–11)"),
  sp(),

  ...screen("09", "Home Dashboard (Main Screen)",
    "Central hub — daily task status, wallet, active goals, streak, quick actions",
    [
      "Top Bar: greeting ('Good Morning, Rahul 👋'), notification bell (with red dot if unread), wallet balance (--text-lg, DM Mono, brand color)",
      "Today's Task Card (hero card, full-width, gradient bg): goal name, task for today, progress indicator, 'Start Task' CTA button",
      "Streak Widget: flame emoji, streak number (--text-3xl, DM Mono, accent color), streak type label, 'Shield Active' badge if applicable",
      "Wallet Summary Card: Available Balance (large, green, DM Mono), In Escrow (secondary), This Month Earned vs Forfeited",
      "Active Goals Section: horizontal scroll; each goal card shows: name, day X of Y, mini progress ring, daily earnback amount",
      "Active Challenges Section: horizontal scroll; challenge name, participants count, days remaining, your rank",
      "Quick Actions Row: 'Add Goal' / 'Join Challenge' / 'Top Up Wallet' / 'Withdraw'",
      "Recent Activity Feed: last 5 transactions (compact list)",
    ],
    [
      "Pull-to-refresh: refreshes task verification status and wallet balance",
      "Today's Task 'Start Task' CTA: navigates to GPS tracking screen",
      "Wallet balance tap: navigates to Wallet screen",
      "Streak tap: navigates to Streak Detail screen",
      "Goal card tap: navigates to Goal Detail screen",
      "Challenge card tap: navigates to Challenge Detail screen",
      "Notification bell tap: navigates to Notifications screen",
    ],
    [
      "Default: all data loaded",
      "Task completed today: hero card shows green 'Completed ✓' state, earnback amount animated in",
      "Task missed (past 8 PM): hero card turns warning orange, grace window countdown shown",
      "No active goals: hero card replaced with 'Start Your First Goal' empty state CTA",
      "Loading: skeleton screens for each section (never full-page spinner)",
    ],
    [
      "Dashboard must load within 1.5 seconds — use cached data first, then refresh in background",
      "The 'Today's Task' hero card is the most important element — it must be above the fold always",
      "Streak widget flame flickers (subtle CSS animation) to feel alive",
      "At midnight: today's task resets — brief flash animation on the task card",
    ]
  ),

  ...screen("10", "Notifications Center",
    "All app notifications with actionable items",
    [
      "Top Bar: 'Notifications' title, 'Mark all read' ghost button (right)",
      "Filter pills: All / Tasks / Challenges / Wallet / Streak (horizontal scroll)",
      "Notification list: grouped by 'Today' / 'Yesterday' / 'This Week'",
      "Each notification row: icon (color-coded by type, 44px), title (--text-md bold), body (--text-sm, text-secondary), timestamp (--text-xs, right-aligned), unread dot (accent color, 8px)",
      "Swipe-left on notification: reveals 'Delete' (red) and 'Mark Read' (blue) actions",
      "Empty state: illustration + 'You're all caught up!' message",
    ],
    [
      "Tap notification: navigates to relevant screen (task → tracking, challenge → challenge detail, wallet → wallet)",
      "Unread notifications: slight gray background (#F5F5F5) vs white for read",
      "Filter pill tap: filters list with 200ms fade transition",
      "Swipe action: spring physics; full swipe = action executed immediately",
    ],
    [
      "Unread notifications present", "All notifications read", "Empty (no notifications)", "Loading"
    ],
    [
      "Notification icons: green checkmark (task done), orange flame (streak), purple shield (shield), blue trophy (challenge), green up-arrow (wallet credit), red down-arrow (forfeit)",
      "Deep-link routing must be precise — notification tap should land on exact relevant screen",
    ]
  ),

  ...screen("11", "Activity & Earnings Feed",
    "Full history of tasks completed, money earned, and forfeited",
    [
      "Top Bar: 'Activity' title + date range filter (This Week / This Month / All Time)",
      "Summary bar: total earned (green), total forfeited (red), net (brand color) — all DM Mono",
      "Transaction list grouped by date",
      "Each transaction: left icon (arrow up green = earned, arrow down red = forfeited, shield = restore, trophy = challenge win), amount (DM Mono, color-coded), description, time",
      "Tap transaction: expands to detail card (verification proof, GPS map thumbnail if applicable, goal name, exact timestamp)",
    ],
    [
      "Date range tap: opens picker bottom sheet",
      "Filter by type: chips for Earned / Forfeited / Challenge / Withdrawals",
      "Tap transaction: expand inline (not navigate away) with 300ms accordion animation",
      "Long-press transaction: share card option (for social sharing of achievements)",
    ],
    [
      "Loaded list", "Empty (no transactions)", "Loading (skeleton rows)", "Expanded row"
    ],
    [
      "Green/red color coding is the primary communication tool here — no need for icons alone",
      "Export button (top right, CSV) for power users who want their financial history",
    ]
  ),
  sp(), sp(), pb()
];

// ── FLOW 3: GOAL MANAGEMENT ────────────────────────────────────────────────────
const flow3 = [
  h2("FLOW 3 — Goal Management (Screens 12–18)"),
  sp(),

  ...screen("12", "My Goals Screen",
    "Overview of all active, completed, and past goals",
    [
      "Top Bar: 'My Goals' + 'Create Goal' button (+ icon, accent color, top-right)",
      "Active Goals section: vertical list of goal cards",
      "Each Goal Card (radius: 20px, shadow level 1):",
      "  — Color-coded left accent stripe (by activity type: orange=run, blue=walk, green=yoga, etc.)",
      "  — Goal icon + name (--text-lg bold)",
      "  — Day X of Y progress bar (full-width, brand color fill)",
      "  — Streak badge (flame + number)",
      "  — Today's task status: 'Done ✓' (green) or 'Pending' (warning orange) or 'Missed ✗' (red)",
      "  — Stake info: ₹X staked, ₹Y earned back",
      "Completed Goals section (collapsed by default, tap to expand)",
      "Abandoned Goals section (collapsed, gray styled)",
      "Bottom: empty state if no goals ('Ready to stake your first goal?')",
    ],
    [
      "Goal card tap: navigates to Goal Detail (Screen 14)",
      "'Create Goal' tap: navigates to Create Goal flow (Screen 13)",
      "Swipe-left on goal card: 'Pause' and 'Abandon Goal' actions (with confirmation dialog)",
      "Pull-to-refresh: syncs latest verification status",
    ],
    [
      "Active goal (task done today)", "Active goal (task pending)", "Active goal (task missed)",
      "Active goal (grace window active)", "Completed goal", "Abandoned goal", "Empty state"
    ],
    [
      "Each activity type gets a distinct accent color for the left stripe — use these consistently across the app",
      "Goal card must communicate financial status clearly — stake and earnback are more important than just progress %",
    ]
  ),

  ...screen("13", "Create Goal Flow (4-step wizard)",
    "Multi-step goal setup: activity → task definition → stake → schedule",
    [
      "Step progress bar at top (25% increments)",
      "STEP 1 — Choose Activity: grid of activity tiles (2 columns, icon + name, 80px h each); Custom option last",
      "STEP 2 — Define Task: varies by activity. For running: distance slider (1–20km) + pace target (optional). For steps: slider (2,000–20,000). For yoga: duration selector. Custom: free text field",
      "STEP 3 — Set Your Stake: large money input (DM Mono, 40px); recommended range shown; escrow explanation tooltip; duration picker (7/14/21/30/60/90/custom days)",
      "STEP 4 — Schedule & Verify: start date (today or tomorrow); verification method selector (cards: GPS/Wearable/Photo/Manual — each with earnback % shown); rest days toggle; notification time picker",
      "'Review Goal' CTA on Step 4 → Review screen (modal bottom sheet)",
      "Review: all goal details summarized, total stake amount, daily earnback amount; 'Confirm & Stake' primary CTA",
    ],
    [
      "Step 1: tap tile to select; double-tap to deselect; Continue enabled after selection",
      "Step 3: slider or direct input for stake; recommendation chips ('₹500' '₹1,000' '₹2,000' '₹5,000') for quick selection",
      "Step 4: verification method: selecting each card shows its earnback rate prominently",
      "'Confirm & Stake': checks wallet balance; if insufficient → wallet top-up bottom sheet appears; on success → goal created animation",
    ],
    [
      "Default", "Insufficient wallet balance (shows top-up prompt)", "Goal creation loading", "Goal creation success"
    ],
    [
      "Goal creation success: full-screen animation — coin explodes into running figure, confetti, 'Goal Created! ₹X staked' message",
      "Back navigation between steps must preserve entered data",
      "Estimated total earnback shown in real-time as user adjusts stake and duration",
    ]
  ),

  ...screen("14", "Goal Detail Screen",
    "Deep-dive into a single goal — progress, earnings, task history, verification",
    [
      "Hero: goal gradient card (full-width, 200px h): goal name, activity icon, streak badge, day count",
      "Progress Ring (128px, centered): day % complete with days remaining label in center",
      "Financial Summary row: 3 stats side-by-side — 'Staked' / 'Earned' / 'Remaining' (all DM Mono)",
      "Today's Task section: task description + verification method + Start/Complete button",
      "Task History: calendar heatmap (GitHub style, 4-week view), scrollable horizontally for full duration",
      "Earnings Chart: bar chart by day (earned=green, missed=red)",
      "Goal Settings: edit task, change verification method, enable rest days, abandon goal",
    ],
    [
      "Heatmap cell tap: shows tooltip (date, completion status, earnback amount)",
      "Earnings chart bar tap: shows daily breakdown",
      "'Edit Goal' button: opens edit flow (limited changes after goal starts)",
      "'Abandon Goal' button: shows confirmation bottom sheet with forfeit amount prominently displayed",
    ],
    [
      "Active goal (in progress)", "Active goal (task completed today)", "Active goal (task missed today)",
      "Completed goal (read-only, celebration state)", "Abandoned goal (gray, minimal info)"
    ],
    [
      "The calendar heatmap is a key retention feature — users scroll back through history to see their pattern",
      "Forfeit amounts must always be shown in red — never neutral — to reinforce loss aversion",
      "Completed goal state shows total earned, total streak, and a shareable card",
    ]
  ),

  ...screen("15", "GPS Activity Tracking Screen",
    "Live tracking during a run/walk/cycle — the most critical interaction moment",
    [
      "Full-screen map (MapKit/Google Maps) with route drawn in brand color (4px stroke)",
      "Top overlay: semi-transparent pill showing elapsed time (DM Mono, large) + heart rate if available",
      "Bottom panel (expanded by default, can swipe down to minimize): ",
      "  — Primary metric: distance (--text-3xl, DM Mono) with unit (km/mi)",
      "  — Secondary metrics row: Pace / Calories / Steps",
      "  — Goal progress bar: 'X km of Y km' with % and estimated finish time",
      "  — 'Finish' button (red, prominent) + 'Pause' button",
      "Map: user location pulsing dot (brand color), start pin, route polyline",
      "Lock screen widget: distance + time + stop button accessible without unlocking",
    ],
    [
      "Map auto-centers on user location every 5 seconds",
      "Haptic + audio cue every km milestone",
      "Goal distance reached: full-screen celebration animation, auto-offers to finish",
      "Pause: map grays out slightly, route stops recording, 'Resume'/'Discard' options appear",
      "Finish button: confirmation dialog ('Finish X.Xkm run? Goal requires Xkm') if goal not complete",
      "Post-activity: auto-navigate to Task Verification Result screen",
    ],
    [
      "Active tracking (GPS locked)", "GPS acquiring (pulsing accuracy circle)", "Paused", "Goal complete (celebration overlay)", "Task complete (earnback shown)"
    ],
    [
      "This screen must work reliably in background (app backgrounded during run)",
      "Low battery mode: reduce map updates to 30s intervals, keep metrics live",
      "Privacy: 'Hide Map' button for users who don't want location on screen in public",
    ]
  ),

  ...screen("16", "Task Verification Result Screen",
    "Post-activity confirmation — show what was earned",
    [
      "Full-screen result card (gradient background: green for success, red for failure)",
      "Large checkmark or X icon (animated, 100px)",
      "Result headline: 'Task Verified! 💪' or 'Verification Failed'",
      "Activity stats: distance, time, pace, map thumbnail (tappable for full map)",
      "Earnback amount: '₹100 Earned!' (--text-3xl, DM Mono, white bold, animated counter)",
      "New streak count if incremented (flame + big number + animation)",
      "Achievement unlock if applicable (badge animation pop-in)",
      "Action buttons: 'Share Achievement' / 'View Goal' / 'Done'",
    ],
    [
      "Earnback counter animates from 0 to earned amount (800ms, ease-out)",
      "Streak number increments with particle burst animation",
      "Achievement badge: slides in from bottom with spring bounce",
      "Share button: generates pre-styled shareable card image (route map + stats + FitStake logo)",
      "Haptic: success pattern on verification success",
    ],
    [
      "Verification success", "Verification success + streak milestone", "Verification success + achievement unlocked",
      "Verification failed (reason shown: 'Distance too short', 'GPS data missing')", "Pending verification (for manual check-in)"
    ],
    [
      "This screen is the core reward moment — make it feel extraordinary",
      "Even for verification failures, show the data recorded and offer an appeal option",
      "Social share card must look great as a standalone image (Instagram/WhatsApp story size)",
    ]
  ),

  ...screen("17", "Photo Proof Submission Screen",
    "Camera interface for photo-based task verification",
    [
      "Full-screen camera viewfinder",
      "Top bar: 'Take Proof Photo' title, X close button",
      "Overlay guide: dashed border rectangle with activity icon inside ('Frame yourself at the gym')",
      "Requirements chips: '✓ Well-lit' '✓ Show activity' '✓ You in frame'",
      "Bottom: large shutter button (white circle, 80px), gallery pick icon (left), flash toggle (right)",
      "After capture: preview screen with 'Use Photo' / 'Retake' / 'Add Caption (optional)'",
      "Submission: loading overlay 'Verifying your photo...' with AI icon",
    ],
    [
      "Shutter tap: capture + brief white flash",
      "Gallery pick: OS photo picker; AI analyzes chosen photo",
      "Preview 'Use Photo': submit to AI verification",
      "Verification result: inline in this screen, then navigate to Result screen",
    ],
    [
      "Camera permission granted", "Camera permission denied (guidance to enable in settings)",
      "Photo captured (preview state)", "Verifying (loading overlay)", "Verification passed/failed"
    ],
    [
      "Add EXIF metadata strip on captured image for timestamp/location verification",
      "Guide text should be activity-specific — gym vs outdoor yoga vs home workout",
    ]
  ),

  ...screen("18", "Streak Detail & History Screen",
    "Deep view of streak performance, history, and Shield status",
    [
      "Top: Streak hero card — flame animation, streak number (--text-4xl, DM Mono, accent), streak type, start date",
      "Best Streak badge (if current < best: show 'Best: X days', if current = best: 'New Personal Best!')",
      "Weekly summary: this week's checkin circles (7 circles, green=done, red=missed, gray=future, shield-icon=shielded)",
      "Full history heatmap (12-week calendar)",
      "Shield Status section: subscription tier badge, restores remaining this month, 'Upgrade' CTA",
      "Streak Stats: total days staked, completion rate %, longest streak, total earned from streak bonuses",
      "FitCoins earned from streaks: coin icon + amount",
    ],
    [
      "Heatmap cell tap: tooltip with date + status + earnback",
      "Shield section 'Upgrade' tap: navigates to Subscription screen",
      "'Use Shield' button (if streak recently broken and user has restores): confirmation bottom sheet",
    ],
    [
      "Active streak", "Broken streak (show restore option)", "Shielded day visible in history",
      "No shield subscription (show upsell)", "Record streak being beaten (celebration state)"
    ],
    [
      "The streak number is a user identity metric — it should feel like a trophy, not a data point",
      "Shield upsell here should feel helpful not pushy — show what would have been lost without a Shield",
    ]
  ),
  sp(), sp(), pb()
];

// ── FLOW 4: CHALLENGES ─────────────────────────────────────────────────────────
const flow4 = [
  h2("FLOW 4 — Community Challenges (Screens 19–26)"),
  sp(),

  ...screen("19", "Challenges Discovery Screen",
    "Browse, filter, and discover group challenges",
    [
      "Top Bar: 'Challenges' + 'Create' icon (top-right)",
      "Search bar (full-width, with filter icon right)",
      "My Challenges section: horizontal scroll of active joined challenges",
      "Featured Challenges: curated list (editor's picks, large cards 200px h, full-bleed image bg with gradient overlay)",
      "Browse by Activity: horizontal pill filter (All / Running / Walking / Cycling / Yoga / Strength)",
      "Challenge cards (in filtered list):",
      "  — Activity icon + challenge name (--text-lg bold)",
      "  — Duration badge + stake amount badge (accent color)",
      "  — Participants: avatar stack (max 5 shown) + '+ X more'",
      "  — Prize pool amount (--text-md, DM Mono, green)",
      "  — Join deadline countdown ('Closes in 2 days')",
      "  — Distribution model badge: 'Proportional' / 'Winner' / 'All-or-Nothing'",
    ],
    [
      "Filter pills: tap to filter list (200ms fade), multiple can be active",
      "Search: filters list in real-time (debounced 300ms)",
      "Card tap: navigates to Challenge Detail (Screen 20)",
      "Swipe left on card: 'Save/Bookmark' challenge",
      "Pull-to-refresh: refreshes challenge list",
    ],
    [
      "Loaded list", "Empty filter result ('No challenges match your filters')",
      "Loading (skeleton cards)", "Search active (keyboard visible, list filtered)"
    ],
    [
      "Prize pool amount is the strongest call-to-action — make it prominent",
      "Avatar stack humanizes the challenge — shows real participants",
      "Deadline urgency styling: challenges closing in <24h get a red 'Closing Soon!' badge",
    ]
  ),

  ...screen("20", "Challenge Detail Screen",
    "Full detail of a challenge before joining",
    [
      "Hero image/illustration (full-width, 220px h, activity-themed) with gradient overlay",
      "Challenge badge (activity icon, 64px) overlapping bottom of hero image",
      "Challenge name (--text-2xl bold)",
      "Organizer row: avatar + 'by [Name]' + verified badge if coach/corporate",
      "Stats row (3 columns): Participants / Days / Prize Pool",
      "Distribution Model card: explains how prizes are split with visual example",
      "Task Description: what participants must do daily",
      "Leaderboard Preview: top 3 placeholders if not yet started, live if active",
      "Rules section (expandable)",
      "Participants list: avatar grid (show up to 12, 'View All' link)",
      "Sticky bottom bar: stake amount + 'Join Challenge' primary CTA",
    ],
    [
      "Join CTA tap: stake confirmation bottom sheet → wallet deducted → success state",
      "Distribution model card: tap 'How it works?' → bottom sheet with detailed explanation + example calculation",
      "Leaderboard row tap: user profile preview",
      "Share button (top-right): deep-link share card",
    ],
    [
      "Not joined, open for joining",
      "Already joined (show 'You're In! ✓', CTA changes to 'View My Progress')",
      "Challenge full (join disabled, waitlist option)",
      "Challenge started (live, shows live leaderboard)",
      "Challenge ended (shows final results)",
    ],
    [
      "The prize pool and distribution model MUST be completely clear before joining — no hidden surprises",
      "Example calculation (e.g., 'If you complete 80%, you'd earn ₹X') increases conversion significantly",
    ]
  ),

  ...screen("21", "Create Challenge Screen",
    "Challenge creation wizard for users/coaches",
    [
      "4-step wizard with progress bar",
      "STEP 1 — Basics: Challenge Name, Activity Type, Challenge Type (Public/Private/Corporate/Charity)",
      "STEP 2 — Rules: Duration slider (7–90 days), Daily task definition (same as goal creation), Start date picker, Max participants slider (2–500)",
      "STEP 3 — Stakes & Prizes: Entry stake amount, Distribution model selector (3 options with visual explainer for each), Platform fee notice (8%)",
      "STEP 4 — Invite & Launch: Invite link (copy + share options), invite contacts (with permission), Optional: cover image upload, challenge description text area",
      "Review screen → 'Launch Challenge' CTA",
    ],
    [
      "Distribution model selector: tapping each option reveals an animated worked example",
      "Invite link: one-tap copy + native share sheet",
      "Cover image: camera or gallery pick, with crop tool",
      "Launch: loading → success screen with challenge link and social share",
    ],
    [
      "Default wizard", "Insufficient balance to cover own stake", "Private challenge (invite-only, link generated)", "Corporate challenge (extra fields: company name, HR email)"
    ],
    [
      "Creator automatically joins and stakes their entry amount on challenge launch",
      "Smart defaults: pre-fill activity from user's most-used goal type",
      "Preview mode: before launching, show how the challenge card will appear to others",
    ]
  ),

  ...screen("22", "Active Challenge Screen (In-Progress)",
    "Live view of a running challenge — your progress and competitors",
    [
      "Top: challenge name + days remaining countdown (large, DM Mono, accent color)",
      "Your Status card: today's task (done/pending/missed), your rank (large number), your completion % ring",
      "Prize estimate: 'You'd earn ₹X at current performance' (dynamic, green, DM Mono)",
      "Live Leaderboard: sorted list, top 5 visible, scroll for more",
      "Each leaderboard row: rank (with ▲▼ rank change indicator), avatar, name, completion %, earned estimate",
      "Your row: highlighted (light blue bg), sticky at bottom if outside top 5",
      "Task Status row for all participants: small avatar + green/red/gray dot for today",
      "Challenge timeline: progress bar showing current day vs total",
      "Group Chat button (floating, bottom-right)",
    ],
    [
      "Pull-to-refresh: refreshes leaderboard",
      "Leaderboard updates every 6 hours: rank changes animate (rows smoothly reorder)",
      "Rank improvement: your row briefly pulses green + '↑ Moved up!' badge",
      "Group chat button: opens challenge group chat (Screen 25)",
      "'Complete Today's Task' CTA (if not done): navigates to appropriate tracking screen",
    ],
    [
      "Your task completed today", "Your task pending (CTA prominent)", "Your task missed (red warning banner)",
      "You're in 1st (celebration styling)", "Challenge ends today (final push banner)", "Loading (skeleton leaderboard)"
    ],
    [
      "Rank change animations are the core social engagement hook — they must feel live and exciting",
      "The prize estimate dynamically updates — users are motivated by watching this number change",
    ]
  ),

  ...screen("23", "Challenge Results Screen",
    "Final results — who won, how prizes were distributed",
    [
      "Hero: trophy illustration + 'Challenge Complete!' headline",
      "Your Result card (full-width, 160px h): your rank (--text-3xl, DM Mono), completion %, amount earned (green, --text-2xl, DM Mono, animated counter)",
      "Winner podium: top 3 with avatars, rank positions, and earned amounts",
      "Full results table: all participants, rank, completion %, earned, forfeited",
      "Prize distribution breakdown: pie/bar chart showing how pool was split",
      "Acheivement badges earned in this challenge",
      "Share result card button",
      "'Join Next Challenge' CTA + 'View My Goals' ghost link",
    ],
    [
      "Earnings counter: animates up on screen appear (800ms)",
      "Podium: 1st place card bounces in first, then 2nd and 3rd simultaneously",
      "Your row in full table: highlighted, scrolled to if not visible",
      "Share button: generates stylized result card (rank, earnings, challenge name, your avatar)",
    ],
    [
      "You won (1st place celebration: extra confetti, gold color scheme)",
      "You placed (top 3)", "You completed but not top 3", "You partially completed", "You forfeited (minimal UI, forfeit amount in red)"
    ],
    [
      "Even losing users must leave with dignity — focus on completion % and personal best, not just rank",
      "Forfeit state: show how much they earned back (even partial) to retain them for next challenge",
    ]
  ),

  ...screen("24", "My Challenges Overview",
    "All challenges: active, upcoming, completed",
    [
      "Tab bar: Active / Upcoming / Completed",
      "Active tab: same card style as Screen 22 (compact) — name, your rank, days left, quick task status",
      "Upcoming: challenges joined but not started — start date countdown, participants joined so far",
      "Completed: results history, earnings from each challenge, streak in that challenge",
      "Stats footer: total challenges, total earned from challenges, best rank",
    ],
    [
      "Active card tap: Challenge Active Screen (22)",
      "Upcoming card tap: Challenge Detail Screen (20) — shows start countdown",
      "Completed card tap: Challenge Results Screen (23) — historical",
    ],
    [
      "Has active challenges", "No active challenges (prompt to discover)", "All tabs empty state"
    ],
    [
      "Keep this screen clean — it's a navigation hub, not an analytics screen",
    ]
  ),

  ...screen("25", "Challenge Group Chat",
    "In-challenge messaging between participants",
    [
      "Standard chat UI: messages in bubbles (sent: right, brand color; received: left, light gray)",
      "Top: challenge name + participant count",
      "System messages: milestone announcements ('🔥 Priya just completed Day 7!'), rank changes ('📈 You moved to #2!')",
      "Reaction support on messages (long-press to react: 🔥 💪 👏 😂 🏆)",
      "Sticker pack: FitStake themed stickers (flame, trophy, sweat drop, coin)",
      "Input bar: text input + sticker button + attachment (for sharing route maps)",
      "Pinned message bar at top: challenge rules summary (admin-pinnable)",
    ],
    [
      "System message style: centered, pill shape, brand color bg, white text — not a bubble",
      "Reactions: appear as floating emoji cluster below message",
      "Route share: shows route thumbnail card in chat, tappable for full map",
    ],
    [
      "Active chat with messages", "Empty chat (just joined, no messages yet)", "Loading messages"
    ],
    [
      "Moderation: long-press message → report option",
      "System messages are auto-generated by the platform — always bilingual (EN + user's language)",
    ]
  ),

  ...screen("26", "Public Leaderboard Screen",
    "Global and friends leaderboard",
    [
      "Top tabs: Global / Friends / My City",
      "Filter: This Week / This Month / All Time",
      "Top 3: large podium layout (rank 2 left, rank 1 center elevated, rank 3 right), with avatars, names, metric",
      "List from rank 4: compact rows with rank, avatar, name, metric value, trend arrow",
      "Your rank: sticky card at bottom showing your rank + metric + gap to next rank",
      "Metric selector: Streak / Earnings / Completion Rate / Challenges Won (pill toggle)",
      "Right side: medal icon for milestones (gold/silver/bronze at ranks 1/2/3)",
    ],
    [
      "Tab changes: animated list re-order",
      "Filter changes: list refreshes with skeleton, then populates",
      "User row tap: navigates to public profile",
      "Metric toggle: list re-sorts with smooth animation",
      "Your rank sticky bar tap: scrolls list to your position",
    ],
    [
      "You are in top 10", "You are outside top 10 (sticky rank bar visible)",
      "Friends tab: you have no friends (prompt to invite)", "Loading"
    ],
    [
      "Rank trend arrows (▲▼) show week-over-week change — key engagement hook",
      "Your row always appears somewhere (sticky), even if rank is 5,428 — prevents discouragement",
    ]
  ),
  sp(), sp(), pb()
];

// ── FLOW 5: WALLET & FINANCES ─────────────────────────────────────────────────
const flow5 = [
  h2("FLOW 5 — Wallet & Finances (Screens 27–31)"),
  sp(),

  ...screen("27", "Wallet Screen",
    "Financial overview — balances, escrow, transaction history, top-up, withdraw",
    [
      "Top: total balance card (full-width, 180px, brand gradient): 'Total Balance' label, large balance (--text-3xl, DM Mono, white), 'In Escrow' secondary label + amount below",
      "Quick Actions row: 'Add Money' / 'Withdraw' / 'History' (icon + label buttons)",
      "Balance Breakdown: Available (green) / In Escrow (blue) / This Month Earned (light green) / This Month Forfeited (light red) — 2×2 grid of stat cards",
      "Recent Transactions: last 10, compact list format (icon + description + amount + date)",
      "'View All Transactions' link at bottom",
    ],
    [
      "Add Money tap: bottom sheet with amount input + payment method selector",
      "Withdraw tap: withdrawal flow (Screen 29)",
      "Transaction row tap: detail expansion with verification proof thumbnail",
      "Balance card: 3D-tilt on tilt (gyroscope-driven, subtle) — premium feel",
    ],
    [
      "Sufficient balance", "Low balance (yellow warning banner: 'Top up to keep your goals active')",
      "Pending withdrawal (shows processing status)", "Loading (skeleton)"
    ],
    [
      "Wallet screen must feel like a banking app — trustworthy, clean, precise numbers",
      "DM Mono for ALL numerical values on this screen without exception",
      "Escrow amount breakdown: tooltip on tap explaining what escrow is and when it releases",
    ]
  ),

  ...screen("28", "Add Money Screen",
    "Top-up wallet with multiple payment methods",
    [
      "Amount input: large DM Mono money input (center screen, 56px font)",
      "Quick amount chips: ₹200 / ₹500 / ₹1,000 / ₹2,000 / ₹5,000 (horizontal scroll)",
      "Payment method section:",
      "  — UPI (text field for UPI ID or QR scan button)",
      "  — Saved cards (masked card numbers, radio select)",
      "  — Net Banking (bank dropdown)",
      "  — Add New Card option",
      "Fee notice: '0 transaction fee' or applicable charges clearly stated",
      "'Add ₹X to Wallet' primary CTA (full-width, sticky bottom)",
    ],
    [
      "Amount input: auto-opens numeric keyboard; formats with commas as user types (₹1,000)",
      "Quick chip tap: populates amount field with spring animation",
      "Payment method radio: immediate visual select",
      "UPI QR: opens camera for QR scan",
      "CTA tap: payment gateway integration; loading state → success/failure",
      "Success: confetti animation + toast 'Wallet topped up with ₹X'",
    ],
    [
      "Amount empty (CTA disabled)", "Amount entered + method selected (CTA enabled)",
      "Processing payment (loading overlay)", "Payment success", "Payment failed (error message + retry)"
    ],
    [
      "Integrate with Razorpay/Stripe SDK for native payment UX",
      "PCI compliance: never handle raw card data in the app — pass through to SDK",
      "Show estimated processing time for net banking (instant for UPI/cards)",
    ]
  ),

  ...screen("29", "Withdrawal Screen",
    "Request withdrawal of available balance to bank account",
    [
      "Available balance display (top, green card)",
      "Withdraw amount input (large money input, max = available balance)",
      "Quick amount: 'Withdraw All' chip",
      "Bank account section: saved accounts (last 4 digits, bank name + account holder name)",
      "'Add Bank Account' option (opens bank detail form)",
      "Processing time notice: 'Typically within 24 hours'",
      "KYC notice (if applicable): 'Verify your identity for withdrawals above ₹10,000'",
      "'Withdraw ₹X' primary CTA",
    ],
    [
      "Amount input: cannot exceed available balance (shows error if exceeded)",
      "Add Bank Account: form with IFSC auto-lookup (bank name auto-populates on valid IFSC)",
      "KYC upsell: 'Verify Now' button if amount exceeds KYC threshold",
      "CTA tap: confirmation bottom sheet ('Confirm withdrawal of ₹X to XXXX account?') → processing",
    ],
    [
      "Sufficient balance", "Withdrawal in progress (past request pending)", "KYC required",
      "Amount exceeds available (validation error)", "Success (receipt screen)"
    ],
    [
      "Withdrawal receipt screen: shows reference number, amount, bank account, expected date — shareable as PDF",
    ]
  ),

  ...screen("30", "Transaction Detail Screen",
    "Detailed view of a single transaction with proof",
    [
      "Top: transaction type icon (large, color-coded, 80px)",
      "Amount (--text-3xl, DM Mono, green/red based on type)",
      "Status badge: 'Completed' / 'Pending' / 'Disputed'",
      "Details list: Date & Time, Transaction ID (copyable), Goal/Challenge name, Verification method, Earnback rate applied",
      "For GPS tasks: route map thumbnail (tappable for full map), distance, duration, pace",
      "For photo tasks: submitted photo thumbnail",
      "For challenge: link to Challenge Results screen",
      "Dispute button (for failed verifications, within 48 hours of transaction)",
    ],
    [
      "Transaction ID: tap to copy to clipboard (toast confirmation)",
      "Map thumbnail: tap opens full-screen route map with stats overlay",
      "Photo thumbnail: tap opens lightbox",
      "Dispute: opens dispute form bottom sheet (free text + relevant data pre-filled)",
    ],
    [
      "Earned transaction", "Forfeited transaction", "Pending transaction",
      "Disputed (shows dispute status)", "Dispute resolved in user's favor"
    ],
    [
      "This screen must be print/share worthy — users may need it for records",
      "Dispute option only shows for 48-hour window — then hides cleanly (no disabled state)",
    ]
  ),

  ...screen("31", "Earnings Analytics Screen",
    "Financial performance insights and trends",
    [
      "Header: 'Your Earnings' + period selector (Week / Month / 3M / Year)",
      "Total Earned card (brand color, large DM Mono number)",
      "Net vs Gross toggle: show gross earned or net (earned minus forfeited)",
      "Cumulative earnings line chart (smooth bezier, x=time, y=₹)",
      "Daily breakdown bar chart (green bars = earned, red bars = forfeited)",
      "Goal-by-goal breakdown: horizontal bars showing earned vs staked per goal",
      "Streak bonus earnings: separate highlighted section",
      "Best day / Best week / Best month stats (celebration styling if recent personal best)",
    ],
    [
      "Period selector: charts animate to new data range (300ms)",
      "Chart points: tap for exact value tooltip",
      "Goal bar tap: navigate to that Goal Detail screen",
    ],
    [
      "Has sufficient data", "New user (minimal data, encouraging empty state with projected earnings)",
      "Loading (skeleton charts)"
    ],
    [
      "This is the 'proof of value' screen — it must make users feel they're benefiting financially",
      "Always show earned amount prominently; forfeited should be visible but secondary",
    ]
  ),
  sp(), sp(), pb()
];

// ── FLOW 6: SUBSCRIPTIONS & PROFILE ───────────────────────────────────────────
const flow6 = [
  h2("FLOW 6 — Streak Shield Subscription (Screens 32–34)"),
  sp(),

  ...screen("32", "Subscription Plans Screen",
    "Streak Shield subscription tiers and comparison",
    [
      "Top: Shield hero illustration (shield icon with lightning bolt, purple gradient)",
      "Headline: 'Protect Your Streak' (--text-2xl bold)",
      "Subhead: 'One missed day shouldn't erase weeks of progress' (--text-base, text-secondary)",
      "Plan toggle: Monthly / Annual (annual shows savings badge '2 months free!')",
      "Plan cards (vertical stack, 3 cards):",
      "  — Basic: white card, gray border",
      "  — Pro: brand color card, 'MOST POPULAR' badge (accent top banner)",
      "  — Elite: purple gradient card, 'BEST VALUE' badge, glow shadow",
      "Each card: price, restore count, grace window, feature list (checkmarks)",
      "Current plan highlighted (if subscribed)",
      "FAQ accordion (3-4 common questions)",
    ],
    [
      "Monthly/Annual toggle: price numbers animate (number morph) to show annual price",
      "Plan card tap: selects plan; CTA changes to 'Subscribe to [Plan]'",
      "'Subscribe' CTA: payment flow → subscription confirmed screen",
      "FAQ accordion: smooth expand/collapse",
    ],
    [
      "Not subscribed (upsell state)", "Currently on Basic (upgrade prompt for Pro)",
      "Currently on Pro", "Currently on Elite", "Loading plans"
    ],
    [
      "Pro plan should be visually dominant — it's the primary conversion target",
      "Show the exact ₹ loss a user would have prevented with a Shield (personalized if data available)",
      "Annual plan discount must be prominent — it's the best margin product",
    ]
  ),

  ...screen("33", "Shield Restore Confirmation Screen",
    "Confirm use of a streak restore when streak is at risk",
    [
      "Full-screen bottom sheet (modal)",
      "Shield icon at top (purple, 80px, animated pulse)",
      "Title: 'Save Your X-Day Streak?' (--text-xl bold, X is the actual streak count)",
      "Description: what shielding does (preserves streak, does NOT recover money)",
      "Restore count remaining (large, DM Mono): 'X of 3 restores remaining this month'",
      "Streak visualization: before and after state of the streak counter",
      "'Use Shield Restore' primary CTA (purple gradient)",
      "'Let It Break' ghost link (warning red text — deliberate friction)",
      "If no restores: 'Buy a Single Restore (₹49)' option + 'Upgrade Plan' CTA",
    ],
    [
      "CTA tap: haptic + shield animation + streak counter updates + toast '🛡️ Streak Protected!'",
      "'Let It Break': confirmation dialog ('Are you sure? Your X-day streak will be lost.') before executing",
      "Buy single restore: payment bottom sheet",
    ],
    [
      "Restores available", "Last restore available (warning: 'This is your last restore this month')",
      "No restores left", "Processing", "Restore confirmed"
    ],
    [
      "This screen is the most emotionally charged in the app — design for the feeling of relief",
      "The streak count must be very visible — it's what the user is protecting",
      "Make 'Let It Break' work, but add intentional friction — it should feel like a mistake",
    ]
  ),

  ...screen("34", "Subscription Management Screen",
    "Manage current subscription, payment method, renewal, cancellation",
    [
      "Current plan card (color matches plan tier)",
      "Next renewal date + amount",
      "Restores used this month: progress bar (X of Y used)",
      "Grace window: '48-hour grace active' status",
      "Payment method: masked card + 'Change' link",
      "Plan history: when they subscribed, any tier changes",
      "'Upgrade Plan' CTA (if not on Elite)",
      "'Cancel Subscription' ghost link (bottom, gray)",
    ],
    [
      "'Cancel Subscription' tap: retention flow — shows what they'd lose (restore history), offers 1-month discount, then final confirm",
      "'Upgrade' tap: plan comparison screen",
      "'Change Payment' tap: payment method update form",
    ],
    [
      "Active subscription", "Subscription expiring soon (renewal warning)",
      "Subscription cancelled (shows end date, option to reactivate)"
    ],
    [
      "Cancellation flow must have retention steps — show the user's restore history ('You've protected 5 streaks!')",
      "Never hide the cancel option — it builds trust and reduces forced disputes/chargebacks",
    ]
  ),
  sp(), sp(), pb()
];

// ── FLOW 7: PROFILE ───────────────────────────────────────────────────────────
const flow7 = [
  h2("FLOW 7 — Profile & Settings (Screens 35–42)"),
  sp(),

  ...screen("35", "My Profile Screen",
    "User's public and private profile — achievements, stats, identity",
    [
      "Top: cover photo / gradient banner (editable), avatar (80px, circular, overlapping bottom of banner)",
      "Name (--text-xl bold), bio (--text-base, text-secondary, editable), location (optional)",
      "Stats row (3 columns, DM Mono): Current Streak / Total Earned / Challenges Won",
      "Subscription badge (Shield Pro / Elite): below stats if subscribed",
      "Badges wall: grid of earned achievement badges (circular, 56px each, grayed out if locked)",
      "Active Goals: compact list (name + streak + progress)",
      "Recent Activity: last 3 completed tasks with verification thumbnails",
      "Privacy toggle: Public / Friends Only / Private",
      "Edit Profile button (top-right pencil icon)",
    ],
    [
      "Avatar tap: photo picker (camera or gallery)",
      "Badge tap: badge detail bottom sheet (name, how earned, date earned, rarity %)",
      "Locked badge: shows requirements to unlock",
      "Edit Profile: inline edit mode (name, bio, cover photo become editable)",
      "Share Profile button: generates profile card image + deep link",
    ],
    [
      "Own profile (edit controls visible)", "Other user's profile (no edit, 'Add Friend'/'Follow' CTA)",
      "Private profile (limited view for non-friends)", "Loading"
    ],
    [
      "Profile is the social currency of the app — badges and stats are what users share",
      "Make the badges wall feel like a collection/trophy case — locked badges visible (grayed) to drive aspiration",
    ]
  ),

  ...screen("36", "Achievements & Badges Screen",
    "Full collection of all badges — earned and to-earn",
    [
      "Progress header: 'X of Y badges earned' with overall progress bar",
      "Category tabs: Streaks / Challenges / Goals / Financial / Special",
      "Badge grid (3 columns, 100px cells): icon + badge name below",
      "Earned: full color + unlock date on tap",
      "Locked: grayscale + lock icon overlay + requirements on tap",
      "Rare badge indicator: 'Top 5%' label on special badges",
      "FitCoins summary: total FitCoins earned from achievements",
    ],
    [
      "Badge tap: slide-up detail card (name, category, description, how to earn, % of users who have it, date earned if unlocked)",
      "Recently earned badge: animated gold glow border",
    ],
    [
      "Has many badges", "New user (mostly locked)", "Just unlocked a badge (celebration state)"
    ],
    [
      "Rarity % is key motivator for competitive users — display it prominently on rare badges",
      "Badge animations on the wall: earned badges subtly shimmer on screen load",
    ]
  ),

  ...screen("37", "Friends & Social Screen",
    "Manage connections, find friends, see their activity",
    [
      "Search bar: find users by username or phone",
      "Friend Requests section: pending incoming requests",
      "My Friends list: avatar + name + current streak + 'View Profile' link",
      "Suggestions: people from contacts who use FitStake (with permission)",
      "Leaderboard preview: mini-leaderboard of friends only",
      "'Invite Friends' CTA (share link for referral)",
    ],
    [
      "Accept/Decline friend requests: inline action buttons on request cards",
      "Friend card tap: their public profile (Screen 35)",
      "Search: filter friends list + search all users",
      "Invite: native share sheet with referral link",
    ],
    [
      "Has friends", "No friends yet (invite-focused empty state)",
      "Pending requests", "Suggested friends visible"
    ],
    [
      "Referral program: inviter and invitee both get ₹100 wallet bonus on first goal creation",
      "Friend activity is opt-in — respect privacy settings of other users",
    ]
  ),

  ...screen("38", "Settings Screen",
    "App settings and preferences hub",
    [
      "Profile section: Avatar + name + 'Edit Profile' link",
      "Account: Email, Phone, Password, KYC Status, Linked Accounts (Google, Apple)",
      "Notifications: granular toggles (Daily reminders, Streak alerts, Challenge updates, Marketing)",
      "Appearance: Dark Mode / Light Mode / System Default",
      "Fitness Tracking: Connected apps (Apple Health, Garmin, Fitbit), GPS accuracy mode",
      "Privacy: Profile visibility, Activity sharing, Data export, Delete account",
      "Payments: Saved payment methods, Bank accounts, Transaction limits",
      "Subscription: Current plan, Manage (links to Screen 34)",
      "Support: Help Center, Contact Support, Report a Bug, Rate the App",
      "Legal: Terms, Privacy Policy, Licenses",
      "Sign Out (red, bottom)",
    ],
    [
      "Each setting row navigates to relevant sub-screen or inline toggle",
      "Dark mode toggle: immediate full-app theme switch (200ms transition)",
      "Sign out: confirmation dialog before executing",
      "Delete account: 3-step confirmation with explicit consequence warning",
    ],
    [
      "Standard", "KYC pending (banner at top prompting completion)"
    ],
    [
      "Standard iOS/Android settings UX patterns — users must feel at home here",
      "Group settings logically — don't alphabetize, group by mental model (account → notifications → privacy → payments → support)",
    ]
  ),

  ...screen("39", "Edit Profile Screen",
    "Inline editing of profile fields",
    [
      "Pre-filled form: Name, Username, Bio (150 char limit + counter), Location (optional, city-level only)",
      "Profile photo section: current photo + 'Change Photo' button",
      "Cover photo section: current cover + 'Change Cover' button",
      "Username availability checker: inline check icon (green/red) as user types",
      "Fitness goals public toggle: show/hide your goal details on public profile",
      "'Save Changes' CTA (sticky bottom)",
    ],
    [
      "Username check: debounced 500ms API call; shows 'Checking...' → 'Available ✓' or 'Taken ✗'",
      "Photo: tap → picker → crop tool → save",
      "Save: loading → success toast 'Profile updated'",
      "Unsaved changes: navigate away → 'Discard changes?' confirmation",
    ],
    [
      "Default (editing)", "Username taken", "Username available", "Saving", "Saved"
    ],
    [
      "Keep bio character counter visible — people write to the limit",
    ]
  ),

  ...screen("40", "KYC Verification Screen",
    "Identity verification for withdrawal limits",
    [
      "Progress: Step 1 of 3 (25% / 75% / 100%)",
      "Step 1: Personal Details — Full legal name, Date of birth, PAN Number field",
      "Step 2: Address Proof — Address fields OR Aadhaar card number (India) / Passport (International)",
      "Step 3: Photo Verification — Selfie capture + document photo (front/back of ID)",
      "Summary screen: submitted details for review, 'Submit for Verification' CTA",
      "Status screen: 'Verification Pending' / 'Verified ✓' / 'Rejected (with reason)'",
    ],
    [
      "Document photo: camera with document guide overlay (white rounded rectangle to align document)",
      "Selfie: camera with face guide oval; auto-capture when face detected",
      "Submission: uploading progress, then pending status",
      "Verification result: push notification + in-app status update (typically 24–48 hours)",
    ],
    [
      "Not started", "In progress (step 2 or 3)", "Pending review",
      "Verified", "Rejected (shows specific reason + option to resubmit)"
    ],
    [
      "KYC UX must feel secure and professional — users are sharing sensitive data",
      "Clear explanation of why each piece of data is needed (tooltip icons next to each field)",
      "Data encryption badge visible throughout: 'Your data is encrypted and secure'",
    ]
  ),

  ...screen("41", "Help & Support Screen",
    "Self-service help center and contact support",
    [
      "Search bar: 'Search help articles' (searches FAQ knowledge base)",
      "Quick topics: category chips (Payments / Verification / Challenges / Streak / Account)",
      "Featured articles: top 5 most-accessed help articles",
      "Video tutorials: short explainer videos (thumbnail grid, 3 per row)",
      "Contact Support: 'Chat with Us' CTA (in-app chat or Intercom), 'Email Support' option",
      "Self-service: 'Raise a Dispute', 'Report a Bug', 'Request Feature'",
      "Response time indicator: 'Typical response: under 4 hours'",
    ],
    [
      "Article tap: opens article in in-app web view with back navigation",
      "Chat: opens in-app chat widget",
      "Raise dispute: pre-fills with recent transactions for selection",
    ],
    [
      "Default", "Active support ticket (shows ticket status banner at top)"
    ],
    [
      "Smart FAQ: if user came from a specific screen (e.g., wallet), pre-filter articles to that topic",
    ]
  ),

  ...screen("42", "Onboarding Completion / Home Redirect",
    "Final onboarding step after first goal created — welcome to the app",
    [
      "Full-screen celebration: confetti, animated coin shower, checkmark",
      "Title: 'You're all set, [Name]! 🎉'",
      "First goal summary card: goal name, daily task, stake amount, start date",
      "Key reminders: how to complete tasks, how verification works, when you'll earn",
      "FitCoins welcome bonus: '🪙 50 FitCoins added to your account!'",
      "'Go to Dashboard' primary CTA",
    ],
    [
      "Auto-navigate to Dashboard after 5 seconds (skip button available)",
    ],
    [
      "Default (success)"
    ],
    [
      "This screen sets expectations for Day 1 — be explicit about what happens tomorrow",
      "Celebration must be proportionate — not overwhelming, but genuinely joyful",
    ]
  ),
  sp(), sp(), pb()
];

// ── FLOW 8: SPECIAL/MISC SCREENS ──────────────────────────────────────────────
const flow8 = [
  h2("FLOW 8 — Special & Utility Screens (Screens 43–48)"),
  sp(),

  ...screen("43", "Streak Broken Screen",
    "Emotional moment — streak was broken (no shield used/available)",
    [
      "Dark overlay background (semi-transparent, #000 60%)",
      "Center modal (radius: 24px, white, 80% screen width)",
      "Icon: broken flame (animation: flame shatters into sparks)",
      "Title: 'Your X-Day Streak Ended' (--text-xl bold, danger color)",
      "Message: empathetic, motivating copy ('Every champion has a setback. Start a new streak tomorrow.')",
      "Forfeited amount: shown clearly ('₹100 was forfeited today')",
      "Options: 'Start Fresh Tomorrow' CTA (primary) / 'Learn About Streak Shield' ghost link",
      "New streak counter: '0 days — new beginning' (subtle, not rubbing it in)",
    ],
    [
      "Appears as modal overlay when app is opened after missed day and shield not used/available",
      "Broken flame animation plays on appear (Lottie, 1s)",
      "'Learn About Shield': navigates to Subscription screen with dismissed modal",
      "'Start Fresh': dismisses modal, navigates to Dashboard",
    ],
    [
      "Streak broken (default)", "Streak broken + had a Shield but didn't use it (more empathetic copy)"
    ],
    [
      "Tone is CRITICAL here — this is the highest emotional risk moment in the app",
      "Do NOT rub it in. Never say 'You failed'. Frame as 'a new beginning'",
      "The Shield upsell must feel helpful, not predatory — show it as a tool for next time",
    ]
  ),

  ...screen("44", "Goal Completion Celebration Screen",
    "Full goal completed — earn all money back",
    [
      "Full-screen celebration: fireworks Lottie animation, gold confetti, coin shower",
      "Trophy icon (gold gradient, 120px, bounce-in animation)",
      "Title: 'Goal Achieved! 🏆' (--text-3xl bold, brand color)",
      "Goal summary: name, duration, total tasks completed, total earned back",
      "Streak stats: final streak count for this goal",
      "Bonus earned (if any): streak bonus + challenge bonuses highlighted separately",
      "Certificate: 'View Achievement Certificate' (shareable digital certificate with goal, stats, date)",
      "Next steps: 'Create Next Goal' CTA / 'Join a Challenge' / 'Share Achievement'",
    ],
    [
      "Celebration plays on screen appear (auto, no tap needed)",
      "Certificate: generates a beautiful card image (portrait, shareable)",
      "Counter animations for all earned amounts",
      "Total earned counter: animates to final value (1s, ease-out)",
    ],
    [
      "Goal completed exactly (100%)", "Goal completed with bonus streak",
      "Goal completed as part of winning a challenge"
    ],
    [
      "This is the app's best moment — invest in the animation quality here above all screens",
      "Certificate is a social sharing tool — make it beautiful enough to post on LinkedIn/Instagram",
    ]
  ),

  ...screen("45", "Empty States (reusable across screens)",
    "Consistent, encouraging empty states when no data exists",
    [
      "Standard empty state structure: illustration (80px centered), title (--text-lg bold), subtitle (--text-base, text-secondary), CTA button",
      "No Goals: 'Start Your First Goal' — illustration: person at starting line",
      "No Challenges: 'Find Your First Challenge' — illustration: trophy with people around it",
      "No Transactions: 'Complete a task to earn your first ₹' — illustration: empty wallet opening",
      "No Friends: 'Invite Friends to Compete' — illustration: two people highfiving",
      "No Notifications: 'You're all caught up!' — illustration: checkmark in circle",
      "No Search Results: 'Nothing found for [search term]' — illustration: magnifying glass with question mark",
    ],
    [
      "CTA on each empty state navigates to the relevant creation/discovery flow",
    ],
    [
      "Empty state (default)"
    ],
    [
      "Empty states are marketing moments — they should inspire action, not just inform",
      "Illustrations should be consistent style across all empty states (same illustration library)",
      "Never show empty state while loading — use skeleton screens instead",
    ]
  ),

  ...screen("46", "Loading & Skeleton Screens",
    "Perceived performance — content placeholders during data fetch",
    [
      "Skeleton = gray shimmer blocks matching the exact shape of the real content",
      "Dashboard skeleton: shimmer blocks in positions of hero card, wallet card, goal list rows",
      "List skeleton: 5 shimmer rows (icon circle + 2 text lines each)",
      "Card skeleton: full card shape shimmer",
      "Shimmer animation: left-to-right sweep (--color-border to white to --color-border, 1.5s loop)",
      "Never use a centered spinner as the only loading state",
    ],
    [
      "After 8 seconds with no data: show 'Having trouble connecting...' with retry button",
      "After successful load: skeleton fades out (200ms) and real content fades in (200ms)",
    ],
    [
      "Loading (skeleton active)", "Error (connection failed)", "Timeout (retry state)"
    ],
    [
      "Skeleton screens must precisely match real content layout — measure actual content and match skeleton",
      "Error state after timeout must show a retry button — never a dead end",
    ]
  ),

  ...screen("47", "Onboarding Tooltips / Coach Marks",
    "First-time user feature discovery overlays",
    [
      "Spotlight: dark overlay with circular cutout highlighting the feature",
      "Tooltip bubble (radius: 16px, white, shadow Level 3): arrow pointing to feature, title (--text-md bold), description (--text-sm)",
      "Step indicator: dots (3–5 max per flow)",
      "Actions: 'Next' ghost button (right) + 'Skip Tour' link (top-right of screen)",
      "Flows: Dashboard tour (5 steps), GPS tracking (3 steps), Challenge join (4 steps)",
    ],
    [
      "Next: animates to next spotlight position (400ms, smooth spotlight movement)",
      "Skip: dismisses all tooltips, marks tour as complete in user settings",
      "Tap outside tooltip: advances to next (with subtitle 'Tap anywhere to continue')",
    ],
    [
      "First-time (tooltips visible)", "Tour completed (never shows again)"
    ],
    [
      "Coach marks only appear ONCE — mark shown flag in local storage",
      "Context-specific: GPS tracking coach marks appear on first activity start, not on install",
      "Max 5 steps per flow — any more and users skip",
    ]
  ),

  ...screen("48", "Error & Edge Case Screens",
    "App-level error handling — network, payment failures, and critical errors",
    [
      "Network Error: full-screen illustration (broken wifi symbol), 'No Connection' title, 'Retry' CTA, 'Continue Offline' option where applicable",
      "Payment Failed: centered modal, red X icon, 'Payment Failed' title, specific error reason (card declined / bank server error / insufficient funds), 'Try Again' CTA + 'Use Different Method'",
      "Verification Failed: yellow warning icon, reason (GPS accuracy too low / Photo unclear / Inconsistent data), appeal link, next steps",
      "Goal Expired (never started): informational card, stake returned, create new goal prompt",
      "App Update Required: full-screen with version info, 'Update Now' CTA to App Store/Play Store",
      "Account Suspended: reason (if violating ToS), contact support CTA",
    ],
    [
      "Network error retry: button spins while retrying, success = auto-dismisses",
      "Payment retry: opens payment method selector with error message inline",
      "All error screens: support chat link at bottom for human help",
    ],
    [
      "Each error type has its own state"
    ],
    [
      "Error messages must NEVER use technical jargon — use plain language",
      "Every error must have a clear next action — never a dead end",
      "Payment errors: never imply the user did something wrong — 'Something went wrong' not 'Your card failed'",
    ]
  ),
  sp(), sp(), pb()
];

// ─── PART B: CODING AGENT PROMPT ─────────────────────────────────────────────
const partB_header = [
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 100 },
    shading: { fill: C.dark, type: ShadingType.CLEAR },
    children: [run("   PART B — CODING AGENT PROMPT   ", { bold: true, color: C.white, size: 32 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 200 },
    shading: { fill: C.lightOrange, type: ShadingType.CLEAR },
    children: [run("  Use this prompt with Claude Code, Cursor, GitHub Copilot Workspace, Bolt.new, or any AI coding agent  ", { size: 20, italics: true })] }),
  sp(),
];

const partB = [
  h1("B1. System Context Prompt (Add to Agent System Prompt)"),
  box("COPY THIS ENTIRE BLOCK AS YOUR AGENT'S SYSTEM PROMPT", [
    "You are a senior full-stack engineer building FitStake — a production-grade React Native mobile app.",
    "FitStake is a fitness accountability platform where users stake real money on fitness goals,",
    "complete daily tasks to earn their money back, maintain streaks, join group challenges, and",
    "optionally subscribe to Streak Shield to protect broken streaks.",
    "",
    "TECH STACK (never deviate without asking):",
    "  Frontend: React Native (Expo SDK 52, TypeScript strict mode)",
    "  Navigation: Expo Router (file-based routing)",
    "  State Management: Zustand + React Query (TanStack Query v5)",
    "  Styling: NativeWind v4 (Tailwind for React Native)",
    "  Animations: React Native Reanimated v3 + Moti",
    "  Maps: react-native-maps (Google Maps provider)",
    "  GPS: expo-location with background tracking",
    "  Charts: Victory Native XL",
    "  Payments: react-native-razorpay (India) / Stripe React Native SDK (International)",
    "  Push Notifications: Expo Notifications + Firebase Cloud Messaging",
    "  Auth: Supabase Auth (email + Google + Apple) + expo-local-authentication (biometrics)",
    "  Database: Supabase (PostgreSQL) with Row Level Security",
    "  Storage: Supabase Storage (photos, route data)",
    "  Real-time: Supabase Realtime (leaderboard updates, challenge chat)",
    "  Analytics: PostHog (open-source, self-hostable)",
    "",
    "CODE STANDARDS:",
    "  - TypeScript strict: no `any`, explicit return types on all functions",
    "  - Components: functional only, no class components",
    "  - File naming: PascalCase for components, camelCase for utilities/hooks",
    "  - One component per file; max 200 lines per file — split if larger",
    "  - Custom hooks for all data-fetching logic (useGoals, useWallet, useChallenge)",
    "  - Error boundaries on all screen-level components",
    "  - All API calls through React Query (no raw fetch/axios in components)",
    "  - Optimistic UI updates on all user actions (task complete, wallet update)",
    "  - Accessibility: all touchable elements min 44x44px, ARIA labels on icons",
    "  - i18n ready: all user-visible strings through i18next (en + hi support day 1)",
  ], C.dark, C.lightBlue),
  sp(), sp(),

  h1("B2. Full Project Scaffold Prompt"),
  box("PROJECT INITIALIZATION PROMPT", [
    "Generate the complete folder structure and boilerplate for the FitStake React Native app.",
    "",
    "Create the following directory structure:",
    "app/                          — Expo Router screens",
    "  (auth)/                     — Auth group (splash, welcome, login, signup, otp, onboarding)",
    "  (tabs)/                     — Main tab group (home, goals, challenges, leaderboard, profile)",
    "  goal/[id]/                  — Goal detail dynamic route",
    "  challenge/[id]/             — Challenge detail dynamic route",
    "  tracking/[goalId]/          — GPS tracking screen",
    "  wallet/                     — Wallet screens group",
    "  subscription/               — Shield subscription screens",
    "  settings/                   — Settings screens group",
    "components/                   — Reusable components",
    "  ui/                         — Base UI: Button, Card, Input, Badge, Avatar, Toast",
    "  goals/                      — GoalCard, GoalProgress, TaskStatus, HeatmapCalendar",
    "  challenges/                 — ChallengeCard, Leaderboard, PrizeDistribution, GroupChat",
    "  wallet/                     — WalletCard, TransactionRow, MoneyInput, WithdrawForm",
    "  tracking/                   — MapView, StatsOverlay, ActivitySummary",
    "  streak/                     — StreakCounter, StreakHeatmap, ShieldStatus",
    "  charts/                     — EarningsChart, ProgressRing, BarChart, LineChart",
    "hooks/                        — Custom React hooks",
    "  useGoals.ts / useWallet.ts / useChallenges.ts / useStreak.ts",
    "  useLocation.ts / useNotifications.ts / useAuth.ts",
    "stores/                       — Zustand stores",
    "  authStore.ts / walletStore.ts / goalStore.ts / challengeStore.ts / uiStore.ts",
    "services/                     — API service layer",
    "  supabase.ts / goals.ts / challenges.ts / wallet.ts / verification.ts / payments.ts",
    "lib/                          — Utilities",
    "  formatCurrency.ts / formatDate.ts / calculateEarnback.ts / gpsUtils.ts",
    "constants/                    — Design tokens, routes, config",
    "  colors.ts / typography.ts / spacing.ts / routes.ts",
    "types/                        — TypeScript interfaces",
    "  Goal.ts / Challenge.ts / User.ts / Transaction.ts / Streak.ts",
    "",
    "For each file, generate: imports, TypeScript interfaces, component/function skeleton,",
    "JSDoc comments, and TODO comments for implementation details.",
    "Include package.json with all dependencies pinned to latest stable versions.",
    "Include tsconfig.json, app.json (Expo config), and .env.example.",
  ], C.dark, C.lightPurple),
  sp(), sp(),

  h1("B3. Screen Implementation Prompts"),
  p("Use each prompt below for implementing individual screens. Pass the system context from B1 with each."),
  sp(),

  h2("Auth Screens"),
  box("PROMPT: Implement Auth Screens (splash, welcome, login, signup, OTP)", [
    "Implement all authentication screens for FitStake. Requirements:",
    "",
    "SPLASH SCREEN (app/(auth)/index.tsx):",
    "  - Lottie animation: coin morphing into running figure (use LottieView from lottie-react-native)",
    "  - Check auth session on mount using Supabase; auto-navigate based on session state",
    "  - Use Zustand authStore to persist session",
    "",
    "WELCOME SCREEN (app/(auth)/welcome.tsx):",
    "  - 3-slide Pager with react-native-pager-view",
    "  - Auto-advance with setInterval (pause on manual swipe gesture)",
    "  - Custom animated dot indicator (active dot = pill, inactive = circle using Reanimated)",
    "  - Assets: placeholder SVG illustrations (describe what each should contain in comments)",
    "",
    "SIGNUP SCREEN (app/(auth)/signup.tsx):",
    "  - Form with react-hook-form + zod validation schema",
    "  - Password strength: zxcvbn library for strength calculation",
    "  - Real-time phone formatting: libphonenumber-js",
    "  - Country picker bottom sheet: react-native-country-picker-modal",
    "  - Google Sign-in: expo-auth-session with Google OAuth",
    "  - Apple Sign-in: expo-apple-authentication (iOS only)",
    "",
    "OTP SCREEN (app/(auth)/otp.tsx):",
    "  - 6 individual TextInput refs managed with useRef array",
    "  - Auto-advance on input, backspace goes back",
    "  - SMS OTP auto-read: react-native-otp-textinput",
    "  - Resend timer: useCountdown hook",
    "",
    "LOGIN SCREEN (app/(auth)/login.tsx):",
    "  - Biometric auth: expo-local-authentication (check availability first)",
    "  - Supabase signInWithPassword",
    "  - Forgot password: navigate to /forgot-password with email pre-filled",
    "",
    "All screens: KeyboardAvoidingView wrapper, SafeAreaView, consistent error handling,",
    "loading states, haptic feedback on success (expo-haptics), proper accessibility labels.",
  ], C.accent, C.lightOrange),
  sp(),

  box("PROMPT: Implement Home Dashboard", [
    "Implement the Home Dashboard screen (app/(tabs)/index.tsx). Requirements:",
    "",
    "DATA: Use React Query to fetch in parallel:",
    "  - useQuery(['todayTask', userId]) → today's active goal task status",
    "  - useQuery(['walletBalance', userId]) → wallet summary",
    "  - useQuery(['activeGoals', userId]) → list of active goals",
    "  - useQuery(['activeChallenges', userId]) → active challenge list",
    "  - useQuery(['recentActivity', userId]) → last 5 transactions",
    "",
    "LAYOUT: ScrollView (not FlatList — mixed content types):",
    "  1. Top Bar: greeting + notification bell (badge count from Zustand) + wallet balance",
    "  2. Today's Task Hero Card: animated card, gradient background, CTA",
    "     - Variant states: pending / completed / missed / grace-window (change bg color)",
    "  3. Streak Widget: use StreakCounter component, flame Lottie animation",
    "  4. Wallet Summary: WalletCard component with animated balance counter",
    "  5. Active Goals: horizontal FlatList with GoalCard component",
    "  6. Active Challenges: horizontal FlatList with ChallengeCard component",
    "  7. Quick Actions: 4-icon grid (react-native-vector-icons, SF Symbols on iOS)",
    "  8. Recent Activity: last 5 TransactionRow components",
    "",
    "INTERACTIONS:",
    "  - Pull-to-refresh: RefreshControl with brand color",
    "  - Today's task 'Start Task' CTA: navigate to /tracking/[goalId]",
    "  - Skeleton loading: @shopify/flash-list compatible skeleton components",
    "",
    "REAL-TIME: Subscribe to Supabase Realtime channel 'wallet:[userId]' for balance updates.",
    "On wallet update event: update React Query cache + animated counter from old to new value.",
    "",
    "PERFORMANCE: All images lazy-loaded, FlatList with getItemLayout for goal/challenge lists,",
    "memoize GoalCard and ChallengeCard with React.memo.",
  ], C.brand, C.lightBlue),
  sp(),

  box("PROMPT: Implement GPS Activity Tracking", [
    "Implement the GPS tracking screen (app/tracking/[goalId].tsx). This is safety-critical.",
    "",
    "LOCATION TRACKING:",
    "  - Request background location permission (expo-location) before starting",
    "  - Use Location.watchPositionAsync with accuracy: Location.Accuracy.BestForNavigation",
    "  - Apply Kalman filter to GPS coordinates (implement kalman.ts utility)",
    "  - Store route as array of {lat, lng, timestamp, speed, accuracy} in Zustand",
    "  - Background tracking: expo-task-manager for when app is backgrounded",
    "",
    "MAP:",
    "  - react-native-maps with Google Maps provider",
    "  - Polyline for route (strokeColor: brand color, strokeWidth: 4)",
    "  - Animated user marker (pulsing circle using Reanimated)",
    "  - Map follows user position (animateToRegion every 5s)",
    "",
    "STATS OVERLAY (Reanimated Animated.View, positioned absolutely over map):",
    "  - Primary: distance (useSharedValue, updates every second)",
    "  - Secondary: pace, duration (useTimer hook), calories (MET calculation)",
    "  - Goal progress bar: currentDistance / goalDistance",
    "",
    "GOAL COMPLETION:",
    "  - When distance >= goalDistance: trigger celebration (haptics + camera flash animation + sound)",
    "  - Auto-prompt finish but allow user to continue further",
    "",
    "FINISH FLOW:",
    "  1. Summarize activity data",
    "  2. POST to /api/verification with route data, goal ID, timestamp",
    "  3. Navigate to /tracking/result with verification response",
    "",
    "ANTI-SPOOFING CHECKS (client-side, final check server-side):",
    "  - Validate no position jumps > 10m/s (running speed limit)",
    "  - Check accuracy values: reject readings with accuracy > 50m",
    "  - Minimum number of GPS points for claimed distance",
    "",
    "BATTERY: Implement power-saving mode after 30 min (reduce GPS update frequency to 10s).",
    "LOCK SCREEN: expo-keep-awake to prevent screen sleep during tracking.",
  ], C.green, C.lightGreen),
  sp(),

  box("PROMPT: Implement Wallet & Payments", [
    "Implement the complete wallet feature (app/wallet/).",
    "",
    "WALLET SCREEN (app/wallet/index.tsx):",
    "  - Animated balance card: 3D tilt using react-native-gesture-handler + Reanimated",
    "  - Balance breakdown: Available / Escrow / Earned / Forfeited",
    "  - Transaction FlatList with infinite scroll (React Query useInfiniteQuery)",
    "  - Real-time balance updates via Supabase Realtime",
    "",
    "ADD MONEY (app/wallet/topup.tsx):",
    "  - MoneyInput component: large DM Mono input, currency prefix, formatted with commas",
    "  - Quick amount chips: Animated.View spring animation on select",
    "  - Razorpay integration (India): RazorpayCheckout.open() with order_id from backend",
    "  - Stripe integration (International): PaymentSheet from @stripe/stripe-react-native",
    "  - Backend: POST /api/wallet/create-order → returns gateway order_id",
    "  - On payment success: verify on backend → update wallet via Supabase → refetch balance",
    "",
    "WITHDRAWAL (app/wallet/withdraw.tsx):",
    "  - Validate amount <= available balance (real-time)",
    "  - Bank account management: IFSC lookup API for bank name auto-fill",
    "  - Backend: POST /api/wallet/withdraw → initiates bank transfer via Razorpay Payout API",
    "  - Receipt screen: show reference number, expected date, downloadable PDF receipt",
    "",
    "STAKING FLOW (called from goal creation):",
    "  - Check wallet balance before allowing goal/challenge creation",
    "  - If insufficient: show bottom sheet with top-up option",
    "  - On stake: POST /api/wallet/stake → escrow transfer + goal creation atomically (database transaction)",
    "",
    "SUPABASE SCHEMA:",
    "  wallets(id, user_id, available_balance, escrow_balance, created_at)",
    "  transactions(id, user_id, goal_id, challenge_id, type, amount, status, verification_id, created_at)",
    "  wallet_events(id, user_id, event_type, amount, metadata, created_at)",
    "",
    "SECURITY: All balance mutations go through backend (never direct Supabase client writes to wallets).",
    "Implement idempotency keys on all payment mutations to prevent double-charges.",
  ], C.purple, C.lightPurple),
  sp(),

  box("PROMPT: Implement Group Challenges", [
    "Implement the full group challenges feature.",
    "",
    "DISCOVERY SCREEN (app/(tabs)/challenges.tsx):",
    "  - Fetch challenges with React Query + filter parameters",
    "  - FlashList (@shopify/flash-list) for performance with 500+ challenges",
    "  - Filter state in URL search params (Expo Router useLocalSearchParams)",
    "  - Featured challenges: horizontal ScrollView with large cards",
    "",
    "CHALLENGE DETAIL (app/challenge/[id].tsx):",
    "  - Parallel fetch: challenge details + current leaderboard + participant list",
    "  - Distribution model explainer: animated worked example using Reanimated",
    "  - Join flow: payment confirmation bottom sheet (react-native-bottom-sheet by Gorhom)",
    "  - Deep-link share: expo-sharing + expo-linking for challenge invite links",
    "",
    "ACTIVE CHALLENGE (app/challenge/[id]/active.tsx):",
    "  - Real-time leaderboard via Supabase Realtime ('challenge:[id]:leaderboard')",
    "  - Leaderboard updates: animated row reordering using Reanimated Layout animations",
    "  - Rank change indicator: ▲▼ arrows with green/red color, disappear after 5s",
    "  - Your row sticky: SectionList with your entry in a sticky section at bottom",
    "",
    "GROUP CHAT (app/challenge/[id]/chat.tsx):",
    "  - Supabase Realtime subscription for messages",
    "  - Optimistic message send (add to cache immediately, confirm on server ACK)",
    "  - FlatList inverted for chat (latest message at bottom)",
    "  - System messages: centered pill style (different from user bubbles)",
    "  - Sticker support: custom sticker keyboard (replace default keyboard)",
    "",
    "PRIZE DISTRIBUTION ENGINE (services/distribution.ts):",
    "  Implement all 3 models as pure TypeScript functions with full test coverage:",
    "  - calculateProportional(participants: ParticipantResult[]): DistributionResult",
    "  - calculateWinnerTakesMost(participants: ParticipantResult[]): DistributionResult",
    "  - calculateAllOrNothing(participants: ParticipantResult[]): DistributionResult",
    "  Each function: pure, deterministic, handles edge cases (ties, all complete, none complete).",
    "",
    "CHALLENGE CREATION WIZARD (app/challenge/create.tsx):",
    "  - 4-step wizard using react-hook-form with FormProvider across steps",
    "  - Persist draft in AsyncStorage (users may abandon and return)",
    "  - Cover image: expo-image-picker + expo-image-manipulator for crop",
  ], C.accent, C.lightOrange),
  sp(),

  box("PROMPT: Implement Streak System & Shield Subscription", [
    "Implement the streak tracking and Shield subscription features.",
    "",
    "STREAK STORE (stores/streakStore.ts, Zustand):",
    "  interface StreakState { currentStreak: number; bestStreak: number; streakType: string;",
    "    lastCompletedDate: string; shieldStatus: ShieldStatus; restoresRemaining: number }",
    "  Actions: incrementStreak, breakStreak (check for shield first), useShieldRestore",
    "",
    "STREAK DETAIL SCREEN (app/streak.tsx):",
    "  - Heatmap calendar: custom component using react-native-calendars + custom day renderer",
    "  - Heatmap colors: 5-level intensity (no data/0%/25%/75%/100%), interpolated HSL",
    "  - Milestone badges: animate in sequentially on screen mount",
    "",
    "STREAK BROKEN FLOW:",
    "  1. App foreground event (AppState.addEventListener) checks if yesterday was missed",
    "  2. If missed and shield available: show ShieldRestoreModal (Screen 33)",
    "  3. If no shield: show StreakBrokenScreen (Screen 43)",
    "  4. StreakBrokenScreen: Lottie broken flame animation, empathetic copy",
    "  5. Never show on first app open of the day if task still pending",
    "",
    "SHIELD SUBSCRIPTION:",
    "  Plans screen (app/subscription/index.tsx):",
    "    - Monthly/Annual price toggle: Animated.timing on price number change",
    "    - Plan cards: Reanimated scale animation on select (spring, scale 1.0→1.02)",
    "    - In-app purchases: expo-in-app-purchases for iOS (RevenueCat SDK recommended for cross-platform)",
    "    - RevenueCat: handles both App Store (iOS) and Play Store (Android) subscriptions",
    "    - Sync subscription status with Supabase on app foreground",
    "",
    "  Restore confirmation modal (component StreakRestoreModal.tsx):",
    "    - Bottom sheet (Gorhom), animated shield icon (Lottie)",
    "    - Confirm: update streak in Supabase, decrement restores, haptic success",
    "    - 'Let It Break': double-confirm dialog, haptic warning",
    "",
    "SUBSCRIPTION WEBHOOKS (backend):",
    "  - RevenueCat webhook → verify → update users.subscription_tier in Supabase",
    "  - Handle: initial purchase, renewal, cancellation, grace period, expiration",
  ], C.purple, C.lightPurple),
  sp(),

  box("PROMPT: Implement Verification Engine", [
    "Implement the task verification system (services/verification.ts + backend).",
    "",
    "CLIENT-SIDE (React Native):",
    "",
    "GPS Verification:",
    "  - POST /api/verify/gps with: { goalId, routePoints: [{lat,lng,timestamp,speed,accuracy}],",
    "    totalDistance, duration, startTime, endTime }",
    "  - routePoints: compress with Ramer-Douglas-Peucker algorithm before sending",
    "    (reduces 1000 points to ~50 without perceptible route quality loss)",
    "",
    "Photo Verification:",
    "  - expo-camera for capture, expo-image-manipulator to resize to 1024px max",
    "  - Extract EXIF: exifr library (timestamp, GPS coordinates)",
    "  - POST /api/verify/photo with: { goalId, imageBase64, exifData, timestamp }",
    "",
    "Wearable Sync:",
    "  - Apple HealthKit: react-native-health — query HKWorkoutType for activity type + distance",
    "  - Google Fit: react-native-google-fit — query activities for date range",
    "  - Match workout to goal: find workout within ±2h of goal's scheduled window",
    "",
    "SERVER-SIDE (Supabase Edge Functions, Deno/TypeScript):",
    "",
    "GPS Verification Function (functions/verify-gps/index.ts):",
    "  1. Validate route data integrity (point count, timestamps sequential)",
    "  2. Recalculate distance server-side using Haversine formula (don't trust client distance)",
    "  3. Check anti-spoofing: max speed (12 m/s for running), min accuracy, GPS continuity",
    "  4. Check distance meets goal requirement",
    "  5. Return: { verified: boolean, calculatedDistance: number, reason?: string }",
    "",
    "Photo Verification Function (functions/verify-photo/index.ts):",
    "  1. Call AWS Rekognition DetectLabels API",
    "  2. Check for relevant labels: gym/fitness equipment, outdoor activity, sports",
    "  3. Validate EXIF timestamp within goal's completion window",
    "  4. Validate EXIF GPS (if present) is plausible for the activity",
    "  5. Return verification result with confidence score",
    "",
    "Earnback Crediting (functions/credit-earnback/index.ts):",
    "  1. Triggered after successful verification",
    "  2. Calculate earnback amount (stake/duration ± bonuses)",
    "  3. Atomic DB transaction: insert transaction record + update wallet available_balance",
    "  4. Check streak milestone (7/30/60/100): if hit, apply bonus + insert achievement",
    "  5. Trigger push notification via FCM",
    "  6. Emit Supabase Realtime event to 'wallet:[userId]' channel",
  ], C.green, C.lightGreen),
  sp(),

  box("PROMPT: Backend Database Schema & API", [
    "Implement the complete Supabase schema and API layer.",
    "",
    "SUPABASE TABLES (PostgreSQL, with RLS policies):",
    "",
    "users: id, email, phone, name, username, avatar_url, bio, location,",
    "  fitness_level, subscription_tier, fitcoins, created_at, updated_at",
    "",
    "wallets: id, user_id (unique), available_balance (numeric), escrow_balance (numeric),",
    "  total_earned, total_forfeited, updated_at",
    "",
    "goals: id, user_id, activity_type, task_description, target_value, target_unit,",
    "  duration_days, start_date, end_date, stake_amount, daily_earnback, verification_method,",
    "  status (active/completed/abandoned), current_streak, best_streak, created_at",
    "",
    "daily_tasks: id, goal_id, user_id, task_date, status (pending/completed/missed/shielded),",
    "  verification_id, earned_amount, completed_at",
    "",
    "verifications: id, goal_id, user_id, type (gps/photo/wearable/manual),",
    "  status (pending/passed/failed/disputed), route_data (jsonb), photo_url,",
    "  distance_verified, confidence_score, created_at",
    "",
    "streaks: id, user_id, goal_id, current_streak, best_streak, last_activity_date,",
    "  shield_restores_used, shield_restores_limit, updated_at",
    "",
    "challenges: id, creator_id, name, activity_type, challenge_type, prize_model,",
    "  entry_stake, duration_days, start_date, end_date, max_participants,",
    "  current_participants, prize_pool, status (upcoming/active/completed), created_at",
    "",
    "challenge_participants: id, challenge_id, user_id, joined_at, stake_paid,",
    "  completion_percentage, final_rank, earned_amount",
    "",
    "transactions: id, user_id, type (earnback/forfeit/stake/unstake/challenge_prize/",
    "  withdrawal/deposit/streak_bonus), amount, reference_id, goal_id, challenge_id,",
    "  status (completed/pending/failed), created_at",
    "",
    "achievements: id, user_id, badge_type, earned_at, goal_id, challenge_id",
    "",
    "RLS POLICIES:",
    "  - Users can only read/write their own data (auth.uid() = user_id)",
    "  - Challenge participants can read all participants of challenges they joined",
    "  - Public profiles visible to all authenticated users",
    "  - Wallet mutations only via service role (backend functions, not client)",
    "",
    "INDEXES:",
    "  - goals(user_id, status) for active goals query",
    "  - daily_tasks(goal_id, task_date) for today's tasks",
    "  - transactions(user_id, created_at DESC) for activity feed",
    "  - challenge_participants(challenge_id, completion_percentage DESC) for leaderboard",
    "",
    "EDGE FUNCTIONS:",
    "  POST /api/goals/create — validate + create goal + stake escrow (atomic transaction)",
    "  POST /api/verify/gps — GPS verification + earnback crediting",
    "  POST /api/verify/photo — photo verification",
    "  POST /api/challenges/join — join challenge + stake payment",
    "  POST /api/challenges/distribute — end-of-challenge prize distribution",
    "  POST /api/wallet/topup — payment gateway webhook handler",
    "  POST /api/wallet/withdraw — initiate bank withdrawal",
    "  POST /api/streak/restore — consume shield restore",
    "  GET  /api/leaderboard — global/friends leaderboard with pagination",
  ], C.brand, C.lightBlue),
  sp(),

  box("PROMPT: Implement Notifications System", [
    "Implement the full push notification system.",
    "",
    "CLIENT SETUP (app/_layout.tsx on app init):",
    "  1. Request notification permissions: Notifications.requestPermissionsAsync()",
    "  2. Get push token: Notifications.getExpoPushTokenAsync({ projectId })",
    "  3. Save token to Supabase: upsert into user_push_tokens table",
    "  4. Register notification handler: Notifications.addNotificationResponseReceivedListener",
    "  5. Deep-link routing: parse notification data.screen + data.params → Expo Router push",
    "",
    "NOTIFICATION TYPES & DEEP LINKS:",
    "  task_reminder → /(tabs)/index (highlight today's task)",
    "  task_completed → /(tabs)/index (show earned amount)",
    "  task_missed → /(tabs)/goals/[id] (show missed state)",
    "  streak_at_risk → /streak (show restore option)",
    "  streak_broken → /streak (show broken state)",
    "  streak_milestone → /streak (show celebration)",
    "  challenge_update → /challenge/[id]/active",
    "  challenge_results → /challenge/[id]/results",
    "  wallet_credited → /(tabs)/wallet",
    "  withdrawal_processed → /wallet/withdraw/receipt",
    "",
    "SCHEDULING (Supabase Edge Function + pg_cron):",
    "  - Daily task reminder: 8:00 AM user's timezone — check if task not yet done",
    "  - Grace window warning: 10:00 PM — if task still pending",
    "  - Streak at risk: midnight + 10 min — if missed day detected",
    "  - Challenge updates: every 6 hours during active challenge",
    "  - Weekly summary: Sunday 7 PM (email + push)",
    "",
    "NOTIFICATION PREFERENCES (Zustand + Supabase sync):",
    "  interface NotificationPreferences {",
    "    taskReminders: boolean; streakAlerts: boolean; challengeUpdates: boolean;",
    "    walletUpdates: boolean; marketing: boolean; reminderTime: string }",
    "  Store locally, sync to Supabase users.notification_preferences (jsonb)",
    "",
    "BADGES: Update app icon badge count = unread notifications count",
    "  iOS: Notifications.setBadgeCountAsync(count)",
    "  Android: handled by FCM channel configuration",
  ], C.accent, C.lightOrange),
  sp(),

  h1("B4. Testing & Quality Prompts"),
  box("PROMPT: Generate Test Suite", [
    "Generate comprehensive tests for FitStake. Tech: Jest + React Native Testing Library + Maestro (E2E).",
    "",
    "UNIT TESTS (Jest):",
    "  - services/distribution.ts: test all 3 prize distribution models with edge cases",
    "    (all complete, none complete, ties, single participant, max participants)",
    "  - lib/calculateEarnback.ts: streak bonus calculations, partial day handling",
    "  - lib/gpsUtils.ts: Haversine distance, Kalman filter, anti-spoofing detection",
    "  - stores/: Zustand store actions and state transitions",
    "",
    "INTEGRATION TESTS (React Native Testing Library):",
    "  - GoalCreationWizard: complete 4-step flow, validation errors, insufficient balance",
    "  - WalletTopUp: payment success, payment failure, retry flow",
    "  - StreakRestoreModal: confirm restore, let it break, no restores left state",
    "  - ChallengeJoin: join flow, prize model explainer, already joined state",
    "",
    "E2E TESTS (Maestro, flows/*.yaml):",
    "  - happy_path_goal.yaml: signup → create goal → complete task → verify earnings",
    "  - challenge_flow.yaml: discover challenge → join → complete tasks → view results",
    "  - shield_restore.yaml: create goal → miss task → restore streak",
    "  - wallet_flow.yaml: top up wallet → create goal → earn back → withdraw",
    "",
    "COVERAGE TARGET: 80% unit/integration, 5 critical E2E flows.",
    "CI: GitHub Actions workflow running jest on PR, Maestro on merge to main.",
  ], C.dark, C.lightBlue),
  sp(),

  box("PROMPT: Performance Optimization", [
    "Review and optimize FitStake for production performance targets.",
    "",
    "TARGETS:",
    "  - App cold start: < 2 seconds to interactive (TTI)",
    "  - Dashboard load: < 1.5 seconds (with cached data)",
    "  - GPS tracking: < 100ms location update latency",
    "  - Leaderboard real-time update: < 500ms from event to UI",
    "  - JS bundle size: < 3MB (Hermes bytecode)",
    "",
    "OPTIMIZATION CHECKLIST:",
    "  Bundle: enable Hermes, enable Metro tree-shaking, analyze bundle with expo-bundle-analyzer",
    "  Images: use expo-image (not Image from RN), WebP format, CDN delivery via CloudFront",
    "  Lists: FlashList everywhere (not FlatList), getItemLayout for fixed-height rows",
    "  Memoization: React.memo on GoalCard, ChallengeCard, TransactionRow, LeaderboardRow",
    "  Re-renders: useCallback on all event handlers passed as props, useMemo for selectors",
    "  Animations: all on UI thread using Reanimated (never use RN Animated)",
    "  Network: React Query staleTime/cacheTime tuning, background refetch on focus",
    "  Startup: defer non-critical initialization (analytics, chat) to after first paint",
    "  SQLite: expo-sqlite for offline caching of goals and pending tasks",
    "",
    "MONITORING:",
    "  - Sentry React Native for crash reporting and performance tracing",
    "  - PostHog for product analytics (funnel analysis, feature flags)",
    "  - Custom performance marks: measure TTI, dashboard load, tracking screen start",
  ], C.green, C.lightGreen),
  sp(),

  h1("B5. Deployment & DevOps Prompt"),
  box("PROMPT: Production Deployment Setup", [
    "Set up the complete CI/CD and deployment pipeline for FitStake.",
    "",
    "EXPO EAS BUILD:",
    "  eas.json: configure 3 profiles: development (dev client), preview (internal), production",
    "  production profile: auto-submit to App Store + Play Store",
    "  Environment variables: use EAS secrets (never commit API keys)",
    "",
    "CI/CD (GitHub Actions):",
    "  .github/workflows/pr-checks.yml:",
    "    - TypeScript typecheck (tsc --noEmit)",
    "    - ESLint (eslint + prettier check)",
    "    - Jest unit tests with coverage report",
    "    - Comment coverage summary on PR",
    "  .github/workflows/preview-build.yml (on merge to develop):",
    "    - EAS build preview profile",
    "    - Post QR code to Slack channel for testing",
    "  .github/workflows/production-release.yml (on tag v*):",
    "    - EAS build production + submit to stores",
    "    - Create GitHub release with changelog",
    "",
    "SUPABASE:",
    "  supabase/migrations/: all schema changes as numbered migration files",
    "  supabase/seed.sql: test data for development",
    "  GitHub Action: supabase db push on merge to main",
    "",
    "FEATURE FLAGS (PostHog):",
    "  Use feature flags for: new verification methods, new challenge types, A/B tests on payout UI",
    "  Flag check in code: useFeatureFlag('gps-anti-spoof-v2') from posthog-react-native",
    "",
    "MONITORING:",
    "  Sentry DSN configured per environment (development/production)",
    "  Custom Sentry transaction for: goal creation, task verification, payment processing",
    "  Alert rules: error rate > 1% on verification endpoint, payment failure rate > 0.5%",
  ], C.dark, C.lightPurple),
  sp(), sp(),

  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 80 },
    shading: { fill: C.brand, type: ShadingType.CLEAR },
    children: [run("  END OF DOCUMENT — FitStake UI/UX + Coding Agent Prompt Pack v1.0  ", { bold: true, color: C.white, size: 24 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 200 },
    shading: { fill: C.lightBlue, type: ShadingType.CLEAR },
    children: [run("  48 Screens Documented  •  10 Agent Prompts  •  Production-Ready  •  fitstake.app  ", { size: 20, italics: true, color: C.brand })] }),
];

// ═════════════════════════════════════════════════════════════════════════════
// BUILD DOC
// ═════════════════════════════════════════════════════════════════════════════
const allContent = [
  ...cover,
  ...partA_header, ...a1, ...a2,
  ...a3_header,
  ...flow1, ...flow2, ...flow3, ...flow4, ...flow5, ...flow6, ...flow7, ...flow8,
  ...partB_header, ...partB
];

const doc = new Document({
  numbering: {
    config: [
      { reference: "bullets", levels: [
        { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
        { level: 1, format: LevelFormat.BULLET, text: "◦", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 1080, hanging: 360 } } } },
      ]},
    ]
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 40, bold: true, font: "Arial", color: C.brand },
        paragraph: { spacing: { before: 480, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 30, bold: true, font: "Arial", color: C.dark },
        paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: C.accent },
        paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 2 } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 }
      }
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.midGray, space: 6 } },
          children: [
            new TextRun({ text: "FitStake  |  UI/UX & Coding Agent Prompt Pack v1.0  |  Page ", font: "Arial", size: 18, color: "888888" }),
            new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 18, color: "888888" }),
          ]
        })]
      })
    },
    children: allContent
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('/mnt/user-data/outputs/FitStake_UIUXDesign_CodingPrompts_v1.0.docx', buf);
  console.log('Done');
});