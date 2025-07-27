-- Create staff_training_analytics table
CREATE TABLE public.staff_training_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID,
  mandatory_pending INTEGER NOT NULL DEFAULT 0,
  mandatory_compliant INTEGER NOT NULL DEFAULT 0,
  specialist_pending INTEGER NOT NULL DEFAULT 0,
  specialist_compliant INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(meeting_id)
);

-- Enable Row Level Security
ALTER TABLE public.staff_training_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (matching other analytics tables)
CREATE POLICY "Anyone can view staff training analytics" 
ON public.staff_training_analytics 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create staff training analytics" 
ON public.staff_training_analytics 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update staff training analytics" 
ON public.staff_training_analytics 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete staff training analytics" 
ON public.staff_training_analytics 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_staff_training_analytics_updated_at
BEFORE UPDATE ON public.staff_training_analytics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();