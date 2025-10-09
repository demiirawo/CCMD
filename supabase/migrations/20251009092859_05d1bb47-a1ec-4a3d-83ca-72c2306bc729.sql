-- Create a global subsection evidence linkage table
CREATE TABLE IF NOT EXISTS public.global_subsection_evidence (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id text NOT NULL,
  item_id text NOT NULL,
  linked_evidence_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE(section_id, item_id)
);

-- Enable RLS
ALTER TABLE public.global_subsection_evidence ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read global evidence linkage
CREATE POLICY "All authenticated users can read global evidence linkage"
  ON public.global_subsection_evidence
  FOR SELECT
  TO authenticated
  USING (true);

-- Only super admin can insert/update/delete
CREATE POLICY "Super admin can manage global evidence linkage"
  ON public.global_subsection_evidence
  FOR ALL
  TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Create trigger for updated_at
CREATE TRIGGER update_global_subsection_evidence_updated_at
  BEFORE UPDATE ON public.global_subsection_evidence
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_global_subsection_evidence_section_item 
  ON public.global_subsection_evidence(section_id, item_id);