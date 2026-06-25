-- FILE: supabase/schema.sql
-- Run this first in Supabase SQL Editor

-- Students
create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  branch text,
  year int,
  subjects text,
  phone text,
  created_at timestamptz default now()
);

-- Tasks
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  title text not null,
  subject text,
  deadline timestamptz not null,
  reminder_time timestamptz,
  add_to_calendar boolean default true,
  created_at timestamptz default now()
);

-- RLS
alter table students enable row level security;
alter table tasks enable row level security;

create policy "own student row"
  on students for all using (auth.uid() = user_id);

create policy "own tasks"
  on tasks for all using (
    student_id in (select id from students where user_id = auth.uid())
  );
