# Design system (Slimmerbezig)

Living rules for UI — especially **post cards** and anything that shares their chrome. Update this file when tokens, grid rules, or brand-registry decisions change; link ADRs in [decisions.md](decisions.md) for product/schema choices.

**Status:** Card v2 implemented. Wireframes: Jun 2026.

---

## Where to configure tools (post brands)

| What | Where |
|------|--------|
| **Colors** (background light + secondary card bg + primary pill) | [`lib/brands/manifest.ts`](../lib/brands/manifest.ts) — single source of truth, one row per tool; text colors auto-derived via [`lib/brands/contrast.ts`](../lib/brands/contrast.ts) (optional `on*` overrides) |
| **Logo files** | Flat in [`public/brands/`](../public/brands/) (and bucket **`brand-assets`**) named `logo-{slug}.{ext}` — SVG preferred, PNG when unavoidable (e.g. `logo-lovable@2x.png`). Exact file name set per-row via `logoPath`. |
| **Logo box color** | `logoBg` (+ optional `logoStroke`) per row in [`lib/brands/manifest.ts`](../lib/brands/manifest.ts) |
| **SQL bucket** | [`supabase/10_brand_assets_storage.sql`](../supabase/10_brand_assets_storage.sql) |

After adding a slug: extend `ToolSlug` in [`lib/dummy/posts.ts`](../lib/dummy/posts.ts), upload logo, run seed/migrations as needed.

---

## Locked product decisions

