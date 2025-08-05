import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useRobustAnalytics } from "@/hooks/useRobustAnalytics";
import { supabase } from "@/integrations/supabase/client";

interface StaffTrainingAnalyticsProps {
  meetingDate?: Date;
  meetingId?: string;
}

export const StaffTrainingAnalytics = ({
  meetingDate,
  meetingId
}: StaffTrainingAnalyticsProps) => {
  const { profile } = useAuth();

  // Staff data from resourcing overview
  const [staffData, setStaffData] = useState({
    onboarding: 0,
    onProbation: 0,
    active: 0
  });

  // Training compliance data
  const [complianceData, setComplianceData] = useState({
    onboardingCompliant: 0,
    onProbationCompliant: 0,
    activeCompliant: 0
  });

  useEffect(() => {
    if (profile?.company_id) {
      loadStaffData();
      loadComplianceData();
    }
  }, [profile?.company_id, meetingId]);

  // Listen for resourcing data updates
  useEffect(() => {
    const handleResourcingUpdate = (event: CustomEvent) => {
      if (event.detail.companyId === profile?.company_id && 
          event.detail.meetingId === meetingId) {
        console.log('StaffTrainingAnalytics: Received resourcing data update:', event.detail.data);
        setStaffData({
          onboarding: event.detail.data.onboarding || 0,
          onProbation: event.detail.data.onProbation || 0,
          active: event.detail.data.active || 0
        });
      }
    };

    window.addEventListener('resourcing-data-updated', handleResourcingUpdate as EventListener);
    return () => window.removeEventListener('resourcing-data-updated', handleResourcingUpdate as EventListener);
  }, [profile?.company_id, meetingId]);

  const loadStaffData = async () => {
    if (!profile?.company_id) return;

    try {
      console.log('StaffTrainingAnalytics: Loading staff data for company:', profile.company_id, 'meetingId:', meetingId);
      
      // Strategy: Load ALL resourcing data for this company and consolidate the most recent data
      const { data: allData, error } = await supabase
        .from('resourcing_overview')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('updated_at', { ascending: false });

      console.log('🔍 StaffTrainingAnalytics: Found all company data:', allData?.length || 0, 'records');
      
      if (error && error.code !== 'PGRST116') {
        console.error('StaffTrainingAnalytics: Error loading staff data:', error);
        return;
      }

      if (allData && allData.length > 0) {
        console.log('🔍 StaffTrainingAnalytics: Consolidating data from', allData.length, 'records');
        
        // Use the most recent non-zero values, prioritizing data from the current meeting if available
        let consolidatedData = {
          onboarding: 0,
          onProbation: 0,
          active: 0
        };
        
        // Process all records to find the best values
        allData.forEach((record, index) => {
          console.log(`🔍 StaffTrainingAnalytics: Processing record ${index + 1}:`, record);
          
          // If this is the first record or if we find non-zero values, use them
          if (index === 0 || 
              (record.onboarding > 0 && consolidatedData.onboarding === 0) ||
              (record.on_probation > 0 && consolidatedData.onProbation === 0) ||
              (record.active > 0 && consolidatedData.active === 0)) {
            
            consolidatedData = {
              onboarding: record.onboarding || consolidatedData.onboarding,
              onProbation: record.on_probation || consolidatedData.onProbation,
              active: record.active || consolidatedData.active
            };
          }
        });
        
        console.log('🔍 StaffTrainingAnalytics: Consolidated data:', consolidatedData);
        setStaffData(consolidatedData);
      }
    } catch (error) {
      console.error('StaffTrainingAnalytics: Error loading staff data:', error);
    }
  };

  const loadComplianceData = async () => {
    if (!profile?.company_id) return;

    console.log('🔍 StaffTrainingAnalytics: Loading compliance data for company_id:', profile.company_id);
    
    try {
      // Strategy: Load ALL staff training analytics for this company and consolidate the most recent data
      const { data: allData, error } = await supabase
        .from('staff_training_analytics')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('updated_at', { ascending: false });

      console.log('🔍 StaffTrainingAnalytics: Found all company compliance data:', allData?.length || 0, 'records');
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading training compliance data:', error);
        return;
      }

      if (allData && allData.length > 0) {
        console.log('🔍 StaffTrainingAnalytics: Consolidating compliance data from', allData.length, 'records');
        
        // Use the most recent non-zero values
        let consolidatedData = {
          onboardingCompliant: 0,
          onProbationCompliant: 0,
          activeCompliant: 0
        };
        
        allData.forEach((record, index) => {
          const savedData = record.training_data as any || {};
          console.log(`🔍 StaffTrainingAnalytics: Processing compliance record ${index + 1}:`, savedData);
          
          if (index === 0 || 
              (savedData.onboardingCompliant > 0 && consolidatedData.onboardingCompliant === 0) ||
              (savedData.onProbationCompliant > 0 && consolidatedData.onProbationCompliant === 0) ||
              (savedData.activeCompliant > 0 && consolidatedData.activeCompliant === 0)) {
            
            consolidatedData = {
              onboardingCompliant: savedData.onboardingCompliant || consolidatedData.onboardingCompliant,
              onProbationCompliant: savedData.onProbationCompliant || consolidatedData.onProbationCompliant,
              activeCompliant: savedData.activeCompliant || consolidatedData.activeCompliant
            };
          }
        });
        
        console.log('🔍 StaffTrainingAnalytics: Consolidated compliance data:', consolidatedData);
        setComplianceData(consolidatedData);
        console.log('✅ StaffTrainingAnalytics: Set consolidated compliance data to state');
      } else {
        console.log('🔍 StaffTrainingAnalytics: No database compliance data found, trying localStorage backup');
        // Try localStorage backup
        const backupKey = `staff_training_backup_${profile.company_id}`;
        const backupData = localStorage.getItem(backupKey);
        if (backupData) {
          try {
            const backup = JSON.parse(backupData);
            setComplianceData(backup);
            console.log('✅ StaffTrainingAnalytics: Loaded compliance data from localStorage backup');
          } catch (error) {
            console.error('Error loading backup data:', error);
          }
        }
      }

    } catch (error) {
      console.error('Error loading training compliance data:', error);
      // Try localStorage backup
      const backupKey = `staff_training_backup_${profile.company_id}`;
      const backupData = localStorage.getItem(backupKey);
      if (backupData) {
        try {
          const backup = JSON.parse(backupData);
          setComplianceData(backup);
          console.log('✅ StaffTrainingAnalytics: Loaded compliance data from localStorage backup (fallback)');
        } catch (error) {
          console.error('Error loading backup data:', error);
        }
      }
    }
  };

  const saveComplianceData = async (newData: typeof complianceData) => {
    if (!profile?.company_id) return;

    console.log('🔄 StaffTrainingAnalytics: Starting save operation', {
      companyId: profile.company_id,
      data: newData,
      timestamp: new Date().toISOString()
    });

    try {
      const dataToSave = {
        company_id: profile.company_id,
        training_data: newData,
        updated_at: new Date().toISOString()
      };

      console.log('💾 StaffTrainingAnalytics: Attempting database save with payload:', dataToSave);

      // First try to update existing record
      const { data: existingData } = await supabase
        .from('staff_training_analytics')
        .select('id')
        .eq('company_id', profile.company_id)
        .maybeSingle();

      let result;
      if (existingData) {
        // Update existing record
        console.log('📝 StaffTrainingAnalytics: Updating existing record:', existingData.id);
        result = await supabase
          .from('staff_training_analytics')
          .update(dataToSave)
          .eq('id', existingData.id)
          .select();
      } else {
        // Insert new record
        console.log('➕ StaffTrainingAnalytics: Inserting new record');
        result = await supabase
          .from('staff_training_analytics')
          .insert(dataToSave)
          .select();
      }

      if (result.error) {
        console.error('❌ StaffTrainingAnalytics: Database save failed:', result.error);
        throw result.error;
      } else {
        console.log('✅ StaffTrainingAnalytics: Successfully saved to database:', result.data);
        // Save backup to localStorage
        localStorage.setItem(`staff_training_backup_${profile.company_id}`, JSON.stringify(newData));
        console.log('💾 StaffTrainingAnalytics: Also saved backup to localStorage');
      }
    } catch (error) {
      console.error('❌ StaffTrainingAnalytics: Exception in saveData:', error);
      // Fallback to localStorage
      if (profile?.company_id) {
        localStorage.setItem(`staff_training_backup_${profile.company_id}`, JSON.stringify(newData));
        console.log('💾 StaffTrainingAnalytics: Exception fallback to localStorage');
      }
    }
  };

  const EditableCell = ({ value, onChange }: { value: number; onChange: (value: number) => void }) => {
    const [editing, setEditing] = useState(false);
    const [editValue, setEditValue] = useState('');

    const handleStartEdit = () => {
      setEditing(true);
      setEditValue('');
    };

    const handleSave = () => {
      const numValue = parseInt(editValue) || 0;
      onChange(numValue);
      setEditing(false);
    };

    if (editing) {
      return (
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') setEditing(false);
          }}
          className="w-16 h-8 text-sm bg-stone-50 text-black"
          autoFocus
        />
      );
    }

    return (
      <span className="cursor-pointer hover:bg-accent/50 p-1 rounded text-black" onClick={handleStartEdit}>
        {value}
      </span>
    );
  };

  const handleComplianceChange = (field: keyof typeof complianceData, value: number) => {
    const newData = { ...complianceData, [field]: value };
    setComplianceData(newData);
    saveComplianceData(newData);
  };

  const getCompliancePercentage = (compliant: number, total: number) => {
    return total > 0 ? Math.round((compliant / total) * 100) : 0;
  };

  const getComplianceColor = (percentage: number) => {
    if (percentage === 100) return "text-blue-600"; // Outstanding: 100%
    if (percentage >= 98) return "text-green-600"; // Good: 98-100%
    if (percentage >= 90) return "text-amber-600"; // Needs improvement: 90-97%
    return "text-red-600"; // Inadequate: Below 90%
  };

  return (
    <div data-analytics="staff-training" className="space-y-6 mt-4 p-6 border border-border rounded-lg bg-stone-50">
      <div className="grid grid-cols-4 gap-4">
        {/* Header Row */}
        <div className="text-sm font-medium text-gray-600"></div>
        <div className="text-sm font-medium text-gray-600 text-center">Staff Count</div>
        <div className="text-sm font-medium text-gray-600 text-center">Compliant</div>
        <div className="text-sm font-medium text-gray-600 text-center">Compliance %</div>
        
        {/* Onboarding Row */}
        <div className="text-sm text-black">Onboarding:</div>
        <div className="text-lg text-black text-center">{staffData.onboarding}</div>
        <div className="flex justify-center">
          <EditableCell 
            value={complianceData.onboardingCompliant} 
            onChange={(value) => handleComplianceChange('onboardingCompliant', value)}
          />
        </div>
        <div className={`text-lg text-center ${getComplianceColor(getCompliancePercentage(complianceData.onboardingCompliant, staffData.onboarding))}`}>
          {getCompliancePercentage(complianceData.onboardingCompliant, staffData.onboarding)}%
        </div>
        
        {/* On Probation Row */}
        <div className="text-sm text-black">On Probation:</div>
        <div className="text-lg text-black text-center">{staffData.onProbation}</div>
        <div className="flex justify-center">
          <EditableCell 
            value={complianceData.onProbationCompliant} 
            onChange={(value) => handleComplianceChange('onProbationCompliant', value)}
          />
        </div>
        <div className={`text-lg text-center ${getComplianceColor(getCompliancePercentage(complianceData.onProbationCompliant, staffData.onProbation))}`}>
          {getCompliancePercentage(complianceData.onProbationCompliant, staffData.onProbation)}%
        </div>
        
        {/* Passed Probation Row */}
        <div className="text-sm">Passed Probation:</div>
        <div className="text-lg text-black text-center">{staffData.active}</div>
        <div className="flex justify-center">
          <EditableCell 
            value={complianceData.activeCompliant} 
            onChange={(value) => handleComplianceChange('activeCompliant', value)}
          />
        </div>
        <div className={`text-lg text-center ${getComplianceColor(getCompliancePercentage(complianceData.activeCompliant, staffData.active))}`}>
          {getCompliancePercentage(complianceData.activeCompliant, staffData.active)}%
        </div>
      </div>
    </div>
  );
};