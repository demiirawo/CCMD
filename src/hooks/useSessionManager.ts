import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useSessionManager = () => {
  const { profile } = useAuth();
  const [sessionId, setSessionId] = useState<string>('');
  const [meetingDate, setMeetingDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);

  // Generate session ID based on company and date
  const generateSessionId = useCallback((date: Date, companyId: string) => {
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    return `${companyId}_${dateStr}`;
  }, []);

  // Create or get session
  const createOrGetSession = useCallback(async (date: Date) => {
    if (!profile?.company_id) return '';

    const sessionId = generateSessionId(date, profile.company_id);
    const quarter = `Q${Math.ceil((date.getMonth() + 1) / 3)}`;
    const year = date.getFullYear();

    try {
      // Check if session exists
      const { data: existingSession } = await supabase
        .from('meeting_sessions')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('session_id', sessionId)
        .maybeSingle();

      if (!existingSession) {
        // Create new session
        const { error } = await supabase
          .from('meeting_sessions')
          .insert({
            company_id: profile.company_id,
            session_id: sessionId,
            meeting_date: date.toISOString().split('T')[0],
            meeting_quarter: quarter,
            meeting_year: year,
            title: `${quarter} ${year} Meeting`,
            purpose: 'Regular company meeting',
            attendees: []
          });

        if (error) {
          console.error('Error creating session:', error);
        } else {
          console.log('Created new session:', sessionId);
        }
      }

      return sessionId;
    } catch (error) {
      console.error('Error managing session:', error);
      return sessionId; // Return generated ID even if DB operation fails
    }
  }, [profile?.company_id, generateSessionId]);

  // Initialize session on mount
  useEffect(() => {
    const initSession = async () => {
      if (!profile?.company_id) {
        setIsLoading(false);
        return;
      }

      const newSessionId = await createOrGetSession(meetingDate);
      setSessionId(newSessionId);
      setIsLoading(false);
    };

    initSession();
  }, [profile?.company_id, createOrGetSession, meetingDate]);

  // Update session when date changes
  const updateMeetingDate = useCallback(async (newDate: Date) => {
    setMeetingDate(newDate);
    if (profile?.company_id) {
      const newSessionId = await createOrGetSession(newDate);
      setSessionId(newSessionId);
    }
  }, [profile?.company_id, createOrGetSession]);

  return {
    sessionId,
    meetingDate,
    updateMeetingDate,
    isLoading
  };
};