create extension if not exists pgcrypto;

create table if not exists public.reviews (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    author text not null,
    series text default '',
    genre text not null,
    date_finished date,
    rating integer not null default 0 check (rating between 0 and 5),
    review_body text not null,
    created_at timestamptz not null default timezone('utc'::text, now()),
    updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.writing_entries (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    category text not null check (category in ('stories', 'random-thoughts')),
    type text not null check (type in ('image', 'docx')),
    file_name text not null,
    file_path text not null unique,
    file_url text not null,
    preview text,
    full_text text,
    html text,
    created_at timestamptz not null default timezone('utc'::text, now()),
    updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.writing_comments (
    id uuid primary key default gen_random_uuid(),
    writing_entry_id uuid not null references public.writing_entries(id) on delete cascade,
    parent_id uuid references public.writing_comments(id) on delete cascade,
    text text not null,
    created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.song_of_the_day (
    id integer primary key check (id = 1),
    track_id text not null,
    updated_at timestamptz not null default timezone('utc'::text, now())
);

insert into public.song_of_the_day (id, track_id)
values (1, '11dFghVXANMlKmJXsNCbNl')
on conflict (id) do nothing;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$;

drop trigger if exists reviews_set_updated_at on public.reviews;
create trigger reviews_set_updated_at
before update on public.reviews
for each row
execute function public.set_updated_at();

drop trigger if exists writing_entries_set_updated_at on public.writing_entries;
create trigger writing_entries_set_updated_at
before update on public.writing_entries
for each row
execute function public.set_updated_at();

alter table public.reviews enable row level security;
alter table public.writing_entries enable row level security;
alter table public.writing_comments enable row level security;
alter table public.song_of_the_day enable row level security;

drop policy if exists "Public can read reviews" on public.reviews;
create policy "Public can read reviews"
on public.reviews
for select
to anon, authenticated
using (true);

drop policy if exists "Authenticated users can manage reviews" on public.reviews;
create policy "Authenticated users can manage reviews"
on public.reviews
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Public can read writing entries" on public.writing_entries;
create policy "Public can read writing entries"
on public.writing_entries
for select
to anon, authenticated
using (true);

drop policy if exists "Authenticated users can manage writing entries" on public.writing_entries;
create policy "Authenticated users can manage writing entries"
on public.writing_entries
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Public can read writing comments" on public.writing_comments;
create policy "Public can read writing comments"
on public.writing_comments
for select
to anon, authenticated
using (true);

drop policy if exists "Anyone can add writing comments" on public.writing_comments;
create policy "Anyone can add writing comments"
on public.writing_comments
for insert
to anon, authenticated
with check (true);

drop policy if exists "Authenticated users can delete writing comments" on public.writing_comments;
create policy "Authenticated users can delete writing comments"
on public.writing_comments
for delete
to authenticated
using (true);

drop policy if exists "Public can read song of the day" on public.song_of_the_day;
create policy "Public can read song of the day"
on public.song_of_the_day
for select
to anon, authenticated
using (true);

drop policy if exists "Authenticated users can manage song of the day" on public.song_of_the_day;
create policy "Authenticated users can manage song of the day"
on public.song_of_the_day
for all
to authenticated
using (true)
with check (true);

insert into storage.buckets (id, name, public)
values ('writing-files', 'writing-files', true)
on conflict (id) do nothing;

drop policy if exists "Public can read writing files" on storage.objects;
create policy "Public can read writing files"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'writing-files');

drop policy if exists "Authenticated users can upload writing files" on storage.objects;
create policy "Authenticated users can upload writing files"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'writing-files');

drop policy if exists "Authenticated users can update writing files" on storage.objects;
create policy "Authenticated users can update writing files"
on storage.objects
for update
to authenticated
using (bucket_id = 'writing-files')
with check (bucket_id = 'writing-files');

drop policy if exists "Authenticated users can delete writing files" on storage.objects;
create policy "Authenticated users can delete writing files"
on storage.objects
for delete
to authenticated
using (bucket_id = 'writing-files');
