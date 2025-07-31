import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAnalyticsRecovery } from './useAnalyticsRecovery';

export interface SubsectionItemData {
  id: string;
  title: string;
  status: 'green' | 'amber' | 'red';
  lastReviewed: string;
  observation: string;
  actions: any[];
  details: string;
  metadata: any;
  // Internal tracking
  _lastSaved?: string;
  _lastBackup?: string;
  _version?: number;
}

export interface SubsectionData {
  id: string;
  title: string;
  items: SubsectionItemData[];
  // Internal tracking
  _lastSaved?: string;
  _lastBackup?: string;
  _version?: number;
}

interface UseRobustSubsectionsOptions {
  companyId: string;
  sessionId?: string;
  autoBackupInterval?: number;
  maxRetries?: number;
}

export const useRobustSubsections = ({
  companyId,
  sessionId,
  autoBackupInterval = 30000,
  maxRetries = 3
}: UseRobustSubsectionsOptions) => {
  const [data, setData] = useState<SubsectionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saveQueue, setSaveQueue] = useState<Array<{ data: SubsectionData[]; timestamp: number }>>([]);

  const {
    createAnalyticsBackup,
    recoverAnalyticsData,
    validateAndRepairData,
    saveWithBackup,
    recoveryState
  } = useAnalyticsRecovery();

  // Auto-backup effect
  useEffect(() => {
    const interval = setInterval(() => {
      createAnalyticsBackup(companyId, sessionId || 'temp', 'subsections', data, 'auto_backup');
    }, autoBackupInterval);

    return () => clearInterval(interval);
  }, [companyId, sessionId, data, autoBackupInterval, createAnalyticsBackup]);

  // Validate subsection data structure
  const validateSubsectionData = (subsectionData: any): SubsectionData[] => {
    if (!Array.isArray(subsectionData)) return [];
    
    return subsectionData.filter(section => 
      section && 
      typeof section === 'object' && 
      typeof section.id === 'string' && 
      typeof section.title === 'string'
    ).map(section => ({
      id: section.id,
      title: section.title,
      items: Array.isArray(section.items) ? section.items.filter(item => 
        item && 
        typeof item === 'object' && 
        typeof item.id === 'string'
      ).map(item => ({
        id: item.id,
        title: item.title || '',
        status: ['green', 'amber', 'red'].includes(item.status) ? item.status : 'green',
        lastReviewed: item.lastReviewed || '',
        observation: item.observation || '',
        actions: Array.isArray(item.actions) ? item.actions : [],
        details: item.details || '',
        metadata: item.metadata || {},
        _lastSaved: item._lastSaved || new Date().toISOString(),
        _version: (item._version || 0) + 1
      })) : [],
      _lastSaved: section._lastSaved || new Date().toISOString(),
      _version: (section._version || 0) + 1
    }));
  };

  // Load data with validation and recovery
  const loadData = useCallback(async () => {
    if (!companyId) return;

    setIsLoading(true);
    try {
      const { data: subsectionData, error } = await supabase
        .from('subsection_data')
        .select('*')
        .eq('company_id', companyId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      let loadedData: SubsectionData[] = [];

      if (subsectionData && subsectionData.length > 0) {
        // Group subsection data by section_id
        const groupedData = subsectionData.reduce((acc, record) => {
          const sectionId = record.section_id;
          if (!acc[sectionId]) {
            acc[sectionId] = {
              id: sectionId,
              title: sectionId.charAt(0).toUpperCase() + sectionId.slice(1).replace(/-/g, ' '),
              items: []
            };
          }
          
          acc[sectionId].items.push({
            id: record.item_id,
            title: record.item_id.charAt(0).toUpperCase() + record.item_id.slice(1).replace(/-/g, ' '),
            status: (['green', 'amber', 'red'].includes(record.status) ? record.status : 'green') as 'green' | 'amber' | 'red',
            lastReviewed: record.last_reviewed || '',
            observation: record.observation || '',
            actions: Array.isArray(record.actions) ? record.actions : [],
            details: '',
            metadata: record.metadata || {},
            _lastSaved: record.updated_at,
            _version: 1
          });
          
          return acc;
        }, {} as Record<string, SubsectionData>);

        loadedData = Object.values(groupedData);
      }

      // Validate and repair data
      const validatedData = await validateAndRepairData(
        companyId,
        sessionId || 'temp',
        'subsections',
        loadedData
      );

      setData(validateSubsectionData(validatedData || loadedData));
    } catch (error) {
      console.error('Error loading subsection data:', error);
      
      // Attempt recovery from backups
      try {
        const recoveredData = await recoverAnalyticsData(companyId, sessionId || 'temp', 'subsections');
        if (recoveredData) {
          setData(validateSubsectionData(recoveredData));
          console.log('Successfully recovered subsection data from backup');
        }
      } catch (recoveryError) {
        console.error('Failed to recover subsection data:', recoveryError);
      }
    } finally {
      setIsLoading(false);
    }
  }, [companyId, sessionId, validateAndRepairData, recoverAnalyticsData]);

  // Save data with retry logic and backup
  const saveData = useCallback(async (newData: SubsectionData[], retryCount = 0) => {
    if (!companyId) return false;

    try {
      // Save each subsection item individually
      for (const section of newData) {
        for (const item of section.items) {
          const { error } = await supabase
            .from('subsection_data')
            .upsert({
              company_id: companyId,
              session_id: sessionId,
              section_id: section.id,
              item_id: item.id,
              status: item.status,
              last_reviewed: item.lastReviewed,
              observation: item.observation,
              actions: item.actions,
              metadata: item.metadata,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'company_id,session_id,section_id,item_id'
            });

          if (error) throw error;
        }
      }

      // Create backup after successful save
      await createAnalyticsBackup(companyId, sessionId || 'temp', 'subsections', newData, 'auto_backup');
      
      setData(newData);
      setSaveQueue(prev => prev.slice(1));
      return true;
    } catch (error) {
      console.error(`Error saving subsection data (attempt ${retryCount + 1}):`, error);
      
      if (retryCount < maxRetries) {
        setSaveQueue(prev => [...prev, { data: newData, timestamp: Date.now() }]);
        setTimeout(() => {
          saveData(newData, retryCount + 1);
        }, Math.pow(2, retryCount) * 1000);
      } else {
        console.error('Max retries exceeded for subsection data save');
        await createAnalyticsBackup(companyId, sessionId || 'temp', 'subsections', newData, 'manual_backup');
      }
      return false;
    }
  }, [companyId, sessionId, maxRetries, createAnalyticsBackup]);

  // Update data and trigger save
  const updateData = useCallback(async (updates: SubsectionData[]) => {
    const validatedData = validateSubsectionData(updates);
    setData(validatedData);
    
    // Immediate backup
    await createAnalyticsBackup(companyId, sessionId || 'temp', 'subsections', validatedData, 'manual_backup');
    
    // Async save
    saveData(validatedData);
  }, [companyId, sessionId, createAnalyticsBackup, saveData]);

  // Update specific item in a section
  const updateItem = useCallback(async (sectionId: string, itemId: string, updates: Partial<SubsectionItemData>) => {
    const newData = data.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          items: section.items.map(item => {
            if (item.id === itemId) {
              return {
                ...item,
                ...updates,
                _lastSaved: new Date().toISOString(),
                _version: (item._version || 0) + 1
              };
            }
            return item;
          }),
          _version: (section._version || 0) + 1
        };
      }
      return section;
    });

    await updateData(newData);
  }, [data, updateData]);

  // Force recovery from backups
  const forceRecovery = useCallback(async () => {
    try {
      const recoveredData = await recoverAnalyticsData(companyId, sessionId || 'temp', 'subsections');
      if (recoveredData) {
        setData(validateSubsectionData(recoveredData));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Force recovery failed:', error);
      return false;
    }
  }, [companyId, sessionId, recoverAnalyticsData]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    isLoading,
    updateData,
    updateItem,
    saveData,
    forceRecovery,
    recoveryState,
    saveQueue: saveQueue.length
  };
};