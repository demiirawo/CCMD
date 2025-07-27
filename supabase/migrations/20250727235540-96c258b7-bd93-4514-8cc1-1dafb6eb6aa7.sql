-- Create a table to store subsection data (comments, actions, metadata) persistently
CREATE TABLE public.subsection_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  section_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  observation TEXT DEFAULT '',
  actions JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, section_id, item_id)
);

-- Enable Row Level Security
ALTER TABLE public.subsection_data ENABLE ROW LEVEL SECURITY;

-- Create policies for subsection data
CREATE POLICY "Users can view company subsection data" 
ON public.subsection_data 
FOR SELECT 
USING ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can create company subsection data" 
ON public.subsection_data 
FOR INSERT 
WITH CHECK ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can update company subsection data" 
ON public.subsection_data 
FOR UPDATE 
USING ((company_id = get_user_company_id()) OR is_admin());

CREATE POLICY "Users can delete company subsection data" 
ON public.subsection_data 
FOR DELETE 
USING ((company_id = get_user_company_id()) OR is_admin());

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_subsection_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_subsection_data_updated_at
BEFORE UPDATE ON public.subsection_data
FOR EACH ROW
EXECUTE FUNCTION public.update_subsection_data_updated_at();