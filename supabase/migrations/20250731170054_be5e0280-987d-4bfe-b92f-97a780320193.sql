-- Create actions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  assignee TEXT NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue')),
  meeting_title TEXT,
  meeting_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.actions ENABLE ROW LEVEL SECURITY;

-- Create policies for actions
CREATE POLICY "Users can view actions for their company" 
ON public.actions 
FOR SELECT 
USING (
  company_id = get_user_company_id() AND 
  check_user_permission('read')
);

CREATE POLICY "Users can create actions for their company" 
ON public.actions 
FOR INSERT 
WITH CHECK (
  company_id = get_user_company_id() AND 
  check_user_permission('edit')
);

CREATE POLICY "Users can update actions for their company" 
ON public.actions 
FOR UPDATE 
USING (
  company_id = get_user_company_id() AND 
  check_user_permission('edit')
);

CREATE POLICY "Users can delete actions for their company" 
ON public.actions 
FOR DELETE 
USING (
  company_id = get_user_company_id() AND 
  check_user_permission('edit')
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_actions_updated_at
BEFORE UPDATE ON public.actions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_actions_due_date ON public.actions(due_date);
CREATE INDEX idx_actions_company_id ON public.actions(company_id);
CREATE INDEX idx_actions_status ON public.actions(status);