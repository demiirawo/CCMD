-- First, find the Ofsted panel ID
DO $$
DECLARE
    ofsted_panel_id uuid;
    category_id uuid;
BEGIN
    -- Get the Ofsted panel ID
    SELECT id INTO ofsted_panel_id 
    FROM public.inspection_panels 
    WHERE name = 'Ofsted (Supported Accomodation For Age 16-17)';
    
    IF ofsted_panel_id IS NULL THEN
        RAISE EXCEPTION 'Ofsted panel not found';
    END IF;

    -- Quality and purpose of care
    INSERT INTO public.inspection_categories (panel_id, name) 
    VALUES (ofsted_panel_id, 'Quality and purpose of care') 
    RETURNING id INTO category_id;
    
    INSERT INTO public.inspection_evidence (category_id, evidence_text) VALUES
    (category_id, 'Children receive individualised care and support that enables them to develop their identity and sense of belonging.'),
    (category_id, 'Children are safe and feel safe in the home. They understand how to stay safe and are helped to develop strategies to keep themselves safe.'),
    (category_id, 'Children develop their self-esteem, confidence and resilience. They are supported to overcome past harm and trauma.'),
    (category_id, 'The design and purpose of the service meets children''s needs and helps them to achieve their potential.');

    -- How well children and young people are helped and protected  
    INSERT INTO public.inspection_categories (panel_id, name) 
    VALUES (ofsted_panel_id, 'How well children and young people are helped and protected') 
    RETURNING id INTO category_id;
    
    INSERT INTO public.inspection_evidence (category_id, evidence_text) VALUES
    (category_id, 'Staff recognise and respond to safeguarding concerns effectively and work collaboratively with partner agencies.'),
    (category_id, 'Staff promote positive behaviour and use de-escalation techniques effectively.'),
    (category_id, 'Staff know the children well and understand their individual vulnerabilities and risks.'),
    (category_id, 'Children understand the complaints process and feel confident to make complaints.'),
    (category_id, 'Staff follow safer recruitment procedures and receive appropriate training in safeguarding.');

    -- The effectiveness of leaders and managers
    INSERT INTO public.inspection_categories (panel_id, name) 
    VALUES (ofsted_panel_id, 'The effectiveness of leaders and managers') 
    RETURNING id INTO category_id;
    
    INSERT INTO public.inspection_evidence (category_id, evidence_text) VALUES
    (category_id, 'Leaders have a clear vision for the service and demonstrate strong leadership skills.'),
    (category_id, 'Staff receive regular supervision, training and professional development opportunities.'),
    (category_id, 'The service has robust quality assurance systems and improvement planning.'),
    (category_id, 'Leaders engage effectively with partner agencies and stakeholders.'),
    (category_id, 'Staff retention and recruitment strategies are effective.');

    -- Care planning
    INSERT INTO public.inspection_categories (panel_id, name) 
    VALUES (ofsted_panel_id, 'Care planning') 
    RETURNING id INTO category_id;
    
    INSERT INTO public.inspection_evidence (category_id, evidence_text) VALUES
    (category_id, 'Each child has a comprehensive care plan that identifies their needs and outlines how these will be met.'),
    (category_id, 'Care plans are regularly reviewed and updated to reflect changing needs and circumstances.'),
    (category_id, 'Children are actively involved in their care planning and decision-making about their care.'),
    (category_id, 'Care plans demonstrate effective partnership working with placing authorities and other professionals.');

    -- Reviewing the child's progress
    INSERT INTO public.inspection_categories (panel_id, name) 
    VALUES (ofsted_panel_id, 'Reviewing the child''s progress') 
    RETURNING id INTO category_id;
    
    INSERT INTO public.inspection_evidence (category_id, evidence_text) VALUES
    (category_id, 'Regular reviews take place to assess children''s progress against their care plan goals.'),
    (category_id, 'Children are prepared for and actively participate in their reviews.'),
    (category_id, 'Review outcomes lead to appropriate changes in care and support arrangements.'),
    (category_id, 'Independent reviewing officers provide effective oversight and challenge.');

    -- Consultation with children, their parents and other persons
    INSERT INTO public.inspection_categories (panel_id, name) 
    VALUES (ofsted_panel_id, 'Consultation with children, their parents and other persons') 
    RETURNING id INTO category_id;
    
    INSERT INTO public.inspection_evidence (category_id, evidence_text) VALUES
    (category_id, 'Children are regularly consulted about all aspects of their care and their views are acted upon.'),
    (category_id, 'Parents and family members are involved in planning and decision-making where appropriate.'),
    (category_id, 'Children have access to independent advocacy services.'),
    (category_id, 'Feedback from children, families and professionals is used to improve services.');

    -- Contact with family and friends
    INSERT INTO public.inspection_categories (panel_id, name) 
    VALUES (ofsted_panel_id, 'Contact with family and friends') 
    RETURNING id INTO category_id;
    
    INSERT INTO public.inspection_evidence (category_id, evidence_text) VALUES
    (category_id, 'Children are supported to maintain appropriate contact with family and friends.'),
    (category_id, 'Contact arrangements are clearly recorded and regularly reviewed.'),
    (category_id, 'Staff support children to manage complex family relationships and emotions.'),
    (category_id, 'Children are helped to develop and maintain positive relationships with their network.');

    -- Preparation for adulthood and independence
    INSERT INTO public.inspection_categories (panel_id, name) 
    VALUES (ofsted_panel_id, 'Preparation for adulthood and independence') 
    RETURNING id INTO category_id;
    
    INSERT INTO public.inspection_evidence (category_id, evidence_text) VALUES
    (category_id, 'Children receive age-appropriate preparation for independent living.'),
    (category_id, 'Young people are supported to develop practical life skills including budgeting, cooking and self-care.'),
    (category_id, 'Transition planning begins early and involves multi-agency working.'),
    (category_id, 'Young people receive ongoing support after leaving the service.');

    -- Working in partnership
    INSERT INTO public.inspection_categories (panel_id, name) 
    VALUES (ofsted_panel_id, 'Working in partnership') 
    RETURNING id INTO category_id;
    
    INSERT INTO public.inspection_evidence (category_id, evidence_text) VALUES
    (category_id, 'Staff work effectively with placing social workers and other professionals.'),
    (category_id, 'Information sharing arrangements are effective and support good outcomes for children.'),
    (category_id, 'The service contributes effectively to multi-agency planning and decision-making.'),
    (category_id, 'Partnership working leads to improved outcomes for children.');

    -- Leadership and management
    INSERT INTO public.inspection_categories (panel_id, name) 
    VALUES (ofsted_panel_id, 'Leadership and management') 
    RETURNING id INTO category_id;
    
    INSERT INTO public.inspection_evidence (category_id, evidence_text) VALUES
    (category_id, 'Leaders understand the strengths and areas for development of the service.'),
    (category_id, 'There is effective oversight of staff practice and performance.'),
    (category_id, 'Quality assurance processes identify areas for improvement and lead to action.'),
    (category_id, 'Leaders promote a positive culture that puts children at the centre of practice.');

END $$;