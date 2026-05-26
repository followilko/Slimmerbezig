# Vision

## What Slimmerbezig is

A **B2B SaaS micro-learning** product: short, actionable **AI hacks** (and longer guides) that people try inside their real work. The platform matches hacks to each user’s **sector**, **frustrations**, **weekly check-ins**, and **organisation** so recommendations feel like “this solves *my* problem” — not generic AI noise.

## Who it’s for

**Businesses first**, individuals later.

- **Primary buyer (now):** companies who roll Slimmerbezig out to teams so colleagues can publish and consume AI hacks together — internal peer-learning at office scale.
- **Long-term vision:** **cross-organisation peer learning** — you especially want to learn from people in the **same field** at *other* companies (a marketer at Org A learning from a marketer at Org B). This is intentionally **not** the launch model; it’s where the network effect is heading.

Users span the same **coarse sectors** as before (design / marketing / sales / finance / product / engineering / operations / HR / other), with optional later refinement via tag ontologies (ESCO).

## Core user loop

1. **Sign in** (LinkedIn OIDC via Supabase Auth; later: org-issued accounts / SSO).
2. **Belong to an organisation** (`organizations`) — invited, seat-based.
3. **Choose a sector** (`profiles.sector`) and align with `tags` (`kind='sector'`).
4. **Capture frustrations** + **weekly check-in** (tagged) to feed matching.
5. **See recommended hacks** (`get_recommended_hacks`) — overlap on sector + frustrations + check-ins, scoped by organisation visibility rules.
6. **Interact**: save, complete, mark helpful, **praise** valuable posts/comments → points (rewards model TBD).
7. **Contribute**: trusted users earn `profiles.role = 'creator'` and publish **user** hacks; curators publish **curated** content; admins manage tenant.

## Post types (different effort levels)

Not every contribution is a 30-second tip. Hacks have a **post type** indicating expected effort:

- **Bite** — under ~5 minutes to try (single prompt, single screenshot).
- **Recipe** — ~5–30 minutes, multi-step walkthrough.
- **Guide** — ~30–60+ minutes; long-form article, may include workflows.
- **External** — curated **link** to a high-signal post outside Slimmerbezig (Twitter/X, LinkedIn, YouTube, blog).

Each hack also carries structured taxonomy so search and matching aren’t only free-tags:

- **Goal** — what the hack accomplishes: `automate | analyse | generate | organise | communicate | learn | decide` (final list locked in glossary).
- **Tool** — concrete software the user employs: `chatgpt | claude | gemini | excel | figma | photoshop | notion | linear | …` (controlled vocab via `tags.kind='tool'`).
- **AI capability** — capability category used: `text_generation | image_generation | transcription | classification | agents | rag | code_generation | structured_extraction | translation | …`.

Recommendations and filters use this triple to make **“automate × Excel × structured_extraction”** a first-class query.

## Information architecture (top-level pages)

Left nav, in launch order:

1. **For You** — personalised feed (hacks recommended for the signed-in user).
2. **Communities** — content grouped by sector / topic clusters the user opted into.
3. **Office peers** — posts authored by colleagues (same `organization_id`).
4. **Challenges** — open “help me with X” questions from peers (org-scoped first, eventually cross-org for matching profiles).

## Challenges (how they get answered)

A **challenge** is a user-posed request. Responses come in two forms:

- **Comments** (short answers, threads).
- **Articles / hack links** — a commenter can attach a hack (own or third-party), or **promote their own existing hack** as a solution.

Comments and hacks both accept **praise** — a lightweight upvote-like signal that converts to **points** for the author. The exact economy (point→reward) is **deferred** but the data model needs to support it from the start (append-only ledger pattern, see `future_schema.sql` → `credit_ledger`).

## Hack sources (and curation)

`hacks.source` widens beyond `curated | user` to include **external** content (Twitter/X thread, LinkedIn post, YouTube, blog). External hacks store a canonical URL plus minimal metadata. **Curation is mandatory** for external rows — only `curator`/`admin` can publish them. See [decisions.md](decisions.md) for the exact rule.

## Why this direction

AI tips are everywhere but **not contextual**, **not peer-validated**, and **not tied to your real toolset**. A company-scoped feed of hacks — produced by colleagues, curated, with structured Goal × Tool × Capability — turns scattered AI hype into compounding institutional knowledge. The cross-org peer layer comes once the per-org loop is sticky.

## MVP success criteria

- Org admin can invite seats; users sign in and see a feed scoped to their org.
- Users record frustrations + weekly check-ins; recommended hacks list reflects them.
- Users can publish (creator+) at least **Bite** and **Recipe** post types.
- Praise on hacks/comments increments points (visible counter is enough; redemption is later).
- Challenges flow: open → comment / hack-link → mark resolved.

## Explicitly out of scope (now)

Point→reward redemption, cross-org peer matching, full ESCO ingest, embeddings / vector search, separate prod Supabase project, formal test suite & CI, SSO/SCIM. These live under **Later** in [roadmap.md](roadmap.md).
