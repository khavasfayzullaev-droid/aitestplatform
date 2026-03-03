-- EdTest CRM Supabase Schema (Multi-Tenant RLS)

create extension if not exists "uuid-ossp";

-- 1. Users Table (Mapped exclusively to Teachers via trigger or direct insert)
create table public.users (
  id uuid references auth.users not null primary key,
  full_name text,
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.users enable row level security;
create policy "Users can view own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);

-- 2. Folders Table
create table public.folders (
  id uuid default uuid_generate_v4() primary key,
  teacher_id uuid references public.users(id) on delete cascade not null default auth.uid(),
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.folders enable row level security;
create policy "Teachers can manage own folders" on public.folders for all using (auth.uid() = teacher_id);

-- 3. Tests Table (Isolated by user_id)
create table public.tests (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null default auth.uid(),
  folder_id uuid references public.folders(id) on delete set null,
  title text not null,
  questions jsonb not null default '[]'::jsonb, -- Array of Questions {id, text, options, correctAnswer}
  timer_minutes integer default 20,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  show_answers boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.tests enable row level security;
-- Only the owner teacher can view/edit the test fully natively.
create policy "Teachers can manage own tests" on public.tests for all using (auth.uid() = user_id);

-- NO SELECT POLICY FOR STUDENTS ON 'tests' TABLE! 
-- Reason: To prevent students from looking at the raw JSON and finding 'correctAnswer' using network devtools.
-- Instead, students will fetch safe test data via a Supabase Edge Function or custom Postgres RPC function.

-- 4. Submissions Table (Results)
create table public.submissions (
  id uuid default uuid_generate_v4() primary key,
  test_id uuid references public.tests(id) on delete cascade not null,
  student_name text not null,
  score integer default 0,
  total_questions integer default 0,
  answers jsonb not null default '{}'::jsonb, -- Student's answers
  cheat_strikes integer default 0,
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  submitted_at timestamp with time zone,
  
  -- Anti-cheat: One attempt per name per test
  unique(test_id, student_name)
);

alter table public.submissions enable row level security;
-- Teachers can view submissions ONLY for their own tests
create policy "Teachers can view submissions for their tests" on public.submissions 
  for select using (
    exists (select 1 from public.tests where id = public.submissions.test_id and user_id = auth.uid())
  );
-- Students (anon) can insert their submissions
create policy "Students can insert submissions" on public.submissions for insert with check (true);

-- Teachers can delete submissions for their tests
create policy "Teachers can delete submissions for their tests" on public.submissions 
  for delete using (
    exists (select 1 from public.tests where id = public.submissions.test_id and user_id = auth.uid())
  );
