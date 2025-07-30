-- Create Demo Client company
INSERT INTO public.companies (id, name, services, theme_color, logo_url) 
VALUES (
  'demo-client-12345678-1234-1234-1234-123456789012'::uuid,
  'Demo Client',
  ARRAY['Supported Living', 'Personal Care', 'Domiciliary Care', 'Respite Care'],
  '#e11d48',
  NULL
);

-- Create a demo profile for the company (this would normally be done when a user signs up)
-- We'll create a dummy user profile to associate with this company
INSERT INTO public.profiles (id, user_id, username, role, company_id) 
VALUES (
  'demo-profile-12345678-1234-1234-1234-123456789012'::uuid,
  'demo-user-12345678-1234-1234-1234-123456789012'::uuid,
  'demo_admin',
  'admin',
  'demo-client-12345678-1234-1234-1234-123456789012'::uuid
);

-- Populate Care Plan Analytics with 12 months of data showing improvement
INSERT INTO public.care_plan_analytics (id, company_id, monthly_data, frequencies, created_at, updated_at) 
VALUES (
  gen_random_uuid(),
  'demo-client-12345678-1234-1234-1234-123456789012'::uuid,
  '[
    {"month": "2024-01", "reviewed": 45, "overdue": 12, "compliant": 33, "issues": ["Multiple care plans not updated after incidents", "Risk assessments outdated"]},
    {"month": "2024-02", "reviewed": 48, "overdue": 10, "compliant": 38, "issues": ["Improvement in updating frequency", "Still some legacy issues"]},
    {"month": "2024-03", "reviewed": 52, "overdue": 8, "compliant": 44, "issues": ["Better tracking systems implemented"]},
    {"month": "2024-04", "reviewed": 55, "overdue": 6, "compliant": 49, "issues": ["Staff training showing results"]},
    {"month": "2024-05", "reviewed": 58, "overdue": 5, "compliant": 53, "issues": ["Continued improvement"]},
    {"month": "2024-06", "reviewed": 60, "overdue": 4, "compliant": 56, "issues": ["Q2 review showing positive trends"]},
    {"month": "2024-07", "reviewed": 62, "overdue": 3, "compliant": 59, "issues": ["New processes embedding well"]},
    {"month": "2024-08", "reviewed": 65, "overdue": 2, "compliant": 63, "issues": ["Significant improvement noted"]},
    {"month": "2024-09", "reviewed": 67, "overdue": 2, "compliant": 65, "issues": ["Maintaining high standards"]},
    {"month": "2024-10", "reviewed": 70, "overdue": 1, "compliant": 69, "issues": ["Excellent progress"]},
    {"month": "2024-11", "reviewed": 72, "overdue": 1, "compliant": 71, "issues": ["Consistently meeting targets"]},
    {"month": "2024-12", "reviewed": 75, "overdue": 0, "compliant": 75, "issues": ["Full compliance achieved"]}
  ]'::jsonb,
  '{"weekly": 15, "monthly": 35, "quarterly": 25}'::jsonb,
  '2024-01-01 00:00:00+00'::timestamp with time zone,
  now()
);

-- Populate Incidents Analytics showing decrease over time
INSERT INTO public.incidents_analytics (id, company_id, monthly_data, created_at, updated_at) 
VALUES (
  gen_random_uuid(),
  'demo-client-12345678-1234-1234-1234-123456789012'::uuid,
  '[
    {"month": "2024-01", "total": 18, "serious": 5, "minor": 13, "safeguarding": 3, "types": ["Physical altercation", "Medication error", "Safeguarding concern", "Fall"]},
    {"month": "2024-02", "total": 16, "serious": 4, "minor": 12, "safeguarding": 2, "types": ["Medication error", "Safeguarding concern", "Fall", "Verbal incident"]},
    {"month": "2024-03", "total": 14, "serious": 3, "minor": 11, "safeguarding": 2, "types": ["Fall", "Medication error", "Safeguarding concern"]},
    {"month": "2024-04", "total": 12, "serious": 2, "minor": 10, "safeguarding": 1, "types": ["Fall", "Medication error", "Minor injury"]},
    {"month": "2024-05", "total": 10, "serious": 2, "minor": 8, "safeguarding": 1, "types": ["Fall", "Medication error"]},
    {"month": "2024-06", "total": 9, "serious": 1, "minor": 8, "safeguarding": 0, "types": ["Fall", "Minor injury"]},
    {"month": "2024-07", "total": 8, "serious": 1, "minor": 7, "safeguarding": 0, "types": ["Fall", "Minor injury"]},
    {"month": "2024-08", "total": 7, "serious": 0, "minor": 7, "safeguarding": 0, "types": ["Fall", "Minor injury"]},
    {"month": "2024-09", "total": 6, "serious": 0, "minor": 6, "safeguarding": 0, "types": ["Fall", "Minor injury"]},
    {"month": "2024-10", "total": 5, "serious": 0, "minor": 5, "safeguarding": 0, "types": ["Fall"]},
    {"month": "2024-11", "total": 4, "serious": 0, "minor": 4, "safeguarding": 0, "types": ["Fall"]},
    {"month": "2024-12", "total": 3, "serious": 0, "minor": 3, "safeguarding": 0, "types": ["Fall"]}
  ]'::jsonb,
  '2024-01-01 00:00:00+00'::timestamp with time zone,
  now()
);

