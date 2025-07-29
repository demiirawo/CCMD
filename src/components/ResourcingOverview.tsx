import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
interface ResourcingOverviewProps {
  meetingDate?: Date;
  meetingId?: string;
}
export const ResourcingOverview = ({
  meetingDate,
  meetingId
}: ResourcingOverviewProps) => {
  const {
    profile
  } = useAuth();
  const [data, setData] = useState({
    onboarding: 0,
    onProbation: 0,
    active: 0,
    requiredStaffingLevel: 0
  });
  const totalCurrentStaff = data.onboarding + data.onProbation + data.active;
  const capacityPercentage = data.requiredStaffingLevel > 0 ? Math.round(totalCurrentStaff / data.requiredStaffingLevel * 100) : 0;
  useEffect(() => {
    if (profile?.company_id) {
      loadData();
    }
  }, [profile?.company_id, meetingId]);
  const loadData = async () => {
    if (!profile?.company_id) return;
    try {
      const {
        data: savedData,
        error
      } = await supabase.from('dashboard_data').select('data_content').eq('company_id', profile.company_id).eq('data_type', 'resourcing_overview').maybeSingle();
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading resourcing overview:', error);
        return;
      }
      if (savedData?.data_content) {
        setData(savedData.data_content as typeof data);
      } else {
        // Try to load from localStorage backup
        const backupKey = `resourcing_overview_backup_${profile.company_id}`;
        const backupData = localStorage.getItem(backupKey);
        if (backupData) {
          try {
            const backup = JSON.parse(backupData);
            setData(backup);
          } catch (error) {
            console.error('Error loading backup data:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error loading resourcing overview:', error);
      // Try to load from localStorage backup
      const backupKey = `resourcing_overview_backup_${profile.company_id}`;
      const backupData = localStorage.getItem(backupKey);
      if (backupData) {
        try {
          const backup = JSON.parse(backupData);
          setData(backup);
        } catch (error) {
          console.error('Error loading backup data:', error);
        }
      }
    }
  };
  const saveData = async (newData: typeof data) => {
    if (!profile?.company_id) return;
    try {
      const {
        error
      } = await supabase.from('dashboard_data').upsert({
        company_id: profile.company_id,
        meeting_id: meetingId,
        data_type: 'resourcing_overview',
        data_content: newData,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'company_id,meeting_id,data_type'
      });
      if (error) {
        console.error('Error saving resourcing overview:', error);
        throw error;
      } else {
        // Save to localStorage as backup
        localStorage.setItem(`resourcing_overview_backup_${profile.company_id}`, JSON.stringify(newData));
      }
    } catch (error) {
      console.error('Error saving resourcing overview:', error);
      // Save to localStorage as fallback
      if (profile?.company_id) {
        localStorage.setItem(`resourcing_overview_backup_${profile.company_id}`, JSON.stringify(newData));
      }
    }
  };
  const handleInputChange = (field: keyof typeof data, value: string) => {
    const numValue = value === '' ? 0 : parseInt(value) || 0;
    const newData = {
      ...data,
      [field]: numValue
    };
    setData(newData);
    saveData(newData);
  };
  const getCapacityColor = () => {
    if (capacityPercentage === 100) return "text-blue-600"; // Outstanding: 100%
    if (capacityPercentage >= 98) return "text-green-600"; // Good: 98-100%
    if (capacityPercentage >= 90) return "text-amber-600"; // Needs improvement: 90-97%
    return "text-red-600"; // Inadequate: Below 90%
  };
  const getCapacityStatus = () => {
    if (capacityPercentage === 100) return "Outstanding";
    if (capacityPercentage >= 98) return "Good";
    if (capacityPercentage >= 90) return "Needs Improvement";
    return "Inadequate";
  };
  return <div className="space-y-6 mt-4 p-6 border border-border rounded-lg bg-stone-50">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Staff by Recruitment Stage */}
        <Card className="p-6">
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="onboarding" className="text-sm font-medium">Onboarding:</Label>
              <Input id="onboarding" type="number" value={data.onboarding === 0 ? '' : data.onboarding} onChange={e => handleInputChange('onboarding', e.target.value)} onFocus={e => e.target.select()} min="0" className="w-20 h-8 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-stone-50" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="on-probation" className="text-sm font-medium">On Probation:</Label>
              <Input id="on-probation" type="number" value={data.onProbation === 0 ? '' : data.onProbation} onChange={e => handleInputChange('onProbation', e.target.value)} onFocus={e => e.target.select()} min="0" className="w-20 h-8 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-stone-50" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="active" className="text-sm font-medium">Passed Probation:</Label>
              <Input id="active" type="number" value={data.active === 0 ? '' : data.active} onChange={e => handleInputChange('active', e.target.value)} onFocus={e => e.target.select()} min="0" className="w-20 h-8 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-stone-50" />
            </div>
            
          </div>
        </Card>

        {/* Required Staffing Level */}
        <Card className="p-6">
          
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="text-center">
              
            </div>
            <Input id="required-staff" type="number" value={data.requiredStaffingLevel} onChange={e => handleInputChange('requiredStaffingLevel', e.target.value)} onFocus={e => e.target.select()} min="0" className="w-24 h-12 text-center text-lg font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-stone-50" />
            <div className="text-xs text-muted-foreground text-center">
              Required for full capacity
            </div>
          </div>
        </Card>

        {/* Capacity Status */}
        <Card className="p-6">
          
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className={`text-4xl font-bold ${getCapacityColor()}`}>
              {capacityPercentage}%
            </div>
            <div className="text-sm text-center text-muted-foreground">
              {getCapacityStatus()}
            </div>
            <div className="text-xs text-center text-muted-foreground">
              {totalCurrentStaff} current / {data.requiredStaffingLevel} required
            </div>
          </div>
        </Card>
      </div>
    </div>;
};