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
  const {
    profile
  } = useAuth();

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
  const loadStaffData = async () => {
    if (!profile?.company_id) return;
    try {
      const {
        data: savedData,
        error
      } = await supabase.from('dashboard_data').select('data_content').eq('company_id', profile.company_id).eq('data_type', 'resourcing_overview').maybeSingle();
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading staff data:', error);
        return;
      }
      if (savedData?.data_content) {
        const resourcingData = savedData.data_content as any;
        setStaffData({
          onboarding: resourcingData.onboarding || 0,
          onProbation: resourcingData.onProbation || 0,
          active: resourcingData.active || 0
        });
      }
    } catch (error) {
      console.error('Error loading staff data:', error);
    }
  };
  const loadComplianceData = async () => {
    if (!profile?.company_id) return;
    try {
      const {
        data,
        error
      } = await supabase.from('staff_documents_analytics').select('*').eq('company_id', profile.company_id).maybeSingle();
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
      const {
        error
      } = await supabase.from('staff_documents_analytics').upsert({
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
  const handleComplianceChange = (field: keyof typeof complianceData, value: number) => {
    const newData = {
      ...complianceData,
      [field]: value
    };
    setComplianceData(newData);
    saveComplianceData(newData);
  };
  const totalCompliant = complianceData.onboardingCompliant + complianceData.onProbationCompliant + complianceData.activeCompliant;
  const totalStaff = staffData.onboarding + staffData.onProbation + staffData.active;
  const getCompliancePercentage = (compliant: number, total: number) => {
    return total > 0 ? Math.round((compliant / total) * 100) : 0;
  };

  const getComplianceColor = (percentage: number) => {
    if (percentage >= 98) return "text-green-600"; // Green: 98-100%
    if (percentage >= 89) return "text-amber-600"; // Amber: 89-97%
    return "text-red-600"; // Red: Below 89%
  };
  return <div className="space-y-6 mt-4 p-6 border border-border rounded-lg bg-stone-50">
      <div className="grid grid-cols-4 gap-4">
        {/* Header Row */}
        <div className="text-sm font-medium text-gray-600"></div>
        <div className="text-sm font-medium text-gray-600 text-center">Staff Count</div>
        <div className="text-sm font-medium text-gray-600 text-center">Compliant</div>
        <div className="text-sm font-medium text-gray-600 text-center">Compliance %</div>
        
        {/* Onboarding Row */}
        <div className="text-sm">Onboarding:</div>
        <div className="text-lg text-primary text-center">{staffData.onboarding}</div>
        <div className="flex justify-center">
          <Input 
            type="number" 
            value={complianceData.onboardingCompliant} 
            onChange={e => handleComplianceChange('onboardingCompliant', parseInt(e.target.value) || 0)} 
            onFocus={e => e.target.select()}
            className="w-16 h-8 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
            min="0" 
            max={staffData.onboarding} 
          />
        </div>
        <div className={`text-lg text-center ${getComplianceColor(getCompliancePercentage(complianceData.onboardingCompliant, staffData.onboarding))}`}>
          {getCompliancePercentage(complianceData.onboardingCompliant, staffData.onboarding)}%
        </div>
        
        {/* On Probation Row */}
        <div className="text-sm">On Probation:</div>
        <div className="text-lg text-primary text-center">{staffData.onProbation}</div>
        <div className="flex justify-center">
          <Input 
            type="number" 
            value={complianceData.onProbationCompliant} 
            onChange={e => handleComplianceChange('onProbationCompliant', parseInt(e.target.value) || 0)} 
            onFocus={e => e.target.select()}
            className="w-16 h-8 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
            min="0" 
            max={staffData.onProbation} 
          />
        </div>
        <div className={`text-lg text-center ${getComplianceColor(getCompliancePercentage(complianceData.onProbationCompliant, staffData.onProbation))}`}>
          {getCompliancePercentage(complianceData.onProbationCompliant, staffData.onProbation)}%
        </div>
        
        {/* Passed Probation Row */}
        <div className="text-sm">Passed Probation:</div>
        <div className="text-lg text-primary text-center">{staffData.active}</div>
        <div className="flex justify-center">
          <Input 
            type="number" 
            value={complianceData.activeCompliant} 
            onChange={e => handleComplianceChange('activeCompliant', parseInt(e.target.value) || 0)} 
            onFocus={e => e.target.select()}
            className="w-16 h-8 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
            min="0" 
            max={staffData.active} 
          />
        </div>
        <div className={`text-lg text-center ${getComplianceColor(getCompliancePercentage(complianceData.activeCompliant, staffData.active))}`}>
          {getCompliancePercentage(complianceData.activeCompliant, staffData.active)}%
        </div>
      </div>
    </div>;
};