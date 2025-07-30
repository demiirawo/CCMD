import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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

    try {
      const { data, error } = await supabase.from('staff_documents_analytics').select('*').eq('company_id', profile.company_id).maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading compliance data:', error);
        return;
      }

      if (data) {
        const savedData = data.documents_data as any || {};
        setComplianceData({
          onboardingCompliant: savedData.onboardingCompliant || 0,
          onProbationCompliant: savedData.onProbationCompliant || 0,
          activeCompliant: savedData.activeCompliant || 0
        });
      } else {
        // Try to load from localStorage backup
        const backupKey = `staff_documents_backup_${profile.company_id}`;
        const backupData = localStorage.getItem(backupKey);
        if (backupData) {
          try {
            const backupComplianceData = JSON.parse(backupData);
            setComplianceData(backupComplianceData);
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
        } catch (error) {
          console.error('Error loading backup data:', error);
        }
      }
    }
  };

  const saveComplianceData = async (newData: typeof complianceData) => {
    if (!profile?.company_id) return;

    try {
      const { error } = await supabase.from('staff_documents_analytics').upsert({
        company_id: profile.company_id,
        documents_data: newData,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'company_id'
      });

      if (error) {
        console.error('Error saving compliance data:', error);
        throw error;
      } else {
        // Save to localStorage as backup
        localStorage.setItem(`staff_documents_backup_${profile.company_id}`, JSON.stringify(newData));
      }
    } catch (error) {
      console.error('Error saving compliance data:', error);
      // Save to localStorage as fallback
      if (profile?.company_id) {
        localStorage.setItem(`staff_documents_backup_${profile.company_id}`, JSON.stringify(newData));
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
          className="w-16 h-8 text-sm"
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
        <div className="text-sm">Onboarding:</div>
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
        <div className="text-sm">On Probation:</div>
        <div className="text-lg text-primary text-center">{staffData.onProbation}</div>
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
        <div className="text-lg text-primary text-center">{staffData.active}</div>
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