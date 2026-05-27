-- =============================================================================
-- Slimmerbezig — seed 10 curated dummy posts (Sprint: PostCard end-to-end)
-- Run AFTER schema.sql + learning_schema.sql + ai_chat_schema.sql + 03/04/05/06/07.
-- Idempotent: re-runs upsert title/summary/body/status; tags are no-conflict.
--
-- Why hardcoded UUIDs? They are the *bridge* between this SQL seed and
-- lib/dummy/posts.ts POST_META_BY_ID — both files must mirror each other so
-- the UI can decorate DB rows with rich metadata (postType, minutes, author
-- block, peers, metrics) that hacks columns don't yet carry.
--
-- After running: SELECT count(*) FROM public.hacks WHERE id LIKE 'aaaaaaaa-0001-%';
-- expect 10. SELECT count(*) FROM public.hack_tags WHERE hack_id LIKE
-- 'aaaaaaaa-0001-%'; expect 20 (each hack = 1 sector tag + 1 tool tag).
-- =============================================================================

-- ─── 1. Sector tags (slugs MUST match profiles.sector CHECK values) ─────────
insert into public.tags (slug, label, kind) values
  ('design',      'Design',      'sector'),
  ('marketing',   'Marketing',   'sector'),
  ('engineering', 'Engineering', 'sector'),
  ('operations',  'Operations',  'sector')
on conflict (slug) do nothing;

-- ─── 2. Tool tags (slugs match the ToolSlug union in lib/dummy/posts.ts) ────
insert into public.tags (slug, label, kind) values
  ('photoshop', 'Photoshop', 'tool'),
  ('figma',     'Figma',     'tool'),
  ('framer',    'Framer',    'tool'),
  ('notion',    'Notion',    'tool'),
  ('zoom',      'Zoom',      'tool'),
  ('cursor',    'Cursor',    'tool'),
  ('claude',    'Claude',    'tool')
on conflict (slug) do nothing;

