-- First, create the missing user_companies record for Winside Care
-- We need to find or create a team_member record for this user in Winside Care

-- Check if team member exists for this user in Winside Care
DO $$ 
DECLARE
    winside_company_id uuid := '6c4456eb-be64-44e6-8abb-0fad7dc28489';
    user_id_val uuid := 'fea9786d-29c7-46db-bc80-f1e862c11d3d';
    team_member_id_val uuid;
    existing_user_company_count int;
BEGIN
    -- Check if team member exists for this user in Winside Care
    SELECT id INTO team_member_id_val 
    FROM team_members 
    WHERE company_id = winside_company_id 
    AND email = 'demi.irawo@care-cuddle.co.uk';
    
    -- If no team member exists, create one
    IF team_member_id_val IS NULL THEN
        INSERT INTO team_members (company_id, name, email, permission)
        VALUES (winside_company_id, 'Demi', 'demi.irawo@care-cuddle.co.uk', 'company_admin')
        RETURNING id INTO team_member_id_val;
    END IF;
    
    -- Check if user_companies record already exists
    SELECT COUNT(*) INTO existing_user_company_count
    FROM user_companies 
    WHERE user_id = user_id_val AND company_id = winside_company_id;
    
    -- If no user_companies record exists, create one
    IF existing_user_company_count = 0 THEN
        -- First deactivate all other companies for this user
        UPDATE user_companies 
        SET is_active = false 
        WHERE user_id = user_id_val;
        
        -- Create active record for Winside Care
        INSERT INTO user_companies (user_id, team_member_id, company_id, is_active)
        VALUES (user_id_val, team_member_id_val, winside_company_id, true);
    ELSE
        -- If record exists but not active, activate it
        UPDATE user_companies 
        SET is_active = false 
        WHERE user_id = user_id_val;
        
        UPDATE user_companies 
        SET is_active = true 
        WHERE user_id = user_id_val AND company_id = winside_company_id;
    END IF;
END $$;