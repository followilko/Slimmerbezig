# Design system (Slimmerbezig)

Living rules for UI — especially **post cards** and anything that shares their chrome. Update this file when tokens, grid rules, or brand-registry decisions change; link ADRs in [decisions.md](decisions.md) for product/schema choices.

**Status:** Card v2 implemented. Wireframes: Jun 2026.

---

## Where to configure tools (post brands)

| What | Where |
|------|--------|
| **Colors** (primary pill + secondary card bg) | [`lib/brands/manifest.ts`](../lib/brands/manifest.ts) — text colors auto-derived via [`lib/brands/contrast.ts`](../lib/brands/contrast.ts) (optional `on*` overrides) |
| **Logo files** | Supabase Storage bucket **`brand-assets`**, path `{slug}/logo.svg` (see `logoPath` in manifest) |
| **Local fallback** (if Storage empty) | [`public/brands/{slug}/logo.svg`](../public/brands/) — same slug as manifest |
| **SQL bucket** | [`supabase/10_brand_assets_storage.sql`](../supabase/10_brand_assets_storage.sql) |

After adding a slug: extend `ToolSlug` in [`lib/dummy/posts.ts`](../lib/dummy/posts.ts), upload logo, run seed/migrations as needed.

---

## Locked product decisions

| Topic | Decision |
|-------|----------|
| Brand variants | **One layout per tool** — single `primary` + `secondary` (+ contrast tokens). No dark/light theme per brand. |
| Color roles | **`primary`** = category pill. **`secondary`** = card body (mostly dark). **`on*`** text = auto light/dark via WCAG contrast pick unless overridden in manifest. |
| Logos | **Supabase Storage from day one** (`brand-assets` bucket or equivalent). Curator UI later; initial tools seeded via script/manual upload. |
| Headline logo box | **Fixed chrome** for every tool: **`2rem × 2rem`** box, **`0.5rem`** border-radius, `object-fit: contain` — assets vary inside the box, dimensions do not. |
| Peer social proof | **Outside the card** — floats underneath the rounded card box (not in wireframe mock). Still rendered in feed. |
| Rewards (dock) | **Dummy total** until ledger exists (reuse TS metrics / placeholder). |
| Typography | **Inter Tight** for the **whole app** (replaces Geist in root layout). |

---

## App header chrome

The sticky top bar ([`components/shell/app-header.tsx`](../components/shell/app-header.tsx)) uses a **five-layer progressive blur** (Osmo Supply pattern) instead of a single `backdrop-blur` + tint.

| What | Where |
|------|--------|
| Markup | [`components/shell/progressive-blur.tsx`](../components/shell/progressive-blur.tsx) — five `progressive-blur__layer` divs (`is--1` … `is--5`) |
| Styles | [`app/progressive-blur.css`](../app/progressive-blur.css) — imported from `globals.css` |
| Fade zone | **`12em`** tall, anchored to the top of the header; blur strongest under the nav, fading downward into page content |
| Tint | **None** — pure progressive blur; page shell background stays `bg-zinc-50` on [`app/(app)/layout.tsx`](../app/(app)/layout.tsx) |
| Nav pills | Opaque white (`primary-nav`, `secondary-menu`) — unchanged |

Do not rename BEM classes (`progressive-blur`, `progressive-blur__layer`, `is--N`); masks and blur radii are tuned as a set.

---

## Typography

| Role | Font | Notes |
|------|------|--------|
| UI (global) | **Inter Tight** (`next/font/google`) | Set `--font-sans` in root `layout.tsx`; drop Geist except optional mono for code. |
| Letter-spacing | **2.5%** (`0.025em` on `html`) | Inherits everywhere; opt out per element with `tracking-normal` / `letter-spacing: 0` when needed. |
| Scale (8px grid) | **8 / 12 / 16 / 24 / 48** px | Expressed as **`rem`** from 16px root (see Units). |

| Token | Weight | Typical use |
|-------|--------|-------------|
| `regular` | 400 | Intro body, metadata |
| `medium` | 500 | Badges, counts, dock labels |
| `semibold` | 600 | Title, author name |
| `bold` | 700 | Rare emphasis |

