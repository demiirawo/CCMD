-- Create service_subsection_tags table for configuring tags per service and subsection
CREATE TABLE IF NOT EXISTS public.service_subsection_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service text NOT NULL,
  section_id text NOT NULL,
  item_id text NOT NULL,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE(service, section_id, item_id)
);

-- Enable RLS
ALTER TABLE public.service_subsection_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "All authenticated users can read service tags"
  ON public.service_subsection_tags
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admin can manage service tags"
  ON public.service_subsection_tags
  FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Create index for efficient lookups
CREATE INDEX idx_service_subsection_tags_lookup 
  ON public.service_subsection_tags(service, section_id, item_id);

-- Add trigger for updated_at
CREATE TRIGGER update_service_subsection_tags_updated_at
  BEFORE UPDATE ON public.service_subsection_tags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();