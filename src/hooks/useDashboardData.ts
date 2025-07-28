import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface DashboardDataHook {
  data: any;
  loading: boolean;
  saveData: (newData: any) => Promise<void>;
  clearData: () => void;
}

export const useDashboardData = (
  dataType: string, 
  sessionId?: string, 
  defaultData: any = {}
): DashboardDataHook => {
  const { profile } = useAuth();
  const [data, setData] = useState(defaultData);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!profile?.company_id) {
      setLoading(false);
      return;
    }

    try {
      console.log(`Loading ${dataType} data for company:`, profile.company_id, 'session:', sessionId);
      
      const { data: dbData, error } = await supabase
        .from('dashboard_data')
        .select('data_content')
        .eq('company_id', profile.company_id)
        .eq('data_type', dataType)
        .eq('meeting_id', sessionId || null)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error(`Error loading ${dataType} data:`, error);
        return;
      }

      if (dbData?.data_content) {
        console.log(`Found existing ${dataType} data:`, dbData.data_content);
        setData(dbData.data_content);
      } else {
        console.log(`No existing ${dataType} data found, using default`);
        setData(defaultData);
      }
    } catch (error) {
      console.error(`Failed to load ${dataType} data:`, error);
      setData(defaultData);
    } finally {
      setLoading(false);
    }
  }, [profile?.company_id, dataType, sessionId, defaultData]);

  const saveData = useCallback(async (newData: any) => {
    if (!profile?.company_id) return;

    try {
      console.log(`Saving ${dataType} data for company:`, profile.company_id, 'session:', sessionId, 'data:', newData);
      
      const { error } = await supabase
        .from('dashboard_data')
        .upsert({
          company_id: profile.company_id,
          meeting_id: sessionId || null,
          data_type: dataType,
          data_content: newData
        }, {
          onConflict: 'company_id,meeting_id,data_type'
        });

      if (error) {
        console.error(`Error saving ${dataType} data:`, error);
      } else {
        console.log(`${dataType} data saved successfully`);
        setData(newData);
      }
    } catch (error) {
      console.error(`Failed to save ${dataType} data:`, error);
    }
  }, [profile?.company_id, dataType, sessionId]);

  const clearData = useCallback(() => {
    setData(defaultData);
  }, [defaultData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    saveData,
    clearData
  };
};