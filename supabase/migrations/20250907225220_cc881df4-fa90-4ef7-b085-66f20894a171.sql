-- Create workspaces table
CREATE TABLE public.workspaces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  icon TEXT DEFAULT '📁',
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS on workspaces
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- Create policies for workspaces
CREATE POLICY "Users can view company workspaces" 
ON public.workspaces 
FOR SELECT 
USING ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can create company workspaces" 
ON public.workspaces 
FOR INSERT 
WITH CHECK ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can update company workspaces" 
ON public.workspaces 
FOR UPDATE 
USING ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can delete company workspaces" 
ON public.workspaces 
FOR DELETE 
USING ((company_id = get_user_company_id()) OR is_admin());

-- Add workspace_id column to base_tables
ALTER TABLE public.base_tables 
ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL;

-- Create a default workspace for existing tables
INSERT INTO public.workspaces (company_id, name, description, icon, position)
SELECT DISTINCT company_id, 'General', 'Default workspace for tables', '📁', 0
FROM public.base_tables
WHERE company_id IS NOT NULL;

-- Update existing tables to belong to the default workspace
UPDATE public.base_tables 
SET workspace_id = (
  SELECT w.id 
  FROM public.workspaces w 
  WHERE w.company_id = base_tables.company_id 
  AND w.name = 'General'
  LIMIT 1
)
WHERE workspace_id IS NULL;

-- Create trigger for automatic timestamp updates on workspaces
CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();