**Contrast:** tune **`onSecondary`** (title, intro, meta on card bg) and **`onPrimary`** (pill text) per slug at registry time — hand-tuned for MVP, no runtime theme switching.

---

## Units & radius

- **Root:** `html { font-size: 16px; }` → `1rem = 16px`.
- **8px grid:** spacing/padding **8, 16, 24, 32** only; half-step **4** for optical icon alignment — never 10, 14, 20, etc.
- **Card shell:** outer radius **`2rem`** (32px).
- **Dock:** inner white tray **`rounded-full`** (pill); inset **`1rem`** from card edges.
- **Headline logo:** **`2rem`** square, **`0.5rem`** radius (fixed; not per-brand).
- Prefer **`rem`** on cards; local **`em`** only inside components that change their own font-size.

---

## Color (cards)

Each post resolves a **tool slug** (`#BRAND-ID`). Registry exposes exactly two brand surfaces + text pairs:

| Token | Role |
|-------|------|
| `--post-brand-primary` | Post-type / category pill background |
| `--post-brand-on-primary` | Pill text + icon |
| `--post-brand-secondary` | **Card body** background |
| `--post-brand-on-secondary` | Title, intro on card body |
| `--post-brand-on-secondary-muted` | Metadata, dividers |
| `--post-dock-bg` | Dock tray — always white |
| `--post-dock-fg` | Dock icons and counts |

**Fallback slug** (`unknown` / null tool): neutral secondary (zinc/warm gray), primary = app accent or muted terracotta, generic logo in the fixed 2rem box.

**Partners / ads (later):** same token shape; optional `partner: true` in registry — no second card layout.

---

## Brand registry (`#BRAND-ID` + `#BRAND-LOGO`)

Must scale to **100+** tools without per-card code.

### Registry record

| Field | Purpose |
|-------|---------|
| `slug` | PK, matches `tags.slug` / `ToolSlug` |
| `label` | Display name in title |
| `primary` | Pill color |
| `secondary` | Card bg |
| `onPrimary`, `onSecondary`, `onSecondaryMuted` | Contrast text |
| `logoPath` | Storage object key, e.g. `claude/logo.svg` |

### Storage (day one)

- **Bucket:** `brand-assets` (public read for authenticated users, or public CDN path).
- **Convention:** `{slug}/logo.svg` (or `.png`; prefer SVG).
- **URL builder:** `lib/brands/logo-url.ts` — single function from `slug` → absolute URL (no hardcoded hosts in components).
- **Bootstrap:** one-off seed upload for current 7 `ToolSlug` values; no deploy needed to add tool #8+.
- **Not in repo:** avoid `public/brands/` as source of truth (duplicates Storage). Optional dev fallback file only when `NODE_ENV=development` and Storage empty.

### Runtime (performance)

- **`getBrand(slug)`** — sync read from static manifest (`lib/brands/manifest.ts` or JSON import). **No Supabase roundtrip per card.**
- Colors applied via `data-brand={slug}` + CSS variables, or inline `style` on card root.
- **`<BrandLogo slug />`** — always `2rem` box; `<img src={logoUrl(slug)} alt="" />` or inline SVG if cached.
- DB table `brands` / `tags.brand_*` columns — **Phase D** (manifest remains source until migration); Storage URL can stay manifest-driven.

### Deprecation

Replace [`tool-icon.tsx`](../components/post/tool-icon.tsx) with `BrandLogo`; remove direct `simple-icons` imports from card tree.

---

## Post card v2 — anatomy

**Feed grid item** = optional wrapper + card + floating peer (see below).

```
     ┌── PostCardWrapper (position relative) ──────────────────┐
     │ ┌──────────────────────── 2rem radius ────────────────┐ │
     │ │ TOP    [Avatar]  [type pill][min pill]  [♥]       │ │
     │ │ MIDDLE title + BrandLogo(2rem box) + intro + meta │ │
     │ │ DOCK   white tray: vote | comment | rewards(dummy)│ │
     │ └───────────────────────────────────────────────────┘ │
     │     ○○○  Peer strip (floating, below card)            │
     └───────────────────────────────────────────────────────┘
```

