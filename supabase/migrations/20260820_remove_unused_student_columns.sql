-- Remove legacy students columns that are not used by the current application.
-- Active KidShield profile, attendance, tag, and notification fields remain unchanged.
alter table public.students
  drop column if exists qr_code_id,
  drop column if exists student_name,
  drop column if exists date_of_birth,
  drop column if exists age,
  drop column if exists guardian_name,
  drop column if exists relationship,
  drop column if exists contact_number,
  drop column if exists email;
