-- Create companies table
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('admin', 'user');

-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'user',
  username TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Enable RLS on profiles  
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get user's company_id
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT company_id FROM public.profiles WHERE user_id = auth.uid();
$$;

-- Create security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- RLS Policies for companies
CREATE POLICY "Admins can view all companies" 
ON public.companies 
FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Admins can create companies" 
ON public.companies 
FOR INSERT 
WITH CHECK (public.is_admin());

CREATE POLICY "Users can view their company" 
ON public.companies 
FOR SELECT 
USING (id = public.get_user_company_id());

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Update existing analytics tables to include company_id
ALTER TABLE public.meetings ADD COLUMN company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.care_plan_analytics ADD COLUMN company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.resourcing_analytics ADD COLUMN company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.spot_check_analytics ADD COLUMN company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.staff_documents_analytics ADD COLUMN company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.staff_training_analytics ADD COLUMN company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.supervision_analytics ADD COLUMN company_id UUID REFERENCES public.companies(id);

-- Update RLS policies for existing tables to filter by company
DROP POLICY IF EXISTS "Anyone can view meetings" ON public.meetings;
DROP POLICY IF EXISTS "Anyone can create meetings" ON public.meetings;
DROP POLICY IF EXISTS "Anyone can update meetings" ON public.meetings;
DROP POLICY IF EXISTS "Anyone can delete meetings" ON public.meetings;

CREATE POLICY "Users can view company meetings" 
ON public.meetings 
FOR SELECT 
USING (company_id = public.get_user_company_id() OR public.is_admin());

CREATE POLICY "Users can create company meetings" 
ON public.meetings 
FOR INSERT 
WITH CHECK (company_id = public.get_user_company_id() OR public.is_admin());

CREATE POLICY "Users can update company meetings" 
ON public.meetings 
FOR UPDATE 
USING (company_id = public.get_user_company_id() OR public.is_admin());

CREATE POLICY "Users can delete company meetings" 
ON public.meetings 
FOR DELETE 
USING (company_id = public.get_user_company_id() OR public.is_admin());

-- Update RLS for analytics tables (care_plan_analytics)
DROP POLICY IF EXISTS "Anyone can view care plan analytics" ON public.care_plan_analytics;
DROP POLICY IF EXISTS "Anyone can create care plan analytics" ON public.care_plan_analytics;
DROP POLICY IF EXISTS "Anyone can update care plan analytics" ON public.care_plan_analytics;
DROP POLICY IF EXISTS "Anyone can delete care plan analytics" ON public.care_plan_analytics;

CREATE POLICY "Users can view company care plan analytics" 
ON public.care_plan_analytics 
FOR SELECT 
USING (company_id = public.get_user_company_id() OR public.is_admin());

CREATE POLICY "Users can create company care plan analytics" 
ON public.care_plan_analytics 
FOR INSERT 
WITH CHECK (company_id = public.get_user_company_id() OR public.is_admin());

CREATE POLICY "Users can update company care plan analytics" 
ON public.care_plan_analytics 
FOR UPDATE 
USING (company_id = public.get_user_company_id() OR public.is_admin());

CREATE POLICY "Users can delete company care plan analytics" 
ON public.care_plan_analytics 
FOR DELETE 
USING (company_id = public.get_user_company_id() OR public.is_admin());

-- Create trigger for automatic timestamp updates on companies
CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for automatic timestamp updates on profiles
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'username',
    COALESCE((NEW.raw_user_meta_data ->> 'role')::public.user_role, 'user')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();