### Top row

`display: flex; justify-content: space-between; align-items: center;`

| Zone | Content |
|------|---------|
| Left | Author avatar |
| Center | Post-type pill (**`primary`** bg) + duration pill (neutral on **`secondary`** — white/translucent; tune in build) |
| Right | Save heart (outside link click target) |

### Middle

- Title: `how to {action} in` + **BrandLogo** (fixed box) + `{label}`.
- Intro: `hacks.summary`, `line-clamp-3` in feed.
- Meta: `relativeTime` + optional “Edited”.

Author name/role **not** duplicated here (avatar only in top).

### Dock

White tray; provided SVGs at **16px** or **24px** grid sizes:

| Control | Phase 1 behaviour |
|---------|-------------------|
| Vote up/down | `helpful` / `not_helpful`; net count optional |
| Comment | Link to `/hacks/[id]#comments`; badge from dummy/0 |
| Rewards | **Dummy** total (TS `metrics` or static) |

### Peer strip (outside box)

- Reuse [`post-peer-footer.tsx`](../components/post/post-peer-footer.tsx) logic, new layout: **positioned below** card (negative margin or absolute `top: 100%` + small gap).
- **Not** inside the brand-colored shell — does not affect card height calculations for grid row if we use wrapper min-height.
- Hidden when `totalPeerCompletions === 0`.

---

## Icons (post card)

| Asset | Placement |
|-------|-----------|
| Heart | Top-right save |
| Up/down | Dock vote control |
| Comment | Dock |
| Award | Dock rewards — `1.75rem` (#FFB833) circle, `1.375rem` icon inside |

Source SVGs live in [`public/icons/`](../public/icons/) (`BxHeart.svg`, `BxUpArrowCircle.svg`, `BxComment.svg`, `BxBxsAward.svg`). React wrappers in `components/icons/post-card/` inline those paths with `currentColor`.

---

## Grid cheat sheet (card)

| Element | rem (@ 16px root) |
|---------|-------------------|
| Card padding | 1 or 1.5 |
| Section gap | 1 |
| Dock inset + padding | 1 |
| Title | 1.5 semibold |
| Intro | 1 regular |
| Meta | 0.75 |
| Badge text | 0.75 medium |
| Logo box | **2 × 2**, radius **0.5** |

---

## Implementation phases (tight order)

### Phase A — Global foundation

1. Inter Tight in `app/layout.tsx`; update `--font-sans` / Tailwind theme.
2. `lib/brands/manifest.ts` — 7 tools with `primary` / `secondary` / contrast (one palette each).
3. Supabase Storage bucket + RLS/read policy doc in README; seed script for logos.
4. `getBrand`, `logoUrl`, CSS variable helper.
5. Copy post-card SVGs into codebase.

*Skip:* curator UI, `brands` DB table, emoji purchase flow.

### Phase B — Card + feed composition

1. Refactor `PostCard` → shell / top / middle / dock.
2. `PostCardWrapper` + floating `PostPeerStrip`.
3. Join `hacks.summary` on explore/for-you/saved if not already selected.
4. Update `find-hacks-renderer` later (optional, separate PR) — don’t block B.

*Skip:* rewards logic, real comment counts.

### Phase C — Dock wiring

1. Vote → existing `setReaction` server actions.
2. Comment → hash link.
3. Remove `PostSocialRow` from card; archive dead Lucide dock patterns.

### Phase D — Platform scale

1. `brands` table or `tags` brand columns mirroring manifest.
2. Curator upload → Storage.
3. Emoji rewards + ledger (ADR + schema).

---

## References

- Card: [`components/post/post-card.tsx`](../components/post/post-card.tsx)
- Slugs: [`lib/dummy/posts.ts`](../lib/dummy/posts.ts)
- Interactions: [`learning_schema.sql`](../supabase/learning_schema.sql), [`app/for-you/actions.ts`](../app/for-you/actions.ts)
- Glossary: [glossary.md](glossary.md)
