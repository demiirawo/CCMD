import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useRobustAnalytics } from "@/hooks/useRobustAnalytics";

interface CarePlanAnalyticsProps {
  meetingDate?: Date;
  meetingId?: string;
}

export const CarePlanAnalytics = ({
  meetingDate,
  meetingId
}: CarePlanAnalyticsProps) => {
  const { profile } = useAuth();
  
  const {
    data,
    isLoading,
    updateData,
    hasUnsavedChanges
  } = useRobustAnalytics({
    companyId: profile?.company_id || '',
    meetingId: meetingId || '',
    analyticsType: 'care_plan_overview',
    tableName: 'care_plan_overview',
    autoBackupInterval: 30000, // 30 seconds
    retryAttempts: 3
  });

  // Store display values separately from data values
  const [displayValues, setDisplayValues] = useState<Record<string, string>>({});

  const totalServiceUsers = (data.high_risk || 0) + (data.medium_risk || 0) + (data.low_risk || 0) + (data.na_risk || 0);
  const compliancePercentage = totalServiceUsers > 0 ? Math.round((totalServiceUsers - (data.overdue || 0)) / totalServiceUsers * 100) : 100;

  const handleInputChange = async (field: string, value: string) => {
    // Update display value immediately
    setDisplayValues(prev => ({ ...prev, [field]: value }));
    
    // Convert to number for data storage (empty string becomes 0)
    const numValue = value === '' ? 0 : parseInt(value) || 0;
    
    await updateData({
      [field]: numValue
    });
  };

  const getDisplayValue = (field: string) => {
    return displayValues[field] ?? (data[field] === 0 ? '' : (data[field] || 0).toString());
  };

  const getComplianceColor = () => {
    if (compliancePercentage === 100) return "text-blue-600"; // Outstanding: 100%
    if (compliancePercentage >= 98) return "text-green-600"; // Good: 98-100%
    if (compliancePercentage >= 90) return "text-amber-600"; // Needs improvement: 90-97%
    return "text-red-600"; // Inadequate: Below 90%
  };

  if (isLoading) {
    return (
      <div className="space-y-6 mt-4 p-6 border border-border rounded-lg bg-stone-50">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-48 bg-gray-200 rounded"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-4 p-6 border border-border rounded-lg bg-stone-50">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-foreground">Care Plan & Risk Assessment</h4>
        {hasUnsavedChanges && (
          <span className="text-xs text-amber-600 px-2 py-1 bg-amber-50 rounded">
            Saving...
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Service Users by Risk Level */}
        <Card className="p-6">
          <h5 className="text-sm font-medium mb-4 text-center">Service Users by Risk Level</h5>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="high-risk" className="text-sm font-medium">High:</Label>
              <Input 
                id="high-risk" 
                type="number" 
                value={getDisplayValue('high_risk')} 
                onChange={e => handleInputChange('high_risk', e.target.value)} 
                min="0" 
                className="w-20 h-8 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-stone-50" 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="medium-risk" className="text-sm font-medium">Medium:</Label>
              <Input 
                id="medium-risk" 
                type="number" 
                value={getDisplayValue('medium_risk')} 
                onChange={e => handleInputChange('medium_risk', e.target.value)} 
                min="0" 
                className="w-20 h-8 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-stone-50" 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="low-risk" className="text-sm font-medium">Low:</Label>
              <Input 
                id="low-risk" 
                type="number" 
                value={getDisplayValue('low_risk')} 
                onChange={e => handleInputChange('low_risk', e.target.value)} 
                min="0" 
                className="w-20 h-8 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-stone-50" 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="na-risk" className="text-sm font-medium">N/A:</Label>
              <Input 
                id="na-risk" 
                type="number" 
                value={getDisplayValue('na_risk')} 
                onChange={e => handleInputChange('na_risk', e.target.value)} 
                min="0" 
                className="w-20 h-8 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-stone-50" 
              />
            </div>
            
            <div className="border-t pt-2">
              <div className="flex items-center justify-between font-medium">
                <span>Total:</span>
                <span className="text-primary">{totalServiceUsers}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Overdue Care Plans */}
        <Card className="p-6">
          <h5 className="text-sm font-medium mb-4 text-center">Overdue Care Plans</h5>
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="text-center">
              <Input 
                id="overdue" 
                type="number" 
                value={getDisplayValue('overdue')} 
                onChange={e => handleInputChange('overdue', e.target.value)} 
                min="0" 
                max={totalServiceUsers} 
                className="w-24 h-12 text-center text-lg font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-stone-50" 
              />
            </div>
            <div className="text-xs text-muted-foreground text-center">
              Number overdue
            </div>
          </div>
        </Card>

        {/* Compliance Percentage */}
        <Card className="p-6">
          <h5 className="text-sm font-medium mb-4 text-center">Compliance</h5>
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className={`text-4xl font-bold ${getComplianceColor()}`}>
              {compliancePercentage}%
            </div>
            <div className="text-sm text-center text-muted-foreground">
              Care Plans Compliant
            </div>
            <div className="text-xs text-center text-muted-foreground">
              {totalServiceUsers - (data.overdue || 0)} compliant / {totalServiceUsers} total
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};