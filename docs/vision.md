# Vision

## What Slimmerbezig is

A **micro-learning** product: small, actionable **AI hacks** that people can try in their real work. The platform matches hacks to each person’s **sector**, **recorded frustrations**, and **weekly check-ins** — so recommendations feel like “this solves *my* problem” instead of generic tips.

## Who it’s for

Working professionals across **coarse sectors** (design, marketing, sales, finance, product, engineering, operations, HR, other). The first version optimises for speed and clarity over perfect taxonomies; richer skills (e.g. ESCO) can attach to **tags** later.

## Core user loop

1. **Sign in** (LinkedIn OIDC via Supabase Auth).
2. **Choose a sector** (`profiles.sector`) and align with `tags` where `kind = 'sector'`.
3. **Capture frustrations** (short text + tagged) during onboarding and over time.
4. **Weekly check-in**: what they spent time on + tags.
5. **See recommended hacks** (`get_recommended_hacks`) from tag overlap with sector + frustrations + check-ins.
6. **Interact**: save, mark helpful, complete — foundation for “how I’m evolving”.
7. **Graduate to creator**: trusted users get `profiles.role = 'creator'` and can publish **user** hacks; **curators/admins** publish **curated** content (including `author_id` null rows).

## Why this direction

AI tips are everywhere but **not contextual**. People need low-friction “try this today” actions tied to stated problems, plus a path from consumer to contributor without opening the floodgates on day one (**role gating**).

## MVP success criteria

- User can sign in and see a **meaningful short list** of published hacks for their sector and tags.
- User can **record** frustrations and a weekly check-in.
- User can **signal** value via hack interactions (saved / completed / helpful).
- Curators can seed **curated** hacks; a small set of **creators** can pilot user-authored hacks.

## Explicitly out of scope (for now)

Credits / economy, comments & social graph, full ESCO ingestion, vector/semantic search, separate production Supabase project, formal test suite & CI. These belong in [roadmap.md](roadmap.md) under **Later**.
