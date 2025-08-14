-- Update Wura's profile to assign her to Spring Fountain company
UPDATE profiles 
SET company_id = '4a34870b-dc6e-40b8-8f43-6f69c9584ce3',
    team_member_id = 'dd77a1d1-7dd1-4dce-875a-4fbbb1d35692'
WHERE user_id = 'a221fa5f-64c8-402a-960f-d4356d216dab';

-- Create user_companies link for this user (simple insert since there's no unique constraint)
INSERT INTO user_companies (user_id, team_member_id, company_id, is_active)
VALUES ('a221fa5f-64c8-402a-960f-d4356d216dab', 'dd77a1d1-7dd1-4dce-875a-4fbbb1d35692', '4a34870b-dc6e-40b8-8f43-6f69c9584ce3', true);