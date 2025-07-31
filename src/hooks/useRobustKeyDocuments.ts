import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAnalyticsRecovery } from './useAnalyticsRecovery';

export interface KeyDocumentData {
  id: string;
  name: string;
  owner: string;
  category: string;
  lastReviewDate: string;
  reviewFrequency: string;
  reviewFrequencyNumber: string;
  reviewFrequencyPeriod: string;
  nextReviewDate: string | null;
  updatedAt?: string;
  // Internal tracking
  _lastSaved?: string;
  _lastBackup?: string;
  _version?: number;
}

interface UseRobustKeyDocumentsOptions {
  companyId: string;
  meetingId?: string;
  autoBackupInterval?: number;
  maxRetries?: number;
}

export const useRobustKeyDocuments = ({
  companyId,
  meetingId,
  autoBackupInterval = 30000,
  maxRetries = 3
}: UseRobustKeyDocumentsOptions) => {
  const [data, setData] = useState<KeyDocumentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saveQueue, setSaveQueue] = useState<Array<{ data: KeyDocumentData[]; timestamp: number }>>([]);

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
      createAnalyticsBackup(companyId, meetingId || 'temp', 'key_documents', data, 'auto_backup');
    }, autoBackupInterval);

    return () => clearInterval(interval);
  }, [companyId, meetingId, data, autoBackupInterval, createAnalyticsBackup]);

  // Validate key documents data structure
  const validateKeyDocuments = (documentsData: any): KeyDocumentData[] => {
    if (!Array.isArray(documentsData)) return [];
    
    return documentsData.filter(doc => 
      doc && 
      typeof doc === 'object' && 
      typeof doc.id === 'string' && 
      typeof doc.name === 'string'
    ).map(doc => ({
      id: doc.id,
      name: doc.name || '',
      owner: doc.owner || '',
      category: doc.category || '',
      lastReviewDate: doc.lastReviewDate || '',
      reviewFrequency: doc.reviewFrequency || '',
      reviewFrequencyNumber: doc.reviewFrequencyNumber || '',
      reviewFrequencyPeriod: doc.reviewFrequencyPeriod || '',
      nextReviewDate: doc.nextReviewDate || null,
      updatedAt: doc.updatedAt || new Date().toISOString(),
      _version: (doc._version || 0) + 1
    }));
  };

  // Load data with validation and recovery
  const loadData = useCallback(async () => {
    if (!companyId) return;

    setIsLoading(true);
    try {
      const { data: documentsData, error } = await supabase
        .from('key_documents')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      let loadedData: KeyDocumentData[] = [];

      if (documentsData && documentsData.length > 0) {
        loadedData = documentsData.map(record => {
          const notesParts = record.notes ? record.notes.split(' | ') : ['', '', '', '', ''];
          const [owner = '', category = '', lastReviewDate = '', reviewFrequency = '', updatedAt = ''] = notesParts;
          
          return {
            id: record.id,
            name: record.name,
            owner,
            category,
            lastReviewDate,
            reviewFrequency,
            reviewFrequencyNumber: reviewFrequency.split(' ')[0] || '',
            reviewFrequencyPeriod: reviewFrequency.split(' ')[1] || '',
            nextReviewDate: record.due_date || null,
            updatedAt: updatedAt || new Date().toISOString(),
            _lastSaved: new Date().toISOString(),
            _version: 1
          };
        });
      }

      // Validate and repair data
      const validatedData = await validateAndRepairData(
        companyId,
        meetingId || 'temp',
        'key_documents',
        loadedData
      );

      setData(validateKeyDocuments(validatedData || loadedData));
    } catch (error) {
      console.error('Error loading key documents:', error);
      
      // Attempt recovery from backups
      try {
        const recoveredData = await recoverAnalyticsData(companyId, meetingId || 'temp', 'key_documents');
        if (recoveredData) {
          setData(validateKeyDocuments(recoveredData));
          console.log('Successfully recovered key documents data from backup');
        }
      } catch (recoveryError) {
        console.error('Failed to recover key documents data:', recoveryError);
      }
    } finally {
      setIsLoading(false);
    }
  }, [companyId, meetingId, validateAndRepairData, recoverAnalyticsData]);

  // Save data with retry logic and backup
  const saveData = useCallback(async (newData: KeyDocumentData[], retryCount = 0) => {
    if (!companyId) return false;

    try {
      // Save each document individually
      for (const doc of newData) {
        const notesParts = [
          doc.owner,
          doc.category,
          doc.lastReviewDate,
          `${doc.reviewFrequencyNumber} ${doc.reviewFrequencyPeriod}`.trim(),
          doc.updatedAt || new Date().toISOString()
        ];

        const { error } = await supabase
          .from('key_documents')
          .upsert({
            id: doc.id,
            company_id: companyId,
            name: doc.name,
            notes: notesParts.join(' | '),
            due_date: doc.nextReviewDate,
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      // Create backup after successful save
      await createAnalyticsBackup(companyId, meetingId || 'temp', 'key_documents', newData, 'auto_backup');
      
      setData(newData);
      setSaveQueue(prev => prev.slice(1));
      return true;
    } catch (error) {
      console.error(`Error saving key documents (attempt ${retryCount + 1}):`, error);
      
      if (retryCount < maxRetries) {
        setSaveQueue(prev => [...prev, { data: newData, timestamp: Date.now() }]);
        setTimeout(() => {
          saveData(newData, retryCount + 1);
        }, Math.pow(2, retryCount) * 1000);
      } else {
        console.error('Max retries exceeded for key documents save');
        await createAnalyticsBackup(companyId, meetingId || 'temp', 'key_documents', newData, 'manual_backup');
      }
      return false;
    }
  }, [companyId, meetingId, maxRetries, createAnalyticsBackup]);

  // Update data and trigger save
  const updateData = useCallback(async (updates: KeyDocumentData[]) => {
    const validatedData = validateKeyDocuments(updates);
    setData(validatedData);
    
    // Immediate backup
    await createAnalyticsBackup(companyId, meetingId || 'temp', 'key_documents', validatedData, 'manual_backup');
    
    // Async save
    saveData(validatedData);
  }, [companyId, meetingId, createAnalyticsBackup, saveData]);

  // Force recovery from backups
  const forceRecovery = useCallback(async () => {
    try {
      const recoveredData = await recoverAnalyticsData(companyId, meetingId || 'temp', 'key_documents');
      if (recoveredData) {
        setData(validateKeyDocuments(recoveredData));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Force recovery failed:', error);
      return false;
    }
  }, [companyId, meetingId, recoverAnalyticsData]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    isLoading,
    updateData,
    saveData,
    forceRecovery,
    recoveryState,
    saveQueue: saveQueue.length
  };
};