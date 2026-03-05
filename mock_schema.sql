-- Mock Exam Module: Database Schema
-- Run this in Supabase SQL Editor

-- 1. Mock Sessions (Teacher creates these)
create table public.mock_sessions (
  id uuid default uuid_generate_v4() primary key,
  teacher_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  title text not null,
  listening_test_id uuid references public.tests(id) on delete set null,
  reading_test_id uuid references public.tests(id) on delete set null,
  listening_minutes integer default 30,
  reading_minutes integer default 60,
  writing_minutes integer default 60,
  writing_prompt text default '',
  speaking_enabled boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.mock_sessions enable row level security;
create policy "Teachers manage own mock sessions" on public.mock_sessions for all using (auth.uid() = teacher_id);

-- 2. Mock Results (Student submissions)
create table public.mock_results (
  id uuid default uuid_generate_v4() primary key,
  mock_session_id uuid references public.mock_sessions(id) on delete cascade not null,
  student_name text not null,
  student_fingerprint text,

  -- Listening
  listening_answers jsonb default '{}'::jsonb,
  listening_score integer default 0,
  listening_total integer default 0,

  -- Reading
  reading_answers jsonb default '{}'::jsonb,
  reading_score integer default 0,
  reading_total integer default 0,

  -- Writing
  writing_text text default '',
  writing_score numeric(3,1),        -- Teacher grades 0-9
  writing_feedback text default '',

  -- Speaking
  speaking_score numeric(3,1),       -- Teacher grades 0-9
  speaking_feedback text default '',

  -- Overall
  overall_band numeric(3,1),
  current_section text default 'listening' check (current_section in ('listening', 'reading', 'writing', 'finished')),
  status text default 'in_progress' check (status in ('in_progress', 'finished', 'graded')),

  time_remaining_listening integer,  -- seconds left (for resume)
  time_remaining_reading integer,
  time_remaining_writing integer,

  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  submitted_at timestamp with time zone,

  unique(mock_session_id, student_name)
);

alter table public.mock_results enable row level security;

-- Teachers can view/update results for their own mock sessions
create policy "Teachers view mock results" on public.mock_results
  for select using (
    exists (select 1 from public.mock_sessions where id = mock_session_id and teacher_id = auth.uid())
  );

create policy "Teachers update mock results" on public.mock_results
  for update using (
    exists (select 1 from public.mock_sessions where id = mock_session_id and teacher_id = auth.uid())
  );

-- Students can insert their results
create policy "Students insert mock results" on public.mock_results
  for insert with check (true);

-- Students can update their own results (for auto-save)
create policy "Students update own mock results" on public.mock_results
  for update using (true);

-----------------------------------------------------------
-- RPC: Get Mock Session data for student (safe, no answers)
-----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_mock_for_student(query_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_mock mock_sessions%ROWTYPE;
  v_listening_test tests%ROWTYPE;
  v_reading_test tests%ROWTYPE;
  v_listening_qs jsonb := '[]'::jsonb;
  v_reading_qs jsonb := '[]'::jsonb;
  v_q jsonb;
  v_safe_opts jsonb;
BEGIN
  SELECT * INTO v_mock FROM mock_sessions WHERE id = query_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mock session not found';
  END IF;

  -- Get listening test questions (strip correctAnswer)
  IF v_mock.listening_test_id IS NOT NULL THEN
    SELECT * INTO v_listening_test FROM tests WHERE id = v_mock.listening_test_id;
    IF FOUND THEN
      FOR v_q IN SELECT * FROM jsonb_array_elements(v_listening_test.questions)
      LOOP
        v_listening_qs := v_listening_qs || jsonb_build_object(
          'id', v_q->>'id',
          'question', v_q->>'question',
          'options', v_q->'options',
          'mediaUrl', v_q->>'mediaUrl',
          'mediaType', v_q->>'mediaType'
        );
      END LOOP;
    END IF;
  END IF;

  -- Get reading test questions (strip correctAnswer)
  IF v_mock.reading_test_id IS NOT NULL THEN
    SELECT * INTO v_reading_test FROM tests WHERE id = v_mock.reading_test_id;
    IF FOUND THEN
      FOR v_q IN SELECT * FROM jsonb_array_elements(v_reading_test.questions)
      LOOP
        v_reading_qs := v_reading_qs || jsonb_build_object(
          'id', v_q->>'id',
          'question', v_q->>'question',
          'options', v_q->'options'
        );
      END LOOP;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'id', v_mock.id,
    'title', v_mock.title,
    'listening_minutes', v_mock.listening_minutes,
    'reading_minutes', v_mock.reading_minutes,
    'writing_minutes', v_mock.writing_minutes,
    'writing_prompt', v_mock.writing_prompt,
    'speaking_enabled', v_mock.speaking_enabled,
    'listening_questions', v_listening_qs,
    'reading_questions', v_reading_qs,
    'reading_passage', COALESCE(v_reading_test.settings->>'passage', '')
  );
END;
$$;

-----------------------------------------------------------
-- RPC: Submit a mock section (Listening or Reading)
-----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_mock_section(
  p_mock_id uuid,
  p_student text,
  p_section text,
  p_answers jsonb,
  p_student_fingerprint text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_mock mock_sessions%ROWTYPE;
  v_test tests%ROWTYPE;
  v_score int := 0;
  v_total int := 0;
  v_q jsonb;
  v_ans text;
  v_correct text;
  v_result_id uuid;
  v_next_section text;
BEGIN
  SELECT * INTO v_mock FROM mock_sessions WHERE id = p_mock_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Mock not found'; END IF;

  -- Get the right test
  IF p_section = 'listening' THEN
    SELECT * INTO v_test FROM tests WHERE id = v_mock.listening_test_id;
    v_next_section := 'reading';
  ELSIF p_section = 'reading' THEN
    SELECT * INTO v_test FROM tests WHERE id = v_mock.reading_test_id;
    v_next_section := 'writing';
  ELSE
    RAISE EXCEPTION 'Invalid section';
  END IF;

  IF NOT FOUND THEN RAISE EXCEPTION 'Test not found for section'; END IF;

  -- Grade
  FOR v_q IN SELECT * FROM jsonb_array_elements(v_test.questions)
  LOOP
    v_total := v_total + 1;
    v_correct := v_q->>'correctAnswer';
    v_ans := p_answers->>(v_q->>'id');
    IF v_ans = v_correct THEN
      v_score := v_score + 1;
    END IF;
  END LOOP;

  -- Upsert result
  INSERT INTO mock_results (mock_session_id, student_name, student_fingerprint,
    listening_answers, listening_score, listening_total,
    reading_answers, reading_score, reading_total,
    current_section)
  VALUES (p_mock_id, p_student, p_student_fingerprint,
    CASE WHEN p_section = 'listening' THEN p_answers ELSE '{}'::jsonb END,
    CASE WHEN p_section = 'listening' THEN v_score ELSE 0 END,
    CASE WHEN p_section = 'listening' THEN v_total ELSE 0 END,
    CASE WHEN p_section = 'reading' THEN p_answers ELSE '{}'::jsonb END,
    CASE WHEN p_section = 'reading' THEN v_score ELSE 0 END,
    CASE WHEN p_section = 'reading' THEN v_total ELSE 0 END,
    v_next_section)
  ON CONFLICT (mock_session_id, student_name) DO UPDATE SET
    listening_answers = CASE WHEN p_section = 'listening' THEN p_answers ELSE mock_results.listening_answers END,
    listening_score = CASE WHEN p_section = 'listening' THEN v_score ELSE mock_results.listening_score END,
    listening_total = CASE WHEN p_section = 'listening' THEN v_total ELSE mock_results.listening_total END,
    reading_answers = CASE WHEN p_section = 'reading' THEN p_answers ELSE mock_results.reading_answers END,
    reading_score = CASE WHEN p_section = 'reading' THEN v_score ELSE mock_results.reading_score END,
    reading_total = CASE WHEN p_section = 'reading' THEN v_total ELSE mock_results.reading_total END,
    current_section = v_next_section
  RETURNING id INTO v_result_id;

  RETURN jsonb_build_object('score', v_score, 'total', v_total, 'next_section', v_next_section);
END;
$$;

-----------------------------------------------------------
-- RPC: Submit Writing section
-----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_mock_writing(
  p_mock_id uuid,
  p_student text,
  p_writing_text text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE mock_results
  SET writing_text = p_writing_text,
      current_section = 'finished',
      status = 'finished',
      submitted_at = now()
  WHERE mock_session_id = p_mock_id AND student_name = p_student;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mock result not found for this student';
  END IF;

  RETURN jsonb_build_object('status', 'finished');
END;
$$;
