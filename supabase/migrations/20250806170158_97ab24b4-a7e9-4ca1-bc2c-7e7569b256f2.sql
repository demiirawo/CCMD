-- Create CQC checklist categories table
CREATE TABLE public.cqc_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_name TEXT NOT NULL,
  category_name TEXT NOT NULL,
  section_order INTEGER NOT NULL,
  category_order INTEGER NOT NULL,
  company_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, section_name, category_name)
);

-- Create CQC evidence table
CREATE TABLE public.cqc_evidence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.cqc_categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  explanation TEXT NOT NULL,
  rag_status TEXT NOT NULL DEFAULT 'green',
  comment TEXT DEFAULT '',
  last_reviewed TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  company_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_rag_status CHECK (rag_status IN ('green', 'amber', 'red'))
);

-- Enable RLS
ALTER TABLE public.cqc_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cqc_evidence ENABLE ROW LEVEL SECURITY;

-- Create policies for cqc_categories
CREATE POLICY "Users can view their company CQC categories"
ON public.cqc_categories
FOR SELECT
USING ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Company admins can create CQC categories"
ON public.cqc_categories
FOR INSERT
WITH CHECK (
  ((company_id = get_user_company_id()) AND check_user_permission('company_admin'::user_permission)) 
  OR is_admin()
);

CREATE POLICY "Company admins can update CQC categories"
ON public.cqc_categories
FOR UPDATE
USING (
  ((company_id = get_user_company_id()) AND check_user_permission('company_admin'::user_permission)) 
  OR is_admin()
);

CREATE POLICY "Company admins can delete CQC categories"
ON public.cqc_categories
FOR DELETE
USING (
  ((company_id = get_user_company_id()) AND check_user_permission('company_admin'::user_permission)) 
  OR is_admin()
);

-- Create policies for cqc_evidence
CREATE POLICY "Users can view their company CQC evidence"
ON public.cqc_evidence
FOR SELECT
USING ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Company admins can create CQC evidence"
ON public.cqc_evidence
FOR INSERT
WITH CHECK (
  ((company_id = get_user_company_id()) AND check_user_permission('company_admin'::user_permission)) 
  OR is_admin()
);

CREATE POLICY "Company admins can fully update CQC evidence"
ON public.cqc_evidence
FOR UPDATE
USING (
  ((company_id = get_user_company_id()) AND check_user_permission('company_admin'::user_permission)) 
  OR is_admin()
);

CREATE POLICY "Users can update CQC evidence status and comments"
ON public.cqc_evidence
FOR UPDATE
USING ((company_id = get_user_company_id()) AND check_user_permission('read'::user_permission));

CREATE POLICY "Company admins can delete CQC evidence"
ON public.cqc_evidence
FOR DELETE
USING (
  ((company_id = get_user_company_id()) AND check_user_permission('company_admin'::user_permission)) 
  OR is_admin()
);

-- Create trigger for updating timestamps
CREATE TRIGGER update_cqc_categories_updated_at
BEFORE UPDATE ON public.cqc_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cqc_evidence_updated_at
BEFORE UPDATE ON public.cqc_evidence
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default CQC categories for all existing companies
DO $$
DECLARE
    company_record RECORD;
    category_data RECORD;
BEGIN
    -- Define the CQC sections and categories
    FOR company_record IN SELECT id FROM public.companies LOOP
        -- SAFE section
        INSERT INTO public.cqc_categories (section_name, category_name, section_order, category_order, company_id) VALUES
        ('SAFE', 'Learning culture', 1, 1, company_record.id),
        ('SAFE', 'Safe systems, pathways and transitions', 1, 2, company_record.id),
        ('SAFE', 'Safeguarding', 1, 3, company_record.id),
        ('SAFE', 'Involving people to manage risks', 1, 4, company_record.id),
        ('SAFE', 'Safe environments', 1, 5, company_record.id),
        ('SAFE', 'Safe and effective staffing', 1, 6, company_record.id),
        ('SAFE', 'Infection prevention and control', 1, 7, company_record.id),
        ('SAFE', 'Medicines optimisation', 1, 8, company_record.id),
        
        -- EFFECTIVE section
        ('EFFECTIVE', 'Assessing needs', 2, 1, company_record.id),
        ('EFFECTIVE', 'Delivering evidence based care', 2, 2, company_record.id),
        ('EFFECTIVE', 'How teams work together', 2, 3, company_record.id),
        ('EFFECTIVE', 'Supporting healthier lives', 2, 4, company_record.id),
        ('EFFECTIVE', 'Monitoring and improving outcomes', 2, 5, company_record.id),
        ('EFFECTIVE', 'Consent to care and treatment', 2, 6, company_record.id),
        
        -- CARING section
        ('CARING', 'Kindness, compassion and dignity', 3, 1, company_record.id),
        ('CARING', 'Treating people as individuals', 3, 2, company_record.id),
        ('CARING', 'Independence, choice and control', 3, 3, company_record.id),
        ('CARING', 'Responding to immediate needs', 3, 4, company_record.id),
        ('CARING', 'Workforce wellbeing', 3, 5, company_record.id),
        
        -- RESPONSIVE section
        ('RESPONSIVE', 'Person-centred care', 4, 1, company_record.id),
        ('RESPONSIVE', 'Care provision, integration and continuity', 4, 2, company_record.id),
        ('RESPONSIVE', 'Providing information', 4, 3, company_record.id),
        ('RESPONSIVE', 'Listening and involving people', 4, 4, company_record.id),
        ('RESPONSIVE', 'Equity in access', 4, 5, company_record.id),
        ('RESPONSIVE', 'Equity in experiences and outcomes', 4, 6, company_record.id),
        ('RESPONSIVE', 'Planning for the future', 4, 7, company_record.id),
        
        -- WELL LED section
        ('WELL-LED', 'Shared direction and culture', 5, 1, company_record.id),
        ('WELL-LED', 'Capable, compassionate leaders', 5, 2, company_record.id),
        ('WELL-LED', 'Freedom to speak up', 5, 3, company_record.id),
        ('WELL-LED', 'Workforce equality and inclusion', 5, 4, company_record.id),
        ('WELL-LED', 'Governance and sustainability', 5, 5, company_record.id),
        ('WELL-LED', 'Partnerships and communities', 5, 6, company_record.id),
        ('WELL-LED', 'Learning, improvement, innovation', 5, 7, company_record.id),
        ('WELL-LED', 'Environmental sustainability', 5, 8, company_record.id);
    END LOOP;
END $$;