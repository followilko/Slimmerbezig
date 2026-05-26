# Data model

Schemas live as SQL-first sources of truth:

| File | Purpose |
|------|---------|
| [supabase/schema.sql](../supabase/schema.sql) | Auth baseline: `profiles`, new-user trigger (run **first**) |
| [supabase/learning_schema.sql](../supabase/learning_schema.sql) | Learning MVP tables, RLS, `get_recommended_hacks()` |
| [supabase/future_schema.sql](../supabase/future_schema.sql) | Commented sketches — **do not run** until promoted |

See also [decisions.md](decisions.md) for *why* (split files, ledger model, ESCO-ready tags).

---

## Current (learning MVP)

```mermaid
erDiagram
  profiles ||--o{ user_frustrations : owns
  profiles ||--o{ weekly_checkins : owns
  profiles ||--o{ challenges : owns
  profiles ||--o{ hack_interactions : records
  tags ||--o{ hack_tags : links
  hacks ||--o{ hack_tags : has
  user_frustrations ||--o{ user_frustration_tags : tagged
  tags ||--o{ user_frustration_tags : ""
  weekly_checkins ||--o{ weekly_checkin_tags : tagged
  tags ||--o{ weekly_checkin_tags : ""
  challenges ||--o{ challenge_tags : tagged
  tags ||--o{ challenge_tags : ""
  profiles ||--o{ hacks : "author optional"
```

### Entities (Current)

| Entity / concept | Tables / artefact | Where in `learning_schema.sql` |
|------------------|-------------------|--------------------------------|
| User profile (+ sector/role fields) | `profiles` *(extended)* | §1 — ALTER `profiles` |
| Controlled vocabulary tags | `tags` | §2 |
| Published AI tips | `hacks` (+ `hack_tags`) | §3 |
| Problem statements during onboarding etc. | `user_frustrations` (+ `user_frustration_tags`) | §4 |
| Weekly snapshots | `weekly_checkins` (+ `weekly_checkin_tags`) | §5 |
| “Help me with X” quests | `challenges` (+ `challenge_tags`) | §6 |
| User ↔ hack signals | `hack_interactions` | §7 |
| Tag-overlap recommendation | `get_recommended_hacks(p_limit int)` SECURITY INVOKER | Bottom of file (~L546+); policies start at §“8. Row Level Security”. |

### Row Level Security (plain English)

- **Everyone signed in** can read **published** hacks and related join rows that are intentionally public-facing (exact rules in SQL policy names).
- **Users** can insert/select/update/delete **their own** frustrations, check-ins, challenges, interactions where policies say so — not other people’s rows.
- **Tags** — read for authenticated users; write reserved for **`curator` / `admin`** (controlled vocabulary).
- **Hacks** — read published for learners; **`creator`** can insert **`source = user`** hacks with **`author_id = auth.uid()`**; **`curator`/`admin`** can manage curated inserts (including **`author_id` null** paths as defined).
- Prefer reading the **`CREATE POLICY`** blocks starting around **`-- ─── 8. Row Level Security`** in [`learning_schema.sql`](../supabase/learning_schema.sql) before changing assumptions in app code.

---

## Future

All below are inside the **big comment** in [`future_schema.sql`](../supabase/future_schema.sql) — not applied to production DB yet.

```mermaid
erDiagram
  profiles ||--o{ credit_ledger : actor
  hacks ||--o{ credit_ledger : optional_link
  hacks ||--o{ hack_comments : has
  challenges ||--o{ challenge_comments : has
  profiles ||--o{ hack_comments : author
  profiles ||--o{ hack_reactions : reactor
  hacks ||--o{ hack_reactions : target
  profiles ||--o{ follows : follower
  profiles ||--o{ follows : followee
  learning_paths ||--o{ learning_path_steps : steps
  hacks ||--o{ learning_path_steps : ordered
  profiles ||--o{ job_history : cv
  profiles ||--o{ project_experience : cv
  profiles ||--o{ user_skill_evidence : skills
```

| Sketch entity | Intended use | Where |
|---------------|--------------|--------|
| `credit_ledger` | Append-only balance events | future §“Append-only credits” |
| `hack_comments`, `challenge_comments` | Discussion threads | future §comments |
| `hack_reactions` | Lightweight liking | future §Reactions |
| `follows` | Social graph | future §Follow graph |
| `learning_paths`, `learning_path_steps` | Curated sequences | future §paths |
| `job_history`, `project_experience` | Career corpus | future §Imported career |
| `user_skill_evidence` | Fine-grained skills + proof | future §ESCO-linked |

When any of these graduates to production, extend [`learning_schema.sql`](../supabase/learning_schema.sql) or add a numbered migration via Supabase CLI, update this doc, append an ADR to [decisions.md](decisions.md), and regenerate types.
