-- Create shared_tables table for managing shared table access
CREATE TABLE public.shared_tables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_id UUID NOT NULL REFERENCES public.base_tables(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'base64url'),
  share_type TEXT NOT NULL CHECK (share_type IN ('public', 'password', 'embed')),
  password_hash TEXT, -- Only used for password-protected shares
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.shared_tables ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create shared tables for their company's tables" 
ON public.shared_tables 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.base_tables bt 
    WHERE bt.id = table_id 
    AND bt.company_id = get_user_company_id()
  )
);

CREATE POLICY "Users can view shared tables for their company's tables" 
ON public.shared_tables 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.base_tables bt 
    WHERE bt.id = table_id 
    AND bt.company_id = get_user_company_id()
  )
);

CREATE POLICY "Users can update shared tables for their company's tables" 
ON public.shared_tables 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.base_tables bt 
    WHERE bt.id = table_id 
    AND bt.company_id = get_user_company_id()
  )
);

CREATE POLICY "Users can delete shared tables for their company's tables" 
ON public.shared_tables 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.base_tables bt 
    WHERE bt.id = table_id 
    AND bt.company_id = get_user_company_id()
  )
);

-- Create index for performance
CREATE INDEX idx_shared_tables_token ON public.shared_tables(share_token);
CREATE INDEX idx_shared_tables_table_id ON public.shared_tables(table_id);