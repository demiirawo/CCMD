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
  const { profile } = useAuth();
  
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
      const { data: savedData, error } = await supabase
        .from('dashboard_data')
        .select('data_content')
        .eq('company_id', profile.company_id)
        .eq('data_type', 'resourcing_overview')
        .maybeSingle();

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
      console.log('ResourcingOverview: Saving data:', newData);
      const { error } = await supabase
        .from('dashboard_data')
        .upsert({
          company_id: profile.company_id,
          meeting_id: meetingId,
          data_type: 'resourcing_overview',
          data_content: newData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'company_id,meeting_id,data_type'
        });

      if (error) {
        console.error('ResourcingOverview: Error saving data:', error);
        throw error;
      } else {
        console.log('ResourcingOverview: Data saved successfully');
        // Save to localStorage as backup
        localStorage.setItem(`resourcing_overview_backup_${profile.company_id}`, JSON.stringify(newData));
        
        // Trigger a custom event to notify other components that data has been updated
        window.dispatchEvent(new CustomEvent('resourcing-data-updated', { 
          detail: { 
            companyId: profile.company_id, 
            meetingId, 
            data: newData 
          } 
        }));
      }
    } catch (error) {
      console.error('ResourcingOverview: Error saving data:', error);
      // Save to localStorage as fallback
      if (profile?.company_id) {
        localStorage.setItem(`resourcing_overview_backup_${profile.company_id}`, JSON.stringify(newData));
      }
    }
  };

  const EditableCell = ({
    value,
    onChange
  }: {
    value: number;
    onChange: (value: number) => void;
  }) => {
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
      return <Input 
        value={editValue} 
        onChange={e => setEditValue(e.target.value)} 
        onBlur={handleSave} 
        onKeyDown={e => {
          if (e.key === 'Enter') handleSave();
          if (e.key === 'Escape') setEditing(false);
        }} 
        className="w-16 h-8 text-sm" 
        autoFocus 
      />;
    }
    
    return <span className="cursor-pointer hover:bg-accent/50 p-1 rounded" onClick={handleStartEdit}>
      {value}
    </span>;
  };

  const handleInputChange = (field: keyof typeof data, value: number) => {
    const newData = {
      ...data,
      [field]: value
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
            <EditableCell value={data.onboarding} onChange={value => handleInputChange('onboarding', value)} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="on-probation" className="text-sm font-medium">On Probation:</Label>
            <EditableCell value={data.onProbation} onChange={value => handleInputChange('onProbation', value)} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="active" className="text-sm font-medium">Passed Probation:</Label>
            <EditableCell value={data.active} onChange={value => handleInputChange('active', value)} />
          </div>
        </div>
      </Card>

      {/* Required Staffing Level */}
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="text-center">
            
          </div>
          <EditableCell value={data.requiredStaffingLevel} onChange={value => handleInputChange('requiredStaffingLevel', value)} />
          <div className="text-xs text-muted-foreground text-center">Target staffing level</div>
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