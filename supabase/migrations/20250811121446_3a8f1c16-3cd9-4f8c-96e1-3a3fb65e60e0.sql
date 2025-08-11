-- Ensure RLS and policies so all users linked to a company can view and edit that company’s dashboard data

-- Subsection data (RAG statuses, observations, metadata)
ALTER TABLE IF EXISTS public.subsection_data ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Company users can read subsection_data"
  ON public.subsection_data
  FOR SELECT
  USING (company_id = ANY (public.get_user_accessible_company_ids()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Company users can insert subsection_data"
  ON public.subsection_data
  FOR INSERT
  WITH CHECK (company_id = ANY (public.get_user_accessible_company_ids()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Company users can update subsection_data"
  ON public.subsection_data
  FOR UPDATE
  USING (company_id = ANY (public.get_user_accessible_company_ids()))
  WITH CHECK (company_id = ANY (public.get_user_accessible_company_ids()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Company users can delete subsection_data"
  ON public.subsection_data
  FOR DELETE
  USING (company_id = ANY (public.get_user_accessible_company_ids()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- Actions log (actions created from subsections)
ALTER TABLE IF EXISTS public.actions_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Company users can read actions_log"
  ON public.actions_log
  FOR SELECT
  USING (company_id = ANY (public.get_user_accessible_company_ids()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Company users can insert actions_log"
  ON public.actions_log
  FOR INSERT
  WITH CHECK (company_id = ANY (public.get_user_accessible_company_ids()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Company users can update actions_log"
  ON public.actions_log
  FOR UPDATE
  USING (company_id = ANY (public.get_user_accessible_company_ids()))
  WITH CHECK (company_id = ANY (public.get_user_accessible_company_ids()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Company users can delete actions_log"
  ON public.actions_log
  FOR DELETE
  USING (company_id = ANY (public.get_user_accessible_company_ids()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- Key documents section
ALTER TABLE IF EXISTS public.key_documents ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Company users can read key_documents"
  ON public.key_documents
  FOR SELECT
  USING (company_id = ANY (public.get_user_accessible_company_ids()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Company users can insert key_documents"
  ON public.key_documents
  FOR INSERT
  WITH CHECK (company_id = ANY (public.get_user_accessible_company_ids()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Company users can update key_documents"
  ON public.key_documents
  FOR UPDATE
  USING (company_id = ANY (public.get_user_accessible_company_ids()))
  WITH CHECK (company_id = ANY (public.get_user_accessible_company_ids()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Company users can delete key_documents"
  ON public.key_documents
  FOR DELETE
  USING (company_id = ANY (public.get_user_accessible_company_ids()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- Meeting headers (title, attendees, purpose, date)
ALTER TABLE IF EXISTS public.meeting_headers ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Company users can read meeting_headers"
  ON public.meeting_headers
  FOR SELECT
  USING (company_id = ANY (public.get_user_accessible_company_ids()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Company users can insert meeting_headers"
  ON public.meeting_headers
  FOR INSERT
  WITH CHECK (company_id = ANY (public.get_user_accessible_company_ids()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Company users can update meeting_headers"
  ON public.meeting_headers
  FOR UPDATE
  USING (company_id = ANY (public.get_user_accessible_company_ids()))
  WITH CHECK (company_id = ANY (public.get_user_accessible_company_ids()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Company users can delete meeting_headers"
  ON public.meeting_headers
  FOR DELETE
  USING (company_id = ANY (public.get_user_accessible_company_ids()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;