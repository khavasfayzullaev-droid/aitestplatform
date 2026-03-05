-- Test Media Storage Bucket
-- Run in Supabase SQL Editor

insert into storage.buckets (id, name, public) 
values ('test_media', 'test_media', true)
on conflict (id) do nothing;

-- Anyone can view/download media
create policy "Public read test_media"
on storage.objects for select
using (bucket_id = 'test_media');

-- Authenticated teachers can upload
create policy "Auth users upload test_media"
on storage.objects for insert 
to authenticated 
with check (bucket_id = 'test_media');

-- Authenticated teachers can delete their uploads
create policy "Auth users delete test_media"
on storage.objects for delete
to authenticated
using (bucket_id = 'test_media');