| Topic | Decision |
|-------|----------|
| Brand variants | **One layout per tool** — single `primary` + `secondary` (+ contrast tokens). No dark/light theme per brand. |
| Color roles | **`background`** = background light (container behind the card; reused as hack detail page bg). **`primary`** = category pill. **`secondary`** = card body (mostly dark). **`on*`** text = auto light/dark via WCAG contrast pick unless overridden in manifest. |
| Logos | **Local-first:** flat files in `public/brands/` are the source today; Supabase Storage (`brand-assets`) is a fallback for curator-uploaded tools later. |
| Headline logo box | **Fixed dimensions** for every tool: **`2rem × 2rem`** box, **`0.5rem`** border-radius, `object-fit: contain`. **Box color is per-brand** (`logoBg`, default white) with an optional `logoStroke` (e.g. Photoshop's 1px 25% white border); dimensions never vary. |
| Peer social proof | **Outside the card** — floats underneath the rounded card box (not in wireframe mock). Still rendered in feed. |
| Rewards (dock) | **Dummy total** until ledger exists (reuse TS metrics / placeholder). |
| Typography | **Inter Tight** for the **whole app** (replaces Geist in root layout). |

---

## App header chrome

The floating chrome — sticky top bar ([`components/shell/app-header.tsx`](../components/shell/app-header.tsx)) and the bottom Ask bar ([`components/feed/ask-bar.tsx`](../components/feed/ask-bar.tsx)) — uses a single reusable **frosted-glass surface** (`.glass-bg`). The earlier five-layer progressive-blur header treatment was **removed** (see ADR 2026-06-08).

### Glass surface (`.glass-bg`)

Defined once in [`app/globals.css`](../app/globals.css) under `@layer components`. Reuse it for any floating chrome instead of redefining the blur per component.

| Token | Value (Figma spec) |
|-------|--------------------|
| Background | `#5D5D5D` @ **40%** opacity (`rgba(93,93,93,0.4)`) |
| Backdrop blur | **40px** (`backdrop-filter: blur(40px)`, `-webkit-` prefixed) |
| Border | `1px solid rgba(255,255,255,0.12)` — carried by the class, so callers drop their `bg-white` / `border-black/10` |

Applied to: primary nav, secondary menu, Ask bar form, and search overlay input. Because the surface is dark, inner content uses **light** text/icons: inactive nav links `text-white/70`, dividers `bg-white/25`, Ask/search input + placeholder `text-white` / `text-white/60`.

### Primary nav active state — moving pill

[`components/shell/primary-nav.tsx`](../components/shell/primary-nav.tsx) replaces the underline with a **sliding white pill** behind the active item (inspired by pattaxnike.com). The pill is one absolutely-positioned `<span>`; on `usePathname()` change it measures the active link's `offsetLeft/offsetWidth/offsetTop` and animates via **GSAP** (`gsap.to`, `power3.out`, 0.4s) — per the AGENTS "GSAP-first for state motion" rule. It snaps instantly (`gsap.set`) on first paint, on resize, and for `prefers-reduced-motion`, and fades out (`opacity: 0`) on pages with no matching nav item (e.g. `/saved`, `/profile`). Active link text flips to `text-zinc-900` on the pill. `PILL_HEIGHT` (44px) insets the pill within the 3.75rem glass bar.

### Secondary menu — borderless white icons

[`components/shell/secondary-menu.tsx`](../components/shell/secondary-menu.tsx) holds four affordances on the glass pill: **search** ([`components/shell/header-search.tsx`](../components/shell/header-search.tsx)), **favorites** (heart link to `/saved`), **avatar** (profile photo circle), **hamburger** ([`components/shell/hamburger-menu.tsx`](../components/shell/hamburger-menu.tsx)). Search, heart, and hamburger are **borderless white icons** (`text-white`, optional `hover:bg-white/15`) — no white circle backgrounds. Heart turns **red + filled** (`fill-current text-favorite`) when `savedCount > 0`; badge unchanged. Avatar stays a photo circle.

### Search (header overlay)

Classic hack search moved out of the bottom bar. [`components/shell/header-search.tsx`](../components/shell/header-search.tsx) toggles [`components/feed/search-overlay.tsx`](../components/feed/search-overlay.tsx) — a modal with a glass input and live results via [`components/feed/ask-search-results.tsx`](../components/feed/ask-search-results.tsx) (`showSeeAll={false}`). Escape / click-out closes. Backed by `POST /api/search`.

### Ask bar — collapsed default + ask-only

[`components/feed/ask-bar.tsx`](../components/feed/ask-bar.tsx) is **ask-only** (no Search/Ask tabs). Default state: **200px** wide glass pill, decorative blinking caret + "Ask ai..." ([`.animate-caret-blink`](../app/globals.css)), black circular submit with magnifier icon. **Global type-to-enter:** printable keys (when focus is not in another field) expand the pill, focus the input, and append the character. Click / `⌘K` also expand + focus. Width animates to `max-w-2xl` via GSAP; collapses on blur when empty. Submit opens [`components/feed/ask-overlay.tsx`](../components/feed/ask-overlay.tsx). Scroll-minimize behaviour unchanged.

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
| `--post-brand-background` | **Background light** — container behind the card (reused as hack detail page bg) |
| `--post-brand-on-background` | Text/peer proof on the background light |
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
| `background` | Background light (container behind card + detail page bg) |
| `secondary` | Card bg |
| `primary` | Pill color |
| `onBackground`, `onPrimary`, `onSecondary`, `onSecondaryMuted` | Contrast text (auto; optional override) |
| `logoBg`, `logoStroke` | Logo box background + optional border |
| `logoPath` | Logo file name, e.g. `logo-claude.svg` / `logo-lovable@2x.png` |

### Logo source order

- **Resolution:** [`BrandLogo`](../components/post/brand-logo.tsx) tries **local `public/brands/{logoPath}` first → Supabase Storage → generic `_fallback`** (advancing on `<img>` `onError`).
- **Convention:** flat `logo-{slug}.{ext}` in `public/brands/` (and bucket `brand-assets` if used) — SVG preferred, PNG when unavoidable (e.g. `logo-lovable@2x.png`).
- **URL builder:** `lib/brands/logo-url.ts` — `logoPath` → absolute URL for each source (no hardcoded hosts in components).
- **Bucket:** `brand-assets` (public read) stays available for curator-uploaded tools later; not the primary source today.

### Runtime (performance)

- **`getBrand(slug)`** — sync read from static manifest (`lib/brands/manifest.ts` or JSON import). **No Supabase roundtrip per card.**
- Colors applied via `data-brand={slug}` + CSS variables, or inline `style` on card root.
- **`<BrandLogo slug />`** — always `2rem` box; `<img src={logoUrl(slug)} alt="" />` or inline SVG if cached.
- DB table `brands` / `tags.brand_*` columns — **Phase D** (manifest remains source until migration); Storage URL can stay manifest-driven.

### Deprecation

**Done:** `tool-icon.tsx` removed; the card tree uses [`BrandLogo`](../components/post/brand-logo.tsx) (Storage asset, no `simple-icons`). The `simple-icons` dependency is now unused and can be dropped from `package.json` in a later cleanup.

---

## Post card v2 — anatomy

**Feed grid item** = optional wrapper + card + floating peer (see below).

```
 ┌── Stage / background light (#1, 2.5rem radius, per-tool tint) ───────┐
 │   ┌──────────────────────── 2rem radius (#2 card body) ──────────┐   │
 │   │ TOP    [Avatar]  [type pill(#3)][min pill(#4)]  [♥]         │   │
 │   │ MIDDLE title + BrandLogo(#5, 2rem box) + intro + meta       │   │
 │   │ DOCK   white tray: vote | comment | rewards(dummy)          │   │
 │   └────────────────────────────────────────────────────────────┘   │
 │       ○○○  Peer strip (floats over background light, below card)    │
 └─────────────────────────────────────────────────────────────────────┘
```

The **stage** ([`brandStageStyle`](../lib/brands/get-brand.ts)) carries every `--post-brand-*` var + the background light; the **card body** ([`brandCardStyle`](../lib/brands/get-brand.ts)) reads `--post-brand-secondary` from it. Same `brandStageStyle` will back the hack detail page.

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

## Post maker modal

The hack composer ([`components/post/post-maker/post-maker-modal.tsx`](../components/post/post-maker/post-maker-modal.tsx)) is a two-pane overlay opened via the `?compose=hack` query param (set by the capability-gated **"+ Create"** menu, [`components/shell/create-menu.tsx`](../components/shell/create-menu.tsx)). It is mounted once in [`app/(app)/layout.tsx`](../app/(app)/layout.tsx) for users with `canCreateHacks` and reuses the search-overlay conventions (backdrop click-out, Escape, body scroll-lock).

| Pane | Content |
|------|---------|
| **Left — "Nieuwe post"** | Public-link `Input` + "of" divider + conversation `Textarea` + "of" divider + screenshot dropzone (file picker, drag-and-drop, clipboard paste; max 4, client-downscaled JPEG); privacy microcopy; **Genereer** button (calls `/api/hacks/generate` with `sourceType`: url → screenshot → conversation precedence). |
| **Right — "Artikel draft"** | Live **`<PostCard>`** preview (built from the draft via `buildPostFromDraft`, wrapped `pointer-events-none` so it's inert); editable **Title / Samenvatting / Inhoud**; **Channels toevoegen** toggle chips (min 1); footer "and earn **+250 XP**" + **Publish**. |

- Preview tints: the preview sits on a neutral `bg-zinc-100` tray (brand vars cascade from the card body, not the wrapper).
- New primitive: [`components/ui/textarea.tsx`](../components/ui/textarea.tsx) (shadcn-style; none existed before).

## References

- Card: [`components/post/post-card.tsx`](../components/post/post-card.tsx)
- Slugs: [`lib/dummy/posts.ts`](../lib/dummy/posts.ts)
- Interactions: [`learning_schema.sql`](../supabase/learning_schema.sql), [`app/for-you/actions.ts`](../app/for-you/actions.ts)
- Glossary: [glossary.md](glossary.md)
