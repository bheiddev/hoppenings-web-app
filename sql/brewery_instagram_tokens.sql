-- Hoppenings: Instagram tokens per brewery (Meta long-lived tokens)
-- Apply in Supabase SQL editor or via migrations.

create table if not exists public.brewery_instagram_tokens (
  id uuid not null default gen_random_uuid (),
  brewery_id uuid null,
  access_token text not null,
  expires_at timestamp with time zone not null,
  instagram_account_id text not null,
  facebook_page_id text not null,
  connected_at timestamp with time zone not null default now(),
  last_refreshed_at timestamp with time zone not null default now(),
  status text not null default 'active',
  constraint brewery_instagram_tokens_pkey primary key (id)
);

create index if not exists brewery_instagram_tokens_status_expires_at_idx
  on public.brewery_instagram_tokens (status, expires_at);

