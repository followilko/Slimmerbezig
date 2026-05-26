# Glossary

Canonical vocabulary — if you invent a synonym in UI copy or code comments, align it **here**.

| Term | Definition |
|------|-------------|
| **Hack** | A concrete **try-this-today** AI tip (`hacks.title/summary/body_md`). Rows are **`draft`/`published`/`archived`**; matching uses joined **`tags`** via **`hack_tags`**. |
| **Challenge** | A user-posed goal such as **“help me automate X.”** Stored in **`challenges`** with optional **`challenge_tags`**; **not** the same entity as hacks (but may cite hacks later via product logic). |
| **Frustration** | Short free-text **problem statement** (**`user_frustrations.body`**) plus **`user_frustration_tags`** for classification. Powers recommendation overlap with hacks. |
| **Weekly check-in** | Periodic status note (**`weekly_checkins`**, one row per user per **`week_start`**) plus **`weekly_checkin_tags`** for “what consumed my week.” Feeds **`get_recommended_hacks`** overlap. |
| **Sector** | Coarse bucket on **`profiles.sector`** (**design/marketing/sales/finance/product/engineering/operations/hr/other**). Must align with **`tags`** where **`kind='sector'`** (slug symmetry for matching logic). |
| **Tag** | Controlled vocabulary atom in **`tags`**: **`kind ∈ {sector, topic, skill, tool, frustration}`**. Optional ontology hook: **`esco_uri`** (reserved, usually null MVP). |
| **Role (`profiles.role`)** | **`learner`** — default consume-only. **`creator`** — publish **`hacks`** with **`source='user'`** and **`author_id=self`**. **`curator`** / **`admin`** — manage **`tags`**, insert **`source='curated'`** hacks (possibly **`author_id` null**) per RLS. |
| **Interaction kind** | Values accepted in **`hack_interactions.kind`**: **`saved` \| `viewed` \| `completed` \| `helpful` \| `not_helpful`**. Composite PK **`(user_id, hack_id, kind)`** allows multiple signals per hack. |
| **Hack source** | **`curated`** — editorial / platform hacks (often **`author_id` IS NULL`). **`user`** — community hacks from creators (**`author_id` required** semantics enforced by INSERT policy). |
| **Recommendation** | Today: **deterministic overlap** counts between hack tags and the union of (**sector tag**) + (**open frustration tags**) + (**all check-in tags**) inside **`get_recommended_hacks`**. Tomorrow: embeddings / **`pgvector`** hybrid — see [roadmap.md](roadmap.md). |
