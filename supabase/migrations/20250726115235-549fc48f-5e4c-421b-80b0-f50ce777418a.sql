-- Create meetings table to store meeting iterations
CREATE TABLE public.meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  title TEXT NOT NULL,
  attendees JSONB NOT NULL DEFAULT '[]'::jsonb,
  purpose TEXT,
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  actions_log JSONB NOT NULL DEFAULT '[]'::jsonb,
  quarter TEXT NOT NULL,
  year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since no auth is implemented yet)
CREATE POLICY "Anyone can view meetings" 
ON public.meetings 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create meetings" 
ON public.meetings 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update meetings" 
ON public.meetings 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete meetings" 
ON public.meetings 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_meetings_updated_at
BEFORE UPDATE ON public.meetings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for efficient quarter/year queries
CREATE INDEX idx_meetings_quarter_year ON public.meetings(year, quarter);
CREATE INDEX idx_meetings_date ON public.meetings(date DESC);