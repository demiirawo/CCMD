-- Create spot_check_analytics table
CREATE TABLE public.spot_check_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID,
  passed_frequency INTEGER NOT NULL DEFAULT 3,
  probation_frequency INTEGER NOT NULL DEFAULT 1,
  monthly_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.spot_check_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Anyone can view spot check analytics" 
ON public.spot_check_analytics 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create spot check analytics" 
ON public.spot_check_analytics 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update spot check analytics" 
ON public.spot_check_analytics 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete spot check analytics" 
ON public.spot_check_analytics 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_spot_check_analytics_updated_at
BEFORE UPDATE ON public.spot_check_analytics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();