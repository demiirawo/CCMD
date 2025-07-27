-- Create staff_documents_analytics table
CREATE TABLE public.staff_documents_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE,
  active_fully_compliant INTEGER NOT NULL DEFAULT 0,
  active_pending_documents INTEGER NOT NULL DEFAULT 0,
  onboarding_pending_documents INTEGER NOT NULL DEFAULT 0,
  onboarding_fully_compliant INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(meeting_id)
);

-- Enable Row Level Security
ALTER TABLE public.staff_documents_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (matching other analytics tables)
CREATE POLICY "Anyone can view staff documents analytics" 
ON public.staff_documents_analytics 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create staff documents analytics" 
ON public.staff_documents_analytics 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update staff documents analytics" 
ON public.staff_documents_analytics 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete staff documents analytics" 
ON public.staff_documents_analytics 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_staff_documents_analytics_updated_at
BEFORE UPDATE ON public.staff_documents_analytics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();