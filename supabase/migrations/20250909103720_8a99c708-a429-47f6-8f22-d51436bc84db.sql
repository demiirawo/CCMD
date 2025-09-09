-- Create a table to track active user sessions per company
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  browser_tab_id TEXT NOT NULL,
  last_active TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Unique constraint: one active session per user-company pair
  UNIQUE(user_id, company_id, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own sessions" ON public.user_sessions
FOR ALL USING (user_id = auth.uid());

-- Index for performance
CREATE INDEX idx_user_sessions_active ON public.user_sessions (user_id, is_active, last_active) WHERE is_active = TRUE;

-- Function to invalidate other company sessions for a user
CREATE OR REPLACE FUNCTION public.invalidate_other_company_sessions(
  p_user_id UUID,
  p_company_id UUID,
  p_current_session_token TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Invalidate all active sessions for this user in other companies
  UPDATE public.user_sessions 
  SET is_active = FALSE, 
      last_active = NOW()
  WHERE user_id = p_user_id 
    AND company_id != p_company_id 
    AND is_active = TRUE
    AND session_token != p_current_session_token;
    
  -- Also invalidate any other sessions in the same company (multiple tab protection)
  UPDATE public.user_sessions 
  SET is_active = FALSE, 
      last_active = NOW()
  WHERE user_id = p_user_id 
    AND company_id = p_company_id 
    AND is_active = TRUE
    AND session_token != p_current_session_token;
END;
$$;

-- Function to cleanup old inactive sessions (older than 24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_old_sessions()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.user_sessions 
  WHERE is_active = FALSE 
    AND last_active < NOW() - INTERVAL '24 hours';
END;
$$;