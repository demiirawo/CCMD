import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface AutoSaveConfig {
  table: string;
  data: any;
  delay?: number;
  dependencies?: any[];
  onError?: (error: any) => void;
  onSuccess?: () => void;
}

export const useAutoSave = ({
  table,
  data,
  delay = 2000, // 2 second default delay
  dependencies = [],
  onError,
  onSuccess
}: AutoSaveConfig) => {
  const { profile } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedRef = useRef<string>('');

  const saveData = useCallback(async () => {
    if (!profile?.company_id || !data) return;

    try {
      const dataString = JSON.stringify(data);
      
      // Only save if data has actually changed
      if (dataString === lastSavedRef.current) return;

      // Use upsert with proper conflict resolution
      const upsertData = {
        company_id: profile.company_id,
        ...data,
        updated_at: new Date().toISOString()
      };

      const { error } = await (supabase as any)
        .from(table)
        .upsert(upsertData, { 
          onConflict: data.id ? 'id' : undefined,
          ignoreDuplicates: false 
        });

      if (error) {
        console.error(`Auto-save error for ${table}:`, error);
        onError?.(error);
        
        // Save to localStorage as fallback
        const backupKey = `${table}_backup_${profile.company_id}`;
        localStorage.setItem(backupKey, dataString);
      } else {
        lastSavedRef.current = dataString;
        onSuccess?.();
        
        // Also save to localStorage as backup
        const backupKey = `${table}_backup_${profile.company_id}`;
        localStorage.setItem(backupKey, dataString);
      }
    } catch (error) {
      console.error(`Auto-save error for ${table}:`, error);
      onError?.(error);
      
      // Save to localStorage as fallback
      if (profile?.company_id) {
        const backupKey = `${table}_backup_${profile.company_id}`;
        localStorage.setItem(backupKey, JSON.stringify(data));
      }
    }
  }, [table, data, profile?.company_id, onError, onSuccess]);

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(() => {
      saveData();
    }, delay);

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [saveData, delay, ...dependencies]);

  // Save immediately on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Cancel pending timeout and save immediately
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Use sendBeacon for reliable save on page unload
      if (navigator.sendBeacon && profile?.company_id && data) {
        const backupKey = `${table}_backup_${profile.company_id}`;
        localStorage.setItem(backupKey, JSON.stringify(data));
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Save immediately when tab becomes hidden
        saveData();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [saveData, table, profile?.company_id, data]);

  return { saveData };
};