import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useRobustAnalytics } from "@/hooks/useRobustAnalytics";
import { supabase } from "@/integrations/supabase/client";

interface StaffDocumentsAnalyticsProps {
  meetingDate?: Date;
  meetingId?: string;
}

export const StaffDocumentsAnalytics = ({
  meetingDate,
  meetingId
}: StaffDocumentsAnalyticsProps) => {
  const { profile } = useAuth();

  // Staff recruitment stage data (fetched from resourcing overview)
  const [staffData, setStaffData] = useState({
    onboarding: 0,
    onProbation: 0,
    active: 0
  });

  // Staff compliance data
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
        console.log('StaffDocumentsAnalytics: Received resourcing data update:', event.detail.data);
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
      console.log('StaffDocumentsAnalytics: Loading staff data for company:', profile.company_id, 'meetingId:', meetingId);
      
      // Load data for the specific meeting if meetingId is provided, otherwise load company-wide data
      let query = supabase
        .from('dashboard_data')
        .select('data_content')
        .eq('company_id', profile.company_id)
        .eq('data_type', 'resourcing_overview');
      
      if (meetingId) {
        query = query.eq('meeting_id', meetingId);
      } else {
        query = query.is('meeting_id', null);
      }
      
      const { data: savedData, error } = await query.maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('StaffDocumentsAnalytics: Error loading staff data:', error);
        return;
      }

      console.log('StaffDocumentsAnalytics: Raw data received:', savedData);

      if (savedData?.data_content) {
        const resourcingData = savedData.data_content as any;
        console.log('StaffDocumentsAnalytics: Resourcing data:', resourcingData);
        
        const newStaffData = {
          onboarding: resourcingData.onboarding || 0,
          onProbation: resourcingData.onProbation || 0,
          active: resourcingData.active || 0
        };
        
        console.log('StaffDocumentsAnalytics: Setting staff data:', newStaffData);
        setStaffData(newStaffData);
      } else {
        console.log('StaffDocumentsAnalytics: No data found, checking for any resourcing_overview data');
        
        // Fallback: check for any resourcing data without meeting_id filter
        const { data: fallbackData } = await supabase
          .from('dashboard_data')
          .select('data_content')
          .eq('company_id', profile.company_id)
          .eq('data_type', 'resourcing_overview')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
          
        if (fallbackData?.data_content) {
          const resourcingData = fallbackData.data_content as any;
          console.log('StaffDocumentsAnalytics: Using fallback data:', resourcingData);
          setStaffData({
            onboarding: resourcingData.onboarding || 0,
            onProbation: resourcingData.onProbation || 0,
            active: resourcingData.active || 0
          });
        }
      }
    } catch (error) {
      console.error('StaffDocumentsAnalytics: Error loading staff data:', error);
    }
  };

  const loadComplianceData = async () => {
    if (!profile?.company_id) return;

    console.log('🔍 StaffDocumentsAnalytics: Loading compliance data for company_id:', profile.company_id);
    
    try {
      // Strategy: Load ALL staff documents analytics for this company and consolidate the most recent data
      const { data: allData, error } = await supabase
        .from('staff_documents_analytics')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('updated_at', { ascending: false });

      console.log('🔍 StaffDocumentsAnalytics: Found all company compliance data:', allData?.length || 0, 'records');
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading compliance data:', error);
        return;
      }

      if (allData && allData.length > 0) {
        console.log('🔍 StaffDocumentsAnalytics: Consolidating compliance data from', allData.length, 'records');
        
        // Use the most recent non-zero values
        let consolidatedData = {
          onboardingCompliant: 0,
          onProbationCompliant: 0,
          activeCompliant: 0
        };
        
        allData.forEach((record, index) => {
          const savedData = record.documents_data as any || {};
          console.log(`🔍 StaffDocumentsAnalytics: Processing compliance record ${index + 1}:`, savedData);
          
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
        
        console.log('🔍 StaffDocumentsAnalytics: Consolidated compliance data:', consolidatedData);
        setComplianceData(consolidatedData);
        console.log('✅ StaffDocumentsAnalytics: Set consolidated compliance data to state');
      } else {
        console.log('🔍 StaffDocumentsAnalytics: No database compliance data found, trying localStorage backup');
        // Try to load from localStorage backup
        const backupKey = `staff_documents_backup_${profile.company_id}`;
        const backupData = localStorage.getItem(backupKey);
        if (backupData) {
          try {
            const backupComplianceData = JSON.parse(backupData);
            setComplianceData(backupComplianceData);
            console.log('✅ StaffDocumentsAnalytics: Loaded compliance data from localStorage backup');
          } catch (error) {
            console.error('Error loading backup data:', error);
          }
        }
      }

    } catch (error) {
      console.error('Error loading compliance data:', error);
      // Try to load from localStorage backup
      const backupKey = `staff_documents_backup_${profile.company_id}`;
      const backupData = localStorage.getItem(backupKey);
      if (backupData) {
        try {
          const backupComplianceData = JSON.parse(backupData);
          setComplianceData(backupComplianceData);
          console.log('✅ StaffDocumentsAnalytics: Loaded compliance data from localStorage backup (fallback)');
        } catch (error) {
          console.error('Error loading backup data:', error);
        }
      }
    }
  };

  const saveComplianceData = async (newData: typeof complianceData) => {
    if (!profile?.company_id) return;

    console.log('🔄 StaffDocumentsAnalytics: Starting save operation', {
      companyId: profile.company_id,
      data: newData,
      timestamp: new Date().toISOString()
    });

    try {
      const dataToSave = {
        company_id: profile.company_id,
        documents_data: newData,
        updated_at: new Date().toISOString()
      };

      console.log('💾 StaffDocumentsAnalytics: Attempting database save with payload:', dataToSave);

      // First try to update existing record
      const { data: existingData } = await supabase
        .from('staff_documents_analytics')
        .select('id')
        .eq('company_id', profile.company_id)
        .maybeSingle();

      let result;
      if (existingData) {
        // Update existing record
        console.log('📝 StaffDocumentsAnalytics: Updating existing record:', existingData.id);
        result = await supabase
          .from('staff_documents_analytics')
          .update(dataToSave)
          .eq('id', existingData.id)
          .select();
      } else {
        // Insert new record
        console.log('➕ StaffDocumentsAnalytics: Inserting new record');
        result = await supabase
          .from('staff_documents_analytics')
          .insert(dataToSave)
          .select();
      }

      if (result.error) {
        console.error('❌ StaffDocumentsAnalytics: Database save failed:', result.error);
        throw result.error;
      } else {
        console.log('✅ StaffDocumentsAnalytics: Successfully saved to database:', result.data);
        // Save to localStorage as backup
        localStorage.setItem(`staff_documents_backup_${profile.company_id}`, JSON.stringify(newData));
        console.log('💾 StaffDocumentsAnalytics: Also saved backup to localStorage');
      }
    } catch (error) {
      console.error('❌ StaffDocumentsAnalytics: Exception in saveData:', error);
      // Save to localStorage as fallback
      if (profile?.company_id) {
        localStorage.setItem(`staff_documents_backup_${profile.company_id}`, JSON.stringify(newData));
        console.log('💾 StaffDocumentsAnalytics: Exception fallback to localStorage');
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
      <span className="cursor-pointer hover:bg-accent/50 p-1 rounded" onClick={handleStartEdit}>
        {value}
      </span>
    );
  };

  const handleComplianceChange = (field: keyof typeof complianceData, value: number) => {
    const newData = {
      ...complianceData,
      [field]: value
    };
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
    <div className="space-y-6 mt-4 p-6 border border-border rounded-lg bg-stone-50">
      <div className="grid grid-cols-4 gap-4">
        {/* Header Row */}
        <div className="text-sm font-medium text-gray-600"></div>
        <div className="text-sm font-medium text-gray-600 text-center">Staff Count</div>
        <div className="text-sm font-medium text-gray-600 text-center">Compliant</div>
        <div className="text-sm font-medium text-gray-600 text-center">Compliance %</div>
        
        {/* Onboarding Row */}
        <div className="text-sm text-foreground">Onboarding:</div>
        <div className="text-lg text-foreground text-center">{staffData.onboarding}</div>
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
        <div className="text-sm text-foreground">On Probation:</div>
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
        <div className="text-sm text-foreground">Passed Probation:</div>
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