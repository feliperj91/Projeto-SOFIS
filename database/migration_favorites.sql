-- Create table for storing user specific favorites
create table if not exists user_favorites (
  id uuid default gen_random_uuid() primary key,
  username text not null,
  client_id uuid not null references clients(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(username, client_id)
);

-- RLS Policies
alter table user_favorites enable row level security;

-- Allow all for now since we rely on username matching in query
create policy "Enable all access for authenticated users" 
on user_favorites for all 
using (true) 
with check (true);