-- ─── 3. Hacks (10 rows with hardcoded UUIDs) ────────────────────────────────
-- source='curated', author_id=null, status='published'. RLS on hacks_insert
-- requires a curator/admin role; run this in the Supabase SQL Editor where the
-- service role bypasses RLS.
insert into public.hacks (id, author_id, source, title, summary, body_md, status)
values
  (
    'aaaaaaaa-0001-0001-0001-000000000001',
    null, 'curated',
    'how to automate edits with AI-actions in Photoshop',
    'Bouw een herhaalbare AI-action voor je standaard retouch-flow, zodat batch-edits in één klik draaien.',
    'Eerste sprint-voorbeeld. Volledige body komt in een latere sprint.',
    'published'
  ),
  (
    'aaaaaaaa-0001-0001-0001-000000000002',
    null, 'curated',
    'how to batch-export social assets with generative fill in Photoshop',
    'Schaal één hero-asset naar alle social-formats en laat generative fill de randen oplossen.',
    'Eerste sprint-voorbeeld. Volledige body komt in een latere sprint.',
    'published'
  ),
  (
    'aaaaaaaa-0001-0001-0001-000000000003',
    null, 'curated',
    'how to speed up handoff with auto-layout tokens in Figma',
    'Koppel auto-layout aan je design-tokens zodat dev de spacing direct overneemt.',
    'Eerste sprint-voorbeeld. Volledige body komt in een latere sprint.',
    'published'
  ),
  (
    'aaaaaaaa-0001-0001-0001-000000000004',
    null, 'curated',
    'how to generate ad variants from one master frame in Figma',
    'Eén master-frame, AI-prompt voor varianten — klaar voor je campagne in minuten.',
    'Eerste sprint-voorbeeld. Volledige body komt in een latere sprint.',
    'published'
  ),
  (
    'aaaaaaaa-0001-0001-0001-000000000005',
    null, 'curated',
    'how to build a landing page from a single prompt in Framer',
    'Gebruik Framer AI om een complete landing in te richten, daarna fine-tunen in de canvas.',
    'Eerste sprint-voorbeeld. Volledige body komt in een latere sprint.',
    'published'
  ),
  (
    'aaaaaaaa-0001-0001-0001-000000000006',
    null, 'curated',
    'how to summarise meeting notes into action items in Notion',
    'Een AI-block dat ruwe meeting-notes herschrijft naar duidelijke owners en deadlines.',
    'Eerste sprint-voorbeeld. Volledige body komt in een latere sprint.',
    'published'
  ),
  (
    'aaaaaaaa-0001-0001-0001-000000000007',
    null, 'curated',
    'how to build an AI-powered weekly review template in Notion',
    'Een template dat met één klik je week samenvat op basis van je database-entries.',
    'Eerste sprint-voorbeeld. Volledige body komt in een latere sprint.',
    'published'
  ),
  (
    'aaaaaaaa-0001-0001-0001-000000000008',
    null, 'curated',
    'how to auto-summarise calls with AI Companion in Zoom',
    'Zet AI Companion aan en krijg na elke call een gestructureerde samenvatting + next steps.',
    'Eerste sprint-voorbeeld. Volledige body komt in een latere sprint.',
    'published'
  ),
  (
    'aaaaaaaa-0001-0001-0001-000000000009',
    null, 'curated',
    'how to scaffold a new feature with agent mode in Cursor',
    'Laat agent mode de boilerplate genereren — jij valideert het plan en reviewt de diff.',
    'Eerste sprint-voorbeeld. Volledige body komt in een latere sprint.',
    'published'
  ),
  (
    'aaaaaaaa-0001-0001-0001-000000000010',
    null, 'curated',
    'how to run a structured code review on pull requests in Claude',
    'Een herhaalbare review-prompt die security, performance en leesbaarheid afdekt.',
    'Eerste sprint-voorbeeld. Volledige body komt in een latere sprint.',
    'published'
  )
on conflict (id) do update set
  title      = excluded.title,
  summary    = excluded.summary,
  body_md    = excluded.body_md,
  status     = excluded.status,
  source     = excluded.source,
  updated_at = now();

-- ─── 4. hack_tags: one sector + one tool per hack ───────────────────────────
-- Mapping table joined to public.tags by slug. on conflict do nothing makes
-- re-runs cheap.
with mapping(hack_id, sector_slug, tool_slug) as (
  values
    ('aaaaaaaa-0001-0001-0001-000000000001'::uuid, 'design',      'photoshop'),
    ('aaaaaaaa-0001-0001-0001-000000000002'::uuid, 'design',      'photoshop'),
    ('aaaaaaaa-0001-0001-0001-000000000003'::uuid, 'design',      'figma'),
    ('aaaaaaaa-0001-0001-0001-000000000004'::uuid, 'marketing',   'figma'),
    ('aaaaaaaa-0001-0001-0001-000000000005'::uuid, 'design',      'framer'),
    ('aaaaaaaa-0001-0001-0001-000000000006'::uuid, 'operations',  'notion'),
    ('aaaaaaaa-0001-0001-0001-000000000007'::uuid, 'operations',  'notion'),
    ('aaaaaaaa-0001-0001-0001-000000000008'::uuid, 'operations',  'zoom'),
    ('aaaaaaaa-0001-0001-0001-000000000009'::uuid, 'engineering', 'cursor'),
    ('aaaaaaaa-0001-0001-0001-000000000010'::uuid, 'engineering', 'claude')
)
insert into public.hack_tags (hack_id, tag_id)
select m.hack_id, t.id
  from mapping m
  join public.tags t on t.slug = m.sector_slug and t.kind = 'sector'
union all
select m.hack_id, t.id
  from mapping m
  join public.tags t on t.slug = m.tool_slug and t.kind = 'tool'
on conflict (hack_id, tag_id) do nothing;
