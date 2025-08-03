import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface MeetingSummaryData {
  id?: string;
  company_id: string;
  meeting_date: string;
  summary_text: string;
  created_at?: string;
  updated_at?: string;
}

export const useMeetingSummaryResilience = (meetingDate: string) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [summary, setSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedRef = useRef<string>('');
  
  // Generate backup key for localStorage
  const getBackupKey = useCallback(() => {
    if (!profile?.company_id) return null;
    return `meeting_summary_backup_${profile.company_id}_${meetingDate}`;
  }, [profile?.company_id, meetingDate]);

  // Save to localStorage as backup
  const saveToLocalStorage = useCallback((summaryText: string) => {
    const backupKey = getBackupKey();
    if (backupKey) {
      localStorage.setItem(backupKey, JSON.stringify({
        summary_text: summaryText,
        timestamp: new Date().toISOString()
      }));
      console.log('📝 MeetingSummary: Saved backup to localStorage:', backupKey);
    }
  }, [getBackupKey]);

  // Load from localStorage
  const loadFromLocalStorage = useCallback(() => {
    const backupKey = getBackupKey();
    if (backupKey) {
      const stored = localStorage.getItem(backupKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return parsed.summary_text || '';
        } catch (error) {
          console.warn('Failed to parse localStorage backup:', error);
        }
      }
    }
    return '';
  }, [getBackupKey]);

  // Save to database with retry logic
  const saveToDatabase = useCallback(async (summaryText: string) => {
    if (!profile?.company_id || !meetingDate) return false;

    const normalizedDate = (() => {
      try {
        // Parse DD/MM/YYYY HH:mm format
        const parts = meetingDate.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
        if (parts) {
          const [, day, month, year, hour, minute] = parts;
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute)).toISOString();
        }
        return new Date(meetingDate).toISOString();
      } catch (error) {
        console.warn('Date parsing failed, using current date:', error);
        return new Date().toISOString();
      }
    })();

    try {
      setIsSaving(true);
      
      const dataToSave: Omit<MeetingSummaryData, 'id' | 'created_at' | 'updated_at'> = {
        company_id: profile.company_id,
        meeting_date: normalizedDate,
        summary_text: summaryText
      };

      console.log('💾 MeetingSummary: Attempting to save:', dataToSave);

      // Check if record exists
      const { data: existing } = await (supabase as any)
        .from('meeting_summaries')
        .select('id')
        .eq('company_id', profile.company_id)
        .eq('meeting_date', normalizedDate)
        .maybeSingle();

      let result;
      if (existing) {
        // Update existing
        result = await (supabase as any)
          .from('meeting_summaries')
          .update(dataToSave)
          .eq('id', existing.id)
          .select();
        console.log('🔄 MeetingSummary: Updated existing record');
      } else {
        // Insert new
        result = await (supabase as any)
          .from('meeting_summaries')
          .insert(dataToSave)
          .select();
        console.log('➕ MeetingSummary: Created new record');
      }

      if (result.error) {
        console.error('❌ MeetingSummary: Database error:', result.error);
        throw result.error;
      }

      console.log('✅ MeetingSummary: Successfully saved:', result.data);
      lastSavedRef.current = summaryText;
      
      // Also save to localStorage as backup
      saveToLocalStorage(summaryText);
      
      return true;
    } catch (error) {
      console.error('❌ MeetingSummary: Save failed:', error);
      // Fallback to localStorage
      saveToLocalStorage(summaryText);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [profile?.company_id, meetingDate, saveToLocalStorage]);

  // Load summary from database
  const loadSummary = useCallback(async () => {
    if (!profile?.company_id || !meetingDate) return;

    setIsLoading(true);
    
    try {
      const normalizedDate = (() => {
        try {
          const parts = meetingDate.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
          if (parts) {
            const [, day, month, year, hour, minute] = parts;
            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute)).toISOString();
          }
          return new Date(meetingDate).toISOString();
        } catch (error) {
          return new Date().toISOString();
        }
      })();

      console.log('🔍 MeetingSummary: Loading from database for date:', normalizedDate);

      const { data, error } = await (supabase as any)
        .from('meeting_summaries')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('meeting_date', normalizedDate)
        .maybeSingle();

      if (error) {
        console.error('❌ MeetingSummary: Load error:', error);
        // Try localStorage fallback
        const backup = loadFromLocalStorage();
        if (backup) {
          setSummary(backup);
          console.log('📱 MeetingSummary: Loaded from localStorage backup');
        }
        return;
      }

      if (data) {
        setSummary(data.summary_text || '');
        lastSavedRef.current = data.summary_text || '';
        console.log('✅ MeetingSummary: Loaded from database:', data);
      } else {
        // Try localStorage fallback
        const backup = loadFromLocalStorage();
        if (backup) {
          setSummary(backup);
          console.log('📱 MeetingSummary: No database record, loaded from localStorage backup');
        } else {
          setSummary('');
          console.log('📝 MeetingSummary: No data found, starting fresh');
        }
      }
    } catch (error) {
      console.error('❌ MeetingSummary: Exception during load:', error);
      // Try localStorage fallback
      const backup = loadFromLocalStorage();
      if (backup) {
        setSummary(backup);
        console.log('📱 MeetingSummary: Exception fallback to localStorage');
      }
    } finally {
      setIsLoading(false);
    }
  }, [profile?.company_id, meetingDate, loadFromLocalStorage]);

  // Update summary with auto-save
  const updateSummary = useCallback((newSummary: string) => {
    setSummary(newSummary);
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Save to localStorage immediately
    saveToLocalStorage(newSummary);

    // Debounce database save
    saveTimeoutRef.current = setTimeout(() => {
      if (newSummary !== lastSavedRef.current) {
        saveToDatabase(newSummary);
      }
    }, 1000);
  }, [saveToLocalStorage, saveToDatabase]);

  // Force save (for immediate operations)
  const forceSave = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    return await saveToDatabase(summary);
  }, [saveToDatabase, summary]);

  // Load on mount and when dependencies change
  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  // Save on unmount/visibility change
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (summary !== lastSavedRef.current) {
        navigator.sendBeacon('/api/save-summary', JSON.stringify({
          summary,
          meetingDate,
          companyId: profile?.company_id
        }));
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && summary !== lastSavedRef.current) {
        forceSave();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [summary, meetingDate, profile?.company_id, forceSave]);

  return {
    summary,
    updateSummary,
    isLoading,
    isSaving,
    forceSave,
    loadSummary
  };
};