-- FILE: supabase/seed.sql
-- Run this in Supabase SQL Editor AFTER you have a registered user
-- Replace 'YOUR_USER_ID' with your actual auth.users UUID

DO $$
DECLARE
  v_user_id uuid := 'YOUR_USER_ID'; -- paste from Supabase Auth > Users
  v_student_id uuid;
BEGIN
  -- Insert student
  INSERT INTO students (user_id, name, branch, year, phone)
  VALUES (v_user_id, 'Aarush', 'CSE (AIML)', 3, '9876543210')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_student_id;

  IF v_student_id IS NULL THEN
    SELECT id INTO v_student_id FROM students WHERE user_id = v_user_id LIMIT 1;
  END IF;

  -- Insert 4 demo tasks
  INSERT INTO tasks (student_id, title, subject, deadline, reminder_time, add_to_calendar) VALUES
  (v_student_id, 'ER Diagram Assignment', 'DBMS',
    now() + interval '2 days', now() + interval '1 day', true),
  (v_student_id, 'Process Scheduling Lab Report', 'OS',
    now() + interval '4 days', now() + interval '3 days', true),
  (v_student_id, 'Subnet Design Exercise', 'CN',
    now() + interval '6 days', now() + interval '5 days', true),
  (v_student_id, 'Linear Regression Mini Project', 'ML',
    now() + interval '8 days', now() + interval '7 days', true);

  RAISE NOTICE 'Seed complete. Student ID: %', v_student_id;
END $$;
