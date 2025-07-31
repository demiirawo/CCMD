import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useRobustAnalytics } from "@/hooks/useRobustAnalytics";

interface ResourcingOverviewProps {
  meetingDate?: Date;
  meetingId?: string;
}

export const ResourcingOverview = ({
  meetingDate,
  meetingId
}: ResourcingOverviewProps) => {
  const { profile } = useAuth();
  
  const { data, updateData, isLoading } = useRobustAnalytics({
    companyId: profile?.company_id || '',
    meetingId: meetingId || '',
    analyticsType: 'resourcing_overview',
    tableName: 'dashboard_data'
  });

  const totalCurrentStaff = (data.onboarding || 0) + (data.onProbation || 0) + (data.active || 0);
  const capacityPercentage = (data.requiredStaffingLevel || 0) > 0 ? Math.round(totalCurrentStaff / (data.requiredStaffingLevel || 0) * 100) : 0;

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

  const handleInputChange = (field: string, value: number) => {
    updateData({ [field]: value });
  };

  const getCapacityColor = () => {
    if (capacityPercentage === 100) return "text-blue-600";
    if (capacityPercentage >= 98) return "text-green-600";
    if (capacityPercentage >= 90) return "text-amber-600";
    return "text-red-600";
  };
  
  const getCapacityStatus = () => {
    if (capacityPercentage === 100) return "Outstanding";
    if (capacityPercentage >= 98) return "Good";
    if (capacityPercentage >= 90) return "Needs Improvement";
    return "Inadequate";
  };

  if (isLoading) {
    return <div className="space-y-6 mt-4 p-6 border border-border rounded-lg bg-stone-50">
      <div className="text-center">Loading...</div>
    </div>;
  }

  return <div className="space-y-6 mt-4 p-6 border border-border rounded-lg bg-stone-50">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Staff by Recruitment Stage */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="onboarding" className="text-sm font-medium">Onboarding:</Label>
            <EditableCell value={data.onboarding || 0} onChange={value => handleInputChange('onboarding', value)} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="on-probation" className="text-sm font-medium">On Probation:</Label>
            <EditableCell value={data.onProbation || 0} onChange={value => handleInputChange('onProbation', value)} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="active" className="text-sm font-medium">Passed Probation:</Label>
            <EditableCell value={data.active || 0} onChange={value => handleInputChange('active', value)} />
          </div>
        </div>
      </Card>

      {/* Required Staffing Level */}
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="text-center">
            
          </div>
          <EditableCell value={data.requiredStaffingLevel || 0} onChange={value => handleInputChange('requiredStaffingLevel', value)} />
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
            {totalCurrentStaff} current / {data.requiredStaffingLevel || 0} required
          </div>
        </div>
      </Card>
    </div>
  </div>;
};