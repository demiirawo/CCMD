import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface UtilisationOverride {
  required?: number;
  allocated?: number;
  unallocated?: number;
  availableStaffHours?: number;
}

export interface UtilisationOverrides {
  [week: string]: UtilisationOverride;
}

export const useUtilisationOverrides = () => {
  const { profile } = useAuth();
  const companyId = profile?.company_id;
  const [overrides, setOverrides] = useState<UtilisationOverrides>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const initialLoadComplete = useRef(false);

  // Load overrides from Supabase on mount
  useEffect(() => {
    const loadOverrides = async () => {
      if (!companyId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('utilisation_overrides')
          .select('*')
          .eq('company_id', companyId);

        if (error) {
          console.error('Error loading utilisation overrides:', error);
          setLoading(false);
          return;
        }

        // Convert from array to object format
        const overridesObj: UtilisationOverrides = {};
        data?.forEach(row => {
          overridesObj[row.week] = {};
          if (row.required !== null) overridesObj[row.week].required = Number(row.required);
          if (row.allocated !== null) overridesObj[row.week].allocated = Number(row.allocated);
          if (row.unallocated !== null) overridesObj[row.week].unallocated = Number(row.unallocated);
          if (row.available_staff_hours !== null) overridesObj[row.week].availableStaffHours = Number(row.available_staff_hours);
        });

        setOverrides(overridesObj);
        initialLoadComplete.current = true;
      } catch (err) {
        console.error('Error loading utilisation overrides:', err);
      } finally {
        setLoading(false);
      }
    };

    loadOverrides();
  }, [companyId]);

  // Save a single override to Supabase
  const saveOverride = useCallback(async (week: string, field: keyof UtilisationOverride, value: number) => {
    if (!companyId) return;

    setSaving(true);
    try {
      // Map field names to database columns
      const fieldMap: Record<keyof UtilisationOverride, string> = {
        required: 'required',
        allocated: 'allocated',
        unallocated: 'unallocated',
        availableStaffHours: 'available_staff_hours'
      };

      const dbField = fieldMap[field];

      // Upsert the override
      const { error } = await supabase
        .from('utilisation_overrides')
        .upsert(
          {
            company_id: companyId,
            week,
            [dbField]: value
          },
          {
            onConflict: 'company_id,week'
          }
        );

      if (error) {
        console.error('Error saving utilisation override:', error);
        return;
      }

      // Update local state
      setOverrides(prev => ({
        ...prev,
        [week]: {
          ...prev[week],
          [field]: value
        }
      }));
    } catch (err) {
      console.error('Error saving utilisation override:', err);
    } finally {
      setSaving(false);
    }
  }, [companyId]);

  // Clear all overrides (when staff/service user data changes)
  const clearAllOverrides = useCallback(async () => {
    if (!companyId || !initialLoadComplete.current) return;

    try {
      const { error } = await supabase
        .from('utilisation_overrides')
        .delete()
        .eq('company_id', companyId);

      if (error) {
        console.error('Error clearing utilisation overrides:', error);
        return;
      }

      setOverrides({});
    } catch (err) {
      console.error('Error clearing utilisation overrides:', err);
    }
  }, [companyId]);

  return {
    overrides,
    loading,
    saving,
    saveOverride,
    clearAllOverrides,
    setOverrides
  };
};
