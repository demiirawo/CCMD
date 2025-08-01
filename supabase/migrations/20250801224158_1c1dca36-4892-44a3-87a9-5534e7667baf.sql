-- Remove the custom magic link hook configuration
-- The built-in Supabase auth will handle magic links without custom webhooks

-- Ensure the handle_magic_link_signup trigger exists and works correctly
-- This trigger will handle user creation when they click the magic link

-- No database changes needed, but we need to disable the custom webhook
-- and use the built-in Supabase auth email system