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
  v_show_results boolean;
  v_details jsonb := '[]'::jsonb;
BEGIN
  SELECT * INTO v_test FROM tests WHERE id = p_test_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Test not found';
  END IF;

  v_show_results := COALESCE((v_test.settings->>'showResults')::boolean, true);

  FOR v_q IN SELECT * FROM jsonb_array_elements(v_test.questions)
  LOOP
    v_total := v_total + 1;
    v_correct := v_q->>'correctAnswer';
    v_ans := p_answers->>(v_q->>'id');
    
    IF v_ans = v_correct THEN
      v_score := v_score + 1;
      IF v_show_results THEN
        v_details := v_details || jsonb_build_object('id', v_q->>'id', 'correct', true, 'correctAnswer', v_correct, 'studentAnswer', v_ans);
      END IF;
    ELSE
      IF v_show_results THEN
        v_details := v_details || jsonb_build_object('id', v_q->>'id', 'correct', false, 'correctAnswer', v_correct, 'studentAnswer', v_ans);
      END IF;
    END IF;
  END LOOP;

  INSERT INTO submissions (test_id, student_name, answers, score, total_questions, student_fingerprint)
  VALUES (p_test_id, p_student, p_answers, v_score, v_total, p_student_fingerprint);

  IF v_show_results THEN
    RETURN json_build_object('score', v_score, 'total', v_total, 'details', v_details);
  ELSE
    RETURN json_build_object('score', v_score, 'total', v_total);
  END IF;
END;
$$;
