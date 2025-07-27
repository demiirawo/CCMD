-- Create care_plan_analytics table
CREATE TABLE public.care_plan_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID UNIQUE,
  total_service_users INTEGER NOT NULL DEFAULT 0,
  care_plans_in_date INTEGER NOT NULL DEFAULT 0,
  care_plans_overdue INTEGER NOT NULL DEFAULT 0,
  risk_assessments_in_date INTEGER NOT NULL DEFAULT 0,
  risk_assessments_overdue INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.care_plan_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Anyone can view care plan analytics" 
ON public.care_plan_analytics 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create care plan analytics" 
ON public.care_plan_analytics 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update care plan analytics" 
ON public.care_plan_analytics 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete care plan analytics" 
ON public.care_plan_analytics 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_care_plan_analytics_updated_at
BEFORE UPDATE ON public.care_plan_analytics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();