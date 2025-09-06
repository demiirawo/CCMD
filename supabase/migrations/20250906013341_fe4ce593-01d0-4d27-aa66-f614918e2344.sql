-- Create tables for Base functionality
CREATE TABLE public.base_tables (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  icon text DEFAULT '📋',
  color text DEFAULT '#3b82f6',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  settings jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.base_tables ENABLE ROW LEVEL SECURITY;

-- Create policies for base_tables
CREATE POLICY "Users can view company base tables" 
ON public.base_tables 
FOR SELECT 
USING ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can create company base tables" 
ON public.base_tables 
FOR INSERT 
WITH CHECK ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can update company base tables" 
ON public.base_tables 
FOR UPDATE 
USING ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can delete company base tables" 
ON public.base_tables 
FOR DELETE 
USING ((company_id = get_user_company_id()) OR is_admin());

-- Create table for field definitions
CREATE TABLE public.base_fields (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_id uuid NOT NULL REFERENCES public.base_tables(id) ON DELETE CASCADE,
  name text NOT NULL,
  field_type text NOT NULL,
  field_config jsonb DEFAULT '{}'::jsonb,
  is_required boolean DEFAULT false,
  position integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.base_fields ENABLE ROW LEVEL SECURITY;

-- Create policies for base_fields
CREATE POLICY "Users can view base fields through table access" 
ON public.base_fields 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.base_tables bt 
  WHERE bt.id = base_fields.table_id 
  AND ((bt.company_id = get_user_company_id()) OR is_admin())
));

CREATE POLICY "Users can create base fields through table access" 
ON public.base_fields 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.base_tables bt 
  WHERE bt.id = base_fields.table_id 
  AND ((bt.company_id = get_user_company_id()) OR is_admin())
));

CREATE POLICY "Users can update base fields through table access" 
ON public.base_fields 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.base_tables bt 
  WHERE bt.id = base_fields.table_id 
  AND ((bt.company_id = get_user_company_id()) OR is_admin())
));

CREATE POLICY "Users can delete base fields through table access" 
ON public.base_fields 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.base_tables bt 
  WHERE bt.id = base_fields.table_id 
  AND ((bt.company_id = get_user_company_id()) OR is_admin())
));

-- Create table for records
CREATE TABLE public.base_records (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_id uuid NOT NULL REFERENCES public.base_tables(id) ON DELETE CASCADE,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  deleted_at timestamp with time zone,
  position integer DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.base_records ENABLE ROW LEVEL SECURITY;

-- Create policies for base_records
CREATE POLICY "Users can view base records through table access" 
ON public.base_records 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.base_tables bt 
  WHERE bt.id = base_records.table_id 
  AND ((bt.company_id = get_user_company_id()) OR is_admin())
));

CREATE POLICY "Users can create base records through table access" 
ON public.base_records 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.base_tables bt 
  WHERE bt.id = base_records.table_id 
  AND ((bt.company_id = get_user_company_id()) OR is_admin())
));

CREATE POLICY "Users can update base records through table access" 
ON public.base_records 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.base_tables bt 
  WHERE bt.id = base_records.table_id 
  AND ((bt.company_id = get_user_company_id()) OR is_admin())
));

CREATE POLICY "Users can delete base records through table access" 
ON public.base_records 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.base_tables bt 
  WHERE bt.id = base_records.table_id 
  AND ((bt.company_id = get_user_company_id()) OR is_admin())
));

-- Create table for views
CREATE TABLE public.base_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_id uuid NOT NULL REFERENCES public.base_tables(id) ON DELETE CASCADE,
  name text NOT NULL,
  view_type text DEFAULT 'grid',
  filters jsonb DEFAULT '[]'::jsonb,
  sorts jsonb DEFAULT '[]'::jsonb,
  groups jsonb DEFAULT '[]'::jsonb,
  visible_fields jsonb DEFAULT '[]'::jsonb,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  is_default boolean DEFAULT false
);

-- Enable RLS
ALTER TABLE public.base_views ENABLE ROW LEVEL SECURITY;

-- Create policies for base_views
CREATE POLICY "Users can view base views through table access" 
ON public.base_views 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.base_tables bt 
  WHERE bt.id = base_views.table_id 
  AND ((bt.company_id = get_user_company_id()) OR is_admin())
));

CREATE POLICY "Users can create base views through table access" 
ON public.base_views 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.base_tables bt 
  WHERE bt.id = base_views.table_id 
  AND ((bt.company_id = get_user_company_id()) OR is_admin())
));

CREATE POLICY "Users can update base views through table access" 
ON public.base_views 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.base_tables bt 
  WHERE bt.id = base_views.table_id 
  AND ((bt.company_id = get_user_company_id()) OR is_admin())
));

CREATE POLICY "Users can delete base views through table access" 
ON public.base_views 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.base_tables bt 
  WHERE bt.id = base_views.table_id 
  AND ((bt.company_id = get_user_company_id()) OR is_admin())
));

-- Create triggers for updated_at
CREATE TRIGGER update_base_tables_updated_at
BEFORE UPDATE ON public.base_tables
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_base_fields_updated_at
BEFORE UPDATE ON public.base_fields
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_base_records_updated_at
BEFORE UPDATE ON public.base_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_base_views_updated_at
BEFORE UPDATE ON public.base_views
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();