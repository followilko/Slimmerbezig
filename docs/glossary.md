# Glossary

Canonical vocabulary — if you invent a synonym in UI copy or code comments, align it **here** (or add a new row and link an ADR).

## Core entities

| Term | Definition |
|------|-------------|
| **Hack** | A concrete **try-this-today** AI tip (`hacks.title/summary/body_md`). Rows are **`draft`/`published`/`archived`**; matching uses joined **`tags`** via **`hack_tags`**. Carries **post type**, **goal**, **tool**, **AI capability** (see below). |
| **Challenge** | A user-posed goal such as **“help me automate X.”** Stored in **`challenges`** with optional **`challenge_tags`**. Answers come as **comments** and/or **hack links** (existing or self-promoted). |
| **Frustration** | Short free-text problem statement (**`user_frustrations.body`**) plus **`user_frustration_tags`**. Feeds the recommendation overlap. |
| **Weekly check-in** | Periodic status note (**`weekly_checkins`**, one row per user per **`week_start`**) plus **`weekly_checkin_tags`** for “what consumed my week.” Feeds **`get_recommended_hacks`**. |
| **Sector** | Coarse bucket on **`profiles.sector`** (**design/marketing/sales/finance/product/engineering/operations/hr/other**). Must align with **`tags`** where **`kind='sector'`** for slug-based matching. |
| **Tag** | Controlled vocabulary atom in **`tags`**: **`kind ∈ {sector, topic, skill, tool, frustration, capability}`** (capability added with the structured taxonomy). Optional **`esco_uri`** for ontology mapping. |
| **Recommendation** | Today: deterministic overlap of hack tags with the user’s sector tag + open frustration tags + **`weekly_checkin_tags`** + **`user_interests`** overlap inside **`get_recommended_hacks`**, filtered by visibility rules. Later: hybrid with embeddings + Goal × Tool × Capability filters. |
| **Profile understanding** | One row per user (**`profile_understanding`**) — rolling LLM-authored **summary** + **signals** JSON rehydrated into each coach session for continuity. |
| **User interest** | **`user_interests`** links a user to **`tags`** with **`kind ∈ {tool, capability}`** and a **weight**; written by the AI coach (or future UI) to bias **`get_recommended_hacks`**. |
| **Tag suggestion** | **`tag_suggestions`** queue for **new controlled-vocabulary labels** proposed by learners or the LLM; only **curator/admin** promotes rows into **`tags`**. |
| **Chat session** | **`chat_sessions`** + **`chat_messages`** — coach transcripts; at most **one open** session per (`user_id`, **`kind`** = onboarding \| check-in). |

## Hack taxonomy

| Term | Definition |
|------|-------------|
| **Post type** | Effort/length classification on a hack: **`bite`** (≲5 min single tip), **`recipe`** (5–30 min multi-step), **`guide`** (30–60+ min long form), **`external`** (curated link to off-platform content). |
| **Goal** | What the hack accomplishes (verb): **`automate \| analyse \| generate \| organise \| communicate \| learn \| decide`**. Stored as `hacks.goal` (planned column / enum). |
| **Tool** | Concrete software the hack uses: e.g. **`chatgpt`, `claude`, `gemini`, `excel`, `figma`, `photoshop`, `notion`, `linear`**. Modelled as **`tags`** with **`kind='tool'`** so it stays extensible. |
| **AI capability** | Capability category invoked: **`text_generation \| image_generation \| transcription \| classification \| agents \| rag \| code_generation \| structured_extraction \| translation`**. Modelled as **`tags`** with **`kind='capability'`** (planned). |
| **Hack source** | **`curated`** (editorial, often `author_id IS NULL`), **`user`** (community, creator+ required), **`external`** (link to Twitter/X, LinkedIn, YouTube, blog — must be inserted by `curator`/`admin`). |

## Permissions & people

| Term | Definition |
|------|-------------|
| **Role (`profiles.role`)** | **`learner`** — default consume-only. **`creator`** — publish **`user`** hacks (`author_id = self`). **`curator`** — manage **`tags`**, publish **`curated`** and **`external`** hacks. **`admin`** — tenant-wide (org) administration. |
| **Organisation** | A tenant in the B2B model (`organizations` planned table). Users have **`organization_id`** on their profile; most content is scoped by it. |
| **Office peers** | Users sharing the same **`organization_id`** as the viewer — the audience for the **Office peers** page (route **`/office`**, nav label **"Peers"**). |
| **Community** | A cluster around shared interest (sector / topic / tool) — feed scope on the **Communities** page (**`/communities`**). May span organisations (read-only public hacks). |

## Surfaces (UI vocabulary)

| Term | Definition |
|------|-------------|
| **App shell** | The chrome rendered by **`app/(app)/layout.tsx`**: sticky top `<AppHeader />` (brand + primary nav + secondary menu) and the globally-mounted `<AskBar />`. All in-app pages (Suggested / Peers / Communities / Explore / Challenges / Profile / Settings / Saved / Messages / Learning path / Become a creator / Hacks/new) inherit it. Login / onboarding / checkin / auth opt out by living outside the route group. |
| **Suggested** | UI label for the personalised feed at **`/for-you`** — uses `get_recommended_hacks` v2 + the user's tag overlap. Same route as the original "For You" decision, just rebadged for the wireframe. |
| **Explore** | Top-level **`/explore`** route — discovery surface for hacks **across organisations**. Empty until cross-org schema and a richer corpus land; conceptually distinct from **Communities** (opt-in topic clusters) and **Office peers** (single-org colleagues). |
| **Primary nav** | The five-tab pill in the header: **Suggested / Peers / Communities / Explore · Challenges** (`·` is a visual divider, not a separate concept). Defined in **`components/shell/primary-nav.tsx`**. |
| **Secondary menu** | The right side of the header: Create CTA (or "Become a creator"), favorites heart (saved-hacks badge), points pill (creator-only), avatar (→ `/profile`), hamburger (→ Account settings / Messages / Learning path / Sign out). |

## Signals & economy

| Term | Definition |
|------|-------------|
| **Interaction kind** | Values in **`hack_interactions.kind`**: **`saved \| viewed \| completed \| helpful \| not_helpful`**. Composite PK **`(user_id, hack_id, kind)`**. |
| **Praise** | A **`+1`-style** signal on a **hack** *or* a **challenge comment**, recorded once per (user, target). Triggers a **points** ledger entry to the target’s author. |
| **Points** | Author-side reward number, materialised from an **append-only ledger** (`credit_ledger` pattern in **`supabase/future_schema.sql`**). Redemption mechanics are deferred — surface counters first. |
