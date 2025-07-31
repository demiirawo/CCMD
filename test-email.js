// Simple test script to trigger the action reminder email
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://gwywpkhxpbokmbhwsnod.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3eXdwa2h4cGJva21iaHdzbm9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNjEyODcsImV4cCI6MjA2ODkzNzI4N30.ZpFRdjvGv75scJBqwnnMdClJSKTOgwM0A9rJaUbyHoU'
);

async function testEmailReminder() {
  console.log('Testing email reminder function...');
  
  try {
    const { data, error } = await supabase.functions.invoke('send-action-reminders', {
      body: { test: true }
    });
    
    if (error) {
      console.error('Error calling function:', error);
    } else {
      console.log('Function response:', data);
    }
  } catch (err) {
    console.error('Exception:', err);
  }
}

testEmailReminder();