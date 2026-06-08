-- Brand logos for post cards (see lib/brands/manifest.ts + docs/design-system.md).
-- Upload objects to bucket `brand-assets` named like `logo-claude.svg`
-- (flat at the bucket root; PNG when unavoidable, e.g. `logo-lovable@2x.png`).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'brand-assets',
  'brand-assets',
  true,
  524288,
  array['image/svg+xml', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read for logo assets (authenticated app + CDN-style URLs).
create policy "brand_assets_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'brand-assets');

-- Curators/admins upload (extend when roles are wired; open to authenticated for MVP seeding).
create policy "brand_assets_authenticated_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'brand-assets');

create policy "brand_assets_authenticated_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'brand-assets');

create policy "brand_assets_authenticated_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'brand-assets');
