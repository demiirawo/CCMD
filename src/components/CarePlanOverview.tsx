import React from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useRobustCarePlans } from "@/hooks/useRobustCarePlans";
interface CarePlanOverviewProps {
  meetingDate?: Date;
  meetingId?: string;
}
export const CarePlanOverview = ({
  meetingDate,
  meetingId
}: CarePlanOverviewProps) => {
  const { profile } = useAuth();
  
  // Use robust care plans hook
  const {
    data,
    updateData,
    isLoading
  } = useRobustCarePlans({
    companyId: profile?.company_id || '',
    meetingId
  });

  const totalServiceUsers = data.highRisk + data.mediumRisk + data.lowRisk + data.naRisk;
  const compliancePercentage = totalServiceUsers > 0 ? Math.round((totalServiceUsers - data.overdue) / totalServiceUsers * 100) : 100;

  const handleInputChange = (field: keyof typeof data, value: string) => {
    // Convert to number for data storage (empty string becomes 0)
    const numValue = value === '' ? 0 : parseInt(value) || 0;
    updateData({ [field]: numValue });
  };

  const getDisplayValue = (field: keyof typeof data) => {
    return data[field] === 0 ? '' : data[field].toString();
  };
  const getComplianceColor = () => {
    if (compliancePercentage === 100) return "text-blue-600"; // Outstanding: 100%
    if (compliancePercentage >= 98) return "text-green-600"; // Good: 98-100%
    if (compliancePercentage >= 90) return "text-amber-600"; // Needs improvement: 90-97%
    return "text-red-600"; // Inadequate: Below 90%
  };

  if (isLoading) {
    return <div className="space-y-6 mt-4 p-6 border border-border rounded-lg bg-stone-50">
      <div className="animate-pulse">Loading care plan data...</div>
    </div>;
  }
  return <div className="space-y-6 mt-4 p-6 border border-border rounded-lg bg-stone-50">
      
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Service Users by Risk Level */}
        <Card className="p-6">
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="high-risk" className="text-sm font-medium">High:</Label>
              <Input id="high-risk" type="number" value={getDisplayValue('highRisk')} onChange={e => handleInputChange('highRisk', e.target.value)} min="0" className="w-20 h-8 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-stone-50" />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="medium-risk" className="text-sm font-medium">Medium:</Label>
              <Input id="medium-risk" type="number" value={getDisplayValue('mediumRisk')} onChange={e => handleInputChange('mediumRisk', e.target.value)} min="0" className="w-20 h-8 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-stone-50" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="low-risk" className="text-sm font-medium">Low:</Label>
              <Input id="low-risk" type="number" value={getDisplayValue('lowRisk')} onChange={e => handleInputChange('lowRisk', e.target.value)} min="0" className="w-20 h-8 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-stone-50" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="na-risk" className="text-sm font-medium">N/A:</Label>
              <Input id="na-risk" type="number" value={getDisplayValue('naRisk')} onChange={e => handleInputChange('naRisk', e.target.value)} min="0" className="w-20 h-8 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-stone-50" />
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
          
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="text-center">
              
            </div>
            <Input id="overdue" type="number" value={getDisplayValue('overdue')} onChange={e => handleInputChange('overdue', e.target.value)} min="0" max={totalServiceUsers} className="w-24 h-12 text-center text-lg font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none bg-stone-50" />
            <div className="text-xs text-muted-foreground text-center">
              Number overdue
            </div>
          </div>
        </Card>

        {/* Compliance Percentage */}
        <Card className="p-6">
          
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className={`text-4xl font-bold ${getComplianceColor()}`}>
              {compliancePercentage}%
            </div>
            <div className="text-sm text-center text-muted-foreground">
              Care Plans Compliant
            </div>
            <div className="text-xs text-center text-muted-foreground">
              {totalServiceUsers - data.overdue} compliant / {totalServiceUsers} total
            </div>
          </div>
        </Card>
      </div>
    </div>;
};