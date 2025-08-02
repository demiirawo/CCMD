-- Add dynamic_panel_colour field to companies table
ALTER TABLE companies 
ADD COLUMN dynamic_panel_colour BOOLEAN DEFAULT false;