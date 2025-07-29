import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface StaffTrainingAnalyticsProps {
  meetingDate?: Date;
  meetingId?: string;
}

export const StaffTrainingAnalytics = ({
  meetingDate,
  meetingId
}: StaffTrainingAnalyticsProps) => {
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
  }, [profile?.company_id]);

  const loadStaffData = async () => {
    if (!profile?.company_id) return;

    try {
      const { data: savedData, error } = await supabase
        .from('dashboard_data')
        .select('data_content')
        .eq('company_id', profile.company_id)
        .eq('data_type', 'resourcing_overview')
        .maybeSingle();

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
      const { data, error } = await supabase
        .from('staff_training_analytics')
        .select('*')
        .eq('company_id', profile.company_id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading training compliance data:', error);
        return;
      }

      if (data) {
        const savedData = data.training_data as any || {};
        setComplianceData({
          onboardingCompliant: savedData.onboardingCompliant || 0,
          onProbationCompliant: savedData.onProbationCompliant || 0,
          activeCompliant: savedData.activeCompliant || 0
        });
      } else {
        // Try to load from localStorage backup
        const backupKey = `staff_training_backup_${profile.company_id}`;
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
      console.error('Error loading training compliance data:', error);
      // Try to load from localStorage backup
      const backupKey = `staff_training_backup_${profile.company_id}`;
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
      const { error } = await supabase
        .from('staff_training_analytics')
        .upsert({
          company_id: profile.company_id,
          training_data: newData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'company_id'
        });

      if (error) {
        console.error('Error saving training compliance data:', error);
        throw error;
      } else {
        // Save to localStorage as backup
        localStorage.setItem(`staff_training_backup_${profile.company_id}`, JSON.stringify(newData));
      }
    } catch (error) {
      console.error('Error saving training compliance data:', error);
      // Save to localStorage as fallback
      if (profile?.company_id) {
        localStorage.setItem(`staff_training_backup_${profile.company_id}`, JSON.stringify(newData));
      }
    }
  };

  const handleComplianceChange = (field: keyof typeof complianceData, value: number) => {
    const newData = { ...complianceData, [field]: value };
    setComplianceData(newData);
    saveComplianceData(newData);
  };

  const getCompliancePercentage = (compliant: number, total: number) => {
    return total > 0 ? Math.round((compliant / total) * 100) : 0;
  };

  return (
    <div className="space-y-6 mt-4 p-6 border border-border rounded-lg bg-stone-50">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Box 1: Staff By Recruitment Stage (Read-only from resourcing data) */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <span className="text-sm">Onboarding:</span>
              <span className="text-lg text-primary text-right">{staffData.onboarding}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <span className="text-sm">On Probation:</span>
              <span className="text-lg text-primary text-right">{staffData.onProbation}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <span className="text-sm">Passed Probation:</span>
              <span className="text-lg text-primary text-right">{staffData.active}</span>
            </div>
          </div>
        </Card>

        {/* Box 2: Number of Staff Who Are Compliant */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 items-center">
              <Label htmlFor="onboarding-compliant" className="text-sm">Onboarding:</Label>
              <Input 
                id="onboarding-compliant" 
                type="number" 
                value={complianceData.onboardingCompliant} 
                onChange={e => handleComplianceChange('onboardingCompliant', parseInt(e.target.value) || 0)} 
                onFocus={e => e.target.select()}
                className="w-20 h-8 text-center justify-self-end [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                min="0" 
                max={staffData.onboarding} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4 items-center">
              <Label htmlFor="probation-compliant" className="text-sm">On Probation:</Label>
              <Input 
                id="probation-compliant" 
                type="number" 
                value={complianceData.onProbationCompliant} 
                onChange={e => handleComplianceChange('onProbationCompliant', parseInt(e.target.value) || 0)} 
                onFocus={e => e.target.select()}
                className="w-20 h-8 text-center justify-self-end [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                min="0" 
                max={staffData.onProbation} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4 items-center">
              <Label htmlFor="active-compliant" className="text-sm">Passed Probation:</Label>
              <Input 
                id="active-compliant" 
                type="number" 
                value={complianceData.activeCompliant} 
                onChange={e => handleComplianceChange('activeCompliant', parseInt(e.target.value) || 0)} 
                onFocus={e => e.target.select()}
                className="w-20 h-8 text-center justify-self-end [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                min="0" 
                max={staffData.active} 
              />
            </div>
          </div>
        </Card>

        {/* Box 3: Compliance % by Each Stage of Recruitment */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <span className="text-sm">Onboarding:</span>
              <span className="text-lg text-blue-600 text-right">
                {getCompliancePercentage(complianceData.onboardingCompliant, staffData.onboarding)}%
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <span className="text-sm">On Probation:</span>
              <span className="text-lg text-yellow-600 text-right">
                {getCompliancePercentage(complianceData.onProbationCompliant, staffData.onProbation)}%
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <span className="text-sm">Passed Probation:</span>
              <span className="text-lg text-green-600 text-right">
                {getCompliancePercentage(complianceData.activeCompliant, staffData.active)}%
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};