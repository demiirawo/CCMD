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
  }, [profile?.company_id]);
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
    return total > 0 ? Math.round(compliant / total * 100) : 0;
  };
  return <div className="space-y-6 mt-4 p-6 border border-border rounded-lg bg-stone-50">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Box 1: Staff By Recruitment Stage (Read-only from resourcing data) */}
        <Card className="p-6">
          <h5 className="text-md font-medium mb-4 text-foreground">Staff By Recruitment Stage</h5>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Onboarding:</span>
              <span className="text-lg font-semibold text-primary">{staffData.onboarding}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">On Probation:</span>
              <span className="text-lg font-semibold text-primary">{staffData.onProbation}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Passed Probation:</span>
              <span className="text-lg font-semibold text-primary">{staffData.active}</span>
            </div>
            
          </div>
        </Card>

        {/* Box 2: Number of Staff Who Are Compliant */}
        <Card className="p-6">
          <h5 className="text-md font-medium mb-4 text-foreground">Staff Who Are Compliant</h5>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="onboarding-compliant" className="text-sm font-medium">Onboarding:</Label>
              <Input id="onboarding-compliant" type="number" value={complianceData.onboardingCompliant} onChange={e => handleComplianceChange('onboardingCompliant', parseInt(e.target.value) || 0)} className="w-20 h-8 text-center" min="0" max={staffData.onboarding} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="probation-compliant" className="text-sm font-medium">On Probation:</Label>
              <Input id="probation-compliant" type="number" value={complianceData.onProbationCompliant} onChange={e => handleComplianceChange('onProbationCompliant', parseInt(e.target.value) || 0)} className="w-20 h-8 text-center" min="0" max={staffData.onProbation} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="active-compliant" className="text-sm font-medium">Passed Probation:</Label>
              <Input id="active-compliant" type="number" value={complianceData.activeCompliant} onChange={e => handleComplianceChange('activeCompliant', parseInt(e.target.value) || 0)} className="w-20 h-8 text-center" min="0" max={staffData.active} />
            </div>
            
          </div>
        </Card>

        {/* Box 3: Compliance % by Each Stage of Recruitment */}
        <Card className="p-6">
          <h5 className="text-md font-medium mb-4 text-foreground">Compliance % By Stage</h5>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Onboarding:</span>
              <span className="text-lg font-semibold text-blue-600">
                {getCompliancePercentage(complianceData.onboardingCompliant, staffData.onboarding)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">On Probation:</span>
              <span className="text-lg font-semibold text-yellow-600">
                {getCompliancePercentage(complianceData.onProbationCompliant, staffData.onProbation)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Passed Probation:</span>
              <span className="text-lg font-semibold text-green-600">
                {getCompliancePercentage(complianceData.activeCompliant, staffData.active)}%
              </span>
            </div>
            
          </div>
        </Card>
      </div>
    </div>;
};