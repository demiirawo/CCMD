import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

interface MeetingSummaryData {
  id?: string;
  company_id: string;
  meeting_date: string;
  summary_text: string;
  created_at?: string;
  updated_at?: string;
}

interface UseMeetingSummaryOptions {
  meetingDate: string;
  autoSaveDelay?: number;
  enableBackup?: boolean;
}

export const useMeetingSummary = ({ 
  meetingDate, 
  autoSaveDelay = 2000,
  enableBackup = true 
}: UseMeetingSummaryOptions) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [summaryText, setSummaryText] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedDataRef = useRef<string>('');
  const backupKeyRef = useRef<string>('');

  // Generate consistent backup key
  useEffect(() => {
    if (profile?.company_id && meetingDate) {
      backupKeyRef.current = `meeting_summary_${profile.company_id}_${meetingDate.replace(/[^\w-]/g, '_')}`;
    }
  }, [profile?.company_id, meetingDate]);

  // Backup to localStorage
  const createBackup = useCallback((data: string) => {
    if (!enableBackup || !backupKeyRef.current) return;
    
    try {
      const backupData = {
        summary: data,
        timestamp: new Date().toISOString(),
        meetingDate,
        companyId: profile?.company_id
      };
      localStorage.setItem(backupKeyRef.current, JSON.stringify(backupData));
      console.log('✅ Meeting Summary: Backup created', backupKeyRef.current);
    } catch (error) {
      console.error('❌ Meeting Summary: Backup failed', error);
    }
  }, [enableBackup, meetingDate, profile?.company_id]);

  // Restore from localStorage backup
  const restoreFromBackup = useCallback(() => {
    if (!enableBackup || !backupKeyRef.current) return null;
    
    try {
      const backupStr = localStorage.getItem(backupKeyRef.current);
      if (!backupStr) return null;
      
      const backup = JSON.parse(backupStr);
      console.log('🔄 Meeting Summary: Restored from backup', backup);
      return backup.summary || '';
    } catch (error) {
      console.error('❌ Meeting Summary: Backup restore failed', error);
      return null;
    }
  }, [enableBackup]);

  // Save to database with retry logic
  const saveToDatabase = useCallback(async (text: string, retryCount = 0): Promise<boolean> => {
    if (!profile?.company_id || !meetingDate) {
      console.error('❌ Meeting Summary: Missing company_id or meetingDate');
      return false;
    }

    setIsSaving(true);
    
    try {
      // Parse meeting date to ISO format
      const [datePart, timePart] = meetingDate.split(' ');
      const [day, month, year] = datePart.split('/');
      const isoDate = new Date(`${year}-${month}-${day}T${timePart}:00.000Z`).toISOString();
      
      const summaryData: MeetingSummaryData = {
        company_id: profile.company_id,
        meeting_date: isoDate,
        summary_text: text,
        updated_at: new Date().toISOString()
      };

      console.log('💾 Meeting Summary: Saving to database', summaryData);

      // Check if record exists
      const { data: existing } = await supabase
        .from('meeting_summaries')
        .select('id')
        .eq('company_id', profile.company_id)
        .eq('meeting_date', isoDate)
        .maybeSingle();

      let result;
      if (existing) {
        // Update existing
        result = await supabase
          .from('meeting_summaries')
          .update(summaryData)
          .eq('id', existing.id)
          .select();
      } else {
        // Insert new
        result = await supabase
          .from('meeting_summaries')
          .insert(summaryData)
          .select();
      }

      if (result.error) {
        throw result.error;
      }

      console.log('✅ Meeting Summary: Saved to database', result.data);
      
      lastSavedDataRef.current = text;
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      
      // Create backup after successful save
      createBackup(text);
      
      toast({
        title: "Meeting Summary Saved",
        description: "Your meeting summary has been saved successfully",
      });

      return true;
    } catch (error) {
      console.error('❌ Meeting Summary: Save failed', error);
      
      // Retry logic with exponential backoff
      if (retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        console.log(`🔄 Meeting Summary: Retrying in ${delay}ms (attempt ${retryCount + 1})`);
        
        setTimeout(() => {
          saveToDatabase(text, retryCount + 1);
        }, delay);
        
        return false;
      }

      // Final fallback to localStorage
      createBackup(text);
      
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Failed to save meeting summary. Data backed up locally.",
      });

      return false;
    } finally {
      setIsSaving(false);
    }
  }, [profile?.company_id, meetingDate, createBackup, toast]);

  // Load from database with fallback to backup
  const loadFromDatabase = useCallback(async () => {
    if (!profile?.company_id || !meetingDate) return;

    setIsLoading(true);
    
    try {
      // Parse meeting date to ISO format
      const [datePart, timePart] = meetingDate.split(' ');
      const [day, month, year] = datePart.split('/');
      const isoDate = new Date(`${year}-${month}-${day}T${timePart}:00.000Z`).toISOString();

      console.log('🔍 Meeting Summary: Loading from database', { isoDate, companyId: profile.company_id });

      const { data, error } = await supabase
        .from('meeting_summaries')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('meeting_date', isoDate)
        .maybeSingle();

      if (error) {
        console.error('❌ Meeting Summary: Load error', error);
        throw error;
      }

      if (data) {
        console.log('✅ Meeting Summary: Loaded from database', data);
        setSummaryText(data.summary_text || '');
        lastSavedDataRef.current = data.summary_text || '';
        setHasUnsavedChanges(false);
        return;
      }

      // No data in database, try backup
      const backupData = restoreFromBackup();
      if (backupData) {
        console.log('🔄 Meeting Summary: Using backup data');
        setSummaryText(backupData);
        setHasUnsavedChanges(true); // Mark as unsaved since it's from backup
      } else {
        console.log('📝 Meeting Summary: No existing data found');
        setSummaryText('');
        lastSavedDataRef.current = '';
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error('❌ Meeting Summary: Load failed, trying backup', error);
      
      // Fallback to backup
      const backupData = restoreFromBackup();
      if (backupData) {
        setSummaryText(backupData);
        setHasUnsavedChanges(true);
      } else {
        setSummaryText('');
        lastSavedDataRef.current = '';
        setHasUnsavedChanges(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [profile?.company_id, meetingDate, restoreFromBackup]);

  // Auto-save with debouncing
  const debouncedSave = useCallback((text: string) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Only auto-save if data has actually changed
    if (text === lastSavedDataRef.current) {
      setHasUnsavedChanges(false);
      return;
    }

    setHasUnsavedChanges(true);
    
    // Create backup immediately for data safety
    createBackup(text);

    saveTimeoutRef.current = setTimeout(() => {
      saveToDatabase(text);
    }, autoSaveDelay);
  }, [autoSaveDelay, saveToDatabase, createBackup]);

  // Update summary text with auto-save
  const updateSummary = useCallback((text: string) => {
    setSummaryText(text);
    debouncedSave(text);
  }, [debouncedSave]);

  // Force immediate save
  const forceSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    return saveToDatabase(summaryText);
  }, [summaryText, saveToDatabase]);

  // Load data on mount and dependency changes
  useEffect(() => {
    loadFromDatabase();
  }, [loadFromDatabase]);

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // Force backup on page unload
      createBackup(summaryText);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && hasUnsavedChanges) {
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
  }, [summaryText, hasUnsavedChanges, forceSave, createBackup]);

  return {
    summaryText,
    updateSummary,
    isLoading,
    isSaving,
    hasUnsavedChanges,
    lastSaved,
    forceSave,
    loadFromDatabase
  };
};