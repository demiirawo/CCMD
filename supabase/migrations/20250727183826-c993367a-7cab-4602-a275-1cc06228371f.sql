-- Create supervision_analytics table
CREATE TABLE public.supervision_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID UNIQUE,
  passed_frequency INTEGER NOT NULL DEFAULT 2,
  probation_frequency INTEGER NOT NULL DEFAULT 1,
  monthly_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.supervision_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Anyone can view supervision analytics" 
ON public.supervision_analytics 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create supervision analytics" 
ON public.supervision_analytics 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update supervision analytics" 
ON public.supervision_analytics 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete supervision analytics" 
ON public.supervision_analytics 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_supervision_analytics_updated_at
BEFORE UPDATE ON public.supervision_analytics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();