-- Populate Staff Training Analytics showing improvement
INSERT INTO public.staff_training_analytics (id, company_id, training_data, created_at, updated_at) 
VALUES (
  gen_random_uuid(),
  'demo-client-12345678-1234-1234-1234-123456789012'::uuid,
  '{
    "overall_compliance": 85,
    "mandatory_training": {
      "safeguarding": {"completed": 45, "total": 50, "percentage": 90},
      "medication": {"completed": 47, "total": 50, "percentage": 94},
      "health_safety": {"completed": 44, "total": 50, "percentage": 88},
      "moving_handling": {"completed": 46, "total": 50, "percentage": 92},
      "infection_control": {"completed": 48, "total": 50, "percentage": 96}
    },
    "specialist_training": {
      "dementia_care": {"completed": 32, "total": 40, "percentage": 80},
      "mental_health": {"completed": 28, "total": 35, "percentage": 80},
      "learning_disabilities": {"completed": 30, "total": 38, "percentage": 79}
    },
    "overdue_staff": [
      {"name": "J. Smith", "overdue_courses": ["Safeguarding Level 2"], "days_overdue": 15},
      {"name": "M. Johnson", "overdue_courses": ["Health & Safety Update"], "days_overdue": 8},
      {"name": "L. Brown", "overdue_courses": ["Moving & Handling"], "days_overdue": 3}
    ],
    "recent_improvements": [
      "Implemented new training tracking system",
      "Increased safeguarding training frequency",
      "Added refresher courses for incident prevention"
    ]
  }'::jsonb,
  '2024-01-01 00:00:00+00'::timestamp with time zone,
  now()
);

-- Populate Staff Documents Analytics
INSERT INTO public.staff_documents_analytics (id, company_id, documents_data, created_at, updated_at) 
VALUES (
  gen_random_uuid(),
  'demo-client-12345678-1234-1234-1234-123456789012'::uuid,
  '{
    "total_staff": 50,
    "compliance_rate": 88,
    "document_types": {
      "dbs_checks": {"compliant": 47, "total": 50, "overdue": 3, "percentage": 94},
      "right_to_work": {"compliant": 50, "total": 50, "overdue": 0, "percentage": 100},
      "training_certificates": {"compliant": 45, "total": 50, "overdue": 5, "percentage": 90},
      "references": {"compliant": 48, "total": 50, "overdue": 2, "percentage": 96},
      "health_declarations": {"compliant": 44, "total": 50, "overdue": 6, "percentage": 88},
      "contracts": {"compliant": 50, "total": 50, "overdue": 0, "percentage": 100}
    },
    "overdue_items": [
      {"staff_name": "A. Wilson", "document": "DBS Renewal", "days_overdue": 12},
      {"staff_name": "B. Taylor", "document": "Training Certificate", "days_overdue": 8},
      {"staff_name": "C. Davis", "document": "Health Declaration", "days_overdue": 5}
    ],
    "recent_actions": [
      "Implemented digital document management system",
      "Set up automated renewal reminders",
      "Conducted comprehensive document audit"
    ]
  }'::jsonb,
  '2024-01-01 00:00:00+00'::timestamp with time zone,
  now()
);

-- Populate Supervision Analytics
INSERT INTO public.supervision_analytics (id, company_id, monthly_data, metrics, created_at, updated_at) 
VALUES (
  gen_random_uuid(),
  'demo-client-12345678-1234-1234-1234-123456789012'::uuid,
  '[
    {"month": "2024-01", "completed": 35, "scheduled": 50, "overdue": 15, "percentage": 70},
    {"month": "2024-02", "completed": 38, "scheduled": 50, "overdue": 12, "percentage": 76},
    {"month": "2024-03", "completed": 42, "scheduled": 50, "overdue": 8, "percentage": 84},
    {"month": "2024-04", "completed": 45, "scheduled": 50, "overdue": 5, "percentage": 90},
    {"month": "2024-05", "completed": 46, "scheduled": 50, "overdue": 4, "percentage": 92},
    {"month": "2024-06", "completed": 47, "scheduled": 50, "overdue": 3, "percentage": 94},
    {"month": "2024-07", "completed": 48, "scheduled": 50, "overdue": 2, "percentage": 96},
    {"month": "2024-08", "completed": 48, "scheduled": 50, "overdue": 2, "percentage": 96},
    {"month": "2024-09", "completed": 49, "scheduled": 50, "overdue": 1, "percentage": 98},
    {"month": "2024-10", "completed": 49, "scheduled": 50, "overdue": 1, "percentage": 98},
    {"month": "2024-11", "completed": 50, "scheduled": 50, "overdue": 0, "percentage": 100},
    {"month": "2024-12", "completed": 50, "scheduled": 50, "overdue": 0, "percentage": 100}
  ]'::jsonb,
  '{
    "average_duration": 45,
    "quality_ratings": {"excellent": 15, "good": 28, "adequate": 6, "inadequate": 1},
    "key_themes": ["Safeguarding awareness improvement", "Incident reduction strategies", "Professional development"],
    "action_plans": 12,
    "completed_actions": 10
  }'::jsonb,
  '2024-01-01 00:00:00+00'::timestamp with time zone,
  now()
);

