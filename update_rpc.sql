CREATE OR REPLACE FUNCTION public.submit_test(
  p_test_id uuid,
  p_student text,
  p_answers jsonb,
  p_student_fingerprint text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_test tests%ROWTYPE;
  v_score int := 0;
  v_total int := 0;
  v_q jsonb;
  v_ans text;
  v_correct text;
BEGIN
  SELECT * INTO v_test FROM tests WHERE id = p_test_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Test not found';
  END IF;

  FOR v_q IN SELECT * FROM jsonb_array_elements(v_test.questions)
  LOOP
    v_total := v_total + 1;
    v_correct := v_q->>'correctAnswer';
    v_ans := p_answers->>(v_q->>'id');
    IF v_ans = v_correct THEN
      v_score := v_score + 1;
    END IF;
  END LOOP;

  INSERT INTO submissions (test_id, student_name, answers, score, total_questions, student_fingerprint)
  VALUES (p_test_id, p_student, p_answers, v_score, v_total, p_student_fingerprint);

  RETURN json_build_object('score', v_score, 'total', v_total);
END;
$$;
