import { useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { toast } from 'sonner';

interface DataLossPreventionOptions {
  hasUnsavedChanges: boolean;
  onSaveData: () => Promise<void>;
  onCreateCheckpoint?: () => Promise<void>;
  warningMessage?: string;
}

export const useDataLossPrevention = ({
  hasUnsavedChanges,
  onSaveData,
  onCreateCheckpoint,
  warningMessage = 'You have unsaved changes that will be lost if you leave this page.'
}: DataLossPreventionOptions) => {
  const location = useLocation();
  const navigationType = useNavigationType();
  const hasShownWarningRef = useRef(false);
  const lastSaveTimeRef = useRef<number>(0);

  // Auto-save when data changes
  const autoSave = useCallback(async () => {
    if (hasUnsavedChanges) {
      const now = Date.now();
      // Debounce auto-save to prevent excessive saves
      if (now - lastSaveTimeRef.current > 5000) { // 5 seconds minimum between saves
        try {
          await onSaveData();
          lastSaveTimeRef.current = now;
          console.log('📁 Auto-save completed');
        } catch (error) {
          console.error('Auto-save failed:', error);
          toast.error('Auto-save failed - your changes may be lost');
        }
      }
    }
  }, [hasUnsavedChanges, onSaveData]);

  // Create emergency checkpoint
  const createEmergencyCheckpoint = useCallback(async () => {
    if (hasUnsavedChanges && onCreateCheckpoint) {
      try {
        await onCreateCheckpoint();
        toast.success('Emergency checkpoint created');
      } catch (error) {
        console.error('Emergency checkpoint failed:', error);
        toast.error('Failed to create emergency checkpoint');
      }
    }
  }, [hasUnsavedChanges, onCreateCheckpoint]);

  // Handle page unload
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && !hasShownWarningRef.current) {
        // Trigger auto-save
        autoSave();
        
        // Show browser warning
        event.preventDefault();
        event.returnValue = warningMessage;
        hasShownWarningRef.current = true;
        
        // Reset warning flag after a delay
        setTimeout(() => {
          hasShownWarningRef.current = false;
        }, 1000);
        
        return warningMessage;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && hasUnsavedChanges) {
        // Page is becoming hidden, save data immediately
        autoSave();
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [hasUnsavedChanges, warningMessage, autoSave]);

  // Auto-save on route changes
  useEffect(() => {
    if (hasUnsavedChanges) {
      autoSave();
    }
  }, [location.pathname, autoSave]);

  // Show notification for unsaved changes
  useEffect(() => {
    let toastId: string | number | undefined;
    
    if (hasUnsavedChanges) {
      toastId = toast.info('You have unsaved changes', {
        duration: Infinity,
        action: {
          label: 'Save Now',
          onClick: () => {
            onSaveData();
            toast.dismiss(toastId);
          }
        }
      });
    } else {
      if (toastId) {
        toast.dismiss(toastId);
      }
    }

    return () => {
      if (toastId) {
        toast.dismiss(toastId);
      }
    };
  }, [hasUnsavedChanges, onSaveData]);

  // Keyboard shortcuts for saving
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+S or Cmd+S to save
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        if (hasUnsavedChanges) {
          onSaveData();
          toast.success('Data saved manually');
        }
      }
      
      // Ctrl+Shift+S or Cmd+Shift+S to create checkpoint
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'S') {
        event.preventDefault();
        createEmergencyCheckpoint();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [hasUnsavedChanges, onSaveData, createEmergencyCheckpoint]);

  return {
    autoSave,
    createEmergencyCheckpoint
  };
};