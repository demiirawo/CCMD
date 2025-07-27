-- Create table for resourcing analytics data
CREATE TABLE public.resourcing_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  onboarding_staff INTEGER NOT NULL DEFAULT 0,
  probation_staff INTEGER NOT NULL DEFAULT 0,
  current_staff INTEGER NOT NULL DEFAULT 0,
  ideal_staff INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(meeting_id, month)
);

-- Enable Row Level Security
ALTER TABLE public.resourcing_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for resourcing analytics
CREATE POLICY "Anyone can view resourcing analytics" 
ON public.resourcing_analytics 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create resourcing analytics" 
ON public.resourcing_analytics 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update resourcing analytics" 
ON public.resourcing_analytics 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete resourcing analytics" 
ON public.resourcing_analytics 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_resourcing_analytics_updated_at
BEFORE UPDATE ON public.resourcing_analytics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();