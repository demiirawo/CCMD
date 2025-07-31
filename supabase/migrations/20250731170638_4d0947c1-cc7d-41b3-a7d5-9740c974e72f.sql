-- Create a test action due tomorrow for Demi
INSERT INTO actions (
  title,
  assignee,
  due_date,
  status,
  company_id,
  meeting_title,
  meeting_date
) VALUES (
  'Test Action Reminder - Review quarterly report',
  'Demi Irawo',
  (CURRENT_DATE + INTERVAL '1 day')::date,
  'pending',
  (SELECT id FROM companies LIMIT 1),
  'Test Meeting',
  CURRENT_DATE
);

-- Ensure there's a team member record for Demi if it doesn't exist
INSERT INTO team_members (
  name,
  email,
  company_id,
  permission
) VALUES (
  'Demi Irawo',
  'demi.irawo@care-cuddle.co.uk',
  (SELECT id FROM companies LIMIT 1),
  'company_admin'::user_permission
)
ON CONFLICT (email, company_id) DO NOTHING;