-- Create inspection panels table (global, super admin only)
CREATE TABLE public.inspection_panels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  rating TEXT NOT NULL DEFAULT 'G',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inspection categories table (global, super admin only)
CREATE TABLE public.inspection_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  panel_id UUID NOT NULL REFERENCES public.inspection_panels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inspection evidence table (global, super admin only)
CREATE TABLE public.inspection_evidence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.inspection_categories(id) ON DELETE CASCADE,
  evidence_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inspection company responses table (company-specific)
CREATE TABLE public.inspection_company_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  evidence_id UUID NOT NULL REFERENCES public.inspection_evidence(id) ON DELETE CASCADE,
  comment TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'green',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, evidence_id)
);

-- Enable RLS on all tables
ALTER TABLE public.inspection_panels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_company_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inspection_panels
CREATE POLICY "Super admin can manage panels" ON public.inspection_panels
FOR ALL USING (is_super_admin());

CREATE POLICY "All authenticated users can view panels" ON public.inspection_panels
FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS Policies for inspection_categories
CREATE POLICY "Super admin can manage categories" ON public.inspection_categories
FOR ALL USING (is_super_admin());

CREATE POLICY "All authenticated users can view categories" ON public.inspection_categories
FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS Policies for inspection_evidence
CREATE POLICY "Super admin can manage evidence" ON public.inspection_evidence
FOR ALL USING (is_super_admin());

CREATE POLICY "All authenticated users can view evidence" ON public.inspection_evidence
FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS Policies for inspection_company_responses
CREATE POLICY "Users can view their company responses" ON public.inspection_company_responses
FOR SELECT USING ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can create their company responses" ON public.inspection_company_responses
FOR INSERT WITH CHECK ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can update their company responses" ON public.inspection_company_responses
FOR UPDATE USING ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can delete their company responses" ON public.inspection_company_responses
FOR DELETE USING ((company_id = get_user_company_id()) OR is_admin());

-- Create update triggers
CREATE TRIGGER update_inspection_panels_updated_at
BEFORE UPDATE ON public.inspection_panels
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inspection_categories_updated_at
BEFORE UPDATE ON public.inspection_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inspection_evidence_updated_at
BEFORE UPDATE ON public.inspection_evidence
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inspection_company_responses_updated_at
BEFORE UPDATE ON public.inspection_company_responses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default panels
INSERT INTO public.inspection_panels (name, rating) VALUES
('SAFE', 'G'),
('EFFECTIVE', 'G'),
('RESPONSIVE', 'G'),
('WELL LED', 'G'),
('CARING', 'G');