-- Populate Spot Check Analytics
INSERT INTO public.spot_check_analytics (id, company_id, monthly_data, metrics, created_at, updated_at) 
VALUES (
  gen_random_uuid(),
  'demo-client-12345678-1234-1234-1234-123456789012'::uuid,
  '[
    {"month": "2024-01", "completed": 25, "planned": 30, "issues_found": 12, "percentage": 83},
    {"month": "2024-02", "completed": 27, "planned": 30, "issues_found": 10, "percentage": 90},
    {"month": "2024-03", "completed": 28, "planned": 30, "issues_found": 8, "percentage": 93},
    {"month": "2024-04", "completed": 29, "planned": 30, "issues_found": 6, "percentage": 97},
    {"month": "2024-05", "completed": 30, "planned": 30, "issues_found": 5, "percentage": 100},
    {"month": "2024-06", "completed": 30, "planned": 30, "issues_found": 4, "percentage": 100},
    {"month": "2024-07", "completed": 30, "planned": 30, "issues_found": 3, "percentage": 100},
    {"month": "2024-08", "completed": 30, "planned": 30, "issues_found": 2, "percentage": 100},
    {"month": "2024-09", "completed": 30, "planned": 30, "issues_found": 2, "percentage": 100},
    {"month": "2024-10", "completed": 30, "planned": 30, "issues_found": 1, "percentage": 100},
    {"month": "2024-11", "completed": 30, "planned": 30, "issues_found": 1, "percentage": 100},
    {"month": "2024-12", "completed": 30, "planned": 30, "issues_found": 0, "percentage": 100}
  ]'::jsonb,
  '{
    "total_checks": 350,
    "average_score": 4.2,
    "improvement_areas": ["Documentation quality", "Infection control", "Person-centered care"],
    "strengths": ["Staff attitude", "Environment cleanliness", "Medication management"],
    "trends": "Consistent improvement in all areas following enhanced training program"
  }'::jsonb,
  '2024-01-01 00:00:00+00'::timestamp with time zone,
  now()
);

-- Populate Feedback Analytics
INSERT INTO public.feedback_analytics (id, company_id, monthly_data, created_at, updated_at) 
VALUES (
  gen_random_uuid(),
  'demo-client-12345678-1234-1234-1234-123456789012'::uuid,
  '[
    {"month": "2024-01", "total_responses": 45, "satisfaction": 3.2, "complaints": 8, "compliments": 5},
    {"month": "2024-02", "total_responses": 48, "satisfaction": 3.4, "complaints": 6, "compliments": 8},
    {"month": "2024-03", "total_responses": 52, "satisfaction": 3.6, "complaints": 5, "compliments": 12},
    {"month": "2024-04", "total_responses": 55, "satisfaction": 3.8, "complaints": 4, "compliments": 15},
    {"month": "2024-05", "total_responses": 58, "satisfaction": 4.0, "complaints": 3, "compliments": 18},
    {"month": "2024-06", "total_responses": 60, "satisfaction": 4.1, "complaints": 2, "compliments": 22},
    {"month": "2024-07", "total_responses": 62, "satisfaction": 4.2, "complaints": 2, "compliments": 25},
    {"month": "2024-08", "total_responses": 65, "satisfaction": 4.3, "complaints": 1, "compliments": 28},
    {"month": "2024-09", "total_responses": 67, "satisfaction": 4.4, "complaints": 1, "compliments": 30},
    {"month": "2024-10", "total_responses": 70, "satisfaction": 4.5, "complaints": 0, "compliments": 32},
    {"month": "2024-11", "total_responses": 72, "satisfaction": 4.6, "complaints": 0, "compliments": 35},
    {"month": "2024-12", "total_responses": 75, "satisfaction": 4.7, "complaints": 0, "compliments": 38}
  ]'::jsonb,
  '2024-01-01 00:00:00+00'::timestamp with time zone,
  now()
);